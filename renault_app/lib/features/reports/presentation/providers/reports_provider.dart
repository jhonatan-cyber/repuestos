import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/sync_engine.dart';
import '../../data/reports_model.dart';
import '../../data/reports_repository.dart';

final reportsRepositoryProvider = Provider<ReportsRepository>((ref) {
  return ReportsRepository(
    ref.watch(dioClientProvider),
    ref.watch(isarDbProvider),
    ref.watch(mutationQueueProvider),
    ref.watch(connectionMonitorProvider.notifier),
  );
});

final reportsProvider = FutureProvider<ReportData>((ref) async {
  return ref.watch(reportsRepositoryProvider).getDashboard();
});

final comparisonProvider = FutureProvider<ComparisonData>((ref) async {
  return ref.watch(reportsRepositoryProvider).getComparison();
});
