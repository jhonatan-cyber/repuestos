import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../suppliers/data/supplier_model.dart';
import '../../../suppliers/presentation/providers/suppliers_provider.dart';
import '../providers/quotations_provider.dart';

class SendSupplierRequestsScreen extends ConsumerStatefulWidget {
  const SendSupplierRequestsScreen({required this.quotationId, super.key});

  final String quotationId;

  @override
  ConsumerState<SendSupplierRequestsScreen> createState() => _SendSupplierRequestsScreenState();
}

class _SendSupplierRequestsScreenState extends ConsumerState<SendSupplierRequestsScreen> {
  final Set<String> _selectedSuppliers = {};
  final _notesCtrl = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_selectedSuppliers.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Seleccioná al menos un proveedor')),
      );
      return;
    }

    setState(() => _sending = true);

    try {
      await ref.read(quotationsRepositoryProvider).sendSupplierRequests(
            widget.quotationId,
            _selectedSuppliers.toList(),
            notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Solicitudes enviadas correctamente')),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _sending = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final suppliersAsync = ref.watch(suppliersProvider(''));

    return Scaffold(
      appBar: AppBar(title: const Text('Enviar a proveedores')),
      body: suppliersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (suppliers) => _buildBody(context, suppliers),
      ),
    );
  }

  Widget _buildBody(BuildContext context, List<Supplier> suppliers) {
    if (suppliers.isEmpty) {
      return const Center(child: Text('No hay proveedores disponibles'));
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              TextButton(
                onPressed: () => setState(() => _selectedSuppliers.clear()),
                child: const Text('Deseleccionar todos'),
              ),
              const Spacer(),
              TextButton(
                onPressed: () => setState(() => _selectedSuppliers.addAll(suppliers.map((s) => s.id))),
                child: const Text('Seleccionar todos'),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: suppliers.length,
            itemBuilder: (context, index) {
              final supplier = suppliers[index];
              final selected = _selectedSuppliers.contains(supplier.id);
              return CheckboxListTile(
                value: selected,
                onChanged: (value) {
                  setState(() {
                    if (value == true) {
                      _selectedSuppliers.add(supplier.id);
                    } else {
                      _selectedSuppliers.remove(supplier.id);
                    }
                  });
                },
                title: Text(supplier.name),
                subtitle: Text('${supplier.phone ?? 'Sin teléfono'}${supplier.email != null ? ' • ${supplier.email!}' : ''}'),
                secondary: const Icon(Icons.business),
              );
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${_selectedSuppliers.length} proveedor(es) seleccionado(s)',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(color: Colors.grey),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _notesCtrl,
                decoration: const InputDecoration(
                  labelText: 'Notas (opcional)',
                  border: OutlineInputBorder(),
                  hintText: 'Mensaje para el proveedor...',
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _sending ? null : _send,
                  child: _sending
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Enviar solicitudes'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
