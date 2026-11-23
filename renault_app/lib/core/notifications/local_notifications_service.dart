import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Servicio de notificaciones locales que reemplaza Firebase FCM.
/// Funciona en Android e iOS. En Windows se silencia gracefully.
class LocalNotificationsService {
  static final LocalNotificationsService _instance =
      LocalNotificationsService._internal();
  factory LocalNotificationsService() => _instance;
  LocalNotificationsService._internal();

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  /// Inicializa el servicio de notificaciones.
  Future<void> initialize() async {
    if (_initialized) return;

    // Solo Android e iOS soportan notificaciones locales
    if (!Platform.isAndroid && !Platform.isIOS) {
      _initialized = true;
      return;
    }

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');

    const darwinSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: darwinSettings,
    );

    try {
      await _plugin.initialize(
        initSettings,
        onDidReceiveNotificationResponse: _onNotificationTapped,
      );

      // Crear canal de notificaciones en Android
      if (Platform.isAndroid) {
        final androidPlugin = _plugin.resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();
        await androidPlugin?.createNotificationChannel(
          const AndroidNotificationChannel(
            'default_channel',
            'Notificaciones',
            description: 'Notificaciones del sistema',
            importance: Importance.high,
          ),
        );
      }

      _initialized = true;
    } catch (e) {
      debugPrint('Local notifications not available: $e');
    }
  }

  /// Maneja el tap en una notificación
  void _onNotificationTapped(NotificationResponse response) {
    final payload = response.payload;
    if (payload != null) {
      debugPrint('Notification tapped with payload: $payload');
    }
  }

  /// Muestra una notificación de stock bajo
  Future<void> showLowStock({
    required String productName,
    required int currentStock,
    required int minStock,
  }) async {
    await _show(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: '⚠️ Stock bajo',
      body: '$productName tiene solo $currentStock unidades (mínimo: $minStock)',
      payload: 'low_stock',
    );
  }

  /// Muestra una notificación de crédito vencido
  Future<void> showCreditDue({
    required String clientName,
    required double amount,
    required int daysOverdue,
  }) async {
    await _show(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: '💰 Crédito vencido',
      body: '$clientName debe \$${amount.toStringAsFixed(2)} (hace $daysOverdue días)',
      payload: 'credit_due',
    );
  }

  /// Muestra una notificación de crédito por vencer
  Future<void> showCreditUpcoming({
    required String clientName,
    required double amount,
    required int daysUntilDue,
  }) async {
    await _show(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: '📅 Crédito por vencer',
      body: '$clientName - \$${amount.toStringAsFixed(2)} vence en $daysUntilDue días',
      payload: 'credit_upcoming',
    );
  }

  /// Muestra una notificación de caja por cerrar
  Future<void> showCashCloseReminder() async {
    await _show(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: '🏦 Caja por cerrar',
      body: 'Recordá cerrar la caja del día antes de terminar',
      payload: 'cash_close',
    );
  }

  /// Muestra una notificación genérica
  Future<void> showGeneral({
    required String title,
    required String body,
    String? payload,
  }) async {
    await _show(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: title,
      body: body,
      payload: payload,
    );
  }

  /// Método interno para mostrar notificación
  Future<void> _show({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    if (!_initialized) {
      await initialize();
    }

    // Solo Android e iOS soportan notificaciones locales
    if (!Platform.isAndroid && !Platform.isIOS) {
      return;
    }

    try {
      const androidDetails = AndroidNotificationDetails(
        'default_channel',
        'Notificaciones',
        importance: Importance.high,
        priority: Priority.high,
        showWhen: true,
      );

      const darwinDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );

      const details = NotificationDetails(
        android: androidDetails,
        iOS: darwinDetails,
      );

      await _plugin.show(id, title, body, details, payload: payload);
    } catch (e) {
      debugPrint('Error showing notification: $e');
    }
  }

  /// Programa una notificación periódica (solo Android/iOS)
  Future<void> schedulePeriodicNotification({
    required int id,
    required String title,
    required String body,
    required Duration interval,
  }) async {
    if (!_initialized) {
      await initialize();
    }

    // Solo Android e iOS soportan notificaciones periódicas
    if (!Platform.isAndroid && !Platform.isIOS) {
      return;
    }

    try {
      const androidDetails = AndroidNotificationDetails(
        'default_channel',
        'Notificaciones',
        importance: Importance.high,
        priority: Priority.high,
      );

      const darwinDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );

      const details = NotificationDetails(
        android: androidDetails,
        iOS: darwinDetails,
      );

      await _plugin.periodicallyShow(
        id,
        title,
        body,
        RepeatInterval.hourly,
        details,
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      );
    } catch (e) {
      // Periodic notifications no están disponibles en todos los platforms
      debugPrint('Periodic notifications not available: $e');
    }
  }

  /// Cancela una notificación específica
  Future<void> cancel(int id) async {
    await _plugin.cancel(id);
  }

  /// Cancela todas las notificaciones
  Future<void> cancelAll() async {
    await _plugin.cancelAll();
  }

  /// Verifica si las notificaciones están habilitadas
  Future<bool> areNotificationsEnabled() async {
    if (Platform.isAndroid) {
      final androidPlugin = _plugin.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      return await androidPlugin?.areNotificationsEnabled() ?? false;
    }
    return _initialized;
  }
}
