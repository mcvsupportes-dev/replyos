import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/services/whatsapp_service.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/layouts/main_layout.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/app_input.dart';
import '../../shared/widgets/loading_indicator.dart';
import '../../shared/widgets/status_badge.dart';

/// Official WhatsApp Business Cloud API connection flow.
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
  final _phoneIdCtrl = TextEditingController();
  final _tokenCtrl = TextEditingController();
  final _testPhoneCtrl = TextEditingController();
  final _testMsgCtrl = TextEditingController(text: 'رسالة اختبار من ReplyOS');

  Map<String, dynamic>? _connection;
  bool _loading = true;
  bool _saving = false;
  bool _testing = false;
  bool _sendingTest = false;
  bool? _testResult;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _phoneIdCtrl.dispose();
    _tokenCtrl.dispose();
    _testPhoneCtrl.dispose();
    _testMsgCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final conn = await WhatsappService.instance.getConnection(widget.uid);
      if (conn != null) {
        _phoneIdCtrl.text = (conn['phoneNumberId'] as String?) ?? '';
        _tokenCtrl.text = (conn['accessToken'] as String?) ?? '';
      }
      setState(() => _connection = conn);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final data = {
        'uid': widget.uid,
        'phoneNumberId': _phoneIdCtrl.text.trim(),
        'accessToken': _tokenCtrl.text.trim(),
        'wabaId': '',
        'connected': true,
        'connectedAt': DateTime.now().toIso8601String(),
      };
      await WhatsappService.instance.saveConnection(widget.uid, data);
      setState(() => _connection = data);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم حفظ بيانات الاتصال')),
        );
        widget.onConnected?.call();
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

  Future<void> _testConnection() async {
    setState(() {
      _testing = true;
      _testResult = null;
    });
    try {
      final ok = await WhatsappService.instance.testConnection(widget.uid);
      setState(() => _testResult = ok);
    } catch (_) {
      setState(() => _testResult = false);
    } finally {
      if (mounted) setState(() => _testing = false);
    }
  }

  Future<void> _sendTest() async {
    if (_testPhoneCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('أدخل رقم الاستلام')),
      );
      return;
    }
    setState(() => _sendingTest = true);
    try {
      final ok = await WhatsappService.instance.sendMessage(
        uid: widget.uid,
        to: _testPhoneCtrl.text.trim(),
        text: _testMsgCtrl.text.trim(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(ok ? 'تم إرسال رسالة الاختبار' : 'فشل الإرسال'),
            backgroundColor: ok ? AppColors.success : AppColors.danger,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل الإرسال: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _sendingTest = false);
    }
  }

  Future<void> _disconnect() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('قطع الاتصال'),
        content: const Text('سيتم حذف بيانات الاتصال. متابعة؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('قطع'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    await WhatsappService.instance.disconnect(widget.uid);
    setState(() {
      _connection = null;
      _phoneIdCtrl.clear();
      _tokenCtrl.clear();
    });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم قطع الاتصال')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final connected = _connection?['connected'] == true;
    return MainLayout(
      title: 'واتساب',
      currentIndex: 2,
      appBar: AppBar(
        title: const Text('واتساب للأعمال'),
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
          : RefreshIndicator(
              onRefresh: _load,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _hero(connected),
                    const SizedBox(height: 20),
                    _setupSteps(),
                    const SizedBox(height: 20),
                    AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'بيانات الاتصال',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimaryLight,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'أدخل بيانات WhatsApp Business Cloud API.',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondaryLight,
                            ),
                          ),
                          const SizedBox(height: 16),
                          AppInput(
                            label: 'Phone Number ID',
                            hint: '107...ين',
                            controller: _phoneIdCtrl,
                            prefixIcon: LucideIcons.phone,
                          ),
                          const SizedBox(height: 12),
                          AppInput(
                            label: 'Access Token',
                            hint: 'EAAG...',
                            controller: _tokenCtrl,
                            isPassword: true,
                            prefixIcon: LucideIcons.key,
                          ),
                          const SizedBox(height: 18),
                          Row(
                            children: [
                              Expanded(
                                child: AppButton(
                                  label: 'حفظ',
                                  variant: AppButtonVariant.gradient,
                                  loading: _saving,
                                  icon: LucideIcons.save,
                                  onPressed: _save,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: AppButton(
                                  label: 'اختبار',
                                  variant: AppButtonVariant.outline,
                                  loading: _testing,
                                  icon: LucideIcons.plugZap,
                                  onPressed: _testConnection,
                                ),
                              ),
                            ],
                          ),
                          if (_testResult != null) ...[
                            const SizedBox(height: 12),
                            _testResultLabel(_testResult!),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'إرسال رسالة اختبار',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimaryLight,
                            ),
                          ),
                          const SizedBox(height: 12),
                          AppInput(
                            label: 'رقم الاستلام',
                            hint: '+20100xxxxxxx',
                            controller: _testPhoneCtrl,
                            prefixIcon: LucideIcons.phone,
                            keyboardType: TextInputType.phone,
                          ),
                          const SizedBox(height: 10),
                          AppInput(
                            label: 'نص الرسالة',
                            controller: _testMsgCtrl,
                            maxLines: 3,
                          ),
                          const SizedBox(height: 14),
                          AppButton(
                            label: 'إرسال',
                            variant: AppButtonVariant.primary,
                            icon: LucideIcons.send,
                            loading: _sendingTest,
                            fullWidth: true,
                            onPressed: _sendTest,
                          ),
                        ],
                      ),
                    ),
                    if (connected) ...[
                      const SizedBox(height: 16),
                      AppButton(
                        label: 'قطع الاتصال',
                        variant: AppButtonVariant.danger,
                        icon: LucideIcons.linkOff,
                        fullWidth: true,
                        onPressed: _disconnect,
                      ),
                    ],
                    const SizedBox(height: 16),
                    AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(LucideIcons.info, size: 16, color: AppColors.info),
                              SizedBox(width: 6),
                              Text(
                                'معلومات webhook',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimaryLight,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          _kv('Callback URL',
                              'https://replyos-1.vercel.app/api/whatsapp/webhook'),
                          _kv('Verify Token', 'replyos_verify_token'),
                          _kv('Fields', 'messages, message_status'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _hero(bool connected) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.whatsapp,
            AppColors.whatsappDark,
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.whatsapp.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: const BoxDecoration(
              color: Colors.white24,
              shape: BoxShape.circle,
            ),
            child: const Icon(LucideIcons.messageCircle,
                color: Colors.white, size: 30),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  connected ? 'واتساب متصل' : 'واتساب غير متصل',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  connected
                      ? 'يمكنك استقبال وإرسال الرسائل تلقائياً'
                      : 'اربط حسابك لبدء أتمتة المحادثات',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 8),
                StatusBadge(
                  label: connected ? 'متصل' : 'غير متصل',
                  type: connected ? BadgeType.success : BadgeType.warning,
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1, end: 0);
  }

  Widget _setupSteps() {
    final steps = [
      ('1', 'افتح Meta for Developers', 'أنشئ تطبيقاً من نوع Business'),
      ('2', 'أضف WhatsApp Business', 'احصل على Phone Number ID'),
      ('3', 'أنشئ Access Token', 'صلاحية دائمة أو نظامية'),
      ('4', 'اربط Webhook', 'https://replyos-1.vercel.app/api/whatsapp/webhook'),
    ];
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'خطوات الإعداد',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 12),
          ...steps.map((s) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: const BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        s.$1,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s.$2,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimaryLight,
                          ),
                        ),
                        Text(
                          s.$3,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondaryLight,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _testResultLabel(bool ok) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: (ok ? AppColors.success : AppColors.danger).withOpacity(0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(
            ok ? LucideIcons.checkCircle : LucideIcons.xCircle,
            size: 16,
            color: ok ? AppColors.success : AppColors.danger,
          ),
          const SizedBox(width: 8),
          Text(
            ok ? 'الاتصال ناجح' : 'تعذّر الاتصال — راجع البيانات',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: ok ? AppColors.success : AppColors.danger,
            ),
          ),
        ],
      ),
    );
  }

  Widget _kv(String k, String v) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$k: ',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: AppColors.textSecondaryLight,
            ),
          ),
          Expanded(
            child: SelectableText(
              v,
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
}
