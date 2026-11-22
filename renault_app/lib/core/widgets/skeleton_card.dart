import 'package:flutter/material.dart';

class SkeletonCard extends StatefulWidget {
  const SkeletonCard({
    super.key,
    this.lines = 3,
    this.leading = false,
    this.trailing = false,
  });

  final int lines;
  final bool leading;
  final bool trailing;

  @override
  State<SkeletonCard> createState() => _SkeletonCardState();
}

class _SkeletonCardState extends State<SkeletonCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _animation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.5, curve: Curves.easeInOut),
      ),
    );
    _controller.repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final baseColor = Theme.of(context).colorScheme.surfaceContainerHighest;
    final highlightColor = Theme.of(context).colorScheme.surfaceContainerHighest
        .withValues(alpha: 0.5);

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        final shimmerColor = Color.lerp(baseColor, highlightColor, _animation.value)!;
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: shimmerColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              if (widget.leading) ...[
                CircleAvatar(
                  radius: 20,
                  backgroundColor: shimmerColor.withValues(alpha: 0.7),
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: List.generate(widget.lines, (i) {
                    return Padding(
                      padding:
                          EdgeInsets.only(bottom: i < widget.lines - 1 ? 8 : 0),
                      child: Container(
                        height: 14,
                        width: i == widget.lines - 1
                            ? MediaQuery.of(context).size.width * 0.4
                            : double.infinity,
                        decoration: BoxDecoration(
                          color: shimmerColor.withValues(alpha: 0.7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    );
                  }),
                ),
              ),
              if (widget.trailing) ...[
                const SizedBox(width: 12),
                Container(
                  width: 40,
                  height: 24,
                  decoration: BoxDecoration(
                    color: shimmerColor.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
