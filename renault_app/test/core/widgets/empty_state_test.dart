import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:renault_app/core/widgets/empty_state.dart';

void main() {
  group('EmptyState', () {
    testWidgets('renders with icon, title and description', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyState(
              icon: Icons.inventory_2_outlined,
              title: 'Sin productos',
              description: 'No hay productos para mostrar',
            ),
          ),
        ),
      );

      expect(find.byType(EmptyState), findsOneWidget);
      expect(find.byIcon(Icons.inventory_2_outlined), findsOneWidget);
      expect(find.text('Sin productos'), findsOneWidget);
      expect(find.text('No hay productos para mostrar'), findsOneWidget);
    });

    testWidgets('renders with action button', (tester) async {
      bool actionPressed = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyState(
              icon: Icons.shopping_cart_outlined,
              title: 'Sin ventas',
              description: 'No hay ventas hoy',
              actionLabel: 'Nueva venta',
              onAction: () => actionPressed = true,
            ),
          ),
        ),
      );

      expect(find.text('Nueva venta'), findsOneWidget);
      await tester.tap(find.text('Nueva venta'));
      await tester.pumpAndSettle();
      expect(actionPressed, isTrue);
    });

    testWidgets('renders without action button', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyState(
              icon: Icons.notifications_none,
              title: 'Sin notificaciones',
              description: 'No tenés notificaciones',
            ),
          ),
        ),
      );

      expect(find.text('Nueva venta'), findsNothing);
    });
  });
}
