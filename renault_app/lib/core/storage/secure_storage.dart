import 'package:shared_preferences/shared_preferences.dart';

/// Almacenamiento de tokens JWT (access + refresh).
class SecureStorage {
  SharedPreferences? _prefs;

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';

  Future<void> _init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _init();
    await _prefs!.setString(_accessTokenKey, accessToken);
    await _prefs!.setString(_refreshTokenKey, refreshToken);
  }

  Future<String?> getAccessToken() async {
    await _init();
    return _prefs!.getString(_accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    await _init();
    return _prefs!.getString(_refreshTokenKey);
  }

  Future<void> clear() async {
    await _init();
    await _prefs!.remove(_accessTokenKey);
    await _prefs!.remove(_refreshTokenKey);
  }
}
