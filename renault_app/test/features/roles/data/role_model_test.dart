import 'package:flutter_test/flutter_test.dart';
import 'package:renault_app/features/roles/data/role_model.dart';

void main() {
  group('RoleModel fromJson', () {
    test('parses complete data', () {
      final json = {
        'id': '1',
        'name': 'Admin',
        'description': 'Administrador',
        'permissions': ['products.read', 'products.write', 'sales.read'],
      };

      final role = RoleModel.fromJson(json);
      expect(role.id, '1');
      expect(role.name, 'Admin');
      expect(role.description, 'Administrador');
      expect(role.permissions.length, 3);
      expect(role.permissions, contains('products.read'));
    });

    test('parses partial data', () {
      final json = {'id': '2', 'name': 'User'};
      final role = RoleModel.fromJson(json);
      expect(role.description, '');
      expect(role.permissions, isEmpty);
    });
  });

  group('RoleModel toJson', () {
    test('serializes to JSON', () {
      final role = RoleModel(
        id: '1',
        name: 'Admin',
        description: 'Admin role',
        permissions: ['read', 'write'],
      );
      final json = role.toJson();
      expect(json['id'], '1');
      expect(json['name'], 'Admin');
      expect(json['permissions'].length, 2);
    });
  });
}
