class PermissionModel {
  PermissionModel({
    required this.id,
    required this.name,
    this.description = '',
    this.isSystem = false,
    this.status = 'active',
  });

  final String id;
  final String name;
  final String description;
  final bool isSystem;
  final String status;

  bool get isActive => status == 'active';

  factory PermissionModel.fromJson(Map<String, dynamic> json) => PermissionModel(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        description: json['description']?.toString() ?? '',
        isSystem: json['isSystem'] as bool? ?? false,
        status: json['status']?.toString() ?? 'active',
      );

  Map<String, dynamic> toJson() => {
        if (id.isNotEmpty) 'id': id,
        'name': name,
        if (description.isNotEmpty) 'description': description,
        'isSystem': isSystem,
        'status': status,
      };
}
