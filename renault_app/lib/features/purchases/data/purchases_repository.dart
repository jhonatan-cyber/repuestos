import 'package:isar/isar.dart';

import '../../../core/database/isar_db.dart';
import '../../../core/database/isar_schemas.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/sync/connection_monitor.dart';
import '../../../core/sync/mutation_queue.dart';
import 'purchases_model.dart';

class PurchasesRepository {
  PurchasesRepository(this._client, this._db, this._queue, this._monitor);
  final DioClient _client;
  final IsarDB _db;
  final MutationQueue _queue;
  final ConnectionMonitor _monitor;

  Future<List<Purchase>> list({String search = '', int page = 1, int limit = 50}) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get(
          '/purchases',
          queryParameters: {'search': search, 'page': page, 'limit': limit},
        );
        final data = response.data as Map<String, dynamic>;
        final items = (data['data'] as List<dynamic>? ?? []);
        return items
            .map((e) => Purchase.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar == null) return [];
    final all = await isar.isarPurchases.where().findAll();
    var result = all.map((p) => Purchase.fromIsar(p)).toList();
    if (search.isNotEmpty) {
      final lower = search.toLowerCase();
      result = result.where((p) => p.supplierName.toLowerCase().contains(lower)).toList();
    }
    return result;
  }

  Future<PurchaseResult> create(PurchaseRequest request) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.post('/purchases', data: request.toJson());
        final data = response.data as Map<String, dynamic>;
        return PurchaseResult.fromJson(data);
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final ip = IsarPurchase()
        ..uuid = DateTime.now().millisecondsSinceEpoch.toString()
        ..date = DateTime.now().toIso8601String()
        ..supplierId = request.supplierId
        ..subtotal = request.subtotal.toDouble()
        ..total = request.subtotal.toDouble()
        ..initialPayment = request.totalPaid.toDouble()
        ..paymentMethod = request.paymentMethod
        ..notes = request.notes
        ..updatedAt = DateTime.now()
        ..isSynced = false;
      await isar.writeTxn(() => isar.isarPurchases.put(ip));
    }
    await _queue.enqueue(operation: 'CREATE', endpoint: '/purchases', payload: request.toJson());
    return PurchaseResult(id: '', supplierName: '', total: request.subtotal, items: request.items.length);
  }
}
