import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/config/app_config.dart';
import '../../core/models/message_model.dart';
import '../../core/services/ai_service.dart';
import '../../core/services/database_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/extensions.dart';
import '../../shared/layouts/main_layout.dart';

/// ChatGPT-style chat with the AI assistant.
/// Calls /api/ai/chat through [AiService].
class AiAssistantScreen extends StatefulWidget {
  final String uid;
  final String? apiKey;
  final String? providerId;
  final String initialTone;
  final String initialLength;

  const AiAssistantScreen({
    super.key,
    required this.uid,
    this.apiKey,
    this.providerId,
    this.initialTone = 'ودود',
    this.initialLength = 'متوسط',
  });

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final TextEditingController _inputCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  final List<MessageModel> _messages = [];
  bool _typing = false;
  String _tone = 'ودود';
  String _length = 'متوسط';

  @override
  void initState() {
    super.initState();
    _tone = widget.initialTone;
    _length = widget.initialLength;
    _messages.add(MessageModel(
      id: 'welcome',
      uid: widget.uid,
      role: 'assistant',
      content:
          'مرحباً 👋 أنا مساعدك الذكي. اكتب أي شيء أو اطلب رداً جاهزاً لترسله لعملائك عبر واتساب.',
      createdAt: DateTime.now(),
    ));
  }

  @override
  void dispose() {
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _inputCtrl.text.trim();
    if (text.isEmpty || _typing) return;
    final userMsg = MessageModel.user(
      uid: widget.uid,
      content: text,
      tone: _tone,
      length: _length,
    );
    setState(() {
      _messages.add(userMsg);
      _inputCtrl.clear();
      _typing = true;
    });
    _scrollToBottom();

    try {
      final history = _messages
          .where((m) => m.role == 'user' || m.role == 'assistant')
          .toList();
      final reply = await AiService.instance.chat(
        messages: history,
        tone: _tone,
        length: _length,
        providerId: widget.providerId,
        apiKey: widget.apiKey,
      );
      final aiMsg = MessageModel.assistant(
        uid: widget.uid,
        content: reply,
        providerId: widget.providerId,
      );
      setState(() => _messages.add(aiMsg));
      // Persist to RTDB (best-effort)
      try {
        await DatabaseService.instance.addMessage(
          widget.uid,
          userMsg.toJson(),
        );
        await DatabaseService.instance.addMessage(
          widget.uid,
          aiMsg.toJson(),
        );
      } catch (_) {}
    } catch (e) {
      setState(() {
        _messages.add(MessageModel.assistant(
          uid: widget.uid,
          content: 'تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مجدداً.\n${e.toString()}',
        ));
      });
    } finally {
      setState(() => _typing = false);
      _scrollToBottom();
    }
  }

  Future<void> _regenerate() async {
    if (_typing) return;
    // Find last user message and resend
    final lastUserIndex = _messages.lastIndexWhere((m) => m.isUser);
    if (lastUserIndex < 0) return;
    final lastUser = _messages[lastUserIndex];
    // Remove last assistant message if any
    if (_messages.isNotEmpty && _messages.last.isAssistant) {
      setState(() => _messages.removeLast());
    }
    setState(() => _typing = true);
    _scrollToBottom();
    try {
      final reply = await AiService.instance.chat(
        messages: _messages.where((m) => m.role != 'system').toList(),
        tone: _tone,
        length: _length,
        providerId: widget.providerId,
        apiKey: widget.apiKey,
      );
      setState(() {
        _messages.add(MessageModel.assistant(
          uid: widget.uid,
          content: reply,
          providerId: widget.providerId,
        ));
      });
    } catch (_) {
      setState(() {
        _messages.add(MessageModel.assistant(
          uid: widget.uid,
          content: 'تعذّر إعادة التوليد. حاول مرة أخرى.',
        ));
      });
    } finally {
      setState(() => _typing = false);
      _scrollToBottom();
    }
  }

  Future<void> _clear() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('مسح المحادثة'),
        content: const Text('هل تريد حذف كل الرسائل؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('مسح'),
          ),
        ],
      ),
    );
    if (ok == true) {
      setState(() {
        _messages.clear();
        _messages.add(MessageModel(
          id: 'welcome',
          uid: widget.uid,
          role: 'assistant',
          content: 'تم مسح المحادثة. كيف يمكنني مساعدتك الآن؟',
          createdAt: DateTime.now(),
        ));
      });
      try {
        await DatabaseService.instance.clearMessages(widget.uid);
      } catch (_) {}
    }
  }

  void _copy(String text) {
    // SnackBar feedback (no clipboard plugin)
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('تم نسخ النص')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'المساعد الذكي',
      currentIndex: 1,
      appBar: AppBar(
        title: const Text('المساعد الذكي'),
        centerTitle: true,
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(LucideIcons.menu),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.trash2),
            tooltip: 'مسح المحادثة',
            onPressed: _clear,
          ),
        ],
      ),
      body: Column(
        children: [
          // Tone + length selectors
          Container(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
            decoration: const BoxDecoration(
              color: AppColors.surfaceLight,
              border: Border(
                bottom: BorderSide(color: AppColors.borderLight, width: 1),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: _chipSelector(
                    label: 'النبرة',
                    value: _tone,
                    options: AppConfig.toneOptions,
                    onChanged: (v) => setState(() => _tone = v),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _chipSelector(
                    label: 'الطول',
                    value: _length,
                    options: AppConfig.lengthOptions,
                    onChanged: (v) => setState(() => _length = v),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              controller: _scrollCtrl,
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 80),
              itemCount: _messages.length + (_typing ? 1 : 0),
              itemBuilder: (context, i) {
                if (_typing && i == _messages.length) {
                  return _TypingBubble().animate().fadeIn();
                }
                final m = _messages[i];
                return _ChatBubble(
                  message: m,
                  onCopy: () => _copy(m.content),
                  onRegenerate: m.isAssistant ? _regenerate : null,
                ).animate().fadeIn(duration: 250.ms).slideY(
                      begin: 0.1,
                      end: 0,
                      duration: 250.ms,
                    );
              },
            ),
          ),
          _inputBar(),
        ],
      ),
    );
  }

  Widget _chipSelector({
    required String label,
    required String value,
    required List<String> options,
    required ValueChanged<String> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(right: 4, bottom: 4),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.textMutedLight,
            ),
          ),
        ),
        Container(
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
            items: options
                .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                .toList(),
            onChanged: (v) {
              if (v != null) onChanged(v);
            },
          ),
        ),
      ],
    );
  }

  Widget _inputBar() {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
        decoration: const BoxDecoration(
          color: AppColors.surfaceLight,
          border: Border(
            top: BorderSide(color: AppColors.borderLight, width: 1),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _inputCtrl,
                minLines: 1,
                maxLines: 5,
                textDirection: TextDirection.rtl,
                decoration: InputDecoration(
                  hintText: 'اكتب رسالتك...',
                  filled: true,
                  fillColor: AppColors.backgroundLight,
                  contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                ),
                onSubmitted: (_) => _send(),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              width: 48,
              height: 48,
              decoration: const BoxDecoration(
                gradient: AppColors.primaryGradient,
                shape: BoxShape.circle,
                boxShadow: AppColors.primaryShadow,
              ),
              child: IconButton(
                icon: _typing
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Icon(LucideIcons.send,
                        color: Colors.white, size: 20),
                onPressed: _typing ? null : _send,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  final MessageModel message;
  final VoidCallback onCopy;
  final VoidCallback? onRegenerate;

  const _ChatBubble({
    required this.message,
    required this.onCopy,
    this.onRegenerate,
  });

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;
    return Align(
      alignment: isUser ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.82,
        ),
        child: Column(
          crossAxisAlignment:
              isUser ? CrossAxisAlignment.start : CrossAxisAlignment.end,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isUser ? AppColors.primary : AppColors.surfaceLight,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 4 : 16),
                  bottomRight: Radius.circular(isUser ? 16 : 4),
                ),
                border: isUser
                    ? null
                    : Border.all(color: AppColors.borderLight),
              ),
              child: SelectableText(
                message.content,
                textDirection: TextDirection.rtl,
                style: TextStyle(
                  fontSize: 14,
                  height: 1.5,
                  color: isUser ? Colors.white : AppColors.textPrimaryLight,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _actionChip(
                  icon: LucideIcons.copy,
                  label: 'نسخ',
                  onTap: onCopy,
                ),
                const SizedBox(width: 6),
                if (onRegenerate != null) ...[
                  _actionChip(
                    icon: LucideIcons.refreshCw,
                    label: 'إعادة',
                    onTap: onRegenerate!,
                  ),
                  const SizedBox(width: 6),
                ],
                Text(
                  message.createdAt.timeString,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textMutedLight,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _actionChip({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: AppColors.textMutedLight),
            const SizedBox(width: 4),
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.textMutedLight,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TypingBubble extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.surfaceLight,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(16),
            topRight: Radius.circular(16),
            bottomLeft: Radius.circular(16),
            bottomRight: Radius.circular(4),
          ),
          border: Border.all(color: AppColors.borderLight),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(
            3,
            (i) => Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
            )
                .animate(onPlay: (c) => c.repeat(reverse: true))
                .scale(
                  duration: 600.ms,
                  delay: (i * 200).ms,
                  begin: const Offset(0.6, 0.6),
                  end: const Offset(1.2, 1.2),
                ),
          ),
        ),
      ),
    );
  }
}
