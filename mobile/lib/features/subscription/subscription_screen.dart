import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/config/app_config.dart';
import '../../core/services/auth_service.dart';
import '../../core/services/plans_service.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/layouts/main_layout.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/loading_indicator.dart';
import '../../shared/widgets/status_badge.dart';

/// Subscription screen — pulls plans live from the admin dashboard
/// (which the admin can edit at /dashboard/plans). Users can subscribe
/// to any plan, and the change is persisted to Firebase.
class SubscriptionScreen extends StatefulWidget {
  final String uid;

  const SubscriptionScreen({super.key, required this.uid});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  bool _loading = true;
  bool _subscribing = false;
  String _currentPlan = 'free';
  int _repliesThisMonth = 0;
  List<PlanModel> _plans = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      // Load current user plan + plans list in parallel
      final results = await Future.wait([
        AuthService.instance.getCachedUserPlan(),
        PlansService.instance.fetchPlans(),
      ]);
      _currentPlan = results[0] as String;
      _plans = results[1] as List<PlanModel>;
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _subscribe(PlanModel plan) async {
    if (plan.id == _currentPlan) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('اشترك في ${plan.nameAr}'),
        content: Text(
          plan.price == 0
              ? 'سيتم تفعيل الباقة المجانية فوراً.'
              : 'سيتم تحويلك إلى صفحة الدفع لإتمام الاشتراك في ${plan.nameAr} (${plan.formattedPrice('ar')}).',
        ),
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
    if (confirmed != true) return;

    setState(() => _subscribing = true);
    try {
      await PlansService.instance.subscribe(planId: plan.id);
      setState(() {
        _currentPlan = plan.id;
        _repliesThisMonth = 0;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('تم الاشتراك في ${plan.nameAr} بنجاح! 🎉'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل الاشتراك: $e'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _subscribing = false);
    }
  }

  PlanModel? get _currentPlanObj {
    try {
      return _plans.firstWhere((p) => p.id == _currentPlan);
    } catch (_) {
      return null;
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
          ? const LoadingIndicator(label: 'جارٍ تحميل الخطط...')
          : RefreshIndicator(
              onRefresh: _load,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _currentCard(),
                    const SizedBox(height: 20),
                    _usageCard(),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        const Text(
                          'الخطط المتاحة',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimaryLight,
                          ),
                        ),
                        const Spacer(),
                        if (_plans.isNotEmpty)
                          Text(
                            '${_plans.length} باقات',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textMutedLight,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (_plans.isEmpty)
                      _emptyPlansCard()
                    else
                      ..._plans.map((p) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _PlanCard(
                              plan: p,
                              isCurrent: p.id == _currentPlan,
                              subscribing: _subscribing,
                              onUpgrade: () => _subscribe(p),
                            ),
                          )),
                    const SizedBox(height: 16),
                    _faqCard(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _currentCard() {
    final plan = _currentPlanObj;
    final planName = plan?.nameAr ?? (_currentPlan == 'free' ? 'مجاني' : _currentPlan);
    final planDesc = plan != null
        ? (plan.repliesLimit == 0
            ? 'ردود غير محدودة'
            : 'حتى ${plan.repliesLimit} رد شهرياً')
        : 'الباقة الحالية';

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
                label: planName,
                type: BadgeType.success,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            planName,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            planDesc,
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
    final plan = _currentPlanObj;
    final replies = _repliesThisMonth;
    final limit = plan?.repliesLimit ?? 100;
    final pct = limit == 0 ? 0.0 : (replies / limit).clamp(0.0, 1.0);

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
                limit == 0 ? '$replies / ∞' : '$replies / $limit',
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
            limit == 0
                ? 'استخدام غير محدود'
                : '${(pct * 100).round()}% من الحد الشهري',
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textMutedLight,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _emptyPlansCard() {
    return AppCard(
      child: Column(
        children: [
          const Icon(LucideIcons.cloudOff, size: 32, color: AppColors.textMutedLight),
          const SizedBox(height: 12),
          const Text(
            'تعذر تحميل الخطط',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'تأكد من اتصالك بالإنترنت واسحب للأسفل للتحديث.',
            style: TextStyle(fontSize: 12, color: AppColors.textMutedLight),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          AppButton(
            label: 'إعادة المحاولة',
            icon: LucideIcons.refreshCw,
            onPressed: _load,
          ),
        ],
      ),
    );
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
          _faq('هل الأسعار شاملة الضريبة؟', 'نعم، جميع الأسعار شاملة الضريبة.'),
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

class _PlanCard extends StatelessWidget {
  final PlanModel plan;
  final bool isCurrent;
  final bool subscribing;
  final VoidCallback onUpgrade;

  const _PlanCard({
    required this.plan,
    required this.isCurrent,
    required this.subscribing,
    required this.onUpgrade,
  });

  @override
  Widget build(BuildContext context) {
    final accent = plan.popular
        ? AppColors.primary
        : plan.id == 'business'
            ? AppColors.accent
            : AppColors.textSecondaryLight;

    return AppCard(
      border: plan.popular ? Border.all(color: AppColors.primary, width: 1.5) : null,
      child: Stack(
        children: [
          if (plan.popular)
            Positioned(
              top: 0,
              left: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
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
                    Icon(LucideIcons.crown, color: accent, size: 22),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        plan.nameAr,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimaryLight,
                        ),
                      ),
                    ),
                    if (plan.subscriberCount > 0)
                      Text(
                        '${plan.subscriberCount} مشترك',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textMutedLight,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      plan.price == 0 ? 'مجاناً' : plan.formattedPrice('ar'),
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: accent,
                      ),
                    ),
                    if (plan.price > 0) ...[
                      const SizedBox(width: 4),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          plan.interval == 'month' ? '/شهر' : '/سنة',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondaryLight,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 14),
                ...plan.featuresAr.map((f) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.check, size: 14, color: AppColors.success),
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
                  label: isCurrent
                      ? 'الباقة الحالية'
                      : subscribing
                          ? 'جارٍ الاشتراك...'
                          : 'اشترك الآن',
                  variant: isCurrent
                      ? AppButtonVariant.secondary
                      : AppButtonVariant.gradient,
                  fullWidth: true,
                  icon: subscribing ? LucideIcons.loader : (isCurrent ? LucideIcons.check : null),
                  onPressed: isCurrent || subscribing ? null : onUpgrade,
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1, end: 0);
  }
}
