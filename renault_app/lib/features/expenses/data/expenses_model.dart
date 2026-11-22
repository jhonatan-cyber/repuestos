class Expense {
  Expense({
    required this.id,
    required this.category,
    required this.description,
    required this.amount,
    this.date,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String category;
  final String description;
  final num amount;
  final String? date;
  final String? notes;
  final String? createdAt;

  Expense copyWith({
    String? category,
    String? description,
    num? amount,
    String? date,
    String? notes,
  }) =>
      Expense(
        id: id,
        category: category ?? this.category,
        description: description ?? this.description,
        amount: amount ?? this.amount,
        date: date ?? this.date,
        notes: notes ?? this.notes,
        createdAt: createdAt,
      );

  Map<String, dynamic> toJson() => {
        'category': category,
        'description': description,
        'amount': amount,
        if (date != null) 'date': date,
        if (notes != null) 'notes': notes,
      };

  factory Expense.fromJson(Map<String, dynamic> json) => Expense(
        id: json['id']?.toString() ?? '',
        category: json['category']?.toString() ?? '',
        description: json['description']?.toString() ?? '',
        amount: (json['amount'] as num?) ?? 0,
        date: json['date']?.toString(),
        notes: json['notes']?.toString(),
        createdAt: json['createdAt']?.toString(),
      );

  factory Expense.fromIsar(dynamic isar) => Expense(
        id: isar.uuid,
        category: isar.category,
        description: isar.description ?? '',
        amount: isar.amount.toDouble(),
        date: isar.date,
        notes: isar.notes,
      );
}

class ExpenseRequest {
  ExpenseRequest({
    required this.category,
    required this.description,
    required this.amount,
    this.notes,
  });

  final String category;
  final String description;
  final num amount;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'category': category,
        'description': description,
        'amount': amount,
        if (notes != null) 'notes': notes,
      };
}
