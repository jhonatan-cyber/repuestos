import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../features/products/data/product_model.dart';
import '../../../../features/products/presentation/screens/product_detail_screen.dart';
import '../../../../features/products/presentation/screens/product_form_screen.dart';
import '../../data/inventory_model.dart';
import '../providers/inventory_provider.dart';

class InventoryScreen extends ConsumerWidget {
  const InventoryScreen({super.key});

  void _createProduct(BuildContext context, WidgetRef ref) {
    Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (ctx) => const ProductFormScreen()),
    ).then((result) {
      if (result == true) {
        ref.invalidate(inventoryProvider);
      }
    });
  }

  void _navigateToDetail(BuildContext context, Product product) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (ctx) => ProductDetailScreen(product: product)),
    );
  }

  String _formatCurrency(num value) {
    return '\$${value.toStringAsFixed(2)}';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inventoryAsync = ref.watch(inventoryProvider);
    final filters = ref.watch(inventoryFiltersProvider);
    final filteredProducts = ref.watch(filteredProductsProvider);
    final filteredCount = ref.watch(filteredCountProvider);
    final totalPages = (filteredCount / filters.pageSize).ceil();

    return Scaffold(
      appBar: AppBar(title: const Text('Inventario')),
      body: inventoryAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (data) => _buildBody(context, ref, data.stats, data.categories, data.suppliers, filteredProducts, filters, totalPages, filteredCount),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _createProduct(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Nuevo'),
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    WidgetRef ref,
    InventoryStats stats,
    List<dynamic> categories,
    List<dynamic> suppliers,
    List<Product> products,
    InventoryFilters filters,
    int totalPages,
    int filteredCount,
  ) {
    final theme = Theme.of(context);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stats cards
          _buildStatsGrid(context, stats),
          const SizedBox(height: 16),

          // Search
          TextField(
            decoration: InputDecoration(
              labelText: 'Buscar',
              prefixIcon: const Icon(Icons.search),
              border: const OutlineInputBorder(),
              suffixIcon: filters.search.isNotEmpty
                  ? IconButton(icon: const Icon(Icons.clear), onPressed: () => ref.read(inventoryFiltersProvider.notifier).setSearch(''))
                  : null,
            ),
            onChanged: (v) {
              ref.read(inventoryFiltersProvider.notifier).setSearch(v);
            },
          ),
          const SizedBox(height: 12),

          // Category and Supplier filters
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: filters.categoryId,
                  decoration: const InputDecoration(labelText: 'Categoría', border: OutlineInputBorder()),
                  hint: const Text('Todas'),
                  items: [
                    for (final c in categories)
                      DropdownMenuItem(value: c.id, child: Text(c.name)),
                  ],
                  onChanged: (v) {
                    ref.read(inventoryFiltersProvider.notifier).setCategory(v);
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: filters.supplierId,
                  decoration: const InputDecoration(labelText: 'Proveedor', border: OutlineInputBorder()),
                  hint: const Text('Todos'),
                  items: [
                    for (final s in suppliers)
                      DropdownMenuItem(value: s.id, child: Text(s.name)),
                  ],
                  onChanged: (v) {
                    ref.read(inventoryFiltersProvider.notifier).setSupplier(v);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Stock filter chips
          Wrap(
            spacing: 8,
            children: [
              _StockChip(label: 'Todos', value: 'all', selected: filters.stockFilter == 'all', onTap: () => ref.read(inventoryFiltersProvider.notifier).setStock('all')),
              _StockChip(label: 'Stock bajo', value: 'low-stock', selected: filters.stockFilter == 'low-stock', onTap: () => ref.read(inventoryFiltersProvider.notifier).setStock('low-stock')),
              _StockChip(label: 'Normal', value: 'normal-stock', selected: filters.stockFilter == 'normal-stock', onTap: () => ref.read(inventoryFiltersProvider.notifier).setStock('normal-stock')),
            ],
          ),
          const SizedBox(height: 12),

          // Filtered count
          Text(
            '$filteredCount productos encontrados',
            style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
          ),
          const SizedBox(height: 8),

          // Product list
          ...products.map((p) => _buildProductCard(context, ref, p)),
          if (products.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: Center(child: Text('No hay productos que coincidan con los filtros')),
            ),

          // Pagination
          if (totalPages > 1)
            _buildPagination(context, ref, filters.currentPage, totalPages),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(BuildContext context, InventoryStats stats) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.3,
      children: [
        _StatCard(icon: Icons.inventory_2, label: 'Productos', value: '${stats.totalProducts}', color: Colors.blue),
        _StatCard(icon: Icons.warning_amber, label: 'Stock bajo', value: '${stats.lowStockCount}', color: Colors.orange),
        _StatCard(icon: Icons.attach_money, label: 'Costo', value: _formatCurrency(stats.inventoryCost), color: Colors.red),
        _StatCard(icon: Icons.trending_up, label: 'Valor', value: _formatCurrency(stats.inventoryValue), color: Colors.green),
      ],
    );
  }

  Widget _buildProductCard(BuildContext context, WidgetRef ref, Product p) {
    final isLowStock = p.stock <= p.minimumStock;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: () => _navigateToDetail(context, p),
        leading: CircleAvatar(
          backgroundColor: isLowStock ? Colors.orange : Colors.green,
          child: Text('${p.stock}', style: const TextStyle(color: Colors.white)),
        ),
        title: Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text('${p.code} · ${p.category.isEmpty ? 'Sin categoría' : p.category}'),
        trailing: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(_formatCurrency(p.salePrice), style: const TextStyle(fontWeight: FontWeight.bold)),
            if (isLowStock)
              const Text('Stock bajo', style: TextStyle(color: Colors.orange, fontSize: 11)),
          ],
        ),
      ),
    );
  }

  Widget _buildPagination(BuildContext context, WidgetRef ref, int current, int total) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          icon: const Icon(Icons.chevron_left),
          onPressed: current > 1
              ? () => ref.read(inventoryFiltersProvider.notifier).setPage(current - 1)
              : null,
        ),
        Text('$current / $total'),
        IconButton(
          icon: const Icon(Icons.chevron_right),
          onPressed: current < total
              ? () => ref.read(inventoryFiltersProvider.notifier).setPage(current + 1)
              : null,
        ),
      ],
    );
  }
}

class _StockChip extends StatelessWidget {
  const _StockChip({required this.label, required this.value, required this.selected, required this.onTap});

  final String label;
  final String value;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.icon, required this.label, required this.value, required this.color});

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
