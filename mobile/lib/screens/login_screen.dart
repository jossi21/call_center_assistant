import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'chat_screen.dart';

enum AuthStage { awaitingPhone, awaitingOtp }

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _authService = AuthService();
  final _inputController = TextEditingController();
  AuthStage _stage = AuthStage.awaitingPhone;
  String? _pendingPhone;
  String? _error;
  bool _loading = false;

  Future<void> _submit() async {
    final text = _inputController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      if (_stage == AuthStage.awaitingPhone) {
        final res = await _authService.requestOtp(text);
        setState(() {
          _pendingPhone = text;
          _stage = AuthStage.awaitingOtp;
          _inputController.clear();
          // Mirrors the web app's dev-mode OTP prefill
          if (res.devCode != null) _inputController.text = res.devCode!;
        });
      } else {
        await _authService.verifyOtp(_pendingPhone!, text);
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const ChatScreen()),
          );
        }
      }
    } catch (e) {
      setState(() {
        _error = "Error: $e";
      });
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isPhoneStage = _stage == AuthStage.awaitingPhone;

    return Scaffold(
      appBar: AppBar(title: const Text('Support Assistant')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              isPhoneStage
                  ? 'Please enter your phone number to get started.'
                  : "I've sent a code to $_pendingPhone. Please enter it here.",
              style: const TextStyle(fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _inputController,
              keyboardType:
                  isPhoneStage ? TextInputType.phone : TextInputType.number,
              decoration: InputDecoration(
                hintText: isPhoneStage ? '09XXXXXXXX' : 'Enter code',
                border: const OutlineInputBorder(),
              ),
              onSubmitted: (_) => _submit(),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(isPhoneStage ? 'Continue' : 'Verify'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
