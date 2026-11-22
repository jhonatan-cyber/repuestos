import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:isar/isar.dart';

import '../database/isar_db.dart';
import '../database/isar_schemas.dart';
import '../network/dio_client.dart';
import '../providers.dart';
import 'connection_monitor.dart';
import 'mutation_queue.dart';

class SyncEngine {
  final IsarDB _db;
  final MutationQueue _queue;
  final ConnectionMonitor _monitor;
  final DioClient _dioClient;

  bool _isSyncing = false;

  SyncEngine(this._db, this._queue, this._monitor, this._dioClient);

  bool get isSyncing => _isSyncing;

  /// Main sync method: download from server and upload mutations
  Future<void> sync() async {
    if (_isSyncing) return;

    final hasConnection = await _monitor.hasConnection();
    if (!hasConnection) return;

    _isSyncing = true;
    try {
      // Upload pending mutations first
      await _uploadMutations();

      // Download latest data from server
      await _downloadFromServer();
    } catch (e) {
      // Sync failed, will retry later
      rethrow;
    } finally {
      _isSyncing = false;
    }
  }

  /// Download all data from server using backup endpoint
  Future<void> _downloadFromServer() async {
    final isar = _db.isar;
    if (isar == null) return;

    try {
      final response = await _dioClient.dio.get('/backup');
      if (response.statusCode != 200) return;

      final data = response.data as Map<String, dynamic>;

      await isar.writeTxn(() async {
        // Clear and reload products
        await isar.isarProducts.clear();
        if (data['products'] is List) {
          for (final item in data['products']) {
            await _putProduct(isar, item as Map<String, dynamic>);
          }
        }

        // Clear and reload clients
        await isar.isarClients.clear();
        if (data['clients'] is List) {
          for (final item in data['clients']) {
            await _putClient(isar, item as Map<String, dynamic>);
          }
        }

        // Clear and reload categories
        await isar.isarCategorys.clear();
        if (data['categories'] is List) {
          for (final item in data['categories']) {
            await _putCategory(isar, item as Map<String, dynamic>);
          }
        }

        // Clear and reload suppliers
        await isar.isarSuppliers.clear();
        if (data['suppliers'] is List) {
          for (final item in data['suppliers']) {
            await _putSupplier(isar, item as Map<String, dynamic>);
          }
        }

        // Clear and reload sales
        await isar.isarSales.clear();
        if (data['sales'] is List) {
          for (final item in data['sales']) {
            await _putSale(isar, item as Map<String, dynamic>);
          }
        }

        // Clear and reload purchases
        await isar.isarPurchases.clear();
        if (data['purchases'] is List) {
          for (final item in data['purchases']) {
            await _putPurchase(isar, item as Map<String, dynamic>);
          }
        }

        // Clear and reload quotations
        await isar.isarQuotations.clear();
        if (data['quotations'] is List) {
          for (final item in data['quotations']) {
            await _putQuotation(isar, item as Map<String, dynamic>);
          }
        }

        // Clear and reload expenses
        await isar.isarExpenses.clear();
        if (data['expenses'] is List) {
          for (final item in data['expenses']) {
            await _putExpense(isar, item as Map<String, dynamic>);
          }
        }

        // Clear and reload cash records
        await isar.isarCashRecords.clear();
        if (data['cashRecords'] is List) {
          for (final item in data['cashRecords']) {
            await _putCashRecord(isar, item as Map<String, dynamic>);
          }
        }

        // Clear and reload cash withdrawals
        await isar.isarCashWithdrawals.clear();
        if (data['cashWithdrawals'] is List) {
          for (final item in data['cashWithdrawals']) {
            await _putCashWithdrawal(isar, item as Map<String, dynamic>);
          }
        }

        // Clear and reload credits
        await isar.isarCredits.clear();
        if (data['credits'] is List) {
          for (final item in data['credits']) {
            await _putCredit(isar, item as Map<String, dynamic>);
          }
        }

        // Clear and reload credit payments
        await isar.isarCreditPayments.clear();
        if (data['creditPayments'] is List) {
          for (final item in data['creditPayments']) {
            await _putCreditPayment(isar, item as Map<String, dynamic>);
          }
        }

        // Clear and reload notifications
        await isar.isarNotifications.clear();
        if (data['notifications'] is List) {
          for (final item in data['notifications']) {
            await _putNotification(isar, item as Map<String, dynamic>);
          }
        }
      });
    } on DioException catch (_) {
      // Network error during download
      rethrow;
    }
  }

  /// Upload pending mutations to server
  Future<void> _uploadMutations() async {
    final mutations = await _queue.getPending();
    for (final mutation in mutations) {
      try {
        final payload = _queue.getPayload(mutation);
        switch (mutation.operation) {
          case 'CREATE':
            await _dioClient.dio.post(mutation.endpoint, data: payload);
            break;
          case 'UPDATE':
            await _dioClient.dio.put(mutation.endpoint, data: payload);
            break;
          case 'DELETE':
            await _dioClient.dio.delete(mutation.endpoint);
            break;
          default:
            break;
        }
        await _queue.markSynced(mutation.id);
      } catch (e) {
        await _queue.markFailed(mutation.id, e.toString());
      }
    }
  }

  // Helper methods to convert API JSON to Isar objects
  Future<void> _putProduct(Isar isar, Map<String, dynamic> json) async {
    final p = IsarProduct()
      ..uuid = (json['id'] ?? '').toString()
      ..code = json['code']?.toString() ?? ''
      ..name = json['name']?.toString() ?? ''
      ..description = json['description']?.toString()
      ..category = json['category']?.toString()
      ..brand = json['brand']?.toString()
      ..model = json['model']?.toString()
      ..buyPrice = (json['buyPrice'] as num?)?.toDouble()
      ..sellPrice = (json['sellPrice'] as num?)?.toDouble() ?? 0
      ..stock = json['stock'] as int? ?? 0
      ..minStock = json['minStock'] as int?
      ..unit = json['unit']?.toString()
      ..supplierId = json['supplierId']?.toString()
      ..supplierName = json['supplierName']?.toString()
      ..image = json['image']?.toString()
      ..updatedAt = DateTime.now()
      ..isSynced = true;
    await isar.isarProducts.put(p);
  }

  Future<void> _putClient(Isar isar, Map<String, dynamic> json) async {
    final c = IsarClient()
      ..uuid = (json['id'] ?? '').toString()
      ..name = json['name']?.toString() ?? ''
      ..phone = json['phone']?.toString()
      ..address = json['address']?.toString()
      ..status = json['status']?.toString()
      ..balance = (json['balance'] as num?)?.toDouble()
      ..totalPurchases = json['totalPurchases'] as int?
      ..updatedAt = DateTime.now()
      ..isSynced = true;
    await isar.isarClients.put(c);
  }

  Future<void> _putCategory(Isar isar, Map<String, dynamic> json) async {
    final c = IsarCategory()
      ..uuid = (json['id'] ?? '').toString()
      ..name = json['name']?.toString() ?? ''
      ..productCount = json['productCount'] as int?
      ..status = json['status']?.toString()
      ..updatedAt = DateTime.now()
      ..isSynced = true;
    await isar.isarCategorys.put(c);
  }

  Future<void> _putSupplier(Isar isar, Map<String, dynamic> json) async {
    final s = IsarSupplier()
      ..uuid = (json['id'] ?? '').toString()
      ..name = json['name']?.toString() ?? ''
      ..contactName = json['contactName']?.toString()
      ..phone = json['phone']?.toString()
      ..email = json['email']?.toString()
      ..address = json['address']?.toString()
      ..balance = (json['balance'] as num?)?.toDouble()
      ..totalPurchases = json['totalPurchases'] as int?
      ..updatedAt = DateTime.now()
      ..isSynced = true;
    await isar.isarSuppliers.put(s);
  }

  Future<void> _putSale(Isar isar, Map<String, dynamic> json) async {
    final s = IsarSale()
      ..uuid = (json['id'] ?? '').toString()
      ..clientId = json['clientId']?.toString()
      ..clientName = json['clientName']?.toString()
      ..sellerId = json['sellerId']?.toString()
      ..sellerName = json['sellerName']?.toString()
      ..date = json['date']?.toString() ?? ''
      ..subtotal = (json['subtotal'] as num?)?.toDouble() ?? 0
      ..discount = (json['discount'] as num?)?.toDouble()
      ..total = (json['total'] as num?)?.toDouble() ?? 0
      ..paymentMethod = json['paymentMethod']?.toString() ?? ''
      ..status = json['status']?.toString()
      ..notes = json['notes']?.toString()
      ..updatedAt = DateTime.now()
      ..isSynced = true;
    await isar.isarSales.put(s);
  }

  Future<void> _putPurchase(Isar isar, Map<String, dynamic> json) async {
    final p = IsarPurchase()
      ..uuid = (json['id'] ?? '').toString()
      ..date = json['date']?.toString() ?? ''
      ..supplierId = json['supplierId']?.toString()
      ..supplierName = json['supplierName']?.toString()
      ..buyerName = json['buyerName']?.toString()
      ..subtotal = (json['subtotal'] as num?)?.toDouble() ?? 0
      ..tax = (json['tax'] as num?)?.toDouble()
      ..total = (json['total'] as num?)?.toDouble() ?? 0
      ..initialPayment = (json['initialPayment'] as num?)?.toDouble()
      ..initialDebt = (json['initialDebt'] as num?)?.toDouble()
      ..debtAmount = (json['debtAmount'] as num?)?.toDouble()
      ..status = json['status']?.toString()
      ..paymentMethod = json['paymentMethod']?.toString()
      ..notes = json['notes']?.toString()
      ..updatedAt = DateTime.now()
      ..isSynced = true;
    await isar.isarPurchases.put(p);
  }

  Future<void> _putQuotation(Isar isar, Map<String, dynamic> json) async {
    final q = IsarQuotation()
      ..uuid = (json['id'] ?? '').toString()
      ..date = json['date']?.toString() ?? ''
      ..clientId = json['clientId']?.toString()
      ..clientName = json['clientName']?.toString()
      ..sellerName = json['sellerName']?.toString()
      ..subtotal = (json['subtotal'] as num?)?.toDouble() ?? 0
      ..discount = (json['discount'] as num?)?.toDouble()
      ..total = (json['total'] as num?)?.toDouble() ?? 0
      ..status = json['status']?.toString()
      ..validUntil = json['validUntil']?.toString()
      ..notes = json['notes']?.toString()
      ..updatedAt = DateTime.now()
      ..isSynced = true;
    await isar.isarQuotations.put(q);
  }

  Future<void> _putExpense(Isar isar, Map<String, dynamic> json) async {
    final e = IsarExpense()
      ..uuid = (json['id'] ?? '').toString()
      ..category = json['category']?.toString() ?? ''
      ..description = json['description']?.toString()
      ..amount = (json['amount'] as num?)?.toDouble() ?? 0
      ..date = json['date']?.toString() ?? ''
      ..notes = json['notes']?.toString()
      ..updatedAt = DateTime.now()
      ..isSynced = true;
    await isar.isarExpenses.put(e);
  }

  Future<void> _putCashRecord(Isar isar, Map<String, dynamic> json) async {
    final r = IsarCashRecord()
      ..uuid = (json['id'] ?? '').toString()
      ..date = json['date']?.toString() ?? ''
      ..openingBalance = (json['openingBalance'] as num?)?.toDouble() ?? 0
      ..cashIncome = (json['cashIncome'] as num?)?.toDouble()
      ..cashExpenses = (json['cashExpenses'] as num?)?.toDouble()
      ..closingBalance = (json['closingBalance'] as num?)?.toDouble()
      ..status = json['status']?.toString() ?? ''
      ..userName = json['userName']?.toString()
      ..closedAt = json['closedAt']?.toString()
      ..notes = json['notes']?.toString()
      ..updatedAt = DateTime.now()
      ..isSynced = true;
    await isar.isarCashRecords.put(r);
  }

  Future<void> _putCashWithdrawal(Isar isar, Map<String, dynamic> json) async {
    final w = IsarCashWithdrawal()
      ..uuid = (json['id'] ?? '').toString()
      ..recordId = json['recordId']?.toString()
      ..amount = (json['amount'] as num?)?.toDouble() ?? 0
      ..reason = json['reason']?.toString()
      ..userName = json['userName']?.toString()
      ..createdAt = DateTime.now()
      ..updatedAt = DateTime.now()
      ..isSynced = true;
    await isar.isarCashWithdrawals.put(w);
  }

  Future<void> _putCredit(Isar isar, Map<String, dynamic> json) async {
    final c = IsarCredit()
      ..uuid = (json['id'] ?? '').toString()
      ..clientId = json['clientId']?.toString()
      ..clientName = json['clientName']?.toString() ?? ''
      ..saleId = json['saleId']?.toString()
      ..total = (json['total'] as num?)?.toDouble() ?? 0
      ..remaining = (json['remaining'] as num?)?.toDouble() ?? 0
      ..status = json['status']?.toString() ?? ''
      ..dueDate = json['dueDate']?.toString()
      ..payments = json['payments'] as int?
      ..updatedAt = DateTime.now()
      ..isSynced = true;
    await isar.isarCredits.put(c);
  }

  Future<void> _putCreditPayment(Isar isar, Map<String, dynamic> json) async {
    final p = IsarCreditPayment()
      ..uuid = (json['id'] ?? '').toString()
      ..creditId = json['creditId']?.toString() ?? ''
      ..amount = (json['amount'] as num?)?.toDouble() ?? 0
      ..date = json['date']?.toString() ?? ''
      ..notes = json['notes']?.toString()
      ..userName = json['userName']?.toString()
      ..updatedAt = DateTime.now()
      ..isSynced = true;
    await isar.isarCreditPayments.put(p);
  }

  Future<void> _putNotification(Isar isar, Map<String, dynamic> json) async {
    final n = IsarNotification()
      ..uuid = (json['id'] ?? '').toString()
      ..type = json['type']?.toString() ?? ''
      ..title = json['title']?.toString() ?? ''
      ..message = json['message']?.toString() ?? ''
      ..entity = json['entity']?.toString()
      ..entityId = json['entityId']?.toString()
      ..isRead = json['isRead'] as bool? ?? false
      ..createdAt = DateTime.now()
      ..updatedAt = DateTime.now()
      ..isSynced = true;
    await isar.isarNotifications.put(n);
  }
}

final syncEngineProvider = Provider<SyncEngine>((ref) {
  throw UnimplementedError('Use syncEngineLazyProvider');
});

final syncEngineLazyProvider = Provider<SyncEngine>((ref) {
  final db = ref.watch(isarDbProvider);
  final queue = ref.watch(mutationQueueProvider);
  final monitor = ref.watch(connectionMonitorProvider.notifier);
  final dio = ref.watch(dioClientProvider);
  return SyncEngine(db, queue, monitor, dio);
});

final isSyncingProvider = StateProvider<bool>((ref) => false);

// Providers for IsarDB and MutationQueue
final isarDbProvider = Provider<IsarDB>((ref) => IsarDB.instance);
final mutationQueueProvider = Provider<MutationQueue>((ref) {
  final db = ref.watch(isarDbProvider);
  return MutationQueue(db);
});
