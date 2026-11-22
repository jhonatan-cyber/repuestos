import 'package:isar/isar.dart';

import '../../../../core/database/isar_db.dart';
import '../../../../core/database/isar_schemas.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/mutation_queue.dart';
import 'cash_model.dart';

class CashRepository {
  CashRepository(this._client, this._db, this._queue, this._monitor);
  final DioClient _client;
  final IsarDB _db;
  final MutationQueue _queue;
  final ConnectionMonitor _monitor;

  Future<CashSummary> getTodaySummary() async {
    try {
      final response = await _client.dio.get('/cash-records/today-summary');
      final data = response.data as Map<String, dynamic>;
      return CashSummary.fromJson(data);
    } catch (e) {
      return CashSummary.empty();
    }
  }

  Future<void> openCash(num amount) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        await _client.dio.post('/cash-records', data: {'openingBalance': amount});
        return;
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final ic = IsarCashRecord()
        ..uuid = DateTime.now().millisecondsSinceEpoch.toString()
        ..date = DateTime.now().toIso8601String()
        ..openingBalance = amount.toDouble()
        ..status = 'open'
        ..updatedAt = DateTime.now()
        ..isSynced = false;
      await isar.writeTxn(() => isar.isarCashRecords.put(ic));
    }
    await _queue.enqueue(operation: 'POST', endpoint: '/cash-records', payload: {'openingBalance': amount});
  }

  Future<void> closeCash(String id) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        await _client.dio.post('/cash-records/$id/close');
        return;
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final existing = await isar.isarCashRecords.filter().uuidEqualTo(id).findFirst();
      if (existing != null) {
        existing.status = 'closed';
        existing.closedAt = DateTime.now().toIso8601String();
        existing.updatedAt = DateTime.now();
        existing.isSynced = false;
        await isar.writeTxn(() => isar.isarCashRecords.put(existing));
      }
    }
    await _queue.enqueue(operation: 'POST', endpoint: '/cash-records/$id/close', payload: {'id': id});
  }

  Future<void> withdraw(String id, num amount, String reason) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        await _client.dio.post('/cash-records/$id/withdraw', data: {'amount': amount, 'reason': reason});
        return;
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final iw = IsarCashWithdrawal()
        ..uuid = DateTime.now().millisecondsSinceEpoch.toString()
        ..recordId = id
        ..amount = amount.toDouble()
        ..reason = reason
        ..createdAt = DateTime.now()
        ..updatedAt = DateTime.now()
        ..isSynced = false;
      await isar.writeTxn(() => isar.isarCashWithdrawals.put(iw));
    }
    await _queue.enqueue(operation: 'POST', endpoint: '/cash-records/$id/withdraw', payload: {'amount': amount, 'reason': reason});
  }

  Future<List<CashRecord>> list() async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get('/cash-records');
        final data = response.data as Map<String, dynamic>;
        final items = (data['data'] as List<dynamic>? ?? []);
        return items
            .map((e) => CashRecord.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar == null) return [];
    final all = await isar.isarCashRecords.where().findAll();
    return all.map((c) => CashRecord.fromIsar(c)).toList();
  }

  Future<List<CashRecord>> listRecords({int page = 1, int limit = 20, String? status}) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get(
          '/cash-records',
          queryParameters: {
            'page': page,
            'limit': limit,
            if (status?.isNotEmpty ?? false) 'status': status,
          },
        );
        final data = response.data as Map<String, dynamic>;
        final items = (data['data'] as List<dynamic>? ?? []);
        return items
            .map((e) => CashRecord.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar == null) return [];
    final all = await isar.isarCashRecords.where().findAll();
    var result = all.map((c) => CashRecord.fromIsar(c)).toList();
    if (status?.isNotEmpty ?? false) {
      result = result.where((c) => c.status == status).toList();
    }
    return result;
  }

  Future<CashRecord> getRecord(String id) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get('/cash-records/$id');
        final data = response.data as Map<String, dynamic>;
        return CashRecord.fromJson(data);
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final existing = await isar.isarCashRecords.filter().uuidEqualTo(id).findFirst();
      if (existing != null) return CashRecord.fromIsar(existing);
    }
    throw Exception('Registro de caja no encontrado');
  }
}
