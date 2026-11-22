import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../features/categories/presentation/providers/categories_provider.dart';
import '../../../../features/suppliers/presentation/providers/suppliers_provider.dart';
import '../../data/product_model.dart';
import '../providers/products_provider.dart';

class ProductFormScreen extends ConsumerStatefulWidget {
  const ProductFormScreen({this.product, super.key});

  final Product? product;

  @override
  ConsumerState<ProductFormScreen> createState() => _ProductFormScreenState();
}

class _ProductFormScreenState extends ConsumerState<ProductFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _codeCtrl;
  late TextEditingController _nameCtrl;
  late TextEditingController _descriptionCtrl;
  late TextEditingController _brandCtrl;
  late TextEditingController _modelCtrl;
  late TextEditingController _buyPriceCtrl;
  late TextEditingController _sellPriceCtrl;
  late TextEditingController _stockCtrl;
  late TextEditingController _minStockCtrl;
  late TextEditingController _unitCtrl;

  String? _selectedCategoryId;
  String? _selectedSupplierId;
  String? _imageBase64;

  @override
  void initState() {
    super.initState();
    final p = widget.product;
    _codeCtrl = TextEditingController(text: p?.code ?? '');
    _nameCtrl = TextEditingController(text: p?.name ?? '');
    _descriptionCtrl = TextEditingController(text: p?.description ?? '');
    _brandCtrl = TextEditingController(text: p?.brand ?? '');
    _modelCtrl = TextEditingController(text: p?.model ?? '');
    _buyPriceCtrl = TextEditingController(text: p?.purchasePrice.toString() ?? '0');
    _sellPriceCtrl = TextEditingController(text: p?.salePrice.toString() ?? '0');
    _stockCtrl = TextEditingController(text: p?.stock.toString() ?? '0');
    _minStockCtrl = TextEditingController(text: p?.minimumStock.toString() ?? '0');
    _unitCtrl = TextEditingController(text: p?.unit ?? 'unidad');
    _selectedCategoryId = p?.categoryId;
    _selectedSupplierId = p?.supplierId;
    _imageBase64 = p?.imageBytes;
  }

  @override
  void dispose() {
    _codeCtrl.dispose();
    _nameCtrl.dispose();
    _descriptionCtrl.dispose();
    _brandCtrl.dispose();
    _modelCtrl.dispose();
    _buyPriceCtrl.dispose();
    _sellPriceCtrl.dispose();
    _stockCtrl.dispose();
    _minStockCtrl.dispose();
    _unitCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final product = Product(
      id: widget.product?.id ?? '',
      code: _codeCtrl.text.trim(),
      name: _nameCtrl.text.trim(),
      description: _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      brand: _brandCtrl.text.trim(),
      model: _modelCtrl.text.trim(),
      categoryId: _selectedCategoryId,
      purchasePrice: num.tryParse(_buyPriceCtrl.text) ?? 0,
      salePrice: num.tryParse(_sellPriceCtrl.text) ?? 0,
      stock: num.tryParse(_stockCtrl.text) ?? 0,
      minimumStock: num.tryParse(_minStockCtrl.text) ?? 0,
      unit: _unitCtrl.text.trim().isEmpty ? 'unidad' : _unitCtrl.text.trim(),
      supplierId: _selectedSupplierId,
      imageBytes: _imageBase64,
    );

    try {
      final repo = ref.read(productRepositoryProvider);
      if (widget.product != null) {
        await repo.update(widget.product!.id, product);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Producto actualizado')),
          );
          Navigator.pop(context, true);
        }
      } else {
        await repo.create(product);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Producto creado')),
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

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 80,
      );
      if (pickedFile != null) {
        final bytes = await pickedFile.readAsBytes();
        setState(() {
          _imageBase64 = base64Encode(bytes);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al seleccionar imagen: $e')),
        );
      }
    }
  }

  void _showImageSourceDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Agregar foto'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Tomar foto'),
              onTap: () {
                Navigator.pop(ctx);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Elegir de galería'),
              onTap: () {
                Navigator.pop(ctx);
                _pickImage(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Foto del producto',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            if (_imageBase64 != null && _imageBase64!.isNotEmpty)
              SizedBox(
                width: 100,
                height: 100,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.memory(
                    base64Decode(_imageBase64!),
                    fit: BoxFit.cover,
                    errorBuilder: (ctx, err, _) => Container(
                      color: Colors.grey[300],
                      child: const Icon(Icons.broken_image, size: 40),
                    ),
                  ),
                ),
              )
            else
              SizedBox(
                width: 100,
                height: 100,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.image, size: 40, color: Colors.grey),
                ),
              ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ElevatedButton.icon(
                    onPressed: _showImageSourceDialog,
                    icon: const Icon(Icons.add_a_photo),
                    label: const Text('Agregar foto'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.surface,
                      foregroundColor: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                  if (_imageBase64 != null && _imageBase64!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    TextButton.icon(
                      onPressed: () => setState(() => _imageBase64 = null),
                      icon: const Icon(Icons.delete, size: 18),
                      label: const Text('Eliminar foto'),
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.red,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.product != null;
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Editar producto' : 'Nuevo producto'),
        actions: [
          TextButton(
            onPressed: _save,
            child: const Text('Guardar'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _codeCtrl,
              decoration: const InputDecoration(labelText: 'Código *', border: OutlineInputBorder()),
              validator: (v) => v == null || v.trim().isEmpty ? 'Requerido' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Nombre *', border: OutlineInputBorder()),
              validator: (v) => v == null || v.trim().isEmpty ? 'Requerido' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descriptionCtrl,
              decoration: const InputDecoration(labelText: 'Descripción', border: OutlineInputBorder()),
              maxLines: 3,
            ),
            const SizedBox(height: 12),
            _buildImageSection(),
            const SizedBox(height: 12),
            // Categoría dropdown
            Consumer(
              builder: (context, ref, _) {
                final categoriesAsync = ref.watch(categoriesProvider);
                return categoriesAsync.when(
                  loading: () => const CircularProgressIndicator(),
                  error: (e, _) => Text('Error: $e'),
                  data: (categories) {
                    final active = categories.where((c) => c.isActive).toList();
                    return DropdownButtonFormField<String>(
                      initialValue: _selectedCategoryId,
                      decoration: const InputDecoration(
                        labelText: 'Categoría',
                        border: OutlineInputBorder(),
                      ),
                      items: active.map((c) {
                        return DropdownMenuItem(value: c.id, child: Text(c.name));
                      }).toList(),
                      onChanged: (v) => setState(() => _selectedCategoryId = v),
                    );
                  },
                );
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _brandCtrl,
              decoration: const InputDecoration(labelText: 'Marca', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _modelCtrl,
              decoration: const InputDecoration(labelText: 'Modelo', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _buyPriceCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Precio compra',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _sellPriceCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Precio venta *',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Requerido';
                      final price = num.tryParse(v);
                      if (price == null || price <= 0) return 'Debe ser > 0';
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _stockCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Stock *',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Requerido';
                      final s = num.tryParse(v);
                      if (s == null || s < 0) return 'Debe ser ≥ 0';
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _minStockCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Stock mínimo',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _unitCtrl,
              decoration: const InputDecoration(labelText: 'Unidad', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            // Proveedor dropdown
            Consumer(
              builder: (context, ref, _) {
                final suppliersAsync = ref.watch(suppliersProvider(''));
                return suppliersAsync.when(
                  loading: () => const CircularProgressIndicator(),
                  error: (e, _) => Text('Error: $e'),
                  data: (suppliers) {
                    final active = suppliers.where((s) => s.isActive).toList();
                    return DropdownButtonFormField<String>(
                      initialValue: _selectedSupplierId,
                      decoration: const InputDecoration(
                        labelText: 'Proveedor',
                        border: OutlineInputBorder(),
                      ),
                      items: [
                        const DropdownMenuItem(value: null, child: Text('Sin proveedor')),
                        ...active.map((s) {
                          return DropdownMenuItem(value: s.id, child: Text(s.name));
                        }),
                      ],
                      onChanged: (v) => setState(() => _selectedSupplierId = v),
                    );
                  },
                );
              },
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _save,
              icon: const Icon(Icons.save),
              label: const Text('Guardar producto'),
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
