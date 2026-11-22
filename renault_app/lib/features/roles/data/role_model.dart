class RoleModel {
  RoleModel({
    required this.id,
    required this.name,
    this.description = '',
    this.permissions = const <String>[],
  });

  final String id;
  final String name;
  final String description;
  final List<String> permissions;

  factory RoleModel.fromJson(Map<String, dynamic> json) => RoleModel(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        description: json['description']?.toString() ?? '',
        permissions: (json['permissions'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
      );

  Map<String, dynamic> toJson() => {
        if (id.isNotEmpty) 'id': id,
        'name': name,
        if (description.isNotEmpty) 'description': description,
        'permissions': permissions,
      };
}
