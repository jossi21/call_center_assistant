import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class RequestOtpResponse {
  final String message;
  final String? devCode;

  RequestOtpResponse({required this.message, this.devCode});

  factory RequestOtpResponse.fromJson(Map<String, dynamic> json) {
    return RequestOtpResponse(
      message: json['message'],
      devCode: json['dev_code'],
    );
  }
}

class VerifyOtpResponse {
  final String accessToken;
  final String preferredLanguage;
  final bool isAdmin;
  final bool isStaff;

  VerifyOtpResponse({
    required this.accessToken,
    required this.preferredLanguage,
    required this.isAdmin,
    required this.isStaff,
  });

  factory VerifyOtpResponse.fromJson(Map<String, dynamic> json) {
    return VerifyOtpResponse(
      accessToken: json['access_token'],
      preferredLanguage: json['preferred_language'],
      isAdmin: json['is_admin'],
      isStaff: json['is_staff'],
    );
  }
}

class AuthService {
  static const String apiUrl =
      'http://10.0.2.2:8000'; // swap for your deployed URL
  final _storage = const FlutterSecureStorage();

  Future<RequestOtpResponse> requestOtp(String phoneNumber) async {
    final res = await http.post(
      Uri.parse('$apiUrl/auth/request-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone_number': phoneNumber}),
    );
    if (res.statusCode != 200) {
      throw Exception('Failed to request OTP');
    }
    return RequestOtpResponse.fromJson(jsonDecode(res.body));
  }

  Future<VerifyOtpResponse> verifyOtp(String phoneNumber, String code) async {
    final res = await http.post(
      Uri.parse('$apiUrl/auth/verify-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone_number': phoneNumber, 'code': code}),
    );
    if (res.statusCode != 200) {
      throw Exception('Invalid or expired code');
    }
    final result = VerifyOtpResponse.fromJson(jsonDecode(res.body));

    await _storage.write(key: 'access_token', value: result.accessToken);
    await _storage.write(key: 'phone_number', value: phoneNumber);
    await _storage.write(
        key: 'preferred_language', value: result.preferredLanguage);
    await _storage.write(key: 'is_admin', value: result.isAdmin.toString());
    await _storage.write(key: 'is_staff', value: result.isStaff.toString());

    return result;
  }

  Future<String?> getToken() => _storage.read(key: 'access_token');
  Future<String?> getPhone() => _storage.read(key: 'phone_number');

  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> logout() async {
    await _storage.deleteAll();
  }
}
