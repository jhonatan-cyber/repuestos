import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/animations/app_animations.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/skeleton_list.dart';
import '../providers/products_provider.dart';
import 'product_detail_screen.dart';
import 'product_form_screen.dart';

class ProductsScreen extends ConsumerStatefulWidget {
  const ProductsScreen({this.category, super.key});

  final String? category;

  @override
  ConsumerState<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends ConsumerState<ProductsScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void initState() {
    super.initState();
    if (widget.category != null) {
      _query = widget.category!;
      _searchCtrl.text = widget.category!;
    }
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _createProduct() async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (ctx) => const ProductFormScreen(),
      ),
    );
    if (result == true && mounted) {
      ref.invalidate(productsProvider(''));
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(productsProvider(_query));
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.category ?? 'Productos'),
        leading: widget.category != null
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => Navigator.of(context).pop(),
              )
            : null,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchCtrl,
              decoration: const InputDecoration(
                labelText: 'Buscar por nombre o código',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onSubmitted: (v) => setState(() => _query = v.trim()),
            ),
          ),
          Expanded(
            child: async.when(
              loading: () => const SkeletonList(count: 8),
              error: (e, _) => Center(child: Text('Error: $e')),
              data: (products) {
                if (products.isEmpty) {
                  return const EmptyState(
                    icon: Icons.inventory_2_outlined,
                    title: 'Sin productos',
                    description: 'No hay productos para mostrar',
                  );
                }
                return ListView.builder(
                  itemCount: products.length,
                  itemBuilder: (context, i) {
                    final p = products[i];
                    return FadeInList(
                      children: [
                        ListTile(
                          leading: CircleAvatar(
                            backgroundColor: p.isLowStock
                                ? Colors.red.withValues(alpha: 0.1)
                                : Theme.of(context).colorScheme.primaryContainer,
                            child: Text(
                              p.code.isEmpty ? p.name[0].toUpperCase() : p.code[0],
                              style: TextStyle(
                                color: p.isLowStock ? Colors.red : null,
                              ),
                            ),
                          ),
                          title: Text(p.name, maxLines: 1),
                          subtitle: Text('${p.code} • ${p.category}'),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                'Stock: ${p.stock}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: p.isLowStock ? Colors.red : null,
                                ),
                              ),
                              Text(
                                '\$${p.salePrice}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                          tileColor: p.isLowStock
                              ? Colors.red.withValues(alpha: 0.08)
                              : null,
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (ctx) => ProductDetailScreen(product: p),
                              ),
                            );
                          },
                        ),
                      ],
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _createProduct,
        icon: const Icon(Icons.add),
        label: const Text('Nuevo'),
      ),
    );
  }
}
