import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/skeleton_list.dart';
import '../providers/users_provider.dart';
import 'user_form_screen.dart';

class UsersScreen extends ConsumerWidget {
  const UsersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final searchState = ref.watch(StateProvider<String>((ref) => ''));
    final async = ref.watch(usersProvider(searchState));

    return Scaffold(
      appBar: AppBar(title: const Text('Usuarios')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const UserFormScreen(),
            ),
          );
          if (result == true && context.mounted) {
            ref.invalidate(usersProvider);
          }
        },
        icon: const Icon(Icons.add),
        label: const Text('Nuevo'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Buscar usuario...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
              onSubmitted: (v) {
                ref.read(StateProvider<String>((ref) => searchState).notifier).state = v;
              },
            ),
          ),
          Expanded(
            child: async.when(
              loading: () => const SkeletonList(count: 5, leading: true),
              error: (e, _) => Center(child: Text('Error: $e')),
              data: (users) {
                if (users.isEmpty) {
                  return const EmptyState(
                    title: 'No hay usuarios',
                    description: 'No se encontraron usuarios en el sistema',
                    icon: Icons.people_outline,
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: users.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final user = users[index];
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: user.isActive
                              ? Colors.green
                              : Colors.grey,
                          child: Text(
                            user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                        title: Text(user.name),
                        subtitle: Text(user.email),
                        trailing: PopupMenuButton<String>(
                          onSelected: (value) async {
                            if (value == 'edit') {
                              final result = await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => UserFormScreen(user: user),
                                ),
                              );
                              if (result == true && context.mounted) {
                                ref.invalidate(usersProvider);
                              }
                            } else if (value == 'toggle') {
                              try {
                                await ref
                                    .read(userRepositoryProvider)
                                    .toggleStatus(user.id);
                                ref.invalidate(usersProvider);
                              } catch (e) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Error: $e')),
                                  );
                                }
                              }
                            }
                          },
                          itemBuilder: (context) => [
                            const PopupMenuItem(
                              value: 'edit',
                              child: Row(
                                children: [
                                  Icon(Icons.edit, size: 20),
                                  SizedBox(width: 8),
                                  Text('Editar'),
                                ],
                              ),
                            ),
                            PopupMenuItem(
                              value: 'toggle',
                              child: Row(
                                children: [
                                  Icon(
                                    user.isActive ? Icons.block : Icons.check_circle,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(user.isActive ? 'Desactivar' : 'Activar'),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
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
