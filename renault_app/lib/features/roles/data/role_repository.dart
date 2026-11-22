import '../../../../core/network/dio_client.dart';
import 'role_model.dart';

class RoleRepository {
  RoleRepository(this._client);
  final DioClient _client;

  Future<List<RoleModel>> list() async {
    final response = await _client.dio.get('/roles');
    final data = response.data as Map<String, dynamic>;
    final items = (data['data'] as List<dynamic>? ?? []);
    return items
        .map((e) => RoleModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
