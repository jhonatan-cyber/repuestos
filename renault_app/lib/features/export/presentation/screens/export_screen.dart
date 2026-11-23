import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../core/utils/csv_exporter.dart';
import '../../../../core/utils/excel_exporter.dart';
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

  /// Shows a format selection dialog (CSV or Excel) and then exports.
  Future<void> _exportWithFormat(
    BuildContext context,
    WidgetRef ref,
    String type,
    List<Map<String, dynamic>> data,
  ) async {
    late bool useExcel;
    if (!context.mounted) return;

    await showDialog<void>(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (sbCtx, setState) {
            useExcel = false;
            return AlertDialog(
              title: const Text('Formato de exportación'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  RadioListTile<bool>(
                    title: const Text('CSV'),
                    subtitle: const Text('Compatible con cualquier hoja de cálculo'),
                    value: false,
                    groupValue: useExcel,
                    onChanged: (v) {
                      setState(() => useExcel = v ?? false);
                    },
                  ),
                  RadioListTile<bool>(
                    title: const Text('Excel (.xlsx)'),
                    subtitle: const Text('Formato nativo de Excel'),
                    value: true,
                    groupValue: useExcel,
                    onChanged: (v) {
                      setState(() => useExcel = v ?? false);
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancelar'),
                ),
                FilledButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Exportar'),
                ),
              ],
            );
          },
        );
      },
    );

    if (!context.mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final dir = await getApplicationDocumentsDirectory();
      String filePath;

      if (useExcel) {
        final file = _exportToExcel(type, data, directory: dir.path);
        filePath = file.path;
      } else {
        final csv = _generateCsv(type, data);
        filePath = CsvExporter.getFilePath(dir.path, type);
        File(filePath).writeAsStringSync(csv);
      }

      if (context.mounted) {
        Navigator.pop(context);
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

  /// Generate CSV string from data based on type.
  String _generateCsv(String type, List<Map<String, dynamic>> data) {
    switch (type) {
      case 'ventas':
        return CsvExporter.exportSales(data);
      case 'productos':
        return CsvExporter.exportProducts(data);
      case 'clientes':
        return CsvExporter.exportClients(data);
      case 'creditos':
        return CsvExporter.exportCredits(data);
      case 'gastos':
        return CsvExporter.exportExpenses(data);
      default:
        throw Exception('Tipo de exportación desconocido: $type');
    }
  }

  /// Export to Excel file based on type.
  File _exportToExcel(String type, List<Map<String, dynamic>> data,
      {required String directory}) {
    switch (type) {
      case 'ventas':
        return ExcelExporter.exportSales(data, directory: directory);
      case 'productos':
        return ExcelExporter.exportProducts(data, directory: directory);
      case 'clientes':
        return ExcelExporter.exportClients(data, directory: directory);
      case 'creditos':
        return ExcelExporter.exportCredits(data, directory: directory);
      case 'gastos':
        return ExcelExporter.exportExpenses(data, directory: directory);
      default:
        throw Exception('Tipo de exportación desconocido: $type');
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
              onTap: () async {
                List<Map<String, dynamic>> data;
                switch (type) {
                  case 'ventas':
                    final repo = SalesRepository(
                      ref.read(dioClientProvider),
                      ref.read(isarDbProvider),
                      ref.read(mutationQueueProvider),
                      ref.read(connectionMonitorProvider.notifier),
                    );
                    final sales = await repo.listSales();
                    data = sales.map((s) => {
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
                    break;
                  case 'productos':
                    final repo = ProductRepository(
                      ref.read(dioClientProvider),
                      ref.read(isarDbProvider),
                      ref.read(mutationQueueProvider),
                      ref.read(connectionMonitorProvider.notifier),
                    );
                    final products = await repo.list();
                    data = products.map((p) => {
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
                    break;
                  case 'clientes':
                    final repo = ClientRepository(
                      ref.read(dioClientProvider),
                      ref.read(isarDbProvider),
                      ref.read(mutationQueueProvider),
                      ref.read(connectionMonitorProvider.notifier),
                    );
                    final clients = await repo.list();
                    data = clients.map((c) => {
                          'id': c.id,
                          'name': c.name,
                          'phone': c.phone ?? '',
                          'address': c.address ?? '',
                          'totalPurchases': c.totalPurchases,
                          'status': c.status,
                        }).toList();
                    break;
                  case 'creditos':
                    final repo = CreditsRepository(
                      ref.read(dioClientProvider),
                      ref.read(isarDbProvider),
                      ref.read(mutationQueueProvider),
                      ref.read(connectionMonitorProvider.notifier),
                    );
                    final credits = await repo.listCredits();
                    data = credits.map((c) => {
                          'id': c.id,
                          'clientName': c.clientName,
                          'saleId': c.sale?.id ?? '',
                          'total': c.total,
                          'remaining': c.remaining,
                          'status': c.status,
                          'dueDate': c.dueDate ?? '',
                        }).toList();
                    break;
                  case 'gastos':
                    final repo = ExpensesRepository(
                      ref.read(dioClientProvider),
                      ref.read(isarDbProvider),
                      ref.read(mutationQueueProvider),
                      ref.read(connectionMonitorProvider.notifier),
                    );
                    final expenses = await repo.list();
                    data = expenses.map((e) => {
                          'id': e.id,
                          'category': e.category,
                          'description': e.description,
                          'amount': e.amount,
                          'date': e.date ?? '',
                        }).toList();
                    break;
                  default:
                    return;
                }
                if (context.mounted) {
                  await _exportWithFormat(context, ref, type, data);
                }
              },
            ),
          );
        },
      ),
    );
  }
}
