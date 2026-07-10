import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

/// Plan model returned by /api/public/plans.
class PlanModel {
  final String id;
  final String name;
  final String nameAr;
  final double price;
  final String currency;
  final String interval;
  final int repliesLimit;
  final int storageLimitMb;
  final List<String> features;
  final List<String> featuresAr;
  final bool popular;
  final int subscriberCount;

  PlanModel({
    required this.id,
    required this.name,
    required this.nameAr,
    required this.price,
    required this.currency,
    required this.interval,
    required this.repliesLimit,
    required this.storageLimitMb,
    required this.features,
    required this.featuresAr,
    required this.popular,
    required this.subscriberCount,
  });

  factory PlanModel.fromJson(Map<String, dynamic> json) {
    return PlanModel(
      id: (json['id'] ?? '') as String,
      name: (json['name'] ?? '') as String,
      nameAr: (json['nameAr'] ?? json['name'] ?? '') as String,
      price: ((json['price'] ?? 0) as num).toDouble(),
      currency: (json['currency'] ?? 'USD') as String,
      interval: (json['interval'] ?? 'month') as String,
      repliesLimit: (json['repliesLimit'] ?? 0) as int,
      storageLimitMb: (json['storageLimitMb'] ?? 0) as int,
      features: ((json['features'] ?? []) as List).map((e) => e.toString()).toList(),
      featuresAr: ((json['featuresAr'] ?? []) as List).map((e) => e.toString()).toList(),
      popular: (json['popular'] ?? false) as bool,
      subscriberCount: (json['subscriberCount'] ?? 0) as int,
    );
  }

  /// Localized name based on language code.
  String displayName(String lang) => lang == 'ar' ? nameAr : name;

  /// Localized features list.
  List<String> displayFeatures(String lang) => lang == 'ar' ? featuresAr : features;

  /// Formatted price (e.g. "$19/mo" or "مجاناً").
  String formattedPrice(String lang) {
    if (price == 0) {
      return lang == 'ar' ? 'مجاناً' : 'Free';
    }
    final symbol = currency == 'USD' ? '\$' : currency;
    final period = interval == 'month'
        ? (lang == 'ar' ? '/شهر' : '/mo')
        : interval == 'year'
            ? (lang == 'ar' ? '/سنة' : '/yr')
            : '';
    return '$symbol${price.toStringAsFixed(price == price.roundToDouble() ? 0 : 2)}$period';
  }
}

/// Plans service — fetches the plan list from the dashboard admin.
/// The admin can add/edit/delete plans in /dashboard/plans and they will
/// appear here automatically. This keeps pricing & features in sync
/// between the mobile app and the admin dashboard.
class PlansService {
  PlansService._();
  static final PlansService instance = PlansService._();

  /// Fetch the list of plans from the dashboard.
  /// Falls back to cached version if the network is unreachable.
  Future<List<PlanModel>> fetchPlans() async {
    final url = Uri.parse(
      '${AppConfig.backendBaseUrl}${AppConfig.plansEndpoint}',
    );

    try {
      final res = await http.get(url).timeout(const Duration(seconds: 15));

      if (res.statusCode >= 400) {
        return _loadCachedPlans();
      }

      final data = jsonDecode(res.body);
      final plansJson = (data['plans'] ?? []) as List;
      final plans = plansJson
          .map((p) => PlanModel.fromJson(p as Map<String, dynamic>))
          .toList();

      // Cache the plans for offline use
      await _cachePlans(res.body);

      return plans;
    } catch (_) {
      return _loadCachedPlans();
    }
  }

  /// Subscribe the current user to a plan.
  /// Requires the user to be logged in (token cached).
  Future<bool> subscribe({required String planId}) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(AppConfig.prefUserToken);
    if (token == null) {
      throw Exception('Not authenticated — please login first');
    }

    final url = Uri.parse(
      '${AppConfig.backendBaseUrl}${AppConfig.subscribeEndpoint}',
    );

    final res = await http
        .post(
          url,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'userToken': token, 'planId': planId}),
        )
        .timeout(const Duration(seconds: 15));

    if (res.statusCode >= 400) {
      final data = jsonDecode(res.body);
      throw Exception(data['error'] ?? 'فشل الاشتراك');
    }

    // Cache the new plan locally
    await prefs.setString(AppConfig.prefUserPlan, planId);

    return true;
  }

  /// Cache the plans JSON in SharedPreferences.
  Future<void> _cachePlans(String jsonBody) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('cached_plans', jsonBody);
  }

  /// Load cached plans (offline fallback).
  Future<List<PlanModel>> _loadCachedPlans() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString('cached_plans');
    if (cached == null) return [];
    try {
      final data = jsonDecode(cached);
      final plansJson = (data['plans'] ?? []) as List;
      return plansJson
          .map((p) => PlanModel.fromJson(p as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }
}
