import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:signature/signature.dart';

/// Reusable signature pad widget for capturing digital signatures.
/// Supports drawing, undo, clear, and exporting as PNG base64.
class SignaturePad extends StatefulWidget {
  const SignaturePad({
    super.key,
    this.hintText = 'Firmá aquí',
    this.height = 180,
    this.penColor = Colors.black,
    this.penStrokeWidth = 3,
    this.backgroundColor,
    this.onSignatureChanged,
  });

  /// Hint text shown when the pad is empty.
  final String hintText;

  /// Height of the signature canvas.
  final double height;

  /// Color of the pen stroke.
  final Color penColor;

  /// Width of the pen stroke.
  final double penStrokeWidth;

  /// Background color of the canvas.
  final Color? backgroundColor;

  /// Callback when the signature state changes (empty/has content).
  final ValueChanged<bool>? onSignatureChanged;

  @override
  State<SignaturePad> createState() => _SignaturePadState();

  /// Export the current signature as base64 from an external caller.
  static Future<String?> export(BuildContext context) async {
    final state = context.findAncestorStateOfType<_SignaturePadState>();
    return state?.exportAsBase64();
  }
}

class _SignaturePadState extends State<SignaturePad> {
  late final SignatureController _controller;
  bool _hasSignature = false;

  @override
  void initState() {
    super.initState();
    _controller = SignatureController(
      penStrokeWidth: widget.penStrokeWidth,
      penColor: widget.penColor,
    );
    _controller.addListener(_onSignatureChanged);
  }

  @override
  void dispose() {
    _controller.removeListener(_onSignatureChanged);
    _controller.dispose();
    super.dispose();
  }

  void _onSignatureChanged() {
    final hasSig = _controller.isNotEmpty;
    if (hasSig != _hasSignature) {
      setState(() {
        _hasSignature = hasSig;
      });
      widget.onSignatureChanged?.call(hasSig);
    }
  }

  void _clear() {
    _controller.clear();
  }

  void _undo() {
    _controller.undo();
  }

  /// Export signature as PNG base64 string.
  Future<String?> exportAsBase64() async {
    if (_controller.isEmpty) return null;

    final pngBytes = await _controller.toPngBytes();
    if (pngBytes == null || pngBytes.isEmpty) return null;

    return base64Encode(pngBytes);
  }

  /// Check if the signature pad has content.
  bool get hasSignature => _hasSignature;

  @override
  Widget build(BuildContext context) {
    final bgColor = widget.backgroundColor ?? Colors.white;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Canvas with hint overlay
        Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Container(
                height: widget.height,
                color: bgColor,
                child: Signature(
                  controller: _controller,
                  height: widget.height,
                  width: double.infinity,
                  backgroundColor: Colors.transparent,
                ),
              ),
            ),
            if (!_hasSignature)
              Center(
                child: GestureDetector(
                  onTap: () {},
                  child: Text(
                    widget.hintText,
                    style: TextStyle(
                      color: Colors.grey[400],
                      fontSize: 16,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        // Action buttons
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextButton.icon(
              onPressed: _undo,
              icon: const Icon(Icons.undo, size: 18),
              label: const Text('Deshacer'),
            ),
            const SizedBox(width: 16),
            TextButton.icon(
              onPressed: _clear,
              icon: const Icon(Icons.delete_outline, size: 18),
              label: const Text('Limpiar'),
            ),
          ],
        ),
      ],
    );
  }
}

/// Encoded signature data returned by [SignaturePad].
class SignatureData {
  const SignatureData({
    required this.base64,
    required this.timestamp,
  });

  /// Base64 encoded PNG image of the signature.
  final String base64;

  /// ISO timestamp when the signature was captured.
  final String timestamp;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SignatureData &&
          runtimeType == other.runtimeType &&
          base64 == other.base64 &&
          timestamp == other.timestamp;

  @override
  int get hashCode => Object.hash(base64, timestamp);
}
