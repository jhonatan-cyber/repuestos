class Category {
  Category({
    required this.id,
    required this.name,
    this.productCount = 0,
    this.status = 'active',
  });

  final String id;
  final String name;
  final int productCount;
  final String status;

  bool get isActive => status == 'active';

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        productCount: (json['productCount'] as int?) ?? 0,
        status: json['status']?.toString() ?? 'active',
      );

  factory Category.fromIsar(dynamic isar) => Category(
        id: isar.uuid,
        name: isar.name,
        productCount: isar.productCount ?? 0,
        status: isar.status ?? 'active',
      );

  Map<String, dynamic> toJson() => {
        if (id.isNotEmpty) 'id': id,
        'name': name,
        if (status.isNotEmpty) 'status': status,
      };

  Category copyWith({
    String? id,
    String? name,
    int? productCount,
    String? status,
  }) {
    return Category(
      id: id ?? this.id,
      name: name ?? this.name,
      productCount: productCount ?? this.productCount,
      status: status ?? this.status,
    );
  }
}
