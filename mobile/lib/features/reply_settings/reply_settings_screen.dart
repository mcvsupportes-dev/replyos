import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/config/app_config.dart';
import '../../core/models/settings_model.dart';
import '../../core/services/database_service.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/layouts/main_layout.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/app_input.dart';
import '../../shared/widgets/loading_indicator.dart';

/// Reply settings screen — saved to Firebase RTDB under /settings/{uid}.
class ReplySettingsScreen extends StatefulWidget {
  final String uid;

  const ReplySettingsScreen({super.key, required this.uid});

  @override
  State<ReplySettingsScreen> createState() => _ReplySettingsScreenState();
}

class _ReplySettingsScreenState extends State<ReplySettingsScreen> {
  SettingsModel _settings = SettingsModel.defaultFor('');
  bool _loading = true;
  bool _saving = false;
  final _delayCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _delayCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final json = await DatabaseService.instance.getSettings(widget.uid);
      if (json != null) {
        _settings = SettingsModel.fromJson(json);
      } else {
        _settings = SettingsModel.defaultFor(widget.uid);
      }
      _delayCtrl.text = _settings.replyDelaySeconds.toString();
    } catch (_) {
      _settings = SettingsModel.defaultFor(widget.uid);
      _delayCtrl.text = _settings.replyDelaySeconds.toString();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      _settings = _settings.copyWith(
        uid: widget.uid,
        replyDelaySeconds: int.tryParse(_delayCtrl.text.trim()) ??
            _settings.replyDelaySeconds,
        updatedAt: DateTime.now(),
      );
      await DatabaseService.instance.saveSettings(
        widget.uid,
        _settings.toJson(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم حفظ الإعدادات')),
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

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return MainLayout(
        title: 'إعدادات الرد',
        body: const LoadingIndicator(label: 'جارٍ التحميل...'),
      );
    }
    return MainLayout(
      title: 'إعدادات الرد',
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _section(
              icon: LucideIcons.power,
              title: 'الحالة العامة',
              children: [
                _switchTile(
                  title: 'تفعيل المساعد الذكي',
                  subtitle: 'السماح للذكاء الاصطناعي بالرد على العملاء',
                  value: _settings.aiEnabled,
                  onChanged: (v) => setState(() =>
                      _settings = _settings.copyWith(aiEnabled: v)),
                ),
                _switchTile(
                  title: 'الرد التلقائي',
                  subtitle: 'الرد فور استلام رسالة من واتساب',
                  value: _settings.autoReply,
                  onChanged: (v) => setState(() =>
                      _settings = _settings.copyWith(autoReply: v)),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _section(
              icon: LucideIcons.palette,
              title: 'أسلوب الرد',
              children: [
                _dropdownTile(
                  label: 'الأسلوب',
                  value: _settings.responseStyle,
                  items: AppConfig.styleOptions,
                  onChanged: (v) => setState(() =>
                      _settings = _settings.copyWith(responseStyle: v)),
                ),
                _dropdownTile(
                  label: 'النبرة',
                  value: _settings.tone,
                  items: AppConfig.toneOptions,
                  onChanged: (v) =>
                      setState(() => _settings = _settings.copyWith(tone: v)),
                ),
                _dropdownTile(
                  label: 'الطول',
                  value: _settings.length,
                  items: AppConfig.lengthOptions,
                  onChanged: (v) => setState(
                      () => _settings = _settings.copyWith(length: v)),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _section(
              icon: LucideIcons.clock,
              title: 'ساعات العمل',
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _timeTile(
                        label: 'من',
                        value: _settings.workStart ?? '09:00',
                        onChanged: (v) => setState(() =>
                            _settings = _settings.copyWith(workStart: v)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _timeTile(
                        label: 'إلى',
                        value: _settings.workEnd ?? '18:00',
                        onChanged: (v) => setState(() =>
                            _settings = _settings.copyWith(workEnd: v)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                AppInput(
                  label: 'تأخير الرد (بالثواني)',
                  hint: '0 فوري، 3 طبيعي',
                  controller: _delayCtrl,
                  keyboardType: TextInputType.number,
                  prefixIcon: LucideIcons.timer,
                ),
                const SizedBox(height: 6),
                const Text(
                  'تأخير بسيط يجعل الردود تبدو بشرية أكثر.',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.textMutedLight,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            AppButton(
              label: 'حفظ الإعدادات',
              variant: AppButtonVariant.gradient,
              icon: LucideIcons.save,
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

  Widget _dropdownTile({
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimaryLight,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 3,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: AppColors.backgroundLight,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: DropdownButton<String>(
                value: value,
                isExpanded: true,
                underline: const SizedBox(),
                items: items
                    .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                    .toList(),
                onChanged: (v) {
                  if (v != null) onChanged(v);
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _timeTile({
    required String label,
    required String value,
    required ValueChanged<String> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondaryLight,
          ),
        ),
        const SizedBox(height: 6),
        InkWell(
          onTap: () async {
            final parts = value.split(':');
            final t = await showTimePicker(
              context: context,
              initialTime: TimeOfDay(
                hour: int.tryParse(parts[0]) ?? 9,
                minute: int.tryParse(parts[1]) ?? 0,
              ),
            );
            if (t != null) {
              final hh = t.hour.toString().padLeft(2, '0');
              final mm = t.minute.toString().padLeft(2, '0');
              onChanged('$hh:$mm');
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            decoration: BoxDecoration(
              color: AppColors.backgroundLight,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimaryLight,
                  ),
                ),
                const Icon(LucideIcons.clock, size: 16, color: AppColors.primary),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
