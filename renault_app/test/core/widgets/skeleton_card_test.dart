import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:renault_app/core/widgets/skeleton_card.dart';
import 'package:renault_app/core/widgets/skeleton_list.dart';

void main() {
  group('SkeletonCard', () {
    testWidgets('renders skeleton card', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SkeletonCard(),
          ),
        ),
      );

      expect(find.byType(SkeletonCard), findsOneWidget);
    });
  });

  group('SkeletonList', () {
    testWidgets('renders skeleton list with items', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SkeletonList(count: 5),
          ),
        ),
      );

      expect(find.byType(SkeletonList), findsOneWidget);
    });

    testWidgets('renders with default count', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SkeletonList(),
          ),
        ),
      );

      expect(find.byType(SkeletonList), findsOneWidget);
    });
  });
}
