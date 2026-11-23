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

final purchaseCreditDetailProvider = FutureProvider.autoDispose
    .family<PurchaseCredit, String>((ref, id) async {
  return ref.watch(creditsRepositoryProvider).getPurchaseCredit(id);
});

final overdueCreditsProvider = FutureProvider.autoDispose<List<Credit>>((ref) async {
  final credits = await ref.watch(creditsRepositoryProvider).listCredits();
  return credits.where((c) => c.isActive && c.isOverdue()).toList();
});

final upcomingCreditsProvider = FutureProvider.autoDispose<List<Credit>>((ref) async {
  final credits = await ref.watch(creditsRepositoryProvider).listCredits();
  return credits
      .where((c) => c.isActive && !c.isOverdue() && c.daysUntilDue() <= 7)
      .toList();
});

final overduePurchaseCreditsProvider = FutureProvider.autoDispose<List<PurchaseCredit>>((ref) async {
  final credits = await ref.watch(creditsRepositoryProvider).listPurchaseCredits();
  return credits.where((c) => c.isActive && c.isOverdue()).toList();
});

final upcomingPurchaseCreditsProvider = FutureProvider.autoDispose<List<PurchaseCredit>>((ref) async {
  final credits = await ref.watch(creditsRepositoryProvider).listPurchaseCredits();
  return credits
      .where((c) => c.isActive && !c.isOverdue() && c.daysUntilDue() <= 7)
      .toList();
});
