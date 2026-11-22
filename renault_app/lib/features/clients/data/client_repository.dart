
import 'package:isar/isar.dart';

import '../../../core/database/isar_db.dart';
import '../../../core/database/isar_schemas.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/sync/connection_monitor.dart';
import '../../../core/sync/mutation_queue.dart';
import 'client_model.dart';

class ClientRepository {
  ClientRepository(this._client, this._db, this._queue, this._monitor);
  final DioClient _client;
  final IsarDB _db;
  final MutationQueue _queue;
  final ConnectionMonitor _monitor;

  Future<List<Client>> list({String search = '', int page = 1, int limit = 50}) async {
    final isOnline = await _monitor.hasConnection();

    if (isOnline) {
      try {
        final response = await _client.dio.get(
          '/clients',
          queryParameters: {
            'search': search,
            'page': page,
            'limit': limit,
          },
        );
        final data = response.data as Map<String, dynamic>;
        final items = (data['data'] as List<dynamic>? ?? []);
        return items
            .map((e) => Client.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {
        // Fallback to offline
      }
    }

    // Read from Isar
    final isar = _db.isar;
    if (isar == null) return [];

    final all = await isar.isarClients.where().findAll();
    var result = all.map((c) => Client.fromIsar(c)).toList();

    if (search.isNotEmpty) {
      final lower = search.toLowerCase();
      result = result
          .where((c) => c.name.toLowerCase().contains(lower) ||
              (c.phone ?? '').contains(lower))
          .toList();
    }

    return result;
  }

  Future<Client> create(Client client) async {
    final isOnline = await _monitor.hasConnection();

    if (isOnline) {
      try {
        final response = await _client.dio.post('/clients', data: client.toJson());
        final data = response.data as Map<String, dynamic>;
        return Client.fromJson(data);
      } catch (_) {
        // Fallback to offline
      }
    }

    // Save to Isar and enqueue mutation
    final isar = _db.isar;
    if (isar != null) {
      final ic = IsarClient()
        ..uuid = client.id
        ..name = client.name
        ..phone = client.phone
        ..address = client.address
        ..status = client.status
        ..updatedAt = DateTime.now()
        ..isSynced = false;
      await isar.writeTxn(() => isar.isarClients.put(ic));
    }
    await _queue.enqueue(
      operation: 'CREATE',
      endpoint: '/clients',
      payload: client.toJson(),
    );
    return client;
  }

  Future<Client> update(String id, Client client) async {
    final isOnline = await _monitor.hasConnection();

    if (isOnline) {
      try {
        final response = await _client.dio.put('/clients/$id', data: client.toJson());
        final data = response.data as Map<String, dynamic>;
        return Client.fromJson(data);
      } catch (_) {
        // Fallback to offline
      }
    }

    // Save to Isar and enqueue mutation
    final isar = _db.isar;
    if (isar != null) {
      final existing = await isar.isarClients.filter().uuidEqualTo(id).findFirst();
      if (existing != null) {
        existing.name = client.name;
        existing.phone = client.phone;
        existing.address = client.address;
        existing.status = client.status;
        existing.updatedAt = DateTime.now();
        existing.isSynced = false;
        await isar.writeTxn(() => isar.isarClients.put(existing));
      }
    }
    await _queue.enqueue(
      operation: 'UPDATE',
      endpoint: '/clients/$id',
      payload: client.toJson(),
    );
    return client;
  }

  Future<void> delete(String id) async {
    final isOnline = await _monitor.hasConnection();

    if (isOnline) {
      try {
        await _client.dio.delete('/clients/$id');
        return;
      } catch (_) {
        // Fallback to offline
      }
    }

    // Remove from Isar and enqueue mutation
    final isar = _db.isar;
    if (isar != null) {
      final existing = await isar.isarClients.filter().uuidEqualTo(id).findFirst();
      if (existing != null) {
        await isar.writeTxn(() => isar.isarClients.delete(existing.id));
      }
    }
    await _queue.enqueue(
      operation: 'DELETE',
      endpoint: '/clients/$id',
      payload: {'id': id},
    );
  }
}
