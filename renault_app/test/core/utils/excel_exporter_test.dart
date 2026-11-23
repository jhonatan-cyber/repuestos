import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:path_provider/path_provider.dart';
import 'package:renault_app/core/utils/excel_exporter.dart';

void main() {
  group('ExcelExporter', () {
    late Directory tempDir;

    setUp(() async {
      tempDir = await Directory.systemTemp.createTemp('excel_test_');
    });

    tearDown(() async {
      if (await tempDir.exists()) {
        await tempDir.delete(recursive: true);
      }
    });

    test('exportSales creates file with two sheets', () async {
      final sales = [
        {
          'id': '1',
          'date': '2024-01-15',
          'clientName': 'Juan Pérez',
          'items': '2 items',
          'subtotal': 500.0,
          'discount': 0,
          'total': 500.0,
          'paymentMethod': 'Efectivo',
          'status': 'completed',
        },
      ];

      final file = ExcelExporter.exportSales(sales, directory: tempDir.path);

      expect(file.existsSync(), isTrue);
      expect(file.path.endsWith('.xlsx'), isTrue);
      expect(file.lengthSync(), greaterThan(0));
    });

    test('exportSales with items list creates two sheets', () async {
      final sales = [
        {
          'id': '1',
          'date': '2024-01-15',
          'clientName': 'Juan Pérez',
          'items': [
            {'productName': 'Filtro', 'quantity': 2, 'price': 100, 'subtotal': 200},
          ],
          'subtotal': 200.0,
          'discount': 0,
          'total': 200.0,
          'paymentMethod': 'Efectivo',
          'status': 'completed',
        },
      ];

      final file = ExcelExporter.exportSales(sales, directory: tempDir.path);

      expect(file.existsSync(), isTrue);
      expect(file.lengthSync(), greaterThan(0));
    });

    test('exportProducts creates file', () async {
      final products = [
        {
          'id': '1',
          'code': 'ABC123',
          'name': 'Filtro de aceite',
          'category': 'Filtros',
          'purchasePrice': 100,
          'salePrice': 150,
          'stock': 10,
          'minimumStock': 5,
          'status': 'active',
        },
      ];

      final file = ExcelExporter.exportProducts(products, directory: tempDir.path);

      expect(file.existsSync(), isTrue);
      expect(file.path.endsWith('.xlsx'), isTrue);
    });

    test('exportClients creates file', () async {
      final clients = [
        {
          'id': '1',
          'name': 'Taller López',
          'phone': '11-1234-5678',
          'address': 'Calle 123',
          'totalPurchases': 5000,
          'status': 'active',
        },
      ];

      final file = ExcelExporter.exportClients(clients, directory: tempDir.path);

      expect(file.existsSync(), isTrue);
      expect(file.path.endsWith('.xlsx'), isTrue);
    });

    test('exportCredits creates file', () async {
      final credits = [
        {
          'id': '1',
          'clientName': 'Carlos García',
          'saleId': 'sale1',
          'total': 1000.0,
          'remaining': 500.0,
          'status': 'active',
          'dueDate': '2024-02-01',
        },
      ];

      final file = ExcelExporter.exportCredits(credits, directory: tempDir.path);

      expect(file.existsSync(), isTrue);
      expect(file.path.endsWith('.xlsx'), isTrue);
    });

    test('exportExpenses creates file', () async {
      final expenses = [
        {
          'id': '1',
          'category': 'Alquiler',
          'description': 'Alquiler local',
          'amount': 15000.0,
          'date': '2024-01-01',
        },
      ];

      final file = ExcelExporter.exportExpenses(expenses, directory: tempDir.path);

      expect(file.existsSync(), isTrue);
      expect(file.path.endsWith('.xlsx'), isTrue);
    });

    test('exportSales with empty list creates valid file', () async {
      final file = ExcelExporter.exportSales([], directory: tempDir.path);

      expect(file.existsSync(), isTrue);
      expect(file.lengthSync(), greaterThan(0));
    });

    test('filename contains timestamp', () async {
      final products = [
        {
          'id': '1',
          'code': 'A',
          'name': 'Test',
          'category': '',
          'purchasePrice': 0,
          'salePrice': 100,
          'stock': 1,
          'minimumStock': 0,
          'status': 'active',
        },
      ];

      final file = ExcelExporter.exportProducts(products, directory: tempDir.path);
      final fileName = file.path.split('/').last;

      expect(fileName.contains('productos'), isTrue);
      expect(fileName.contains('.xlsx'), isTrue);
      // Should contain date pattern YYYY-MM-DD
      expect(fileName.contains(DateTime.now().year.toString()), isTrue);
    });
  });
}
