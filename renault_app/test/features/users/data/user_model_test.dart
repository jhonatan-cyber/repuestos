import 'package:flutter_test/flutter_test.dart';
import 'package:renault_app/features/users/data/user_model.dart';

void main() {
  group('UserModel fromJson', () {
    test('parses complete data', () {
      final json = {
        'id': '1',
        'name': 'Admin',
        'email': 'admin@test.com',
        'role': 'admin',
        'status': 'active',
      };

      final user = UserModel.fromJson(json);
      expect(user.id, '1');
      expect(user.name, 'Admin');
      expect(user.email, 'admin@test.com');
      expect(user.role, 'admin');
      expect(user.status, 'active');
      expect(user.isActive, isTrue);
    });

    test('parses partial data with defaults', () {
      final json = {'id': '2', 'name': 'User', 'email': 'user@test.com'};
      final user = UserModel.fromJson(json);
      expect(user.role, 'user');
      expect(user.status, 'active');
    });
  });

  group('UserModel toJson', () {
    test('serializes to JSON', () {
      final user = UserModel(id: '1', name: 'Test', email: 'test@test.com', role: 'user');
      final json = user.toJson();
      expect(json['id'], '1');
      expect(json['name'], 'Test');
      expect(json['email'], 'test@test.com');
    });
  });

  group('UserModel copyWith', () {
    test('copies with changes', () {
      final original = UserModel(id: '1', name: 'Original', email: 'a@b.com', role: 'user');
      final copied = original.copyWith(name: 'Modified', role: 'admin');
      expect(copied.id, original.id);
      expect(copied.name, 'Modified');
      expect(copied.role, 'admin');
    });
  });
}
