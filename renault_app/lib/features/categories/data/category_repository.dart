import 'package:isar/isar.dart';

import '../../../../core/database/isar_db.dart';
import '../../../../core/database/isar_schemas.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/mutation_queue.dart';
import 'category_model.dart';

class CategoryRepository {
  CategoryRepository(this._client, this._db, this._queue, this._monitor);
  final DioClient _client;
  final IsarDB _db;
  final MutationQueue _queue;
  final ConnectionMonitor _monitor;

  Future<List<Category>> list() async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get('/categories');
        final data = response.data as Map<String, dynamic>;
        final items = (data['data'] as List<dynamic>? ?? []);
        return items
            .map((e) => Category.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar == null) return [];
    final all = await isar.isarCategorys.where().findAll();
    return all.map((c) => Category.fromIsar(c)).toList();
  }

  Future<Category> create(Category category) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.post('/categories', data: category.toJson());
        final data = response.data as Map<String, dynamic>;
        return Category.fromJson(data);
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final ic = IsarCategory()
        ..uuid = category.id
        ..name = category.name
        ..status = category.status
        ..updatedAt = DateTime.now()
        ..isSynced = false;
      await isar.writeTxn(() => isar.isarCategorys.put(ic));
    }
    await _queue.enqueue(operation: 'CREATE', endpoint: '/categories', payload: category.toJson());
    return category;
  }

  Future<Category> update(String id, Category category) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.put('/categories/$id', data: category.toJson());
        final data = response.data as Map<String, dynamic>;
        return Category.fromJson(data);
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final existing = await isar.isarCategorys.filter().uuidEqualTo(id).findFirst();
      if (existing != null) {
        existing.name = category.name;
        existing.status = category.status;
        existing.updatedAt = DateTime.now();
        existing.isSynced = false;
        await isar.writeTxn(() => isar.isarCategorys.put(existing));
      }
    }
    await _queue.enqueue(operation: 'UPDATE', endpoint: '/categories/$id', payload: category.toJson());
    return category;
  }

  Future<void> toggleStatus(String id) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        await _client.dio.patch('/categories/$id/toggle-status');
        return;
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final existing = await isar.isarCategorys.filter().uuidEqualTo(id).findFirst();
      if (existing != null) {
        existing.status = existing.status == 'active' ? 'inactive' : 'active';
        existing.updatedAt = DateTime.now();
        existing.isSynced = false;
        await isar.writeTxn(() => isar.isarCategorys.put(existing));
      }
    }
    await _queue.enqueue(operation: 'PATCH', endpoint: '/categories/$id/toggle-status', payload: {'id': id});
  }
}
