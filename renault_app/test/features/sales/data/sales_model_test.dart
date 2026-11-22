import 'package:flutter_test/flutter_test.dart';
import 'package:renault_app/features/sales/data/sales_model.dart';

void main() {
  group('SaleItem', () {
    test('fromJson parses item', () {
      final json = {
        'productId': '1',
        'name': 'Filtro',
        'price': 100.0,
        'quantity': 2,
      };

      final item = SaleItem.fromJson(json);
      expect(item.productId, '1');
      expect(item.name, 'Filtro');
      expect(item.price, 100.0);
      expect(item.quantity, 2);
      expect(item.subtotal, 200.0);
    });

    test('toJson serializes item', () {
      final item = SaleItem(productId: '1', name: 'Filtro', price: 100, quantity: 2);
      final json = item.toJson();
      expect(json['productId'], '1');
      expect(json['name'], 'Filtro');
    });
  });

  group('SaleRequest', () {
    test('toJson serializes request', () {
      final request = SaleRequest(
        items: [SaleItem(productId: '1', name: 'Filtro', price: 100, quantity: 1)],
        paymentMethod: 'cash',
        discount: 0,
      );

      final json = request.toJson();
      expect(json['items'].length, 1);
      expect(json['paymentMethod'], 'cash');
      expect(json['discount'], 0);
    });

    test('subtotal and total calculations', () {
      final request = SaleRequest(
        items: [
          SaleItem(productId: '1', name: 'A', price: 100, quantity: 2),
          SaleItem(productId: '2', name: 'B', price: 50, quantity: 1),
        ],
        paymentMethod: 'cash',
        discount: 50,
      );
      expect(request.subtotal, 250);
      expect(request.total, 200);
    });
  });

  group('SaleResult', () {
    test('fromJson parses result', () {
      final json = {
        'id': 'sale1',
        'total': 100.0,
        'items': [
          {'productId': '1', 'name': 'Filtro', 'price': 100, 'quantity': 1},
        ],
      };

      final result = SaleResult.fromJson(json);
      expect(result.id, 'sale1');
      expect(result.total, 100.0);
      expect(result.items, 1);
    });
  });

  group('paymentMethods', () {
    test('has 4 payment methods', () {
      expect(paymentMethods.length, 4);
      expect(paymentMethods[0].id, 'cash');
      expect(paymentMethods[1].id, 'card');
      expect(paymentMethods[2].id, 'transfer');
      expect(paymentMethods[3].id, 'credit');
    });
  });

  group('Sale', () {
    test('fromJson parses sale', () {
      final json = {
        'id': '1',
        'date': '2025-01-01',
        'clientName': 'Juan',
        'sellerName': 'Pedro',
        'items': [
          {'productId': '1', 'productName': 'Filtro', 'quantity': 1, 'price': 100, 'subtotal': 100},
        ],
        'subtotal': 100.0,
        'discount': 0,
        'total': 100.0,
        'paymentMethod': 'cash',
        'status': 'completada',
      };

      final sale = Sale.fromJson(json);
      expect(sale.id, '1');
      expect(sale.clientName, 'Juan');
      expect(sale.isCompleted, isTrue);
      expect(sale.isCanceled, isFalse);
      expect(sale.paymentMethodLabel, 'Efectivo');
    });

    test('isCanceled returns true for cancelada', () {
      final sale = Sale(
        id: '1', date: '', clientName: '', sellerName: '',
        items: [], subtotal: 0, discount: 0, total: 0,
        paymentMethod: '', status: 'cancelada',
      );
      expect(sale.isCanceled, isTrue);
    });
  });
}
