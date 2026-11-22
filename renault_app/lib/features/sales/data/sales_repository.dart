import 'package:isar/isar.dart';

import '../../../core/database/isar_db.dart';
import '../../../core/database/isar_schemas.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/sync/connection_monitor.dart';
import '../../../core/sync/mutation_queue.dart';
import 'sales_model.dart';

class SalesRepository {
  SalesRepository(this._client, this._db, this._queue, this._monitor);

  final DioClient _client;
  final IsarDB _db;
  final MutationQueue _queue;
  final ConnectionMonitor _monitor;

  Future<SaleResult> createSale(SaleRequest request) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.post('/sales', data: request.toJson());
        final data = response.data as Map<String, dynamic>;
        return SaleResult.fromJson(data);
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final saleRecord = IsarSale()
        ..uuid = DateTime.now().millisecondsSinceEpoch.toString()
        ..clientId = request.clientId
        ..date = DateTime.now().toIso8601String()
        ..subtotal = request.subtotal.toDouble()
        ..discount = request.discount.toDouble()
        ..total = request.total.toDouble()
        ..paymentMethod = request.paymentMethod
        ..status = 'completada'
        ..notes = request.notes
        ..updatedAt = DateTime.now()
        ..isSynced = false;
      await isar.writeTxn(() => isar.isarSales.put(saleRecord));
    }
    await _queue.enqueue(operation: 'CREATE', endpoint: '/sales', payload: request.toJson());
    return SaleResult(id: '', total: request.total, items: request.items.length);
  }

  Future<List<Sale>> listSales({
    String? startDate,
    String? endDate,
    String? status,
    String? clientId,
    String? search,
    int page = 1,
    int limit = 50,
  }) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get(
          '/sales',
          queryParameters: {
            if (startDate?.isNotEmpty ?? false) 'startDate': startDate,
            if (endDate?.isNotEmpty ?? false) 'endDate': endDate,
            if (status?.isNotEmpty ?? false) 'status': status,
            if (clientId?.isNotEmpty ?? false) 'clientId': clientId,
            if (search?.isNotEmpty ?? false) 'search': search,
            'page': page,
            'limit': limit,
          },
        );
        final data = response.data as Map<String, dynamic>;
        final items = data['data'] as List<dynamic>? ?? [];
        return items
            .map((e) => Sale.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar == null) return [];
    final all = await isar.isarSales.where().findAll();
    var result = all.map((s) => Sale.fromIsar(s)).toList();
    if (search?.isNotEmpty ?? false) {
      final lower = search!.toLowerCase();
      result = result.where((s) => s.clientName.toLowerCase().contains(lower)).toList();
    }
    if (status?.isNotEmpty ?? false) {
      result = result.where((s) => s.status == status).toList();
    }
    return result;
  }

  Future<Sale> getSale(String id) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get('/sales/$id');
        final data = response.data as Map<String, dynamic>;
        return Sale.fromJson(data);
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final existing = await isar.isarSales.filter().uuidEqualTo(id).findFirst();
      if (existing != null) return Sale.fromIsar(existing);
    }
    throw Exception('Venta no encontrada');
  }

  Future<void> cancelSale(String id) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        await _client.dio.patch('/sales/$id/cancel');
        return;
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final existing = await isar.isarSales.filter().uuidEqualTo(id).findFirst();
      if (existing != null) {
        existing.status = 'cancelada';
        existing.updatedAt = DateTime.now();
        existing.isSynced = false;
        await isar.writeTxn(() => isar.isarSales.put(existing));
      }
    }
    await _queue.enqueue(operation: 'PATCH', endpoint: '/sales/$id/cancel', payload: {'id': id});
  }
}
