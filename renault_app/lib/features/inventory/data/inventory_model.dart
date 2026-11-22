class InventoryStats {
  InventoryStats({
    required this.totalProducts,
    required this.lowStockCount,
    required this.inventoryCost,
    required this.inventoryValue,
  });

  final int totalProducts;
  final int lowStockCount;
  final num inventoryCost;
  final num inventoryValue;

  factory InventoryStats.fromProducts(List<Map<String, dynamic>> products) {
    int lowStockCount = 0;
    num inventoryCost = 0;
    num inventoryValue = 0;

    for (final p in products) {
      final stock = (p['stock'] as num?) ?? 0;
      final minStock = (p['minimumStock'] as num?) ?? 0;
      final purchasePrice = (p['purchasePrice'] as num?) ?? 0;
      final salePrice = (p['salePrice'] as num?) ?? 0;

      if (stock <= minStock) {
        lowStockCount++;
      }
      inventoryCost += purchasePrice * stock;
      inventoryValue += salePrice * stock;
    }

    return InventoryStats(
      totalProducts: products.length,
      lowStockCount: lowStockCount,
      inventoryCost: inventoryCost,
      inventoryValue: inventoryValue,
    );
  }
}
