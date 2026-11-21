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
    this.image,
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
  final String? image;
  final String status;

  bool get isLowStock => stock <= minimumStock;

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
        image: json['image']?.toString(),
        status: json['status']?.toString() ?? 'active',
      );
}
