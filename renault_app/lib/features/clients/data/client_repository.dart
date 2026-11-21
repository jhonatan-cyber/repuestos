
import '../../../core/network/dio_client.dart';
import 'client_model.dart';

class ClientRepository {
  ClientRepository(this._client);
  final DioClient _client;

  Future<List<Client>> list({String search = '', int page = 1, int limit = 50}) async {
    final response = await _client.dio.get(
      '/clients',
      queryParameters: {
        'search': search,
        'page': page,
        'limit': limit,
      },
    );
    final data = response.data as Map<String, dynamic>;
    // buildPaginatedResponse -> { data, pagination }
    final items = (data['data'] as List<dynamic>? ?? []);
    return items
        .map((e) => Client.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
