import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:renault_app/core/widgets/signature_pad.dart';

void main() {
  group('SignaturePad', () {
    testWidgets('renders canvas and hint text', (tester) async {
      bool? hasSignature;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SignaturePad(
              onSignatureChanged: (hasSig) => hasSignature = hasSig,
            ),
          ),
        ),
      );

      expect(find.byType(SignaturePad), findsOneWidget);
      expect(find.text('Firmá aquí'), findsOneWidget);
    });

    testWidgets('clear button is present', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SignaturePad(
              onSignatureChanged: (_) {},
            ),
          ),
        ),
      );

      expect(find.text('Limpiar'), findsOneWidget);
    });

    testWidgets('undo button is present', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SignaturePad(
              onSignatureChanged: (_) {},
            ),
          ),
        ),
      );

      expect(find.text('Deshacer'), findsOneWidget);
    });
  });
}
