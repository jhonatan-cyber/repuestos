import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../products/data/product_model.dart';
import '../../../products/presentation/providers/products_provider.dart';
import '../../../suppliers/presentation/providers/suppliers_provider.dart';
import '../../data/purchases_model.dart';
import '../providers/purchases_provider.dart';
import 'purchase_detail_screen.dart';

class PurchasesScreen extends ConsumerStatefulWidget {
  const PurchasesScreen({super.key});

  @override
  ConsumerState<PurchasesScreen> createState() => _PurchasesScreenState();
}

class _PurchasesScreenState extends ConsumerState<PurchasesScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _createPurchase() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => const _CreatePurchaseSheet(),
    );
  }

  void _navigateToDetail(Purchase purchase) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (ctx) => PurchaseDetailScreen(purchaseId: purchase.id)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(purchasesProvider(_query));
    return Scaffold(
      appBar: AppBar(title: const Text('Compras')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchCtrl,
              decoration: const InputDecoration(
                labelText: 'Buscar por proveedor',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onSubmitted: (v) => setState(() => _query = v.trim()),
            ),
          ),
          Expanded(
            child: async.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e')),
              data: (purchases) {
                if (purchases.isEmpty) {
                  return const Center(child: Text('Sin compras'));
                }
                return ListView.builder(
                  itemCount: purchases.length,
                  itemBuilder: (context, i) {
                    final p = purchases[i];
                    return ListTile(
                      onTap: () => _navigateToDetail(p),
                      leading: CircleAvatar(
                        backgroundColor: Colors.teal,
                        child: const Icon(Icons.shopping_cart, color: Colors.white),
                      ),
                      title: Text(p.supplierName),
                      subtitle: Text(
                        '${p.items.length} items • ${p.paymentMethodLabel}',
                      ),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '\$${p.total.toStringAsFixed(0)}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          if (p.date.isNotEmpty)
                            Text(
                              p.date,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _createPurchase,
        icon: const Icon(Icons.add),
        label: const Text('Nueva compra'),
      ),
    );
  }
}

class _CreatePurchaseSheet extends ConsumerStatefulWidget {
  const _CreatePurchaseSheet();

  @override
  ConsumerState<_CreatePurchaseSheet> createState() => _CreatePurchaseSheetState();
}

class _CreatePurchaseSheetState extends ConsumerState<_CreatePurchaseSheet> {
  String? _selectedSupplierId;
  final List<PurchaseItem> _items = [];
  final _notesCtrl = TextEditingController();
  String _paymentMethod = 'cash';
  final _quantityCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  String _productSearch = '';

  @override
  void dispose() {
    _notesCtrl.dispose();
    _quantityCtrl.dispose();
    _priceCtrl.dispose();
    super.dispose();
  }

  void _addProduct(Product product) {
    final qty = int.tryParse(_quantityCtrl.text) ?? 1;
    final price = num.tryParse(_priceCtrl.text) ?? product.purchasePrice;
    setState(() {
      _items.add(PurchaseItem(
        productId: product.id,
        name: product.name,
        quantity: qty,
        unitPrice: price,
      ));
    });
    _quantityCtrl.clear();
    _priceCtrl.clear();
  }

  void _removeItem(int index) {
    setState(() => _items.removeAt(index));
  }

  num get _total => _items.fold(0, (sum, item) => sum + item.subtotal);

  Future<void> _submit() async {
    if (_selectedSupplierId == null || _items.isEmpty) return;

    final request = PurchaseRequest(
      supplierId: _selectedSupplierId!,
      items: _items,
      paymentMethod: _paymentMethod,
      totalPaid: _total,
      notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
    );

    try {
      await ref.read(purchasesRepositoryProvider).create(request);
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Compra registrada')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final suppliersAsync = ref.watch(suppliersProvider(''));
    final productsAsync = ref.watch(productsProvider(_productSearch));

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Nueva compra', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 16),

            // Supplier selector
            Text('Proveedor', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: 8),
            suppliersAsync.when(
              loading: () => const CircularProgressIndicator(),
              error: (e, _) => Text('Error: $e'),
              data: (suppliers) {
                if (suppliers.isEmpty) {
                  return const Text('Sin proveedores disponibles');
                }
                return DropdownButtonFormField<String>(
                  initialValue: _selectedSupplierId,
                  decoration: const InputDecoration(border: OutlineInputBorder()),
                  items: suppliers.map((s) {
                    return DropdownMenuItem(value: s.id, child: Text(s.name));
                  }).toList(),
                  onChanged: (v) => setState(() => _selectedSupplierId = v),
                );
              },
            ),
            const SizedBox(height: 16),

            // Product search
            TextField(
              decoration: InputDecoration(
                labelText: 'Buscar producto',
                prefixIcon: const Icon(Icons.search),
                border: const OutlineInputBorder(),
                suffixIcon: _productSearch.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () => setState(() => _productSearch = ''),
                      )
                    : null,
              ),
              onChanged: (v) => setState(() => _productSearch = v),
            ),
            const SizedBox(height: 8),

            // Product list (limited)
            productsAsync.when(
              loading: () => const CircularProgressIndicator(),
              error: (e, _) => Text('Error: $e'),
              data: (products) {
                final shown = products.take(10).toList();
                if (shown.isEmpty) return const Text('Sin productos');
                return SizedBox(
                  height: 150,
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: shown.length,
                    itemBuilder: (context, i) {
                      final p = shown[i];
                      return ListTile(
                        title: Text(p.name),
                        subtitle: Text('Stock: ${p.stock} • \$${p.purchasePrice}'),
                        onTap: () => _addProduct(p),
                      );
                    },
                  ),
                );
              },
            ),
            const SizedBox(height: 12),

            // Item inputs
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _quantityCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Cantidad',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _priceCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Precio unit.',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Items list
            if (_items.isNotEmpty) ...[
              Text('Items (${_items.length})', style: Theme.of(context).textTheme.labelMedium),
              const SizedBox(height: 4),
              ..._items.asMap().entries.map((entry) {
                final idx = entry.key;
                final item = entry.value;
                return ListTile(
                  dense: true,
                  title: Text(item.name),
                  subtitle: Text('${item.quantity} x \$${item.unitPrice}'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '\$${item.subtotal.toStringAsFixed(0)}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, size: 20),
                        onPressed: () => _removeItem(idx),
                      ),
                    ],
                  ),
                );
              }),
              const Divider(),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    'Total: \$${_total.toStringAsFixed(0)}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 16),

            // Payment method
            Text('Método de pago', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: const [
                'cash', 'card', 'transfer', 'credit'
              ].map((m) => ChoiceChip(
                    label: Text(m == 'cash'
                        ? 'Efectivo'
                        : m == 'card'
                            ? 'Tarjeta'
                            : m == 'transfer'
                                ? 'Transferencia'
                                : 'Crédito'),
                    selected: _paymentMethod == m,
                    onSelected: (v) => setState(() => _paymentMethod = m),
                  )).toList(),
            ),
            const SizedBox(height: 16),

            // Notes
            TextField(
              controller: _notesCtrl,
              decoration: const InputDecoration(
                labelText: 'Notas (opcional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 24),

            // Submit
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: (_selectedSupplierId != null && _items.isNotEmpty) ? _submit : null,
                child: const Text('Registrar compra'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
