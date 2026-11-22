import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/quotations_model.dart';
import '../providers/quotations_provider.dart';
import 'send_supplier_requests_screen.dart';

class QuotationDetailScreen extends ConsumerWidget {
  const QuotationDetailScreen({required this.quotationId, super.key});

  final String quotationId;

  Color _quotationStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.amber;
      case 'accepted':
        return Colors.green;
      case 'expired':
        return Colors.red;
      case 'solicitado':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  Color _requestStatusColor(String status) {
    switch (status) {
      case 'enviado':
      case 'pending':
        return Colors.amber;
      case 'respondido':
      case 'responded':
        return Colors.green;
      case 'rechazado':
      case 'rejected':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

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

  void _convertToSale(BuildContext context, WidgetRef ref, Quotation quotation) async {
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
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cotización convertida a venta')),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  void _sendSupplierRequests(BuildContext context, WidgetRef ref, Quotation quotation) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (ctx) => SendSupplierRequestsScreen(quotationId: quotation.id)),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncValue = ref.watch(quotationDetailProvider(quotationId));
    final requestsAsync = ref.watch(supplierRequestsProvider(quotationId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalle de cotización'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              final asyncData = asyncValue.valueOrNull;
              if (asyncData == null) return;
              if (value == 'convert' && asyncData.isPending) {
                _convertToSale(context, ref, asyncData);
              } else if (value == 'send' && asyncData.isPending) {
                _sendSupplierRequests(context, ref, asyncData);
              }
            },
            itemBuilder: (context) {
              final asyncData = asyncValue.valueOrNull;
              if (asyncData == null) return [];
              final items = <PopupMenuEntry<String>>[];
              if (asyncData.isPending) {
                items.add(const PopupMenuItem(value: 'convert', child: Text('Convertir a venta')));
                items.add(const PopupMenuItem(value: 'send', child: Text('Enviar a proveedores')));
              }
              return items;
            },
          ),
        ],
      ),
      body: asyncValue.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (quotation) => _buildDetail(context, ref, quotation, requestsAsync),
      ),
    );
  }

  Widget _buildDetail(
    BuildContext context,
    WidgetRef ref,
    Quotation quotation,
    AsyncValue<List<SupplierRequestResponse>> requestsAsync,
  ) {
    final theme = Theme.of(context);

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
                      Icon(Icons.description, color: _quotationStatusColor(quotation.status)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(quotation.clientName, style: theme.textTheme.titleLarge),
                      ),
                      Chip(
                        label: Text(
                          quotation.statusLabel,
                          style: const TextStyle(fontSize: 12, color: Colors.white),
                        ),
                        backgroundColor: _quotationStatusColor(quotation.status),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _infoRow(Icons.person, 'Vendedor', quotation.sellerName),
                  _infoRow(Icons.calendar_today, 'Fecha', _formatDate(quotation.date)),
                  _infoRow(Icons.schedule, 'Válida hasta', _formatDate(quotation.validUntil)),
                  if (quotation.convertedToSaleId != null)
                    _infoRow(Icons.receipt_long, 'Convertida en venta', 'Sí'),
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
                  _summaryRow('Subtotal', _formatCurrency(quotation.subtotal)),
                  if (quotation.discount > 0)
                    _summaryRow('Descuento', '-${_formatCurrency(quotation.discount)}'),
                  if (quotation.tax > 0) _summaryRow('Impuesto', _formatCurrency(quotation.tax)),
                  _summaryRow('Total', _formatCurrency(quotation.total), bold: true),
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
                  Text('Items (${quotation.items.length})', style: theme.textTheme.titleMedium),
                  const Divider(),
                  ...quotation.items.map((item) => _buildItemRow(item)),
                  const Divider(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        'Total: ${_formatCurrency(quotation.total)}',
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
          if (quotation.notes != null && quotation.notes!.isNotEmpty) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Notas', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text(quotation.notes!, style: theme.textTheme.bodyMedium),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Supplier requests section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text('Solicitudes a proveedores', style: theme.textTheme.titleMedium),
                      const Spacer(),
                      if (quotation.isPending)
                        TextButton.icon(
                          onPressed: () => _sendSupplierRequests(context, ref, quotation),
                          icon: const Icon(Icons.send, size: 18),
                          label: const Text('Enviar'),
                        ),
                    ],
                  ),
                  const Divider(),
                  requestsAsync.when(
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (e, _) => Text('Error: $e'),
                    data: (requests) {
                      if (requests.isEmpty) {
                        return const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Center(child: Text('Sin solicitudes enviadas')),
                        );
                      }
                      return Column(
                        children: requests.map((req) {
                          return ListTile(
                            dense: true,
                            leading: Icon(Icons.business, color: _requestStatusColor(req.status)),
                            title: Text(req.supplierName),
                            subtitle: Text(
                              'Enviada: ${_formatDate(req.sentAt)}',
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                            trailing: Chip(
                              label: Text(
                                req.statusLabel,
                                style: const TextStyle(fontSize: 11),
                              ),
                              backgroundColor: _requestStatusColor(req.status),
                              labelStyle: const TextStyle(color: Colors.white),
                            ),
                          );
                        }).toList(),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
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

  Widget _summaryRow(String label, String value, {bool bold = false}) {
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
              color: bold ? Colors.green : null,
              fontSize: bold ? 18 : 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemRow(QuotationItemDetail item) {
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
