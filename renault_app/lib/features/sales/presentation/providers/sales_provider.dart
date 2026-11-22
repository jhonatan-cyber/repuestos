import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/sync_engine.dart';
import '../../../products/data/product_model.dart';
import '../../../products/presentation/providers/products_provider.dart';
import '../../data/sales_model.dart';
import '../../data/sales_repository.dart';

final salesRepositoryProvider = Provider<SalesRepository>((ref) {
  return SalesRepository(
    ref.watch(dioClientProvider),
    ref.watch(isarDbProvider),
    ref.watch(mutationQueueProvider),
    ref.watch(connectionMonitorProvider.notifier),
  );
});

// --- Historial de ventas ---

class SalesHistoryFilters {
  SalesHistoryFilters({
    this.startDate,
    this.endDate,
    this.status,
    this.search,
  });

  final String? startDate;
  final String? endDate;
  final String? status;
  final String? search;
}

final salesHistoryFiltersProvider = StateProvider<SalesHistoryFilters>((ref) {
  return SalesHistoryFilters();
});

final salesHistoryProvider = FutureProvider.autoDispose.family<List<Sale>, SalesHistoryFilters>((ref, filters) async {
  final repo = ref.watch(salesRepositoryProvider);
  return repo.listSales(
    startDate: filters.startDate,
    endDate: filters.endDate,
    status: filters.status,
    search: filters.search,
  );
});

final saleDetailProvider = FutureProvider.autoDispose.family<Sale, String>((ref, id) async {
  final repo = ref.watch(salesRepositoryProvider);
  return repo.getSale(id);
});

final searchProductsProvider = FutureProvider.autoDispose
    .family<List<Product>, String>((ref, search) async {
  return ref.watch(productRepositoryProvider).list(search: search);
});

class CartItem {
  CartItem({
    required this.productId,
    required this.name,
    required this.price,
    required this.quantity,
  });

  final String productId;
  final String name;
  final num price;
  int quantity;

  num get subtotal => price * quantity;
}

class CartState {
  CartState({this.items = const [], this.error});

  final List<CartItem> items;
  final String? error;

  bool get isEmpty => items.isEmpty;
  int get totalItems => items.fold(0, (sum, i) => sum + i.quantity);
  num get subtotal => items.fold(0, (sum, i) => sum + i.subtotal);
  num get total => subtotal;

  CartState copyWith({List<CartItem>? items, String? error}) => CartState(
        items: items ?? this.items,
        error: error,
      );
}

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier() : super(CartState());

  void addItem(Product product) {
    final existingIndex =
        state.items.indexWhere((i) => i.productId == product.id);
    if (existingIndex >= 0) {
      final updated = List<CartItem>.from(state.items);
      updated[existingIndex] = CartItem(
        productId: updated[existingIndex].productId,
        name: updated[existingIndex].name,
        price: updated[existingIndex].price,
        quantity: updated[existingIndex].quantity + 1,
      );
      state = state.copyWith(items: updated);
    } else {
      state = state.copyWith(
        items: [
          ...state.items,
          CartItem(
            productId: product.id,
            name: product.name,
            price: product.salePrice,
            quantity: 1,
          ),
        ],
      );
    }
  }

  void removeItem(int index) {
    if (index < 0 || index >= state.items.length) return;
    final updated = List<CartItem>.from(state.items)..removeAt(index);
    state = state.copyWith(items: updated);
  }

  void updateQuantity(int index, int quantity) {
    if (index < 0 || index >= state.items.length) return;
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    final updated = List<CartItem>.from(state.items);
    updated[index] = CartItem(
      productId: updated[index].productId,
      name: updated[index].name,
      price: updated[index].price,
      quantity: quantity,
    );
    state = state.copyWith(items: updated);
  }

  void clear() {
    state = CartState();
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier();
});
