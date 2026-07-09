/// Validation utilities for forms.
class Validators {
  Validators._();

  /// Email regex (RFC-ish, practical).
  static final RegExp _emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );

  /// Phone (Egyptian/SA-friendly, but general E.164-ish).
  static final RegExp _phoneRegex = RegExp(r'^\+?[0-9]{8,15}$');

  static String? required(String? value, {String label = 'هذا الحقل'}) {
    if (value == null || value.trim().isEmpty) {
      return '$label مطلوب';
    }
    return null;
  }

  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) return 'البريد الإلكتروني مطلوب';
    if (!_emailRegex.hasMatch(value.trim())) {
      return 'صيغة بريد إلكتروني غير صحيحة';
    }
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) return 'كلمة المرور مطلوبة';
    if (value.length < 6) return 'يجب ألا تقل عن 6 أحرف';
    return null;
  }

  static String? confirmPassword(String? value, String original) {
    if (value == null || value.isEmpty) return 'يرجى تأكيد كلمة المرور';
    if (value != original) return 'كلمتا المرور غير متطابقتين';
    return null;
  }

  static String? name(String? value) {
    if (value == null || value.trim().isEmpty) return 'الاسم مطلوب';
    if (value.trim().length < 2) return 'الاسم قصير جداً';
    return null;
  }

  static String? age(String? value) {
    if (value == null || value.trim().isEmpty) return 'العمر مطلوب';
    final n = int.tryParse(value.trim());
    if (n == null) return 'أدخل رقماً صحيحاً';
    if (n < 13 || n > 120) return 'العمر غير منطقي';
    return null;
  }

  static String? phone(String? value) {
    if (value == null || value.trim().isEmpty) return 'رقم الهاتف مطلوب';
    if (!_phoneRegex.hasMatch(value.trim())) {
      return 'صيغة رقم غير صحيحة';
    }
    return null;
  }

  static String? apiKey(String? value) {
    if (value == null || value.trim().isEmpty) return 'مفتاح API مطلوب';
    if (value.trim().length < 20) return 'المفتاح يبدو قصيراً جداً';
    return null;
  }

  static String? minLength(String? value, int min, {String label = 'النص'}) {
    if (value == null || value.trim().isEmpty) return '$label مطلوب';
    if (value.trim().length < min) return '$label يجب ألا يقل عن $min أحرف';
    return null;
  }
}
