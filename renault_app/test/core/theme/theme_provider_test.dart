import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:renault_app/core/theme/theme_provider.dart';

void main() {
  group('ThemeProvider', () {
    testWidgets('starts with system theme mode', (tester) async {
      final container = ProviderContainer();
      final notifier = container.read(themeNotifierProvider.notifier);
      expect(notifier.state, ThemeMode.system);
      container.dispose();
    });

    testWidgets('sets theme to light', (tester) async {
      final container = ProviderContainer();
      final notifier = container.read(themeNotifierProvider.notifier);
      await notifier.setTheme(ThemeMode.light);
      expect(container.read(themeNotifierProvider), ThemeMode.light);
      container.dispose();
    });

    testWidgets('sets theme to dark', (tester) async {
      final container = ProviderContainer();
      final notifier = container.read(themeNotifierProvider.notifier);
      await notifier.setTheme(ThemeMode.dark);
      expect(container.read(themeNotifierProvider), ThemeMode.dark);
      container.dispose();
    });

    testWidgets('sets theme to system', (tester) async {
      final container = ProviderContainer();
      final notifier = container.read(themeNotifierProvider.notifier);
      await notifier.setTheme(ThemeMode.system);
      expect(container.read(themeNotifierProvider), ThemeMode.system);
      container.dispose();
    });

    testWidgets('toggles between light and dark', (tester) async {
      final container = ProviderContainer();
      final notifier = container.read(themeNotifierProvider.notifier);

      await notifier.setTheme(ThemeMode.light);
      expect(container.read(themeNotifierProvider), ThemeMode.light);

      await notifier.setTheme(ThemeMode.dark);
      expect(container.read(themeNotifierProvider), ThemeMode.dark);

      await notifier.setTheme(ThemeMode.system);
      expect(container.read(themeNotifierProvider), ThemeMode.system);

      container.dispose();
    });
  });
}
