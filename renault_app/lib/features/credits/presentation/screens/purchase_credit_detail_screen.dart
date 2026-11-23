import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/credits_model.dart';
import '../providers/credits_provider.dart';

class PurchaseCreditDetailScreen extends ConsumerWidget {
  const PurchaseCreditDetailScreen({required this.creditId, super.key});

  final String creditId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(purchaseCreditDetailProvider(creditId));
    return Scaffold(
      appBar: AppBar(title: const Text('Crédito de proveedor')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (credit) => _buildDetail(context, ref, credit),
      ),
    );
  }

  Widget _buildDetail(BuildContext context, WidgetRef ref, PurchaseCredit credit) {
    final paid = credit.total - credit.remaining;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Status card
        Card(
          color: credit.isActive
              ? Colors.orange.withValues(alpha: 0.08)
              : Colors.grey.withValues(alpha: 0.08),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor:
                      credit.isActive ? Colors.orange : Colors.grey,
                  child: const Icon(Icons.business, color: Colors.white),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        credit.supplierName,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        credit.isActive ? 'Activo' : 'Pagado',
                        style: TextStyle(
                          color: credit.isActive ? Colors.orange : Colors.grey,
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

        // Financial summary
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Resumen financiero',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 12),
                _summaryRow('Total', '\$${credit.total.toStringAsFixed(0)}'),
                _summaryRow('Pagado', '\$${paid.toStringAsFixed(0)}'),
                _summaryRow(
                  'Restante',
                  '\$${credit.remaining.toStringAsFixed(0)}',
                  valueColor: Colors.red,
                ),
                if (credit.dueDate != null)
                  _summaryRow('Vencimiento', credit.dueDate!),
                const SizedBox(height: 12),
                LinearProgressIndicator(
                  value: 1 - (credit.remaining / credit.total),
                  backgroundColor: Colors.grey.shade200,
                  valueColor:
                      const AlwaysStoppedAnimation<Color>(Colors.orange),
                ),
                const SizedBox(height: 4),
                Text(
                  '${((1 - credit.remaining / credit.total) * 100).toStringAsFixed(0)}% pagado',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Supplier info
        if (credit.supplier != null) ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Proveedor',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 8),
                  Text('Nombre: ${credit.supplier!.name}'),
                  if (credit.supplierPhone.isNotEmpty)
                    Text('Teléfono: ${credit.supplierPhone}'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Payment history
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Historial de pagos (${credit.paymentRecords.length})',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 8),
                if (credit.paymentRecords.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(
                      child: Text('Sin pagos registrados'),
                    ),
                  )
                else
                  ...credit.paymentRecords.map((payment) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            const Icon(Icons.payment, size: 20, color: Colors.orange),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '\$${payment.amount.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    payment.date,
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                            if (payment.userName != null)
                              Text(
                                payment.userName!,
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                          ],
                        ),
                      )),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Pay button
        if (credit.isActive)
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _showPaymentSheet(context, ref, credit),
              icon: const Icon(Icons.payment),
              label: const Text('Registrar pago'),
            ),
          ),
      ],
    );
  }

  Widget _summaryRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showPaymentSheet(
    BuildContext context,
    WidgetRef ref,
    PurchaseCredit credit,
  ) async {
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
                    'Pago a ${credit.supplierName}',
                    style: Theme.of(ctx).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Restante: \$${credit.remaining.toStringAsFixed(0)}',
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
                            amountCtrl.text = credit.remaining.toStringAsFixed(2);
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
      creditId: credit.id,
      amount: result,
      notes: null,
    );
    try {
      await ref.read(creditsRepositoryProvider).payPurchaseCredit(credit.id, payment);
      if (context.mounted) {
        ref.invalidate(purchaseCreditDetailProvider(credit.id));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pago registrado')),
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
}
