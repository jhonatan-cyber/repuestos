import 'dart:io';

import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

import 'isar_schemas.dart';

class IsarDB {
  IsarDB._();
  static final IsarDB instance = IsarDB._();

  Isar? _isar;

  Isar? get isar => _isar;

  Future<Isar> initialize() async {
    if (_isar != null) return _isar!;

    final dir = await getApplicationDocumentsDirectory();
    final isarPath = p.join(dir.path, 'renault');

    // Ensure directory exists
    final directory = Directory(isarPath);
    if (!await directory.exists()) {
      await directory.create(recursive: true);
    }

    _isar = await Isar.open(
      [
        IsarProductSchema,
        IsarClientSchema,
        IsarCategorySchema,
        IsarSupplierSchema,
        IsarSaleSchema,
        IsarPurchaseSchema,
        IsarQuotationSchema,
        IsarExpenseSchema,
        IsarCashRecordSchema,
        IsarCashWithdrawalSchema,
        IsarCreditSchema,
        IsarCreditPaymentSchema,
        IsarNotificationSchema,
        IsarMutationSchema,
      ],
      directory: isarPath,
      inspector: true,
    );

    return _isar!;
  }

  Future<void> close() async {
    await _isar?.close();
    _isar = null;
  }

  Future<void> clearAll() async {
    final isar = this.isar;
    if (isar == null) return;

    await isar.writeTxn(() async {
      await isar.isarProducts.clear();
      await isar.isarClients.clear();
      await isar.isarCategorys.clear();
      await isar.isarSuppliers.clear();
      await isar.isarSales.clear();
      await isar.isarPurchases.clear();
      await isar.isarQuotations.clear();
      await isar.isarExpenses.clear();
      await isar.isarCashRecords.clear();
      await isar.isarCashWithdrawals.clear();
      await isar.isarCredits.clear();
      await isar.isarCreditPayments.clear();
      await isar.isarNotifications.clear();
      await isar.isarMutations.clear();
    });
  }
}
