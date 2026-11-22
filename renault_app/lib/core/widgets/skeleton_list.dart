import 'package:flutter/material.dart';

import 'skeleton_card.dart';

class SkeletonList extends StatelessWidget {
  const SkeletonList({
    super.key,
    this.count = 5,
    this.lines = 3,
    this.leading = false,
    this.trailing = false,
  });

  final int count;
  final int lines;
  final bool leading;
  final bool trailing;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: count,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, __) => SkeletonCard(
        lines: lines,
        leading: leading,
        trailing: trailing,
      ),
    );
  }
}
