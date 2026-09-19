import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:audioplayers/audioplayers.dart';
import '../models/chat_message.dart';
import '../services/auth_service.dart';
import '../services/chat_service.dart';
import 'login_screen.dart';
import 'voice_mode_screen.dart';
import '../widgets/table_card_builder.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _authService = AuthService();
  late final ChatService _chatService;
  final List<ChatMessage> _messages = [];
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _inputController = TextEditingController();
  bool _loading = false;
  String? _streamStage;
  String _streamingText = '';
  String? _currentStreamId;

  String? _editingId;
  final TextEditingController _editController = TextEditingController();

  final stt.SpeechToText _speech = stt.SpeechToText();
  final AudioPlayer _audioPlayer = AudioPlayer();

  @override
  void initState() {
    super.initState();
    _chatService = ChatService(_authService);
    _initializeChat();
  }

  Future<void> _initializeChat() async {
    try {
      final history = await _chatService.loadChatHistory();
      if (!mounted) return;
      setState(() {
        _messages.addAll(history);
        if (_messages.isEmpty) {
          _messages.add(ChatMessage(
            role: 'assistant',
            content: 'Hi! Please enter your phone number to get started.',
          ));
        }
      });
      _scrollToBottom();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _messages.add(ChatMessage(
          role: 'assistant',
          content: 'Hi! Please enter your phone number to get started.',
        ));
      });
      _scrollToBottom();
    }

    if (!mounted) return;
    _chatService.startPolling((newMessages) {
      if (!mounted) return;
      setState(() => _messages.addAll(newMessages));
      _scrollToBottom();
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _logout() async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log out?'),
        content:
            const Text('You will need to verify your phone again to log in.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Log out'),
          ),
        ],
      ),
    );
    if (shouldLogout != true || !mounted) return;

    await _authService.logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  void _stopStreaming() {
    final streamId = _currentStreamId;
    if (streamId == null) return;
    _chatService.stopStream(streamId);
    setState(() => _currentStreamId = null);
  }

  @override
  void dispose() {
    _chatService.stopPolling();
    _speech.stop();
    _audioPlayer.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _inputController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add(ChatMessage(role: 'user', content: text));
      _loading = true;
      _streamStage = 'thinking';
      _streamingText = '';
    });
    _scrollToBottom();
    _inputController.clear();

    await _chatService.streamMessage(
      text,
      onStart: (data) => setState(() => _currentStreamId = data['stream_id']),
      onStage: (stage) => setState(() => _streamStage = stage),
      onChunk: (chunk) => setState(() => _streamingText += chunk),
      onFinal: (data) {
        setState(() {
          _streamStage = null;
          _streamingText = '';
          _loading = false;
          _currentStreamId = null;
          final answer = data['answer'] as String?;
          if (answer != null && answer.isNotEmpty) {
            _messages.add(ChatMessage(
              role: 'assistant',
              content: answer,
              agent: data['agent'],
              id: data['message_id']?.toString(),
              interrupted: data['interrupted'],
            ));
          }
        });
        _scrollToBottom();
      },
    );
  }

  Future<void> _openVoiceMode() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => VoiceModeScreen(
          chatService: _chatService,
          onExchangeComplete: (userMsg, assistantMsg) {
            setState(() {
              _messages.add(userMsg);
              _messages.add(assistantMsg);
            });
            _scrollToBottom();
          },
        ),
      ),
    );
  }

  void _copyMessage(String content) {
    Clipboard.setData(ClipboardData(text: content));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Copied'), duration: Duration(seconds: 1)),
    );
  }

  Future<void> _pasteText() async {
    final clipboard = await Clipboard.getData(Clipboard.kTextPlain);
    final text = clipboard?.text;
    if (text == null || text.isEmpty || !mounted) return;

    final selection = _inputController.selection;
    final start = selection.isValid && selection.start >= 0
        ? selection.start
        : _inputController.text.length;
    final end =
        selection.isValid && selection.end >= start ? selection.end : start;
    final value = _inputController.text.replaceRange(start, end, text);
    _inputController.value = TextEditingValue(
      text: value,
      selection: TextSelection.collapsed(offset: start + text.length),
    );
  }

  void _startEdit(ChatMessage msg) {
    setState(() {
      _editingId = msg.id;
      _editController.text = msg.content;
    });
  }

  Future<void> _saveEdit(String messageId) async {
    final newContent = _editController.text.trim();
    if (newContent.isEmpty) return;

    setState(() => _editingId = null);

    await _chatService.editMessage(messageId, newContent);

    setState(() {
      final idx = _messages.indexWhere((m) => m.id == messageId);
      if (idx != -1) {
        _messages.removeRange(idx, _messages.length);
      }
    });

    _inputController.text = newContent;
    await _sendMessage();
  }

  Future<void> _regenerateMessage(String messageId) async {
    setState(() {
      _messages.removeWhere((m) => m.id == messageId);
      _loading = true;
      _streamStage = 'thinking';
      _streamingText = '';
    });

    await _chatService.regenerateMessage(
      messageId,
      onStart: (data) => setState(() => _currentStreamId = data['stream_id']),
      onStage: (stage) => setState(() => _streamStage = stage),
      onChunk: (chunk) => setState(() => _streamingText += chunk),
      onFinal: (data) {
        setState(() {
          _streamStage = null;
          _streamingText = '';
          _loading = false;
          _currentStreamId = null;
          _messages.add(ChatMessage(
            role: 'assistant',
            content: data['answer'] ?? '',
            agent: data['agent'],
            id: data['message_id']?.toString(),
            interrupted: data['interrupted'],
          ));
        });
        _scrollToBottom();
      },
    );
  }

  Future<void> _continueMessage(String messageId) async {
    await _chatService.continueMessage(
      messageId,
      onStart: (data) => setState(() => _currentStreamId = data['stream_id']),
      onChunk: (chunk) {
        setState(() {
          final idx = _messages.indexWhere((m) => m.id == messageId);
          if (idx != -1) {
            _messages[idx] = ChatMessage(
              role: 'assistant',
              content: _messages[idx].content + chunk,
              agent: _messages[idx].agent,
              id: _messages[idx].id,
              interrupted: _messages[idx].interrupted,
            );
          }
        });
        _scrollToBottom();
      },
      onFinal: (data) {
        setState(() {
          _currentStreamId = null;
          final idx = _messages.indexWhere((m) => m.id == messageId);
          if (idx != -1) {
            _messages[idx] = ChatMessage(
              role: 'assistant',
              content: data['answer'] ?? _messages[idx].content,
              agent: _messages[idx].agent,
              id: _messages[idx].id,
              interrupted: data['interrupted'],
            );
          }
        });
        _scrollToBottom();
      },
    );
  }

  Widget _buildActionRow(ChatMessage msg, bool isLast) {
    final isUser = msg.role == 'user';
    final icons = <Widget>[
      _actionIcon(Icons.copy_outlined, () => _copyMessage(msg.content)),
    ];

    if (isUser && msg.id != null) {
      icons.add(_actionIcon(Icons.edit_outlined, () => _startEdit(msg)));
    }

    if (!isUser && msg.interrupted == true && msg.id != null) {
      icons.add(_actionIcon(
          Icons.play_circle_outline, () => _continueMessage(msg.id!)));
    }

    if (!isUser && isLast && msg.id != null && msg.isStaff != true) {
      icons.add(_actionIcon(Icons.refresh, () => _regenerateMessage(msg.id!)));
    }

    return Padding(
      padding: const EdgeInsets.only(top: 2, left: 4, right: 4),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: icons,
      ),
    );
  }

  Widget _actionIcon(IconData icon, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: GestureDetector(
        onTap: onTap,
        child: Icon(icon, size: 15, color: const Color(0xFFA1A1AA)),
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg, bool isLast) {
    final isUser = msg.role == 'user';
    final showTag = !isUser && (msg.agent != null || msg.isStaff == true);
    final isEditing = _editingId != null && _editingId == msg.id;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Column(
        crossAxisAlignment:
            isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          if (showTag)
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 4),
              child: Row(
                children: [
                  if (msg.isStaff == true)
                    const Padding(
                      padding: EdgeInsets.only(right: 4),
                      child: Icon(Icons.person,
                          size: 12, color: Color(0xFF4F46E5)),
                    ),
                  Text(
                    msg.isStaff == true
                        ? (msg.agent ?? 'Human agent')
                        : (msg.agent ?? ''),
                    style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF4F46E5)),
                  ),
                ],
              ),
            ),
          ConstrainedBox(
            constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.78),
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 2),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isUser ? const Color(0xFF6366F1) : Colors.grey[200],
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(isUser ? 18 : 6),
                  bottomRight: Radius.circular(isUser ? 6 : 18),
                ),
              ),
              child: isEditing
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextField(
                          controller: _editController,
                          maxLines: null,
                          style: const TextStyle(
                              color: Colors.white, fontSize: 14),
                          decoration: const InputDecoration(
                              border: InputBorder.none, isDense: true),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton(
                              onPressed: () =>
                                  setState(() => _editingId = null),
                              child: const Text('Cancel',
                                  style: TextStyle(
                                      color: Colors.white70, fontSize: 12)),
                            ),
                            TextButton(
                              onPressed: () => _saveEdit(msg.id!),
                              child: const Text('Save & resend',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      ],
                    )
                  : isUser
                      ? Text(msg.content,
                          style: const TextStyle(
                              color: Colors.white, fontSize: 14))
                      : _buildMarkdown(msg.content),
            ),
          ),
          if (!isEditing) _buildActionRow(msg, isLast),
        ],
      ),
    );
  }

  Widget _buildMarkdown(String content) {
    final styleSheet = MarkdownStyleSheet(
      p: const TextStyle(color: Colors.black87, fontSize: 14, height: 1.4),
      strong: const TextStyle(
          color: Colors.black87, fontSize: 14, fontWeight: FontWeight.bold),
      em: const TextStyle(
          color: Colors.black87, fontSize: 14, fontStyle: FontStyle.italic),
      listBullet: const TextStyle(color: Colors.black87, fontSize: 14),
      h1: const TextStyle(
          color: Colors.black87, fontSize: 20, fontWeight: FontWeight.bold),
      h2: const TextStyle(
          color: Colors.black87, fontSize: 17, fontWeight: FontWeight.bold),
      h3: const TextStyle(
          color: Colors.black87, fontSize: 15, fontWeight: FontWeight.bold),
      code: TextStyle(
          backgroundColor: Colors.grey[300],
          color: const Color(0xFF4F46E5),
          fontSize: 12),
      blockquote:
          const TextStyle(color: Colors.black54, fontStyle: FontStyle.italic),
      blockquoteDecoration: const BoxDecoration(
        border: Border(left: BorderSide(color: Color(0xFF6366F1), width: 3)),
      ),
      a: const TextStyle(
          color: Color(0xFF4F46E5), decoration: TextDecoration.underline),
    );
    return MarkdownWithCards(
      content: content,
      styleSheet: styleSheet,
    );
  }

  String _stripMarkdownSyntax(String text) {
    return text
        .replaceAll(RegExp(r'\*\*(.*?)\*\*'), r'$1')
        .replaceAll(RegExp(r'\*(.*?)\*'), r'$1')
        .replaceAll(RegExp(r'^#{1,6}\s+', multiLine: true), '')
        .replaceAll(RegExp(r'^\|.*\|$', multiLine: true), '')
        .replaceAll(RegExp(r'^[-:| ]+$', multiLine: true), '')
        .replaceAll(RegExp(r'^[-*]\s+', multiLine: true), '• ')
        .trim();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        title: const Text('Support Assistant'),
        actions: [
          IconButton(
            tooltip: 'Log out',
            onPressed: _logout,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length + (_streamStage != null ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == _messages.length) {
                    return Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                            color: Colors.grey[200],
                            borderRadius: BorderRadius.circular(18)),
                        child: _streamingText.isNotEmpty
                            ? Text(_stripMarkdownSyntax(_streamingText),
                                style: const TextStyle(
                                    color: Colors.black87,
                                    fontSize: 14,
                                    height: 1.4))
                            : Text(
                                _streamStage == 'thinking'
                                    ? 'Thinking…'
                                    : _streamStage == 'validating'
                                        ? 'Validating…'
                                        : 'Generating a response…',
                                style: const TextStyle(
                                    fontStyle: FontStyle.italic,
                                    color: Colors.black54),
                              ),
                      ),
                    );
                  }
                  final isLastAssistant = index == _messages.length - 1 &&
                      _messages[index].role == 'assistant';
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child:
                        _buildMessageBubble(_messages[index], isLastAssistant),
                  );
                },
              ),
            ),
            _buildInputBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildInputBar() {
    final isStreaming = _currentStreamId != null;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFF1F1F4), width: 1)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFFE4E4E7)),
                borderRadius: BorderRadius.circular(999),
              ),
              child: TextField(
                controller: _inputController,
                enabled: !_loading,
                textInputAction: TextInputAction.send,
                decoration: const InputDecoration(
                  hintText: 'Ask something...',
                  hintStyle: TextStyle(color: Color(0xFFA1A1AA)),
                  border: InputBorder.none,
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
                style: const TextStyle(fontSize: 14, color: Colors.black87),
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
          ),
          const SizedBox(width: 8),
          _circleButton(
            onTap: _loading ? null : _pasteText,
            background: const Color(0xFFF4F4F5),
            icon: const Icon(Icons.content_paste,
                size: 18, color: Color(0xFF52525B)),
          ),
          const SizedBox(width: 8),
          _circleButton(
            onTap: _openVoiceMode,
            background: const Color(0xFFF4F4F5),
            icon: const Icon(Icons.mic, size: 18, color: Color(0xFF52525B)),
          ),
          const SizedBox(width: 8),
          if (isStreaming)
            _circleButton(
              onTap: _stopStreaming,
              background: const Color(0xFF27272A),
              icon: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(2))),
            )
          else
            _circleButton(
              onTap: _loading ? null : _sendMessage,
              background: const Color(0xFF6366F1),
              icon:
                  const Icon(Icons.arrow_upward, size: 18, color: Colors.white),
            ),
        ],
      ),
    );
  }

  Widget _circleButton(
      {required VoidCallback? onTap,
      required Color background,
      required Widget icon}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(color: background, shape: BoxShape.circle),
        alignment: Alignment.center,
        child: icon,
      ),
    );
  }
}
