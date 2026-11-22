import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/skeleton_list.dart';
import '../providers/permissions_provider.dart';

class PermissionsScreen extends ConsumerWidget {
  const PermissionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(permissionsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Permisos')),
      body: async.when(
        loading: () => const SkeletonList(count: 5, leading: true),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (permissions) {
          if (permissions.isEmpty) {
            return const EmptyState(
              title: 'No hay permisos',
              description: 'No se encontraron permisos en el sistema',
              icon: Icons.lock_outline,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: permissions.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final perm = permissions[index];
              return Card(
                child: ListTile(
                  leading: Icon(
                    perm.isSystem ? Icons.build : Icons.lock_open,
                    color: perm.isSystem ? Colors.orange : Colors.green,
                  ),
                  title: Text(perm.name),
                  subtitle: perm.description.isNotEmpty ? Text(perm.description) : null,
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Chip(
                        label: Text(
                          perm.isActive ? 'Activo' : 'Inactivo',
                          style: TextStyle(
                            color: perm.isActive ? Colors.green : Colors.grey,
                            fontSize: 12,
                          ),
                        ),
                        backgroundColor: perm.isActive
                            ? Colors.green.withValues(alpha: 0.1)
                            : Colors.grey.withValues(alpha: 0.1),
                      ),
                      if (!perm.isSystem)
                        Switch(
                          value: perm.isActive,
                          activeTrackColor: Colors.green,
                          onChanged: (value) async {
                            try {
                              await ref
                                  .read(permissionRepositoryProvider)
                                  .toggleStatus(perm.id);
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Error: $e')),
                                );
                              }
                            }
                          },
                        ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
