import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/chat_message.dart';
import 'auth_service.dart';
import 'package:audioplayers/audioplayers.dart';

typedef OnChunk = void Function(String text);
typedef OnStage = void Function(String stage);
typedef OnFinal = void Function(Map<String, dynamic> data);
typedef OnStart = void Function(Map<String, dynamic> data);

class ChatService {
  static const String apiUrl = 'http://10.0.2.2:8000';
  final AuthService authService;
  final Set<String> _seenIds = {};
  String _pollAfter = DateTime.now().toUtc().toIso8601String();
  Timer? _pollTimer;

  ChatService(this.authService);

  Future<void> stopStream(String streamId) async {
    try {
      final token = await authService.getToken();
      await http.post(
        Uri.parse('$apiUrl/chat/stream/stop'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'stream_id': streamId}),
      );
    } catch (_) {
      // best-effort — if this fails, the stream finishes naturally
    }
  }

  /// Mirrors runSSEStream in useChat.ts — POSTs, then reads the
  /// response body as a stream of "event: X\ndata: Y\n\n" blocks.
  Future<void> _runSSEStream(
    String url,
    Map<String, dynamic> body, {
    OnStart? onStart,
    OnStage? onStage,
    OnChunk? onChunk,
    OnFinal? onFinal,
  }) async {
    final token = await authService.getToken();
    final request = http.Request('POST', Uri.parse(url))
      ..headers['Content-Type'] = 'application/json'
      ..headers['Authorization'] = 'Bearer $token'
      ..body = jsonEncode(body);

    final client = http.Client();
    try {
      final streamedResponse = await client.send(request);
      if (streamedResponse.statusCode != 200) {
        final errorBody = await streamedResponse.stream.bytesToString();
        throw Exception(
          'Chat request failed (${streamedResponse.statusCode}): $errorBody',
        );
      }

      String buffer = '';
      var finalReceived = false;

      await for (final chunk
          in streamedResponse.stream.transform(utf8.decoder)) {
        buffer += chunk;
        final parts = buffer.split('\n\n');
        buffer = parts.removeLast(); // keep the incomplete tail

        for (final part in parts) {
          final lines = part.split('\n');
          final eventLine = lines.firstWhere(
            (l) => l.startsWith('event:'),
            orElse: () => '',
          );
          final dataLine = lines.firstWhere(
            (l) => l.startsWith('data:'),
            orElse: () => '',
          );
          if (eventLine.isEmpty || dataLine.isEmpty) continue;

          final eventType = eventLine.replaceFirst('event:', '').trim();
          final data = jsonDecode(dataLine.replaceFirst('data:', '').trim());

          switch (eventType) {
            case 'start':
              onStart?.call(data);
              break;
            case 'stage':
              onStage?.call(data['stage']);
              break;
            case 'chunk':
              onChunk?.call(data['text']);
              break;
            case 'final':
              finalReceived = true;
              onFinal?.call(data);
              break;
          }
        }
      }

      if (!finalReceived) {
        throw Exception('Chat stream ended before a final response');
      }
    } finally {
      client.close();
    }
  }

  /// Mirrors streamAuthenticatedMessage in useChat.ts
  Future<void> streamMessage(
    String text, {
    OnStart? onStart,
    OnStage? onStage,
    OnChunk? onChunk,
    OnFinal? onFinal,
  }) {
    return _runSSEStream(
      '$apiUrl/chat/stream',
      {'message': text},
      onStart: onStart,
      onStage: onStage,
      onChunk: onChunk,
      onFinal: (data) {
        final messageId = data['message_id'];
        if (messageId != null) _seenIds.add(messageId.toString());
        onFinal?.call(data);
      },
    );
  }

  Future<void> speakText(String text, AudioPlayer audioPlayer) async {
    try {
      final token = await authService.getToken();
      final res = await http.post(
        Uri.parse('$apiUrl/voice/speak'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'text': text}),
      );
      if (res.statusCode != 200) return;

      final completer = Completer<void>();
      late final StreamSubscription sub;
      sub = audioPlayer.onPlayerComplete.listen((_) {
        sub.cancel();
        if (!completer.isCompleted) completer.complete();
      });

      await audioPlayer.play(BytesSource(res.bodyBytes));
      await completer.future.timeout(
        const Duration(seconds: 60),
        onTimeout: () => sub.cancel(),
      );
    } catch (_) {
      // best-effort — voice playback failing shouldn't block the text response
    }
  }

  Future<void> editMessage(String messageId, String newContent) async {
    final token = await authService.getToken();
    await http.post(
      Uri.parse('$apiUrl/chat/edit'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'message_id': messageId, 'new_content': newContent}),
    );
  }

  Future<void> regenerateMessage(
    String messageId, {
    OnStart? onStart,
    OnStage? onStage,
    OnChunk? onChunk,
    OnFinal? onFinal,
  }) {
    return _runSSEStream(
      '$apiUrl/chat/regenerate/stream',
      {'message_id': messageId},
      onStart: onStart,
      onStage: onStage,
      onChunk: onChunk,
      onFinal: onFinal,
    );
  }

  Future<void> continueMessage(
    String messageId, {
    OnStart? onStart,
    OnChunk? onChunk,
    OnFinal? onFinal,
  }) {
    return _runSSEStream(
      '$apiUrl/chat/continue/stream',
      {'message_id': messageId},
      onStart: onStart,
      onChunk: onChunk,
      onFinal: onFinal,
    );
  }

  /// Mirrors the polling useEffect in useChat.ts — picks up async
  /// human staff replies that never arrive via the SSE stream.
  void startPolling(void Function(List<ChatMessage>) onNewMessages) {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) async {
      try {
        final token = await authService.getToken();
        final res = await http.get(
          Uri.parse(
              '$apiUrl/chat/messages?after=${Uri.encodeComponent(_pollAfter)}'),
          headers: {'Authorization': 'Bearer $token'},
        );
        if (res.statusCode != 200) return;

        final data = jsonDecode(res.body);
        final List messages = data['messages'] ?? [];
        if (messages.isEmpty) return;

        final fresh =
            messages.where((m) => !_seenIds.contains(m['id'])).toList();
        if (fresh.isEmpty) return;

        for (final m in fresh) {
          _seenIds.add(m['id']);
        }
        _pollAfter = messages.last['created_at'];

        onNewMessages(
          fresh
              .map((m) => ChatMessage(
                    role: 'assistant',
                    content: m['content'],
                    id: m['id'],
                    agent: m['agent_name'],
                    isStaff: m['is_staff'],
                  ))
              .toList(),
        );
      } catch (_) {
        // best-effort — a missed poll just gets caught by the next one
      }
    });
  }

  void stopPolling() {
    _pollTimer?.cancel();
  }

  void resetPollCursor() {
    _pollAfter = DateTime.now().toUtc().toIso8601String();
    _seenIds.clear();
  }
}
