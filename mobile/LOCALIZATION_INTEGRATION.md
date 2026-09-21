import 'package:provider/provider.dart';
import 'services/auth_service.dart';
import 'services/locale_service.dart';

void main() {
  runApp(const AppRoot());
}

class AppRoot extends StatelessWidget {
  const AppRoot({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = AuthService();
    return MultiProvider(
      providers: [
        Provider<AuthService>.value(value: authService),
        ChangeNotifierProvider(create: (_) => LocaleService(authService)),
      ],
      child: MaterialApp(
        home: const _StartupGate(),
      ),
    );
  }
}

/// Loads UI strings before showing ChatScreen, so the very first frame
/// (including the phone-number prompt) is already in the right language.
class _StartupGate extends StatefulWidget {
  const _StartupGate();

  @override
  State<_StartupGate> createState() => _StartupGateState();
}

class _StartupGateState extends State<_StartupGate> {
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    context.read<LocaleService>().init().then((_) {
      if (mounted) setState(() => _ready = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return const ChatScreen(); // your existing chat screen
  }
}