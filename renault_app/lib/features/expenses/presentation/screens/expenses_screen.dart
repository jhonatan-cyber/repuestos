import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/expenses_model.dart';
import '../providers/expenses_provider.dart';
import 'expense_detail_screen.dart';
import 'expense_form_screen.dart';

class ExpensesScreen extends ConsumerStatefulWidget {
  const ExpensesScreen({super.key});

  @override
  ConsumerState<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends ConsumerState<ExpensesScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _navigateToDetail(Expense expense) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (ctx) => ExpenseDetailScreen(expenseId: expense.id)),
    ).then((_) {
      ref.invalidate(expensesProvider);
    });
  }

  void _navigateToEdit(Expense expense) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (ctx) => ExpenseFormScreen(expense: expense)),
    ).then((_) {
      ref.invalidate(expensesProvider);
    });
  }

  void _confirmDelete(Expense expense) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Eliminar gasto'),
        content: const Text('¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    ).then((confirmed) async {
      if (confirmed == true) {
        try {
          await ref.read(expensesRepositoryProvider).delete(expense.id);
          if (mounted) {
            ref.invalidate(expensesProvider);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Gasto eliminado')),
            );
          }
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Error: $e')),
            );
          }
        }
      }
    });
  }

  void _showOptionsMenu(Expense expense) {
    showMenu(
      context: context,
      position: RelativeRect.fromLTRB(
        MediaQuery.of(context).size.width - 80,
        0,
        0,
        0,
      ),
      items: [
        PopupMenuItem(
          value: 'detail',
          child: ListTile(
            leading: const Icon(Icons.visibility),
            title: const Text('Ver detalle'),
            contentPadding: EdgeInsets.zero,
          ),
        ),
        PopupMenuItem(
          value: 'edit',
          child: ListTile(
            leading: const Icon(Icons.edit),
            title: const Text('Editar'),
            contentPadding: EdgeInsets.zero,
          ),
        ),
        PopupMenuItem(
          value: 'delete',
          child: ListTile(
            leading: const Icon(Icons.delete, color: Colors.red),
            title: const Text('Eliminar', style: TextStyle(color: Colors.red)),
            contentPadding: EdgeInsets.zero,
          ),
        ),
      ],
    ).then((value) {
      if (value == 'detail') _navigateToDetail(expense);
      if (value == 'edit') _navigateToEdit(expense);
      if (value == 'delete') _confirmDelete(expense);
    });
  }

  Future<void> _createExpense() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (ctx) => const ExpenseFormScreen()),
    ).then((_) {
      ref.invalidate(expensesProvider);
    });
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(expensesProvider(_query));
    return Scaffold(
      appBar: AppBar(title: const Text('Gastos')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchCtrl,
              decoration: const InputDecoration(
                labelText: 'Buscar',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onSubmitted: (v) => setState(() => _query = v.trim()),
            ),
          ),
          Expanded(
            child: async.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e')),
              data: (expenses) {
                if (expenses.isEmpty) {
                  return const Center(child: Text('Sin gastos'));
                }
                final totalToday = expenses.fold<num>(0, (sum, e) => sum + e.amount);
                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(12),
                      child: Card(
                        color: Colors.red.withValues(alpha: 0.08),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Total gastado',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              Text(
                                '\$${totalToday.toStringAsFixed(0)}',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.red,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: ListView.builder(
                        itemCount: expenses.length,
                        itemBuilder: (context, i) {
                          final e = expenses[i];
                          return ListTile(
                            onTap: () => _navigateToDetail(e),
                            leading: CircleAvatar(
                              backgroundColor: Colors.red,
                              child: const Icon(
                                Icons.receipt_long,
                                color: Colors.white,
                              ),
                            ),
                            title: Text(e.description),
                            subtitle: Text(e.category),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  '-\$${e.amount.toStringAsFixed(0)}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.red,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                IconButton(
                                  icon: const Icon(Icons.more_vert),
                                  onPressed: () => _showOptionsMenu(e),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _createExpense,
        icon: const Icon(Icons.add),
        label: const Text('Nuevo gasto'),
      ),
    );
  }
}
