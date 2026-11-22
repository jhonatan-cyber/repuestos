import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

import '../providers/backup_provider.dart';

class BackupScreen extends ConsumerStatefulWidget {
  const BackupScreen({super.key});

  @override
  ConsumerState<BackupScreen> createState() => _BackupScreenState();
}

class _BackupScreenState extends ConsumerState<BackupScreen> {
  bool _creating = false;
  bool _restoring = false;

  Future<void> _createBackup() async {
    setState(() => _creating = true);
    try {
      final data = await ref.read(backupRepositoryProvider).createBackup();
      final dir = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final file = File('${dir.path}/renault_backup_$timestamp.json');
      await file.writeAsString(jsonEncode(data));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Backup guardado: ${file.path}')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al crear backup: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  Future<void> _restoreBackup() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Restaurar backup'),
        content: const Text(
          '¿Estás seguro? Esto reemplazará todos los datos actuales con los del backup. Esta acción no se puede deshacer.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Restaurar'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    // List backup files in app documents directory
    final dir = await getApplicationDocumentsDirectory();
    final backups = dir.listSync().whereType<File>().where((f) => f.path.contains('renault_backup_')).toList();

    if (backups.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No hay backups disponibles')),
        );
      }
      return;
    }

    if (!mounted) return;
    final selected = await showDialog<String?>(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: const Text('Seleccionar backup'),
        children: backups.map((f) {
          final name = f.path.split('/').last;
          return SimpleDialogOption(
            onPressed: () => Navigator.pop(ctx, f.path),
            child: Text(name),
          );
        }).toList(),
      ),
    );
    if (selected == null || !mounted) return;

    setState(() => _restoring = true);
    try {
      final file = File(selected);
      await ref.read(backupRepositoryProvider).restoreBackup(file);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Backup restaurado exitosamente')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al restaurar: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _restoring = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Backup y Restauración')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Crear backup', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(
                    'Descarga una copia de todos los datos del sistema en formato JSON.',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: _creating ? null : _createBackup,
                    icon: _creating ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.download),
                    label: Text(_creating ? 'Creando...' : 'Crear backup'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Restaurar backup', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: Colors.red)),
                  const SizedBox(height: 8),
                  Text(
                    'Restaura los datos desde un backup previo. Todos los datos actuales serán reemplazados.',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: _restoring ? null : _restoreBackup,
                    icon: _restoring ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.restore),
                    label: Text(_restoring ? 'Restaurando...' : 'Restaurar backup'),
                    style: FilledButton.styleFrom(backgroundColor: Colors.red),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
