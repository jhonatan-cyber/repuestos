import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/sync_engine.dart';
import '../../data/credits_model.dart';
import '../../data/credits_repository.dart';

final creditsRepositoryProvider = Provider<CreditsRepository>((ref) {
  return CreditsRepository(
    ref.watch(dioClientProvider),
    ref.watch(isarDbProvider),
    ref.watch(mutationQueueProvider),
    ref.watch(connectionMonitorProvider.notifier),
  );
});

final creditsProvider = FutureProvider.autoDispose
    .family<List<Credit>, String>((ref, search) async {
  return ref.watch(creditsRepositoryProvider).listCredits(search: search);
});

final purchaseCreditsProvider = FutureProvider.autoDispose
    .family<List<PurchaseCredit>, String>((ref, search) async {
  return ref.watch(creditsRepositoryProvider).listPurchaseCredits(search: search);
});

final creditDetailProvider = FutureProvider.autoDispose
    .family<Credit, String>((ref, id) async {
  return ref.watch(creditsRepositoryProvider).getCredit(id);
});
