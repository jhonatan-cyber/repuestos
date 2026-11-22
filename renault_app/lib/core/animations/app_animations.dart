import 'package:flutter/material.dart';

/// Fade-in page transition that fades the new page in from transparent.
class FadePageTransition extends PageTransitionsBuilder {
  const FadePageTransition();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return FadeTransition(
      opacity: CurvedAnimation(
        parent: animation,
        curve: Curves.easeInOut,
      ),
      child: child,
    );
  }
}

/// Slide page transition that slides the new page from the right.
class SlidePageTransition extends PageTransitionsBuilder {
  const SlidePageTransition();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    const begin = Offset(1.0, 0.0);
    const end = Offset.zero;
    const curve = Curves.easeInOut;

    final tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
    final offsetAnimation = animation.drive(tween);

    return SlideTransition(
      position: offsetAnimation,
      child: child,
    );
  }
}

/// Button with scale effect on press.
class ScaleButton extends StatefulWidget {
  const ScaleButton({
    required this.child,
    required this.onPressed,
    this.scaleFactor = 0.95,
    this.duration = const Duration(milliseconds: 100),
    super.key,
  });

  final Widget child;
  final VoidCallback onPressed;
  final double scaleFactor;
  final Duration duration;

  @override
  State<ScaleButton> createState() => _ScaleButtonState();
}

class _ScaleButtonState extends State<ScaleButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: widget.scaleFactor,
    ).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    _controller.forward();
  }

  void _onTapUp(TapUpDetails details) {
    _controller.reverse().then((_) {
      if (mounted) widget.onPressed();
    });
  }

  void _onTapCancel() {
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: widget.child,
      ),
    );
  }
}

/// Fade-in widget with staggered delay for list items.
class FadeInList extends StatefulWidget {
  const FadeInList({
    required this.children,
    this.staggerDuration = const Duration(milliseconds: 50),
    this.fadeDuration = const Duration(milliseconds: 300),
    super.key,
  });

  final List<Widget> children;
  final Duration staggerDuration;
  final Duration fadeDuration;

  @override
  State<FadeInList> createState() => _FadeInListState();
}

class _FadeInListState extends State<FadeInList>
    with TickerProviderStateMixin {
  late List<AnimationController> _controllers;
  late List<Animation<double>> _animations;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(
      widget.children.length,
      (index) => AnimationController(
        vsync: this,
        duration: widget.fadeDuration,
      ),
    );
    _animations = _controllers
        .map((controller) => CurvedAnimation(
              parent: controller,
              curve: Curves.easeInOut,
            ))
        .toList();

    // Stagger the animations
    for (int i = 0; i < widget.children.length; i++) {
      Future.delayed(Duration(milliseconds: i * widget.staggerDuration.inMilliseconds), () {
        if (mounted) _controllers[i].forward();
      });
    }
  }

  @override
  void dispose() {
    for (final controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(widget.children.length, (index) {
        return FadeTransition(
          opacity: _animations[index],
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, 0.1),
              end: Offset.zero,
            ).animate(_animations[index]),
            child: widget.children[index],
          ),
        );
      }),
    );
  }
}
