import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/providers.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../data/charts_model.dart';
import '../../data/dashboard_model.dart';
import '../../data/dashboard_repository.dart';

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  return DashboardRepository(ref.watch(dioClientProvider));
});

final dashboardStatsProvider = FutureProvider<DashboardStats>((ref) async {
  return ref.watch(dashboardRepositoryProvider).getStats();
});

final chartPeriodProvider = StateProvider<String>((ref) => '7days');

final chartsProvider = FutureProvider.autoDispose.family<ChartsData, String>((ref, period) async {
  return ref.watch(dashboardRepositoryProvider).getCharts(period);
});

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final statsAsync = ref.watch(dashboardStatsProvider);
    final period = ref.watch(chartPeriodProvider);
    final chartsAsync = ref.watch(chartsProvider(period));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inicio'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Saludo
            Text(
              'Hola, ${auth.user?.name ?? ''}',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 4),
            Text(
              'Rol: ${auth.user?.role ?? ''}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),

            // Stats del dashboard
            statsAsync.when(
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (e, _) => _ErrorCard(message: e.toString()),
              data: (stats) => _StatsGrid(stats: stats),
            ),

            const SizedBox(height: 24),

            // Gráficos
            Text(
              'Gráficos',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            _PeriodSelector(period: period),
            const SizedBox(height: 12),
            chartsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => const Text('Error al cargar gráficos'),
              data: (charts) => _ChartsSection(charts: charts),
            ),

            const SizedBox(height: 24),

            // Accesos rápidos
            Text(
              'Accesos rápidos',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            const _QuickActionsGrid(),
          ],
        ),
      ),
    );
  }
}

class _PeriodSelector extends ConsumerWidget {
  const _PeriodSelector({required this.period});

  final String period;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final options = ['7days', '30days', '90days'];
    final labels = {'7days': '7 días', '30days': '30 días', '90days': '90 días'};
    return Row(
      children: options.map((opt) {
        final isSelected = period == opt;
        return Padding(
          padding: const EdgeInsets.only(right: 8),
          child: FilterChip(
            label: Text(labels[opt] ?? opt),
            selected: isSelected,
            onSelected: (selected) {
              if (selected) {
                ref.read(chartPeriodProvider.notifier).state = opt;
              }
            },
          ),
        );
      }).toList(),
    );
  }
}

class _ChartsSection extends StatelessWidget {
  const _ChartsSection({required this.charts});

  final ChartsData charts;

  @override
  Widget build(BuildContext context) {
    if (charts.salesByDay.isEmpty && charts.topProducts.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Text(
              'No hay datos de ventas para el período seleccionado',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ),
      );
    }

    return Column(
      children: [
        if (charts.salesByDay.isNotEmpty) ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Ventas diarias',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 200,
                    child: _LineChart(data: charts.salesByDay),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
        if (charts.topProducts.isNotEmpty) ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Productos más vendidos (top 5)',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 200,
                    child: _BarChart(data: charts.topProducts.take(5).toList()),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
        if (charts.paymentMethods.isNotEmpty) ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Métodos de pago',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 200,
                    child: _PieChart(data: charts.paymentMethods),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _LineChart extends StatelessWidget {
  const _LineChart({required this.data});

  final List<SalesByDate> data;

  @override
  Widget build(BuildContext context) {
    final spots = data.asMap().entries.map((e) {
      return FlSpot(e.key.toDouble(), e.value.total.toDouble());
    }).toList();

    return LineChart(
      LineChartData(
        gridData: const FlGridData(show: true),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) {
                return Text(
                  value.toInt() >= 1000
                      ? '${(value.toInt() / 1000).toStringAsFixed(0)}k'
                      : value.toInt().toString(),
                  style: const TextStyle(fontSize: 10),
                );
              },
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: data.length <= 14,
              reservedSize: 30,
              getTitlesWidget: (value, meta) {
                if (value.toInt() >= 0 && value.toInt() < data.length) {
                  final date = data[value.toInt()].date.split('-');
                  return Text(
                    date.length > 1 ? date[2] : '',
                    style: const TextStyle(fontSize: 10),
                  );
                }
                return const Text('');
              },
            ),
          ),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: true),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            curveSmoothness: 0.2,
            color: Colors.blue,
            barWidth: 2,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              color: Colors.blue.withValues(alpha: 0.1),
            ),
          ),
        ],
        minY: 0,
      ),
    );
  }
}

class _BarChart extends StatelessWidget {
  const _BarChart({required this.data});

  final List<TopProduct> data;

  @override
  Widget build(BuildContext context) {
    final maxTotal = data.isEmpty ? 1 : data.map((e) => e.total.toDouble()).reduce((a, b) => a > b ? a : b);

    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        gridData: const FlGridData(show: true),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) {
                return Text(
                  value.toInt() >= 1000
                      ? '${(value.toInt() / 1000).toStringAsFixed(0)}k'
                      : value.toInt().toString(),
                  style: const TextStyle(fontSize: 10),
                );
              },
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 30,
              getTitlesWidget: (value, meta) {
                if (value.toInt() >= 0 && value.toInt() < data.length) {
                  final name = data[value.toInt()].name;
                  return RotatedBox(
                    quarterTurns: -1,
                    child: Text(
                      name.length > 10 ? '${name.substring(0, 10)}…' : name,
                      style: const TextStyle(fontSize: 10),
                    ),
                  );
                }
                return const Text('');
              },
            ),
          ),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: true),
        barGroups: data.asMap().entries.map((entry) {
          return BarChartGroupData(
            x: entry.key,
            barRods: [
              BarChartRodData(
                toY: entry.value.total.toDouble(),
                color: Colors.blue,
                width: 16,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
              ),
            ],
          );
        }).toList(),
        maxY: maxTotal * 1.2,
        minY: 0,
      ),
    );
  }
}

class _PieChart extends StatelessWidget {
  const _PieChart({required this.data});

  final List<PaymentMethodStat> data;

  @override
  Widget build(BuildContext context) {
    final total = data.fold<int>(0, (sum, e) => sum + e.count);
    final colors = [Colors.blue, Colors.green, Colors.orange, Colors.purple, Colors.red];

    return Row(
      children: [
        Expanded(
          flex: 2,
          child: PieChart(
            PieChartData(
              sections: data.asMap().entries.map((entry) {
                final index = entry.key;
                final item = entry.value;
                final percentage = total > 0 ? (item.count / total) * 100 : 0;
                return PieChartSectionData(
                  value: item.count.toDouble(),
                  title: '${percentage.toStringAsFixed(0)}%',
                  color: colors[index % colors.length],
                  radius: 60,
                );
              }).toList(),
              sectionsSpace: 2,
              centerSpaceRadius: 40,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 1,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: data.asMap().entries.map((entry) {
              final methodNames = {
                'cash': 'Efectivo',
                'card': 'Tarjeta',
                'transfer': 'Transferencia',
                'credit': 'Crédito',
              };
              final name = methodNames[entry.value.method] ?? entry.value.method;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: colors[entry.key % colors.length],
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      name,
                      style: const TextStyle(fontSize: 12),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.stats});

  final DashboardStats stats;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.3,
      children: [
        _StatCard(
          icon: Icons.point_of_sale,
          label: 'Ventas hoy',
          value: '${stats.salesToday}',
          color: Colors.green,
        ),
        _StatCard(
          icon: Icons.attach_money,
          label: 'Ingresos',
          value: '\$${stats.totalSalesToday.toStringAsFixed(0)}',
          color: Colors.blue,
        ),
        _StatCard(
          icon: Icons.warning_amber,
          label: 'Stock bajo',
          value: '${stats.lowStockCount}',
          color: Colors.orange,
        ),
        _StatCard(
          icon: Icons.account_balance_wallet,
          label: 'Créditos',
          value: '${stats.pendingCredits}',
          color: Colors.purple,
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.red.withValues(alpha: 0.08),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 32),
            const SizedBox(height: 8),
            Text(
              'No se pudieron cargar las estadísticas',
              style: Theme.of(context).textTheme.titleSmall,
            ),
            const SizedBox(height: 4),
            Text(
              message,
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionsGrid extends StatelessWidget {
  const _QuickActionsGrid();

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _QuickActionCard(
          icon: Icons.add_shopping_cart,
          label: 'Nueva venta',
          color: Colors.green,
          route: '/sales',
        ),
        _QuickActionCard(
          icon: Icons.shopping_cart,
          label: 'Compras',
          color: Colors.teal,
          route: '/purchases',
        ),
        _QuickActionCard(
          icon: Icons.description,
          label: 'Cotizaciones',
          color: Colors.amber,
          route: '/quotations',
        ),
        _QuickActionCard(
          icon: Icons.account_balance_wallet,
          label: 'Caja',
          color: Colors.blue,
          route: '/cash',
        ),
        _QuickActionCard(
          icon: Icons.business,
          label: 'Proveedores',
          color: Colors.indigo,
          route: '/suppliers',
        ),
        _QuickActionCard(
          icon: Icons.category,
          label: 'Categorías',
          color: Colors.pink,
          route: '/categories',
        ),
        _QuickActionCard(
          icon: Icons.credit_card,
          label: 'Créditos',
          color: Colors.purple,
          route: '/credits',
        ),
        _QuickActionCard(
          icon: Icons.receipt_long,
          label: 'Gastos',
          color: Colors.red,
          route: '/expenses',
        ),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.color,
    required this.route,
  });

  final IconData icon;
  final String label;
  final Color color;
  final String route;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: () => context.go(route),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: color, size: 32),
              const SizedBox(height: 8),
              Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
