import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/services/database_service.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/layouts/main_layout.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/loading_indicator.dart';

/// Analytics: response counts, messages, charts, top contacts/questions.
class AnalyticsScreen extends StatefulWidget {
  final String uid;

  const AnalyticsScreen({super.key, required this.uid});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  bool _loading = true;
  Map<String, dynamic>? _data;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await DatabaseService.instance.getAnalytics(widget.uid);
      setState(() => _data = data);
    } catch (_) {
      setState(() => _data = null);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'الإحصائيات',
      appBar: AppBar(
        title: const Text('الإحصائيات'),
        centerTitle: true,
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(LucideIcons.menu),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw),
            onPressed: _load,
            tooltip: 'تحديث',
          ),
        ],
      ),
      body: _loading
          ? const LoadingIndicator(label: 'جارٍ تحميل الإحصائيات...')
          : RefreshIndicator(
              onRefresh: _load,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _periodSelector(),
                    const SizedBox(height: 16),
                    _kpisRow(),
                    const SizedBox(height: 16),
                    _chartCard(),
                    const SizedBox(height: 16),
                    _topContacts(),
                    const SizedBox(height: 16),
                    _topQuestions(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _periodSelector() {
    return AppCard(
      padding: const EdgeInsets.all(8),
      child: Row(
        children: ['اليوم', 'الأسبوع', 'الشهر', 'الكل']
            .map((p) => Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(4),
                    child: ChoiceChip(
                      label: Center(child: Text(p)),
                      selected: p == 'الأسبوع',
                      selectedColor: AppColors.primary,
                      labelStyle: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                      onSelected: (_) {},
                    ),
                  ),
                ))
            .toList(),
      ),
    ).animate().fadeIn().slideY(begin: 0.1, end: 0);
  }

  Widget _kpisRow() {
    final kpis = [
      _Kpi(icon: LucideIcons.reply, label: 'إجمالي الردود', value: '128', color: AppColors.primary),
      _Kpi(icon: LucideIcons.messagesSquare, label: 'الرسائل المستلمة', value: '342', color: AppColors.info),
      _Kpi(icon: LucideIcons.users, label: 'عملاء فريدون', value: '67', color: AppColors.accent),
      _Kpi(icon: LucideIcons.zap, label: 'معدل الرد التلقائي', value: '94%', color: AppColors.success),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.4,
      children: kpis
          .map((k) => AppCard(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: k.color.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(k.icon, color: k.color, size: 16),
                        ),
                        const Spacer(),
                        const Icon(LucideIcons.trendingUp,
                            size: 14, color: AppColors.success),
                      ],
                    ),
                    Text(
                      k.value,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                    Text(
                      k.label,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0))
          .toList(),
    );
  }

  Widget _chartCard() {
    final data = [12, 19, 14, 22, 28, 35, 24];
    final labels = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    final max = data.reduce((a, b) => a > b ? a : b);
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.barChart3, size: 18, color: AppColors.primary),
              SizedBox(width: 8),
              Text(
                'الردود خلال الأسبوع',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimaryLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          SizedBox(
            height: 160,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(data.length, (i) {
                final h = (data[i] / max) * 140;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Container(
                          height: h,
                          decoration: BoxDecoration(
                            gradient: AppColors.primaryGradient,
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ).animate().fadeIn(delay: (i * 80).ms).slideY(
                              begin: 0.3,
                              end: 0,
                              duration: 400.ms,
                            ),
                        const SizedBox(height: 6),
                        Text(
                          labels[i],
                          style: const TextStyle(
                            fontSize: 9,
                            color: AppColors.textMutedLight,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _topContacts() {
    final contacts = [
      {'name': 'أحمد محمد', 'count': 24},
      {'name': 'سارة علي', 'count': 18},
      {'name': 'خالد عبدالله', 'count': 15},
      {'name': 'منى حسن', 'count': 11},
    ];
    final max = (contacts.first['count'] as int).toDouble();
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.users, size: 18, color: AppColors.accent),
              SizedBox(width: 8),
              Text(
                'أكثر العملاء تفاعلاً',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimaryLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ...contacts.map((c) {
            final count = c['count'] as int;
            final pct = count / max;
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: Text(
                      c['name'] as String,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 5,
                    child: Stack(
                      children: [
                        Container(
                          height: 8,
                          decoration: BoxDecoration(
                            color: AppColors.borderLight,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        FractionallySizedBox(
                          widthFactor: pct,
                          child: Container(
                            height: 8,
                            decoration: BoxDecoration(
                              gradient: AppColors.primaryGradient,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 28,
                    child: Text(
                      '$count',
                      textAlign: TextAlign.end,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _topQuestions() {
    final qs = [
      {'q': 'ما سعر المنتج؟', 'count': 42},
      {'q': 'هل التوصيل متاح؟', 'count': 31},
      {'q': 'مواعيد العمل؟', 'count': 24},
      {'q': 'طرق الدفع المتاحة؟', 'count': 18},
    ];
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.helpCircle, size: 18, color: AppColors.info),
              SizedBox(width: 8),
              Text(
                'أكثر الأسئلة شيوعاً',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimaryLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...qs.map((q) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    const Icon(LucideIcons.messageSquare,
                        size: 14, color: AppColors.textMutedLight),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        q['q'] as String,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textPrimaryLight,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${q['count']}',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1, end: 0);
  }
}

class _Kpi {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _Kpi({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });
}
