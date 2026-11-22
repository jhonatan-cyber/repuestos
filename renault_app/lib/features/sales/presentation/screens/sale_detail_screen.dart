import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../features/printing/ticket_formatter.dart';
import '../../../../features/printing/printer_provider.dart';
import '../../data/sales_model.dart';
import '../providers/sales_provider.dart';

class SaleDetailScreen extends ConsumerWidget {
  const SaleDetailScreen({required this.saleId, super.key});

  final String saleId;

  Future<void> _cancelSale(WidgetRef ref, BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancelar venta'),
        content: const Text(
          '¿Estás seguro de que querés cancelar esta venta? Se restaurará el stock de los productos.',
        ),
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
            child: const Text('Sí, cancelar'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ref.read(salesRepositoryProvider).cancelSale(saleId);
      if (context.mounted) {
        ref.invalidate(saleDetailProvider(saleId));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Venta cancelada')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  void _shareSale(Sale sale) {
    final ticketText = TicketFormatter.formatTicket(
      companyName: 'Renault Reluz',
      saleNumber: sale.id,
      date: sale.date.split('T')[0],
      clientName: sale.clientName,
      sellerName: sale.sellerName,
      items: sale.items.map((item) => {
            'productName': item.productName,
            'quantity': item.quantity,
            'price': item.price.toDouble(),
            'subtotal': item.subtotal.toDouble(),
          }).toList(),
      subtotal: sale.subtotal.toDouble(),
      discount: sale.discount.toDouble(),
      total: sale.total.toDouble(),
      paymentMethod: sale.paymentMethod,
      notes: sale.notes,
    );
    Share.share(ticketText, subject: 'Ticket de Venta ${sale.id}');
  }

  Future<void> _printTicket(Sale sale, WidgetRef ref, BuildContext context) async {
    final printerState = ref.read(printerProvider);
    if (printerState == null) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No hay impresora conectada'),
            backgroundColor: Colors.orange,
          ),
        );
      }
      return;
    }

    // The printer provider is a stub — actual printing requires native Bluetooth
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Impresión Bluetooth requiere dispositivo físico'),
          backgroundColor: Colors.blue,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final saleAsync = ref.watch(saleDetailProvider(saleId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalle de Venta'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () {
              final sale = saleAsync.valueOrNull;
              if (sale != null) {
                _shareSale(sale);
              }
            },
            tooltip: 'Compartir ticket',
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              final sale = saleAsync.valueOrNull;
              if (sale == null) return;

              if (value == 'cancel') {
                _cancelSale(ref, context);
              } else if (value == 'print') {
                _printTicket(sale, ref, context);
              }
            },
            itemBuilder: (context) {
              final sale = saleAsync.valueOrNull;
              return [
                PopupMenuItem(
                  value: 'print',
                  child: Row(
                    children: [
                      const Icon(Icons.print, size: 20),
                      const SizedBox(width: 8),
                      const Text('Imprimir ticket'),
                    ],
                  ),
                ),
                if (sale != null && !sale.isCanceled)
                  const PopupMenuItem(
                    value: 'cancel',
                    child: Row(
                      children: [
                        Icon(Icons.cancel, color: Colors.red, size: 20),
                        SizedBox(width: 8),
                        Text('Cancelar venta'),
                      ],
                    ),
                  ),
              ];
            },
          ),
        ],
      ),
      body: saleAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (sale) => _buildDetail(context, sale),
      ),
    );
  }

  Widget _buildDetail(BuildContext context, Sale sale) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Estado de la venta
        _buildStatusCard(context, sale),
        const SizedBox(height: 16),

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
                _buildInfoRow('Cliente', sale.clientName),
                _buildInfoRow('Vendedor', sale.sellerName),
                _buildInfoRow('Fecha', sale.date.split('T')[0]),
                _buildInfoRow('Método de pago', sale.paymentMethodLabel),
                if (sale.notes != null) _buildInfoRow('Notas', sale.notes!),
                if (sale.signature != null) ...[
                  const SizedBox(height: 8),
                  const Divider(),
                  const Text('Firma del cliente'),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.memory(
                      base64Decode(sale.signature!),
                      height: 100,
                      errorBuilder: (ctx, err, _) => const Text(
                        'Error al cargar la firma',
                        style: TextStyle(color: Colors.red),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Items
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Productos (${sale.items.length})',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Divider(),
                ...sale.items.map((item) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.productName,
                              style: const TextStyle(fontWeight: FontWeight.w500),
                            ),
                            Text(
                              '${item.quantity} x \$${item.price.toStringAsFixed(0)}',
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '\$${item.subtotal.toStringAsFixed(0)}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                )),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Totales
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildTotalRow('Subtotal', sale.subtotal),
                if (sale.discount > 0)
                  _buildTotalRow(
                    'Descuento',
                    -sale.discount,
                    color: Colors.red,
                  ),
                const Divider(),
                _buildTotalRow(
                  'Total',
                  sale.total,
                  bold: true,
                  large: true,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatusCard(BuildContext context, Sale sale) {
    final isCanceled = sale.isCanceled;
    return Card(
      color: isCanceled
          ? Colors.red.withValues(alpha: 0.05)
          : Colors.green.withValues(alpha: 0.05),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(
              isCanceled ? Icons.cancel : Icons.check_circle,
              color: isCanceled ? Colors.red : Colors.green,
              size: 32,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isCanceled ? 'Venta cancelada' : 'Venta completada',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: isCanceled ? Colors.red : Colors.green,
                    ),
                  ),
                  Text(
                    isCanceled
                        ? 'Esta venta fue anulada y el stock fue restaurado'
                        : 'La venta se completó exitosamente',
                    style: const TextStyle(fontSize: 13),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildTotalRow(
    String label,
    num value, {
    bool bold = false,
    bool large = false,
    Color? color,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: bold ? FontWeight.bold : null,
              fontSize: large ? 18 : 14,
              color: color ?? (value < 0 ? Colors.red : null),
            ),
          ),
          Text(
            '\$${value.toStringAsFixed(0)}',
            style: TextStyle(
              fontWeight: bold ? FontWeight.bold : null,
              fontSize: large ? 18 : 14,
              color: color ?? (value < 0 ? Colors.red : null),
            ),
          ),
        ],
      ),
    );
  }
}
