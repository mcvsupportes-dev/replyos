import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/constants.dart';

enum AppButtonVariant { primary, secondary, outline, ghost, danger, gradient }
enum AppButtonSize { small, medium, large }

/// Reusable button with variants, loading state and icon support.
class AppButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final IconData? icon;
  final IconData? trailingIcon;
  final bool loading;
  final bool fullWidth;
  final bool expand;
  final double? width;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.medium,
    this.icon,
    this.trailingIcon,
    this.loading = false,
    this.fullWidth = false,
    this.expand = false,
    this.width,
  });

  @override
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton> {
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final disabled = widget.onPressed == null || widget.loading;

    final (bgColor, fgColor, borderColor) = _resolveColors(isDark);

    final height = widget.size == AppButtonSize.large
        ? 56.0
        : widget.size == AppButtonSize.small
            ? 40.0
            : 48.0;

    final fontSize = widget.size == AppButtonSize.large
        ? 16.0
        : widget.size == AppButtonSize.small
            ? 13.0
            : 15.0;

    final padH = widget.size == AppButtonSize.large
        ? 24.0
        : widget.size == AppButtonSize.small
            ? 14.0
            : 20.0;

    Widget content = Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (widget.loading)
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(fgColor),
            ),
          )
        else if (widget.icon != null) ...[
          Icon(widget.icon, size: fontSize + 3, color: fgColor),
          const SizedBox(width: 8),
        ],
        Flexible(
          child: Text(
            widget.label,
            style: TextStyle(
              color: fgColor,
              fontSize: fontSize,
              fontWeight: FontWeight.w700,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (widget.trailingIcon != null && !widget.loading) ...[
          const SizedBox(width: 8),
          Icon(widget.trailingIcon, size: fontSize + 3, color: fgColor),
        ],
      ],
    );

    if (widget.variant == AppButtonVariant.gradient) {
      return _wrap(
        child: Container(
          height: height,
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(AppConstants.radiusSm),
            boxShadow: disabled ? null : AppColors.primaryShadow,
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: disabled ? null : widget.onPressed,
              borderRadius: BorderRadius.circular(AppConstants.radiusSm),
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: padH),
                child: Center(child: content),
              ),
            ),
          ),
        ),
      );
    }

    return _wrap(
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: bgColor,
          border: borderColor != null
              ? Border.all(color: borderColor, width: 1.5)
              : null,
          borderRadius: BorderRadius.circular(AppConstants.radiusSm),
          boxShadow: widget.variant == AppButtonVariant.primary && !disabled
              ? AppColors.primaryShadow
              : null,
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: disabled ? null : widget.onPressed,
            borderRadius: BorderRadius.circular(AppConstants.radiusSm),
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: padH),
              child: Center(child: content),
            ),
          ),
        ),
      ),
    );
  }

  Widget _wrap({required Widget child}) {
    if (widget.fullWidth || widget.expand) {
      return SizedBox(width: double.infinity, child: child);
    }
    if (widget.width != null) {
      return SizedBox(width: widget.width, child: child);
    }
    return child;
  }

  (Color, Color, Color?) _resolveColors(bool isDark) {
    switch (widget.variant) {
      case AppButtonVariant.primary:
        return (AppColors.primary, Colors.white, null);
      case AppButtonVariant.gradient:
        return (Colors.transparent, Colors.white, null);
      case AppButtonVariant.secondary:
        return (AppColors.primaryContainer, AppColors.primaryContainerDark, null);
      case AppButtonVariant.outline:
        return (Colors.transparent, AppColors.primary, AppColors.primary);
      case AppButtonVariant.ghost:
        return (Colors.transparent, AppColors.primary, null);
      case AppButtonVariant.danger:
        return (AppColors.danger, Colors.white, null);
    }
  }
}

/// Icon-only circular action button.
class AppIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final String? tooltip;
  final Color? color;
  final double size;

  const AppIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.tooltip,
    this.color,
    this.size = 44,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip ?? '',
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(size / 2),
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: (color ?? AppColors.primary).withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            icon,
            color: color ?? AppColors.primary,
            size: size * 0.45,
          ),
        ),
      ).animate().scale(
            duration: AppConstants.durationFast,
            begin: const Offset(0.95, 0.95),
            end: const Offset(1, 1),
          ),
    );
  }
}
