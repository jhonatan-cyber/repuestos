import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../core/utils/csv_exporter.dart';
import '../../../../features/sales/data/sales_repository.dart';
import '../../../../features/products/data/product_repository.dart';
import '../../../../features/clients/data/client_repository.dart';
import '../../../../features/credits/data/credits_repository.dart';
import '../../../../features/expenses/data/expenses_repository.dart';
import '../../../../core/providers.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/sync_engine.dart';

class ExportScreen extends ConsumerWidget {
  const ExportScreen({super.key});

  Future<void> _exportType(
    BuildContext context,
    WidgetRef ref,
    String type,
    Future<String> Function() generateCsv,
  ) async {
    if (!context.mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final csv = await generateCsv();
      final dir = await getApplicationDocumentsDirectory();
      final filePath = CsvExporter.getFilePath(dir.path, type);
      File(filePath).writeAsStringSync(csv);

      if (context.mounted) {
        Navigator.pop(context); // close progress
        await Share.shareXFiles([XFile(filePath)], text: 'Exportación $type');
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('$type exportado a: $filePath')),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al exportar: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final exportTypes = [
      {
        'type': 'ventas',
        'title': 'Ventas',
        'icon': Icons.point_of_sale,
        'color': Colors.blue,
        'description': 'Exportar historial de ventas',
      },
      {
        'type': 'productos',
        'title': 'Productos',
        'icon': Icons.inventory_2,
        'color': Colors.green,
        'description': 'Exportar catálogo de productos',
      },
      {
        'type': 'clientes',
        'title': 'Clientes',
        'icon': Icons.groups,
        'color': Colors.purple,
        'description': 'Exportar lista de clientes',
      },
      {
        'type': 'creditos',
        'title': 'Créditos',
        'icon': Icons.credit_card,
        'color': Colors.orange,
        'description': 'Exportar créditos pendientes',
      },
      {
        'type': 'gastos',
        'title': 'Gastos',
        'icon': Icons.receipt_long,
        'color': Colors.red,
        'description': 'Exportar registro de gastos',
      },
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Exportar datos')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: exportTypes.length,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final item = exportTypes[index];
          final type = item['type']! as String;
          final title = item['title']! as String;
          final icon = item['icon']! as IconData;
          final color = item['color']! as Color;
          final description = item['description']! as String;

          return Card(
            child: ListTile(
              contentPadding: const EdgeInsets.all(16),
              leading: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(description),
              trailing: const Icon(Icons.share, color: Colors.grey),
              onTap: () {
                switch (type) {
                  case 'ventas':
                    _exportSales(context, ref);
                  case 'productos':
                    _exportProducts(context, ref);
                  case 'clientes':
                    _exportClients(context, ref);
                  case 'creditos':
                    _exportCredits(context, ref);
                  case 'gastos':
                    _exportExpenses(context, ref);
                }
              },
            ),
          );
        },
      ),
    );
  }

  Future<void> _exportSales(BuildContext context, WidgetRef ref) async {
    await _exportType(
      context,
      ref,
      'ventas',
      () async {
        final repo = SalesRepository(
          ref.read(dioClientProvider),
          ref.read(isarDbProvider),
          ref.read(mutationQueueProvider),
          ref.read(connectionMonitorProvider.notifier),
        );
        final sales = await repo.listSales();
        final maps = sales.map((s) => {
              'id': s.id,
              'date': s.date,
              'clientName': s.clientName,
              'items': '${s.items.length} items',
              'subtotal': s.subtotal,
              'discount': s.discount,
              'total': s.total,
              'paymentMethod': s.paymentMethod,
              'status': s.status,
            }).toList();
        return CsvExporter.exportSales(maps);
      },
    );
  }

  Future<void> _exportProducts(BuildContext context, WidgetRef ref) async {
    await _exportType(
      context,
      ref,
      'productos',
      () async {
        final repo = ProductRepository(
          ref.read(dioClientProvider),
          ref.read(isarDbProvider),
          ref.read(mutationQueueProvider),
          ref.read(connectionMonitorProvider.notifier),
        );
        final products = await repo.list();
        final maps = products.map((p) => {
              'id': p.id,
              'code': p.code,
              'name': p.name,
              'category': p.category,
              'purchasePrice': p.purchasePrice,
              'salePrice': p.salePrice,
              'stock': p.stock,
              'minimumStock': p.minimumStock,
              'status': p.status,
            }).toList();
        return CsvExporter.exportProducts(maps);
      },
    );
  }

  Future<void> _exportClients(BuildContext context, WidgetRef ref) async {
    await _exportType(
      context,
      ref,
      'clientes',
      () async {
        final repo = ClientRepository(
          ref.read(dioClientProvider),
          ref.read(isarDbProvider),
          ref.read(mutationQueueProvider),
          ref.read(connectionMonitorProvider.notifier),
        );
        final clients = await repo.list();
        final maps = clients.map((c) => {
              'id': c.id,
              'name': c.name,
              'phone': c.phone ?? '',
              'address': c.address ?? '',
              'totalPurchases': c.totalPurchases,
              'status': c.status,
            }).toList();
        return CsvExporter.exportClients(maps);
      },
    );
  }

  Future<void> _exportCredits(BuildContext context, WidgetRef ref) async {
    await _exportType(
      context,
      ref,
      'creditos',
      () async {
        final repo = CreditsRepository(
          ref.read(dioClientProvider),
          ref.read(isarDbProvider),
          ref.read(mutationQueueProvider),
          ref.read(connectionMonitorProvider.notifier),
        );
        final credits = await repo.listCredits();
        final maps = credits.map((c) => {
              'id': c.id,
              'clientName': c.clientName,
              'saleId': c.sale?.id ?? '',
              'total': c.total,
              'remaining': c.remaining,
              'status': c.status,
              'dueDate': c.dueDate ?? '',
            }).toList();
        return CsvExporter.exportCredits(maps);
      },
    );
  }

  Future<void> _exportExpenses(BuildContext context, WidgetRef ref) async {
    await _exportType(
      context,
      ref,
      'gastos',
      () async {
        final repo = ExpensesRepository(
          ref.read(dioClientProvider),
          ref.read(isarDbProvider),
          ref.read(mutationQueueProvider),
          ref.read(connectionMonitorProvider.notifier),
        );
        final expenses = await repo.list();
        final maps = expenses.map((e) => {
              'id': e.id,
              'category': e.category,
              'description': e.description,
              'amount': e.amount,
              'date': e.date ?? '',
            }).toList();
        return CsvExporter.exportExpenses(maps);
      },
    );
  }
}
