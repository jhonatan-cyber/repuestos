class Supplier {
  Supplier({
    required this.id,
    required this.name,
    this.contactName,
    this.phone,
    this.email,
    this.address,
    this.balance = 0,
    this.totalPurchases = 0,
    this.status = 'active',
  });

  final String id;
  final String name;
  final String? contactName;
  final String? phone;
  final String? email;
  final String? address;
  final num balance;
  final num totalPurchases;
  final String status;

  bool get isActive => status == 'active';

  factory Supplier.fromJson(Map<String, dynamic> json) => Supplier(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        contactName: json['contactName']?.toString(),
        phone: json['phone']?.toString(),
        email: json['email']?.toString(),
        address: json['address']?.toString(),
        balance: (json['balance'] as num?) ?? 0,
        totalPurchases: (json['totalPurchases'] as num?) ?? 0,
        status: json['status']?.toString() ?? 'active',
      );

  factory Supplier.fromIsar(dynamic isar) => Supplier(
        id: isar.uuid,
        name: isar.name,
        contactName: isar.contactName,
        phone: isar.phone,
        email: isar.email,
        address: isar.address,
        balance: (isar.balance ?? 0).toDouble(),
        totalPurchases: (isar.totalPurchases ?? 0).toDouble(),
      );

  Map<String, dynamic> toJson() => {
        if (id.isNotEmpty) 'id': id,
        'name': name,
        if (contactName != null) 'contactName': contactName,
        if (phone != null) 'phone': phone,
        if (email != null) 'email': email,
        if (address != null) 'address': address,
        if (status.isNotEmpty) 'status': status,
      };

  Supplier copyWith({
    String? id,
    String? name,
    String? contactName,
    String? phone,
    String? email,
    String? address,
    num? balance,
    num? totalPurchases,
    String? status,
  }) {
    return Supplier(
      id: id ?? this.id,
      name: name ?? this.name,
      contactName: contactName ?? this.contactName,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      address: address ?? this.address,
      balance: balance ?? this.balance,
      totalPurchases: totalPurchases ?? this.totalPurchases,
      status: status ?? this.status,
    );
  }
}
