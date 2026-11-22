import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../presentation/providers/notifications_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider(null));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notificaciones'),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            onPressed: () async {
              await ref.read(notificationsRepositoryProvider).markAllRead();
              if (context.mounted) {
                ref.invalidate(notificationsProvider);
                ref.invalidate(unreadCountProvider);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Todas marcadas como leídas')),
                );
              }
            },
            tooltip: 'Marcar todas como leídas',
          ),
        ],
      ),
      body: notificationsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (notifications) {
          if (notifications.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_none, size: 48, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('No hay notificaciones'),
                ],
              ),
            );
          }
          return ListView.builder(
            itemCount: notifications.length,
            itemBuilder: (context, i) {
              final n = notifications[i];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: n.isRead
                      ? Colors.grey.withValues(alpha: 0.1)
                      : Theme.of(context).colorScheme.primaryContainer,
                  child: Icon(
                    n.icon,
                    color: n.isRead ? Colors.grey : null,
                    size: 20,
                  ),
                ),
                title: Text(
                  n.title,
                  style: TextStyle(
                    fontWeight: n.isRead ? FontWeight.normal : FontWeight.bold,
                  ),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(n.message, maxLines: 2),
                    Text(
                      n.createdAt.split('T')[0],
                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                  ],
                ),
                tileColor: n.isRead
                    ? null
                    : Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.3),
                onTap: () async {
                  if (!n.isRead) {
                    await ref
                        .read(notificationsRepositoryProvider)
                        .markRead(n.id);
                    ref.invalidate(notificationsProvider);
                    ref.invalidate(unreadCountProvider);
                  }
                },
              );
            },
          );
        },
      ),
    );
  }
}
