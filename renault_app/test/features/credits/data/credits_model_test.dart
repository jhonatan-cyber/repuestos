import 'package:flutter_test/flutter_test.dart';
import 'package:renault_app/features/credits/data/credits_model.dart';

void main() {
  group('Credit fromJson', () {
    test('parses complete credit', () {
      final json = {
        'id': '1',
        'clientName': 'Juan Pérez',
        'total': 1000.0,
        'remaining': 500.0,
        'status': 'active',
        'dueDate': '2025-12-01',
        'payments': 2,
        'client': {'id': 'c1', 'name': 'Juan Pérez', 'phone': '123'},
        'sale': {
          'id': 's1',
          'date': '2025-01-01',
          'subtotal': 1000.0,
          'discount': 0,
          'total': 1000.0,
          'paymentMethod': 'credit',
          'items': [],
        },
      };

      final credit = Credit.fromJson(json);
      expect(credit.id, '1');
      expect(credit.clientName, 'Juan Pérez');
      expect(credit.total, 1000.0);
      expect(credit.remaining, 500.0);
      expect(credit.status, 'active');
      expect(credit.isActive, isTrue);
      expect(credit.progress, 50.0);
      expect(credit.client?.name, 'Juan Pérez');
      expect(credit.sale?.id, 's1');
    });

    test('parses credit with payments list', () {
      final json = {
        'id': '2',
        'clientName': 'Test',
        'total': 200.0,
        'remaining': 100.0,
        'status': 'active',
        'payments': [
          {'id': 'p1', 'amount': 50.0, 'date': '2025-01-15', 'notes': 'Pago 1'},
          {'id': 'p2', 'amount': 50.0, 'date': '2025-02-15', 'notes': 'Pago 2'},
        ],
      };

      final credit = Credit.fromJson(json);
      expect(credit.paymentRecords.length, 2);
      expect(credit.paymentRecords[0].amount, 50.0);
      expect(credit.paymentRecords[1].notes, 'Pago 2');
    });
  });

  group('CreditPaymentRecord', () {
    test('parses payment record', () {
      final json = {'id': '1', 'amount': 100.0, 'date': '2025-01-01', 'notes': 'Test'};
      final record = CreditPaymentRecord.fromJson(json);
      expect(record.id, '1');
      expect(record.amount, 100.0);
      expect(record.date, '2025-01-01');
      expect(record.notes, 'Test');
    });
  });

  group('CreditPayment toJson', () {
    test('serializes payment', () {
      final payment = CreditPayment(creditId: '1', amount: 100, notes: 'Test');
      final json = payment.toJson();
      expect(json['amount'], 100);
      expect(json['notes'], 'Test');
    });
  });

  group('PurchaseCredit', () {
    test('parses purchase credit', () {
      final json = {
        'id': '1',
        'supplierName': 'Proveedor',
        'total': 500.0,
        'remaining': 250.0,
        'status': 'active',
        'payments': 1,
      };
      final credit = PurchaseCredit.fromJson(json);
      expect(credit.id, '1');
      expect(credit.supplierName, 'Proveedor');
      expect(credit.isActive, isTrue);
    });
  });
}
