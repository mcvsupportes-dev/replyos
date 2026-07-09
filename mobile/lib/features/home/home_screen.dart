import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/models/user_model.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/constants.dart';
import '../../shared/layouts/main_layout.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/status_badge.dart';

/// Dashboard: AI status, WhatsApp status, today's counts, quick actions, recent items.
class HomeScreen extends StatelessWidget {
  final UserModel user;
  final bool aiEnabled;
  final bool whatsappConnected;
  final int todayReplies;
  final int todayMessages;
  final int activeContacts;
  final VoidCallback onGoAi;
  final VoidCallback onGoWhatsapp;
  final VoidCallback onGoReplySettings;
  final VoidCallback onGoRules;
  final VoidCallback onGoAnalytics;
  final VoidCallback onGoUploads;

  const HomeScreen({
    super.key,
    required this.user,
    this.aiEnabled = true,
    this.whatsappConnected = false,
    this.todayReplies = 0,
    this.todayMessages = 0,
    this.activeContacts = 0,
    required this.onGoAi,
    required this.onGoWhatsapp,
    required this.onGoReplySettings,
    required this.onGoRules,
    required this.onGoAnalytics,
    required this.onGoUploads,
  });

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'الرئيسية',
      currentIndex: 0,
      body: RefreshIndicator(
        onRefresh: () async => await Future.delayed(const Duration(seconds: 1)),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _greeting(),
              const SizedBox(height: 16),
              _statusRow(),
              const SizedBox(height: 20),
              _countsRow(),
              const SizedBox(height: 20),
              _quickActions(context),
              const SizedBox(height: 20),
              _aiSummaryCard(context),
              const SizedBox(height: 16),
              _recentSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _greeting() {
    final hour = DateTime.now().hour;
    final greet = hour < 12
        ? 'صباح الخير'
        : hour < 18
            ? 'مساء الخير'
            : 'مساء الخير';
    return Row(
      children: [
        CircleAvatar(
          radius: 22,
          backgroundColor: AppColors.primary.withOpacity(0.12),
          child: const Icon(LucideIcons.user, color: AppColors.primary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$greet 👋',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondaryLight,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                user.displayName ?? (user.isGuest ? 'زائر' : 'مستخدم'),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimaryLight,
                ),
              ),
            ],
          ),
        ),
        if (user.isGuest)
          const StatusBadge(label: 'وضع زائر', type: BadgeType.warning),
      ],
    ).animate().fadeIn().slideY(begin: 0.1, end: 0);
  }

  Widget _statusRow() {
    return Row(
      children: [
        Expanded(
          child: _StatusCard(
            title: 'المساعد الذكي',
            icon: LucideIcons.sparkles,
            active: aiEnabled,
            activeLabel: 'يعمل الآن',
            inactiveLabel: 'متوقف',
            color: AppColors.primary,
            onTap: onGoAi,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatusCard(
            title: 'واتساب',
            icon: LucideIcons.messageCircle,
            active: whatsappConnected,
            activeLabel: 'متصل',
            inactiveLabel: 'غير متصل',
            color: AppColors.whatsapp,
            onTap: onGoWhatsapp,
          ),
        ),
      ],
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _countsRow() {
    return Row(
      children: [
        Expanded(
          child: StatCard(
            icon: LucideIcons.reply,
            label: 'ردود اليوم',
            value: todayReplies.toString(),
            iconColor: AppColors.primary,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: StatCard(
            icon: LucideIcons.messagesSquare,
            label: 'رسائل اليوم',
            value: todayMessages.toString(),
            iconColor: AppColors.info,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: StatCard(
            icon: LucideIcons.users,
            label: 'عملاء نشطون',
            value: activeContacts.toString(),
            iconColor: AppColors.accent,
          ),
        ),
      ],
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _quickActions(BuildContext context) {
    final actions = [
      _Action(icon: LucideIcons.sparkles, title: 'المساعد', color: AppColors.primary, onTap: onGoAi),
      _Action(icon: LucideIcons.messageCircle, title: 'واتساب', color: AppColors.whatsapp, onTap: onGoWhatsapp),
      _Action(icon: LucideIcons.slidersHorizontal, title: 'إعدادات الرد', color: AppColors.accent, onTap: onGoReplySettings),
      _Action(icon: LucideIcons.listChecks, title: 'القواعد', color: AppColors.info, onTap: onGoRules),
    ];
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.zap, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              const Text(
                'إجراءات سريعة',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimaryLight,
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: onGoAnalytics,
                child: const Text('الكل'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: actions
                .map((a) => _ActionTile(action: a))
                .toList(),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _aiSummaryCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppColors.primaryShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.sparkles, color: Colors.white, size: 22),
              const SizedBox(width: 10),
              const Text(
                'المساعد الذكي جاهز',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              const Spacer(),
              StatusBadge(
                label: aiEnabled ? 'مفعّل' : 'متوقف',
                type: aiEnabled ? BadgeType.success : BadgeType.danger,
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'اطرح أي سؤال أو دع المساعد يحضّر رداً احترافياً لعملائك.',
            style: TextStyle(
              fontSize: 13,
              color: Colors.white70,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          AppButton(
            label: 'افتح المساعد',
            variant: AppButtonVariant.secondary,
            icon: LucideIcons.arrowLeft,
            onPressed: onGoAi,
          ),
        ],
      ),
    ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _recentSection() {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.history, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              const Text(
                'آخر النشاطات',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimaryLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...List.generate(3, (i) {
            return _RecentItem(
              title: [
                'تم الرد على أحمد محمد',
                'قاعدة جديدة: "ردود الأسعار"',
                'تحميل ملف: قائمة_المنتجات.pdf',
              ][i],
              subtitle: [
                'منذ 5 دقائق',
                'منذ 22 دقيقة',
                'منذ ساعة',
              ][i],
              icon: [
                LucideIcons.reply,
                LucideIcons.listChecks,
                LucideIcons.fileUp,
              ][i],
              color: [
                AppColors.primary,
                AppColors.accent,
                AppColors.info,
              ][i],
            );
          }),
        ],
      ),
    ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.1, end: 0);
  }
}

class _StatusCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final bool active;
  final String activeLabel;
  final String inactiveLabel;
  final Color color;
  final VoidCallback onTap;

  const _StatusCard({
    required this.title,
    required this.icon,
    required this.active,
    required this.activeLabel,
    required this.inactiveLabel,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const Spacer(),
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: active ? AppColors.success : AppColors.textMutedLight,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondaryLight,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            active ? activeLabel : inactiveLabel,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: active ? AppColors.success : AppColors.textMutedLight,
            ),
          ),
        ],
      ),
    );
  }
}

class _Action {
  final IconData icon;
  final String title;
  final Color color;
  final VoidCallback onTap;
  const _Action({
    required this.icon,
    required this.title,
    required this.color,
    required this.onTap,
  });
}

class _ActionTile extends StatelessWidget {
  final _Action action;
  const _ActionTile({required this.action});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: action.onTap,
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        width: 72,
        child: Column(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: action.color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(action.icon, color: action.color, size: 22),
            ),
            const SizedBox(height: 8),
            Text(
              action.title,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondaryLight,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RecentItem extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;

  const _RecentItem({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimaryLight,
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textMutedLight,
                  ),
                ),
              ],
            ),
          ),
          const Icon(LucideIcons.chevronLeft,
              size: 18, color: AppColors.textMutedLight),
        ],
      ),
    );
  }
}
