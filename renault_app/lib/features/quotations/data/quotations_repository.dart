import 'package:isar/isar.dart';

import '../../../core/database/isar_db.dart';
import '../../../core/database/isar_schemas.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/sync/connection_monitor.dart';
import '../../../core/sync/mutation_queue.dart';
import 'quotations_model.dart';

class QuotationsRepository {
  QuotationsRepository(this._client, this._db, this._queue, this._monitor);
  final DioClient _client;
  final IsarDB _db;
  final MutationQueue _queue;
  final ConnectionMonitor _monitor;

  Future<List<Quotation>> list({String search = '', int page = 1, int limit = 50}) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get(
          '/quotations',
          queryParameters: {'search': search, 'page': page, 'limit': limit},
        );
        final data = response.data as Map<String, dynamic>;
        final items = (data['data'] as List<dynamic>? ?? []);
        return items
            .map((e) => Quotation.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar == null) return [];
    final all = await isar.isarQuotations.where().findAll();
    var result = all.map((q) => Quotation.fromIsar(q)).toList();
    if (search.isNotEmpty) {
      final lower = search.toLowerCase();
      result = result.where((q) => q.clientName.toLowerCase().contains(lower)).toList();
    }
    return result;
  }

  Future<QuotationResult> create(QuotationRequest request) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.post('/quotations', data: request.toJson());
        final data = response.data as Map<String, dynamic>;
        return QuotationResult.fromJson(data);
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final iq = IsarQuotation()
        ..uuid = DateTime.now().millisecondsSinceEpoch.toString()
        ..date = DateTime.now().toIso8601String()
        ..clientId = request.clientId
        ..subtotal = request.total.toDouble()
        ..total = request.total.toDouble()
        ..notes = request.notes
        ..updatedAt = DateTime.now()
        ..isSynced = false;
      await isar.writeTxn(() => isar.isarQuotations.put(iq));
    }
    await _queue.enqueue(operation: 'CREATE', endpoint: '/quotations', payload: request.toJson());
    return QuotationResult(id: '', total: request.total, items: request.items.length);
  }

  Future<void> convert(String id) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        await _client.dio.post('/quotations/$id/convert');
        return;
      } catch (_) {}
    }
    await _queue.enqueue(operation: 'POST', endpoint: '/quotations/$id/convert', payload: {'id': id});
  }

  Future<List<SupplierRequestResponse>> sendSupplierRequests(
    String id,
    List<String> supplierIds, {
    String? notes,
  }) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.post(
          '/quotations/$id/supplier-requests',
          data: {'supplierIds': supplierIds, 'notes': notes?.isNotEmpty == true ? notes : null},
        );
        final data = response.data as Map<String, dynamic>;
        final suppliers = (data['suppliers'] as List<dynamic>? ?? []);
        return suppliers
            .map((e) => SupplierRequestResponse(
                  id: '',
                  supplierName: (e as Map<String, dynamic>)['name']?.toString() ?? '',
                  status: 'enviado',
                  sentAt: DateTime.now().toIso8601String(),
                ))
            .toList();
      } catch (_) {}
    }
    await _queue.enqueue(
      operation: 'POST',
      endpoint: '/quotations/$id/supplier-requests',
      payload: {'supplierIds': supplierIds, 'notes': notes},
    );
    return [];
  }

  Future<List<SupplierRequestResponse>> getSupplierRequests(String id) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get('/quotations/$id/supplier-requests');
        final data = response.data as Map<String, dynamic>;
        final items = (data['data'] as List<dynamic>? ?? []);
        return items
            .map((e) => SupplierRequestResponse.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {}
    }
    return [];
  }
}
