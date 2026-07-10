import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

enum BadgeType { success, warning, danger, info, neutral, primary }

/// Compact status pill with colored dot + label.
class StatusBadge extends StatelessWidget {
  final String label;
  final BadgeType type;
  final IconData? icon;
  final bool dot;

  const StatusBadge({
    super.key,
    required this.label,
    this.type = BadgeType.neutral,
    this.icon,
    this.dot = true,
  });

  @override
  Widget build(BuildContext context) {
    final (fg, bg) = _colors(type);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: fg.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (dot)
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: fg,
                shape: BoxShape.circle,
              ),
            )
          else if (icon != null) ...[
            Icon(icon, size: 12, color: fg),
          ],
          if (dot || icon != null) const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: fg,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  (Color, Color) _colors(BadgeType t) {
    switch (t) {
      case BadgeType.success:
        return (AppColors.success, AppColors.success.withOpacity(0.12));
      case BadgeType.warning:
        return (AppColors.warning, AppColors.warning.withOpacity(0.12));
      case BadgeType.danger:
        return (AppColors.danger, AppColors.danger.withOpacity(0.12));
      case BadgeType.info:
        return (AppColors.info, AppColors.info.withOpacity(0.12));
      case BadgeType.primary:
        return (AppColors.primary, AppColors.primary.withOpacity(0.12));
      case BadgeType.neutral:
        return (AppColors.textSecondaryLight,
            AppColors.textSecondaryLight.withOpacity(0.08));
    }
  }
}
