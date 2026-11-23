import 'package:dio/dio.dart';

import '../config/env.dart';
import '../storage/secure_storage.dart';

/// Cliente HTTP con interceptor de autenticación (Bearer) y refresh automático.
class DioClient {
  DioClient(this._storage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: Env.apiBase,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Skip adding auth header for public endpoints
          if (options.path.contains('/auth/login') ||
              options.path.contains('/auth/forgot-password') ||
              options.path.contains('/auth/refresh') ||
              options.path.contains('/auth/setup')) {
            handler.next(options);
            return;
          }
          final token = await _storage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final status = error.response?.statusCode;
          final isRefreshCall =
              error.requestOptions.path.endsWith('/auth/refresh');
          if (status == 401 && !isRefreshCall) {
            final refreshed = await _tryRefresh();
            if (refreshed) {
              final newToken = await _storage.getAccessToken();
              final retryOptions = error.requestOptions;
              retryOptions.headers['Authorization'] = 'Bearer $newToken';
              final response = await _dio.fetch(retryOptions);
              return handler.resolve(response);
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  late final Dio _dio;
  final SecureStorage _storage;

  Dio get dio => _dio;

  Future<bool> _tryRefresh() async {
    final refreshToken = await _storage.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return false;
    try {
      final response = await _dio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
        options: Options(headers: {'Authorization': 'Bearer $refreshToken'}),
      );
      final data = response.data as Map<String, dynamic>;
      final newAccess = data['accessToken'] as String?;
      final newRefresh = data['refreshToken'] as String?;
      if (newAccess == null) return false;
      await _storage.saveTokens(
        accessToken: newAccess,
        refreshToken: newRefresh ?? refreshToken,
      );
      return true;
    } catch (_) {
      await _storage.clear();
      return false;
    }
  }
}
