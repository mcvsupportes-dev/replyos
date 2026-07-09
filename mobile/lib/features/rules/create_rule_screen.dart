import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/models/rule_model.dart';
import '../../core/services/database_service.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/app_input.dart';

/// Form to create a rule from plain language.
class CreateRuleScreen extends StatefulWidget {
  final String uid;
  final RuleModel? existing;
  final VoidCallback onSaved;

  const CreateRuleScreen({
    super.key,
    required this.uid,
    this.existing,
    required this.onSaved,
  });

  @override
  State<CreateRuleScreen> createState() => _CreateRuleScreenState();
}

class _CreateRuleScreenState extends State<CreateRuleScreen> {
  final _textCtrl = TextEditingController();
  String _status = 'active';
  int _priority = 0;
  bool _saving = false;

  static const List<String> _examples = [
    'إذا سأل العميل عن السعر، أرسل رابط قائمة الأسعار',
    'خارج ساعات العمل اعتذر وأخبره بمواعيد العمل',
    'إذا ذكر العميل كلمة "شكوى" حوّله لموظف بشري',
    'استخدم نبرة ودية واختم كل رد بشكر العميل',
    'لا تذكر أسعار المنافسين أبداً',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.existing != null) {
      _textCtrl.text = widget.existing!.text;
      _status = widget.existing!.status;
      _priority = widget.existing!.priority;
    }
  }

  @override
  void dispose() {
    _textCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final text = _textCtrl.text.trim();
    if (text.length < 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('اكتب قاعدة أوضح (5 أحرف على الأقل)')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final now = DateTime.now();
      if (widget.existing != null) {
        await DatabaseService.instance.updateRule(
          widget.uid,
          widget.existing!.id,
          widget.existing!
              .copyWith(text: text, status: _status, priority: _priority)
              .toRtdb(),
        );
      } else {
        final rule = RuleModel(
          id: '',
          uid: widget.uid,
          text: text,
          status: _status,
          priority: _priority,
          createdAt: now,
        );
        await DatabaseService.instance.addRule(widget.uid, rule.toRtdb());
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم حفظ القاعدة')),
        );
        widget.onSaved();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.existing != null ? 'تعديل قاعدة' : 'قاعدة جديدة'),
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronRight),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(LucideIcons.lightbulb,
                            size: 18, color: AppColors.primary),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'اكتب قاعدتك بالعربية',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimaryLight,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'اكتب جملة عادية تصف كيف يجب أن يرد المساعد في موقف معيّن.',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondaryLight,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 16),
                  AppInput(
                    label: 'نص القاعدة',
                    hint: 'مثال: إذا سأل العميل عن السعر، أرسل رابط القائمة',
                    controller: _textCtrl,
                    maxLines: 4,
                    maxLength: 280,
                    textDirection: TextDirection.rtl,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _statusSelector(),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _prioritySelector(),
                      ),
                    ],
                  ),
                ],
              ),
            ).animate().fadeIn().slideY(begin: 0.1, end: 0),
            const SizedBox(height: 20),
            const Align(
              alignment: Alignment.centerRight,
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 4),
                child: Text(
                  'أمثلة مقترحة',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSecondaryLight,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            ..._examples.map((e) => _ExampleChip(
                  text: e,
                  onTap: () => _textCtrl.text = e,
                )),
            const SizedBox(height: 24),
            AppButton(
              label: widget.existing != null ? 'تحديث القاعدة' : 'إنشاء القاعدة',
              variant: AppButtonVariant.gradient,
              icon: LucideIcons.check,
              fullWidth: true,
              size: AppButtonSize.large,
              loading: _saving,
              onPressed: _save,
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'الحالة',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondaryLight,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: AppColors.backgroundLight,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: DropdownButton<String>(
            value: _status,
            isExpanded: true,
            underline: const SizedBox(),
            items: const [
              DropdownMenuItem(value: 'active', child: Text('فعّالة')),
              DropdownMenuItem(value: 'paused', child: Text('متوقفة')),
              DropdownMenuItem(value: 'draft', child: Text('مسودة')),
            ],
            onChanged: (v) {
              if (v != null) setState(() => _status = v);
            },
          ),
        ),
      ],
    );
  }

  Widget _prioritySelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'الأولوية',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondaryLight,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: AppColors.backgroundLight,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: DropdownButton<int>(
            value: _priority,
            isExpanded: true,
            underline: const SizedBox(),
            items: List.generate(
              5,
              (i) => DropdownMenuItem(
                value: i,
                child: Text(['منخفضة جداً', 'منخفضة', 'متوسطة', 'عالية', 'حرجة'][i]),
              ),
            ),
            onChanged: (v) {
              if (v != null) setState(() => _priority = v);
            },
          ),
        ),
      ],
    );
  }
}

class _ExampleChip extends StatelessWidget {
  final String text;
  final VoidCallback onTap;
  const _ExampleChip({required this.text, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.06),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: AppColors.primary.withOpacity(0.2),
            ),
          ),
          child: Row(
            children: [
              const Icon(LucideIcons.quote,
                  size: 14, color: AppColors.primary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  text,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textPrimaryLight,
                    fontWeight: FontWeight.w500,
                    height: 1.4,
                  ),
                ),
              ),
              const Icon(LucideIcons.plus,
                  size: 14, color: AppColors.primary),
            ],
          ),
        ),
      ),
    );
  }
}
