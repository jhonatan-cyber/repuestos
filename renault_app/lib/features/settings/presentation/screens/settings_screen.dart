// ignore_for_file: deprecated_member_use
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/theme_provider.dart';
import '../providers/settings_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(settingsProvider);
    final themeMode = ref.watch(themeNotifierProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Configuración')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (settings) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Apariencia',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(Icons.palette),
                title: const Text('Tema'),
                subtitle: Text(
                  themeMode == ThemeMode.light
                      ? 'Claro'
                      : themeMode == ThemeMode.dark
                          ? 'Oscuro'
                          : 'Sistema',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showThemeDialog(context, ref, themeMode),
              ),
              const SizedBox(height: 24),
              Text(
                'Datos de la empresa',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              _InfoTile(
                icon: Icons.store,
                label: 'Nombre',
                value: settings.name ?? 'No configurado',
              ),
              _InfoTile(
                icon: Icons.location_on,
                label: 'Dirección',
                value: settings.address ?? 'No configurado',
              ),
              _InfoTile(
                icon: Icons.phone,
                label: 'Teléfono',
                value: settings.phone ?? 'No configurado',
              ),
              _InfoTile(
                icon: Icons.badge,
                label: 'ID Fiscal',
                value: settings.taxId ?? 'No configurado',
              ),
              const SizedBox(height: 24),
              Text(
                'Acerca de',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              _InfoTile(
                icon: Icons.info,
                label: 'Versión',
                value: '1.0.0',
              ),
              _InfoTile(
                icon: Icons.code,
                label: 'Renault Reluz',
                value: 'Sistema de Gestión de Repuestos',
              ),
            ],
          );
        },
      ),
    );
  }

  void _showThemeDialog(BuildContext context, WidgetRef ref, ThemeMode current) {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Seleccionar tema'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              RadioListTile<ThemeMode>(
                value: ThemeMode.light,
                groupValue: current,
                title: const Text('Claro'),
                onChanged: (v) {
                  if (v != null) {
                    ref.read(themeNotifierProvider.notifier).setTheme(v);
                    Navigator.pop(ctx);
                  }
                },
              ),
              RadioListTile<ThemeMode>(
                value: ThemeMode.dark,
                groupValue: current,
                title: const Text('Oscuro'),
                onChanged: (v) {
                  if (v != null) {
                    ref.read(themeNotifierProvider.notifier).setTheme(v);
                    Navigator.pop(ctx);
                  }
                },
              ),
              RadioListTile<ThemeMode>(
                value: ThemeMode.system,
                groupValue: current,
                title: const Text('Sistema'),
                onChanged: (v) {
                  if (v != null) {
                    ref.read(themeNotifierProvider.notifier).setTheme(v);
                    Navigator.pop(ctx);
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: Colors.grey),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.labelMedium,
                ),
                Text(
                  value,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
