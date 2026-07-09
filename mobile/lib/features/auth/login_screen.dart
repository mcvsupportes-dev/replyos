import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_input.dart';
import '../../shared/widgets/gradient_background.dart';

/// Login screen with Google login, email login, and guest login.
/// Beautiful gradient background.
class LoginScreen extends StatefulWidget {
  final VoidCallback onLoginSuccess;
  final VoidCallback onSignup;
  final VoidCallback onForgotPassword;
  final Future<void> Function(String email, String password) onEmailLogin;
  final Future<void> Function() onGoogleLogin;
  final Future<void> Function() onGuestLogin;

  const LoginScreen({
    super.key,
    required this.onLoginSuccess,
    required this.onSignup,
    required this.onForgotPassword,
    required this.onEmailLogin,
    required this.onGoogleLogin,
    required this.onGuestLogin,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  bool _googleLoading = false;
  bool _guestLoading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _doEmailLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await widget.onEmailLogin(_emailCtrl.text, _passCtrl.text);
      if (mounted) widget.onLoginSuccess();
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

  Future<void> _doGoogle() async {
    setState(() => _googleLoading = true);
    try {
      await widget.onGoogleLogin();
      if (mounted) widget.onLoginSuccess();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('تعذّر تسجيل الدخول عبر Google')),
        );
      }
    } finally {
      if (mounted) setState(() => _googleLoading = false);
    }
  }

  Future<void> _doGuest() async {
    setState(() => _guestLoading = true);
    try {
      await widget.onGuestLogin();
      if (mounted) widget.onLoginSuccess();
    } catch (_) {
      if (mounted) setState(() => _guestLoading = false);
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
            child: _Blob(size: 280, opacity: 0.18),
          ),
          const Positioned(
            bottom: -100,
            left: -60,
            child: _Blob(size: 220, opacity: 0.12),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 48),
                // Logo + heading
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.25),
                        blurRadius: 24,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: const Icon(LucideIcons.sparkles,
                      size: 38, color: AppColors.primary),
                )
                    .animate()
                    .scale(
                      duration: 500.ms,
                      curve: Curves.elasticOut,
                      begin: const Offset(0.6, 0.6),
                    ),
                const SizedBox(height: 20),
                const Text(
                  'مرحباً بعودتك',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
                const SizedBox(height: 6),
                Text(
                  'سجّل الدخول لمتابعة ردودك الذكية',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.85),
                  ),
                ).animate().fadeIn(delay: 350.ms),
                const SizedBox(height: 32),
                // Form card
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
                          label: 'البريد الإلكتروني',
                          hint: 'you@example.com',
                          controller: _emailCtrl,
                          prefixIcon: LucideIcons.mail,
                          keyboardType: TextInputType.emailAddress,
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) {
                              return 'البريد مطلوب';
                            }
                            if (!v.contains('@')) return 'صيغة غير صحيحة';
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        AppInput(
                          label: 'كلمة المرور',
                          hint: '••••••••',
                          controller: _passCtrl,
                          isPassword: true,
                          prefixIcon: LucideIcons.lock,
                          validator: (v) {
                            if (v == null || v.isEmpty) return 'كلمة المرور مطلوبة';
                            if (v.length < 6) return '6 أحرف على الأقل';
                            return null;
                          },
                        ),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton(
                            onPressed: widget.onForgotPassword,
                            child: const Text(
                              'نسيت كلمة المرور؟',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        AppButton(
                          label: 'تسجيل الدخول',
                          variant: AppButtonVariant.gradient,
                          fullWidth: true,
                          size: AppButtonSize.large,
                          loading: _loading,
                          icon: LucideIcons.logIn,
                          onPressed: _doEmailLogin,
                        ),
                      ],
                    ),
                  ),
                ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.2, end: 0),
                const SizedBox(height: 16),
                // Google
                AppButton(
                  label: 'المتابعة عبر Google',
                  variant: AppButtonVariant.secondary,
                  fullWidth: true,
                  size: AppButtonSize.large,
                  loading: _googleLoading,
                  icon: LucideIcons.chrome,
                  onPressed: _doGoogle,
                ),
                const SizedBox(height: 12),
                // Guest
                AppButton(
                  label: 'المتابعة كزائر',
                  variant: AppButtonVariant.ghost,
                  fullWidth: true,
                  loading: _guestLoading,
                  icon: LucideIcons.userX,
                  onPressed: _doGuest,
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'ليس لديك حساب؟',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.85),
                        fontSize: 14,
                      ),
                    ),
                    TextButton(
                      onPressed: widget.onSignup,
                      child: const Text(
                        'إنشاء حساب',
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
