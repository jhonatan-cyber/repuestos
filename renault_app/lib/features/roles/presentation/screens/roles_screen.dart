import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/skeleton_list.dart';
import '../providers/roles_provider.dart';

class RolesScreen extends ConsumerWidget {
  const RolesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(rolesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Roles')),
      body: async.when(
        loading: () => const SkeletonList(count: 5, leading: true),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (roles) {
          if (roles.isEmpty) {
            return const EmptyState(
              title: 'No hay roles',
              description: 'No se encontraron roles en el sistema',
              icon: Icons.admin_panel_settings_outlined,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: roles.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final role = roles[index];
              return Card(
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    child: Text(
                      role.name.isNotEmpty ? role.name[0].toUpperCase() : '?',
                      style: const TextStyle(color: Colors.white),
                    ),
                  ),
                  title: Text(role.name),
                  subtitle: Text('${role.permissions.length} permisos'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => RoleDetailScreen(role: role),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class RoleDetailScreen extends StatelessWidget {
  const RoleDetailScreen({required this.role, super.key});

  final dynamic role;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(role.name)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (role.description.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                role.description,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
              ),
            ),
          Text(
            'Permisos (${role.permissions.length})',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          ...role.permissions.map<Widget>((perm) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Chip(
                  label: Text(perm),
                  backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                ),
              )),
        ],
      ),
    );
  }
}
