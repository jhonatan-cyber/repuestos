import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/reports_provider.dart';
import 'comparison_report_screen.dart';

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reportes'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Resumen'),
            Tab(text: 'Comparativo'),
          ],
          onTap: (i) {},
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _SummaryTab(),
          const ComparisonReportScreen(),
        ],
      ),
    );
  }
}

class _SummaryTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(reportsProvider);
    return async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (report) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Resumen de ventas',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _StatRow(
                        label: 'Hoy',
                        value: report.salesToday != null
                            ? '\$${report.salesToday!.toStringAsFixed(0)}'
                            : 'N/A',
                        color: Colors.green,
                      ),
                      const Divider(),
                      _StatRow(
                        label: 'Esta semana',
                        value: report.salesThisWeek != null
                            ? '\$${report.salesThisWeek!.toStringAsFixed(0)}'
                            : 'N/A',
                        color: Colors.blue,
                      ),
                      const Divider(),
                      _StatRow(
                        label: 'Este mes',
                        value: report.salesThisMonth != null
                            ? '\$${report.salesThisMonth!.toStringAsFixed(0)}'
                            : 'N/A',
                        color: Colors.purple,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              if (report.topProducts != null && report.topProducts!.isNotEmpty) ...[
                Text(
                  'Productos más vendidos',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: report.topProducts!.take(5).toList().asMap().entries.map((entry) {
                        final index = entry.key + 1;
                        final product = entry.value;
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 16,
                                backgroundColor: Colors.blue,
                                child: Text(
                                  '$index',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  product['name']?.toString() ?? 'Producto',
                                ),
                              ),
                              Text(
                                '${product['quantity'] ?? 0} uds',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
              if (report.paymentMethods != null && report.paymentMethods!.isNotEmpty) ...[
                Text(
                  'Métodos de pago',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: report.paymentMethods!.map((method) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  method['method']?.toString() ?? 'N/A',
                                ),
                              ),
                              Text(
                                '${method['count'] ?? 0}',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ],
            ],
          );
        },
      );
  }
}

class _StatRow extends StatelessWidget {
  const _StatRow({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyLarge),
          Text(
            value,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
          ),
        ],
      ),
    );
  }
}
