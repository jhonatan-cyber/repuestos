import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/cash_provider.dart';
import 'cash_history_screen.dart';

class CashScreen extends ConsumerStatefulWidget {
  const CashScreen({super.key});

  @override
  ConsumerState<CashScreen> createState() => _CashScreenState();
}

class _CashScreenState extends ConsumerState<CashScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
  Future<void> _openCash() async {
    final amount = await showModalBottomSheet<num>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final ctrl = TextEditingController();
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom,
            ),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Abrir caja',
                    style: Theme.of(ctx).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: ctrl,
                    decoration: const InputDecoration(
                      labelText: 'Monto inicial',
                      prefixIcon: Icon(Icons.attach_money),
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        final a = num.tryParse(ctrl.text);
                        if (a == null || a <= 0) return;
                        Navigator.of(ctx).pop(a);
                      },
                      child: const Text('Abrir'),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
    if (amount == null || amount <= 0) return;
    await ref.read(cashRepositoryProvider).openCash(amount);
    if (!mounted) return;
    ref.invalidate(cashSummaryProvider);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Caja abierta')),
    );
  }

  void _closeCash() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cerrar caja'),
        content: const Text('¿Estás seguro de cerrar la caja del día?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Cerrar'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      // Get the current record ID from summary
      await ref.read(cashRepositoryProvider).closeCash('today');
      if (mounted) {
        ref.invalidate(cashSummaryProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Caja cerrada')),
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

  Future<void> _withdraw() async {
    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final amountCtrl = TextEditingController();
          final reasonCtrl = TextEditingController();
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom,
            ),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Retirar de caja',
                    style: Theme.of(ctx).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: amountCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Monto',
                      prefixIcon: Icon(Icons.attach_money),
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: reasonCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Motivo',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        final amount = num.tryParse(amountCtrl.text);
                        if (amount == null || amount <= 0) return;
                        if (reasonCtrl.text.trim().isEmpty) return;
                        Navigator.of(ctx).pop({
                          'amount': amount,
                          'reason': reasonCtrl.text.trim(),
                        });
                      },
                      child: const Text('Retirar'),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
    if (result == null) return;
    await ref.read(cashRepositoryProvider).withdraw(
          'today',
          result['amount'] as num,
          result['reason'] as String,
        );
    if (!mounted) return;
    ref.invalidate(cashSummaryProvider);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Retiro registrado')),
    );
  }

  Widget _buildTodayTab(BuildContext context) {
    return Consumer(
      builder: (context, ref, _) {
        final async = ref.watch(cashSummaryProvider);
        return async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Error: $e')),
          data: (summary) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status card
                  Card(
                    color: summary.isOpen
                        ? Colors.green.withValues(alpha: 0.08)
                        : Colors.red.withValues(alpha: 0.08),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Icon(
                                summary.isOpen
                                    ? Icons.check_circle
                                    : Icons.cancel,
                                color: summary.isOpen ? Colors.green : Colors.red,
                                size: 32,
                              ),
                              const SizedBox(width: 12),
                              Text(
                                summary.isOpen ? 'Caja abierta' : 'Caja cerrada',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleLarge
                                    ?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: summary.isOpen
                                          ? Colors.green
                                          : Colors.red,
                                    ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _StatColumn(
                                label: 'Balance',
                                value: '\$${summary.currentBalance.toStringAsFixed(0)}',
                                color: Colors.blue,
                              ),
                              _StatColumn(
                                label: 'Ingresos',
                                value: '\$${summary.totalIncome.toStringAsFixed(0)}',
                                color: Colors.green,
                              ),
                              _StatColumn(
                                label: 'Egresos',
                                value: '\$${summary.totalExpenses.toStringAsFixed(0)}',
                                color: Colors.red,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Action buttons
                  Row(
                    children: [
                      if (!summary.isOpen)
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _openCash,
                            icon: const Icon(Icons.add_circle),
                            label: const Text('Abrir caja'),
                          ),
                        ),
                      if (summary.isOpen) ...[
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _withdraw,
                            icon: const Icon(Icons.outbound),
                            label: const Text('Retirar'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _closeCash,
                            icon: const Icon(Icons.check_circle),
                            label: const Text('Cerrar caja'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Caja'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Hoy'),
            Tab(text: 'Historial'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildTodayTab(context),
          const CashHistoryScreen(),
        ],
      ),
    );
  }
}

class _StatColumn extends StatelessWidget {
  const _StatColumn({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}
