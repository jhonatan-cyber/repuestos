
import '../../../core/network/dio_client.dart';
import 'product_model.dart';

class ProductRepository {
  ProductRepository(this._client);
  final DioClient _client;

  Future<List<Product>> list({String search = '', int page = 1, int limit = 50}) async {
    final response = await _client.dio.get(
      '/products',
      queryParameters: {
        'search': search,
        'page': page,
        'limit': limit,
      },
    );
    final data = response.data as Map<String, dynamic>;
    final items = (data['data'] as List<dynamic>? ?? []);
    return items
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
