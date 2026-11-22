import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/credits_model.dart';
import '../providers/credits_provider.dart';
import 'credit_detail_screen.dart';

class CreditsScreen extends ConsumerStatefulWidget {
  const CreditsScreen({super.key});

  @override
  ConsumerState<CreditsScreen> createState() => _CreditsScreenState();
}

class _CreditsScreenState extends ConsumerState<CreditsScreen> {
  int _currentTab = 0;
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void payCredit(Credit credit) {
    _showPaymentSheet(
      credit.id,
      credit.clientName,
      credit.remaining,
      isPurchase: false,
    );
  }

  void payPurchaseCredit(PurchaseCredit credit) {
    _showPaymentSheet(
      credit.id,
      credit.supplierName,
      credit.remaining,
      isPurchase: true,
    );
  }

  Future<void> _showPaymentSheet(
    String id,
    String name,
    num remaining, {
    required bool isPurchase,
  }) async {
    final result = await showModalBottomSheet<num>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final amountCtrl = TextEditingController();
          final notesCtrl = TextEditingController();
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom,
            ),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Pago a $name',
                    style: Theme.of(ctx).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Restante: \$${remaining.toStringAsFixed(0)}',
                    style: Theme.of(ctx).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: amountCtrl,
                    decoration: InputDecoration(
                      labelText: 'Monto',
                      prefixIcon: const Icon(Icons.attach_money),
                      border: const OutlineInputBorder(),
                      suffixIcon: TextButton(
                        onPressed: () {
                          setModalState(() {
                            amountCtrl.text = remaining.toStringAsFixed(2);
                          });
                        },
                        child: const Text('Total'),
                      ),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: notesCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Notas (opcional)',
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
                        Navigator.of(ctx).pop(amount);
                      },
                      child: const Text('Registrar pago'),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
    if (result == null || result <= 0) return;
    final payment = CreditPayment(
      creditId: id,
      amount: result,
      notes: null,
    );
    try {
      if (isPurchase) {
        await ref.read(creditsRepositoryProvider).payPurchaseCredit(id, payment);
      } else {
        await ref.read(creditsRepositoryProvider).payCredit(id, payment);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pago registrado')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Créditos')),
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
              onSubmitted: (v) {},
            ),
          ),
          TabBar(
            tabs: const [
              Tab(text: 'A clientes'),
              Tab(text: 'A proveedores'),
            ],
            onTap: (i) => setState(() => _currentTab = i),
          ),
          Expanded(
            child: _currentTab == 0 ? _ClientCreditsTab() : _PurchaseCreditsTab(),
          ),
        ],
      ),
    );
  }
}

class _ClientCreditsTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(creditsProvider(''));
    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (credits) {
        if (credits.isEmpty) {
          return const Center(child: Text('Sin créditos a clientes'));
        }
        final totalRemaining = credits.fold<num>(
          0,
          (sum, c) => sum + c.remaining,
        );
        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: Card(
                color: Colors.purple.withValues(alpha: 0.08),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total adeudado',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        '\$${totalRemaining.toStringAsFixed(0)}',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Colors.purple,
                            ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: credits.length,
                itemBuilder: (context, i) {
                  final c = credits[i];
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor: c.isActive ? Colors.purple : Colors.grey,
                      child: const Icon(
                        Icons.credit_card,
                        color: Colors.white,
                      ),
                    ),
                    title: Text(c.clientName),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (ctx) => CreditDetailScreen(creditId: c.id),
                        ),
                      );
                    },
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Total: \$${c.total.toStringAsFixed(0)}',
                        ),
                        LinearProgressIndicator(
                          value: 1 - (c.remaining / c.total),
                          backgroundColor: Colors.grey.shade200,
                          valueColor: const AlwaysStoppedAnimation<Color>(
                            Colors.purple,
                          ),
                        ),
                      ],
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '\$${c.remaining.toStringAsFixed(0)}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const Text('restante'),
                        if (c.isActive)
                          IconButton(
                            icon: const Icon(Icons.payment, size: 20),
                            tooltip: 'Pagar',
                            onPressed: () {
                              final state = context
                                  .findAncestorStateOfType<_CreditsScreenState>();
                              state?.payCredit(c);
                            },
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
    );
  }
}

class _PurchaseCreditsTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(purchaseCreditsProvider(''));
    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (credits) {
        if (credits.isEmpty) {
          return const Center(child: Text('Sin créditos a proveedores'));
        }
        final totalRemaining = credits.fold<num>(
          0,
          (sum, c) => sum + c.remaining,
        );
        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: Card(
                color: Colors.orange.withValues(alpha: 0.08),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total adeudado',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        '\$${totalRemaining.toStringAsFixed(0)}',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Colors.orange,
                            ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: credits.length,
                itemBuilder: (context, i) {
                  final c = credits[i];
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor:
                          c.isActive ? Colors.orange : Colors.grey,
                      child: const Icon(
                        Icons.business,
                        color: Colors.white,
                      ),
                    ),
                    title: Text(c.supplierName),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Total: \$${c.total.toStringAsFixed(0)}',
                        ),
                        LinearProgressIndicator(
                          value: 1 - (c.remaining / c.total),
                          backgroundColor: Colors.grey.shade200,
                          valueColor: const AlwaysStoppedAnimation<Color>(
                            Colors.orange,
                          ),
                        ),
                      ],
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '\$${c.remaining.toStringAsFixed(0)}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const Text('restante'),
                        if (c.isActive)
                          IconButton(
                            icon: const Icon(Icons.payment, size: 20),
                            tooltip: 'Pagar',
                            onPressed: () {
                              final state = context
                                  .findAncestorStateOfType<_CreditsScreenState>();
                              state?.payPurchaseCredit(c);
                            },
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
    );
  }
}
