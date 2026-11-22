import '../../../../core/network/dio_client.dart';
import 'user_model.dart';

class UserRepository {
  UserRepository(this._client);
  final DioClient _client;

  Future<List<UserModel>> list({String search = ''}) async {
    final response = await _client.dio.get(
      '/users',
      queryParameters: {'search': search},
    );
    final data = response.data as Map<String, dynamic>;
    final items = (data['data'] as List<dynamic>? ?? []);
    return items
        .map((e) => UserModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<UserModel> create(UserModel user, {String? password}) async {
    final data = Map<String, dynamic>.from(user.toJson());
    if (password != null && password.isNotEmpty) {
      data['password'] = password;
    }
    final response = await _client.dio.post('/users', data: data);
    final result = response.data as Map<String, dynamic>;
    return UserModel.fromJson(result);
  }

  Future<UserModel> update(String id, UserModel user) async {
    final response = await _client.dio.put('/users/$id', data: user.toJson());
    final data = response.data as Map<String, dynamic>;
    return UserModel.fromJson(data);
  }

  Future<void> toggleStatus(String id) async {
    await _client.dio.patch('/users/$id/toggle-status');
  }

  Future<void> delete(String id) async {
    await _client.dio.delete('/users/$id');
  }
}
