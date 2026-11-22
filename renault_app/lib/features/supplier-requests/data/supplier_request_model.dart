import 'package:flutter/material.dart';

class SupplierRequestProduct {
  SupplierRequestProduct({
    required this.id,
    required this.code,
    required this.name,
    this.description,
    this.image,
    required this.quantity,
  });

  final String id;
  final String code;
  final String name;
  final String? description;
  final String? image;
  final int quantity;

  factory SupplierRequestProduct.fromJson(Map<String, dynamic> json) =>
      SupplierRequestProduct(
        id: json['id']?.toString() ?? '',
        code: json['code']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        description: json['description']?.toString(),
        image: json['image']?.toString(),
        quantity: (json['quantity'] as int?) ?? 0,
      );
}

class SupplierRequestQuotation {
  SupplierRequestQuotation({
    required this.date,
    required this.clientName,
    required this.total,
    required this.status,
  });

  final String date;
  final String clientName;
  final num total;
  final String status;

  factory SupplierRequestQuotation.fromJson(Map<String, dynamic> json) =>
      SupplierRequestQuotation(
        date: json['date']?.toString() ?? '',
        clientName: json['clientName']?.toString() ?? '',
        total: (json['total'] as num?) ?? 0,
        status: json['status']?.toString() ?? '',
      );
}

class SupplierRequest {
  SupplierRequest({
    required this.id,
    required this.quotationId,
    required this.supplierId,
    required this.supplierName,
    required this.status,
    required this.sentAt,
    this.respondedAt,
    this.notes,
    this.response,
    required this.quotation,
    required this.products,
  });

  final String id;
  final String quotationId;
  final String supplierId;
  final String supplierName;
  final String status;
  final String sentAt;
  final String? respondedAt;
  final String? notes;
  final String? response;
  final SupplierRequestQuotation quotation;
  final List<SupplierRequestProduct> products;

  factory SupplierRequest.fromJson(Map<String, dynamic> json) => SupplierRequest(
        id: json['id']?.toString() ?? '',
        quotationId: json['quotationId']?.toString() ?? '',
        supplierId: json['supplierId']?.toString() ?? '',
        supplierName: json['supplierName']?.toString() ?? '',
        status: json['status']?.toString() ?? 'pending',
        sentAt: json['sentAt']?.toString() ?? '',
        respondedAt: json['respondedAt']?.toString(),
        notes: json['notes']?.toString(),
        response: json['response']?.toString(),
        quotation: json['quotation'] != null
            ? SupplierRequestQuotation.fromJson(
                json['quotation'] as Map<String, dynamic>,
              )
            : SupplierRequestQuotation(
                date: '',
                clientName: '',
                total: 0,
                status: '',
              ),
        products: (json['products'] as List<dynamic>?)
                ?.map(
                  (e) => SupplierRequestProduct.fromJson(
                    e as Map<String, dynamic>,
                  ),
                )
                .toList() ??
            [],
      );

  bool get isPending => status == 'pending';
  bool get isResponded => status == 'responded';
  bool get isRejected => status == 'rejected';

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'responded':
        return 'Respondida';
      case 'rejected':
        return 'Rechazada';
      default:
        return status;
    }
  }

  Color get statusColor {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'responded':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
