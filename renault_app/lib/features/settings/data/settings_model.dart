class CompanySettings {
  CompanySettings({
    this.name,
    this.address,
    this.phone,
    this.taxId,
  });

  final String? name;
  final String? address;
  final String? phone;
  final String? taxId;

  factory CompanySettings.fromJson(Map<String, dynamic> json) => CompanySettings(
        name: json['name']?.toString(),
        address: json['address']?.toString(),
        phone: json['phone']?.toString(),
        taxId: json['taxId']?.toString(),
      );
}
