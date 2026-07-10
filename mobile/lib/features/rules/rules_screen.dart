import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/models/rule_model.dart';
import '../../core/services/database_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/extensions.dart';
import '../../shared/layouts/main_layout.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/loading_indicator.dart';
import '../../shared/widgets/status_badge.dart';

/// List of natural-language rules with create / edit / delete.
class RulesScreen extends StatefulWidget {
  final String uid;
  final VoidCallback onCreate;

  const RulesScreen({
    super.key,
    required this.uid,
    required this.onCreate,
  });

  @override
  State<RulesScreen> createState() => _RulesScreenState();
}

class _RulesScreenState extends State<RulesScreen> {
  late Stream<List<Map<String, dynamic>>> _stream;

  @override
  void initState() {
    super.initState();
    _stream = DatabaseService.instance.streamRules(widget.uid);
  }

  Future<void> _toggle(RuleModel rule) async {
    final newStatus = rule.isActive ? 'paused' : 'active';
    await DatabaseService.instance.updateRule(
      widget.uid,
      rule.id,
      rule.copyWith(status: newStatus).toRtdb(),
    );
  }

  Future<void> _delete(RuleModel rule) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('حذف القاعدة'),
        content: const Text('سيتم حذف هذه القاعدة نهائياً.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('حذف'),
          ),
        ],
      ),
    );
    if (ok == true) {
      await DatabaseService.instance.deleteRule(widget.uid, rule.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'القواعد',
      appBar: AppBar(
        title: const Text('القواعد'),
        centerTitle: true,
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(LucideIcons.menu),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: widget.onCreate,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(LucideIcons.plus),
        label: const Text('قاعدة جديدة'),
      ),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: _stream,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const LoadingIndicator(label: 'جارٍ التحميل...');
          }
          final data = snap.data ?? [];
          if (data.isEmpty) {
            return EmptyState(
              icon: LucideIcons.listChecks,
              title: 'لا توجد قواعد بعد',
              subtitle: 'أنشئ قواعد بالعادية ليتبعها المساعد الذكي عند الرد.',
              actionLabel: 'أنشئ أول قاعدة',
              onAction: widget.onCreate,
            );
          }
          final rules = data
              .map((m) => RuleModel.fromRtdb(m['id'] as String, m))
              .toList();
          rules.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
            itemCount: rules.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, i) {
              final r = rules[i];
              return Dismissible(
                key: ValueKey(r.id),
                direction: DismissDirection.startToEnd,
                background: Container(
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.only(right: 24),
                  decoration: BoxDecoration(
                    color: AppColors.danger,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(LucideIcons.trash2, color: Colors.white),
                ),
                confirmDismiss: (_) async {
                  await _delete(r);
                  return false;
                },
                child: _RuleTile(
                  rule: r,
                  onToggle: () => _toggle(r),
                  onDelete: () => _delete(r),
                ),
              ).animate().fadeIn(delay: (i * 60).ms).slideY(
                    begin: 0.1,
                    end: 0,
                    duration: 300.ms,
                  );
            },
          );
        },
      ),
    );
  }
}

class _RuleTile extends StatelessWidget {
  final RuleModel rule;
  final VoidCallback onToggle;
  final VoidCallback onDelete;

  const _RuleTile({
    required this.rule,
    required this.onToggle,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? AppColors.cardDark
            : AppColors.cardLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Theme.of(context).brightness == Brightness.dark
              ? AppColors.borderDark
              : AppColors.borderLight,
        ),
        boxShadow: AppColors.softShadow,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: (rule.isActive ? AppColors.primary : AppColors.textMutedLight)
                  .withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              LucideIcons.listChecks,
              color: rule.isActive ? AppColors.primary : AppColors.textMutedLight,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  rule.text,
                  textDirection: TextDirection.rtl,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimaryLight,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    StatusBadge(
                      label: rule.isActive ? 'فعّالة' : 'متوقفة',
                      type: rule.isActive
                          ? BadgeType.success
                          : BadgeType.neutral,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      rule.createdAt.timeAgoAr,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textMutedLight,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Column(
            children: [
              Switch(value: rule.isActive, onChanged: (_) => onToggle()),
              IconButton(
                icon: const Icon(LucideIcons.trash2, size: 18, color: AppColors.danger),
                onPressed: onDelete,
                tooltip: 'حذف',
              ),
            ],
          ),
        ],
      ),
    );
  }
}
