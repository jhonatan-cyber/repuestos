import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Background message handler (must be top-level)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('Background message: ${message.notification?.title}');
}

class FcmService extends StateNotifier<String?> {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  FcmService() : super(null);

  Future<void> initialize() async {
    try {
      await Firebase.initializeApp();

      // Request permission
      final settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        debugPrint('FCM permissions granted');
      }

      // Get token
      state = await _messaging.getToken();
      debugPrint('FCM token: $state');

      // Listen to token refresh
      _messaging.onTokenRefresh.listen((token) {
        state = token;
      });

      // Foreground messages
      FirebaseMessaging.onMessage.listen((message) {
        debugPrint('Foreground message: ${message.notification?.title}');
      });

      // Background handler
      FirebaseMessaging.onMessageOpenedApp.listen((message) {
        debugPrint('Message opened app: ${message.notification?.title}');
      });

      // Set background handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    } catch (e) {
      debugPrint('FCM initialization error: $e');
    }
  }

  Future<void> subscribeToTopic(String topic) async {
    try {
      await _messaging.subscribeToTopic(topic);
      debugPrint('Subscribed to topic: $topic');
    } catch (e) {
      debugPrint('Subscribe error: $e');
    }
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _messaging.unsubscribeFromTopic(topic);
      debugPrint('Unsubscribed from topic: $topic');
    } catch (e) {
      debugPrint('Unsubscribe error: $e');
    }
  }

  Future<void> subscribeToAll() async {
    await subscribeToTopic('stock_low');
    await subscribeToTopic('credit_due');
    await subscribeToTopic('cash_close');
    await subscribeToTopic('general');
  }
}

final fcmServiceProvider = StateNotifierProvider<FcmService, String?>((ref) {
  return FcmService();
});
