class SaleItem {
  SaleItem({
    required this.productId,
    required this.name,
    required this.price,
    required this.quantity,
  });

  final String productId;
  final String name;
  final num price;
  int quantity;

  num get subtotal => price * quantity;

  factory SaleItem.fromJson(Map<String, dynamic> json) => SaleItem(
        productId: json['productId']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        price: (json['price'] as num?) ?? 0,
        quantity: (json['quantity'] as int?) ?? 1,
      );

  Map<String, dynamic> toJson() => {
        'productId': productId,
        'name': name,
        'price': price,
        'quantity': quantity,
      };
}

class PaymentMethod {
  const PaymentMethod(this.id, this.label, this.icon);

  final String id;
  final String label;
  final String icon;
}

const paymentMethods = [
  PaymentMethod('cash', 'Efectivo', '💵'),
  PaymentMethod('card', 'Tarjeta', '💳'),
  PaymentMethod('transfer', 'Transferencia', '🏦'),
  PaymentMethod('credit', 'Crédito', '📋'),
];

class SaleRequest {
  SaleRequest({
    required this.items,
    required this.paymentMethod,
    this.clientId,
    this.discount = 0,
    this.notes,
    this.signature,
  });

  final List<SaleItem> items;
  final String paymentMethod;
  final String? clientId;
  final num discount;
  final String? notes;

  /// Base64 encoded PNG signature image.
  final String? signature;

  num get subtotal => items.fold(0, (sum, item) => sum + item.subtotal);
  num get total => subtotal - discount;

  Map<String, dynamic> toJson() => {
        'items': items.map((i) => i.toJson()).toList(),
        'paymentMethod': paymentMethod,
        if (clientId != null) 'clientId': clientId,
        'discount': discount,
        if (notes != null) 'notes': notes,
        if (signature != null) 'signature': signature,
      };
}

class SaleResult {
  SaleResult({
    required this.id,
    required this.total,
    required this.items,
    this.clientName,
  });

  final String id;
  final num total;
  final int items;
  final String? clientName;

  factory SaleResult.fromJson(Map<String, dynamic> json) => SaleResult(
        id: json['id']?.toString() ?? '',
        total: (json['total'] as num?) ?? 0,
        items: (json['items'] as List<dynamic>?)?.length ?? 0,
        clientName: json['clientName']?.toString(),
      );
}

// --- Historial de ventas ---

class HistorySaleItem {
  const HistorySaleItem({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.price,
    required this.subtotal,
  });

  final String productId;
  final String productName;
  final int quantity;
  final num price;
  final num subtotal;

  factory HistorySaleItem.fromJson(Map<String, dynamic> json) => HistorySaleItem(
        productId: json['productId']?.toString() ?? '',
        productName: json['productName']?.toString() ?? '',
        quantity: (json['quantity'] as int?) ?? 0,
        price: (json['price'] as num?) ?? 0,
        subtotal: (json['subtotal'] as num?) ?? 0,
      );
}

class Sale {
  const Sale({
    required this.id,
    required this.date,
    required this.clientName,
    required this.sellerName,
    required this.items,
    required this.subtotal,
    required this.discount,
    required this.total,
    required this.paymentMethod,
    required this.status,
    this.tax = 0,
    this.notes,
    this.signature,
  });

  final String id;
  final String date;
  final String clientName;
  final String sellerName;
  final List<HistorySaleItem> items;
  final num subtotal;
  final num tax;
  final num discount;
  final num total;
  final String paymentMethod;
  final String status;
  final String? notes;

  /// Base64 encoded PNG signature image.
  final String? signature;

  factory Sale.fromJson(Map<String, dynamic> json) => Sale(
        id: json['id']?.toString() ?? '',
        date: json['date']?.toString() ?? '',
        clientName: json['clientName']?.toString() ?? 'Cliente no registrado',
        sellerName: json['sellerName']?.toString() ?? '',
        items: (json['items'] as List<dynamic>?)
                ?.map((e) => HistorySaleItem.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [],
        subtotal: (json['subtotal'] as num?) ?? 0,
        tax: (json['tax'] as num?) ?? 0,
        discount: (json['discount'] as num?) ?? 0,
        total: (json['total'] as num?) ?? 0,
        paymentMethod: json['paymentMethod']?.toString() ?? '',
        status: json['status']?.toString() ?? '',
        notes: json['notes']?.toString(),
        signature: json['signature']?.toString(),
      );

  bool get isCanceled => status == 'cancelada';
  bool get isCompleted => status == 'completada';

  String get paymentMethodLabel {
    switch (paymentMethod) {
      case 'cash':
        return 'Efectivo';
      case 'card':
        return 'Tarjeta';
      case 'transfer':
        return 'Transferencia';
      case 'credit':
        return 'Crédito';
      default:
        return paymentMethod;
    }
  }

  factory Sale.fromIsar(dynamic isar) => Sale(
        id: isar.uuid,
        date: isar.date,
        clientName: isar.clientName ?? 'Cliente no registrado',
        sellerName: isar.sellerName ?? '',
        items: [],
        subtotal: isar.subtotal.toDouble(),
        tax: 0,
        discount: (isar.discount ?? 0).toDouble(),
        total: isar.total.toDouble(),
        paymentMethod: isar.paymentMethod,
        status: isar.status ?? '',
        notes: isar.notes,
      );
}
