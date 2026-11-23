import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:renault_app/features/sales/presentation/providers/sales_provider.dart';
import 'package:renault_app/features/products/data/product_model.dart';

void main() {
  group('CartNotifier', () {
    test('starts with empty cart', () {
      final container = ProviderContainer();
      final cart = container.read(cartProvider);
      expect(cart.items, isEmpty);
      expect(cart.total, 0.0);
      container.dispose();
    });

    test('adds item to cart', () {
      final container = ProviderContainer();
      final notifier = container.read(cartProvider.notifier);

      notifier.addItem(Product(
        id: '1',
        code: 'ABC',
        name: 'Filtro de aceite',
        brand: '',
        model: '',
        category: '',
        purchasePrice: 100,
        salePrice: 150,
        stock: 10,
        minimumStock: 5,
        unit: 'unidad',
      ));

      final cart = container.read(cartProvider);
      expect(cart.items, hasLength(1));
      expect(cart.items.first.name, 'Filtro de aceite');
      expect(cart.total, 150.0);
      container.dispose();
    });

    test('removes item from cart', () {
      final container = ProviderContainer();
      final notifier = container.read(cartProvider.notifier);

      notifier.addItem(Product(
        id: '1',
        code: 'A',
        name: 'Filtro',
        brand: '',
        model: '',
        category: '',
        purchasePrice: 0,
        salePrice: 150,
        stock: 10,
        minimumStock: 0,
        unit: 'unidad',
      ));

      notifier.removeItem(0);

      final cart = container.read(cartProvider);
      expect(cart.items, isEmpty);
      expect(cart.total, 0.0);
      container.dispose();
    });

    test('updates item quantity', () {
      final container = ProviderContainer();
      final notifier = container.read(cartProvider.notifier);

      notifier.addItem(Product(
        id: '1',
        code: 'A',
        name: 'Filtro',
        brand: '',
        model: '',
        category: '',
        purchasePrice: 0,
        salePrice: 150,
        stock: 10,
        minimumStock: 0,
        unit: 'unidad',
      ));

      notifier.updateQuantity(0, 3);

      final cart = container.read(cartProvider);
      expect(cart.items.first.quantity, 3);
      expect(cart.total, 450.0);
      container.dispose();
    });

    test('clears cart', () {
      final container = ProviderContainer();
      final notifier = container.read(cartProvider.notifier);

      notifier.addItem(Product(
        id: '1',
        code: 'A',
        name: 'Filtro',
        brand: '',
        model: '',
        category: '',
        purchasePrice: 0,
        salePrice: 150,
        stock: 10,
        minimumStock: 0,
        unit: 'unidad',
      ));
      notifier.addItem(Product(
        id: '2',
        code: 'B',
        name: 'Pastilla',
        brand: '',
        model: '',
        category: '',
        purchasePrice: 0,
        salePrice: 200,
        stock: 10,
        minimumStock: 0,
        unit: 'unidad',
      ));

      notifier.clear();

      final cart = container.read(cartProvider);
      expect(cart.items, isEmpty);
      expect(cart.total, 0.0);
      container.dispose();
    });

    test('calculates total correctly', () {
      final container = ProviderContainer();
      final notifier = container.read(cartProvider.notifier);

      notifier.addItem(Product(
        id: '1',
        code: 'A',
        name: 'Filtro',
        brand: '',
        model: '',
        category: '',
        purchasePrice: 0,
        salePrice: 100,
        stock: 10,
        minimumStock: 0,
        unit: 'unidad',
      ));
      notifier.addItem(Product(
        id: '2',
        code: 'B',
        name: 'Pastilla',
        brand: '',
        model: '',
        category: '',
        purchasePrice: 0,
        salePrice: 250,
        stock: 10,
        minimumStock: 0,
        unit: 'unidad',
      ));

      // Set quantities
      notifier.updateQuantity(0, 2);
      notifier.updateQuantity(1, 1);

      final cart = container.read(cartProvider);
      expect(cart.total, 450.0); // 2*100 + 1*250
      container.dispose();
    });

    test('adds duplicate product increases quantity', () {
      final container = ProviderContainer();
      final notifier = container.read(cartProvider.notifier);

      final product = Product(
        id: '1',
        code: 'A',
        name: 'Filtro',
        brand: '',
        model: '',
        category: '',
        purchasePrice: 0,
        salePrice: 150,
        stock: 10,
        minimumStock: 0,
        unit: 'unidad',
      );

      notifier.addItem(product);
      notifier.addItem(product);

      final cart = container.read(cartProvider);
      expect(cart.items, hasLength(1));
      expect(cart.items.first.quantity, 2);
      expect(cart.total, 300.0);
      container.dispose();
    });
  });
}
