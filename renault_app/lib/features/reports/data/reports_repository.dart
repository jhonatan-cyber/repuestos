
import '../../../../core/database/isar_db.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/mutation_queue.dart';
import 'reports_model.dart';

class ReportsRepository {
  ReportsRepository(this._client, this._db, this._queue, this._monitor);
  final DioClient _client;
  final IsarDB _db;
  final MutationQueue _queue;
  final ConnectionMonitor _monitor;

  Future<ReportData> getDashboard() async {
    try {
      final response = await _client.dio.get('/dashboard/charts');
      final data = response.data as Map<String, dynamic>;
      return ReportData.fromJson(data);
    } catch (e) {
      return ReportData();
    }
  }

  Future<ComparisonData> getComparison({String? startDate, String? endDate}) async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get(
          '/reports/comparison',
          queryParameters: {
            if (startDate?.isNotEmpty ?? false) 'startDate': startDate,
            if (endDate?.isNotEmpty ?? false) 'endDate': endDate,
          },
        );
        final data = response.data as Map<String, dynamic>;
        return ComparisonData.fromJson(data);
      } catch (_) {}
    }
    return ComparisonData();
  }
}
