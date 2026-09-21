import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'services/auth_service.dart';
import 'services/locale_service.dart';
import 'services/app_config_service.dart';
import 'screens/login_screen.dart';
import 'screens/chat_screen.dart';

void main() {
  runApp(const CallCenterApp());
}

class CallCenterApp extends StatelessWidget {
  const CallCenterApp({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = AuthService();

    return MultiProvider(
      providers: [
        Provider<AuthService>.value(
          value: authService,
        ),
        ChangeNotifierProvider<LocaleService>(
          create: (_) => LocaleService(authService),
        ),
        ChangeNotifierProvider<AppConfigService>(
            create: (_) => AppConfigService())
      ],
      child: MaterialApp(
        title: 'Call Center Assistant',
        theme: ThemeData(
          primarySwatch: Colors.indigo,
          useMaterial3: true,
        ),
        home: const AuthGate(),
      ),
    );
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  late final AuthService _authService;

  bool _checked = false;
  bool _loggedIn = false;

  @override
  void initState() {
    super.initState();

    _authService = context.read<AuthService>();

    _initialize();
  }

  Future<void> _initialize() async {
    final localeService = context.read<LocaleService>();
    final appConfigService = context.read<AppConfigService>();

    await Future.wait([
      localeService.init(),
      appConfigService.init(),
    ]);

    final loggedIn = await _authService.isLoggedIn();

    if (!mounted) return;

    setState(() {
      _loggedIn = loggedIn;
      _checked = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_checked) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return _loggedIn ? const ChatScreen() : const LoginScreen();
  }
}
