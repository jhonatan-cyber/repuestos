import 'package:flutter_test/flutter_test.dart';
import 'package:renault_app/features/clients/data/client_model.dart';

void main() {
  group('Client fromJson', () {
    test('parses complete data', () {
      final json = {
        'id': '1',
        'name': 'Juan Pérez',
        'phone': '1155551234',
        'address': 'Calle 123',
        'status': 'active',
        'totalPurchases': 5000.0,
      };

      final client = Client.fromJson(json);

      expect(client.id, '1');
      expect(client.name, 'Juan Pérez');
      expect(client.phone, '1155551234');
      expect(client.address, 'Calle 123');
      expect(client.status, 'active');
      expect(client.totalPurchases, 5000.0);
    });

    test('parses partial data with defaults', () {
      final json = {'id': '2', 'name': 'Test'};

      final client = Client.fromJson(json);

      expect(client.id, '2');
      expect(client.name, 'Test');
      expect(client.phone, isNull);
      expect(client.address, isNull);
      expect(client.status, 'active');
      expect(client.totalPurchases, 0);
    });
  });

  group('Client toJson', () {
    test('serializes to JSON', () {
      final client = Client(
        id: '1',
        name: 'Test',
        phone: '123',
        address: 'Addr',
        status: 'active',
        totalPurchases: 100,
      );

      final json = client.toJson();
      expect(json['id'], '1');
      expect(json['name'], 'Test');
      expect(json['phone'], '123');
    });
  });

  group('Client copyWith', () {
    test('copies with changes', () {
      final original = Client(
        id: '1',
        name: 'Original',
        phone: '123',
        totalPurchases: 100,
      );

      final copied = original.copyWith(name: 'Modified', phone: '456');
      expect(copied.id, original.id);
      expect(copied.name, 'Modified');
      expect(copied.phone, '456');
    });
  });
}
