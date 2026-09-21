import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class AppLanguage {
  final String code;
  final String name;
  AppLanguage({required this.code, required this.name});

  factory AppLanguage.fromJson(Map<String, dynamic> json) =>
      AppLanguage(code: json['code'] as String, name: json['name'] as String);
}

/// Drives app-wide UI localization. Strings are fetched from the backend
/// at runtime -- not bundled .arb files -- so an admin can add a brand-new
/// language and it just works the next time the app fetches strings for
/// that code, with no app rebuild or store update required.
///
/// Register this above MaterialApp with ChangeNotifierProvider, call
/// `await localeService.init()` once (e.g. in a small splash/loading step)
/// before showing the first real screen, then use `context.watch<LocaleService>()`
/// wherever UI text needs to react to language changes, or `context.read<...>()`
/// for one-off lookups (snackbars, dialogs) that don't need to rebuild.
class LocaleService extends ChangeNotifier {
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://172.21.79.210:8000',
  );
  static const _storageKey = 'app_language_code';

  final AuthService authService;
  final _storage = const FlutterSecureStorage();

  String _languageCode = 'en';
  Map<String, String> _strings = {};
  List<AppLanguage> _availableLanguages = [];
  bool _loading = false;

  LocaleService(this.authService);

  String get languageCode => _languageCode;
  List<AppLanguage> get availableLanguages => _availableLanguages;
  bool get loading => _loading;

  /// Looks up a UI string by key. Falls back to the key itself if it's
  /// missing even after the backend's own English fallback -- a missing
  /// translation should be visibly obvious, not a blank label.
  String t(String key) => _strings[key] ?? key;

  Future<void> init() async {
    final saved = await _storage.read(key: _storageKey);
    _languageCode = saved ?? 'en';
    await Future.wait([
      _loadAvailableLanguages(),
      _loadStrings(_languageCode),
    ]);
  }

  Future<void> _loadAvailableLanguages() async {
    try {
      final res = await http.get(Uri.parse('$apiUrl/languages'));
      if (res.statusCode != 200) return;
      final List data = jsonDecode(res.body);
      _availableLanguages = data
          .map((e) => AppLanguage.fromJson(e as Map<String, dynamic>))
          .toList();
      notifyListeners();
    } catch (_) {
      // best-effort -- if this fails, the language picker just stays empty
      // and the app continues in whatever language was already loaded
    }
  }

  Future<void> _loadStrings(String code) async {
    _loading = true;
    notifyListeners();
    try {
      final res = await http.get(
        Uri.parse('$apiUrl/ui-strings?language_code=$code'),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        final Map<String, dynamic> raw =
            (data['strings'] as Map<String, dynamic>?) ?? {};
        _strings = raw.map((k, v) => MapEntry(k, v.toString()));
      }
    } catch (_) {
      // best-effort -- keep whatever strings were already loaded; t() still
      // falls back to the raw key for anything genuinely missing
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// Switches the app's UI language AND the profile language used for
  /// chat replies and voice, so the whole experience moves together.
  Future<void> setLanguage(String code) async {
    if (code == _languageCode) return;
    _languageCode = code;
    await _storage.write(key: _storageKey, value: code);
    notifyListeners(); // reflect the switch immediately with cached/fallback strings

    await _loadStrings(code);
    await _syncProfileLanguage(code);
  }

  Future<void> _syncProfileLanguage(String code) async {
    try {
      final token = await authService.getToken();
      if (token == null || token.isEmpty) {
        return;
      }
      await http.patch(
        Uri.parse('$apiUrl/profile/language'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'language_code': code}),
      );
    } catch (_) {
      // best-effort -- UI language still switches even if this sync fails;
      // chat/voice keep using the old language_code until the next retry
    }
  }
}
