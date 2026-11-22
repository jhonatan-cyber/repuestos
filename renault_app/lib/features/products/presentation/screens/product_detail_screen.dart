import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/product_model.dart';
import '../providers/products_provider.dart';
import 'product_form_screen.dart';

class ProductDetailScreen extends ConsumerWidget {
  const ProductDetailScreen({required this.product, super.key});

  final Product product;

  Future<void> _deleteProduct(WidgetRef ref, BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Eliminar producto'),
        content: Text('¿Estás seguro de que querés eliminar "${product.name}"? Esta acción no se puede deshacer.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('No'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Sí, eliminar'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ref.read(productRepositoryProvider).delete(product.id);
      if (context.mounted) {
        ref.invalidate(productsProvider(''));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Producto eliminado')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _editProduct(BuildContext context, WidgetRef ref) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (ctx) => ProductFormScreen(product: product),
      ),
    );
    if (result == true && context.mounted) {
      ref.invalidate(productsProvider(''));
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profit = product.salePrice - product.purchasePrice;
    final margin = product.purchasePrice > 0
        ? ((profit / product.purchasePrice) * 100)
        : 0.0;

    String stockStatus;
    Color stockColor;
    if (product.stock <= 0) {
      stockStatus = 'Agotado';
      stockColor = Colors.red;
    } else if (product.isLowStock) {
      stockStatus = 'Stock bajo';
      stockColor = Colors.orange;
    } else {
      stockStatus = 'Disponible';
      stockColor = Colors.green;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(product.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () => _editProduct(context, ref),
            tooltip: 'Editar',
          ),
          IconButton(
            icon: const Icon(Icons.delete, color: Colors.red),
            onPressed: () => _deleteProduct(ref, context),
            tooltip: 'Eliminar',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Imagen del producto
          if (product.hasImage)
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: product.imageBytes != null && product.imageBytes!.isNotEmpty
                  ? Image.memory(
                      base64Decode(product.imageBytes!),
                      height: 200,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (ctx, err, _) => _buildImagePlaceholder(),
                    )
                  : Image.network(
                      product.image ?? '',
                      height: 200,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (ctx, err, _) => _buildImagePlaceholder(),
                    ),
            ),
          if (product.hasImage) const SizedBox(height: 16),
          // Estado del producto
          const SizedBox(height: 20),

          // Información general
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Información',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const Divider(),
                  _buildRow('Código', product.code),
                  _buildRow('Nombre', product.name),
                  if (product.description != null)
                    _buildRow('Descripción', product.description!),
                  if (product.category.isNotEmpty)
                    _buildRow('Categoría', product.category),
                  if (product.brand.isNotEmpty)
                    _buildRow('Marca', product.brand),
                  if (product.model.isNotEmpty)
                    _buildRow('Modelo', product.model),
                  _buildRow('Unidad', product.unit),
                  if (product.supplierName != null)
                    _buildRow('Proveedor', product.supplierName!),
                  _buildRow(
                    'Estado',
                    product.status == 'active' ? 'Activo' : 'Inactivo',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Precios
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Precios',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const Divider(),
                  _buildRow('Precio de compra', '\$${product.purchasePrice}'),
                  _buildRow(
                    'Precio de venta',
                    '\$${product.salePrice}',
                    valueStyle: const TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  _buildRow('Margen de ganancia', '\$${profit.toStringAsFixed(0)} (${margin.toStringAsFixed(1)}%)'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Stock
          Card(
            color: stockColor.withValues(alpha: 0.05),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Stock',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const Divider(),
                  Row(
                    children: [
                      Icon(
                        product.stock <= 0
                            ? Icons.warning
                            : product.isLowStock
                                ? Icons.warning_amber
                                : Icons.check_circle,
                        color: stockColor,
                        size: 32,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              stockStatus,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: stockColor,
                              ),
                            ),
                            Text(
                              'Stock actual: ${product.stock} ${product.unit}s',
                              style: const TextStyle(fontSize: 14),
                            ),
                            Text(
                              'Stock mínimo: ${product.minimumStock} ${product.unit}s',
                              style: const TextStyle(fontSize: 13, color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value, {TextStyle? valueStyle}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Expanded(
            child: Text(
              value,
              style: valueStyle ?? const TextStyle(fontWeight: FontWeight.w500),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImagePlaceholder() {
    return Container(
      height: 200,
      color: Colors.grey[200],
      child: const Icon(Icons.image_not_supported, size: 64),
    );
  }
}
