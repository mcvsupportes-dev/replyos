import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/constants.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/gradient_background.dart';

/// 4-slide onboarding explaining ReplyOS features with smooth PageView transitions.
class OnboardingScreen extends StatefulWidget {
  final VoidCallback onComplete;

  const OnboardingScreen({super.key, required this.onComplete});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _current = 0;

  static const List<_Slide> _slides = [
    _Slide(
      icon: LucideIcons.sparkles,
      title: 'ردود ذكية في ثوانٍ',
      description:
          'دع الذكاء الاصطناعي يرد على عملائك عبر واتساب باحترافية وسرعة — حتى وأنت نائم.',
      color: AppColors.primary,
    ),
    _Slide(
      icon: LucideIcons.messageCircle,
      title: 'تكامل مع واتساب للأعمال',
      description:
          'اربط حساب واتساب بيزنس بضغطة زر، وابدأ أتمتة المحادثات فوراً دون أي تعقيد.',
      color: AppColors.whatsapp,
    ),
    _Slide(
      icon: LucideIcons.slidersHorizontal,
      title: 'قواعد ونبرة قابلة للتخصيص',
      description:
          'اضبط نبرة الرد، طول الرسالة، وساعات العمل بما يناسب نشاطك التجاري تماماً.',
      color: AppColors.accent,
    ),
    _Slide(
      icon: LucideIcons.barChart3,
      title: 'إحصائيات لحظية',
      description:
          'تابع عدد الردود، الرسائل، وأكثر الأسئلة شيوعاً في لوحة واحدة واضحة.',
      color: AppColors.info,
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _next() {
    if (_current < _slides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutCubic,
      );
    } else {
      widget.onComplete();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLast = _current == _slides.length - 1;
    return GradientBackground(
      gradient: AppColors.splashGradient,
      child: SafeArea(
        child: Column(
          children: [
            // Skip
            Align(
              alignment: Alignment.topLeft,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: TextButton(
                  onPressed: widget.onComplete,
                  child: Text(
                    'تخطي',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.85),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _slides.length,
                onPageChanged: (i) => setState(() => _current = i),
                itemBuilder: (context, i) {
                  final s = _slides[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 140,
                          height: 140,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(36),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.25),
                                blurRadius: 30,
                                offset: const Offset(0, 14),
                              ),
                            ],
                          ),
                          child: Icon(s.icon, size: 70, color: s.color),
                        )
                            .animate(key: ValueKey(i))
                            .scale(
                              duration: 500.ms,
                              curve: Curves.elasticOut,
                              begin: const Offset(0.7, 0.7),
                            )
                            .fadeIn(),
                        const SizedBox(height: 36),
                        Text(
                          s.title,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            height: 1.25,
                          ),
                        )
                            .animate(key: ValueKey('t$i'))
                            .fadeIn(delay: 200.ms, duration: 400.ms)
                            .slideY(begin: 0.2, end: 0),
                        const SizedBox(height: 14),
                        Text(
                          s.description,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 15,
                            color: Colors.white.withOpacity(0.9),
                            height: 1.6,
                          ),
                        )
                            .animate(key: ValueKey('d$i'))
                            .fadeIn(delay: 350.ms, duration: 400.ms)
                            .slideY(begin: 0.2, end: 0),
                      ],
                    ),
                  );
                },
              ),
            ),
            // Dots
            Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_slides.length, (i) {
                  final active = i == _current;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: active ? 28 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: active ? Colors.white : Colors.white.withOpacity(0.4),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  );
                }),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(32, 0, 32, 36),
              child: AppButton(
                label: isLast ? 'ابدأ الآن' : 'التالي',
                variant: AppButtonVariant.secondary,
                fullWidth: true,
                size: AppButtonSize.large,
                trailingIcon: isLast ? LucideIcons.arrowLeft : null,
                onPressed: _next,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Slide {
  final IconData icon;
  final String title;
  final String description;
  final Color color;

  const _Slide({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
  });
}
