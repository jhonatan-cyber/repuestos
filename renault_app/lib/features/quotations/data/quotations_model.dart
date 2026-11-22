class QuotationItem {
  QuotationItem({
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

  factory QuotationItem.fromJson(Map<String, dynamic> json) => QuotationItem(
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

class QuotationRequest {
  QuotationRequest({
    required this.clientId,
    required this.items,
    this.notes,
    this.validityDays = 7,
  });

  final String clientId;
  final List<QuotationItem> items;
  final String? notes;
  final int validityDays;

  num get total => items.fold(0, (sum, item) => sum + item.subtotal);

  Map<String, dynamic> toJson() => {
        'clientId': clientId,
        'items': items.map((i) => i.toJson()).toList(),
        if (notes != null) 'notes': notes,
        'validityDays': validityDays,
      };
}

class QuotationItemDetail {
  QuotationItemDetail({
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

  factory QuotationItemDetail.fromJson(Map<String, dynamic> json) => QuotationItemDetail(
        productId: json['productId']?.toString() ?? '',
        productName: json['productName']?.toString() ?? '',
        quantity: (json['quantity'] as int?) ?? 1,
        price: (json['price'] as num?) ?? 0,
        subtotal: (json['subtotal'] as num?) ?? 0,
      );
}

class SupplierRequestResponse {
  SupplierRequestResponse({
    required this.id,
    required this.supplierName,
    required this.status,
    required this.sentAt,
    this.respondedAt,
    this.notes,
    this.response,
  });

  final String id;
  final String supplierName;
  final String status;
  final String sentAt;
  final String? respondedAt;
  final String? notes;
  final String? response;

  String get statusLabel {
    switch (status) {
      case 'enviado':
      case 'pending':
        return 'Enviada';
      case 'respondido':
      case 'responded':
        return 'Respondida';
      case 'rechazado':
      case 'rejected':
        return 'Rechazada';
      default:
        return status;
    }
  }

  String get statusColorKey {
    switch (status) {
      case 'enviado':
      case 'pending':
        return 'amber';
      case 'respondido':
      case 'responded':
        return 'green';
      case 'rechazado':
      case 'rejected':
        return 'red';
      default:
        return 'grey';
    }
  }

  factory SupplierRequestResponse.fromJson(Map<String, dynamic> json) => SupplierRequestResponse(
        id: json['id']?.toString() ?? '',
        supplierName: json['supplierName']?.toString() ?? '',
        status: json['status']?.toString() ?? 'pending',
        sentAt: json['sentAt']?.toString() ?? '',
        respondedAt: json['respondedAt']?.toString(),
        notes: json['notes']?.toString(),
        response: json['response']?.toString(),
      );
}

class Quotation {
  Quotation({
    required this.id,
    required this.date,
    required this.clientId,
    required this.clientName,
    required this.sellerName,
    required this.items,
    required this.subtotal,
    required this.tax,
    required this.discount,
    required this.total,
    required this.validUntil,
    required this.status,
    required this.convertedToSaleId,
    this.notes,
  });

  final String id;
  final String date;
  final String clientId;
  final String clientName;
  final String sellerName;
  final List<QuotationItemDetail> items;
  final num subtotal;
  final num tax;
  final num discount;
  final num total;
  final String validUntil;
  final String status;
  final String? convertedToSaleId;
  final String? notes;

  bool get isPending => status == 'pending';
  bool get isAccepted => status == 'accepted';
  bool get isExpired => status == 'expired';

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'accepted':
        return 'Aceptada';
      case 'expired':
        return 'Expirada';
      case 'solicitado':
        return 'Solicitado';
      default:
        return status;
    }
  }

  String get statusColorKey {
    switch (status) {
      case 'pending':
        return 'amber';
      case 'accepted':
        return 'green';
      case 'expired':
        return 'red';
      case 'solicitado':
        return 'blue';
      default:
        return 'grey';
    }
  }

  factory Quotation.fromJson(Map<String, dynamic> json) => Quotation(
        id: json['id']?.toString() ?? '',
        date: json['date']?.toString() ?? '',
        clientId: json['clientId']?.toString() ?? '',
        clientName: json['clientName']?.toString() ?? '',
        sellerName: json['sellerName']?.toString() ?? '',
        items: (json['items'] as List<dynamic>?)
                ?.map((e) => QuotationItemDetail.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [],
        subtotal: (json['subtotal'] as num?) ?? 0,
        tax: (json['tax'] as num?) ?? 0,
        discount: (json['discount'] as num?) ?? 0,
        total: (json['total'] as num?) ?? 0,
        validUntil: json['validUntil']?.toString() ?? '',
        status: json['status']?.toString() ?? 'pending',
        convertedToSaleId: json['convertedToSaleId']?.toString(),
        notes: json['notes']?.toString(),
      );

  factory Quotation.fromIsar(dynamic isar) => Quotation(
        id: isar.uuid,
        date: isar.date,
        clientId: isar.clientId ?? '',
        clientName: isar.clientName ?? '',
        sellerName: isar.sellerName ?? '',
        items: [],
        subtotal: isar.subtotal.toDouble(),
        tax: 0,
        discount: (isar.discount ?? 0).toDouble(),
        total: isar.total.toDouble(),
        validUntil: isar.validUntil ?? '',
        status: isar.status ?? 'pending',
        convertedToSaleId: null,
        notes: isar.notes,
      );
}

class QuotationResult {
  QuotationResult({
    required this.id,
    required this.total,
    required this.items,
  });

  final String id;
  final num total;
  final int items;

  factory QuotationResult.fromJson(Map<String, dynamic> json) => QuotationResult(
        id: json['id']?.toString() ?? '',
        total: (json['total'] as num?) ?? 0,
        items: (json['items'] as List<dynamic>?)?.length ?? 0,
      );
}
