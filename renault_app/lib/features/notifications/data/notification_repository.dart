import 'package:isar/isar.dart';
import '../../../core/database/isar_db.dart';
import '../../../core/database/isar_schemas.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/sync/connection_monitor.dart';
import '../../../core/sync/mutation_queue.dart';
import 'notification_model.dart';

class NotificationRepository {
  NotificationRepository(this._client, this._db, this._queue, this._monitor);

  final DioClient _client;
  final IsarDB _db;
  final MutationQueue _queue;
  final ConnectionMonitor _monitor;

  Future<List<Notification>> list() async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get('/notifications');
        final data = response.data as Map<String, dynamic>;
        final items = data['data'] as List<dynamic>? ?? [];
        return items
            .map((e) => Notification.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar == null) return [];
    final all = await isar.isarNotifications.where().findAll();
    return all.map((n) => Notification.fromIsar(n)).toList();
  }

  Future<int> unreadCount() async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get('/notifications');
        final data = response.data as Map<String, dynamic>;
        return (data['unreadCount'] as int?) ?? 0;
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar == null) return 0;
    final all = await isar.isarNotifications.filter().isReadEqualTo(false).findAll();
    return all.length;
  }

  Future<void> markAllRead() async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        await _client.dio.patch('/notifications');
        return;
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final all = await isar.isarNotifications.where().findAll();
      for (final n in all) {
        n.isRead = true;
        n.updatedAt = DateTime.now();
        n.isSynced = false;
      }
      await isar.writeTxn(() => isar.isarNotifications.putAll(all));
    }
    await _queue.enqueue(operation: 'PATCH', endpoint: '/notifications', payload: {});
  }

  Future<void> markRead(String id) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        await _client.dio.patch('/notifications/$id/read');
        return;
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar != null) {
      final existing = await isar.isarNotifications.filter().uuidEqualTo(id).findFirst();
      if (existing != null) {
        existing.isRead = true;
        existing.updatedAt = DateTime.now();
        existing.isSynced = false;
        await isar.writeTxn(() => isar.isarNotifications.put(existing));
      }
    }
    await _queue.enqueue(operation: 'PATCH', endpoint: '/notifications/$id/read', payload: {'id': id});
  }
}
