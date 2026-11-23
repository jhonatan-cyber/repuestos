import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/animations/app_animations.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';

class RenaultApp extends ConsumerWidget {
  const RenaultApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final themeMode = ref.watch(themeNotifierProvider);
    return MaterialApp.router(
      title: 'Renault ERP',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light.copyWith(
        pageTransitionsTheme: const PageTransitionsTheme(
          builders: {
            TargetPlatform.android: FadePageTransition(),
            TargetPlatform.iOS: FadePageTransition(),
          },
        ),
      ),
      darkTheme: AppTheme.dark.copyWith(
        pageTransitionsTheme: const PageTransitionsTheme(
          builders: {
            TargetPlatform.android: FadePageTransition(),
            TargetPlatform.iOS: FadePageTransition(),
          },
        ),
      ),
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
