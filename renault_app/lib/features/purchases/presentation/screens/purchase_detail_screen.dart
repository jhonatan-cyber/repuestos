import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/purchases_model.dart';
import '../providers/purchases_provider.dart';

class PurchaseDetailScreen extends ConsumerWidget {
  const PurchaseDetailScreen({required this.purchaseId, super.key});

  final String purchaseId;

  String _formatCurrency(num value) {
    return '\$${value.toStringAsFixed(2)}';
  }

  String _formatDate(String dateStr) {
    if (dateStr.isEmpty) return 'Sin fecha';
    try {
      final parts = dateStr.split(' ')[0].split('-');
      if (parts.length == 3) {
        return '${parts[2]}/${parts[1]}/${parts[0]}';
      }
    } catch (_) {}
    return dateStr;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncValue = ref.watch(purchaseDetailProvider(purchaseId));

    return Scaffold(
      appBar: AppBar(title: const Text('Detalle de compra')),
      body: asyncValue.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (purchase) => _buildDetail(context, purchase),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'recibida':
        return Colors.green;
      case 'pendiente':
        return Colors.amber;
      case 'cancelada':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Widget _buildDetail(BuildContext context, Purchase purchase) {
    final theme = Theme.of(context);
    final sColor = _statusColor(purchase.status);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.shopping_cart, color: sColor),
                      const SizedBox(width: 8),
                      Expanded(child: Text(purchase.supplierName, style: theme.textTheme.titleLarge)),
                      Chip(
                        label: Text(
                          purchase.statusLabel,
                          style: const TextStyle(fontSize: 12, color: Colors.white),
                        ),
                        backgroundColor: sColor,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _infoRow(Icons.person, 'Comprador', purchase.buyerName),
                  _infoRow(Icons.calendar_today, 'Fecha', _formatDate(purchase.date)),
                  _infoRow(Icons.payment, 'Pago', purchase.paymentMethodLabel),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Financial summary card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Resumen financiero', style: theme.textTheme.titleMedium),
                  const Divider(),
                  _summaryRow('Subtotal', _formatCurrency(purchase.subtotal)),
                  if (purchase.tax > 0) _summaryRow('Impuesto', _formatCurrency(purchase.tax)),
                  _summaryRow('Total', _formatCurrency(purchase.total), bold: true),
                  const SizedBox(height: 8),
                  _summaryRow('Pago inicial', _formatCurrency(purchase.initialPayment)),
                  if (purchase.initialDebt > 0) ...[
                    _summaryRow('Deuda inicial', _formatCurrency(purchase.initialDebt)),
                    if (purchase.debtAmount > 0)
                      _summaryRow('Saldo de deuda', _formatCurrency(purchase.debtAmount), color: Colors.red),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Items list
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Items (${purchase.items.length})', style: theme.textTheme.titleMedium),
                  const Divider(),
                  ...purchase.items.map((item) => _buildItemRow(item)),
                  const Divider(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        'Total: ${_formatCurrency(purchase.total)}',
                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Notes if exists
          if (purchase.notes != null && purchase.notes!.isNotEmpty) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Notas', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text(purchase.notes!, style: theme.textTheme.bodyMedium),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey),
          const SizedBox(width: 8),
          Text('$label: ', style: const TextStyle(color: Colors.grey)),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, String value, {bool bold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: bold ? null : const TextStyle(color: Colors.grey)),
          Text(
            value,
            style: TextStyle(
              fontWeight: bold ? FontWeight.bold : null,
              color: color ?? (bold ? Colors.green : null),
              fontSize: bold ? 18 : 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemRow(PurchaseItemDetail item) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.productName, style: const TextStyle(fontWeight: FontWeight.w500)),
                Text(
                  '${item.quantity} x ${_formatCurrency(item.price)}',
                  style: const TextStyle(color: Colors.grey, fontSize: 13),
                ),
              ],
            ),
          ),
          Text(
            _formatCurrency(item.subtotal),
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
