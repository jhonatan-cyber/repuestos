import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/category_model.dart';
import '../providers/categories_provider.dart';

class CategoryFormScreen extends ConsumerStatefulWidget {
  const CategoryFormScreen({this.category, super.key});

  final Category? category;

  @override
  ConsumerState<CategoryFormScreen> createState() => _CategoryFormScreenState();
}

class _CategoryFormScreenState extends ConsumerState<CategoryFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameCtrl;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.category?.name ?? '');
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final category = Category(
      id: widget.category?.id ?? '',
      name: _nameCtrl.text.trim(),
    );

    try {
      final repo = ref.read(categoryRepositoryProvider);
      if (widget.category != null) {
        await repo.update(widget.category!.id, category);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Categoría actualizada')),
          );
          Navigator.pop(context, true);
        }
      } else {
        await repo.create(category);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Categoría creada')),
          );
          Navigator.pop(context, true);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.category != null;
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Editar categoría' : 'Nueva categoría'),
        actions: [
          TextButton(onPressed: _save, child: const Text('Guardar')),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Nombre *', border: OutlineInputBorder()),
              validator: (v) => v == null || v.trim().isEmpty ? 'Requerido' : null,
            ),
          ],
        ),
      ),
    );
  }
}
