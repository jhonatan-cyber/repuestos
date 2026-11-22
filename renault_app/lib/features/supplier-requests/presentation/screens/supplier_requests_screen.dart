import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/supplier_request_provider.dart';
import 'supplier_request_detail_screen.dart';

class SupplierRequestsScreen extends ConsumerWidget {
  const SupplierRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(supplierRequestsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Solicitudes a proveedores')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (requests) {
          if (requests.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.inbox, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('Sin solicitudes'),
                ],
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(8),
            itemCount: requests.length,
            itemBuilder: (context, index) {
              final req = requests[index];
              return Card(
                margin: const EdgeInsets.symmetric(vertical: 4),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: req.statusColor.withValues(alpha: 0.1),
                    child: Icon(
                      req.isPending
                          ? Icons.hourglass_bottom
                          : req.isResponded
                              ? Icons.check
                              : Icons.close,
                      color: req.statusColor,
                    ),
                  ),
                  title: Text(req.supplierName),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Enviado: ${req.sentAt.split('T')[0]} • ${req.products.length} productos',
                      ),
                      Text(
                        'Total: \$${req.quotation.total.toStringAsFixed(0)}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: req.statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      req.statusLabel,
                      style: TextStyle(
                        color: req.statusColor,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (ctx) => SupplierRequestDetailScreen(request: req),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
