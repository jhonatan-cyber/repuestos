import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Almacenamiento de tokens JWT (access + refresh).
class SecureStorage {
  SecureStorage({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;
  Future<void>? _migration;

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';

  Future<void> _ensureMigrated() async {
    final migration = _migration ??= _migrateLegacyTokens();
    try {
      await migration;
    } catch (_) {
      _migration = null;
      rethrow;
    }
  }

  Future<void> _migrateLegacyTokens() async {
    final preferences = await SharedPreferences.getInstance();
    for (final key in [_accessTokenKey, _refreshTokenKey]) {
      final legacyToken = preferences.getString(key);
      if (legacyToken == null) continue;

      final secureToken = await _storage.read(key: key);
      if (secureToken == null) {
        await _storage.write(key: key, value: legacyToken);
      }
      await preferences.remove(key);
    }
  }

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _ensureMigrated();
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  Future<String?> getAccessToken() async {
    await _ensureMigrated();
    return _storage.read(key: _accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    await _ensureMigrated();
    return _storage.read(key: _refreshTokenKey);
  }

  Future<void> clear() async {
    await _ensureMigrated();
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }
}
