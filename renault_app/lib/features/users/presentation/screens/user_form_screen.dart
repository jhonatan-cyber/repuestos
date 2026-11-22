import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../roles/presentation/providers/roles_provider.dart';
import '../providers/users_provider.dart';
import '../../data/user_model.dart';

class UserFormScreen extends ConsumerStatefulWidget {
  const UserFormScreen({this.user, super.key});

  final UserModel? user;

  @override
  ConsumerState<UserFormScreen> createState() => _UserFormScreenState();
}

class _UserFormScreenState extends ConsumerState<UserFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _passwordCtrl;
  late TextEditingController _confirmPasswordCtrl;

  String? _selectedRoleId;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final u = widget.user;
    _nameCtrl = TextEditingController(text: u?.name ?? '');
    _emailCtrl = TextEditingController(text: u?.email ?? '');
    _passwordCtrl = TextEditingController();
    _confirmPasswordCtrl = TextEditingController();
    _selectedRoleId = u?.role;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final isEdit = widget.user != null;

    // For create, password is required
    if (!isEdit && (_passwordCtrl.text.isEmpty || _confirmPasswordCtrl.text.isEmpty)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('La contraseña es requerida')),
        );
      }
      return;
    }

    setState(() => _saving = true);

    try {
      final user = UserModel(
        id: widget.user?.id ?? '',
        name: _nameCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        role: _selectedRoleId ?? 'user',
        status: widget.user?.status ?? 'active',
      );

      final repo = ref.read(userRepositoryProvider);
      if (isEdit) {
        await repo.update(widget.user!.id, user);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Usuario actualizado')),
          );
          Navigator.pop(context, true);
        }
      } else {
        await repo.create(user, password: _passwordCtrl.text);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Usuario creado')),
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
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.user != null;
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Editar usuario' : 'Nuevo usuario'),
        actions: [
          if (!_saving)
            TextButton(
              onPressed: _save,
              child: const Text('Guardar'),
            ),
          if (_saving) const Padding(padding: EdgeInsets.all(12), child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))),
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
            const SizedBox(height: 12),
            TextFormField(
              controller: _emailCtrl,
              decoration: const InputDecoration(labelText: 'Email *', border: OutlineInputBorder()),
              keyboardType: TextInputType.emailAddress,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Requerido';
                if (!v.contains('@')) return 'Email inválido';
                return null;
              },
            ),
            const SizedBox(height: 12),
            // Role dropdown
            Consumer(
              builder: (context, ref, _) {
                final rolesAsync = ref.watch(rolesProvider);
                return rolesAsync.when(
                  loading: () => const CircularProgressIndicator(),
                  error: (e, _) => Text('Error: $e'),
                  data: (roles) {
                    return DropdownButtonFormField<String>(
                      initialValue: _selectedRoleId,
                      decoration: const InputDecoration(
                        labelText: 'Rol *',
                        border: OutlineInputBorder(),
                      ),
                      items: roles.map((r) {
                        return DropdownMenuItem(value: r.id, child: Text(r.name));
                      }).toList(),
                      onChanged: (v) => setState(() => _selectedRoleId = v),
                      validator: (v) => v == null || v.isEmpty ? 'Seleccioná un rol' : null,
                    );
                  },
                );
              },
            ),
            if (!isEdit) ...[
              const SizedBox(height: 12),
              TextFormField(
                controller: _passwordCtrl,
                decoration: InputDecoration(
                  labelText: 'Contraseña *',
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: Icon(_obscurePassword ? Icons.visibility : Icons.visibility_off),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
                obscureText: _obscurePassword,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Requerida';
                  if (v.length < 6) return 'Mínimo 6 caracteres';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _confirmPasswordCtrl,
                decoration: InputDecoration(
                  labelText: 'Confirmar contraseña *',
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: Icon(_obscureConfirmPassword ? Icons.visibility : Icons.visibility_off),
                    onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                  ),
                ),
                obscureText: _obscureConfirmPassword,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Requerida';
                  if (v != _passwordCtrl.text) return 'Las contraseñas no coinciden';
                  return null;
                },
              ),
            ],
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _saving ? null : _save,
              icon: const Icon(Icons.save),
              label: Text(isEdit ? 'Guardar cambios' : 'Crear usuario'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
