import 'dart:io';

import 'package:dio/dio.dart';

import '../../../../core/network/dio_client.dart';

class BackupRepository {
  BackupRepository(this._client);
  final DioClient _client;

  Future<Map<String, dynamic>> createBackup() async {
    final response = await _client.dio.get('/backup');
    return response.data as Map<String, dynamic>;
  }

  Future<void> restoreBackup(File file) async {
    final bytes = await file.readAsBytes();
    final response = await _client.dio.post(
      '/backup/restore',
      data: bytes,
      options: Options(
        headers: {'Content-Type': 'application/json'},
      ),
    );
    return response.data;
  }
}
