/// Ticket width presets for thermal printers.
enum TicketWidth {
  narrow58mm(42),  // ~42 characters for 58mm paper
  standard80mm(58); // ~58 characters for 80mm paper

  const TicketWidth(this.charCount);
  final int charCount;
}

class TicketFormatter {
  static String formatTicket({
    required String companyName,
    required String saleNumber,
    required String date,
    String? clientName,
    String? sellerName,
    required List<Map<String, dynamic>> items,
    required double subtotal,
    double discount = 0,
    required double total,
    required String paymentMethod,
    String? notes,
    String? companyAddress,
    String? companyPhone,
    String? companyTaxId,
    String? logoBase64,
    TicketWidth width = TicketWidth.narrow58mm,
  }) {
    final buffer = StringBuffer();
    final w = width.charCount;
    final separator = '-' * w;
    final strongSeparator = '=' * w;

    // Logo placeholder (ESC/POS image command would go here)
    if (logoBase64 != null && logoBase64.isNotEmpty) {
      buffer.writeln('[LOGO:$logoBase64]');
      buffer.writeln('');
    }

    // Header
    buffer.writeln(strongSeparator);
    buffer.writeln(_centerText(companyName, w));
    buffer.writeln(_centerText('TICKET DE VENTA', w));
    if (companyAddress != null && companyAddress.isNotEmpty) {
      buffer.writeln(companyAddress.padRight(w).substring(0, w));
    }
    if (companyTaxId != null && companyTaxId.isNotEmpty) {
      buffer.writeln('CUIT: $companyTaxId');
    }
    if (companyPhone != null && companyPhone.isNotEmpty) {
      buffer.writeln('Tel: $companyPhone');
    }
    buffer.writeln(strongSeparator);

    // Info
    buffer.writeln('Nro: $saleNumber');
    buffer.writeln('Fecha: $date');
    if (clientName != null && clientName.isNotEmpty) {
      buffer.writeln('Cliente: $clientName');
    }
    if (sellerName != null && sellerName.isNotEmpty) {
      buffer.writeln('Vendedor: $sellerName');
    }
    buffer.writeln(separator);

    // Items header
    final nameWidth = w > 50 ? 20 : 15;
    final qtyLabel = 'Cant';
    final priceLabel = 'Precio';
    final subLabel = 'Subtotal';
    final header = '$qtyLabel  ${'Producto'.padRight(nameWidth)} $priceLabel    $subLabel';
    buffer.writeln(header.padRight(w).substring(0, w));
    buffer.writeln(separator);

    // Items
    for (final item in items) {
      final qty = item['quantity'] ?? 0;
      final name = (item['productName'] ?? 'Producto').toString();
      final price = (item['price'] as num?)?.toDouble() ?? 0;
      final sub = (item['subtotal'] as num?)?.toDouble() ?? 0;

      final shortName = name.length > nameWidth
          ? name.substring(0, nameWidth).padRight(nameWidth)
          : name.padRight(nameWidth);

      final line = '$qty x$shortName \$${price.toStringAsFixed(2)}  \$${sub.toStringAsFixed(2)}';
      buffer.writeln(line.padRight(w).substring(0, w));
    }

    // Totals
    buffer.writeln(separator);
    buffer.writeln('Subtotal: \$${subtotal.toStringAsFixed(2)}');
    if (discount > 0) {
      buffer.writeln('Descuento: -\$${discount.toStringAsFixed(2)}');
    }
    buffer.writeln('TOTAL: \$${total.toStringAsFixed(2)}');
    buffer.writeln('Pago: ${_formatPaymentMethod(paymentMethod)}');
    buffer.writeln(separator);

    if (notes != null && notes.isNotEmpty) {
      buffer.writeln('Notas: $notes');
    }

    buffer.writeln('');
    buffer.writeln(_centerText('¡Gracias por su compra!', w));
    buffer.writeln(strongSeparator);

    return buffer.toString();
  }

  static String _formatPaymentMethod(String method) {
    switch (method.toLowerCase()) {
      case 'cash':
        return 'Efectivo';
      case 'card':
        return 'Tarjeta';
      case 'transfer':
        return 'Transferencia';
      case 'credit':
        return 'Crédito';
      default:
        return method;
    }
  }

  static String _centerText(String text, int width) {
    final truncated = text.length > width ? text.substring(0, width) : text;
    final padding = width - truncated.length;
    final left = padding ~/ 2;
    final right = padding - left;
    return ' ' * left + truncated + ' ' * right;
  }
}
