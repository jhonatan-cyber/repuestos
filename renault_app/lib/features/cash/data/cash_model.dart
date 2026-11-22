class CashWithdrawal {
  CashWithdrawal({
    required this.id,
    required this.amount,
    required this.reason,
    required this.createdAt,
    required this.userName,
  });

  final String id;
  final num amount;
  final String reason;
  final String createdAt;
  final String userName;

  factory CashWithdrawal.fromJson(Map<String, dynamic> json) => CashWithdrawal(
        id: json['id']?.toString() ?? '',
        amount: (json['amount'] as num?) ?? 0,
        reason: json['reason']?.toString() ?? '',
        createdAt: json['createdAt']?.toString() ?? '',
        userName: json['userName']?.toString() ?? '',
      );
}

class CashRecord {
  CashRecord({
    required this.id,
    required this.date,
    required this.openingBalance,
    required this.cashIncome,
    required this.cashExpenses,
    required this.closingBalance,
    required this.status,
    required this.userName,
    required this.closedAt,
    required this.withdrawals,
    this.notes,
  });

  final String id;
  final String date;
  final num openingBalance;
  final num cashIncome;
  final num cashExpenses;
  final num closingBalance;
  final String status;
  final String userName;
  final String? closedAt;
  final List<CashWithdrawal> withdrawals;
  final String? notes;

  bool get isOpen => status == 'open';
  bool get isClosed => status == 'closed';

  num get totalIncome => cashIncome;
  num get totalExpenses => cashExpenses;

  String get statusLabel {
    switch (status) {
      case 'open':
        return 'Abierto';
      case 'closed':
        return 'Cerrado';
      default:
        return status;
    }
  }

  factory CashRecord.fromJson(Map<String, dynamic> json) => CashRecord(
        id: json['id']?.toString() ?? '',
        date: json['date']?.toString() ?? '',
        openingBalance: (json['openingBalance'] as num?) ?? 0,
        cashIncome: (json['cashIncome'] as num?) ?? 0,
        cashExpenses: (json['cashExpenses'] as num?) ?? 0,
        closingBalance: (json['closingBalance'] as num?) ?? 0,
        status: json['status']?.toString() ?? 'closed',
        userName: json['userName']?.toString() ?? '',
        closedAt: json['closedAt']?.toString(),
        withdrawals: (json['withdrawals'] as List<dynamic>?)
                ?.map((e) => CashWithdrawal.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [],
        notes: json['notes']?.toString(),
      );

  factory CashRecord.fromIsar(dynamic isar) => CashRecord(
        id: isar.uuid,
        date: isar.date,
        openingBalance: isar.openingBalance.toDouble(),
        cashIncome: (isar.cashIncome ?? 0).toDouble(),
        cashExpenses: (isar.cashExpenses ?? 0).toDouble(),
        closingBalance: (isar.closingBalance ?? 0).toDouble(),
        status: isar.status,
        userName: isar.userName ?? '',
        closedAt: isar.closedAt,
        withdrawals: [],
        notes: isar.notes,
      );
}

class CashSummary {
  CashSummary({
    required this.isOpen,
    required this.openingBalance,
    required this.totalIncome,
    required this.totalExpenses,
    required this.currentBalance,
    required this.withdrawals,
  });

  final bool isOpen;
  final num openingBalance;
  final num totalIncome;
  final num totalExpenses;
  final num currentBalance;
  final num withdrawals;

  factory CashSummary.fromJson(Map<String, dynamic> json) => CashSummary(
        isOpen: json['isOpen'] as bool? ?? false,
        openingBalance: (json['openingBalance'] as num?) ?? 0,
        totalIncome: (json['totalIncome'] as num?) ?? 0,
        totalExpenses: (json['totalExpenses'] as num?) ?? 0,
        currentBalance: (json['currentBalance'] as num?) ?? 0,
        withdrawals: (json['withdrawals'] as num?) ?? 0,
      );

  factory CashSummary.empty() => CashSummary(
        isOpen: false,
        openingBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        currentBalance: 0,
        withdrawals: 0,
      );
}
