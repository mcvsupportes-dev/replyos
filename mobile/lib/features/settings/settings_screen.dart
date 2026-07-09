import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/config/app_config.dart';
import '../../core/services/auth_service.dart';
import '../../core/services/database_service.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/layouts/main_layout.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/loading_indicator.dart';
import '../../shared/widgets/status_badge.dart';

/// App settings: language, theme, RTL, notifications, privacy, account, logout, clear cache.
class SettingsScreen extends StatefulWidget {
  final String uid;
  final bool isGuest;
  final String themeMode;
  final String locale;
  final bool rtl;
  final ValueChanged<String> onThemeModeChanged;
  final ValueChanged<String> onLocaleChanged;
  final ValueChanged<bool> onRtlChanged;
  final Future<void> Function() onLogout;

  const SettingsScreen({
    super.key,
    required this.uid,
    required this.isGuest,
    required this.themeMode,
    required this.locale,
    required this.rtl,
    required this.onThemeModeChanged,
    required this.onLocaleChanged,
    required this.onRtlChanged,
    required this.onLogout,
  });

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notifications = true;
  bool _privacyMode = false;
  bool _loading = true;
  bool _loggingOut = false;
  bool _clearingCache = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final json = await DatabaseService.instance.getSettings(widget.uid);
      if (json != null) {
        _notifications = (json['notificationsEnabled'] as bool?) ?? true;
        _privacyMode = (json['privacyMode'] as bool?) ?? false;
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _saveFlag(String key, bool value) async {
    try {
      await DatabaseService.instance.update(
        '${'settings'}/${widget.uid}',
        {
          key: value,
          'updatedAt': DateTime.now().toIso8601String(),
        },
      );
    } catch (_) {}
  }

  Future<void> _logout() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تسجيل الخروج'),
        content: const Text('هل تريد تسجيل الخروج؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('خروج'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _loggingOut = true);
    try {
      await AuthService.instance.signOut();
      await widget.onLogout();
      if (mounted) {
        Navigator.pushNamedAndRemoveUntil(
          context,
          '/login',
          (route) => false,
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _loggingOut = false);
    }
  }

  Future<void> _clearCache() async {
    setState(() => _clearingCache = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('cache_messages');
      await prefs.remove('cache_uploads');
      await Future.delayed(const Duration(milliseconds: 800));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم مسح الكاش')),
        );
      }
    } finally {
      if (mounted) setState(() => _clearingCache = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'الإعدادات',
      currentIndex: 3,
      appBar: AppBar(
        title: const Text('الإعدادات'),
        centerTitle: true,
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(LucideIcons.menu),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
      ),
      body: _loading
          ? const LoadingIndicator(label: 'جارٍ التحميل...')
          : SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _profileCard(),
                  const SizedBox(height: 16),
                  _section(
                    icon: LucideIcons.palette,
                    title: 'المظهر',
                    children: [
                      _themeSelector(),
                      const Divider(height: 24),
                      _switchTile(
                        title: 'وضع RTL',
                        subtitle: 'الكتابة من اليمين لليسار',
                        value: widget.rtl,
                        onChanged: (v) {
                          widget.onRtlChanged(v);
                          setState(() {});
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _section(
                    icon: LucideIcons.languages,
                    title: 'اللغة',
                    children: [_languageSelector()],
                  ),
                  const SizedBox(height: 16),
                  _section(
                    icon: LucideIcons.bell,
                    title: 'الإشعارات',
                    children: [
                      _switchTile(
                        title: 'إشعارات الرسائل',
                        subtitle: 'تنبيه عند ورد رسالة جديدة',
                        value: _notifications,
                        onChanged: (v) {
                          setState(() => _notifications = v);
                          _saveFlag('notificationsEnabled', v);
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _section(
                    icon: LucideIcons.shield,
                    title: 'الخصوصية',
                    children: [
                      _switchTile(
                        title: 'الوضع الخاص',
                        subtitle: 'عدم حفظ بيانات المحادثات',
                        value: _privacyMode,
                        onChanged: (v) {
                          setState(() => _privacyMode = v);
                          _saveFlag('privacyMode', v);
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _section(
                    icon: LucideIcons.userCog,
                    title: 'الحساب',
                    children: [
                      _linkTile(
                        icon: LucideIcons.key,
                        title: 'إعدادات API',
                        onTap: () {
                          Navigator.pushNamed(context, '/api-settings');
                        },
                      ),
                      _linkTile(
                        icon: LucideIcons.trash,
                        title: 'مسح الكاش',
                        onTap: _clearingCache ? null : _clearCache,
                        trailing: _clearingCache
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : null,
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  AppButton(
                    label: 'تسجيل الخروج',
                    variant: AppButtonVariant.danger,
                    icon: LucideIcons.logOut,
                    fullWidth: true,
                    loading: _loggingOut,
                    onPressed: _logout,
                  ),
                  const SizedBox(height: 16),
                  const Center(
                    child: Text(
                      'ReplyOS v${AppConfig.appVersion}',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textMutedLight,
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _profileCard() {
    return AppCard(
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: AppColors.primary.withOpacity(0.12),
            child: const Icon(LucideIcons.user, color: AppColors.primary, size: 28),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text(
                      'حسابي',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (widget.isGuest)
                      const StatusBadge(label: 'زائر', type: BadgeType.warning),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  widget.uid,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textMutedLight,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1, end: 0);
  }

  Widget _section({
    required IconData icon,
    required String title,
    required List<Widget> children,
  }) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: AppColors.primary),
              ),
              const SizedBox(width: 10),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimaryLight,
                ),
              ),
            ],
          ),
          const Divider(height: 24),
          ...children,
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1, end: 0);
  }

  Widget _switchTile({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimaryLight,
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondaryLight,
                  ),
                ),
              ],
            ),
          ),
          Switch(value: value, onChanged: onChanged),
        ],
      ),
    );
  }

  Widget _themeSelector() {
    return Row(
      children: [
        const Expanded(
          child: Text(
            'السمة',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimaryLight,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Wrap(
          spacing: 6,
          children: [
            _themeChip('فاتح', 'light', LucideIcons.sun),
            _themeChip('داكن', 'dark', LucideIcons.moon),
            _themeChip('النظام', 'system', LucideIcons.laptop),
          ],
        ),
      ],
    );
  }

  Widget _themeChip(String label, String value, IconData icon) {
    final active = widget.themeMode == value;
    return ChoiceChip(
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14),
          const SizedBox(width: 4),
          Text(label),
        ],
      ),
      selected: active,
      selectedColor: AppColors.primary,
      labelStyle: TextStyle(
        color: active ? Colors.white : AppColors.textSecondaryLight,
        fontWeight: FontWeight.w600,
        fontSize: 12,
      ),
      onSelected: (_) {
        widget.onThemeModeChanged(value);
        setState(() {});
      },
    );
  }

  Widget _languageSelector() {
    return Row(
      children: [
        const Expanded(
          child: Text(
            'لغة التطبيق',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimaryLight,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Wrap(
          spacing: 6,
          children: [
            ChoiceChip(
              label: const Text('العربية'),
              selected: widget.locale == 'ar',
              selectedColor: AppColors.primary,
              labelStyle: TextStyle(
                color: widget.locale == 'ar'
                    ? Colors.white
                    : AppColors.textSecondaryLight,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
              onSelected: (_) => widget.onLocaleChanged('ar'),
            ),
            ChoiceChip(
              label: const Text('English'),
              selected: widget.locale == 'en',
              selectedColor: AppColors.primary,
              labelStyle: TextStyle(
                color: widget.locale == 'en'
                    ? Colors.white
                    : AppColors.textSecondaryLight,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
              onSelected: (_) => widget.onLocaleChanged('en'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _linkTile({
    required IconData icon,
    required String title,
    required VoidCallback? onTap,
    Widget? trailing,
  }) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, size: 18, color: AppColors.primary),
      title: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimaryLight,
        ),
      ),
      trailing: trailing ??
          const Icon(LucideIcons.chevronLeft,
              size: 16, color: AppColors.textMutedLight),
      onTap: onTap,
    );
  }
}
