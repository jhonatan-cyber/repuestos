import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/sync_engine.dart';
import '../../data/supplier_model.dart';
import '../../data/supplier_repository.dart';

final supplierRepositoryProvider = Provider<SupplierRepository>((ref) {
  return SupplierRepository(
    ref.watch(dioClientProvider),
    ref.watch(isarDbProvider),
    ref.watch(mutationQueueProvider),
    ref.watch(connectionMonitorProvider.notifier),
  );
});

final suppliersProvider = FutureProvider.autoDispose
    .family<List<Supplier>, String>((ref, search) async {
  return ref.watch(supplierRepositoryProvider).list(search: search);
});
