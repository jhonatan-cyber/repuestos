import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/categories_provider.dart';
import 'category_form_screen.dart';

class CategoriesScreen extends ConsumerWidget {
  const CategoriesScreen({super.key});

  Future<void> _createCategory(BuildContext context, WidgetRef ref) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (ctx) => const CategoryFormScreen()),
    );
    if (result == true) {
      ref.invalidate(categoriesProvider);
    }
  }

  Future<void> _editCategory(BuildContext context, WidgetRef ref, category) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (ctx) => CategoryFormScreen(category: category)),
    );
    if (result == true) {
      ref.invalidate(categoriesProvider);
    }
  }

  Future<void> _toggleStatus(WidgetRef ref, BuildContext context, id) async {
    try {
      await ref.read(categoryRepositoryProvider).toggleStatus(id);
      ref.invalidate(categoriesProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Estado actualizado')));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(categoriesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Categorías')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _createCategory(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Nuevo'),
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (categories) {
          if (categories.isEmpty) {
            return const Center(child: Text('Sin categorías'));
          }
          return ListView.builder(
            itemCount: categories.length,
            itemBuilder: (context, i) {
              final c = categories[i];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: c.isActive ? Colors.green : Colors.grey,
                  child: const Icon(Icons.category, color: Colors.white),
                ),
                title: Text(c.name),
                subtitle: Text('${c.productCount} productos'),
                trailing: PopupMenuButton<String>(
                  onSelected: (value) {
                    if (value == 'edit') _editCategory(context, ref, c);
                    if (value == 'toggle') _toggleStatus(ref, context, c.id);
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(value: 'edit', child: Text('Editar')),
                    PopupMenuItem(
                      value: 'toggle',
                      child: Text(c.isActive ? 'Desactivar' : 'Activar'),
                    ),
                  ],
                ),
                tileColor: c.isActive
                    ? null
                    : Colors.grey.withValues(alpha: 0.1),
              );
            },
          );
        },
      ),
    );
  }
}
