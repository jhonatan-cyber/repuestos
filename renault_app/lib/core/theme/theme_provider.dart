import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'app_theme.dart';

const _kThemeMode = 'theme_mode';

class ThemeNotifier extends StateNotifier<ThemeMode> {
  ThemeNotifier() : super(ThemeMode.system) {
    _load();
  }

  final _storage = const FlutterSecureStorage();

  Future<void> _load() async {
    final saved = await _storage.read(key: _kThemeMode);
    if (saved != null) {
      state = _fromString(saved);
    }
  }

  Future<void> setTheme(ThemeMode mode) async {
    state = mode;
    await _storage.write(key: _kThemeMode, value: _toString(mode));
  }

  static ThemeMode _fromString(String s) {
    switch (s) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  static String _toString(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.light:
        return 'light';
      case ThemeMode.dark:
        return 'dark';
      case ThemeMode.system:
        return 'system';
    }
  }
}

final themeNotifierProvider = StateNotifierProvider<ThemeNotifier, ThemeMode>(
  (ref) => ThemeNotifier(),
);

ThemeData currentTheme(BuildContext context) {
  final mode = Theme.of(context).brightness == Brightness.dark
      ? ThemeMode.dark
      : ThemeMode.light;
  return mode == ThemeMode.dark ? AppTheme.dark : AppTheme.light;
}
