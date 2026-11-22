import 'package:isar/isar.dart';

import '../../../../core/database/isar_db.dart';
import '../../../../core/database/isar_schemas.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/mutation_queue.dart';
import 'expenses_model.dart';

class ExpensesRepository {
  ExpensesRepository(this._client, this._db, this._queue, this._monitor);
  final DioClient _client;
  final IsarDB _db;
  final MutationQueue _queue;
  final ConnectionMonitor _monitor;

  Future<List<Expense>> list({String search = '', String? category}) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get(
          '/expenses',
          queryParameters: {
            'search': search,
            if (category?.isNotEmpty ?? false) 'category': category,
          },
        );
        final data = response.data as Map<String, dynamic>;
        final items = (data['data'] as List<dynamic>? ?? []);
        return items
            .map((e) => Expense.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar == null) return [];
    final all = await isar.isarExpenses.where().findAll();
    var result = all.map((e) => Expense.fromIsar(e)).toList();
    if (search.isNotEmpty) {
      final lower = search.toLowerCase();
      result = result
          .where((e) => e.description.toLowerCase().contains(lower) ||
              e.category.toLowerCase().contains(lower))
          .toList();
    }
    if (category?.isNotEmpty ?? false) {
      result = result.where((e) => e.category == category).toList();
    }
    return result;
  }

  Future<void> create(ExpenseRequest request) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        await _client.dio.post('/expenses', data: request.toJson());
        return;
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final ie = IsarExpense()
        ..uuid = DateTime.now().millisecondsSinceEpoch.toString()
        ..category = request.category
        ..description = request.description
        ..amount = request.amount.toDouble()
        ..date = DateTime.now().toIso8601String()
        ..notes = request.notes
        ..updatedAt = DateTime.now()
        ..isSynced = false;
      await isar.writeTxn(() => isar.isarExpenses.put(ie));
    }
    await _queue.enqueue(operation: 'CREATE', endpoint: '/expenses', payload: request.toJson());
  }

  Future<Expense> getExpense(String id) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get('/expenses/$id');
        final data = response.data as Map<String, dynamic>;
        return Expense.fromJson(data);
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final existing = await isar.isarExpenses.filter().uuidEqualTo(id).findFirst();
      if (existing != null) return Expense.fromIsar(existing);
    }
    throw Exception('Gasto no encontrado');
  }

  Future<void> update(String id, Expense expense) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        await _client.dio.put('/expenses/$id', data: expense.toJson());
        return;
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final existing = await isar.isarExpenses.filter().uuidEqualTo(id).findFirst();
      if (existing != null) {
        existing.category = expense.category;
        existing.description = expense.description;
        existing.amount = expense.amount.toDouble();
        existing.date = expense.date ?? DateTime.now().toIso8601String();
        existing.notes = expense.notes;
        existing.updatedAt = DateTime.now();
        existing.isSynced = false;
        await isar.writeTxn(() => isar.isarExpenses.put(existing));
      }
    }
    await _queue.enqueue(operation: 'UPDATE', endpoint: '/expenses/$id', payload: expense.toJson());
  }

  Future<void> delete(String id) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        await _client.dio.delete('/expenses/$id');
        return;
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final existing = await isar.isarExpenses.filter().uuidEqualTo(id).findFirst();
      if (existing != null) {
        await isar.writeTxn(() => isar.isarExpenses.delete(existing.id));
      }
    }
    await _queue.enqueue(operation: 'DELETE', endpoint: '/expenses/$id', payload: {'id': id});
  }
}
