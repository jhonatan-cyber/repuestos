import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/reports_model.dart';
import '../providers/reports_provider.dart';

class ComparisonReportScreen extends ConsumerWidget {
  const ComparisonReportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(comparisonProvider);
    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (data) {
        if (data.current == null || data.previous == null) {
          return const Center(child: Text('No hay datos para comparar'));
        }
        final c = data.current!;
        final p = data.previous!;
        final theme = Theme.of(context);

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Period labels
            Row(
              children: [
                Expanded(
                  child: Text(c.label, style: theme.textTheme.titleSmall?.copyWith(color: Colors.grey), textAlign: TextAlign.center),
                ),
                Expanded(
                  child: Text(p.label, style: theme.textTheme.titleSmall?.copyWith(color: Colors.grey), textAlign: TextAlign.center),
                ),
                const SizedBox(width: 8),
                SizedBox(width: 50, child: Text('Var.', style: theme.textTheme.titleSmall?.copyWith(color: Colors.grey), textAlign: TextAlign.center)),
              ],
            ),
            const Divider(),
            _ComparisonRow(label: 'Ventas', current: c.totalSales, previous: p.totalSales, data: data),
            _ComparisonRow(label: 'Compras', current: c.totalPurchases, previous: p.totalPurchases, data: data),
            _ComparisonRow(label: 'Gastos', current: c.totalExpenses, previous: p.totalExpenses, data: data),
            const Divider(),
            _ComparisonRow(label: 'Ganancia neta', current: c.netProfit, previous: p.netProfit, data: data, bold: true),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Cómo leer', style: theme.textTheme.titleSmall),
                    const SizedBox(height: 8),
                    Text(
                      'Se compara el período seleccionado con el período anterior de igual duración. Los valores en verde indican mejora, los valores en rojo indican disminución.',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _ComparisonRow extends StatelessWidget {
  const _ComparisonRow({
    required this.label,
    required this.current,
    required this.previous,
    required this.data,
    this.bold = false,
  });

  final String label;
  final num current;
  final num previous;
  final ComparisonData data;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    final v = data.variation(current, previous);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.normal)),
          ),
          Expanded(
            child: Text(
              '\$${current.toStringAsFixed(0)}',
              textAlign: TextAlign.right,
              style: TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.normal),
            ),
          ),
          Expanded(
            child: Text(
              '\$${previous.toStringAsFixed(0)}',
              textAlign: TextAlign.right,
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 50,
            child: Text(
              '${v >= 0 ? '+' : ''}${v.toStringAsFixed(1)}%',
              textAlign: TextAlign.right,
              style: TextStyle(color: _variationColor(v), fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}

Color _variationColor(num v) {
  if (v > 0) return Colors.green;
  if (v < 0) return Colors.red;
  return Colors.grey;
}
