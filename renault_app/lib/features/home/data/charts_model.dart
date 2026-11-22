class SalesByDate {
  SalesByDate({required this.date, required this.total, required this.count});

  final String date;
  final num total;
  final int count;

  factory SalesByDate.fromJson(Map<String, dynamic> json) => SalesByDate(
        date: json['date']?.toString() ?? '',
        total: (json['total'] as num?) ?? 0,
        count: (json['count'] as int?) ?? 0,
      );
}

class TopProduct {
  TopProduct({required this.name, required this.quantity, required this.total});

  final String name;
  final int quantity;
  final num total;

  factory TopProduct.fromJson(Map<String, dynamic> json) => TopProduct(
        name: json['name']?.toString() ?? '',
        quantity: (json['quantity'] as int?) ?? 0,
        total: (json['total'] as num?) ?? 0,
      );
}

class PaymentMethodStat {
  PaymentMethodStat({required this.method, required this.count});

  final String method;
  final int count;

  factory PaymentMethodStat.fromJson(Map<String, dynamic> json) => PaymentMethodStat(
        method: json['method']?.toString() ?? '',
        count: (json['count'] as int?) ?? 0,
      );
}

class ChartsData {
  ChartsData({
    required this.salesByDay,
    required this.topProducts,
    required this.paymentMethods,
  });

  final List<SalesByDate> salesByDay;
  final List<TopProduct> topProducts;
  final List<PaymentMethodStat> paymentMethods;

  factory ChartsData.fromJson(Map<String, dynamic> json) => ChartsData(
        salesByDay: (json['salesByDay'] as List<dynamic>?)
                ?.map((e) => SalesByDate.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [],
        topProducts: (json['topProducts'] as List<dynamic>?)
                ?.map((e) => TopProduct.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [],
        paymentMethods: (json['paymentMethods'] as List<dynamic>?)
                ?.map((e) => PaymentMethodStat.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [],
      );
}
