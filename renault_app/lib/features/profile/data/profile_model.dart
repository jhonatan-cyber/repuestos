class ProfileUser {
  ProfileUser({
    required this.id,
    required this.name,
    required this.email,
    this.role = 'user',
    this.phone,
  });

  final String id;
  final String name;
  final String email;
  final String role;
  final String? phone;

  factory ProfileUser.fromJson(Map<String, dynamic> json) => ProfileUser(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        email: json['email']?.toString() ?? '',
        role: json['role']?.toString() ?? 'user',
        phone: json['phone']?.toString(),
      );
}
