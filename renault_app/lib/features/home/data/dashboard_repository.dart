
import '../../../../core/network/dio_client.dart';
import 'charts_model.dart';
import 'dashboard_model.dart';

class DashboardRepository {
  DashboardRepository(this._client);

  final DioClient _client;

  Future<DashboardStats> getStats() async {
    try {
      final response = await _client.dio.get('/dashboard/stats');
      final data = response.data as Map<String, dynamic>;
      return DashboardStats.fromJson(data);
    } catch (e) {
      return DashboardStats(
        salesToday: 0,
        totalSalesToday: 0,
        lowStockCount: 0,
        pendingCredits: 0,
      );
    }
  }

  Future<ChartsData> getCharts(String period) async {
    try {
      final response = await _client.dio.get(
        '/dashboard/charts',
        queryParameters: {'period': period},
      );
      final data = response.data as Map<String, dynamic>;
      return ChartsData.fromJson(data);
    } catch (e) {
      return ChartsData(
        salesByDay: [],
        topProducts: [],
        paymentMethods: [],
      );
    }
  }
}
