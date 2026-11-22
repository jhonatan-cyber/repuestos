import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/expenses_model.dart';
import '../providers/expenses_provider.dart';
import 'expense_form_screen.dart';

class ExpenseDetailScreen extends ConsumerWidget {
  const ExpenseDetailScreen({required this.expenseId, super.key});

  final String expenseId;

  String _formatCurrency(num value) {
    return '\$${value.toStringAsFixed(2)}';
  }

  String _formatDate(String dateStr) {
    if (dateStr.isEmpty) return 'Sin fecha';
    try {
      final parts = dateStr.split(' ')[0].split('-');
      if (parts.length == 3) {
        return '${parts[2]}/${parts[1]}/${parts[0]}';
      }
    } catch (_) {}
    return dateStr;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncValue = ref.watch(expenseDetailProvider(expenseId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalle de gasto'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () => _navigateToEdit(context, ref),
          ),
        ],
      ),
      body: asyncValue.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (expense) => _buildDetail(context, expense),
      ),
    );
  }

  void _navigateToEdit(BuildContext context, WidgetRef ref) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => ExpenseFormScreen(expense: Expense(
          id: expenseId,
          category: '',
          description: '',
          amount: 0,
        )),
      ),
    ).then((_) {
      ref.invalidate(expenseDetailProvider);
      ref.invalidate(expensesProvider);
    });
  }

  Widget _buildDetail(BuildContext context, Expense expense) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Main info card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.receipt_long, color: Colors.red, size: 32),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          expense.description,
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _InfoRow(
                    icon: Icons.category,
                    label: 'Categoría',
                    value: expense.category,
                  ),
                  const SizedBox(height: 12),
                  _InfoRow(
                    icon: Icons.attach_money,
                    label: 'Monto',
                    value: _formatCurrency(expense.amount),
                    color: Colors.red,
                  ),
                  const SizedBox(height: 12),
                  _InfoRow(
                    icon: Icons.calendar_today,
                    label: 'Fecha',
                    value: _formatDate(expense.date ?? ''),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Notes
          if (expense.notes != null && expense.notes!.isNotEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Notas',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(expense.notes!),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 24),

          // Delete button
          Center(
            child: OutlinedButton.icon(
              onPressed: () => _confirmDelete(context),
              icon: const Icon(Icons.delete, color: Colors.red),
              label: const Text('Eliminar gasto', style: TextStyle(color: Colors.red)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.red),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context) {
    final ref = ProviderScope.containerOf(context, listen: false);
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
          await ref.read(expensesRepositoryProvider).delete(expenseId);
          ref.invalidate(expensesProvider);
          if (context.mounted) {
            Navigator.of(context).pop();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Gasto eliminado')),
            );
          }
        } catch (e) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Error: $e')),
            );
          }
        }
      }
    });
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: color ?? Colors.grey),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey,
                ),
          ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
        ),
      ],
    );
  }
}
