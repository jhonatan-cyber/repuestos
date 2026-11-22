import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/clients_provider.dart';
import 'client_detail_screen.dart';
import 'client_form_screen.dart';

class ClientsScreen extends ConsumerStatefulWidget {
  const ClientsScreen({super.key});

  @override
  ConsumerState<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends ConsumerState<ClientsScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _createClient() async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (ctx) => const ClientFormScreen()),
    );
    if (result == true && mounted) {
      ref.invalidate(clientsProvider(''));
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(clientsProvider(_query));
    return Scaffold(
      appBar: AppBar(title: const Text('Clientes')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _createClient,
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
                labelText: 'Buscar por nombre o teléfono',
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
              data: (clients) {
                if (clients.isEmpty) {
                  return const Center(child: Text('Sin clientes'));
                }
                return ListView.builder(
                  itemCount: clients.length,
                  itemBuilder: (context, i) {
                    final c = clients[i];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                        child: Text(
                          c.name.isNotEmpty ? c.name[0].toUpperCase() : '?',
                        ),
                      ),
                      title: Text(c.name),
                      subtitle: Text(c.phone ?? 'Sin teléfono'),
                      trailing: Text(
                        '\$${c.totalPurchases.toStringAsFixed(0)}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (ctx) => ClientDetailScreen(client: c),
                          ),
                        );
                      },
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
