import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/cash_model.dart';
import '../providers/cash_provider.dart';

class CashDetailScreen extends ConsumerWidget {
  const CashDetailScreen({required this.recordId, super.key});

  final String recordId;

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

  String _formatDateTime(String dateStr) {
    if (dateStr.isEmpty) return 'Sin fecha';
    try {
      final parts = dateStr.split('T');
      if (parts.length == 2) {
        final dateParts = parts[0].split('-');
        final timeParts = parts[1].split(':');
        if (dateParts.length == 3 && timeParts.length >= 2) {
          return '${dateParts[2]}/${dateParts[1]}/${dateParts[0]} ${timeParts[0]}:${timeParts[1]}';
        }
      }
    } catch (_) {}
    return dateStr;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncValue = ref.watch(cashRecordDetailProvider(recordId));

    return Scaffold(
      appBar: AppBar(title: const Text('Detalle de caja')),
      body: asyncValue.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (record) => _buildDetail(context, record),
      ),
    );
  }

  Widget _buildDetail(BuildContext context, CashRecord record) {
    final theme = Theme.of(context);
    final isOpen = record.isOpen;
    final statusColor = isOpen ? Colors.blue : Colors.green;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status card
          Card(
            color: statusColor.withValues(alpha: 0.08),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(
                    isOpen ? Icons.pending : Icons.check_circle,
                    color: statusColor,
                    size: 32,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          record.statusLabel,
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: statusColor,
                          ),
                        ),
                        Text(
                          'Usuario: ${record.userName}',
                          style: theme.textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Date info
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Información',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Divider(height: 24),
                  _InfoRow(
                    icon: Icons.calendar_today,
                    label: 'Fecha',
                    value: _formatDate(record.date),
                  ),
                  if (record.closedAt != null) ...[
                    const SizedBox(height: 8),
                    _InfoRow(
                      icon: Icons.access_time,
                      label: 'Cerrado a las',
                      value: _formatDateTime(record.closedAt!),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Financial summary
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Resumen financiero',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Divider(height: 24),
                  _InfoRow(
                    icon: Icons.account_balance_wallet,
                    label: 'Balance inicial',
                    value: _formatCurrency(record.openingBalance),
                    color: Colors.blue,
                  ),
                  const SizedBox(height: 8),
                  _InfoRow(
                    icon: Icons.trending_up,
                    label: 'Ingresos',
                    value: _formatCurrency(record.totalIncome),
                    color: Colors.green,
                  ),
                  const SizedBox(height: 8),
                  _InfoRow(
                    icon: Icons.trending_down,
                    label: 'Egresos',
                    value: _formatCurrency(record.totalExpenses),
                    color: Colors.red,
                  ),
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Balance final',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          _formatCurrency(record.closingBalance),
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Withdrawals list
          if (record.withdrawals.isNotEmpty) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Retiros (${record.withdrawals.length})',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Divider(height: 24),
                    ...record.withdrawals.map((w) => _WithdrawalCard(withdrawal: w)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Notes
          if (record.notes != null && record.notes!.isNotEmpty)
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
                    Text(record.notes!),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
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

class _WithdrawalCard extends StatelessWidget {
  const _WithdrawalCard({required this.withdrawal});

  final CashWithdrawal withdrawal;

  String _formatDateTime(String dateStr) {
    if (dateStr.isEmpty) return 'Sin fecha';
    try {
      final parts = dateStr.split('T');
      if (parts.length == 2) {
        final dateParts = parts[0].split('-');
        final timeParts = parts[1].split(':');
        if (dateParts.length == 3 && timeParts.length >= 2) {
          return '${dateParts[2]}/${dateParts[1]}/${dateParts[0]} ${timeParts[0]}:${timeParts[1]}';
        }
      }
    } catch (_) {}
    return dateStr;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '-\$${withdrawal.amount.toStringAsFixed(2)}',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.orange,
                    ),
              ),
              Text(
                _formatDateTime(withdrawal.createdAt),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
          if (withdrawal.reason.isNotEmpty)
            Text(
              'Motivo: ${withdrawal.reason}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          Text(
            'Usuario: ${withdrawal.userName}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey,
                ),
          ),
        ],
      ),
    );
  }
}
