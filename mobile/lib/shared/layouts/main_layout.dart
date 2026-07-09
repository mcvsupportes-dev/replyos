import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/config/app_config.dart' as appcfg;
import '../../core/theme/app_colors.dart';
import '../../core/utils/constants.dart';

/// Main scaffold with a bottom navigation bar and a side drawer
/// for the full ReplyOS menu. Used by the primary tab screens.
class MainLayout extends StatelessWidget {
  final String title;
  final Widget body;
  final int currentIndex;
  final ValueChanged<int>? onTabSelected;
  final List<FloatingActionButton?>? floatingActions;
  final Widget? floatingActionButton;
  final bool showAppBar;
  final PreferredSizeWidget? appBar;

  const MainLayout({
    super.key,
    required this.title,
    required this.body,
    this.currentIndex = 0,
    this.onTabSelected,
    this.floatingActions,
    this.floatingActionButton,
    this.showAppBar = true,
    this.appBar,
  });

  static const List<_NavItem> _navItems = [
    _NavItem(icon: LucideIcons.home, label: 'الرئيسية', route: '/home'),
    _NavItem(icon: LucideIcons.sparkles, label: 'المساعد', route: '/ai'),
    _NavItem(icon: LucideIcons.messageCircle, label: 'واتساب', route: '/whatsapp'),
    _NavItem(icon: LucideIcons.settings, label: 'الإعدادات', route: '/settings'),
  ];

  static const List<_MenuItem> _menuItems = [
    _MenuItem(icon: LucideIcons.home, label: 'الرئيسية', route: '/home'),
    _MenuItem(icon: LucideIcons.sparkles, label: 'المساعد الذكي', route: '/ai'),
    _MenuItem(icon: LucideIcons.messageCircle, label: 'واتساب', route: '/whatsapp'),
    _MenuItem(icon: LucideIcons.slidersHorizontal, label: 'إعدادات الرد', route: '/reply-settings'),
    _MenuItem(icon: LucideIcons.listChecks, label: 'القواعد', route: '/rules'),
    _MenuItem(icon: LucideIcons.users, label: 'جهات الاتصال', route: '/contacts'),
    _MenuItem(icon: LucideIcons.image, label: 'الملفات', route: '/uploads'),
    _MenuItem(icon: LucideIcons.key, label: 'إعدادات API', route: '/api-settings'),
    _MenuItem(icon: LucideIcons.barChart3, label: 'الإحصائيات', route: '/analytics'),
    _MenuItem(icon: LucideIcons.crown, label: 'الاشتراك', route: '/subscription'),
    _MenuItem(icon: LucideIcons.settings2, label: 'الإعدادات', route: '/settings'),
  ];

  void _go(BuildContext context, String route, {bool replace = false}) {
    Navigator.of(context).pop(); // close drawer if open
    if (replace) {
      Navigator.pushReplacementNamed(context, route);
    } else {
      Navigator.pushNamed(context, route);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: appBar ??
          (showAppBar
              ? AppBar(
                  title: Text(title),
                  centerTitle: true,
                  leading: Builder(
                    builder: (ctx) => IconButton(
                      icon: const Icon(LucideIcons.menu),
                      onPressed: () => Scaffold.of(ctx).openDrawer(),
                    ),
                  ),
                )
              : null),
      drawer: Drawer(
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        child: SafeArea(
          child: Column(
            children: [
              const _DrawerHeader(),
              const Divider(height: 1),
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 12),
                  itemCount: _menuItems.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 4),
                  itemBuilder: (context, i) {
                    final m = _menuItems[i];
                    final active = m.route == '/home' && currentIndex == 0 ||
                        m.route == '/ai' && currentIndex == 1 ||
                        m.route == '/whatsapp' && currentIndex == 2 ||
                        m.route == '/settings' && currentIndex == 3;
                    return _DrawerTile(
                      icon: m.icon,
                      label: m.label,
                      active: active,
                      onTap: () => _go(context, m.route),
                    );
                  },
                ),
              ),
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'ReplyOS v${appcfg.AppConfig.appVersion}',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textMutedLight,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      body: body,
      floatingActionButton: floatingActionButton,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: (i) {
          if (onTabSelected != null) {
            onTabSelected!(i);
            return;
          }
          Navigator.pushReplacementNamed(context, _navItems[i].route);
        },
        items: _navItems
            .map((e) => BottomNavigationBarItem(
                  icon: Icon(e.icon),
                  label: e.label,
                ))
            .toList(),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  final String route;
  const _NavItem({required this.icon, required this.label, required this.route});
}

class _MenuItem {
  final IconData icon;
  final String label;
  final String route;
  const _MenuItem({required this.icon, required this.label, required this.route});
}

class _DrawerHeader extends StatelessWidget {
  const _DrawerHeader();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(LucideIcons.sparkles, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ReplyOS',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Theme.of(context).brightness == Brightness.dark
                      ? AppColors.textPrimaryDark
                      : AppColors.textPrimaryLight,
                ),
              ),
              const Text(
                'مساعد واتساب الذكي',
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondaryLight,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DrawerTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _DrawerTile({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: active
          ? AppColors.primary.withOpacity(0.1)
          : Colors.transparent,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          child: Row(
            children: [
              Icon(
                icon,
                size: 20,
                color: active
                    ? AppColors.primary
                    : (isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                    color: active
                        ? AppColors.primary
                        : (isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight),
                  ),
                ),
              ),
              if (active)
                const Icon(LucideIcons.chevronLeft,
                    size: 16, color: AppColors.primary),
            ],
          ),
        ),
      ),
    );
  }
}

/// Screen header with optional back button and title.
class ScreenHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final VoidCallback? onBack;
  final Widget? trailing;

  const ScreenHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.onBack,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Row(
        children: [
          if (onBack != null)
            IconButton(
              icon: const Icon(LucideIcons.chevronRight),
              onPressed: onBack,
            ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimaryLight,
                  ),
                ).animate().fadeIn(duration: AppConstants.durationMedium),
                if (subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    subtitle!,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondaryLight,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}
