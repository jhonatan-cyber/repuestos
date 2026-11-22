import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/voice_search_service.dart';
import '../../../../core/widgets/signature_pad.dart';
import '../../../products/data/product_model.dart';
import '../../data/sales_model.dart';
import '../providers/sales_provider.dart';
import 'sales_history_screen.dart';
import 'qr_scanner_screen.dart';

class SalesScreen extends ConsumerStatefulWidget {
  const SalesScreen({super.key});

  @override
  ConsumerState<SalesScreen> createState() => _SalesScreenState();
}

class _SalesScreenState extends ConsumerState<SalesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return NestedScrollView(
      headerSliverBuilder: (context, innerBoxIsScrolled) => [
        SliverAppBar(
          title: const Text('Ventas'),
          bottom: TabBar(
            controller: _tabController,
            tabs: const [
              Tab(text: 'Nueva Venta', icon: Icon(Icons.add_shopping_cart)),
              Tab(text: 'Historial', icon: Icon(Icons.history)),
            ],
          ),
          floating: true,
          snap: true,
        ),
      ],
      body: TabBarView(
        controller: _tabController,
        children: const [
          _PosTab(),
          SalesHistoryScreen(),
        ],
      ),
    );
  }
}

class _PosTab extends ConsumerStatefulWidget {
  const _PosTab();

  @override
  ConsumerState<_PosTab> createState() => _PosTabState();
}

class _PosTabState extends ConsumerState<_PosTab> {
  final _searchCtrl = TextEditingController();
  String _query = '';
  bool _isListening = false;
  final _voiceSearch = VoiceSearchService.instance;

  @override
  void dispose() {
    _searchCtrl.dispose();
    _voiceSearch.stopListening();
    super.dispose();
  }

  void _addToCart(Product product) {
    ref.read(cartProvider.notifier).addItem(product);
  }

  Future<void> _scanQr() async {
    final code = await Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (_) => const QrScannerScreen()),
    );
    if (code != null && code.isNotEmpty && mounted) {
      _searchCtrl.text = code;
      setState(() => _query = code);
    }
  }

  Future<void> _toggleVoiceSearch() async {
    if (_isListening) {
      await _voiceSearch.stopListening();
      setState(() => _isListening = false);
      return;
    }

    setState(() => _isListening = true);

    final success = await _voiceSearch.startListening(
      onResult: (text) {
        if (text.isNotEmpty && mounted) {
          setState(() {
            _searchCtrl.text = text;
            _query = text;
          });
        }
      },
      onError: (error) {
        if (mounted) {
          setState(() => _isListening = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error de voz: $error'),
              backgroundColor: Colors.red,
            ),
          );
        }
      },
      localeId: 'es-AR',
    );

    if (!success && mounted) {
      setState(() => _isListening = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No se pudo acceder al micrófono'),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  void _checkout() {
    final cart = ref.read(cartProvider);
    if (cart.isEmpty) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => _PaymentSheet(cart: cart),
    ).then((_) {
      // Si volvió del sheet, verificar si se completó la venta
    });
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final productsAsync = ref.watch(searchProductsProvider(_query));

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          title: const Text('Nueva Venta'),
          actions: [
            if (!cart.isEmpty)
              Badge(
                label: Text('${cart.totalItems}'),
                child: const Icon(Icons.shopping_cart),
              ),
          ],
          floating: true,
          snap: true,
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                labelText: 'Buscar producto por nombre o código',
                prefixIcon: const Icon(Icons.search),
                border: const OutlineInputBorder(),
                suffixIcon: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: AnimatedIcon(
                        icon: AnimatedIcons.search_ellipsis,
                        progress: AlwaysStoppedAnimation(_isListening ? 1.0 : 0.0),
                        color: _isListening ? Colors.red : null,
                      ),
                      onPressed: _toggleVoiceSearch,
                      tooltip: _isListening ? 'Detener escucha' : 'Buscar por voz',
                    ),
                    IconButton(
                      icon: const Icon(Icons.qr_code_scanner),
                      onPressed: _scanQr,
                      tooltip: 'Escanear código',
                    ),
                  ],
                ),
              ),
              onSubmitted: (v) => setState(() => _query = v.trim()),
            ),
          ),
        ),
        // Lista de productos como sliver
        SliverFillRemaining(
          hasScrollBody: false,
          child: productsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Error: $e')),
            data: (products) {
              if (products.isEmpty) {
                return const Center(child: Text('Sin productos'));
              }
              return ListView.builder(
                physics: const NeverScrollableScrollPhysics(),
                itemCount: products.length,
                itemBuilder: (context, i) {
                  final p = products[i];
                  return ListTile(
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
                          '\$${p.salePrice}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        Text(
                          'Stock: ${p.stock}',
                          style: TextStyle(
                            fontSize: 12,
                            color: p.isLowStock ? Colors.red : null,
                          ),
                        ),
                      ],
                    ),
                    onTap: p.stock > 0 ? () => _addToCart(p) : null,
                    tileColor: p.stock <= 0
                        ? Colors.grey.withValues(alpha: 0.1)
                        : null,
                  );
                },
              );
            },
          ),
        ),
        // Carrito como sliver
        if (!cart.isEmpty)
          SliverToBoxAdapter(
            child: Container(
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Items del carrito
                  SizedBox(
                    height: 120,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      itemCount: cart.items.length,
                      itemBuilder: (context, i) {
                        final item = cart.items[i];
                        return Card(
                          margin: const EdgeInsets.only(
                            top: 8,
                            bottom: 8,
                            right: 8,
                          ),
                          child: SizedBox(
                            width: 140,
                            child: Padding(
                              padding: const EdgeInsets.all(8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    item.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.remove, size: 18),
                                        onPressed: () => ref
                                            .read(cartProvider.notifier)
                                            .updateQuantity(
                                              i,
                                              item.quantity - 1,
                                            ),
                                      ),
                                      Text('${item.quantity}'),
                                      IconButton(
                                        icon: const Icon(Icons.add, size: 18),
                                        onPressed: () => ref
                                            .read(cartProvider.notifier)
                                            .updateQuantity(
                                              i,
                                              item.quantity + 1,
                                            ),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    '\$${item.subtotal}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Align(
                                    alignment: Alignment.topRight,
                                    child: IconButton(
                                      icon: const Icon(Icons.close, size: 16),
                                      onPressed: () => ref
                                          .read(cartProvider.notifier)
                                          .removeItem(i),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                  // Total y botón de pago
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Total',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            Text(
                              '\$${cart.total.toStringAsFixed(2)}',
                              style: Theme.of(context)
                                  .textTheme
                                  .headlineMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Theme.of(context)
                                        .colorScheme
                                        .primary,
                                  ),
                            ),
                          ],
                        ),
                        FilledButton.icon(
                          onPressed: _checkout,
                          icon: const Icon(Icons.payment),
                          label: const Text('Cobrar'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _PaymentSheet extends ConsumerStatefulWidget {
  const _PaymentSheet({required this.cart});

  final dynamic cart;

  @override
  ConsumerState<_PaymentSheet> createState() => _PaymentSheetState();
}

class _PaymentSheetState extends ConsumerState<_PaymentSheet> {
  String? _selectedPayment;
  final _discountCtrl = TextEditingController();
  num _discount = 0;
  bool _processing = false;
  String? _error;
  final _signaturePadKey = GlobalKey();

  @override
  void dispose() {
    _discountCtrl.dispose();
    super.dispose();
  }

  void _completeSale() async {
    if (_selectedPayment == null) return;

    setState(() {
      _processing = true;
      _error = null;
    });

    try {
      // Export signature before sending
      final signatureBase64 = await SignaturePad.export(context);

      final items = widget.cart.items
          .map((i) => SaleItem(
                productId: i.productId,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
              ))
          .toList();

      final request = SaleRequest(
        items: items,
        paymentMethod: _selectedPayment!,
        discount: _discount,
        signature: signatureBase64,
      );

      await ref.read(salesRepositoryProvider).createSale(request);

      if (mounted) {
        // Limpiar carrito
        ref.read(cartProvider.notifier).clear();
        Navigator.pop(context);

        // Mostrar éxito
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Venta completada exitosamente'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _processing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final subtotal = widget.cart.subtotal;
    final total = subtotal - _discount;

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: DraggableScrollableSheet(
        maxChildSize: 0.9,
        initialChildSize: 0.7,
        expand: false,
        builder: (context, scrollController) {
          return Container(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Handle
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  Text(
                    'Método de pago',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),

                  // Métodos de pago
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: paymentMethods.map((method) {
                      final selected = _selectedPayment == method.id;
                      return ChoiceChip(
                        label: Text('${method.icon} ${method.label}'),
                        selected: selected,
                        onSelected: (selected) {
                          setState(() => _selectedPayment = method.id);
                        },
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 20),

                  // Descuento
                  TextField(
                    controller: _discountCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Descuento (\$)',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.percent),
                    ),
                    onChanged: (v) {
                      setState(() {
                        _discount = num.tryParse(v) ?? 0;
                        if (_discount > subtotal) _discount = subtotal;
                      });
                    },
                  ),

                  const SizedBox(height: 20),

                  // Resumen
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Subtotal'),
                              Text('\$${subtotal.toStringAsFixed(2)}'),
                            ],
                          ),
                          if (_discount > 0) ...[
                            const SizedBox(height: 4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Descuento'),
                                Text('-\$${_discount.toStringAsFixed(2)}'),
                              ],
                            ),
                          ],
                          const Divider(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Total',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleLarge
                                    ?.copyWith(fontWeight: FontWeight.bold),
                              ),
                              Text(
                                '\$${total.toStringAsFixed(2)}',
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineSmall
                                    ?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: Theme.of(context)
                                          .colorScheme
                                          .primary,
                                    ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _error!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ],

                  const SizedBox(height: 20),

                  // Firma digital
                  Text(
                    'Firma del cliente',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  SignaturePad(
                    key: _signaturePadKey,
                    height: 150,
                  ),
                  const SizedBox(height: 12),

                  // Botón de confirmar
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: _processing ? null : _completeSale,
                      icon: _processing
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.check),
                      label: Text(_processing ? 'Procesando...' : 'Confirmar venta'),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Cancelar
                  TextButton(
                    onPressed: _processing
                        ? null
                        : () => Navigator.pop(context),
                    child: const Text('Cancelar'),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
