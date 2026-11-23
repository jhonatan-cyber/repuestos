import 'package:isar/isar.dart';
import '../../../core/database/isar_db.dart';
import '../../../core/database/isar_schemas.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/sync/connection_monitor.dart';
import '../../../../features/categories/data/category_model.dart';
import '../../../../features/products/data/product_model.dart';
import '../../../../features/suppliers/data/supplier_model.dart';
import 'inventory_model.dart';

class InventoryRepository {
  InventoryRepository(this._client, this._db, this._monitor);
  final DioClient _client;
  final IsarDB _db;
  final ConnectionMonitor _monitor;

  Future<List<Product>> getProducts() async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get('/products', queryParameters: {'limit': 10000});
        final data = response.data as Map<String, dynamic>;
        final items = (data['data'] as List<dynamic>? ?? []);
        return items.map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar == null) return [];
    final all = await isar.isarProducts.where().findAll();
    return all.map((p) => Product.fromIsar(p)).toList();
  }

  Future<List<Category>> getCategories() async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get('/categories');
        final data = response.data as Map<String, dynamic>;
        final items = (data['data'] as List<dynamic>? ?? []);
        return items.map((e) => Category.fromJson(e as Map<String, dynamic>)).toList();
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar == null) return [];
    final all = await isar.isarCategorys.where().findAll();
    return all.map((c) => Category.fromIsar(c)).toList();
  }

  Future<List<Supplier>> getSuppliers() async {
    final isOnline = await _monitor.hasConnection();
    if (isOnline) {
      try {
        final response = await _client.dio.get('/suppliers');
        final data = response.data as Map<String, dynamic>;
        final items = (data['data'] as List<dynamic>? ?? []);
        return items.map((e) => Supplier.fromJson(e as Map<String, dynamic>)).toList();
      } catch (_) {}
    }
    final isar = _db.isar;
    if (isar == null) return [];
    final all = await isar.isarSuppliers.where().findAll();
    return all.map((s) => Supplier.fromIsar(s)).toList();
  }

  InventoryStats calculateStats(List<Product> products) {
    final raw = products.map((p) {
      return {
        'stock': p.stock,
        'minimumStock': p.minimumStock,
        'purchasePrice': p.purchasePrice,
        'salePrice': p.salePrice,
      };
    }).toList();
    return InventoryStats.fromProducts(raw);
  }
}
