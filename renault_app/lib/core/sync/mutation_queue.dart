import 'dart:convert';
import 'package:isar/isar.dart';

import '../database/isar_db.dart';
import '../database/isar_schemas.dart';

class MutationQueue {
  final IsarDB _db;

  MutationQueue(this._db);

  /// Add a mutation to the queue
  Future<void> enqueue({
    required String operation,
    required String endpoint,
    required Map<String, dynamic> payload,
  }) async {
    final isar = _db.isar;
    if (isar == null) return;

    final mutation = IsarMutation()
      ..operation = operation
      ..endpoint = endpoint
      ..payload = jsonEncode(payload)
      ..createdAt = DateTime.now();

    await isar.writeTxn(() => isar.isarMutations.put(mutation));
  }

  /// Get all pending mutations
  Future<List<IsarMutation>> getPending() async {
    final isar = _db.isar;
    if (isar == null) return [];

    final all = await isar.isarMutations.where().findAll();
    return all.where((m) => !m.processed && !m.failed).toList()
      ..sort((a, b) => a.createdAt.compareTo(b.createdAt));
  }

  /// Mark a mutation as synced
  Future<void> markSynced(int id) async {
    final isar = _db.isar;
    if (isar == null) return;

    final mutation = await isar.isarMutations.get(id);
    if (mutation != null) {
      mutation.processed = true;
      await isar.writeTxn(() => isar.isarMutations.put(mutation));
    }
  }

  /// Mark a mutation as failed
  Future<void> markFailed(int id, String error) async {
    final isar = _db.isar;
    if (isar == null) return;

    final mutation = await isar.isarMutations.get(id);
    if (mutation != null) {
      mutation.failed = true;
      mutation.error = error;
      mutation.retryCount += 1;
      await isar.writeTxn(() => isar.isarMutations.put(mutation));
    }
  }

  /// Retry failed mutations
  Future<void> retryFailed() async {
    final isar = _db.isar;
    if (isar == null) return;

    final all = await isar.isarMutations.where().findAll();
    final failed = all.where((m) => m.failed).toList();

    for (final mutation in failed) {
      if (mutation.retryCount < 3) {
        mutation.failed = false;
        await isar.writeTxn(() => isar.isarMutations.put(mutation));
      }
    }
  }

  /// Get payload as map
  Map<String, dynamic> getPayload(IsarMutation mutation) {
    try {
      return jsonDecode(mutation.payload) as Map<String, dynamic>;
    } catch (_) {
      return {};
    }
  }

  /// Clear all processed mutations
  Future<void> clearProcessed() async {
    final isar = _db.isar;
    if (isar == null) return;

    final all = await isar.isarMutations.where().findAll();
    final processed = all.where((m) => m.processed).toList();

    await isar.writeTxn(() async {
      for (final m in processed) {
        await isar.isarMutations.delete(m.id);
      }
    });
  }

  /// Count pending mutations
  Future<int> countPending() async {
    final isar = _db.isar;
    if (isar == null) return 0;

    final all = await isar.isarMutations.where().findAll();
    return all.where((m) => !m.processed && !m.failed).length;
  }
}
