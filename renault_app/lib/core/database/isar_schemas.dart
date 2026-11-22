import 'package:isar/isar.dart';

part 'isar_schemas.g.dart';

@Collection()
class IsarProduct {
  Id id = 0;
  late String uuid;
  late String code;
  late String name;
  String? description;
  String? category;
  String? brand;
  String? model;
  double? buyPrice;
  late double sellPrice;
  late int stock;
  int? minStock;
  String? unit;
  String? supplierId;
  String? supplierName;
  String? image;
  late DateTime updatedAt;
  bool isSynced = true;
}

@Collection()
class IsarClient {
  Id id = 0;
  late String uuid;
  late String name;
  String? phone;
  String? address;
  String? status;
  double? balance;
  int? totalPurchases;
  late DateTime updatedAt;
  bool isSynced = true;
}

@Collection()
class IsarCategory {
  Id id = 0;
  late String uuid;
  late String name;
  int? productCount;
  String? status;
  late DateTime updatedAt;
  bool isSynced = true;
}

@Collection()
class IsarSupplier {
  Id id = 0;
  late String uuid;
  late String name;
  String? contactName;
  String? phone;
  String? email;
  String? address;
  double? balance;
  int? totalPurchases;
  late DateTime updatedAt;
  bool isSynced = true;
}

@Collection()
class IsarSale {
  Id id = 0;
  late String uuid;
  String? clientId;
  String? clientName;
  String? sellerId;
  String? sellerName;
  late String date;
  late double subtotal;
  double? discount;
  late double total;
  late String paymentMethod;
  String? status;
  String? notes;
  late DateTime updatedAt;
  bool isSynced = true;
}

@Embedded()
class IsarSaleItem {
  String? productId;
  String? productName;
  late double quantity;
  late double price;
  late double subtotal;
}

@Collection()
class IsarPurchase {
  Id id = 0;
  late String uuid;
  late String date;
  String? supplierId;
  String? supplierName;
  String? buyerName;
  late double subtotal;
  double? tax;
  late double total;
  double? initialPayment;
  double? initialDebt;
  double? debtAmount;
  String? status;
  String? paymentMethod;
  String? notes;
  late DateTime updatedAt;
  bool isSynced = true;
}

@Embedded()
class IsarPurchaseItem {
  String? productId;
  String? productName;
  late double quantity;
  late double price;
  late double subtotal;
}

@Collection()
class IsarQuotation {
  Id id = 0;
  late String uuid;
  late String date;
  String? clientId;
  String? clientName;
  String? sellerName;
  late double subtotal;
  double? discount;
  late double total;
  String? status;
  String? validUntil;
  String? notes;
  late DateTime updatedAt;
  bool isSynced = true;
}

@Embedded()
class IsarQuotationItem {
  String? productId;
  String? productName;
  late double quantity;
  late double price;
  late double subtotal;
}

@Collection()
class IsarExpense {
  Id id = 0;
  late String uuid;
  late String category;
  String? description;
  late double amount;
  late String date;
  String? notes;
  late DateTime updatedAt;
  bool isSynced = true;
}

@Collection()
class IsarCashRecord {
  Id id = 0;
  late String uuid;
  late String date;
  late double openingBalance;
  double? cashIncome;
  double? cashExpenses;
  double? closingBalance;
  late String status;
  String? userName;
  String? closedAt;
  String? notes;
  late DateTime updatedAt;
  bool isSynced = true;
}

@Collection()
class IsarCashWithdrawal {
  Id id = 0;
  late String uuid;
  String? recordId;
  late double amount;
  String? reason;
  String? userName;
  late DateTime createdAt;
  late DateTime updatedAt;
  bool isSynced = true;
}

@Collection()
class IsarCredit {
  Id id = 0;
  late String uuid;
  String? clientId;
  late String clientName;
  String? saleId;
  late double total;
  late double remaining;
  late String status;
  String? dueDate;
  int? payments;
  late DateTime updatedAt;
  bool isSynced = true;
}

@Collection()
class IsarCreditPayment {
  Id id = 0;
  late String uuid;
  late String creditId;
  late double amount;
  late String date;
  String? notes;
  String? userName;
  late DateTime updatedAt;
  bool isSynced = true;
}

@Collection()
class IsarNotification {
  Id id = 0;
  late String uuid;
  late String type;
  late String title;
  late String message;
  String? entity;
  String? entityId;
  bool isRead = false;
  late DateTime createdAt;
  late DateTime updatedAt;
  bool isSynced = true;
}

@Collection()
class IsarMutation {
  Id id = 0;
  late String operation; // CREATE, UPDATE, DELETE
  late String endpoint;
  late String payload; // JSON string
  String? serverId;
  late DateTime createdAt;
  bool processed = false;
  bool failed = false;
  String? error;
  int retryCount = 0;
}
