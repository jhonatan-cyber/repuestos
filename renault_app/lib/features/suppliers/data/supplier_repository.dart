
import 'package:isar/isar.dart';

import '../../../../core/database/isar_db.dart';
import '../../../../core/database/isar_schemas.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/mutation_queue.dart';
import 'supplier_model.dart';

class SupplierRepository {
  SupplierRepository(this._client, this._db, this._queue, this._monitor);
  final DioClient _client;
  final IsarDB _db;
  final MutationQueue _queue;
  final ConnectionMonitor _monitor;

  Future<List<Supplier>> list({String search = '', int page = 1, int limit = 50}) async {
    final isOnline = await _monitor.hasConnection();

    if (isOnline) {
      try {
        final response = await _client.dio.get(
          '/suppliers',
          queryParameters: {
            'search': search,
            'page': page,
            'limit': limit,
          },
        );
        final data = response.data as Map<String, dynamic>;
        final items = (data['data'] as List<dynamic>? ?? []);
        return items
            .map((e) => Supplier.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {}
    }

    final isar = _db.isar;
    if (isar == null) return [];
    final all = await isar.isarSuppliers.where().findAll();
    var result = all.map((s) => Supplier.fromIsar(s)).toList();
    if (search.isNotEmpty) {
      final lower = search.toLowerCase();
      result = result
          .where((s) => s.name.toLowerCase().contains(lower) ||
              (s.contactName ?? '').toLowerCase().contains(lower))
          .toList();
    }
    return result;
  }

  Future<Supplier> create(Supplier supplier) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.post('/suppliers', data: supplier.toJson());
        final data = response.data as Map<String, dynamic>;
        return Supplier.fromJson(data);
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final supplierRecord = IsarSupplier()
        ..uuid = supplier.id
        ..name = supplier.name
        ..contactName = supplier.contactName
        ..phone = supplier.phone
        ..email = supplier.email
        ..address = supplier.address
        ..updatedAt = DateTime.now()
        ..isSynced = false;
      await isar.writeTxn(() => isar.isarSuppliers.put(supplierRecord));
    }
    await _queue.enqueue(operation: 'CREATE', endpoint: '/suppliers', payload: supplier.toJson());
    return supplier;
  }

  Future<Supplier> update(String id, Supplier supplier) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.put('/suppliers/$id', data: supplier.toJson());
        final data = response.data as Map<String, dynamic>;
        return Supplier.fromJson(data);
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final existing = await isar.isarSuppliers.filter().uuidEqualTo(id).findFirst();
      if (existing != null) {
        existing.name = supplier.name;
        existing.contactName = supplier.contactName;
        existing.phone = supplier.phone;
        existing.email = supplier.email;
        existing.address = supplier.address;
        existing.updatedAt = DateTime.now();
        existing.isSynced = false;
        await isar.writeTxn(() => isar.isarSuppliers.put(existing));
      }
    }
    await _queue.enqueue(operation: 'UPDATE', endpoint: '/suppliers/$id', payload: supplier.toJson());
    return supplier;
  }

  Future<void> delete(String id) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        await _client.dio.delete('/suppliers/$id');
        return;
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final existing = await isar.isarSuppliers.filter().uuidEqualTo(id).findFirst();
      if (existing != null) {
        await isar.writeTxn(() => isar.isarSuppliers.delete(existing.id));
      }
    }
    await _queue.enqueue(operation: 'DELETE', endpoint: '/suppliers/$id', payload: {'id': id});
  }
}
