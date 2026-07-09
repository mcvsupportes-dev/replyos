import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/config/app_config.dart';
import '../../core/services/ai_service.dart';
import '../../core/services/database_service.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/layouts/main_layout.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/app_input.dart';
import '../../shared/widgets/loading_indicator.dart';

/// Add a custom AI API key or use the default; select provider and model;
/// test the connection; show/hide the key.
class ApiSettingsScreen extends StatefulWidget {
  final String uid;

  const ApiSettingsScreen({super.key, required this.uid});

  @override
  State<ApiSettingsScreen> createState() => _ApiSettingsScreenState();
}

class _ApiSettingsScreenState extends State<ApiSettingsScreen> {
  final _keyCtrl = TextEditingController();
  final _baseUrlCtrl = TextEditingController();
  String _provider = 'default';
  String _model = 'replyos-default';
  bool _useDefault = true;
  bool _showKey = false;
  bool _loading = true;
  bool _saving = false;
  bool _testing = false;
  bool? _testResult;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _keyCtrl.dispose();
    _baseUrlCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final json = await DatabaseService.instance.getCustomApiKey(widget.uid);
      if (json != null) {
        _provider = (json['provider'] as String?) ?? 'default';
        _model = (json['model'] as String?) ?? 'replyos-default';
        _keyCtrl.text = (json['apiKey'] as String?) ?? '';
        _baseUrlCtrl.text = (json['customBaseUrl'] as String?) ?? '';
        _useDefault = (json['useDefault'] as bool?) ?? true;
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await DatabaseService.instance.saveCustomApiKey(widget.uid, {
        'uid': widget.uid,
        'provider': _provider,
        'model': _model,
        'apiKey': _useDefault ? '' : _keyCtrl.text.trim(),
        'customBaseUrl': _baseUrlCtrl.text.trim(),
        'useDefault': _useDefault,
        'updatedAt': DateTime.now().toIso8601String(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم حفظ إعدادات API')),
        );
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

  Future<void> _test() async {
    if (!_useDefault && _keyCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('أدخل مفتاح API أولاً')),
      );
      return;
    }
    setState(() {
      _testing = true;
      _testResult = null;
    });
    try {
      final ok = await AiService.instance.testKey(
        providerId: _provider,
        apiKey: _useDefault ? '' : _keyCtrl.text.trim(),
        customBaseUrl: _baseUrlCtrl.text.trim().isEmpty
            ? null
            : _baseUrlCtrl.text.trim(),
      );
      setState(() => _testResult = ok);
    } catch (_) {
      setState(() => _testResult = false);
    } finally {
      if (mounted) setState(() => _testing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return MainLayout(
        title: 'إعدادات API',
        body: const LoadingIndicator(label: 'جارٍ التحميل...'),
      );
    }
    return MainLayout(
      title: 'إعدادات API',
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _defaultToggle(),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'مزود الخدمة',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _providerSelector(),
                  const SizedBox(height: 16),
                  _modelSelector(),
                  const SizedBox(height: 16),
                  AppInput(
                    label: 'مفتاح API',
                    hint: 'sk-...',
                    controller: _keyCtrl,
                    isPassword: !_showKey,
                    prefixIcon: LucideIcons.key,
                    enabled: !_useDefault,
                    suffixIcon: IconButton(
                      icon: Icon(
                        _showKey ? LucideIcons.eyeOff : LucideIcons.eye,
                        size: 18,
                      ),
                      onPressed: _useDefault
                          ? null
                          : () => setState(() => _showKey = !_showKey),
                    ),
                  ),
                  const SizedBox(height: 12),
                  AppInput(
                    label: 'Base URL مخصص (اختياري)',
                    hint: 'https://api.openai.com/v1',
                    controller: _baseUrlCtrl,
                    prefixIcon: LucideIcons.link,
                    enabled: !_useDefault,
                  ),
                ],
              ),
            ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    label: 'حفظ',
                    variant: AppButtonVariant.gradient,
                    icon: LucideIcons.save,
                    loading: _saving,
                    onPressed: _save,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: AppButton(
                    label: 'اختبار',
                    variant: AppButtonVariant.outline,
                    icon: LucideIcons.plugZap,
                    loading: _testing,
                    onPressed: _test,
                  ),
                ),
              ],
            ),
            if (_testResult != null) ...[
              const SizedBox(height: 12),
              _testResultCard(_testResult!),
            ],
            const SizedBox(height: 16),
            _securityNote(),
          ],
        ),
      ),
    );
  }

  Widget _defaultToggle() {
    return AppCard(
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(LucideIcons.shieldCheck,
                color: AppColors.primary, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'استخدم مزود ReplyOS الافتراضي',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimaryLight,
                  ),
                ),
                Text(
                  'مجاني ومُحسّن للغة العربية — أو استخدم مفتاحك الخاص.',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondaryLight,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: _useDefault,
            onChanged: (v) => setState(() => _useDefault = v),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1, end: 0);
  }

  Widget _providerSelector() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: AppConfig.aiProviders.map((p) {
        final active = p == _provider;
        return ChoiceChip(
          label: Text(p),
          selected: active,
          selectedColor: AppColors.primary,
          labelStyle: TextStyle(
            color: active ? Colors.white : AppColors.textSecondaryLight,
            fontWeight: FontWeight.w600,
          ),
          onSelected: (_) {
            setState(() {
              _provider = p;
              final models = AppConfig.aiModels[p] ?? [];
              if (models.isNotEmpty) _model = models.first;
            });
          },
        );
      }).toList(),
    );
  }

  Widget _modelSelector() {
    final models = AppConfig.aiModels[_provider] ?? [];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'النموذج',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimaryLight,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: AppColors.backgroundLight,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: DropdownButton<String>(
            value: _model,
            isExpanded: true,
            underline: const SizedBox(),
            items: models
                .map((m) => DropdownMenuItem(value: m, child: Text(m)))
                .toList(),
            onChanged: (v) {
              if (v != null) setState(() => _model = v);
            },
          ),
        ),
      ],
    );
  }

  Widget _testResultCard(bool ok) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: (ok ? AppColors.success : AppColors.danger).withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: (ok ? AppColors.success : AppColors.danger).withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            ok ? LucideIcons.checkCircle : LucideIcons.xCircle,
            color: ok ? AppColors.success : AppColors.danger,
            size: 22,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  ok ? 'الاتصال ناجح' : 'فشل الاتصال',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: ok ? AppColors.success : AppColors.danger,
                  ),
                ),
                Text(
                  ok
                      ? 'المفتاح يعمل بشكل صحيح.'
                      : 'تأكد من صحة المفتاح والـ Base URL.',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondaryLight,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _securityNote() {
    return AppCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(LucideIcons.lock, size: 18, color: AppColors.info),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'ملاحظة أمنية',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimaryLight,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'يتم تخزين مفتاحك مشفّراً في قاعدة بياناتك الخاصة على Firebase ولا يُشارك مع أي طرف.',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondaryLight,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
