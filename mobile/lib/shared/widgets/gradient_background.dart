import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

/// Full-screen gradient background wrapper for auth / splash / onboarding screens.
class GradientBackground extends StatelessWidget {
  final Widget child;
  final Gradient? gradient;
  final bool safeArea;
  final bool scrollable;

  const GradientBackground({
    super.key,
    required this.child,
    this.gradient,
    this.safeArea = true,
    this.scrollable = false,
  });

  @override
  Widget build(BuildContext context) {
    final g = gradient ?? AppColors.authGradient;
    final content = scrollable
        ? SingleChildScrollView(
            physics: const ClampingScrollPhysics(),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: MediaQuery.of(context).size.height,
              ),
              child: child,
            ),
          )
        : child;

    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: BoxDecoration(gradient: g),
      child: safeArea
          ? SafeArea(
              child: content,
              bottom: false,
            )
          : content,
    );
  }
}

/// Decorative top blob used on auth screens.
class TopBlob extends StatelessWidget {
  const TopBlob({super.key});

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: -120,
      right: -80,
      child: Container(
        width: 280,
        height: 280,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: AppColors.primary.withOpacity(0.18),
        ),
      ),
    );
  }
}
