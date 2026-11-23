import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/credits_model.dart';
import '../providers/credits_provider.dart';
import 'credit_detail_screen.dart';
import 'purchase_credit_detail_screen.dart';

class CreditRemindersScreen extends ConsumerWidget {
  const CreditRemindersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recordatorios de crédito'),
        backgroundColor: Colors.red,
      ),
      body: const _RemindersBody(),
    );
  }
}

class _RemindersBody extends ConsumerWidget {
  const _RemindersBody();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final overdueClientAsync = ref.watch(overdueCreditsProvider);
    final upcomingClientAsync = ref.watch(upcomingCreditsProvider);
    final overduePurchaseAsync = ref.watch(overduePurchaseCreditsProvider);
    final upcomingPurchaseAsync = ref.watch(upcomingPurchaseCreditsProvider);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Summary cards
        _buildSummaryCard(
          context,
          'Créditos vencidos',
          overdueClientAsync.valueOrNull?.length ?? 0,
          overduePurchaseAsync.valueOrNull?.length ?? 0,
          Colors.red,
        ),
        const SizedBox(height: 8),
        _buildSummaryCard(
          context,
          'Por vencer (7 días)',
          upcomingClientAsync.valueOrNull?.length ?? 0,
          upcomingPurchaseAsync.valueOrNull?.length ?? 0,
          Colors.amber,
        ),
        const SizedBox(height: 24),

        // Overdue section
        Text(
          'Vencidos',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: Colors.red,
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        _buildOverdueSection(context, ref, overdueClientAsync, overduePurchaseAsync),
        const SizedBox(height: 24),

        // Upcoming section
        Text(
          'Por vencer en 7 días',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: Colors.amber,
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        _buildUpcomingSection(context, ref, upcomingClientAsync, upcomingPurchaseAsync),
      ],
    );
  }

  Widget _buildSummaryCard(
    BuildContext context,
    String title,
    int clientCount,
    int purchaseCount,
    Color color,
  ) {
    final total = clientCount + purchaseCount;
    return Card(
      color: color.withValues(alpha: 0.08),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: color, size: 32),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  Text(
                    '$total crédito${total != 1 ? 's' : ''} ($clientCount clientes, $purchaseCount proveedores)',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
            Text(
              '$total',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: color,
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOverdueSection(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<List<Credit>> clientAsync,
    AsyncValue<List<PurchaseCredit>> purchaseAsync,
  ) {
    final clients = clientAsync.valueOrNull ?? [];
    final purchases = purchaseAsync.valueOrNull ?? [];

    if (clients.isEmpty && purchases.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Center(
          child: Text('No hay créditos vencidos', style: TextStyle(color: Colors.green)),
        ),
      );
    }

    return Column(
      children: [
        ...clients.map((c) => _buildCreditTile(context, c, isOverdue: true)),
        ...purchases.map((c) => _buildPurchaseCreditTile(context, c, isOverdue: true)),
      ],
    );
  }

  Widget _buildUpcomingSection(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<List<Credit>> clientAsync,
    AsyncValue<List<PurchaseCredit>> purchaseAsync,
  ) {
    final clients = clientAsync.valueOrNull ?? [];
    final purchases = purchaseAsync.valueOrNull ?? [];

    if (clients.isEmpty && purchases.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Center(
          child: Text('No hay créditos por vencer pronto', style: TextStyle(color: Colors.green)),
        ),
      );
    }

    return Column(
      children: [
        ...clients.map((c) => _buildCreditTile(context, c, isOverdue: false)),
        ...purchases.map((c) => _buildPurchaseCreditTile(context, c, isOverdue: false)),
      ],
    );
  }

  Widget _buildCreditTile(BuildContext context, Credit credit, {required bool isOverdue}) {
    final days = credit.daysUntilDue();
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isOverdue ? Colors.red : Colors.amber,
          child: const Icon(Icons.person, color: Colors.white),
        ),
        title: Text(credit.clientName),
        subtitle: Text(
          isOverdue
              ? 'Vencido hace ${days.abs()} día${days.abs() != 1 ? 's' : ''}'
              : 'Vence en $days día${days != 1 ? 's' : ''}',
          style: TextStyle(color: isOverdue ? Colors.red : Colors.amber),
        ),
        trailing: Text(
          '\$${credit.remaining.toStringAsFixed(0)}',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (ctx) => CreditDetailScreen(creditId: credit.id),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPurchaseCreditTile(
    BuildContext context,
    PurchaseCredit credit, {
    required bool isOverdue,
  }) {
    final days = credit.daysUntilDue();
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isOverdue ? Colors.red : Colors.amber,
          child: const Icon(Icons.business, color: Colors.white),
        ),
        title: Text(credit.supplierName),
        subtitle: Text(
          isOverdue
              ? 'Vencido hace ${days.abs()} día${days.abs() != 1 ? 's' : ''}'
              : 'Vence en $days día${days != 1 ? 's' : ''}',
          style: TextStyle(color: isOverdue ? Colors.red : Colors.amber),
        ),
        trailing: Text(
          '\$${credit.remaining.toStringAsFixed(0)}',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (ctx) => PurchaseCreditDetailScreen(creditId: credit.id),
            ),
          );
        },
      ),
    );
  }
}
