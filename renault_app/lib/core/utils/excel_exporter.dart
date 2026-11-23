import 'dart:io';

import 'package:excel/excel.dart';
import 'package:path/path.dart' as path;

/// Utility class for exporting data to Excel (.xlsx) format.
/// Complements [CsvExporter] for full parity with the web app.
class ExcelExporter {
  /// Export sales to Excel with two sheets: sales summary and sale items.
  static File exportSales(
    List<Map<String, dynamic>> sales, {
    required String directory,
  }) {
    final excel = Excel.createExcel();
    final salesSheet = excel['Ventas'];
    final itemsSheet = excel['Items'];

    // Sales header
    salesSheet.appendRow([
      TextCellValue('ID'),
      TextCellValue('Fecha'),
      TextCellValue('Cliente'),
      TextCellValue('Items'),
      TextCellValue('Subtotal'),
      TextCellValue('Descuento'),
      TextCellValue('Total'),
      TextCellValue('Método de pago'),
      TextCellValue('Estado'),
    ]);

    // Items header
    itemsSheet.appendRow([
      TextCellValue('Venta ID'),
      TextCellValue('Producto'),
      TextCellValue('Cantidad'),
      TextCellValue('Precio'),
      TextCellValue('Subtotal'),
    ]);

    // Sales data
    for (final sale in sales) {
      salesSheet.appendRow([
        TextCellValue(sale['id']?.toString() ?? ''),
        TextCellValue(sale['date']?.toString() ?? ''),
        TextCellValue(sale['clientName']?.toString() ?? sale['clientId']?.toString() ?? ''),
        TextCellValue(sale['items']?.toString() ?? ''),
        DoubleCellValue((sale['subtotal'] ?? 0) is int
            ? (sale['subtotal'] as int).toDouble()
            : (sale['subtotal'] ?? 0.0)),
        DoubleCellValue((sale['discount'] ?? 0) is int
            ? (sale['discount'] as int).toDouble()
            : (sale['discount'] ?? 0.0)),
        DoubleCellValue((sale['total'] ?? 0) is int
            ? (sale['total'] as int).toDouble()
            : (sale['total'] ?? 0.0)),
        TextCellValue(sale['paymentMethod']?.toString() ?? ''),
        TextCellValue(sale['status']?.toString() ?? ''),
      ]);

      // If sale has items list, add them to items sheet
      final items = sale['items'] as List?;
      if (items != null) {
        for (final item in items) {
          itemsSheet.appendRow([
            TextCellValue(sale['id']?.toString() ?? ''),
            TextCellValue(item['productName']?.toString() ?? item['name']?.toString() ?? ''),
            IntCellValue(item['quantity'] ?? 0),
            DoubleCellValue((item['price'] ?? 0) is int
                ? (item['price'] as int).toDouble()
                : (item['price'] ?? 0.0)),
            DoubleCellValue((item['subtotal'] ?? 0) is int
                ? (item['subtotal'] as int).toDouble()
                : (item['subtotal'] ?? 0.0)),
          ]);
        }
      }
    }

    final filename = _generateFilename('ventas');
    final filePath = path.join(directory, filename);
    final file = File(filePath);
    file.writeAsBytesSync(excel.encode()!);
    return file;
  }

  /// Export products to Excel.
  static File exportProducts(
    List<Map<String, dynamic>> products, {
    required String directory,
  }) {
    final excel = Excel.createExcel();
    final sheet = excel['Productos'];

    sheet.appendRow([
      TextCellValue('ID'),
      TextCellValue('Código'),
      TextCellValue('Nombre'),
      TextCellValue('Categoría'),
      TextCellValue('Precio costo'),
      TextCellValue('Precio venta'),
      TextCellValue('Stock'),
      TextCellValue('Stock mínimo'),
      TextCellValue('Estado'),
    ]);

    for (final p in products) {
      sheet.appendRow([
        TextCellValue(p['id']?.toString() ?? ''),
        TextCellValue(p['code']?.toString() ?? ''),
        TextCellValue(p['name']?.toString() ?? ''),
        TextCellValue(p['category']?.toString() ?? p['categoryId']?.toString() ?? ''),
        DoubleCellValue((p['purchasePrice'] ?? p['buyPrice'] ?? 0).toDouble()),
        DoubleCellValue((p['salePrice'] ?? p['sellPrice'] ?? 0).toDouble()),
        IntCellValue(p['stock'] ?? 0),
        IntCellValue(p['minimumStock'] ?? p['minStock'] ?? 0),
        TextCellValue(p['status']?.toString() ?? ''),
      ]);
    }

    final filename = _generateFilename('productos');
    final filePath = path.join(directory, filename);
    final file = File(filePath);
    file.writeAsBytesSync(excel.encode()!);
    return file;
  }

  /// Export clients to Excel.
  static File exportClients(
    List<Map<String, dynamic>> clients, {
    required String directory,
  }) {
    final excel = Excel.createExcel();
    final sheet = excel['Clientes'];

    sheet.appendRow([
      TextCellValue('ID'),
      TextCellValue('Nombre'),
      TextCellValue('Teléfono'),
      TextCellValue('Dirección'),
      TextCellValue('Total compras'),
      TextCellValue('Estado'),
    ]);

    for (final c in clients) {
      sheet.appendRow([
        TextCellValue(c['id']?.toString() ?? ''),
        TextCellValue(c['name']?.toString() ?? ''),
        TextCellValue(c['phone']?.toString() ?? ''),
        TextCellValue(c['address']?.toString() ?? ''),
        DoubleCellValue((c['totalPurchases'] ?? 0) is int
            ? (c['totalPurchases'] as int).toDouble()
            : (c['totalPurchases'] ?? 0.0)),
        TextCellValue(c['status']?.toString() ?? ''),
      ]);
    }

    final filename = _generateFilename('clientes');
    final filePath = path.join(directory, filename);
    final file = File(filePath);
    file.writeAsBytesSync(excel.encode()!);
    return file;
  }

  /// Export credits to Excel.
  static File exportCredits(
    List<Map<String, dynamic>> credits, {
    required String directory,
  }) {
    final excel = Excel.createExcel();
    final sheet = excel['Créditos'];

    sheet.appendRow([
      TextCellValue('ID'),
      TextCellValue('Cliente'),
      TextCellValue('Venta'),
      TextCellValue('Total'),
      TextCellValue('Restante'),
      TextCellValue('Estado'),
      TextCellValue('Vencimiento'),
    ]);

    for (final c in credits) {
      sheet.appendRow([
        TextCellValue(c['id']?.toString() ?? ''),
        TextCellValue(c['clientName']?.toString() ?? c['clientId']?.toString() ?? ''),
        TextCellValue(c['saleId']?.toString() ?? ''),
        DoubleCellValue((c['total'] ?? 0) is int
            ? (c['total'] as int).toDouble()
            : (c['total'] ?? 0.0)),
        DoubleCellValue((c['remaining'] ?? 0) is int
            ? (c['remaining'] as int).toDouble()
            : (c['remaining'] ?? 0.0)),
        TextCellValue(c['status']?.toString() ?? ''),
        TextCellValue(c['dueDate']?.toString() ?? ''),
      ]);
    }

    final filename = _generateFilename('creditos');
    final filePath = path.join(directory, filename);
    final file = File(filePath);
    file.writeAsBytesSync(excel.encode()!);
    return file;
  }

  /// Export expenses to Excel.
  static File exportExpenses(
    List<Map<String, dynamic>> expenses, {
    required String directory,
  }) {
    final excel = Excel.createExcel();
    final sheet = excel['Gastos'];

    sheet.appendRow([
      TextCellValue('ID'),
      TextCellValue('Categoría'),
      TextCellValue('Descripción'),
      TextCellValue('Monto'),
      TextCellValue('Fecha'),
    ]);

    for (final e in expenses) {
      sheet.appendRow([
        TextCellValue(e['id']?.toString() ?? ''),
        TextCellValue(e['category']?.toString() ?? ''),
        TextCellValue(e['description']?.toString() ?? ''),
        DoubleCellValue((e['amount'] ?? 0) is int
            ? (e['amount'] as int).toDouble()
            : (e['amount'] ?? 0.0)),
        TextCellValue(e['date']?.toString() ?? ''),
      ]);
    }

    final filename = _generateFilename('gastos');
    final filePath = path.join(directory, filename);
    final file = File(filePath);
    file.writeAsBytesSync(excel.encode()!);
    return file;
  }

  /// Generate a timestamped filename for the export (.xlsx).
  static String _generateFilename(String type) {
    final now = DateTime.now();
    final timestamp =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}_${now.hour.toString().padLeft(2, '0')}${now.minute.toString().padLeft(2, '0')}';
    return '${type}_$timestamp.xlsx';
  }
}
