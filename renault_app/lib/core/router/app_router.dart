import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/categories/presentation/screens/categories_screen.dart';
import '../../features/clients/presentation/screens/clients_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/products/presentation/screens/products_screen.dart';
import '../../features/sales/presentation/screens/sales_screen.dart';
import '../../features/sales/presentation/screens/sale_detail_screen.dart';
import '../../features/suppliers/presentation/screens/suppliers_screen.dart';
import '../../features/purchases/presentation/screens/purchases_screen.dart';
import '../../features/quotations/presentation/screens/quotations_screen.dart';
import '../../features/credits/presentation/screens/credits_screen.dart';
import '../../features/cash/presentation/screens/cash_screen.dart';
import '../../features/expenses/presentation/screens/expenses_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/settings/presentation/screens/settings_screen.dart';
import '../../features/reports/presentation/screens/reports_screen.dart';
import '../../features/notifications/presentation/screens/notifications_screen.dart';
import '../../features/notifications/presentation/providers/notifications_provider.dart';
import '../../features/supplier-requests/presentation/screens/supplier_requests_screen.dart';
import '../../features/inventory/presentation/screens/inventory_screen.dart';
import '../../features/backup/presentation/screens/backup_screen.dart';
import '../../features/users/presentation/screens/users_screen.dart';
import '../../features/users/presentation/screens/user_form_screen.dart';
import '../../features/roles/presentation/screens/roles_screen.dart';
import '../../features/permissions/presentation/screens/permissions_screen.dart';
import '../../features/export/presentation/screens/export_screen.dart';
import '../widgets/sync_button.dart';
import '../widgets/sync_indicator.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    redirect: (context, state) {
      final isLogin = state.matchedLocation == '/login';
      if (auth.isLoading) return null;
      if (!auth.isAuthenticated && !isLogin) return '/login';
      if (auth.isAuthenticated && isLogin) return '/';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => _HomeShell(child: child),
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/products',
            builder: (context, state) => const ProductsScreen(),
          ),
          GoRoute(
            path: '/clients',
            builder: (context, state) => const ClientsScreen(),
          ),
          GoRoute(
            path: '/sales',
            builder: (context, state) => const SalesScreen(),
          ),
          GoRoute(
            path: '/sales/:id',
            builder: (context, state) => SaleDetailScreen(
              saleId: state.pathParameters['id']!,
            ),
          ),
          GoRoute(
            path: '/suppliers',
            builder: (context, state) => const SuppliersScreen(),
          ),
          GoRoute(
            path: '/categories',
            builder: (context, state) => const CategoriesScreen(),
          ),
          GoRoute(
            path: '/purchases',
            builder: (context, state) => const PurchasesScreen(),
          ),
          GoRoute(
            path: '/quotations',
            builder: (context, state) => const QuotationsScreen(),
          ),
          GoRoute(
            path: '/credits',
            builder: (context, state) => const CreditsScreen(),
          ),
          GoRoute(
            path: '/cash',
            builder: (context, state) => const CashScreen(),
          ),
          GoRoute(
            path: '/expenses',
            builder: (context, state) => const ExpensesScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/settings',
            builder: (context, state) => const SettingsScreen(),
          ),
          GoRoute(
            path: '/reports',
            builder: (context, state) => const ReportsScreen(),
          ),
          GoRoute(
            path: '/notifications',
            builder: (context, state) => const NotificationsScreen(),
          ),
          GoRoute(
            path: '/supplier-requests',
            builder: (context, state) => const SupplierRequestsScreen(),
          ),
          GoRoute(
            path: '/inventory',
            builder: (context, state) => const InventoryScreen(),
          ),
          GoRoute(
            path: '/backup',
            builder: (context, state) => const BackupScreen(),
          ),
          GoRoute(
            path: '/users',
            builder: (context, state) => const UsersScreen(),
          ),
          GoRoute(
            path: '/users/new',
            builder: (context, state) => const UserFormScreen(),
          ),
          GoRoute(
            path: '/users/:id/edit',
            builder: (context, state) => const UserFormScreen(),
          ),
          GoRoute(
            path: '/roles',
            builder: (context, state) => const RolesScreen(),
          ),
          GoRoute(
            path: '/permissions',
            builder: (context, state) => const PermissionsScreen(),
          ),
          GoRoute(
            path: '/export',
            builder: (context, state) => const ExportScreen(),
          ),
        ],
      ),
    ],
  );
});

class _HomeShell extends ConsumerStatefulWidget {
  const _HomeShell({required this.child});

  final Widget child;

  @override
  ConsumerState<_HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<_HomeShell> {
  int _currentIndex = 0;

  final _routes = ['/', '/products', '/clients', '/sales'];

  void _onItemTapped(int index) {
    setState(() => _currentIndex = index);
    context.go(_routes[index]);
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final index = _routes.indexOf(location);
    if (index >= 0) _currentIndex = index;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Renault Reluz'),
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () {
            Scaffold.of(context).openDrawer();
          },
        ),
        actions: [
          Consumer(
            builder: (context, ref, _) {
              final unreadAsync = ref.watch(unreadCountProvider(null));
              final count = unreadAsync.valueOrNull ?? 0;
              return IconButton(
                icon: count > 0
                    ? Badge(label: Text('$count'), child: const Icon(Icons.notifications))
                    : const Icon(Icons.notifications),
                onPressed: () => context.push('/notifications'),
                tooltip: 'Notificaciones',
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authProvider.notifier).logout(),
          ),
        ],
      ),
      body: widget.child,
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
              const DrawerHeader(
                decoration: BoxDecoration(color: Colors.blue),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Icon(Icons.store, size: 48, color: Colors.white),
                    SizedBox(height: 8),
                    Text(
                      'Renault Reluz',
                      style: TextStyle(color: Colors.white, fontSize: 20),
                    ),
                    Text(
                      'Gestión de Repuestos',
                      style: TextStyle(color: Colors.white70),
                    ),
                  ],
                ),
              ),
              _DrawerSection(title: 'Operaciones', items: [
                _DrawerItem(icon: Icons.point_of_sale, label: 'Ventas', route: '/sales'),
                _DrawerItem(icon: Icons.shopping_cart, label: 'Compras', route: '/purchases'),
                _DrawerItem(icon: Icons.description, label: 'Cotizaciones', route: '/quotations'),
                _DrawerItem(icon: Icons.send, label: 'Solicitudes', route: '/supplier-requests'),
              ]),
              _DrawerSection(title: 'Finanzas', items: [
                _DrawerItem(icon: Icons.account_balance_wallet, label: 'Caja', route: '/cash'),
                _DrawerItem(icon: Icons.receipt_long, label: 'Gastos', route: '/expenses'),
                _DrawerItem(icon: Icons.credit_card, label: 'Créditos', route: '/credits'),
              ]),
              _DrawerSection(title: 'Catálogo', items: [
                _DrawerItem(icon: Icons.inventory_2, label: 'Productos', route: '/products'),
                _DrawerItem(icon: Icons.warehouse, label: 'Inventario', route: '/inventory'),
                _DrawerItem(icon: Icons.category, label: 'Categorías', route: '/categories'),
                _DrawerItem(icon: Icons.business, label: 'Proveedores', route: '/suppliers'),
              ]),
              _DrawerSection(title: 'Contactos', items: [
                _DrawerItem(icon: Icons.groups, label: 'Clientes', route: '/clients'),
                _DrawerItem(icon: Icons.business, label: 'Proveedores', route: '/suppliers'),
              ]),
              _DrawerSection(title: 'Reportes', items: [
                _DrawerItem(icon: Icons.dashboard, label: 'Dashboard', route: '/'),
                _DrawerItem(icon: Icons.bar_chart, label: 'Reportes', route: '/reports'),
                _DrawerItem(icon: Icons.notifications, label: 'Notificaciones', route: '/notifications'),
                _DrawerItem(icon: Icons.file_download, label: 'Exportar datos', route: '/export'),
              ]),
              _DrawerSection(title: 'Cuenta', items: [
                _DrawerItem(icon: Icons.person, label: 'Perfil', route: '/profile'),
                _DrawerItem(icon: Icons.settings, label: 'Configuración', route: '/settings'),
                _DrawerItem(icon: Icons.backup, label: 'Backup', route: '/backup'),
              ]),
              _DrawerSection(title: 'Administración', items: [
                _DrawerItem(icon: Icons.people, label: 'Usuarios', route: '/users'),
                _DrawerItem(icon: Icons.admin_panel_settings, label: 'Roles', route: '/roles'),
                _DrawerItem(icon: Icons.lock_outline, label: 'Permisos', route: '/permissions'),
              ]),
              const Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  children: [
                    SyncButton(),
                    SizedBox(height: 8),
                    SyncIndicator(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: _onItemTapped,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Inicio'),
          NavigationDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: 'Productos'),
          NavigationDestination(icon: Icon(Icons.groups_outlined), selectedIcon: Icon(Icons.groups), label: 'Clientes'),
          NavigationDestination(icon: Icon(Icons.point_of_sale_outlined), selectedIcon: Icon(Icons.point_of_sale), label: 'Ventas'),
        ],
      ),
    );
  }
}

class _DrawerSection extends StatelessWidget {
  const _DrawerSection({required this.title, required this.items});

  final String title;
  final List<_DrawerItem> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              title,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: Colors.grey,
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ),
        ),
        ...items.map((item) => _buildItem(context, item)),
      ],
    );
  }

  Widget _buildItem(BuildContext context, _DrawerItem item) {
    return ListTile(
      leading: Icon(item.icon),
      title: Text(item.label),
      onTap: () => _navigateToItem(context, item.route),
    );
  }

  void _navigateToItem(BuildContext context, String route) {
    Navigator.of(context).pop();
    context.go(route);
  }
}

class _DrawerItem {
  const _DrawerItem({required this.icon, required this.label, required this.route});

  final IconData icon;
  final String label;
  final String route;
}
