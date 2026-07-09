import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/services/database_service.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/layouts/main_layout.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/loading_indicator.dart';
import '../../shared/widgets/status_badge.dart';

/// Subscription: current plan, usage, upgrade options (Free / Pro / Business).
class SubscriptionScreen extends StatefulWidget {
  final String uid;

  const SubscriptionScreen({super.key, required this.uid});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  bool _loading = true;
  String _currentPlan = 'free';
  Map<String, int> _usage = {'replies': 0, 'limit': 100};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final sub = await DatabaseService.instance.getSubscription(widget.uid);
      if (sub != null) {
        _currentPlan = (sub['plan'] as String?) ?? 'free';
        _usage = {
          'replies': (sub['usage']?['replies'] as num?)?.toInt() ?? 0,
          'limit': (sub['limit'] as num?)?.toInt() ?? 100,
        };
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _upgrade(String plan) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('ترقية إلى $plan'),
        content: Text('سيتم تحويلك إلى صفحة الدفع لإتمام الترقية.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('متابعة'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _currentPlan = plan);
    await DatabaseService.instance.saveSubscription(widget.uid, {
      'uid': widget.uid,
      'plan': plan,
      'usage': _usage,
      'limit': plan == 'free' ? 100 : plan == 'pro' ? 1000 : 100000,
      'updatedAt': DateTime.now().toIso8601String(),
    });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تمت الترقية إلى $plan (تجريبي)')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'الاشتراك',
      appBar: AppBar(
        title: const Text('الاشتراك'),
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
                  _currentCard(),
                  const SizedBox(height: 20),
                  _usageCard(),
                  const SizedBox(height: 24),
                  const Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      'الخطط المتاحة',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  ..._plans().map((p) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _PlanCard(
                          plan: p,
                          isCurrent: p.id == _currentPlan,
                          onUpgrade: () => _upgrade(p.id),
                        ),
                      )),
                  const SizedBox(height: 16),
                  _faqCard(),
                ],
              ),
            ),
    );
  }

  Widget _currentCard() {
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
              const Icon(LucideIcons.crown, color: Colors.amber, size: 26),
              const SizedBox(width: 10),
              const Text(
                'باقتك الحالية',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.white70,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              StatusBadge(
                label: _currentPlan == 'free'
                    ? 'مجاني'
                    : _currentPlan == 'pro'
                        ? 'احترافي'
                        : 'أعمال',
                type: BadgeType.success,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            _currentPlan == 'free'
                ? 'الباقة المجانية'
                : _currentPlan == 'pro'
                    ? 'الباقة الاحترافية'
                    : 'باقة الأعمال',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _currentPlan == 'free'
                ? 'حتى 100 رد شهرياً'
                : _currentPlan == 'pro'
                    ? 'حتى 1,000 رد شهرياً'
                    : 'ردود غير محدودة',
            style: TextStyle(
              fontSize: 13,
              color: Colors.white.withOpacity(0.85),
            ),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1, end: 0);
  }

  Widget _usageCard() {
    final replies = _usage['replies'] ?? 0;
    final limit = _usage['limit'] ?? 100;
    final pct = (replies / limit).clamp(0.0, 1.0);
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.zap, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              const Text(
                'استهلاك هذا الشهر',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimaryLight,
                ),
              ),
              const Spacer(),
              Text(
                '$replies / $limit',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: pct,
              minHeight: 10,
              backgroundColor: AppColors.borderLight,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${(pct * 100).round()}% من الحد الشهري',
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textMutedLight,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0);
  }

  List<_Plan> _plans() {
    return [
      _Plan(
        id: 'free',
        name: 'مجاني',
        price: '0',
        period: 'للأبد',
        color: AppColors.textSecondaryLight,
        features: [
          'حتى 100 رد شهرياً',
          'مساعد ذكي أساسي',
          'قاعدة واحدة',
          'دعم عبر البريد',
        ],
      ),
      _Plan(
        id: 'pro',
        name: 'احترافي',
        price: '99',
        period: 'شهرياً',
        color: AppColors.primary,
        features: [
          'حتى 1,000 رد شهرياً',
          'مساعد ذكي متقدم',
          'قواعد غير محدودة',
          'إحصائيات كاملة',
          'دعم ذو أولوية',
        ],
        popular: true,
      ),
      _Plan(
        id: 'business',
        name: 'أعمال',
        price: '299',
        period: 'شهرياً',
        color: AppColors.accent,
        features: [
          'ردود غير محدودة',
          'مستخدمون متعددون',
          'تكامل API متقدم',
          'تقارير مخصصة',
          'مدير حساب مخصص',
        ],
      ),
    ];
  }

  Widget _faqCard() {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.helpCircle, size: 18, color: AppColors.info),
              SizedBox(width: 8),
              Text(
                'أسئلة شائعة',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimaryLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _faq('هل يمكنني الترقية أو التخفيض في أي وقت؟', 'نعم، يمكنك ذلك فوراً من هذه الشاشة.'),
          _faq('هل توجد فترة تجربة مجانية؟', 'الباقة المجانية متاحة دائماً دون بطاقة ائتمان.'),
          _faq('كيف يتم الدفع؟', 'عبر بطاقة ائتمان أو محفظة إلكترونية بعد الترقية.'),
        ],
      ),
    );
  }

  Widget _faq(String q, String a) {
    return ExpansionTile(
      tilePadding: EdgeInsets.zero,
      title: Text(
        q,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimaryLight,
        ),
      ),
      children: [
        Align(
          alignment: Alignment.centerRight,
          child: Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              a,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondaryLight,
                height: 1.5,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _Plan {
  final String id;
  final String name;
  final String price;
  final String period;
  final Color color;
  final List<String> features;
  final bool popular;

  const _Plan({
    required this.id,
    required this.name,
    required this.price,
    required this.period,
    required this.color,
    required this.features,
    this.popular = false,
  });
}

class _PlanCard extends StatelessWidget {
  final _Plan plan;
  final bool isCurrent;
  final VoidCallback onUpgrade;

  const _PlanCard({
    required this.plan,
    required this.isCurrent,
    required this.onUpgrade,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      border: plan.popular
          ? Border.all(color: AppColors.primary, width: 1.5)
          : null,
      child: Stack(
        children: [
          if (plan.popular)
            Positioned(
              top: 0,
              left: 0,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(15),
                    bottomRight: Radius.circular(12),
                  ),
                ),
                child: const Text(
                  'الأكثر شيوعاً',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(LucideIcons.crown, color: plan.color, size: 22),
                    const SizedBox(width: 8),
                    Text(
                      plan.name,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      plan.price,
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: plan.color,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Text(
                        'ر.س / ${plan.period}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondaryLight,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                ...plan.features.map((f) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.check,
                              size: 14, color: AppColors.success),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              f,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textPrimaryLight,
                              ),
                            ),
                          ),
                        ],
                      ),
                    )),
                const SizedBox(height: 14),
                AppButton(
                  label: isCurrent ? 'الباقة الحالية' : 'ترقية',
                  variant: isCurrent
                      ? AppButtonVariant.secondary
                      : AppButtonVariant.gradient,
                  fullWidth: true,
                  onPressed: isCurrent ? null : onUpgrade,
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1, end: 0);
  }
}
