import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/config/app_config.dart';
import '../../core/services/whatsapp_service.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/layouts/main_layout.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/app_input.dart';
import '../../shared/widgets/loading_indicator.dart';
import '../../shared/widgets/status_badge.dart';

/// WhatsApp connection screen — uses the remote bridge (via dashboard proxy).
/// The user enters their phone number, gets an 8-character pairing code,
/// enters it in WhatsApp → Linked Devices → Link with phone number, and
/// the connection is established. No Cloud API credentials needed.
class WhatsappConnectionScreen extends StatefulWidget {
  final String uid;
  final VoidCallback? onConnected;

  const WhatsappConnectionScreen({
    super.key,
    required this.uid,
    this.onConnected,
  });

  @override
  State<WhatsappConnectionScreen> createState() =>
      _WhatsappConnectionScreenState();
}

class _WhatsappConnectionScreenState extends State<WhatsappConnectionScreen> {
  final _phoneCtrl = TextEditingController();
  final _testToCtrl = TextEditingController();
  final _testMsgCtrl = TextEditingController(text: 'مرحباً من ReplyOS! 👋');

  String? _pairingCode;
  String _status = 'disconnected'; // disconnected | connecting | pairing | open | closed
  String? _connectedPhone;
  Map<String, dynamic>? _user;
  bool _loading = true;
  bool _requesting = false;
  bool _sendingTest = false;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _loadInitial();
  }

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _testToCtrl.dispose();
    _testMsgCtrl.dispose();
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadInitial() async {
    setState(() => _loading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final phone = prefs.getString(AppConfig.prefWhatsappPhone);
      if (phone != null && phone.isNotEmpty) {
        _connectedPhone = phone;
        _phoneCtrl.text = phone;
        // Check status
        try {
          final status = await WhatsappService.instance.getStatus(phoneNumber: phone);
          _status = (status['status'] ?? status['state'] ?? 'disconnected') as String;
          _user = status['user'] as Map<String, dynamic>?;
        } catch (_) {
          _status = 'disconnected';
        }
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _requestPairing() async {
    final phone = _phoneCtrl.text.trim();
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('أدخل رقم الهاتف')),
      );
      return;
    }

    setState(() {
      _requesting = true;
      _status = 'connecting';
      _pairingCode = null;
    });

    try {
      final code = await WhatsappService.instance.requestPairingCode(phoneNumber: phone);
      setState(() {
        _pairingCode = code;
        _status = 'pairing';
      });
      _startPolling(phone);
    } catch (e) {
      if (mounted) {
        setState(() => _status = 'disconnected');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل الحصول على رمز الربط: $e'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _requesting = false);
    }
  }

  void _startPolling(String phone) {
    _pollTimer?.cancel();
    var attempts = 0;
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      attempts++;
      if (attempts > 60) {
        // 3 minutes max
        timer.cancel();
        if (mounted && _status != 'open') {
          setState(() => _status = 'disconnected');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('انتهت مهلة الانتظار. حاول مرة أخرى.'),
              backgroundColor: AppColors.danger,
            ),
          );
        }
        return;
      }

      try {
        final status = await WhatsappService.instance.getStatus(phoneNumber: phone);
        final state = (status['status'] ?? status['state'] ?? 'disconnected') as String;
        if (state == 'open' || state == 'connected') {
          timer.cancel();
          if (mounted) {
            setState(() {
              _status = 'open';
              _user = status['user'] as Map<String, dynamic>?;
              _connectedPhone = phone;
              _pairingCode = null;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('تم ربط واتساب بنجاح! 🎉'),
                backgroundColor: AppColors.success,
              ),
            );
            widget.onConnected?.call();
          }
        } else if (state == 'closed' || state == 'error') {
          timer.cancel();
          if (mounted) {
            setState(() => _status = 'disconnected');
          }
        }
      } catch (_) {
        // ignore polling errors
      }
    });
  }

  Future<void> _disconnect() async {
    final phone = _connectedPhone ?? _phoneCtrl.text.trim();
    if (phone.isEmpty) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('قطع اتصال واتساب؟'),
        content: const Text('سيتم تسجيل الخروج من واتساب على هذا الجهاز.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('قطع الاتصال', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await WhatsappService.instance.disconnectWhatsApp(phoneNumber: phone);
      setState(() {
        _status = 'disconnected';
        _pairingCode = null;
        _user = null;
        _connectedPhone = null;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم قطع الاتصال')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ: $e')),
        );
      }
    }
  }

  Future<void> _sendTestMessage() async {
    final to = _testToCtrl.text.trim();
    final msg = _testMsgCtrl.text.trim();
    final phone = _connectedPhone;
    if (to.isEmpty || msg.isEmpty || phone == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('أدخل رقم المستلم والرسالة')),
      );
      return;
    }

    setState(() => _sendingTest = true);
    try {
      final ok = await WhatsappService.instance.sendMessage(
        phoneNumber: phone,
        to: to,
        text: msg,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(ok ? 'تم إرسال الرسالة! ✅' : 'فشل الإرسال'),
            backgroundColor: ok ? AppColors.success : AppColors.danger,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل الإرسال: $e'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _sendingTest = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'واتساب',
      appBar: AppBar(
        title: const Text('ربط واتساب'),
        centerTitle: true,
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(LucideIcons.menu),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
      ),
      body: _loading
          ? const LoadingIndicator(label: 'جارٍ التحميل...')
          : SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _statusCard(),
                  const SizedBox(height: 16),
                  if (_status == 'open') ...[
                    _connectedCard(),
                    const SizedBox(height: 16),
                    _testMessageCard(),
                    const SizedBox(height: 16),
                  ] else ...[
                    _pairingCard(),
                    const SizedBox(height: 16),
                  ],
                  _infoCard(),
                ],
              ),
            ),
    );
  }

  Widget _statusCard() {
    final isConnected = _status == 'open';
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: isConnected ? AppColors.heroGradient : null,
        color: isConnected ? null : AppColors.cardLight,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppColors.primaryShadow,
      ),
      child: Row(
        children: [
          Icon(
            isConnected ? LucideIcons.messageCircle : LucideIcons.messageSquare,
            color: isConnected ? Colors.white : AppColors.textMutedLight,
            size: 32,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isConnected ? 'واتساب متصل' : 'واتساب غير متصل',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: isConnected ? Colors.white : AppColors.textPrimaryLight,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _status == 'pairing'
                      ? 'في انتظار إدخال رمز الربط'
                      : _status == 'connecting'
                          ? 'جارٍ الاتصال...'
                          : isConnected
                              ? 'متصل برقم: $_connectedPhone'
                              : 'أدخل رقم هاتفك لبدء الربط',
                  style: TextStyle(
                    fontSize: 12,
                    color: isConnected ? Colors.white70 : AppColors.textMutedLight,
                  ),
                ),
              ],
            ),
          ),
          StatusBadge(
            label: _status == 'open'
                ? 'متصل'
                : _status == 'pairing'
                    ? 'ربط'
                    : _status == 'connecting'
                        ? 'اتصال'
                        : 'غير متصل',
            type: isConnected
                ? BadgeType.success
                : _status == 'pairing' || _status == 'connecting'
                    ? BadgeType.warning
                    : BadgeType.neutral,
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1, end: 0);
  }

  Widget _pairingCard() {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.smartphone, size: 20, color: AppColors.primary),
              const SizedBox(width: 8),
              const Text(
                'ربط واتساب جديد',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimaryLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          AppInput(
            controller: _phoneCtrl,
            label: 'رقم الهاتف',
            hint: 'مثال: 201234567890',
            prefixIcon: LucideIcons.phone,
            keyboardType: TextInputType.phone,
            enabled: _status != 'pairing' && _status != 'connecting',
          ),
          const SizedBox(height: 8),
          const Text(
            'أدخل الرقم مع رمز الدولة بدون + أو مسافات',
            style: TextStyle(fontSize: 11, color: AppColors.textMutedLight),
          ),
          const SizedBox(height: 16),
          if (_pairingCode != null && _status == 'pairing') ...[
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primary.withOpacity(0.3)),
              ),
              child: Column(
                children: [
                  const Text(
                    'رمز الربط (8 أحرف)',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textMutedLight,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _pairingCode!,
                    style: const TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 4,
                      color: AppColors.primary,
                      fontFamily: 'monospace',
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      'الخطوات:',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  _step('1', 'افتح واتساب على هاتفك'),
                  _step('2', 'الإعدادات ← الأجهزة المرتبطة'),
                  _step('3', 'اضغط "ربط جهاز"'),
                  _step('4', 'اختر "ربط برقم الهاتف"'),
                  _step('5', 'أدخل الرمز أعلاه'),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
          AppButton(
            label: _status == 'pairing'
                ? 'في انتظار الربط...'
                : _status == 'connecting'
                    ? 'جارٍ الاتصال...'
                    : 'الحصول على رمز الربط',
            icon: _requesting || _status == 'connecting' || _status == 'pairing'
                ? LucideIcons.loader
                : LucideIcons.link,
            variant: AppButtonVariant.gradient,
            fullWidth: true,
            onPressed: _requesting || _status == 'pairing' || _status == 'connecting'
                ? null
                : _requestPairing,
          ),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _step(String num, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: const BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                num,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textPrimaryLight,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _connectedCard() {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.checkCircle, size: 20, color: AppColors.success),
              const SizedBox(width: 8),
              const Text(
                'الحساب المرتبط',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimaryLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _infoRow('رقم الهاتف', _connectedPhone ?? '—'),
          if (_user != null) ...[
            _infoRow('معرف واتساب', _user!['id']?.toString() ?? '—'),
            if (_user!['name'] != null)
              _infoRow('الاسم', _user!['name'].toString()),
          ],
          const SizedBox(height: 16),
          AppButton(
            label: 'قطع الاتصال',
            icon: LucideIcons.logOut,
            variant: AppButtonVariant.secondary,
            fullWidth: true,
            onPressed: _disconnect,
          ),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(
            '$label: ',
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textMutedLight,
              fontWeight: FontWeight.w600,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textPrimaryLight,
              ),
              textDirection: TextDirection.ltr,
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  Widget _testMessageCard() {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.send, size: 20, color: AppColors.primary),
              const SizedBox(width: 8),
              const Text(
                'إرسال رسالة تجريبية',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimaryLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          AppInput(
            controller: _testToCtrl,
            label: 'إلى (رقم الهاتف)',
            hint: '201234567890',
            prefixIcon: LucideIcons.phone,
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 12),
          AppInput(
            controller: _testMsgCtrl,
            label: 'الرسالة',
            hint: 'اكتب الرسالة...',
            prefixIcon: LucideIcons.messageSquare,
            maxLines: 3,
          ),
          const SizedBox(height: 16),
          AppButton(
            label: _sendingTest ? 'جارٍ الإرسال...' : 'إرسال',
            icon: _sendingTest ? LucideIcons.loader : LucideIcons.send,
            variant: AppButtonVariant.gradient,
            fullWidth: true,
            onPressed: _sendingTest ? null : _sendTestMessage,
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _infoCard() {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.info, size: 18, color: AppColors.info),
              const SizedBox(width: 8),
              const Text(
                'كيف يعمل رمز الربط؟',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimaryLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'بدلاً من QR Code، ندعم رمز ربط من 8 أحرف/أرقام. أدخل رقم هاتفك، احصل على الرمز، ثم أدخله في تطبيق واتساب على هاتفك تحت: الإعدادات ← الأجهزة المرتبطة ← ربط جهاز ← ربط برقم الهاتف.',
            style: TextStyle(
              fontSize: 12,
              color: AppColors.textSecondaryLight,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.warning.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.warning.withOpacity(0.3)),
            ),
            child: const Row(
              children: [
                Icon(LucideIcons.alertTriangle, size: 14, color: AppColors.warning),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'الرمز صالح لمدة 60 ثانية فقط. إذا انتهت صلاحيته، احصل على رمز جديد.',
                    style: TextStyle(fontSize: 11, color: AppColors.textPrimaryLight),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1, end: 0);
  }
}
