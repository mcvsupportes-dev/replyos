import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/validators.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_input.dart';
import '../../shared/widgets/gradient_background.dart';

/// Send password reset email screen.
class ForgotPasswordScreen extends StatefulWidget {
  final VoidCallback onBack;
  final Future<void> Function(String email) onSend;

  const ForgotPasswordScreen({
    super.key,
    required this.onBack,
    required this.onSend,
  });

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  bool _loading = false;
  bool _sent = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await widget.onSend(_emailCtrl.text.trim());
      if (mounted) setState(() => _sent = true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GradientBackground(
      gradient: AppColors.authGradient,
      scrollable: true,
      child: Stack(
        children: [
          const Positioned(
            top: -120,
            right: -80,
            child: _Blob(size: 260, opacity: 0.18),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 32),
                Align(
                  alignment: Alignment.topRight,
                  child: IconButton(
                    icon: const Icon(LucideIcons.chevronRight,
                        color: Colors.white),
                    onPressed: widget.onBack,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'استعادة كلمة المرور',
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ).animate().fadeIn().slideY(begin: 0.2, end: 0),
                const SizedBox(height: 8),
                Text(
                  'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.85),
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 28),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 30,
                        offset: const Offset(0, 12),
                      ),
                    ],
                  ),
                  child: _sent
                      ? _successView()
                      : Form(
                          key: _formKey,
                          child: Column(
                            children: [
                              AppInput(
                                label: 'البريد الإلكتروني',
                                hint: 'you@example.com',
                                controller: _emailCtrl,
                                prefixIcon: LucideIcons.mail,
                                keyboardType: TextInputType.emailAddress,
                                validator: (v) => Validators.email(v),
                              ),
                              const SizedBox(height: 18),
                              AppButton(
                                label: 'إرسال رابط الاستعادة',
                                variant: AppButtonVariant.gradient,
                                fullWidth: true,
                                size: AppButtonSize.large,
                                loading: _loading,
                                icon: LucideIcons.send,
                                onPressed: _submit,
                              ),
                            ],
                          ),
                        ),
                ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
                const SizedBox(height: 24),
                TextButton(
                  onPressed: widget.onBack,
                  child: Text(
                    'العودة لتسجيل الدخول',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.9),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _successView() {
    return Column(
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: const BoxDecoration(
            color: AppColors.success,
            shape: BoxShape.circle,
          ),
          child: const Icon(LucideIcons.check, color: Colors.white, size: 38),
        ),
        const SizedBox(height: 18),
        const Text(
          'تم إرسال الرابط',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimaryLight,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'تحقق من بريدك: ${_emailCtrl.text.trim()}',
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 13,
            color: AppColors.textSecondaryLight,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 18),
        AppButton(
          label: 'العودة لتسجيل الدخول',
          variant: AppButtonVariant.primary,
          fullWidth: true,
          icon: LucideIcons.arrowLeft,
          onPressed: widget.onBack,
        ),
      ],
    );
  }
}

class _Blob extends StatelessWidget {
  final double size;
  final double opacity;
  const _Blob({required this.size, required this.opacity});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.primary.withOpacity(opacity),
      ),
    );
  }
}
