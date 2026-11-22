import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum ConnectionStatus { online, offline }

class ConnectionMonitor extends StateNotifier<ConnectionStatus> {
  final Connectivity _connectivity = Connectivity();
  StreamSubscription? _subscription;

  ConnectionMonitor() : super(ConnectionStatus.offline);

  Future<void> initialize() async {
    // Check initial status
    final result = await _connectivity.checkConnectivity();
    state = _mapResult(result);

    // Listen for changes
    _subscription = _connectivity.onConnectivityChanged.listen((result) {
      final newStatus = _mapResult(result);
      if (newStatus != state) {
        state = newStatus;
      }
    });
  }

  ConnectionStatus _mapResult(dynamic result) {
    if (result is ConnectivityResult) {
      return result != ConnectivityResult.none
          ? ConnectionStatus.online
          : ConnectionStatus.offline;
    }
    // Handle list result (older API)
    if (result is List) {
      for (final r in result) {
        if (r != ConnectivityResult.none) return ConnectionStatus.online;
      }
      return ConnectionStatus.offline;
    }
    return ConnectionStatus.offline;
  }

  Future<bool> hasConnection() async {
    final result = await _connectivity.checkConnectivity();
    return result.any((r) => r != ConnectivityResult.none);
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

final connectionMonitorProvider = StateNotifierProvider<ConnectionMonitor, ConnectionStatus>(
  (ref) => ConnectionMonitor(),
);

final isOnlineProvider = Provider<bool>((ref) {
  return ref.watch(connectionMonitorProvider) == ConnectionStatus.online;
});
