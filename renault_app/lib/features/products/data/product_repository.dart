
import 'package:isar/isar.dart';

import '../../../core/database/isar_db.dart';
import '../../../core/database/isar_schemas.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/sync/connection_monitor.dart';
import '../../../core/sync/mutation_queue.dart';
import 'product_model.dart';

class ProductRepository {
  ProductRepository(this._client, this._db, this._queue, this._monitor);
  final DioClient _client;
  final IsarDB _db;
  final MutationQueue _queue;
  final ConnectionMonitor _monitor;

  Future<List<Product>> list(
      {String search = '', int page = 1, int limit = 50}) async {
    final isOnline = await _monitor.hasConnection();

    if (isOnline) {
      try {
        final response = await _client.dio.get(
          '/products',
          queryParameters: {
            'search': search,
            'page': page,
            'limit': limit,
          },
        );
        final data = response.data as Map<String, dynamic>;
        final items = (data['data'] as List<dynamic>? ?? []);
        return items
            .map((e) => Product.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {
        // Fallback to offline
      }
    }

    // Read from Isar
    final isar = _db.isar;
    if (isar == null) return [];

    final all = await isar.isarProducts.where().findAll();
    var result = all.map((p) => Product.fromIsar(p)).toList();

    if (search.isNotEmpty) {
      final lower = search.toLowerCase();
      result = result
          .where((p) =>
              p.name.toLowerCase().contains(lower) ||
              p.code.toLowerCase().contains(lower))
          .toList();
    }

    return result;
  }

  Future<Product> create(Product product) async {
    final isOnline = await _monitor.hasConnection();

    if (isOnline) {
      try {
        final response =
            await _client.dio.post('/products', data: product.toJson());
        final data = response.data as Map<String, dynamic>;
        return Product.fromJson(data);
      } catch (_) {
        // Fallback to offline
      }
    }

    // Save to Isar and enqueue mutation
    final isar = _db.isar;
    if (isar != null) {
      final ip = IsarProduct()
        ..uuid = product.id
        ..code = product.code
        ..name = product.name
        ..description = product.description
        ..category = product.category
        ..brand = product.brand
        ..model = product.model
        ..buyPrice = product.purchasePrice.toDouble()
        ..sellPrice = product.salePrice.toDouble()
        ..stock = product.stock.toInt()
        ..minStock = product.minimumStock.toInt()
        ..unit = product.unit
        ..supplierId = product.supplierId
        ..supplierName = product.supplierName
        ..image = product.image
        ..updatedAt = DateTime.now()
        ..isSynced = false;
      await isar.writeTxn(() => isar.isarProducts.put(ip));
    }
    await _queue.enqueue(
      operation: 'CREATE',
      endpoint: '/products',
      payload: product.toJson(),
    );
    return product;
  }

  Future<Product> update(String id, Product product) async {
    final isOnline = await _monitor.hasConnection();

    if (isOnline) {
      try {
        final response =
            await _client.dio.put('/products/$id', data: product.toJson());
        final data = response.data as Map<String, dynamic>;
        return Product.fromJson(data);
      } catch (_) {
        // Fallback to offline
      }
    }

    // Save to Isar and enqueue mutation
    final isar = _db.isar;
    if (isar != null) {
      final existing = await isar.isarProducts.filter().uuidEqualTo(id).findFirst();
      if (existing != null) {
        existing.code = product.code;
        existing.name = product.name;
        existing.description = product.description;
        existing.category = product.category;
        existing.brand = product.brand;
        existing.model = product.model;
        existing.buyPrice = product.purchasePrice.toDouble();
        existing.sellPrice = product.salePrice.toDouble();
        existing.stock = product.stock.toInt();
        existing.minStock = product.minimumStock.toInt();
        existing.unit = product.unit;
        existing.supplierId = product.supplierId;
        existing.supplierName = product.supplierName;
        existing.image = product.image;
        existing.updatedAt = DateTime.now();
        existing.isSynced = false;
        await isar.writeTxn(() => isar.isarProducts.put(existing));
      }
    }
    await _queue.enqueue(
      operation: 'UPDATE',
      endpoint: '/products/$id',
      payload: product.toJson(),
    );
    return product;
  }

  Future<void> delete(String id) async {
    final isOnline = await _monitor.hasConnection();

    if (isOnline) {
      try {
        await _client.dio.delete('/products/$id');
        return;
      } catch (_) {
        // Fallback to offline
      }
    }

    // Mark as deleted in Isar and enqueue mutation
    final isar = _db.isar;
    if (isar != null) {
      final existing = await isar.isarProducts.filter().uuidEqualTo(id).findFirst();
      if (existing != null) {
        await isar.writeTxn(() => isar.isarProducts.delete(existing.id));
      }
    }
    await _queue.enqueue(
      operation: 'DELETE',
      endpoint: '/products/$id',
      payload: {'id': id},
    );
  }
}
