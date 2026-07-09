import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/constants.dart';
import '../../shared/layouts/main_layout.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/app_input.dart';
import '../../shared/widgets/empty_state.dart';

/// Contacts list with search and permission request.
class ContactsScreen extends StatefulWidget {
  const ContactsScreen({super.key});

  @override
  State<ContactsScreen> createState() => _ContactsScreenState();
}

class _ContactsScreenState extends State<ContactsScreen> {
  final _searchCtrl = TextEditingController();
  bool _permissionGranted = false;
  bool _requesting = false;

  List<Map<String, String>> get _filtered {
    final q = _searchCtrl.text.trim();
    if (q.isEmpty) return AppDemoData.sampleContacts;
    return AppDemoData.sampleContacts
        .where((c) =>
            c['name']!.toLowerCase().contains(q.toLowerCase()) ||
            c['phone']!.contains(q))
        .toList();
  }

  Future<void> _requestPermission() async {
    setState(() => _requesting = true);
    await Future.delayed(const Duration(seconds: 1));
    setState(() {
      _permissionGranted = true;
      _requesting = false;
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      title: 'جهات الاتصال',
      appBar: AppBar(
        title: const Text('جهات الاتصال'),
        centerTitle: true,
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(LucideIcons.menu),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: AppInput(
              hint: 'بحث بالاسم أو الرقم...',
              controller: _searchCtrl,
              prefixIcon: LucideIcons.search,
              onChanged: (_) => setState(() {}),
            ),
          ),
          if (!_permissionGranted) ...[
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: AppCard(
                child: Column(
                  children: [
                    const Icon(LucideIcons.userCheck,
                        size: 36, color: AppColors.primary),
                    const SizedBox(height: 8),
                    const Text(
                      'السماح بالوصول لجهات الاتصال',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'نحتاج إذنك لعرض جهات اتصالك لمساعدتك في الرد عليهم.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondaryLight,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 14),
                    AppButton(
                      label: 'منح الإذن',
                      variant: AppButtonVariant.gradient,
                      icon: LucideIcons.shieldCheck,
                      loading: _requesting,
                      onPressed: _requestPermission,
                    ),
                  ],
                ),
              ),
            ),
          ] else ...[
            Expanded(
              child: _filtered.isEmpty
                  ? const EmptyState(
                      icon: LucideIcons.searchX,
                      title: 'لا توجد نتائج',
                      subtitle: 'جرّب كلمة بحث أخرى',
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                      itemCount: _filtered.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, i) {
                        final c = _filtered[i];
                        return _ContactTile(
                          name: c['name']!,
                          phone: c['phone']!,
                          lastSeen: c['last']!,
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('فتح محادثة ${c['name']}')),
                            );
                          },
                        ).animate().fadeIn(delay: (i * 50).ms).slideY(
                              begin: 0.1,
                              end: 0,
                              duration: 250.ms,
                            );
                      },
                    ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ContactTile extends StatelessWidget {
  final String name;
  final String phone;
  final String lastSeen;
  final VoidCallback onTap;

  const _ContactTile({
    required this.name,
    required this.phone,
    required this.lastSeen,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final initial = name.isNotEmpty ? name[0] : '?';
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
      leading: CircleAvatar(
        radius: 24,
        backgroundColor: AppColors.primary.withOpacity(0.12),
        child: Text(
          initial,
          style: const TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.w800,
            fontSize: 16,
          ),
        ),
      ),
      title: Text(
        name,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimaryLight,
        ),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            phone,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondaryLight,
            ),
          ),
          Text(
            lastSeen,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textMutedLight,
            ),
          ),
        ],
      ),
      trailing: IconButton(
        icon: const Icon(LucideIcons.messageCircle,
            color: AppColors.whatsapp, size: 22),
        onPressed: onTap,
      ),
      onTap: onTap,
    );
  }
}
