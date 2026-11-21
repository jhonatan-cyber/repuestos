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
}
