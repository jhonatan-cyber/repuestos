import 'package:csv/csv.dart';
import 'package:path/path.dart' as path;

/// Utility class for exporting data to CSV format.
/// Generates UTF-8 BOM encoded CSV files that open correctly in Excel.
class CsvExporter {
  /// Adds UTF-8 BOM to ensure Excel opens the file with correct encoding.
  static String _addBom(String content) => '\uFEFF$content';

  /// Export sales to CSV
  static String exportSales(List<Map<String, dynamic>> sales) {
    final rows = <List<dynamic>>[
      ['ID', 'Fecha', 'Cliente', 'Items', 'Subtotal', 'Descuento', 'Total', 'Método de pago', 'Estado'],
    ];

    for (final sale in sales) {
      rows.add([
        sale['id'] ?? '',
        sale['date'] ?? '',
        sale['clientName'] ?? sale['clientId'] ?? '',
        sale['items'] ?? '',
        sale['subtotal'] ?? 0,
        sale['discount'] ?? 0,
        sale['total'] ?? 0,
        sale['paymentMethod'] ?? '',
        sale['status'] ?? '',
      ]);
    }

    final csv = const ListToCsvConverter().convert(rows);
    return _addBom(csv);
  }

  /// Export products to CSV
  static String exportProducts(List<Map<String, dynamic>> products) {
    final rows = <List<dynamic>>[
      ['ID', 'Código', 'Nombre', 'Categoría', 'Precio costo', 'Precio venta', 'Stock', 'Stock mínimo', 'Estado'],
    ];

    for (final p in products) {
      rows.add([
        p['id'] ?? '',
        p['code'] ?? '',
        p['name'] ?? '',
        p['category'] ?? p['categoryId'] ?? '',
        p['purchasePrice'] ?? p['buyPrice'] ?? 0,
        p['salePrice'] ?? p['sellPrice'] ?? 0,
        p['stock'] ?? 0,
        p['minimumStock'] ?? p['minStock'] ?? 0,
        p['status'] ?? '',
      ]);
    }

    final csv = const ListToCsvConverter().convert(rows);
    return _addBom(csv);
  }

  /// Export clients to CSV
  static String exportClients(List<Map<String, dynamic>> clients) {
    final rows = <List<dynamic>>[
      ['ID', 'Nombre', 'Teléfono', 'Dirección', 'Total compras', 'Estado'],
    ];

    for (final c in clients) {
      rows.add([
        c['id'] ?? '',
        c['name'] ?? '',
        c['phone'] ?? '',
        c['address'] ?? '',
        c['totalPurchases'] ?? 0,
        c['status'] ?? '',
      ]);
    }

    final csv = const ListToCsvConverter().convert(rows);
    return _addBom(csv);
  }

  /// Export credits to CSV
  static String exportCredits(List<Map<String, dynamic>> credits) {
    final rows = <List<dynamic>>[
      ['ID', 'Cliente', 'Venta', 'Total', 'Restante', 'Estado', 'Vencimiento'],
    ];

    for (final c in credits) {
      rows.add([
        c['id'] ?? '',
        c['clientName'] ?? c['clientId'] ?? '',
        c['saleId'] ?? '',
        c['total'] ?? 0,
        c['remaining'] ?? 0,
        c['status'] ?? '',
        c['dueDate'] ?? '',
      ]);
    }

    final csv = const ListToCsvConverter().convert(rows);
    return _addBom(csv);
  }

  /// Export expenses to CSV
  static String exportExpenses(List<Map<String, dynamic>> expenses) {
    final rows = <List<dynamic>>[
      ['ID', 'Categoría', 'Descripción', 'Monto', 'Fecha'],
    ];

    for (final e in expenses) {
      rows.add([
        e['id'] ?? '',
        e['category'] ?? '',
        e['description'] ?? '',
        e['amount'] ?? 0,
        e['date'] ?? '',
      ]);
    }

    final csv = const ListToCsvConverter().convert(rows);
    return _addBom(csv);
  }

  /// Generate a timestamped filename for the export
  static String generateFilename(String type) {
    final now = DateTime.now();
    final timestamp = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}_${now.hour.toString().padLeft(2, '0')}${now.minute.toString().padLeft(2, '0')}';
    return '${type}_$timestamp.csv';
  }

  /// Get the full file path for saving
  static String getFilePath(String directory, String type) {
    final filename = generateFilename(type);
    return path.join(directory, filename);
  }
}
