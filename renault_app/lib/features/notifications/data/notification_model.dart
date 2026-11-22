import 'package:flutter/material.dart';

class Notification {
  const Notification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    this.entity,
    this.entityId,
    required this.isRead,
    required this.createdAt,
  });

  final String id;
  final String type;
  final String title;
  final String message;
  final String? entity;
  final String? entityId;
  final bool isRead;
  final String createdAt;

  factory Notification.fromJson(Map<String, dynamic> json) => Notification(
        id: json['id']?.toString() ?? '',
        type: json['type']?.toString() ?? '',
        title: json['title']?.toString() ?? '',
        message: json['message']?.toString() ?? '',
        entity: json['entity']?.toString(),
        entityId: json['entityId']?.toString(),
        isRead: json['isRead'] as bool? ?? false,
        createdAt: json['createdAt']?.toString() ?? '',
      );

  factory Notification.fromIsar(dynamic isar) => Notification(
        id: isar.uuid,
        type: isar.type,
        title: isar.title,
        message: isar.message,
        entity: isar.entity,
        entityId: isar.entityId,
        isRead: isar.isRead,
        createdAt: isar.createdAt.toIso8601String(),
      );

  IconData get icon {
    if (isRead) return Icons.done_all;
    switch (type) {
      case 'sale':
        return Icons.point_of_sale;
      case 'credit':
        return Icons.account_balance_wallet;
      case 'low_stock':
        return Icons.warning;
      case 'cash':
        return Icons.money;
      default:
        return Icons.notifications_active;
    }
  }
}
