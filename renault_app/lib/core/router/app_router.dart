import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/clients/presentation/screens/clients_screen.dart';
import '../../features/products/presentation/screens/products_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);
  return GoRouter(
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
      GoRoute(
        path: '/',
        builder: (context, state) => const _HomeShell(),
      ),
      GoRoute(
        path: '/products',
        builder: (context, state) => const ProductsScreen(),
      ),
      GoRoute(
        path: '/clients',
        builder: (context, state) => const ClientsScreen(),
      ),
    ],
  );
});

class _HomeShell extends ConsumerWidget {
  const _HomeShell();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Renault ERP'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authProvider.notifier).logout(),
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Hola, ${auth.user?.name ?? ''}'),
            const SizedBox(height: 8),
            Text('Rol: ${auth.user?.role ?? ''}'),
            const SizedBox(height: 24),
            Wrap(
              spacing: 12,
              children: [
                ElevatedButton(
                  onPressed: () => context.go('/products'),
                  child: const Text('Productos'),
                ),
                ElevatedButton(
                  onPressed: () => context.go('/clients'),
                  child: const Text('Clientes'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
