import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/sync_engine.dart';
import '../../data/quotations_model.dart';
import '../../data/quotations_repository.dart';

final quotationsRepositoryProvider = Provider<QuotationsRepository>((ref) {
  return QuotationsRepository(
    ref.watch(dioClientProvider),
    ref.watch(isarDbProvider),
    ref.watch(mutationQueueProvider),
    ref.watch(connectionMonitorProvider.notifier),
  );
});

final quotationsProvider = FutureProvider.autoDispose
    .family<List<Quotation>, String>((ref, search) async {
  return ref.watch(quotationsRepositoryProvider).list(search: search);
});

/// Provider to get a single quotation by ID (filters from the full list)
final quotationDetailProvider = FutureProvider.autoDispose.family<Quotation, String>((ref, id) async {
  final allQuotations = await ref.watch(quotationsRepositoryProvider).list(limit: 10000);
  final found = allQuotations.where((q) => q.id == id).toList();
  if (found.isEmpty) {
    throw Exception('Cotización no encontrada');
  }
  return found.first;
});

/// Provider to get supplier requests for a quotation
final supplierRequestsProvider = FutureProvider.autoDispose
    .family<List<SupplierRequestResponse>, String>((ref, quotationId) async {
  return ref.watch(quotationsRepositoryProvider).getSupplierRequests(quotationId);
});
