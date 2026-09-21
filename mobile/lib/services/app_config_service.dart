import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// Fetches admin-controlled feature flags once at startup. Gate any new
/// or in-progress feature behind `isEnabled('some_key')` instead of
/// shipping it always-on -- admin can then kill-switch it from the admin
/// panel with zero app rebuild or store update.
///
/// A key with no row yet in the backend is simply absent from the
/// response, so `isEnabled()` needs an explicit default per call site:
/// use `isEnabled('new_thing', defaultValue: false)` for anything not
/// fully rolled out yet, or `defaultValue: true` for something you're
/// only just now wrapping in a flag so it doesn't regress for existing
/// users if the flag row hasn't been seeded.
class AppConfigService extends ChangeNotifier {
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://172.21.79.210:8000',
  );

  Map<String, bool> _flags = {};
  bool _loaded = false;

  bool get loaded => _loaded;

  bool isEnabled(String key, {bool defaultValue = true}) {
    return _flags[key] ?? defaultValue;
  }

  Future<void> init() async {
    try {
      final res = await http.get(Uri.parse('$apiUrl/app-config'));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        _flags = data.map((k, v) => MapEntry(k, v as bool));
      }
    } catch (_) {
      // best-effort -- every isEnabled() call falls back to its own
      // defaultValue, so a failed fetch here just means "use defaults"
      // rather than breaking the app
    } finally {
      _loaded = true;
      notifyListeners();
    }
  }
}
