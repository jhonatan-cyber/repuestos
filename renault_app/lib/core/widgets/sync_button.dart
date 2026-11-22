import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/sync/sync_engine.dart';
import '../../core/sync/connection_monitor.dart';

class SyncButton extends ConsumerWidget {
  const SyncButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOnline = ref.watch(isOnlineProvider);
    final isSyncing = ref.watch(isSyncingProvider);

    return ListTile(
      leading: isSyncing
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Icon(
              isOnline ? Icons.cloud_done : Icons.cloud_upload,
              color: isOnline ? Colors.green : Colors.orange,
            ),
      title: Text(
        isSyncing ? 'Sincronizando...' : (isOnline ? 'Sincronizado' : 'Sincronizar'),
        style: TextStyle(
          color: isOnline ? Colors.green : Colors.orange,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        isOnline ? 'Todo al día' : 'Se sincronizará al recuperar conexión',
        style: const TextStyle(fontSize: 12),
      ),
      onTap: isSyncing
          ? null
          : () async {
              try {
                ref.read(isSyncingProvider.notifier).state = true;
                final engine = ref.read(syncEngineLazyProvider);
                await engine.sync();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Sincronización completada')),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error al sincronizar: $e')),
                  );
                }
              } finally {
                ref.read(isSyncingProvider.notifier).state = false;
              }
            },
    );
  }
}
