class Client {
  Client({
    required this.id,
    required this.name,
    this.phone,
    this.address,
    this.status = 'active',
    this.totalPurchases = 0,
  });

  final String id;
  final String name;
  final String? phone;
  final String? address;
  final String status;
  final num totalPurchases;

  factory Client.fromJson(Map<String, dynamic> json) => Client(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        phone: json['phone']?.toString(),
        address: json['address']?.toString(),
        status: json['status']?.toString() ?? 'active',
        totalPurchases: (json['totalPurchases'] as num?) ?? 0,
      );

  factory Client.fromIsar(dynamic isar) => Client(
        id: isar.uuid,
        name: isar.name,
        phone: isar.phone,
        address: isar.address,
        status: isar.status ?? 'active',
        totalPurchases: (isar.totalPurchases ?? 0).toDouble(),
      );

  Map<String, dynamic> toJson() => {
        if (id.isNotEmpty) 'id': id,
        'name': name,
        if (phone != null) 'phone': phone,
        if (address != null) 'address': address,
        if (status.isNotEmpty) 'status': status,
      };

  Client copyWith({
    String? id,
    String? name,
    String? phone,
    String? address,
    String? status,
    num? totalPurchases,
  }) {
    return Client(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      status: status ?? this.status,
      totalPurchases: totalPurchases ?? this.totalPurchases,
    );
  }
}
