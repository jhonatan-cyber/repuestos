import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../data/client_model.dart';
import '../providers/clients_provider.dart';
import 'client_form_screen.dart';

class ClientDetailScreen extends ConsumerWidget {
  const ClientDetailScreen({required this.client, super.key});

  final Client client;

  Future<void> _callClient() async {
    if (client.phone == null) return;
    final uri = Uri(scheme: 'tel', path: client.phone);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _sendMessage() async {
    if (client.phone == null) return;
    final uri = Uri(scheme: 'sms', path: client.phone);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _deleteClient(WidgetRef ref, BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Eliminar cliente'),
        content: Text('¿Estás seguro de que querés eliminar "${client.name}"? Esta acción no se puede deshacer.'),
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
      await ref.read(clientRepositoryProvider).delete(client.id);
      if (context.mounted) {
        ref.invalidate(clientsProvider(''));
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cliente eliminado')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _editClient(BuildContext context, WidgetRef ref) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (ctx) => ClientFormScreen(client: client)),
    );
    if (result == true && context.mounted) {
      ref.invalidate(clientsProvider(''));
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: Text(client.name),
        actions: [
          IconButton(icon: const Icon(Icons.edit), onPressed: () => _editClient(context, ref), tooltip: 'Editar'),
          IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: () => _deleteClient(ref, context), tooltip: 'Eliminar'),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Avatar
          Center(
            child: Column(
              children: [
                const SizedBox(height: 16),
                CircleAvatar(
                  radius: 48,
                  backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                  child: Text(
                    client.name.isNotEmpty ? client.name[0].toUpperCase() : '?',
                    style: const TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  client.name,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 4),
                Chip(
                  label: Text(
                    client.status == 'active' ? 'Activo' : 'Inactivo',
                    style: const TextStyle(fontSize: 12),
                  ),
                  backgroundColor: client.status == 'active'
                      ? Colors.green.withValues(alpha: 0.1)
                      : Colors.grey.withValues(alpha: 0.1),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Información de contacto
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Contacto',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const Divider(),
                  if (client.phone != null) ...[
                    _buildContactRow(
                      Icons.phone,
                      'Teléfono',
                      client.phone!,
                      onTap: _callClient,
                    ),
                    _buildContactRow(
                      Icons.sms,
                      'Mensaje',
                      'Enviar SMS',
                      onTap: _sendMessage,
                    ),
                  ] else ...[
                    _buildRow('Teléfono', 'No registrado'),
                  ],
                  if (client.address != null)
                    _buildRow('Dirección', client.address!),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Resumen de compras
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Resumen',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const Divider(),
                  _buildRow(
                    'Total de compras',
                    '\$${client.totalPurchases.toStringAsFixed(0)}',
                    valueStyle: const TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Acciones rápidas
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Acciones',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const Divider(),
                  if (client.phone != null)
                    ListTile(
                      leading: const Icon(Icons.phone, color: Colors.green),
                      title: const Text('Llamar'),
                      subtitle: Text(client.phone!),
                      onTap: _callClient,
                    ),
                  if (client.phone != null)
                    ListTile(
                      leading: const Icon(Icons.sms, color: Colors.blue),
                      title: const Text('Enviar mensaje'),
                      subtitle: const Text('Enviar SMS al cliente'),
                      onTap: _sendMessage,
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value, {TextStyle? valueStyle}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Expanded(
            child: Text(
              value,
              style: valueStyle ?? const TextStyle(fontWeight: FontWeight.w500),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactRow(
    IconData icon,
    String label,
    String value, {
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, size: 20),
      title: Text(label),
      subtitle: Text(value),
      onTap: onTap,
      dense: true,
    );
  }
}
