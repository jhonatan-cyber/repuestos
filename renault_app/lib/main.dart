import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/database/isar_db.dart';
import 'core/sync/connection_monitor.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Isar database
  await IsarDB.instance.initialize();

  // Initialize connection monitor
  final monitor = ConnectionMonitor();
  await monitor.initialize();

  runApp(
    ProviderScope(
      overrides: [
        connectionMonitorProvider.overrideWith((ref) => monitor),
      ],
      child: const RenaultApp(),
    ),
  );
}
