import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../data/product_model.dart';
import '../../data/product_repository.dart';

final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ProductRepository(ref.watch(dioClientProvider));
});

final productsProvider = FutureProvider.autoDispose
    .family<List<Product>, String>((ref, search) async {
  return ref.watch(productRepositoryProvider).list(search: search);
});
