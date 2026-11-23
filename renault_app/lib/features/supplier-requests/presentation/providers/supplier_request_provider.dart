
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../data/supplier_request_model.dart';
import '../../data/supplier_request_repository.dart';

final supplierRequestRepositoryProvider = Provider<SupplierRequestRepository>((ref) {
  return SupplierRequestRepository(
    ref.watch(dioClientProvider),
    ref.watch(connectionMonitorProvider.notifier),
  );
});

final supplierRequestsProvider = FutureProvider.autoDispose<List<SupplierRequest>>((ref) async {
  return ref.watch(supplierRequestRepositoryProvider).list();
});
