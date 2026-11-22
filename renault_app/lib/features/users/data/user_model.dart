class UserModel {
  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.status = 'active',
  });

  final String id;
  final String name;
  final String email;
  final String role;
  final String status;

  bool get isActive => status == 'active';

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        email: json['email']?.toString() ?? '',
        role: json['role']?.toString() ?? 'user',
        status: json['status']?.toString() ?? 'active',
      );

  Map<String, dynamic> toJson() => {
        if (id.isNotEmpty) 'id': id,
        'name': name,
        'email': email,
        'role': role,
        'status': status,
      };

  UserModel copyWith({
    String? name,
    String? email,
    String? role,
    String? status,
  }) =>
      UserModel(
        id: id,
        name: name ?? this.name,
        email: email ?? this.email,
        role: role ?? this.role,
        status: status ?? this.status,
      );
}
