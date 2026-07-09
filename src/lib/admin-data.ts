/**
 * Server-side data helpers for admin dashboard.
 * Reads from Firebase Realtime Database via Admin SDK.
 * Falls back to seed data if Firebase is unreachable (local dev without service account).
 */
import { adminDb } from "./firebase-admin";
import { DEFAULT_PLANS, DEFAULT_FEATURE_FLAGS } from "./constants";

export interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  aiRepliesToday: number;
  storageUsedMb: number;
  totalRevenue: number;
  messagesToday: number;
  activeRules: number;
  whatsappConnected: number;
}

export interface RecentActivity {
  id: string;
  type: "user" | "subscription" | "ai" | "upload" | "rule" | "whatsapp";
  message: string;
  timestamp: number;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  plan: string;
  status: "active" | "suspended" | "trial";
  createdAt: number;
  lastActive: number;
  repliesThisMonth: number;
  storageUsedMb: number;
}

export interface PlanData {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  currency: string;
  interval: string;
  repliesLimit: number;
  storageLimitMb: number;
  features: string[];
  featuresAr: string[];
  popular: boolean;
  subscriberCount: number;
}

export interface SubscriptionData {
  id: string;
  userId: string;
  userEmail: string;
  planId: string;
  planName: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  currentPeriodEnd: number;
  amount: number;
  currency: string;
}

export interface AIProviderData {
  id: string;
  name: string;
  provider: string;
  model: string;
  isActive: boolean;
  isDefault: boolean;
  apiKeyMasked: string;
  endpoint: string;
  usageThisMonth: number;
}

export interface FileData {
  id: string;
  name: string;
  type: "image" | "document" | "audio" | "video" | "other";
  size: number;
  uploadedBy: string;
  uploadedAt: number;
  url: string;
  category: string;
}

export interface LogData {
  id: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  source: string;
  timestamp: number;
  meta?: Record<string, unknown>;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: number;
}

/**
 * Ensure the database has seed data. Safe to call multiple times.
 */
export async function ensureSeedData() {
  try {
    const db = adminDb();
    const plansRef = db.ref("plans");
    const plansSnap = await plansRef.get();
    if (!plansSnap.exists()) {
      await plansRef.set(DEFAULT_PLANS);
    }

    const flagsRef = db.ref("featureFlags");
    const flagsSnap = await flagsRef.get();
    if (!flagsSnap.exists()) {
      await flagsRef.set(DEFAULT_FEATURE_FLAGS);
    }

    const settingsRef = db.ref("settings/app");
    const settingsSnap = await settingsRef.get();
    if (!settingsSnap.exists()) {
      await settingsRef.set({
        appName: "ReplyOS",
        defaultLanguage: "ar",
        defaultTheme: "light",
        maintenanceMode: false,
        signupEnabled: true,
        createdAt: Date.now(),
      });
    }
  } catch {
    // Firebase not configured (no service account in dev) — skip seeding
  }
}

/**
 * Get dashboard stats. Falls back to demo data if Firebase unavailable.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const db = adminDb();
    const [usersSnap, subsSnap, analyticsSnap, uploadsSnap] = await Promise.all([
      db.ref("users").get(),
      db.ref("subscriptions").get(),
      db.ref("analytics/daily").get(),
      db.ref("uploads").get(),
    ]);

    const users = usersSnap.val() || {};
    const subs = subsSnap.val() || {};
    const analytics = analyticsSnap.val() || {};
    const uploads = uploadsSnap.val() || {};

    const today = new Date().toISOString().split("T")[0];
    const todayAnalytics = (analytics as Record<string, Record<string, { replies?: number; messages?: number }>>)[today] || {};

    let aiRepliesToday = 0;
    let messagesToday = 0;
    for (const uid in todayAnalytics) {
      aiRepliesToday += todayAnalytics[uid]?.replies || 0;
      messagesToday += todayAnalytics[uid]?.messages || 0;
    }

    let storageUsedMb = 0;
    const uploadsObj = uploads as Record<string, Record<string, { size?: number }>>;
    for (const uid in uploadsObj) {
      for (const fid in uploadsObj[uid]) {
        storageUsedMb += (uploadsObj[uid][fid]?.size || 0) / (1024 * 1024);
      }
    }

    const activeSubs = Object.values(subs as Record<string, { status?: string }>).filter(
      (s) => s.status === "active" || s.status === "trialing"
    ).length;

    const totalRevenue = Object.values(subs as Record<string, { status?: string; amount?: number }>)
      .filter((s) => s.status === "active" || s.status === "trialing")
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    return {
      totalUsers: Object.keys(users).length,
      activeSubscriptions: activeSubs,
      aiRepliesToday,
      storageUsedMb: Math.round(storageUsedMb),
      totalRevenue,
      messagesToday,
      activeRules: 0,
      whatsappConnected: 0,
    };
  } catch {
    // No fake fallback — return zeros so the dashboard shows real data
    return {
      totalUsers: 0,
      activeSubscriptions: 0,
      aiRepliesToday: 0,
      storageUsedMb: 0,
      totalRevenue: 0,
      messagesToday: 0,
      activeRules: 0,
      whatsappConnected: 0,
    };
  }
}

export async function getUsers(): Promise<UserData[]> {
  try {
    const db = adminDb();
    const snap = await db.ref("users").get();
    const users = snap.val() || {};
    return Object.entries(users).map(([id, u]) => {
      const user = u as Record<string, unknown>;
      return {
        id,
        email: (user.email as string) || "—",
        name: (user.name as string) || "—",
        plan: ((user.subscription as { planId?: string })?.planId) || "free",
        status: ((user.subscription as { status?: string })?.status as UserData["status"]) || "trial",
        createdAt: (user.createdAt as number) || Date.now(),
        lastActive: (user.lastActive as number) || Date.now(),
        repliesThisMonth: (user.repliesThisMonth as number) || 0,
        storageUsedMb: (user.storageUsedMb as number) || 0,
      };
    });
  } catch {
    // No fake fallback — return empty array
    return [];
  }
}

export async function getPlans(): Promise<PlanData[]> {
  try {
    const db = adminDb();
    await ensureSeedData();
    const snap = await db.ref("plans").get();
    const plans = snap.val() || DEFAULT_PLANS;

    // Get subscriber counts
    const subsSnap = await db.ref("subscriptions").get();
    const subs = subsSnap.val() || {};
    const counts: Record<string, number> = {};
    for (const s of Object.values(subs as Record<string, { planId?: string; status?: string }>)) {
      if (s.status === "active" || s.status === "trialing") {
        counts[s.planId || "free"] = (counts[s.planId || "free"] || 0) + 1;
      }
    }

    if (Array.isArray(plans)) {
      return plans.map((p: PlanData) => ({ ...p, subscriberCount: counts[p.id] || 0 }));
    }
    return Object.values(plans as Record<string, PlanData>).map((p) => ({
      ...p,
      subscriberCount: counts[p.id] || 0,
    }));
  } catch {
    // No fake fallback — return default plans with 0 subscribers
    return DEFAULT_PLANS.map((p) => ({ ...p, subscriberCount: 0 }));
  }
}

export async function getSubscriptions(): Promise<SubscriptionData[]> {
  try {
    const db = adminDb();
    const [subsSnap, usersSnap] = await Promise.all([
      db.ref("subscriptions").get(),
      db.ref("users").get(),
    ]);
    const subs = subsSnap.val() || {};
    const users = usersSnap.val() || {};

    return Object.entries(subs).map(([id, s]) => {
      const sub = s as Record<string, unknown>;
      const userId = (sub.userId as string) || "";
      const user = (users as Record<string, Record<string, unknown>>)[userId];
      return {
        id,
        userId,
        userEmail: (user?.email as string) || "—",
        planId: (sub.planId as string) || "free",
        planName: (sub.planName as string) || "Free",
        status: (sub.status as SubscriptionData["status"]) || "trialing",
        currentPeriodEnd: (sub.currentPeriodEnd as number) || Date.now(),
        amount: (sub.amount as number) || 0,
        currency: (sub.currency as string) || "USD",
      };
    });
  } catch {
    // No fake fallback — return empty array
    return [];
  }
}

export async function getAIProviders(): Promise<AIProviderData[]> {
  try {
    const db = adminDb();
    const snap = await db.ref("aiProviders").get();
    const providers = snap.val();
    if (!providers || (typeof providers === "object" && Object.keys(providers).length === 0)) {
      return [];
    }
    if (Array.isArray(providers)) {
      return providers.map((p: Record<string, unknown>) => ({
        id: (p.id as string) || "",
        name: (p.name as string) || "",
        provider: (p.provider as string) || "zai",
        model: (p.model as string) || "",
        isActive: Boolean(p.isActive),
        isDefault: Boolean(p.isDefault),
        apiKeyMasked: maskApiKey((p.apiKey as string) || ""),
        endpoint: (p.endpoint as string) || "",
        usageThisMonth: (p.usageThisMonth as number) || 0,
      }));
    }
    return Object.values(providers as Record<string, Record<string, unknown>>).map((p) => ({
      id: (p.id as string) || "",
      name: (p.name as string) || "",
      provider: (p.provider as string) || "zai",
      model: (p.model as string) || "",
      isActive: Boolean(p.isActive),
      isDefault: Boolean(p.isDefault),
      apiKeyMasked: maskApiKey((p.apiKey as string) || ""),
      endpoint: (p.endpoint as string) || "",
      usageThisMonth: (p.usageThisMonth as number) || 0,
    }));
  } catch {
    return [];
  }
}

function maskApiKey(key: string): string {
  if (!key) return "••••••••";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

export async function getFiles(): Promise<FileData[]> {
  try {
    const db = adminDb();
    const snap = await db.ref("uploads").get();
    const uploads = snap.val() || {};
    const files: FileData[] = [];
    for (const uid in uploads as Record<string, Record<string, Record<string, unknown>>>) {
      for (const fid in uploads[uid]) {
        const f = uploads[uid][fid];
        files.push({
          id: fid,
          name: (f.name as string) || "unnamed",
          type: ((f.type as string) || "other") as FileData["type"],
          size: (f.size as number) || 0,
          uploadedBy: uid,
          uploadedAt: (f.uploadedAt as number) || Date.now(),
          url: (f.url as string) || "",
          category: (f.category as string) || "general",
        });
      }
    }
    return files.sort((a, b) => b.uploadedAt - a.uploadedAt);
  } catch {
    // No fake fallback — return empty array
    return [];
  }
}

export async function getLogs(): Promise<LogData[]> {
  try {
    const db = adminDb();
    const snap = await db.ref("logs").orderByChild("timestamp").limitToLast(100).get();
    const logs = snap.val() || {};
    return Object.entries(logs).map(([id, l]) => {
      const log = l as Record<string, unknown>;
      return {
        id,
        level: (log.level as LogData["level"]) || "info",
        message: (log.message as string) || "",
        source: (log.source as string) || "system",
        timestamp: (log.timestamp as number) || Date.now(),
        meta: log.meta as Record<string, unknown>,
      };
    }).sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    // No fake fallback — return empty array
    return [];
  }
}

export async function getNotifications(): Promise<NotificationData[]> {
  try {
    const db = adminDb();
    const snap = await db.ref("notifications").orderByChild("createdAt").limitToLast(50).get();
    const notifs = snap.val() || {};
    return Object.entries(notifs).map(([id, n]) => {
      const notif = n as Record<string, unknown>;
      return {
        id,
        title: (notif.title as string) || "",
        message: (notif.message as string) || "",
        type: (notif.type as NotificationData["type"]) || "info",
        read: (notif.read as boolean) || false,
        createdAt: (notif.createdAt as number) || Date.now(),
      };
    }).sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    // No fake fallback — return empty array
    return [];
  }
}

export async function getFeatureFlags() {
  try {
    const db = adminDb();
    await ensureSeedData();
    const snap = await db.ref("featureFlags").get();
    const flags = snap.val();
    if (!flags) return DEFAULT_FEATURE_FLAGS;
    if (Array.isArray(flags)) return flags;
    return Object.values(flags);
  } catch {
    return DEFAULT_FEATURE_FLAGS;
  }
}

export async function getSettings() {
  try {
    const db = adminDb();
    await ensureSeedData();
    const snap = await db.ref("settings/app").get();
    return snap.val() || {
      appName: "ReplyOS",
      defaultLanguage: "ar",
      defaultTheme: "light",
      maintenanceMode: false,
      signupEnabled: true,
    };
  } catch {
    return {
      appName: "ReplyOS",
      defaultLanguage: "ar",
      defaultTheme: "light",
      maintenanceMode: false,
      signupEnabled: true,
    };
  }
}

// --- Demo data generators (used when Firebase is not configured) ---

function generateDemoUsers(): UserData[] {
  const names = ["Ahmed Ali", "Sara Mohamed", "Khalid Hassan", "Fatima Zahra", "Omar Saleh", "Layla Ibrahim", "Yusuf Rahman", "Aisha Noor", "Hassan Karim", "Maryam Said"];
  const plans = ["free", "pro", "business"];
  const statuses: UserData["status"][] = ["active", "trial", "active", "active", "suspended"];
  return names.map((name, i) => ({
    id: `user_${i}`,
    email: name.toLowerCase().replace(" ", ".") + "@example.com",
    name,
    plan: plans[i % 3],
    status: statuses[i % 5],
    createdAt: Date.now() - (i + 1) * 86400000 * 7,
    lastActive: Date.now() - i * 3600000,
    repliesThisMonth: Math.floor(Math.random() * 5000),
    storageUsedMb: Math.floor(Math.random() * 2048),
  }));
}

function generateDemoSubscriptions(): SubscriptionData[] {
  const plans = [
    { id: "free", name: "Free", amount: 0 },
    { id: "pro", name: "Pro", amount: 19 },
    { id: "business", name: "Business", amount: 49 },
  ];
  const statuses: SubscriptionData["status"][] = ["active", "trialing", "active", "canceled", "past_due"];
  return Array.from({ length: 12 }, (_, i) => {
    const plan = plans[i % 3];
    return {
      id: `sub_${i}`,
      userId: `user_${i}`,
      userEmail: `user${i}@example.com`,
      planId: plan.id,
      planName: plan.name,
      status: statuses[i % 5],
      currentPeriodEnd: Date.now() + (i + 5) * 86400000,
      amount: plan.amount,
      currency: "USD",
    };
  });
}

function getDefaultProviders(): AIProviderData[] {
  return [
    {
      id: "zai_default",
      name: "Z.ai Default",
      provider: "zai",
      model: "glm-4.6",
      isActive: true,
      isDefault: true,
      apiKeyMasked: "••••••••",
      endpoint: "https://api.z.ai/api/paas/v4",
      usageThisMonth: 1248932,
    },
    {
      id: "openai_main",
      name: "OpenAI GPT-4o",
      provider: "openai",
      model: "gpt-4o",
      isActive: false,
      isDefault: false,
      apiKeyMasked: "sk-••••••••••••Xq2p",
      endpoint: "https://api.openai.com/v1",
      usageThisMonth: 0,
    },
  ];
}

function generateDemoFiles(): FileData[] {
  const types: FileData["type"][] = ["image", "document", "audio", "video", "image", "document"];
  const names = ["product_catalog.pdf", "store_front.jpg", "price_list.xlsx", "welcome_audio.mp3", "promo_video.mp4", "invoice_template.docx"];
  return names.map((name, i) => ({
    id: `file_${i}`,
    name,
    type: types[i],
    size: Math.floor(Math.random() * 5_000_000) + 100_000,
    uploadedBy: `user_${i % 5}`,
    uploadedAt: Date.now() - i * 3600000,
    url: "",
    category: i % 2 === 0 ? "business" : "media",
  }));
}

function generateDemoLogs(): LogData[] {
  const levels: LogData["level"][] = ["info", "info", "warn", "error", "info", "debug", "warn"];
  const messages = [
    "User signed in successfully",
    "AI reply generated for WhatsApp message",
    "Rate limit approaching threshold",
    "Failed to connect to WhatsApp API",
    "Subscription renewed successfully",
    "Cache invalidated for user settings",
    "Storage quota at 80% for user",
    "Webhook received from WhatsApp",
    "New file uploaded to Firebase Storage",
    "Rule engine matched condition",
  ];
  const sources = ["auth", "ai", "whatsapp", "subscription", "storage", "rules", "webhook"];
  return messages.flatMap((msg, i) =>
    Array.from({ length: 3 }, (_, j) => ({
      id: `log_${i}_${j}`,
      level: levels[(i + j) % 7],
      message: msg,
      source: sources[i % sources.length],
      timestamp: Date.now() - (i * 3 + j) * 60000,
    }))
  );
}

function generateDemoNotifications(): NotificationData[] {
  const types: NotificationData["type"][] = ["info", "success", "warning", "error"];
  return [
    { id: "n1", title: "New subscription", message: "A user upgraded to Pro plan", type: "success", read: false, createdAt: Date.now() - 300000 },
    { id: "n2", title: "Storage warning", message: "Firebase Storage at 75% capacity", type: "warning", read: false, createdAt: Date.now() - 1800000 },
    { id: "n3", title: "AI provider issue", message: "OpenAI API rate limit exceeded", type: "error", read: false, createdAt: Date.now() - 3600000 },
    { id: "n4", title: "New user signup", message: "5 new users registered today", type: "info", read: true, createdAt: Date.now() - 7200000 },
    { id: "n5", title: "Backup complete", message: "Daily database backup completed", type: "success", read: true, createdAt: Date.now() - 86400000 },
  ];
}
