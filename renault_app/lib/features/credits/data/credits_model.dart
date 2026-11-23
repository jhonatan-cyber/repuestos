class CreditPaymentRecord {
  CreditPaymentRecord({
    required this.id,
    required this.amount,
    required this.date,
    this.notes,
    this.userName,
  });

  final String id;
  final num amount;
  final String date;
  final String? notes;
  final String? userName;

  factory CreditPaymentRecord.fromJson(Map<String, dynamic> json) => CreditPaymentRecord(
        id: json['id']?.toString() ?? '',
        amount: (json['amount'] as num?) ?? 0,
        date: json['date']?.toString() ?? '',
        notes: json['notes']?.toString(),
        userName: json['userName']?.toString(),
      );
}

class CreditSaleItem {
  CreditSaleItem({
    required this.productName,
    required this.quantity,
    required this.price,
    required this.subtotal,
  });

  final String productName;
  final num quantity;
  final num price;
  final num subtotal;

  factory CreditSaleItem.fromJson(Map<String, dynamic> json) {
    final product = json['product'] as Map<String, dynamic>?;
    return CreditSaleItem(
      productName: product?['name']?.toString() ?? json['productName']?.toString() ?? '',
      quantity: (json['quantity'] as num?) ?? 0,
      price: (json['price'] as num?) ?? 0,
      subtotal: (json['subtotal'] as num?) ?? 0,
    );
  }
}

class CreditSale {
  CreditSale({
    required this.id,
    required this.date,
    required this.subtotal,
    required this.discount,
    required this.total,
    required this.paymentMethod,
    required this.items,
    this.notes,
    this.sellerName,
  });

  final String id;
  final String date;
  final num subtotal;
  final num discount;
  final num total;
  final String paymentMethod;
  final List<CreditSaleItem> items;
  final String? notes;
  final String? sellerName;

  factory CreditSale.fromJson(Map<String, dynamic> json) {
    final seller = json['seller'] as Map<String, dynamic>?;
    final sellerName = seller != null
        ? '${seller['firstName'] ?? ''} ${seller['lastName'] ?? ''}'.trim()
        : null;
    return CreditSale(
      id: json['id']?.toString() ?? '',
      date: json['date']?.toString() ?? '',
      subtotal: (json['subtotal'] as num?) ?? 0,
      discount: (json['discount'] as num?) ?? 0,
      total: (json['total'] as num?) ?? 0,
      paymentMethod: json['paymentMethod']?.toString() ?? '',
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => CreditSaleItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      notes: json['notes']?.toString(),
      sellerName: sellerName,
    );
  }
}

class CreditClient {
  CreditClient({
    required this.id,
    required this.name,
    this.phone,
  });

  final String id;
  final String name;
  final String? phone;

  factory CreditClient.fromJson(Map<String, dynamic> json) => CreditClient(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        phone: json['phone']?.toString(),
      );
}

class Credit {
  Credit({
    required this.id,
    required this.clientName,
    required this.total,
    required this.remaining,
    required this.status,
    this.dueDate,
    this.payments = 0,
    this.client,
    this.sale,
    this.paymentRecords = const [],
  });

  final String id;
  final String clientName;
  final num total;
  final num remaining;
  final String status;
  final String? dueDate;
  final int payments;
  final CreditClient? client;
  final CreditSale? sale;
  final List<CreditPaymentRecord> paymentRecords;

  bool get isActive => status == 'active' || status == 'pending';
  num get progress => total > 0 ? (remaining / total) * 100 : 0;
  String get clientPhone => client?.phone ?? '';

  bool isOverdue() {
    if (dueDate == null || dueDate!.isEmpty) return false;
    try {
      final due = DateTime.parse(dueDate!);
      return DateTime.now().isAfter(due);
    } catch (_) {
      return false;
    }
  }

  int daysUntilDue() {
    if (dueDate == null || dueDate!.isEmpty) return 0;
    try {
      final due = DateTime.parse(dueDate!);
      return due.difference(DateTime.now()).inDays;
    } catch (_) {
      return 0;
    }
  }

  factory Credit.fromJson(Map<String, dynamic> json) => Credit(
        id: json['id']?.toString() ?? '',
        clientName: json['clientName']?.toString() ??
            (json['client'] as Map<String, dynamic>?)?['name']?.toString() ??
            '',
        total: (json['total'] as num?) ?? 0,
        remaining: (json['remaining'] as num?) ?? 0,
        status: json['status']?.toString() ?? 'active',
        dueDate: json['dueDate']?.toString(),
        payments: json['payments'] is List ? 0 : (json['payments'] as int?) ?? 0,
        client: json['client'] != null
            ? CreditClient.fromJson(json['client'] as Map<String, dynamic>)
            : null,
        sale: json['sale'] != null
            ? CreditSale.fromJson(json['sale'] as Map<String, dynamic>)
            : null,
        paymentRecords: (json['payments'] is List)
            ? (json['payments'] as List<dynamic>)
                .map((e) => CreditPaymentRecord.fromJson(e as Map<String, dynamic>))
                .toList()
            : [],
      );

  factory Credit.fromIsar(dynamic isar) => Credit(
        id: isar.uuid,
        clientName: isar.clientName,
        total: isar.total.toDouble(),
        remaining: isar.remaining.toDouble(),
        status: isar.status,
        dueDate: isar.dueDate,
        payments: isar.payments ?? 0,
      );
}

class CreditPayment {
  CreditPayment({
    required this.creditId,
    required this.amount,
    this.notes,
  });

  final String creditId;
  final num amount;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'amount': amount,
        if (notes != null) 'notes': notes,
      };
}

class PurchaseCreditPayment {
  PurchaseCreditPayment({
    required this.id,
    required this.amount,
    required this.date,
    this.notes,
    this.userName,
  });

  final String id;
  final num amount;
  final String date;
  final String? notes;
  final String? userName;

  factory PurchaseCreditPayment.fromJson(Map<String, dynamic> json) => PurchaseCreditPayment(
        id: json['id']?.toString() ?? '',
        amount: (json['amount'] as num?) ?? 0,
        date: json['date']?.toString() ?? '',
        notes: json['notes']?.toString(),
        userName: json['userName']?.toString(),
      );
}

class PurchaseCreditSupplier {
  PurchaseCreditSupplier({
    required this.id,
    required this.name,
    this.phone,
  });

  final String id;
  final String name;
  final String? phone;

  factory PurchaseCreditSupplier.fromJson(Map<String, dynamic> json) => PurchaseCreditSupplier(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        phone: json['phone']?.toString(),
      );
}

class PurchaseCredit {
  PurchaseCredit({
    required this.id,
    required this.supplierName,
    required this.total,
    required this.remaining,
    required this.status,
    this.payments = 0,
    this.dueDate,
    this.supplier,
    this.paymentRecords = const [],
  });

  final String id;
  final String supplierName;
  final num total;
  final num remaining;
  final String status;
  final int payments;
  final String? dueDate;
  final PurchaseCreditSupplier? supplier;
  final List<PurchaseCreditPayment> paymentRecords;

  bool get isActive => status == 'active' || status == 'pending';
  num get progress => total > 0 ? (remaining / total) * 100 : 0;
  String get supplierPhone => supplier?.phone ?? '';

  bool isOverdue() {
    if (dueDate == null || dueDate!.isEmpty) return false;
    try {
      final due = DateTime.parse(dueDate!);
      return DateTime.now().isAfter(due);
    } catch (_) {
      return false;
    }
  }

  int daysUntilDue() {
    if (dueDate == null || dueDate!.isEmpty) return 0;
    try {
      final due = DateTime.parse(dueDate!);
      return due.difference(DateTime.now()).inDays;
    } catch (_) {
      return 0;
    }
  }

  factory PurchaseCredit.fromJson(Map<String, dynamic> json) => PurchaseCredit(
        id: json['id']?.toString() ?? '',
        supplierName: json['supplierName']?.toString() ??
            (json['supplier'] as Map<String, dynamic>?)?['name']?.toString() ??
            '',
        total: (json['total'] as num?) ?? 0,
        remaining: (json['remaining'] as num?) ?? 0,
        status: json['status']?.toString() ?? 'active',
        dueDate: json['dueDate']?.toString(),
        payments: json['payments'] is List ? 0 : (json['payments'] as int?) ?? 0,
        supplier: json['supplier'] != null
            ? PurchaseCreditSupplier.fromJson(json['supplier'] as Map<String, dynamic>)
            : null,
        paymentRecords: (json['payments'] is List)
            ? (json['payments'] as List<dynamic>)
                .map((e) => PurchaseCreditPayment.fromJson(e as Map<String, dynamic>))
                .toList()
            : [],
      );
}
