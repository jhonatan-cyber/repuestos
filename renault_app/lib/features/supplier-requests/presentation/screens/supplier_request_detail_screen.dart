import 'package:flutter/material.dart';

import '../../data/supplier_request_model.dart';

class SupplierRequestDetailScreen extends StatelessWidget {
  const SupplierRequestDetailScreen({required this.request, super.key});

  final SupplierRequest request;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(request.supplierName)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Estado
          Card(
            color: request.statusColor.withValues(alpha: 0.05),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(
                    request.isPending
                        ? Icons.hourglass_bottom
                        : request.isResponded
                            ? Icons.check_circle
                            : Icons.close,
                    color: request.statusColor,
                    size: 32,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          request.statusLabel,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: request.statusColor,
                          ),
                        ),
                        Text(
                          request.isPending
                              ? 'Esperando respuesta del proveedor'
                              : request.isResponded
                                  ? 'El proveedor respondió a la solicitud'
                                  : 'La solicitud fue rechazada',
                          style: const TextStyle(fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Información
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
                  _buildRow('Proveedor', request.supplierName),
                  _buildRow('Fecha envío', request.sentAt.split('T')[0]),
                  if (request.respondedAt != null)
                    _buildRow('Fecha respuesta', request.respondedAt!.split('T')[0]),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Cotización
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Cotización asociada',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const Divider(),
                  _buildRow('Cliente', request.quotation.clientName),
                  _buildRow('Fecha', request.quotation.date),
                  _buildRow(
                    'Total',
                    '\$${request.quotation.total.toStringAsFixed(0)}',
                    valueStyle: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Productos
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Productos (${request.products.length})',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const Divider(),
                  ...request.products.map((product) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  product.name,
                                  style: const TextStyle(fontWeight: FontWeight.w500),
                                ),
                                Text(
                                  '${product.code} • Cant: ${product.quantity}',
                                  style: TextStyle(
                                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Notas y respuesta
          if (request.notes != null || request.response != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Notas y respuesta',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const Divider(),
                    if (request.notes != null) ...[
                      const Text(
                        'Notas:',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        request.notes!,
                        style: const TextStyle(fontSize: 14),
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (request.response != null) ...[
                      const Text(
                        'Respuesta del proveedor:',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        request.response!,
                        style: const TextStyle(fontSize: 14),
                      ),
                    ],
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
}
