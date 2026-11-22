import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/sync/connection_monitor.dart';
import '../../core/sync/sync_engine.dart';

class SyncIndicator extends ConsumerWidget {
  const SyncIndicator({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(connectionMonitorProvider);
    final isSyncing = ref.watch(isSyncingProvider);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (isSyncing)
          const SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2),
          )
        else
          Icon(
            status == ConnectionStatus.online ? Icons.cloud_done : Icons.cloud_off,
            size: 18,
            color: status == ConnectionStatus.online ? Colors.green : Colors.red,
          ),
        const SizedBox(width: 4),
        Text(
          status == ConnectionStatus.online ? 'Online' : 'Offline',
          style: TextStyle(
            fontSize: 12,
            color: status == ConnectionStatus.online ? Colors.green : Colors.red,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
