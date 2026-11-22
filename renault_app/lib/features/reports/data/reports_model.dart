class ReportData {
  ReportData({
    this.salesToday,
    this.salesThisWeek,
    this.salesThisMonth,
    this.topProducts,
    this.paymentMethods,
  });

  final num? salesToday;
  final num? salesThisWeek;
  final num? salesThisMonth;
  final List<Map<String, dynamic>>? topProducts;
  final List<Map<String, dynamic>>? paymentMethods;

  factory ReportData.fromJson(Map<String, dynamic> json) => ReportData(
        salesToday: json['salesToday'] as num?,
        salesThisWeek: json['salesThisWeek'] as num?,
        salesThisMonth: json['salesThisMonth'] as num?,
        topProducts: (json['topProducts'] as List<dynamic>?)
            ?.map((e) => Map<String, dynamic>.from(e as Map))
            .toList(),
        paymentMethods: (json['paymentMethods'] as List<dynamic>?)
            ?.map((e) => Map<String, dynamic>.from(e as Map))
            .toList(),
      );
}

class ComparisonPeriod {
  ComparisonPeriod({
    required this.label,
    required this.totalSales,
    required this.totalPurchases,
    required this.totalExpenses,
    required this.netProfit,
  });

  final String label;
  final num totalSales;
  final num totalPurchases;
  final num totalExpenses;
  final num netProfit;

  factory ComparisonPeriod.fromJson(String label, Map<String, dynamic> json) => ComparisonPeriod(
        label: label,
        totalSales: (json['totalSales'] as num?) ?? 0,
        totalPurchases: (json['totalPurchases'] as num?) ?? 0,
        totalExpenses: (json['totalExpenses'] as num?) ?? 0,
        netProfit: (json['netProfit'] as num?) ?? 0,
      );
}

class ComparisonData {
  ComparisonData({
    this.current,
    this.previous,
  });

  final ComparisonPeriod? current;
  final ComparisonPeriod? previous;

  num variation(num current, num previous) {
    if (previous == 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  factory ComparisonData.fromJson(Map<String, dynamic> json) {
    final current = json['current'] as Map<String, dynamic>?;
    final previous = json['previous'] as Map<String, dynamic>?;
    return ComparisonData(
      current: current != null ? ComparisonPeriod.fromJson('Período actual', current) : null,
      previous: previous != null ? ComparisonPeriod.fromJson('Período anterior', previous) : null,
    );
  }
}
