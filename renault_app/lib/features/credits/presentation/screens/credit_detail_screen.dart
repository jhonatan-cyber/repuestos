import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/credits_model.dart';
import '../providers/credits_provider.dart';

class CreditDetailScreen extends ConsumerStatefulWidget {
  const CreditDetailScreen({required this.creditId, super.key});

  final String creditId;

  @override
  ConsumerState<CreditDetailScreen> createState() => _CreditDetailScreenState();
}

class _CreditDetailScreenState extends ConsumerState<CreditDetailScreen> {
  String _formatCurrency(num value) {
    return '\$${value.toStringAsFixed(2)}';
  }

  String _formatDate(String dateStr) {
    if (dateStr.isEmpty) return 'Sin fecha';
    try {
      final parts = dateStr.split('T');
      if (parts.isNotEmpty) {
        final dateParts = parts[0].split('-');
        if (dateParts.length == 3) {
          return '${dateParts[2]}/${dateParts[1]}/${dateParts[0]}';
        }
      }
    } catch (_) {}
    return dateStr;
  }

  String _formatPaymentMethod(String method) {
    switch (method.toLowerCase()) {
      case 'cash':
        return 'Efectivo';
      case 'card':
        return 'Tarjeta';
      case 'transfer':
        return 'Transferencia';
      case 'credit':
        return 'Crédito';
      default:
        return method;
    }
  }

  Future<void> _showPaymentSheet(Credit credit) async {
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
                    'Nuevo pago - ${credit.clientName}',
                    style: Theme.of(ctx).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Restante: ${_formatCurrency(credit.remaining)}',
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

    if (result != null && result > 0) {
      await _processPayment(result);
    }
  }

  Future<void> _processPayment(num amount) async {
    try {
      final payment = CreditPayment(
        creditId: widget.creditId,
        amount: amount,
      );
      await ref.read(creditsRepositoryProvider).payCredit(widget.creditId, payment);
      if (!mounted) return;
      ref.invalidate(creditDetailProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pago registrado exitosamente')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al registrar pago: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final asyncValue = ref.watch(creditDetailProvider(widget.creditId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalle de Crédito'),
        actions: [
          IconButton(
            icon: const Icon(Icons.payment),
            onPressed: () {
              final credit = asyncValue.valueOrNull;
              if (credit != null && credit.isActive) {
                _showPaymentSheet(credit);
              }
            },
            tooltip: 'Nuevo pago',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(creditDetailProvider);
            },
          ),
        ],
      ),
      body: asyncValue.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (credit) => _buildDetail(context, credit),
      ),
    );
  }

  Widget _buildDetail(BuildContext context, Credit credit) {
    final theme = Theme.of(context);
    final isActive = credit.isActive;
    final statusColor = isActive ? Colors.orange : Colors.green;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Status card
        Card(
          color: statusColor.withValues(alpha: 0.08),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(
                  isActive ? Icons.pending : Icons.check_circle,
                  color: statusColor,
                  size: 32,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isActive ? 'Activo' : 'Pagado',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: statusColor,
                        ),
                      ),
                      Text(
                        'Saldo restante: ${_formatCurrency(credit.remaining)}',
                        style: theme.textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.bold,
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

        // Client info
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Cliente',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Divider(height: 24),
                _InfoRow(
                  icon: Icons.person,
                  label: 'Nombre',
                  value: credit.clientName,
                ),
                if (credit.clientPhone.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _InfoRow(
                    icon: Icons.phone,
                    label: 'Teléfono',
                    value: credit.clientPhone,
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Sale info
        if (credit.sale != null) ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Venta asociada',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Divider(height: 24),
                  _InfoRow(
                    icon: Icons.calendar_today,
                    label: 'Fecha',
                    value: _formatDate(credit.sale!.date),
                  ),
                  if (credit.sale!.sellerName != null) ...[
                    const SizedBox(height: 8),
                    _InfoRow(
                      icon: Icons.badge,
                      label: 'Vendedor',
                      value: credit.sale!.sellerName!,
                    ),
                  ],
                  const SizedBox(height: 8),
                  _InfoRow(
                    icon: Icons.payment,
                    label: 'Método de pago',
                    value: _formatPaymentMethod(credit.sale!.paymentMethod),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Resumen financiero',
                    style: theme.textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Subtotal:', style: theme.textTheme.bodySmall),
                      Text(_formatCurrency(credit.sale!.subtotal),
                          style: theme.textTheme.bodyMedium),
                    ],
                  ),
                  if (credit.sale!.discount > 0) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Descuento:', style: theme.textTheme.bodySmall),
                        Text('-${_formatCurrency(credit.sale!.discount)}',
                            style: theme.textTheme.bodyMedium?.copyWith(
                                color: Colors.red)),
                      ],
                    ),
                  ],
                  const Divider(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Total:',
                          style: theme.textTheme.labelMedium?.copyWith(
                              fontWeight: FontWeight.bold)),
                      Text(_formatCurrency(credit.sale!.total),
                          style: theme.textTheme.labelLarge?.copyWith(
                              fontWeight: FontWeight.bold, color: Colors.blue)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Sale items
          if (credit.sale!.items.isNotEmpty) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Productos (${credit.sale!.items.length})',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Divider(height: 24),
                    ...credit.sale!.items.map((item) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.productName,
                                      style: theme.textTheme.bodyMedium,
                                    ),
                                    Text(
                                      '${item.quantity} x ${_formatCurrency(item.price)}',
                                      style: theme.textTheme.bodySmall,
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                _formatCurrency(item.subtotal),
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        )),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
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
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Divider(height: 24),
                if (credit.paymentRecords.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Center(
                      child: Column(
                        children: [
                          Icon(Icons.inbox, size: 48, color: Colors.grey),
                          SizedBox(height: 8),
                          Text('Sin pagos registrados'),
                        ],
                      ),
                    ),
                  )
                else
                  ...credit.paymentRecords.map((payment) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 16,
                              backgroundColor: Colors.green.withValues(alpha: 0.1),
                              child: Icon(
                                Icons.payment,
                                color: Colors.green,
                                size: 18,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _formatCurrency(payment.amount),
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.green,
                                    ),
                                  ),
                                  Text(
                                    _formatDate(payment.date),
                                    style: theme.textTheme.bodySmall,
                                  ),
                                  if (payment.notes != null &&
                                      payment.notes!.isNotEmpty)
                                    Text(
                                      payment.notes!,
                                      style: theme.textTheme.bodySmall
                                          ?.copyWith(color: Colors.grey),
                                    ),
                                  if (payment.userName != null &&
                                      payment.userName!.isNotEmpty)
                                    Text(
                                      'Por: ${payment.userName}',
                                      style: theme.textTheme.bodySmall
                                          ?.copyWith(color: Colors.grey),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      )),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Remaining balance highlight
        if (isActive)
          Card(
            color: Colors.orange.withValues(alpha: 0.08),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber, color: Colors.orange, size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Saldo pendiente',
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: Colors.orange,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          _formatCurrency(credit.remaining),
                          style: theme.textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        if (isActive)
                          FilledButton.icon(
                            onPressed: () => _showPaymentSheet(credit),
                            icon: const Icon(Icons.payment),
                            label: const Text('Nuevo pago'),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(
      {required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        Expanded(
          child: Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
          ),
        ),
      ],
    );
  }
}
