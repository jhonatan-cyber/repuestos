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
    try {
      final response = await _client.dio.post(
        '/auth/login',
        data: {'email': email, 'password': password, 'rememberMe': rememberMe},
      );
      final data = response.data as Map<String, dynamic>;
      final accessToken = data['accessToken'] as String?;
      final refreshToken = data['refreshToken'] as String?;
      if (accessToken == null || refreshToken == null) {
        throw Exception('Respuesta de login inválida: faltan tokens');
      }
      await _storage.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );
      return AuthUser.fromJson(data);
    } catch (e) {
      // Re-throw with full details for debugging
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _client.dio.post('/auth/logout');
    } catch (_) {
      // La sesión local también debe cerrarse cuando no hay conexión.
    } finally {
      await _storage.clear();
    }
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

  Future<String> forgotPassword(String email) async {
    final response = await _client.dio.post(
      '/auth/forgot-password',
      data: {'email': email},
    );
    final data = response.data as Map<String, dynamic>;
    final tempPassword = data['tempPassword'] as String?;
    if (tempPassword == null) {
      throw Exception('No se recibió contraseña temporal');
    }
    return tempPassword;
  }
}
