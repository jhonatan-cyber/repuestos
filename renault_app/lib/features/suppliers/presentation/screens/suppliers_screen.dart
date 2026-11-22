import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/suppliers_provider.dart';
import 'supplier_form_screen.dart';

class SuppliersScreen extends ConsumerStatefulWidget {
  const SuppliersScreen({super.key});

  @override
  ConsumerState<SuppliersScreen> createState() => _SuppliersScreenState();
}

class _SuppliersScreenState extends ConsumerState<SuppliersScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _createSupplier() async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (ctx) => const SupplierFormScreen()),
    );
    if (result == true && mounted) {
      ref.invalidate(suppliersProvider(''));
    }
  }

  Future<void> _editSupplier(dynamic supplier) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (ctx) => SupplierFormScreen(supplier: supplier)),
    );
    if (result == true && mounted) {
      ref.invalidate(suppliersProvider(''));
    }
  }

  Future<void> _deleteSupplier(String id, String name) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Eliminar proveedor'),
        content: Text('¿Estás seguro de que querés eliminar "$name"? Esta acción no se puede deshacer.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Sí, eliminar'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ref.read(supplierRepositoryProvider).delete(id);
      if (mounted) {
        ref.invalidate(suppliersProvider(''));
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Proveedor eliminado')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(suppliersProvider(_query));
    return Scaffold(
      appBar: AppBar(title: const Text('Proveedores')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _createSupplier,
        icon: const Icon(Icons.add),
        label: const Text('Nuevo'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchCtrl,
              decoration: const InputDecoration(
                labelText: 'Buscar por nombre',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onSubmitted: (v) => setState(() => _query = v.trim()),
            ),
          ),
          Expanded(
            child: async.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e')),
              data: (suppliers) {
                if (suppliers.isEmpty) {
                  return const Center(child: Text('Sin proveedores'));
                }
                return ListView.builder(
                  itemCount: suppliers.length,
                  itemBuilder: (context, i) {
                    final s = suppliers[i];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: s.isActive ? Colors.blue : Colors.grey,
                        child: Text(
                          s.name.isNotEmpty ? s.name[0].toUpperCase() : '?',
                          style: const TextStyle(color: Colors.white),
                        ),
                      ),
                      title: Text(s.name),
                      subtitle: Text(
                        s.contactName ?? s.phone ?? 'Sin contacto',
                      ),
                      trailing: PopupMenuButton<String>(
                        onSelected: (value) {
                          if (value == 'edit') _editSupplier(s);
                          if (value == 'delete') _deleteSupplier(s.id, s.name);
                        },
                        itemBuilder: (context) => [
                          const PopupMenuItem(value: 'edit', child: Text('Editar')),
                          const PopupMenuItem(value: 'delete', child: Text('Eliminar', style: TextStyle(color: Colors.red))),
                        ],
                      ),
                      tileColor: s.isActive
                          ? null
                          : Colors.grey.withValues(alpha: 0.1),
                      onTap: () => _editSupplier(s),
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
}
