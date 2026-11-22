import 'package:flutter_test/flutter_test.dart';
import 'package:renault_app/features/products/data/product_model.dart';

void main() {
  group('Product fromJson', () {
    test('parses complete data', () {
      final json = {
        'id': '1',
        'code': 'ABC123',
        'name': 'Filtro de aceite',
        'description': 'Filtro original',
        'brand': 'Renault',
        'model': 'Clio',
        'category': 'Filtros',
        'categoryId': 'cat1',
        'purchasePrice': 100.0,
        'salePrice': 150.0,
        'stock': 10,
        'minimumStock': 5,
        'unit': 'unidad',
        'supplierName': 'Proveedor 1',
        'supplierId': 'sup1',
        'status': 'active',
      };

      final product = Product.fromJson(json);

      expect(product.id, '1');
      expect(product.code, 'ABC123');
      expect(product.name, 'Filtro de aceite');
      expect(product.description, 'Filtro original');
      expect(product.brand, 'Renault');
      expect(product.model, 'Clio');
      expect(product.category, 'Filtros');
      expect(product.categoryId, 'cat1');
      expect(product.purchasePrice, 100.0);
      expect(product.salePrice, 150.0);
      expect(product.stock, 10);
      expect(product.minimumStock, 5);
      expect(product.unit, 'unidad');
      expect(product.supplierName, 'Proveedor 1');
      expect(product.supplierId, 'sup1');
      expect(product.status, 'active');
    });

    test('parses partial data with defaults', () {
      final json = {
        'id': '2',
        'code': 'XYZ',
        'name': 'Producto',
        'salePrice': 50.0,
        'stock': 0,
      };

      final product = Product.fromJson(json);

      expect(product.id, '2');
      expect(product.code, 'XYZ');
      expect(product.name, 'Producto');
      expect(product.description, isNull);
      expect(product.brand, '');
      expect(product.model, '');
      expect(product.category, '');
      expect(product.purchasePrice, 0);
      expect(product.salePrice, 50.0);
      expect(product.stock, 0);
      expect(product.minimumStock, 0);
      expect(product.unit, 'unidad');
    });
  });

  group('Product toJson', () {
    test('serializes to JSON', () {
      final product = Product(
        id: '1',
        code: 'ABC',
        name: 'Test',
        brand: 'Brand',
        model: 'Model',
        category: 'Cat',
        categoryId: 'cat1',
        purchasePrice: 100,
        salePrice: 150,
        stock: 10,
        minimumStock: 5,
        unit: 'unidad',
        supplierId: 'sup1',
      );

      final json = product.toJson();

      expect(json['id'], '1');
      expect(json['code'], 'ABC');
      expect(json['name'], 'Test');
      expect(json['salePrice'], 150);
      expect(json['stock'], 10);
    });

    test('excludes empty id', () {
      final product = Product(
        id: '',
        code: 'NEW',
        name: 'New Product',
        brand: '',
        model: '',
        category: '',
        purchasePrice: 0,
        salePrice: 100,
        stock: 0,
        minimumStock: 0,
        unit: 'unidad',
      );

      final json = product.toJson();
      expect(json.containsKey('id'), isFalse);
    });
  });

  group('Product copyWith', () {
    test('copies with changes', () {
      final original = Product(
        id: '1',
        code: 'ABC',
        name: 'Original',
        brand: 'Brand',
        model: 'Model',
        category: 'Cat',
        purchasePrice: 100,
        salePrice: 150,
        stock: 10,
        minimumStock: 5,
        unit: 'unidad',
      );

      final copied = original.copyWith(name: 'Modified', stock: 20);

      expect(copied.id, original.id);
      expect(copied.name, 'Modified');
      expect(copied.stock, 20);
      expect(copied.salePrice, original.salePrice);
    });
  });

  group('Product getters', () {
    test('isLowStock returns true when stock <= minimumStock', () {
      final product = Product(
        id: '1',
        code: 'A',
        name: 'Low',
        brand: '',
        model: '',
        category: '',
        purchasePrice: 0,
        salePrice: 100,
        stock: 3,
        minimumStock: 5,
        unit: 'unidad',
      );
      expect(product.isLowStock, isTrue);
    });

    test('isLowStock returns false when stock > minimumStock', () {
      final product = Product(
        id: '1',
        code: 'A',
        name: 'OK',
        brand: '',
        model: '',
        category: '',
        purchasePrice: 0,
        salePrice: 100,
        stock: 10,
        minimumStock: 5,
        unit: 'unidad',
      );
      expect(product.isLowStock, isFalse);
    });
  });
}
