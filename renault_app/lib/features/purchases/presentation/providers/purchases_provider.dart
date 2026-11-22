import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/sync_engine.dart';
import '../../data/purchases_model.dart';
import '../../data/purchases_repository.dart';

final purchasesRepositoryProvider = Provider<PurchasesRepository>((ref) {
  return PurchasesRepository(
    ref.watch(dioClientProvider),
    ref.watch(isarDbProvider),
    ref.watch(mutationQueueProvider),
    ref.watch(connectionMonitorProvider.notifier),
  );
});

final purchasesProvider = FutureProvider.autoDispose
    .family<List<Purchase>, String>((ref, search) async {
  return ref.watch(purchasesRepositoryProvider).list(search: search);
});

/// Provider to get a single purchase by ID (filters from the full list)
final purchaseDetailProvider = FutureProvider.autoDispose.family<Purchase, String>((ref, id) async {
  final allPurchases = await ref.watch(purchasesRepositoryProvider).list(limit: 10000);
  final found = allPurchases.where((p) => p.id == id).toList();
  if (found.isEmpty) {
    throw Exception('Compra no encontrada');
  }
  return found.first;
});
