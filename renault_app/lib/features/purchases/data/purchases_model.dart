class PurchaseItem {
  PurchaseItem({
    required this.productId,
    required this.name,
    required this.quantity,
    required this.unitPrice,
  });

  final String productId;
  final String name;
  final int quantity;
  final num unitPrice;

  num get subtotal => quantity * unitPrice;

  factory PurchaseItem.fromJson(Map<String, dynamic> json) => PurchaseItem(
        productId: json['productId']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        quantity: (json['quantity'] as int?) ?? 1,
        unitPrice: (json['unitPrice'] as num?) ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'productId': productId,
        'name': name,
        'quantity': quantity,
        'unitPrice': unitPrice,
      };
}

class PurchaseRequest {
  PurchaseRequest({
    required this.supplierId,
    required this.items,
    required this.paymentMethod,
    required this.totalPaid,
    this.notes,
  });

  final String supplierId;
  final List<PurchaseItem> items;
  final String paymentMethod;
  final num totalPaid;
  final String? notes;

  num get subtotal => items.fold(0, (sum, item) => sum + item.subtotal);

  Map<String, dynamic> toJson() => {
        'supplierId': supplierId,
        'items': items.map((i) => i.toJson()).toList(),
        'paymentMethod': paymentMethod,
        'totalPaid': totalPaid,
        if (notes != null) 'notes': notes,
      };
}

class PurchaseResult {
  PurchaseResult({
    required this.id,
    required this.supplierName,
    required this.total,
    required this.items,
  });

  final String id;
  final String supplierName;
  final num total;
  final int items;

  factory PurchaseResult.fromJson(Map<String, dynamic> json) => PurchaseResult(
        id: json['id']?.toString() ?? '',
        supplierName: json['supplierName']?.toString() ?? '',
        total: (json['total'] as num?) ?? 0,
        items: (json['items'] as List<dynamic>?)?.length ?? 0,
      );
}

class PurchaseItemDetail {
  PurchaseItemDetail({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.price,
  });

  final String productId;
  final String productName;
  final int quantity;
  final num price;

  num get subtotal => quantity * price;

  factory PurchaseItemDetail.fromJson(Map<String, dynamic> json) => PurchaseItemDetail(
        productId: json['productId']?.toString() ?? '',
        productName: json['productName']?.toString() ?? '',
        quantity: (json['quantity'] as int?) ?? 1,
        price: (json['price'] as num?) ?? 0,
      );
}

class Purchase {
  Purchase({
    required this.id,
    required this.date,
    required this.supplierId,
    required this.supplierName,
    required this.buyerName,
    required this.items,
    required this.subtotal,
    required this.tax,
    required this.total,
    required this.initialPayment,
    required this.initialDebt,
    required this.debtAmount,
    required this.status,
    required this.paymentMethod,
    this.notes,
  });

  final String id;
  final String date;
  final String supplierId;
  final String supplierName;
  final String buyerName;
  final List<PurchaseItemDetail> items;
  final num subtotal;
  final num tax;
  final num total;
  final num initialPayment;
  final num initialDebt;
  final num debtAmount;
  final String status;
  final String paymentMethod;
  final String? notes;

  String get statusLabel {
    switch (status) {
      case 'recibida':
        return 'Recibida';
      case 'pendiente':
        return 'Pendiente';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  }

  String get statusColorHex {
    switch (status) {
      case 'recibida':
        return 'green';
      case 'pendiente':
        return 'amber';
      case 'cancelada':
        return 'red';
      default:
        return 'grey';
    }
  }

  String get paymentMethodLabel {
    switch (paymentMethod) {
      case 'efectivo':
        return 'Efectivo';
      case 'tarjeta':
        return 'Tarjeta';
      case 'transferencia':
        return 'Transferencia';
      case 'credito':
      case 'crédito':
        return 'Crédito';
      default:
        return paymentMethod;
    }
  }

  factory Purchase.fromJson(Map<String, dynamic> json) => Purchase(
        id: json['id']?.toString() ?? '',
        date: json['date']?.toString() ?? '',
        supplierId: json['supplierId']?.toString() ?? '',
        supplierName: json['supplierName']?.toString() ?? '',
        buyerName: json['buyerName']?.toString() ?? '',
        items: (json['items'] as List<dynamic>?)
                ?.map((e) => PurchaseItemDetail.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [],
        subtotal: (json['subtotal'] as num?) ?? 0,
        tax: (json['tax'] as num?) ?? 0,
        total: (json['total'] as num?) ?? 0,
        initialPayment: (json['initialPayment'] as num?) ?? 0,
        initialDebt: (json['initialDebt'] as num?) ?? 0,
        debtAmount: (json['debtAmount'] as num?) ?? 0,
        status: json['status']?.toString() ?? 'pendiente',
        paymentMethod: json['paymentMethod']?.toString() ?? 'efectivo',
        notes: json['notes']?.toString(),
      );

  factory Purchase.fromIsar(dynamic isar) => Purchase(
        id: isar.uuid,
        date: isar.date,
        supplierId: isar.supplierId ?? '',
        supplierName: isar.supplierName ?? '',
        buyerName: isar.buyerName ?? '',
        items: [],
        subtotal: isar.subtotal.toDouble(),
        tax: (isar.tax ?? 0).toDouble(),
        total: isar.total.toDouble(),
        initialPayment: (isar.initialPayment ?? 0).toDouble(),
        initialDebt: (isar.initialDebt ?? 0).toDouble(),
        debtAmount: (isar.debtAmount ?? 0).toDouble(),
        status: isar.status ?? 'pendiente',
        paymentMethod: isar.paymentMethod ?? 'efectivo',
        notes: isar.notes,
      );
}
