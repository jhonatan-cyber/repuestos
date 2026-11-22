import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../clients/presentation/providers/clients_provider.dart';
import '../../../products/data/product_model.dart';
import '../../../products/presentation/providers/products_provider.dart';
import '../../data/quotations_model.dart';
import '../providers/quotations_provider.dart';
import 'quotation_detail_screen.dart';

class QuotationsScreen extends ConsumerStatefulWidget {
  const QuotationsScreen({super.key});

  @override
  ConsumerState<QuotationsScreen> createState() => _QuotationsScreenState();
}

class _QuotationsScreenState extends ConsumerState<QuotationsScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _createQuotation() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => const _CreateQuotationSheet(),
    );
  }

  void _navigateToDetail(Quotation quotation) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (ctx) => QuotationDetailScreen(quotationId: quotation.id)),
    );
  }

  void _convertToSale(Quotation quotation) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Convertir a venta'),
        content: Text('¿Convertir la cotización de ${quotation.clientName} en una venta?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Convertir'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await ref.read(quotationsRepositoryProvider).convert(quotation.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cotización convertida a venta')),
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
    final async = ref.watch(quotationsProvider(_query));
    return Scaffold(
      appBar: AppBar(title: const Text('Cotizaciones')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchCtrl,
              decoration: const InputDecoration(
                labelText: 'Buscar por cliente',
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
              data: (quotations) {
                if (quotations.isEmpty) {
                  return const Center(child: Text('Sin cotizaciones'));
                }
                return ListView.builder(
                  itemCount: quotations.length,
                  itemBuilder: (context, i) {
                    final q = quotations[i];
                    Color statusColor;
                    String statusLabel;
                    if (q.isPending) {
                      statusColor = Colors.amber;
                      statusLabel = 'Pendiente';
                    } else if (q.isAccepted) {
                      statusColor = Colors.green;
                      statusLabel = 'Aceptada';
                    } else {
                      statusColor = Colors.red;
                      statusLabel = 'Expirada';
                    }
                    return ListTile(
                      onTap: () => _navigateToDetail(q),
                      leading: CircleAvatar(
                        backgroundColor: Colors.amber,
                        child: const Icon(Icons.description, color: Colors.white),
                      ),
                      title: Text(q.clientName),
                      subtitle: Text(
                        '${q.items.length} items${q.date.isNotEmpty ? ' • ${q.date}' : ''}',
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Chip(
                            label: Text(
                              statusLabel,
                              style: const TextStyle(fontSize: 11),
                            ),
                            backgroundColor: statusColor,
                            labelStyle: const TextStyle(color: Colors.white),
                          ),
                          if (q.isPending)
                            IconButton(
                              icon: const Icon(Icons.check_circle, size: 24),
                              tooltip: 'Convertir a venta',
                              onPressed: () => _convertToSale(q),
                            ),
                        ],
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 4,
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
        onPressed: _createQuotation,
        icon: const Icon(Icons.add),
        label: const Text('Nueva cotización'),
      ),
    );
  }
}

class _CreateQuotationSheet extends ConsumerStatefulWidget {
  const _CreateQuotationSheet();

  @override
  ConsumerState<_CreateQuotationSheet> createState() => _CreateQuotationSheetState();
}

class _CreateQuotationSheetState extends ConsumerState<_CreateQuotationSheet> {
  String? _selectedClientId;
  final List<QuotationItem> _items = [];
  final _notesCtrl = TextEditingController();
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
    final price = num.tryParse(_priceCtrl.text) ?? product.salePrice;
    setState(() {
      _items.add(QuotationItem(
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
    if (_selectedClientId == null || _items.isEmpty) return;

    final request = QuotationRequest(
      clientId: _selectedClientId!,
      items: _items,
      notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
    );

    try {
      await ref.read(quotationsRepositoryProvider).create(request);
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cotización creada')),
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
    final clientsAsync = ref.watch(clientsProvider(''));
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
            Text('Nueva cotización', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 16),

            // Client selector
            Text('Cliente', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: 8),
            clientsAsync.when(
              loading: () => const CircularProgressIndicator(),
              error: (e, _) => Text('Error: $e'),
              data: (clients) {
                if (clients.isEmpty) {
                  return const Text('Sin clientes disponibles');
                }
                return DropdownButtonFormField<String>(
                  initialValue: _selectedClientId,
                  decoration: const InputDecoration(border: OutlineInputBorder()),
                  items: clients.map((c) {
                    return DropdownMenuItem(value: c.id, child: Text(c.name));
                  }).toList(),
                  onChanged: (v) => setState(() => _selectedClientId = v),
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

            // Product list
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
                        subtitle: Text('Stock: ${p.stock} • \$${p.salePrice}'),
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
              for (final entry in _items.asMap().entries)
                ListTile(
                  dense: true,
                  title: Text(entry.value.name),
                  subtitle: Text('${entry.value.quantity} x \$${entry.value.unitPrice}'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '\$${entry.value.subtotal.toStringAsFixed(0)}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, size: 20),
                        onPressed: () => _removeItem(entry.key),
                      ),
                    ],
                  ),
                ),
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
                onPressed: (_selectedClientId != null && _items.isNotEmpty) ? _submit : null,
                child: const Text('Crear cotización'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
