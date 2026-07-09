import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/validators.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_input.dart';
import '../../shared/widgets/gradient_background.dart';

/// Email + password signup with validation.
class SignupScreen extends StatefulWidget {
  final VoidCallback onSignupSuccess;
  final VoidCallback onBackToLogin;
  final Future<void> Function(String email, String password, String name) onSignup;

  const SignupScreen({
    super.key,
    required this.onSignupSuccess,
    required this.onBackToLogin,
    required this.onSignup,
  });

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _loading = false;
  bool _agree = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_agree) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('يجب الموافقة على الشروط والأحكام')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      await widget.onSignup(
        _emailCtrl.text.trim(),
        _passCtrl.text,
        _nameCtrl.text.trim(),
      );
      if (mounted) widget.onSignupSuccess();
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
            left: -80,
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
                    onPressed: widget.onBackToLogin,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'إنشاء حساب جديد',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ).animate().fadeIn().slideY(begin: 0.2, end: 0),
                const SizedBox(height: 6),
                Text(
                  'ابدأ تجربتك مع ReplyOS مجاناً',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.85),
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
                  child: Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        AppInput(
                          label: 'الاسم الكامل',
                          hint: 'مثال: محمد أحمد',
                          controller: _nameCtrl,
                          prefixIcon: LucideIcons.user,
                          validator: (v) => Validators.name(v),
                        ),
                        const SizedBox(height: 14),
                        AppInput(
                          label: 'البريد الإلكتروني',
                          hint: 'you@example.com',
                          controller: _emailCtrl,
                          prefixIcon: LucideIcons.mail,
                          keyboardType: TextInputType.emailAddress,
                          validator: (v) => Validators.email(v),
                        ),
                        const SizedBox(height: 14),
                        AppInput(
                          label: 'كلمة المرور',
                          hint: '6 أحرف على الأقل',
                          controller: _passCtrl,
                          isPassword: true,
                          prefixIcon: LucideIcons.lock,
                          validator: (v) => Validators.password(v),
                        ),
                        const SizedBox(height: 14),
                        AppInput(
                          label: 'تأكيد كلمة المرور',
                          hint: 'أعد كتابة كلمة المرور',
                          controller: _confirmCtrl,
                          isPassword: true,
                          prefixIcon: LucideIcons.lock,
                          validator: (v) =>
                              Validators.confirmPassword(v, _passCtrl.text),
                        ),
                        const SizedBox(height: 12),
                        CheckboxListTile(
                          value: _agree,
                          onChanged: (v) => setState(() => _agree = v ?? false),
                          contentPadding: EdgeInsets.zero,
                          controlAffinity: ListTileControlAffinity.leading,
                          title: const Text(
                            'أوافق على الشروط والأحكام وسياسة الخصوصية',
                            style: TextStyle(fontSize: 13),
                          ),
                        ),
                        const SizedBox(height: 8),
                        AppButton(
                          label: 'إنشاء الحساب',
                          variant: AppButtonVariant.gradient,
                          fullWidth: true,
                          size: AppButtonSize.large,
                          loading: _loading,
                          icon: LucideIcons.userPlus,
                          onPressed: _submit,
                        ),
                      ],
                    ),
                  ),
                ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'لديك حساب بالفعل؟',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.85),
                        fontSize: 14,
                      ),
                    ),
                    TextButton(
                      onPressed: widget.onBackToLogin,
                      child: const Text(
                        'تسجيل الدخول',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ],
      ),
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
