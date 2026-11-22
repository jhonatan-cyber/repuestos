
import '../../../../core/database/isar_db.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/mutation_queue.dart';
import 'profile_model.dart';

class ProfileRepository {
  ProfileRepository(this._client, this._db, this._queue, this._monitor);
  final DioClient _client;
  final IsarDB _db;
  final MutationQueue _queue;
  final ConnectionMonitor _monitor;

  Future<ProfileUser> getMe() async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get('/auth/me');
        final data = response.data as Map<String, dynamic>;
        return ProfileUser.fromJson(data);
      } catch (_) {}
    }
    // Return cached user from storage if offline
    return ProfileUser(
      id: '',
      name: 'Usuario',
      email: '',
    );
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        await _client.dio.put('/auth/profile', data: data);
        return;
      } catch (_) {}
    }
    await _queue.enqueue(operation: 'PUT', endpoint: '/auth/profile', payload: data);
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        await _client.dio.put(
          '/auth/change-password',
          data: {'currentPassword': currentPassword, 'newPassword': newPassword},
        );
        return;
      } catch (_) {}
    }
    await _queue.enqueue(
      operation: 'PUT',
      endpoint: '/auth/change-password',
      payload: {'currentPassword': currentPassword, 'newPassword': newPassword},
    );
  }
}
