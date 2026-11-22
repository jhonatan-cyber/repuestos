class DashboardStats {
  DashboardStats({
    required this.salesToday,
    required this.totalSalesToday,
    required this.lowStockCount,
    required this.pendingCredits,
  });

  final int salesToday;
  final num totalSalesToday;
  final int lowStockCount;
  final int pendingCredits;

  factory DashboardStats.fromJson(Map<String, dynamic> json) => DashboardStats(
        salesToday: (json['salesToday'] as int?) ?? 0,
        totalSalesToday: (json['totalSalesToday'] as num?) ?? 0,
        lowStockCount: (json['lowStockCount'] as int?) ?? 0,
        pendingCredits: (json['pendingCredits'] as int?) ?? 0,
      );
}
