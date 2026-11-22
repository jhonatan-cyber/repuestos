import '../../../../core/network/dio_client.dart';
import 'permission_model.dart';

class PermissionRepository {
  PermissionRepository(this._client);
  final DioClient _client;

  Future<List<PermissionModel>> list() async {
    final response = await _client.dio.get('/permissions');
    final data = response.data as Map<String, dynamic>;
    final items = (data['data'] as List<dynamic>? ?? []);
    return items
        .map((e) => PermissionModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> toggleStatus(String id) async {
    await _client.dio.patch('/permissions/$id/toggle-status');
  }
}
