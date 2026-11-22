import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/sales_provider.dart';

class SalesHistoryScreen extends ConsumerStatefulWidget {
  const SalesHistoryScreen({super.key});

  @override
  ConsumerState<SalesHistoryScreen> createState() => _SalesHistoryScreenState();
}

class _SalesHistoryScreenState extends ConsumerState<SalesHistoryScreen> {
  final _searchCtrl = TextEditingController();
  String _statusFilter = 'all';
  String? _startDate;
  String? _endDate;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _updateFilters() {
    final filters = SalesHistoryFilters(
      startDate: _startDate,
      endDate: _endDate,
      status: _statusFilter == 'all' ? null : _statusFilter,
      search: _searchCtrl.text.trim().isEmpty ? null : _searchCtrl.text.trim(),
    );
    ref.read(salesHistoryFiltersProvider.notifier).state = filters;
  }

  Future<void> _pickDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      initialDateRange: _startDate != null && _endDate != null
          ? DateTimeRange(
              start: DateTime.parse(_startDate!),
              end: DateTime.parse(_endDate!),
            )
          : null,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (picked != null) {
      setState(() {
        _startDate = picked.start.toIso8601String().split('T')[0];
        _endDate = picked.end.toIso8601String().split('T')[0];
      });
      _updateFilters();
    }
  }

  void _onApplyFilters() {
    setState(() {});
    _updateFilters();
  }

  void _onClearFilters() {
    setState(() {
      _searchCtrl.clear();
      _statusFilter = 'all';
      _startDate = null;
      _endDate = null;
    });
    _updateFilters();
  }

  void _navigateToDetail(String id) {
    Navigator.pushNamed(context, '/sales/$id');
  }

  @override
  Widget build(BuildContext context) {
    final filters = ref.watch(salesHistoryFiltersProvider);
    final salesAsync = ref.watch(salesHistoryProvider(filters));

    return Column(
      children: [
        // Filtros
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchCtrl,
                  decoration: InputDecoration(
                    hintText: 'Buscar por cliente',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    border: const OutlineInputBorder(),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  onSubmitted: (_) => _onApplyFilters(),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.calendar_today),
                onPressed: _pickDateRange,
                tooltip: 'Filtrar por fecha',
              ),
              PopupMenuButton<String>(
                icon: const Icon(Icons.filter_list),
                onSelected: (value) {
                  setState(() => _statusFilter = value);
                  _updateFilters();
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(value: 'all', child: Text('Todas')),
                  const PopupMenuItem(value: 'completada', child: Text('Completadas')),
                  const PopupMenuItem(value: 'cancelada', child: Text('Canceladas')),
                ],
              ),
              if (_startDate != null || _statusFilter != 'all' || _searchCtrl.text.isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: _onClearFilters,
                  tooltip: 'Limpiar filtros',
                ),
            ],
          ),
        ),

        // Fecha seleccionada
        if (_startDate != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Chip(
              label: Text('📅 $_startDate → $_endDate'),
              onDeleted: () {
                setState(() {
                  _startDate = null;
                  _endDate = null;
                });
                _updateFilters();
              },
            ),
          ),

        // Lista de ventas
        Expanded(
          child: salesAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Error: $e')),
            data: (sales) {
              if (sales.isEmpty) {
                return const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.receipt_long, size: 48, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('No hay ventas'),
                    ],
                  ),
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: sales.length,
                itemBuilder: (context, i) {
                  final sale = sales[i];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      onTap: () => _navigateToDetail(sale.id),
                      leading: CircleAvatar(
                        backgroundColor: sale.isCanceled
                            ? Colors.red.withValues(alpha: 0.1)
                            : Theme.of(context).colorScheme.primaryContainer,
                        child: Icon(
                          sale.isCanceled ? Icons.close : Icons.check,
                          color: sale.isCanceled ? Colors.red : null,
                          size: 20,
                        ),
                      ),
                      title: Text(sale.clientName, maxLines: 1),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${sale.date.split('T')[0]} • ${sale.items.length} items',
                          ),
                          Text(
                            sale.paymentMethodLabel,
                            style: const TextStyle(fontSize: 12),
                          ),
                        ],
                      ),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '\$${sale.total.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          if (sale.isCanceled)
                            const Text(
                              'Cancelada',
                              style: TextStyle(
                                color: Colors.red,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
