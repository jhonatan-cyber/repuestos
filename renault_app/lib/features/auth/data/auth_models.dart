class AuthUser {
  AuthUser({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.permissions,
    this.image,
  });

  final String id;
  final String email;
  final String name;
  final String role;
  final List<String> permissions;
  final String? image;

  bool hasPermission(String p) =>
      permissions.contains('*') || permissions.contains(p);

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['id']?.toString() ?? '',
        email: json['email']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        role: json['role']?.toString() ?? '',
        permissions: (json['permissions'] as List<dynamic>? ?? [])
            .map((e) => e.toString())
            .toList(),
        image: json['image']?.toString(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'name': name,
        'role': role,
        'permissions': permissions,
        'image': image,
      };
}
