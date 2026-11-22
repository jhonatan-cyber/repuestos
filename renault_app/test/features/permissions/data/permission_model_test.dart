import 'package:flutter_test/flutter_test.dart';
import 'package:renault_app/features/permissions/data/permission_model.dart';

void main() {
  group('PermissionModel fromJson', () {
    test('parses complete data', () {
      final json = {
        'id': '1',
        'name': 'products.read',
        'description': 'Leer productos',
        'isSystem': true,
        'status': 'active',
      };

      final perm = PermissionModel.fromJson(json);
      expect(perm.id, '1');
      expect(perm.name, 'products.read');
      expect(perm.description, 'Leer productos');
      expect(perm.isSystem, isTrue);
      expect(perm.isActive, isTrue);
    });

    test('parses partial data', () {
      final json = {'id': '2', 'name': 'test'};
      final perm = PermissionModel.fromJson(json);
      expect(perm.description, '');
      expect(perm.isSystem, isFalse);
      expect(perm.status, 'active');
    });
  });

  group('PermissionModel toJson', () {
    test('serializes to JSON', () {
      final perm = PermissionModel(
        id: '1',
        name: 'test',
        description: 'Test perm',
        isSystem: false,
        status: 'active',
      );
      final json = perm.toJson();
      expect(json['id'], '1');
      expect(json['name'], 'test');
      expect(json['isSystem'], isFalse);
    });
  });
}
