import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:renault_app/core/storage/secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late _MockFlutterSecureStorage platformStorage;
  late Map<String, String> secureTokens;

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    platformStorage = _MockFlutterSecureStorage();
    secureTokens = {};

    when(() => platformStorage.read(key: any(named: 'key'))).thenAnswer(
      (invocation) async =>
          secureTokens[invocation.namedArguments[#key] as String],
    );
    when(
      () => platformStorage.write(
        key: any(named: 'key'),
        value: any(named: 'value'),
      ),
    ).thenAnswer((invocation) async {
      final key = invocation.namedArguments[#key] as String;
      final value = invocation.namedArguments[#value] as String?;
      if (value != null) secureTokens[key] = value;
    });
    when(() => platformStorage.delete(key: any(named: 'key')))
        .thenAnswer((invocation) async {
          secureTokens.remove(invocation.namedArguments[#key] as String);
        });
  });

  test('migrates existing tokens and removes plaintext preferences', () async {
    SharedPreferences.setMockInitialValues({
      'access_token': 'legacy-access',
      'refresh_token': 'legacy-refresh',
    });
    final storage = SecureStorage(storage: platformStorage);

    expect(await storage.getAccessToken(), 'legacy-access');
    expect(await storage.getRefreshToken(), 'legacy-refresh');
    expect(secureTokens, {
      'access_token': 'legacy-access',
      'refresh_token': 'legacy-refresh',
    });
    final preferences = await SharedPreferences.getInstance();
    expect(preferences.containsKey('access_token'), isFalse);
    expect(preferences.containsKey('refresh_token'), isFalse);
  });

  test('saves and clears tokens in secure storage', () async {
    final storage = SecureStorage(storage: platformStorage);

    await storage.saveTokens(accessToken: 'access', refreshToken: 'refresh');
    expect(await storage.getAccessToken(), 'access');
    expect(await storage.getRefreshToken(), 'refresh');

    await storage.clear();
    expect(secureTokens, isEmpty);
  });
}
