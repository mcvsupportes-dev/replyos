import 'package:flutter/material.dart';

/// ReplyOS color palette.
/// Arabic-first, emerald primary, WhatsApp accent.
class AppColors {
  AppColors._();

  // === Brand ===
  static const Color primary = Color(0xFF10B981); // emerald-500
  static const Color primaryLight = Color(0xFF34D399); // emerald-400
  static const Color primaryDark = Color(0xFF047857); // emerald-700
  static const Color primaryContainer = Color(0xFFD1FAE5); // emerald-100
  static const Color primaryContainerDark = Color(0xFF064E3B); // emerald-950

  static const Color accent = Color(0xFF06B6D4); // cyan-500
  static const Color whatsapp = Color(0xFF25D366); // WhatsApp green
  static const Color whatsappDark = Color(0xFF128C7E);

  // === Status ===
  static const Color success = Color(0xFF22C55E); // green-500
  static const Color warning = Color(0xFFF59E0B); // amber-500
  static const Color info = Color(0xFF3B82F6); // blue-500
  static const Color danger = Color(0xFFEF4444); // red-500

  // === Light theme surfaces ===
  static const Color backgroundLight = Color(0xFFF8FAFC); // slate-50
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color borderLight = Color(0xFFE2E8F0); // slate-200
  static const Color textPrimaryLight = Color(0xFF0F172A); // slate-900
  static const Color textSecondaryLight = Color(0xFF475569); // slate-600
  static const Color textMutedLight = Color(0xFF94A3B8); // slate-400

  // === Dark theme surfaces ===
  static const Color backgroundDark = Color(0xFF0B1220); // custom dark
  static const Color surfaceDark = Color(0xFF111827); // gray-900
  static const Color cardDark = Color(0xFF1F2937); // gray-800
  static const Color borderDark = Color(0xFF374151); // gray-700
  static const Color textPrimaryDark = Color(0xFFF1F5F9); // slate-100
  static const Color textSecondaryDark = Color(0xFFCBD5E1); // slate-300
  static const Color textMutedDark = Color(0xFF64748B); // slate-500

  // === Gradients ===
  static const LinearGradient splashGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF047857), // emerald-700
      Color(0xFF10B981), // emerald-500
      Color(0xFF06B6D4), // cyan-500
    ],
  );

  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF10B981),
      Color(0xFF06B6D4),
    ],
  );

  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF047857),
      Color(0xFF10B981),
      Color(0xFF06B6D4),
    ],
  );

  static const LinearGradient authGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [
      Color(0xFF047857),
      Color(0xFF06B6D4),
    ],
  );

  // === Shadows ===
  static const List<BoxShadow> primaryShadow = [
    BoxShadow(
      color: Color(0x3310B981), // emerald with 20% opacity
      blurRadius: 20,
      offset: Offset(0, 8),
    ),
  ];

  static const List<BoxShadow> softShadow = [
    BoxShadow(
      color: Color(0x14000000), // black with 8% opacity
      blurRadius: 12,
      offset: Offset(0, 4),
    ),
  ];
}
