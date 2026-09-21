import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import '../models/chat_message.dart';
import 'auth_service.dart';
import 'package:audioplayers/audioplayers.dart';

typedef OnChunk = void Function(String text);
typedef OnStage = void Function(String stage);
typedef OnFinal = void Function(Map<String, dynamic> data);
typedef OnStart = void Function(Map<String, dynamic> data);

class ChatService {
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://172.21.79.210:8000',
  );
  final AuthService authService;
  final Set<String> _seenIds = {};
  String _pollAfter = DateTime.now().toUtc().toIso8601String();
  Timer? _pollTimer;

  ChatService(this.authService);

  Future<List<ChatMessage>> loadChatHistory() async {
    final token = await authService.getToken();
    final res = await http.get(
      Uri.parse('$apiUrl/chat/history'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (res.statusCode != 200) {
      throw Exception('Failed to load chat history (${res.statusCode})');
    }

    final data = jsonDecode(res.body) as Map<String, dynamic>;
    final rawMessages = (data['messages'] as List<dynamic>? ?? []);
    final messages = rawMessages.map((raw) {
      final message = raw as Map<String, dynamic>;
      final id = message['id']?.toString();
      if (id != null) _seenIds.add(id);

      return ChatMessage(
        role: message['role'] as String? ?? 'assistant',
        content: message['content'] as String? ?? '',
        agent: message['agent'] as String?,
        id: id,
      );
    }).toList();

    if (rawMessages.isNotEmpty) {
      final last = rawMessages.last as Map<String, dynamic>;
      final createdAt = last['created_at'] as String?;
      if (createdAt != null) _pollAfter = createdAt;
    }

    return messages;
  }

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

  /// Fetches TTS audio and plays it back.
  ///
  /// IMPORTANT: this plays via a temp file (DeviceFileSource), not
  /// BytesSource. On Android, BytesSource hands MediaPlayer a raw byte
  /// blob with no format hint, and MediaPlayer has to sniff the
  /// container/codec itself — this is a known source of
  /// MEDIA_ERROR_UNKNOWN / MEDIA_ERROR_SYSTEM on real devices even when
  /// the exact same bytes play fine in a browser. Writing to disk and
  /// playing via setDataSource(path) uses Android's normal, reliable path.
  /// See: https://github.com/bluefireteam/audioplayers/blob/main/troubleshooting.md
  Future<void> speakText(String text, AudioPlayer audioPlayer) async {
    File? tempFile;
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
      if (res.statusCode != 200) {
        // ignore: avoid_print
        print('speakText: /voice/speak returned ${res.statusCode}');
        return;
      }

      // Pick a real extension from the response's Content-Type so the
      // native player gets an actual format hint instead of guessing.
      final contentType = res.headers['content-type'] ?? '';
      final ext = contentType.contains('wav')
          ? 'wav'
          : contentType.contains('ogg')
              ? 'ogg'
              : contentType.contains('flac')
                  ? 'flac'
                  : 'mp3'; // sensible default for most TTS APIs
      // ignore: avoid_print
      print('speakText: content-type="$contentType" -> .$ext, '
          '${res.bodyBytes.length} bytes');

      final dir = await getTemporaryDirectory();
      tempFile =
          File('${dir.path}/tts_${DateTime.now().millisecondsSinceEpoch}.$ext');
      await tempFile.writeAsBytes(res.bodyBytes, flush: true);

      await audioPlayer.setAudioContext(
        AudioContext(
          android: AudioContextAndroid(
            isSpeakerphoneOn: true,
            stayAwake: true,
            contentType: AndroidContentType.speech,
            usageType: AndroidUsageType.media,
            audioFocus: AndroidAudioFocus.gain,
          ),
          iOS: AudioContextIOS(
            category: AVAudioSessionCategory.playback,
          ),
        ),
      );
      await audioPlayer.setVolume(1.0);

      final completer = Completer<void>();
      late final StreamSubscription sub;
      sub = audioPlayer.onPlayerComplete.listen((_) {
        sub.cancel();
        if (!completer.isCompleted) completer.complete();
      });

      await audioPlayer.play(DeviceFileSource(tempFile.path));
      await completer.future.timeout(
        const Duration(seconds: 60),
        onTimeout: () => sub.cancel(),
      );
    } catch (e) {
      // best-effort — voice playback failing shouldn't block the text
      // response, but log it so a real regression is visible in logcat.
      // ignore: avoid_print
      print('speakText failed: $e');
    } finally {
      if (tempFile != null) {
        tempFile.delete().catchError((_) => tempFile!);
      }
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
