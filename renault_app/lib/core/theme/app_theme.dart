import 'package:flutter/material.dart';

class AppTheme {
  const AppTheme._();

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFFEAB308), // Renault Solar Yellow
        brightness: Brightness.light,
      );

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFFEAB308), // Renault Solar Yellow
        brightness: Brightness.dark,
      );
}
