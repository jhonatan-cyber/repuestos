import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers.dart';
import '../../../../core/sync/connection_monitor.dart';
import '../../../../core/sync/sync_engine.dart';
import '../../data/expenses_model.dart';
import '../../data/expenses_repository.dart';

final expensesRepositoryProvider = Provider<ExpensesRepository>((ref) {
  return ExpensesRepository(
    ref.watch(dioClientProvider),
    ref.watch(isarDbProvider),
    ref.watch(mutationQueueProvider),
    ref.watch(connectionMonitorProvider.notifier),
  );
});

final expensesProvider = FutureProvider.autoDispose
    .family<List<Expense>, String>((ref, search) async {
  return ref.watch(expensesRepositoryProvider).list(search: search);
});

/// Provider to get a single expense by ID
final expenseDetailProvider = FutureProvider.autoDispose.family<Expense, String>((ref, id) async {
  return ref.watch(expensesRepositoryProvider).getExpense(id);
});
