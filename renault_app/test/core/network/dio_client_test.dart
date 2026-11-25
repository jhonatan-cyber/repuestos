import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:renault_app/core/network/dio_client.dart';
import 'package:renault_app/core/storage/secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

class _FakeAdapter implements HttpClientAdapter {
  _FakeAdapter(this.handleRequest);

  final Future<ResponseBody> Function(RequestOptions) handleRequest;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) {
    return handleRequest(options);
  }

  @override
  void close({bool force = false}) {}
}

ResponseBody jsonResponse(Map<String, dynamic> body, int statusCode) {
  return ResponseBody.fromString(
    jsonEncode(body),
    statusCode,
    headers: {
      Headers.contentTypeHeader: ['application/json'],
    },
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'sends Bearer access token and retries with the refreshed token',
    () async {
      SharedPreferences.setMockInitialValues({});
      final platformStorage = _MockFlutterSecureStorage();
      final secureTokens = <String, String>{};
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
        secureTokens[invocation.namedArguments[#key] as String] =
            invocation.namedArguments[#value] as String;
      });
      when(() => platformStorage.delete(key: any(named: 'key')))
          .thenAnswer((invocation) async {
            secureTokens.remove(invocation.namedArguments[#key] as String);
          });

      final storage = SecureStorage(storage: platformStorage);
      await storage.saveTokens(
        accessToken: 'expired-access',
        refreshToken: 'valid-refresh',
      );

      var protectedRequests = 0;
      final requests = <({String path, Object? authorization, Object? data})>[];
      final adapter = _FakeAdapter((options) async {
        requests.add((
          path: options.path,
          authorization: options.headers['Authorization'],
          data: options.data,
        ));
        if (options.path == '/auth/refresh') {
          expect(requests.last.data, {'refreshToken': 'valid-refresh'});
          expect(requests.last.authorization, 'Bearer valid-refresh');
          return jsonResponse({
            'accessToken': 'new-access',
            'refreshToken': 'new-refresh',
          }, 200);
        }

        protectedRequests++;
        if (protectedRequests == 1) {
          return jsonResponse({'error': 'expired'}, 401);
        }
        return jsonResponse({'ok': true}, 200);
      });
      final client = DioClient(storage, adapter: adapter);
      addTearDown(() => client.dio.close(force: true));

      final response = await client.dio.get('/clients');

      expect(response.statusCode, 200);
      expect(requests.map((request) => request.path), [
        '/clients',
        '/auth/refresh',
        '/clients',
      ]);
      expect(requests[0].authorization, 'Bearer expired-access');
      expect(requests[2].authorization, 'Bearer new-access');
      expect(await storage.getAccessToken(), 'new-access');
      expect(await storage.getRefreshToken(), 'new-refresh');
    },
  );
}
