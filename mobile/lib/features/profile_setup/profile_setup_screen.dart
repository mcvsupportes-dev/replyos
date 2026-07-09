import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/validators.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_input.dart';

/// Step-by-step profile setup wizard.
/// One question per step with smooth animations and a progress indicator.
class ProfileSetupScreen extends StatefulWidget {
  final String uid;
  final Future<void> Function(Map<String, dynamic> profile) onSave;
  final VoidCallback onComplete;

  const ProfileSetupScreen({
    super.key,
    required this.uid,
    required this.onSave,
    required this.onComplete,
  });

  @override
  State<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends State<ProfileSetupScreen> {
  final PageController _pageController = PageController();
  final _nameCtrl = TextEditingController();
  final _ageCtrl = TextEditingController();
  final _professionCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  int _current = 0;
  bool _saving = false;

  static const _totalSteps = 4;

  @override
  void dispose() {
    _pageController.dispose();
    _nameCtrl.dispose();
    _ageCtrl.dispose();
    _professionCtrl.dispose();
    _locationCtrl.dispose();
    super.dispose();
  }

  void _next() {
    if (_current == 0 && Validators.name(_nameCtrl.text) != null) return;
    if (_current == 1 && Validators.age(_ageCtrl.text) != null) return;
    if (_current == 2 && _professionCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('يرجى إدخال المهنة')),
      );
      return;
    }
    if (_current < _totalSteps - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutCubic,
      );
    } else {
      _finish();
    }
  }

  void _back() {
    if (_current > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
      );
    }
  }

  Future<void> _finish() async {
    setState(() => _saving = true);
    final profile = {
      'uid': widget.uid,
      'name': _nameCtrl.text.trim(),
      'age': int.tryParse(_ageCtrl.text.trim()),
      'profession': _professionCtrl.text.trim(),
      'location': _locationCtrl.text.trim().isEmpty
          ? null
          : _locationCtrl.text.trim(),
      'updatedAt': DateTime.now().toIso8601String(),
    };
    try {
      await widget.onSave(profile);
      if (mounted) widget.onComplete();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ في الحفظ: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  String get _stepTitle {
    switch (_current) {
      case 0:
        return 'ما اسمك؟';
      case 1:
        return 'كم عمرك؟';
      case 2:
        return 'ما مهنتك؟';
      case 3:
        return 'أين تقيم؟';
      default:
        return '';
    }
  }

  String get _stepSubtitle {
    switch (_current) {
      case 0:
        return 'حتى نخاطبك بالشكل الصحيح في الردود الذكية';
      case 1:
        return 'يساعدنا على ضبط نبرة الرد المناسبة';
      case 2:
        return 'مثال: صاحب متجر، مدير مبيعات، دعم فني';
      case 3:
        return 'اختياري — لضبط ساعات العمل تلقائياً';
      default:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Progress
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  if (_current > 0)
                    IconButton(
                      icon: const Icon(LucideIcons.chevronRight),
                      onPressed: _back,
                    )
                  else
                    const SizedBox(width: 48),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: (_current + 1) / _totalSteps,
                        minHeight: 8,
                        backgroundColor: AppColors.borderLight,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    '${_current + 1}/$_totalSteps',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textSecondaryLight,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  onPageChanged: (i) => setState(() => _current = i),
                  children: [
                    _step(
                      icon: LucideIcons.user,
                      child: AppInput(
                        label: 'الاسم',
                        hint: 'مثال: محمد أحمد',
                        controller: _nameCtrl,
                        prefixIcon: LucideIcons.user,
                        validator: (v) => Validators.name(v),
                        textDirection: TextDirection.rtl,
                      ),
                    ),
                    _step(
                      icon: LucideIcons.cake,
                      child: AppInput(
                        label: 'العمر',
                        hint: 'مثال: 28',
                        controller: _ageCtrl,
                        prefixIcon: LucideIcons.cake,
                        keyboardType: TextInputType.number,
                        validator: (v) => Validators.age(v),
                      ),
                    ),
                    _step(
                      icon: LucideIcons.briefcase,
                      child: AppInput(
                        label: 'المهنة',
                        hint: 'مثال: صاحب متجر إلكتروني',
                        controller: _professionCtrl,
                        prefixIcon: LucideIcons.briefcase,
                        textDirection: TextDirection.rtl,
                      ),
                    ),
                    _step(
                      icon: LucideIcons.mapPin,
                      child: AppInput(
                        label: 'الموقع (اختياري)',
                        hint: 'مثال: الرياض، السعودية',
                        controller: _locationCtrl,
                        prefixIcon: LucideIcons.mapPin,
                        textDirection: TextDirection.rtl,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
              child: AppButton(
                label: _current == _totalSteps - 1 ? 'حفظ ومتابعة' : 'التالي',
                variant: AppButtonVariant.gradient,
                fullWidth: true,
                size: AppButtonSize.large,
                loading: _saving,
                trailingIcon: LucideIcons.arrowLeft,
                onPressed: _next,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _step({required IconData icon, required Widget child}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Spacer(),
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(24),
            boxShadow: AppColors.primaryShadow,
          ),
          child: Icon(icon, color: Colors.white, size: 38),
        )
            .animate(key: ValueKey(_current))
            .scale(
              duration: 400.ms,
              curve: Curves.elasticOut,
              begin: const Offset(0.6, 0.6),
            ),
        const SizedBox(height: 24),
        Text(
          _stepTitle,
          style: const TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimaryLight,
          ),
        )
            .animate(key: ValueKey('t$_current'))
            .fadeIn(duration: 350.ms)
            .slideY(begin: 0.2, end: 0),
        const SizedBox(height: 6),
        Text(
          _stepSubtitle,
          style: const TextStyle(
            fontSize: 14,
            color: AppColors.textSecondaryLight,
            height: 1.5,
          ),
        )
            .animate(key: ValueKey('s$_current'))
            .fadeIn(delay: 150.ms, duration: 350.ms)
            .slideY(begin: 0.2, end: 0),
        const SizedBox(height: 28),
        child
            .animate(key: ValueKey('i$_current'))
            .fadeIn(delay: 250.ms, duration: 350.ms)
            .slideY(begin: 0.2, end: 0),
        const Spacer(),
      ],
    );
  }
}
