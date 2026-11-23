import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/sync_engine.dart';
import '../../../../features/categories/data/category_model.dart';
import '../../../../features/products/data/product_model.dart';
import '../../../../features/suppliers/data/supplier_model.dart';
import '../../data/inventory_model.dart';
import '../../data/inventory_repository.dart';

final inventoryRepositoryProvider = Provider<InventoryRepository>((ref) {
  return InventoryRepository(
    ref.watch(dioClientProvider),
    ref.watch(isarDbProvider),
    ref.watch(connectionMonitorProvider.notifier),
  );
});

class InventoryFiltersNotifier extends StateNotifier<InventoryFilters> {
  InventoryFiltersNotifier() : super(const InventoryFilters());

  void setSearch(String value) => state = state.copyWith(search: value);
  void setCategory(String? value) => state = state.copyWith(categoryId: value);
  void setSupplier(String? value) => state = state.copyWith(supplierId: value);
  void setStock(String value) => state = state.copyWith(stockFilter: value);
  void setPage(int value) => state = state.copyWith(currentPage: value);
  void setPageSize(int value) {
    state = state.copyWith(pageSize: value, currentPage: 1);
  }
}

final inventoryFiltersProvider = StateNotifierProvider<InventoryFiltersNotifier, InventoryFilters>((ref) {
  return InventoryFiltersNotifier();
});

class InventoryData {
  InventoryData({
    required this.products,
    required this.categories,
    required this.suppliers,
    required this.stats,
  });

  final List<Product> products;
  final List<Category> categories;
  final List<Supplier> suppliers;
  final InventoryStats stats;
}

final inventoryProvider = FutureProvider.autoDispose<InventoryData>((ref) async {
  final repo = ref.watch(inventoryRepositoryProvider);
  final results = await Future.wait([
    repo.getProducts(),
    repo.getCategories(),
    repo.getSuppliers(),
  ]);
  final products = results[0] as List<Product>;
  final categories = results[1] as List<Category>;
  final suppliers = results[2] as List<Supplier>;
  final stats = repo.calculateStats(products);
  return InventoryData(
    products: products,
    categories: categories,
    suppliers: suppliers,
    stats: stats,
  );
});

/// Provides the filtered and paginated product list based on current filters
final filteredProductsProvider = Provider.autoDispose<List<Product>>((ref) {
  final inventoryAsync = ref.watch(inventoryProvider);
  final filters = ref.watch(inventoryFiltersProvider);

  final data = inventoryAsync.valueOrNull;
  if (data == null) return [];

  var filtered = data.products.where((p) {
    // Search filter
    if (filters.search.isNotEmpty) {
      final q = filters.search.toLowerCase();
      final matchesCode = p.code.toLowerCase().contains(q);
      final matchesName = p.name.toLowerCase().contains(q);
      final matchesCategory = p.category.toLowerCase().contains(q);
      final matchesSupplier = (p.supplierName ?? '').toLowerCase().contains(q);
      if (!matchesCode && !matchesName && !matchesCategory && !matchesSupplier) {
        return false;
      }
    }

    // Category filter
    if (filters.categoryId != null && filters.categoryId!.isNotEmpty) {
      if (p.categoryId != filters.categoryId) return false;
    }

    // Supplier filter
    if (filters.supplierId != null && filters.supplierId!.isNotEmpty) {
      if (p.supplierId != filters.supplierId) return false;
    }

    // Stock filter
    if (filters.stockFilter == 'low-stock') {
      if (p.stock > p.minimumStock) return false;
    } else if (filters.stockFilter == 'normal-stock') {
      if (p.stock <= p.minimumStock) return false;
    }

    return true;
  }).toList();

  // Pagination
  final start = (filters.currentPage - 1) * filters.pageSize;
  final end = start + filters.pageSize;
  if (start >= filtered.length) return [];
  return filtered.sublist(0, end.clamp(0, filtered.length));
});

/// Total number of filtered products (for pagination info)
final filteredCountProvider = Provider.autoDispose<int>((ref) {
  final inventoryAsync = ref.watch(inventoryProvider);
  final filters = ref.watch(inventoryFiltersProvider);

  final data = inventoryAsync.valueOrNull;
  if (data == null) return 0;

  return data.products.where((p) {
    if (filters.search.isNotEmpty) {
      final q = filters.search.toLowerCase();
      final matchesCode = p.code.toLowerCase().contains(q);
      final matchesName = p.name.toLowerCase().contains(q);
      final matchesCategory = p.category.toLowerCase().contains(q);
      final matchesSupplier = (p.supplierName ?? '').toLowerCase().contains(q);
      if (!matchesCode && !matchesName && !matchesCategory && !matchesSupplier) {
        return false;
      }
    }
    if (filters.categoryId != null && filters.categoryId!.isNotEmpty) {
      if (p.categoryId != filters.categoryId) return false;
    }
    if (filters.supplierId != null && filters.supplierId!.isNotEmpty) {
      if (p.supplierId != filters.supplierId) return false;
    }
    if (filters.stockFilter == 'low-stock') {
      if (p.stock > p.minimumStock) return false;
    } else if (filters.stockFilter == 'normal-stock') {
      if (p.stock <= p.minimumStock) return false;
    }
    return true;
  }).length;
});

class InventoryFilters {
  const InventoryFilters({
    this.search = '',
    this.categoryId,
    this.supplierId,
    this.stockFilter = 'all',
    this.currentPage = 1,
    this.pageSize = 10,
  });

  final String search;
  final String? categoryId;
  final String? supplierId;
  final String stockFilter;
  final int currentPage;
  final int pageSize;

  InventoryFilters copyWith({
    String? search,
    String? categoryId,
    String? supplierId,
    String? stockFilter,
    int? currentPage,
    int? pageSize,
  }) {
    return InventoryFilters(
      search: search ?? this.search,
      categoryId: categoryId ?? this.categoryId,
      supplierId: supplierId ?? this.supplierId,
      stockFilter: stockFilter ?? this.stockFilter,
      currentPage: currentPage ?? this.currentPage,
      pageSize: pageSize ?? this.pageSize,
    );
  }
}
