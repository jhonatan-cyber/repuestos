import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/sync_engine.dart';
import '../../data/cash_model.dart';
import '../../data/cash_repository.dart';

final cashRepositoryProvider = Provider<CashRepository>((ref) {
  return CashRepository(
    ref.watch(dioClientProvider),
    ref.watch(isarDbProvider),
    ref.watch(mutationQueueProvider),
    ref.watch(connectionMonitorProvider.notifier),
  );
});

final cashSummaryProvider = FutureProvider<CashSummary>((ref) async {
  return ref.watch(cashRepositoryProvider).getTodaySummary();
});

/// Filters state for cash history
class CashHistoryFiltersNotifier extends StateNotifier<CashHistoryFilters> {
  CashHistoryFiltersNotifier() : super(const CashHistoryFilters());

  void setStatus(String? status) => state = state.copyWith(status: status);
  void setPage(int page) => state = state.copyWith(page: page);
}

class CashHistoryFilters {
  const CashHistoryFilters({this.status, this.page = 1});
  final String? status;
  final int page;

  CashHistoryFilters copyWith({String? status, int? page}) => CashHistoryFilters(
        status: status ?? this.status,
        page: page ?? this.page,
      );
}

final cashHistoryFiltersProvider = StateNotifierProvider<CashHistoryFiltersNotifier, CashHistoryFilters>((ref) {
  return CashHistoryFiltersNotifier();
});

/// Provider for cash history list with pagination and filters
final cashHistoryProvider = FutureProvider.autoDispose.family<List<CashRecord>, String>((ref, statusFilter) async {
  final filters = ref.watch(cashHistoryFiltersProvider);
  return ref.watch(cashRepositoryProvider).listRecords(
        page: filters.page,
        limit: 20,
        status: statusFilter.isEmpty ? null : statusFilter,
      );
});

/// Provider to get a single cash record by ID
final cashRecordDetailProvider = FutureProvider.autoDispose.family<CashRecord, String>((ref, id) async {
  return ref.watch(cashRepositoryProvider).getRecord(id);
});
