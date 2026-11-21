
import '../../../core/network/dio_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/utils/jwt.dart';
import 'auth_models.dart';

class AuthRepository {
  AuthRepository(this._client, this._storage);

  final DioClient _client;
  final SecureStorage _storage;

  Future<AuthUser> login({
    required String email,
    required String password,
    bool rememberMe = false,
  }) async {
    final response = await _client.dio.post(
      '/auth/login',
      data: {
        'email': email,
        'password': password,
        'rememberMe': rememberMe,
      },
    );
    final data = response.data as Map<String, dynamic>;
    final accessToken = data['accessToken'] as String?;
    final refreshToken = data['refreshToken'] as String?;
    if (accessToken == null || refreshToken == null) {
      throw Exception('Respuesta de login inválida');
    }
    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
    return AuthUser.fromJson(data);
  }

  Future<void> logout() async {
    await _storage.clear();
  }

  Future<AuthUser?> restoreSession() async {
    final token = await _storage.getAccessToken();
    if (token == null || token.isEmpty) return null;
    final payload = decodeJwtPayload(token);
    if (payload == null) return null;
    return AuthUser(
      id: payload['sub']?.toString() ?? '',
      email: payload['email']?.toString() ?? '',
      name: payload['email']?.toString() ?? '',
      role: payload['role']?.toString() ?? '',
      permissions: (payload['permissions'] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toList(),
    );
  }
}
