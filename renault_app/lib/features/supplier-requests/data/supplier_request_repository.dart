
import '../../../../core/database/isar_db.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/mutation_queue.dart';
import 'supplier_request_model.dart';

class SupplierRequestRepository {
  SupplierRequestRepository(this._client, this._db, this._queue, this._monitor);
  final DioClient _client;
  final IsarDB _db;
  final MutationQueue _queue;
  final ConnectionMonitor _monitor;

  Future<List<SupplierRequest>> list({String? startDate, String? endDate}) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get(
          '/supplier-requests',
          queryParameters: {
            if (startDate?.isNotEmpty ?? false) 'startDate': startDate,
            if (endDate?.isNotEmpty ?? false) 'endDate': endDate,
          },
        );
        final data = response.data as List<dynamic>? ?? [];
        return data
            .map((e) => SupplierRequest.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {}
    }
    return [];
  }
}
