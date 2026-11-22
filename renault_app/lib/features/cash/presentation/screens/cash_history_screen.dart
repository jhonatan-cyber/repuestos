import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/cash_model.dart';
import '../providers/cash_provider.dart';
import 'cash_detail_screen.dart';

class CashHistoryScreen extends ConsumerStatefulWidget {
  const CashHistoryScreen({super.key});

  @override
  ConsumerState<CashHistoryScreen> createState() => _CashHistoryScreenState();
}

class _CashHistoryScreenState extends ConsumerState<CashHistoryScreen> {
  String _statusFilter = '';

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(cashHistoryProvider(_statusFilter));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Historial de caja'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(cashHistoryProvider);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Status filter chips
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                FilterChip(
                  label: const Text('Todos'),
                  selected: _statusFilter == '',
                  onSelected: (_) => setState(() => _statusFilter = ''),
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('Abiertos'),
                  selected: _statusFilter == 'open',
                  onSelected: (_) => setState(() => _statusFilter = 'open'),
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('Cerrados'),
                  selected: _statusFilter == 'closed',
                  onSelected: (_) => setState(() => _statusFilter = 'closed'),
                ),
              ],
            ),
          ),
          Expanded(
            child: async.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e')),
              data: (records) {
                if (records.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.inbox, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('Sin registros de caja'),
                      ],
                    ),
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: records.length,
                  itemBuilder: (context, index) {
                    final record = records[index];
                    return _CashRecordCard(
                      record: record,
                      onTap: () => _navigateToDetail(record),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _navigateToDetail(CashRecord record) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (ctx) => CashDetailScreen(recordId: record.id)),
    );
  }
}

class _CashRecordCard extends StatelessWidget {
  const _CashRecordCard({required this.record, required this.onTap});

  final CashRecord record;
  final VoidCallback onTap;

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
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isOpen = record.isOpen;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: isOpen ? Colors.blue : Colors.green,
          child: Icon(
            isOpen ? Icons.pending : Icons.check_circle,
            color: Colors.white,
          ),
        ),
        title: Row(
          children: [
            Text(_formatDate(record.date)),
            const SizedBox(width: 8),
            Badge(
              label: Text(record.statusLabel),
              smallSize: 12,
              textColor: Colors.white,
              backgroundColor: isOpen ? Colors.blue : Colors.green,
            ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Usuario: ${record.userName}'),
            const SizedBox(height: 4),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Ingresos: \$${record.totalIncome.toStringAsFixed(0)}',
                    style: theme.textTheme.bodySmall?.copyWith(color: Colors.green),
                  ),
                ),
                Expanded(
                  child: Text(
                    'Egresos: \$${record.totalExpenses.toStringAsFixed(0)}',
                    style: theme.textTheme.bodySmall?.copyWith(color: Colors.red),
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              'Balance: \$${record.closingBalance.toStringAsFixed(0)}',
              style: theme.textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.blue,
              ),
            ),
            if (record.withdrawals.isNotEmpty)
              Text(
                '${record.withdrawals.length} retiro(s)',
                style: theme.textTheme.bodySmall,
              ),
          ],
        ),
        isThreeLine: true,
      ),
    );
  }
}
