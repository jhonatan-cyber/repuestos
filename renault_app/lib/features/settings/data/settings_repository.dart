
import '../../../../core/network/dio_client.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/mutation_queue.dart';
import 'settings_model.dart';

class SettingsRepository {
  SettingsRepository(this._client, this._queue, this._monitor);
  final DioClient _client;
  final MutationQueue _queue;
  final ConnectionMonitor _monitor;

  Future<CompanySettings> getCompany() async {
    try {
      final response = await _client.dio.get('/settings/company');
      final data = response.data as Map<String, dynamic>;
      return CompanySettings.fromJson(data);
    } catch (e) {
      return CompanySettings();
    }
  }

  Future<void> updateCompany(Map<String, dynamic> data) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        await _client.dio.put('/settings/company', data: data);
        return;
      } catch (_) {}
    }
    await _queue.enqueue(operation: 'PUT', endpoint: '/settings/company', payload: data);
  }
}
