import 'dart:async';
import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:audioplayers/audioplayers.dart';
import '../models/chat_message.dart';
import '../services/chat_service.dart';
import 'package:provider/provider.dart';
import '../services/locale_service.dart';
import '../widgets/language_picker_sheet.dart';

enum VoiceState { listening, thinking, speaking, idle, error }

class VoiceModeScreen extends StatefulWidget {
  final ChatService chatService;
  final void Function(ChatMessage userMessage, ChatMessage assistantMessage)
      onExchangeComplete;

  const VoiceModeScreen({
    super.key,
    required this.chatService,
    required this.onExchangeComplete,
  });

  @override
  State<VoiceModeScreen> createState() => _VoiceModeScreenState();
}

class _VoiceModeScreenState extends State<VoiceModeScreen>
    with SingleTickerProviderStateMixin {
  final stt.SpeechToText _speech = stt.SpeechToText();
  final AudioPlayer _audioPlayer = AudioPlayer();

  VoiceState _state = VoiceState.idle;
  String _partialText = '';
  String? _statusMessage;
  bool _active = true;
  bool _speechReady = false;
  bool _handlingSpeechEnd = false;
  Timer? _speechEndTimer;

  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _init();
  }

  Future<void> _init() async {
    final available = await _speech.initialize(
      onStatus: _onSpeechStatus,
      onError: (error) {
        if (!_active) return;
        _speechEndTimer?.cancel();
        _handlingSpeechEnd = false;
        final errorCode = error.errorMsg.toLowerCase();
        final isSilence = errorCode.contains('no_match') ||
            errorCode.contains('speech_timeout') ||
            errorCode.contains('timeout');
        if (isSilence) {
          _restartAfterSilence();
          return;
        }
        if (!mounted) return;
        setState(() {
          _state = VoiceState.error;
          _statusMessage = error.errorMsg.isEmpty
              ? 'Microphone error - tap to retry'
              : 'Microphone: ${error.errorMsg}';
        });
      },
    );
    if (!mounted) return;
    setState(() => _speechReady = available);
    if (available) {
      _startListening();
    } else {
      setState(() {
        _state = VoiceState.error;
        _statusMessage = 'Speech recognition unavailable on this device';
      });
    }
  }

  Future<void> _restartAfterSilence() async {
    if (!_active) return;
    if (mounted) {
      setState(() {
        _state = VoiceState.idle;
        _partialText = '';
        _statusMessage = 'Listening...';
      });
    }
    await Future.delayed(const Duration(milliseconds: 400));
    if (_active) await _startListening();
  }

  void _onSpeechStatus(String status) {
    if (!_active) return;
    if (status == 'listening' && mounted) {
      setState(() => _state = VoiceState.listening);
    } else if ((status == 'done' || status == 'notListening') &&
        _state == VoiceState.listening) {
      _scheduleSpeechEnd();
    }
  }

  void _scheduleSpeechEnd() {
    _speechEndTimer?.cancel();
    _speechEndTimer = Timer(const Duration(milliseconds: 700), () {
      _handleSpeechEnd();
    });
  }

  Future<void> _startListening() async {
    if (!_active || !_speechReady) return;
    _speechEndTimer?.cancel();
    _handlingSpeechEnd = false;
    setState(() {
      _state = VoiceState.listening;
      _partialText = '';
      _statusMessage = null;
    });
    try {
      await _speech.listen(
        onResult: (result) {
          if (!mounted) return;
          setState(() => _partialText = result.recognizedWords);
          if (result.finalResult) _scheduleSpeechEnd();
        },
        listenOptions: stt.SpeechListenOptions(
          listenFor: const Duration(seconds: 30),
          pauseFor: const Duration(seconds: 3),
          localeId: 'en_US',
          partialResults: true,
        ),
      );
    } catch (_) {
      if (!mounted || !_active) return;
      setState(() {
        _state = VoiceState.error;
        _statusMessage = context.read<LocaleService>().t('voice.mic_error');
      });
    }
  }

  Future<void> _handleSpeechEnd() async {
    if (!_active || _handlingSpeechEnd) return;
    _handlingSpeechEnd = true;
    final text = _partialText.trim();

    if (text.isEmpty) {
      if (mounted)
        setState(() {
          _state = VoiceState.idle;
          _statusMessage =
              context.read<LocaleService>().t('voice.no_match_retry');
        });
      await Future.delayed(const Duration(milliseconds: 900));
      if (_active) await _startListening();
      return;
    }

    if (mounted)
      setState(() {
        _state = VoiceState.thinking;
        _statusMessage = null;
      });

    String finalAnswer = '';
    String? finalAgent;
    String? finalId;

    try {
      await widget.chatService.streamMessage(
        text,
        onFinal: (data) {
          finalAnswer = data['answer'] ?? '';
          finalAgent = data['agent'];
          finalId = data['message_id']?.toString();
        },
      );
    } catch (_) {
      if (!mounted || !_active) return;
      setState(() {
        _state = VoiceState.error;
        _statusMessage = 'Could not reach the assistant - tap to retry';
      });
      _handlingSpeechEnd = false;
      return;
    }

    if (!_active) return;

    widget.onExchangeComplete(
      ChatMessage(role: 'user', content: text),
      ChatMessage(
        role: 'assistant',
        content: finalAnswer,
        agent: finalAgent,
        id: finalId,
      ),
    );

    if (finalAnswer.trim().isEmpty) {
      if (_active) await _startListening();
      return;
    }

    if (mounted) setState(() => _state = VoiceState.speaking);
    await widget.chatService.speakText(finalAnswer, _audioPlayer);

    if (_active) await _startListening();
  }

  Future<void> _onOrbTap() async {
    switch (_state) {
      case VoiceState.listening:
        await _speech.stop(); // triggers _handleSpeechEnd via onStatus
        break;
      case VoiceState.speaking:
        await _audioPlayer.stop();
        if (_active) _startListening();
        break;
      case VoiceState.error:
        _init();
        break;
      default:
        break;
    }
  }

  Future<void> _close() async {
    _active = false;
    _speechEndTimer?.cancel();
    await _speech.stop();
    await _audioPlayer.stop();
    if (mounted) Navigator.of(context).pop();
  }

  @override
  void dispose() {
    _active = false;
    _speechEndTimer?.cancel();
    _pulseController.dispose();
    _speech.stop();
    _audioPlayer.dispose();
    super.dispose();
  }

  Color get _orbColor {
    switch (_state) {
      case VoiceState.listening:
        return const Color(0xFF6366F1);
      case VoiceState.thinking:
        return const Color(0xFFA1A1AA);
      case VoiceState.speaking:
        return const Color(0xFF22C55E);
      case VoiceState.error:
        return const Color(0xFFEF4444);
      case VoiceState.idle:
        return const Color(0xFF6366F1);
    }
  }

  String get _label {
    final loc = context.watch<LocaleService>();
    switch (_state) {
      case VoiceState.listening:
        return _partialText.isNotEmpty
            ? _partialText
            : loc.t('voice.listening');
      case VoiceState.thinking:
        return loc.t('voice.thinking');
      case VoiceState.speaking:
        return loc.t('voice.speaking_interrupt');
      case VoiceState.error:
        return _statusMessage ?? loc.t('voice.generic_error');
      case VoiceState.idle:
        return _statusMessage ?? loc.t('voice.starting');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0B12),
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 28),
                onPressed: _close,
              ),
            ),
            Expanded(
              child: Center(
                child: GestureDetector(
                  onTap: _onOrbTap,
                  child: AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, child) {
                      final scale = _state == VoiceState.listening
                          ? 1.0 + (_pulseController.value * 0.15)
                          : _state == VoiceState.thinking
                              ? 1.0 + (_pulseController.value * 0.05)
                              : 1.0;
                      return Transform.scale(scale: scale, child: child);
                    },
                    child: Container(
                      width: 160,
                      height: 160,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _orbColor.withValues(alpha: 0.25),
                        boxShadow: [
                          BoxShadow(
                            color: _orbColor.withValues(alpha: 0.4),
                            blurRadius: 40,
                            spreadRadius: 10,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                              shape: BoxShape.circle, color: _orbColor),
                          child: _state == VoiceState.thinking
                              ? const Padding(
                                  padding: EdgeInsets.all(28),
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 3,
                                  ),
                                )
                              : Icon(
                                  _state == VoiceState.speaking
                                      ? Icons.volume_up
                                      : _state == VoiceState.error
                                          ? Icons.mic_off
                                          : Icons.mic,
                                  color: Colors.white,
                                  size: 40,
                                ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 48, left: 24, right: 24),
              child: Text(
                _label,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
