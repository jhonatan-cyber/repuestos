import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/sync_engine.dart';
import '../../data/notification_model.dart';
import '../../data/notification_repository.dart';

final notificationsRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(
    ref.watch(dioClientProvider),
    ref.watch(isarDbProvider),
    ref.watch(mutationQueueProvider),
    ref.watch(connectionMonitorProvider.notifier),
  );
});

final notificationsProvider = FutureProvider.autoDispose
    .family<List<Notification>, void>((ref, _) async {
  final repo = ref.watch(notificationsRepositoryProvider);
  return repo.list();
});

final unreadCountProvider = FutureProvider.autoDispose
    .family<int, void>((ref, _) async {
  final repo = ref.watch(notificationsRepositoryProvider);
  return repo.unreadCount();
});
