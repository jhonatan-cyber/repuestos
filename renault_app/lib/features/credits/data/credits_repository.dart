import 'package:isar/isar.dart';

import '../../../../core/database/isar_db.dart';
import '../../../../core/database/isar_schemas.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/mutation_queue.dart';
import 'credits_model.dart';

class CreditsRepository {
  CreditsRepository(this._client, this._db, this._queue, this._monitor);
  final DioClient _client;
  final IsarDB _db;
  final MutationQueue _queue;
  final ConnectionMonitor _monitor;

  Future<List<Credit>> listCredits({String search = ''}) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get('/credits', queryParameters: {'search': search});
        final data = response.data as Map<String, dynamic>;
        final items = (data['data'] as List<dynamic>? ?? []);
        return items
            .map((e) => Credit.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar == null) return [];
    final all = await isar.isarCredits.where().findAll();
    var result = all.map((c) => Credit.fromIsar(c)).toList();
    if (search.isNotEmpty) {
      final lower = search.toLowerCase();
      result = result.where((c) => c.clientName.toLowerCase().contains(lower)).toList();
    }
    return result;
  }

  Future<Credit> getCredit(String id) async {
    final credits = await listCredits();
    final credit = credits.firstWhere(
      (c) => c.id == id,
      orElse: () => throw Exception('Crédito no encontrado'),
    );
    return credit;
  }

  Future<void> payCredit(String id, CreditPayment payment) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        await _client.dio.post('/credits/$id/payments', data: payment.toJson());
        return;
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final ic = IsarCreditPayment()
        ..uuid = DateTime.now().millisecondsSinceEpoch.toString()
        ..creditId = id
        ..amount = payment.amount.toDouble()
        ..date = DateTime.now().toIso8601String()
        ..notes = payment.notes
        ..updatedAt = DateTime.now()
        ..isSynced = false;
      await isar.writeTxn(() => isar.isarCreditPayments.put(ic));
    }
    await _queue.enqueue(operation: 'POST', endpoint: '/credits/$id/payments', payload: payment.toJson());
  }

  Future<List<PurchaseCredit>> listPurchaseCredits({String search = ''}) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get(
          '/purchase-credits',
          queryParameters: {'search': search},
        );
        final data = response.data as Map<String, dynamic>;
        final items = (data['data'] as List<dynamic>? ?? []);
        return items
            .map((e) => PurchaseCredit.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {}
    }
    return [];
  }

  Future<PurchaseCredit> getPurchaseCredit(String id) async {
    final credits = await listPurchaseCredits();
    final credit = credits.firstWhere(
      (c) => c.id == id,
      orElse: () => throw Exception('Crédito no encontrado'),
    );
    return credit;
  }

  Future<void> payPurchaseCredit(String id, CreditPayment payment) async {
    await _client.dio.post('/purchase-credits/$id/payments', data: payment.toJson());
  }
}
