import '../../../core/database/isar_schemas.dart';

class Product {
  Product({
    required this.id,
    required this.code,
    required this.name,
    this.description,
    this.brand = '',
    this.model = '',
    this.category = '',
    this.categoryId,
    required this.purchasePrice,
    required this.salePrice,
    required this.stock,
    required this.minimumStock,
    this.unit = 'unidad',
    this.supplierName,
    this.supplierId,
    this.image,
    this.imageBytes,
    this.status = 'active',
  });

  final String id;
  final String code;
  final String name;
  final String? description;
  final String brand;
  final String model;
  final String category;
  final String? categoryId;
  final num purchasePrice;
  final num salePrice;
  final num stock;
  final num minimumStock;
  final String unit;
  final String? supplierName;
  final String? supplierId;
  final String? image;
  final String? imageBytes; // base64 encoded image from camera/gallery
  final String status;

  bool get isLowStock => stock <= minimumStock;
  bool get hasImage => (image != null && image!.isNotEmpty) ||
      (imageBytes != null && imageBytes!.isNotEmpty);

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: json['id']?.toString() ?? '',
        code: json['code']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        description: json['description']?.toString(),
        brand: json['brand']?.toString() ?? '',
        model: json['model']?.toString() ?? '',
        category: json['category']?.toString() ?? '',
        categoryId: json['categoryId']?.toString(),
        purchasePrice: (json['purchasePrice'] as num?) ?? 0,
        salePrice: (json['salePrice'] as num?) ?? 0,
        stock: (json['stock'] as num?) ?? 0,
        minimumStock: (json['minimumStock'] as num?) ?? 0,
        unit: json['unit']?.toString() ?? 'unidad',
        supplierName: json['supplierName']?.toString(),
        supplierId: json['supplierId']?.toString(),
        image: json['image']?.toString(),
        status: json['status']?.toString() ?? 'active',
      );

  factory Product.fromIsar(IsarProduct p) => Product(
        id: p.uuid,
        code: p.code,
        name: p.name,
        description: p.description,
        brand: p.brand ?? '',
        model: p.model ?? '',
        category: p.category ?? '',
        purchasePrice: p.buyPrice ?? 0,
        salePrice: p.sellPrice,
        stock: p.stock,
        minimumStock: p.minStock ?? 0,
        unit: p.unit ?? 'unidad',
        supplierName: p.supplierName,
        supplierId: p.supplierId,
        image: p.image,
      );

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      if (id.isNotEmpty) 'id': id,
      'code': code,
      'name': name,
      if (description != null) 'description': description,
      'brand': brand,
      'model': model,
      'categoryId': categoryId ?? '',
      'purchasePrice': purchasePrice,
      'salePrice': salePrice,
      'stock': stock,
      'minimumStock': minimumStock,
      'unit': unit,
      if (supplierId != null) 'supplierId': supplierId,
    };
    // If there's a local image (base64), include it
    if (imageBytes != null && imageBytes!.isNotEmpty) {
      map['image'] = imageBytes;
    } else if (image != null && image!.isNotEmpty) {
      map['image'] = image;
    }
    return map;
  }

  Product copyWith({
    String? id,
    String? code,
    String? name,
    String? description,
    String? brand,
    String? model,
    String? category,
    String? categoryId,
    num? purchasePrice,
    num? salePrice,
    num? stock,
    num? minimumStock,
    String? unit,
    String? supplierName,
    String? supplierId,
    String? image,
    String? imageBytes,
    String? status,
  }) {
    return Product(
      id: id ?? this.id,
      code: code ?? this.code,
      name: name ?? this.name,
      description: description ?? this.description,
      brand: brand ?? this.brand,
      model: model ?? this.model,
      category: category ?? this.category,
      categoryId: categoryId ?? this.categoryId,
      purchasePrice: purchasePrice ?? this.purchasePrice,
      salePrice: salePrice ?? this.salePrice,
      stock: stock ?? this.stock,
      minimumStock: minimumStock ?? this.minimumStock,
      unit: unit ?? this.unit,
      supplierName: supplierName ?? this.supplierName,
      supplierId: supplierId ?? this.supplierId,
      image: image ?? this.image,
      imageBytes: imageBytes ?? this.imageBytes,
      status: status ?? this.status,
    );
  }
}
