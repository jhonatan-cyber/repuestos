import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/expenses_model.dart';
import '../providers/expenses_provider.dart';

class ExpenseFormScreen extends ConsumerStatefulWidget {
  const ExpenseFormScreen({this.expense, super.key});

  final Expense? expense;

  @override
  ConsumerState<ExpenseFormScreen> createState() => _ExpenseFormScreenState();
}

class _ExpenseFormScreenState extends ConsumerState<ExpenseFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _categoryCtrl;
  late TextEditingController _descriptionCtrl;
  late TextEditingController _amountCtrl;
  late TextEditingController _notesCtrl;
  DateTime? _selectedDate;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final e = widget.expense;
    _categoryCtrl = TextEditingController(text: e?.category ?? '');
    _descriptionCtrl = TextEditingController(text: e?.description ?? '');
    _amountCtrl = TextEditingController(text: e?.amount.toString() ?? '');
    _notesCtrl = TextEditingController(text: e?.notes ?? '');
    if (e?.date != null && e!.date!.isNotEmpty) {
      try {
        final parts = e.date!.split(' ')[0].split('-');
        if (parts.length == 3) {
          _selectedDate = DateTime(int.parse(parts[0]), int.parse(parts[1]), int.parse(parts[2]));
        }
      } catch (_) {}
    }
  }

  @override
  void dispose() {
    _categoryCtrl.dispose();
    _descriptionCtrl.dispose();
    _amountCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);

    try {
      final dateStr = _selectedDate != null
          ? '${_selectedDate!.year.toString().padLeft(4, '0')}-${_selectedDate!.month.toString().padLeft(2, '0')}-${_selectedDate!.day.toString().padLeft(2, '0')}'
          : null;

      if (widget.expense != null) {
        // Update existing expense
        final updated = widget.expense!.copyWith(
          category: _categoryCtrl.text.trim(),
          description: _descriptionCtrl.text.trim(),
          amount: num.parse(_amountCtrl.text),
          date: dateStr,
          notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
        );
        await ref.read(expensesRepositoryProvider).update(widget.expense!.id, updated);
      } else {
        // Create new expense
        final request = ExpenseRequest(
          category: _categoryCtrl.text.trim(),
          description: _descriptionCtrl.text.trim(),
          amount: num.parse(_amountCtrl.text),
          notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
        );
        await ref.read(expensesRepositoryProvider).create(request);
      }

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.expense != null ? 'Gasto actualizado' : 'Gasto registrado'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (date != null) {
      setState(() => _selectedDate = date);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.expense != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Editar gasto' : 'Nuevo gasto'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _categoryCtrl,
              decoration: const InputDecoration(
                labelText: 'Categoría *',
                prefixIcon: Icon(Icons.category),
                border: OutlineInputBorder(),
              ),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'La categoría es obligatoria';
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descriptionCtrl,
              decoration: const InputDecoration(
                labelText: 'Descripción *',
                prefixIcon: Icon(Icons.description),
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'La descripción es obligatoria';
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _amountCtrl,
              decoration: const InputDecoration(
                labelText: 'Monto *',
                prefixIcon: Icon(Icons.attach_money),
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'El monto es obligatorio';
                final amount = num.tryParse(v);
                if (amount == null || amount <= 0) return 'El monto debe ser mayor a 0';
                return null;
              },
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: _pickDate,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _selectedDate != null
                            ? '${_selectedDate!.day.toString().padLeft(2, '0')}/${_selectedDate!.month.toString().padLeft(2, '0')}/${_selectedDate!.year}'
                            : 'Fecha (opcional)',
                        style: TextStyle(
                          color: _selectedDate != null ? Colors.black87 : Colors.grey,
                        ),
                      ),
                    ),
                    const Icon(Icons.arrow_forward_ios, size: 16),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _notesCtrl,
              decoration: const InputDecoration(
                labelText: 'Notas (opcional)',
                prefixIcon: Icon(Icons.note),
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(isEditing ? 'Guardar cambios' : 'Registrar gasto'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
