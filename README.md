# ReplyOS — AI Assistant for WhatsApp Business

> **Premium AI assistant that helps WhatsApp business users automate replies, manage rules, and grow their business.**

Arabic-first · Flutter mobile + Next.js admin/server · Firebase Realtime Database + Storage · Official WhatsApp Business Cloud API

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Firebase Setup](#firebase-setup)
5. [Local Development](#local-development)
6. [Vercel Deployment](#vercel-deployment)
7. [Admin Login](#admin-login)
8. [WhatsApp Business API Setup](#whatsapp-business-api-setup)
9. [Environment Variables Reference](#environment-variables-reference)
10. [API Reference](#api-reference)

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────────────────────────────┐
│  Flutter App    │────▶│  Next.js Admin + Server (Vercel)         │
│  (mobile)       │     │  https://replyos-1.vercel.app            │
│                 │     │                                          │
│  - Auth         │     │  - Admin Dashboard (15 pages)            │
│  - AI Assistant │     │  - API Routes                            │
│  - WhatsApp     │     │  - AI Provider Abstraction               │
│  - Rules        │     │  - WhatsApp Webhook Handler              │
│  - Uploads      │     │  - File Upload Handler                   │
└────────┬────────┘     └──────────────┬───────────────────────────┘
         │                             │
         │         ┌───────────────────┘
         ▼         ▼
┌──────────────────────────────────────┐
│  Firebase                             │
│  - Authentication (Google, Email)     │
│  - Realtime Database (structured data)│
│  - Storage (files, images, media)     │
└──────────────────────────────────────┘
```

**Tech Stack:**
- **Mobile:** Flutter, Dart, Material 3, Provider, google_fonts (Cairo)
- **Web/Admin:** Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend:** Firebase Admin SDK, Next.js API Routes (serverless)
- **Database:** Firebase Realtime Database (NOT Firestore)
- **Storage:** Firebase Storage
- **AI:** Z.ai (default), OpenAI, Anthropic, Google AI, Custom endpoints
- **WhatsApp:** Official WhatsApp Business Cloud API

---

## Project Structure

```
replyos/
├── src/                          # Next.js web admin + server
│   ├── app/
│   │   ├── page.tsx              # Root redirect
│   │   ├── login/                # Admin login page
│   │   ├── dashboard/            # All 15 admin pages
│   │   │   ├── page.tsx          # Overview
│   │   │   ├── users/
│   │   │   ├── plans/
│   │   │   ├── subscriptions/
│   │   │   ├── ai-providers/
│   │   │   ├── files/
│   │   │   ├── storage/
│   │   │   ├── logs/
│   │   │   ├── notifications/
│   │   │   ├── settings/
│   │   │   ├── system-health/
│   │   │   ├── security/
│   │   │   ├── support/
│   │   │   ├── feature-flags/
│   │   │   └── backups/
│   │   └── api/
│   │       ├── auth/             # Login/Logout
│   │       ├── ai/               # AI chat + test
│   │       ├── whatsapp/         # Webhook + send message
│   │       ├── upload/           # File upload to Firebase Storage
│   │       └── analytics/        # Analytics data
│   ├── components/
│   │   ├── admin/                # Admin UI components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── theme-provider.tsx
│   │   └── language-provider.tsx # Arabic/English i18n + RTL
│   └── lib/
│       ├── firebase.ts           # Client SDK
│       ├── firebase-admin.ts     # Admin SDK (server)
│       ├── admin-auth.ts         # Admin session management
│       ├── admin-data.ts         # Data access layer
│       ├── ai-provider.ts        # AI provider abstraction
│       └── constants.ts          # Nav, plans, tones, flags
├── mobile/                       # Flutter mobile app
│   ├── lib/
│   │   ├── main.dart
│   │   ├── core/
│   │   │   ├── theme/
│   │   │   ├── config/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   └── utils/
│   │   ├── features/             # 18 screens
│   │   └── shared/
│   │       ├── widgets/
│   │       └── layouts/
│   └── pubspec.yaml
├── prisma/                       # Prisma schema (local admin auth)
├── .env.example
├── vercel.json
└── README.md
```

---

## Prerequisites

- **Node.js** 20+ and **Bun** (for web)
- **Flutter** 3.22+ (for mobile)
- **Firebase** project (free tier works)
- **Meta Business Account** (for WhatsApp API)
- **Vercel** account (free tier works)

---

## Firebase Setup

1. **Create a Firebase project** at [console.firebase.google.com](https://console.firebase.google.com)

2. **Enable services:**
   - **Authentication** → Sign-in methods → Enable **Email/Password** and **Google**
   - **Realtime Database** → Create database (start in test mode, tighten rules later)
   - **Storage** → Get started (start in test mode, tighten rules later)

3. **Get your config:**
   - Project Settings → General → Your apps → Web app
   - Copy the `firebaseConfig` values

4. **Generate a Service Account key** (for server-side admin access):
   - Project Settings → Service Accounts → Generate new private key
   - Save the JSON file — you'll need it for `FIREBASE_SERVICE_ACCOUNT`

5. **Set up Realtime Database rules:**
   ```json
   {
     "rules": {
       "users": {
         "$uid": {
           ".read": "auth.uid === $uid || auth.token.admin === true",
           ".write": "auth.uid === $uid || auth.token.admin === true"
         }
       },
       "plans": { ".read": true },
       "featureFlags": { ".read": true },
       "settings": { ".read": true },
       "aiProviders": { ".read": "auth.token.admin === true" },
       "logs": { ".read": "auth.token.admin === true" },
       "subscriptions": {
         "$uid": { ".read": "auth.uid === $uid || auth.token.admin === true" }
       }
     }
   }
   ```

---

## Local Development

### Web Admin + Server

```bash
# 1. Install dependencies
bun install

# 2. Copy env file and fill in values
cp .env.example .env
# Edit .env with your Firebase config

# 3. Run the dev server
bun run dev
# Open http://localhost:3000

# 4. Run lint
bun run lint
```

### Flutter Mobile

```bash
cd mobile

# Install dependencies
flutter pub get

# Run the app
flutter run

# Build APK
flutter build apk --release

# Build iOS
flutter build ios --release
```

---

## Vercel Deployment

1. **Push your code** to GitHub/GitLab/Bitbucket

2. **Import the project** at [vercel.com/new](https://vercel.com/new)

3. **Set environment variables** in Vercel dashboard:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
   
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}  (full JSON as one line)
   
   ADMIN_BOOTSTRAP_EMAIL=admin@replyos.com
   ADMIN_BOOTSTRAP_PASSWORD=YourSecurePassword2025!
   
   NEXT_PUBLIC_APP_URL=https://replyos-1.vercel.app
   WHATSAPP_VERIFY_TOKEN=your_custom_verify_token
   ```

4. **Deploy** — Vercel auto-detects Next.js

5. **Set up WhatsApp webhook** (after deployment):
   - Go to Meta Business → WhatsApp Manager → Configuration
   - Webhook URL: `https://replyos-1.vercel.app/api/whatsapp/webhook`
   - Verify Token: the value you set in `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to: `messages`, `message_status`

---

## Admin Login

The admin panel is at `/dashboard`. Default credentials:

```
Email:    admin@replyos.com
Password: ReplyOS2025!
```

**Change these immediately** by updating the `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` environment variables.

---

## WhatsApp Business API Setup

ReplyOS uses **only the official WhatsApp Business Cloud API** (no unofficial methods).

1. **Create a Meta Business Account** at [business.facebook.com](https://business.facebook.com)

2. **Create a WhatsApp Business app** in [developers.facebook.com](https://developers.facebook.com)

3. **Get credentials:**
   - **Phone Number ID** — from WhatsApp API Setup
   - **Access Token** — System User token with `whatsapp_business_messaging` permission
   - **Webhook Verify Token** — any custom string you choose

4. **Configure webhook:**
   - URL: `https://replyos-1.vercel.app/api/whatsapp/webhook`
   - Verify Token: matches your `WHATSAPP_VERIFY_TOKEN` env var
   - Subscribe to: `messages`, `message_status`

5. **In the mobile app**, users enter their Phone Number ID and Access Token in the WhatsApp Connection screen. These are stored in Firebase RTDB under `/customApiKeys/{uid}/whatsapp`.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Yes | Realtime Database URL |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | No | Analytics measurement ID |
| `FIREBASE_SERVICE_ACCOUNT` | Yes (prod) | Full service account JSON (one line) |
| `ADMIN_BOOTSTRAP_EMAIL` | Yes | Admin login email |
| `ADMIN_BOOTSTRAP_PASSWORD` | Yes | Admin login password |
| `NEXT_PUBLIC_APP_URL` | Yes | Your Vercel domain |
| `WHATSAPP_VERIFY_TOKEN` | No | Custom token for webhook verification |

---

## API Reference

### Authentication
- `POST /api/auth/login` — Admin login (sets httpOnly cookie)
- `POST /api/auth/logout` — Clear admin session

### AI
- `POST /api/ai/chat` — Chat with AI (body: `{ messages, tone, length, providerId, userId }`)
- `POST /api/ai/test` — Test default AI provider connection

### WhatsApp
- `GET /api/whatsapp/webhook` — Webhook verification
- `POST /api/whatsapp/webhook` — Receive incoming messages
- `POST /api/whatsapp/send-message` — Send a message (body: `{ to, message, phoneNumberId, accessToken }`)

### Files
- `POST /api/upload` — Upload file to Firebase Storage (multipart form)

### Analytics
- `GET /api/analytics?range=daily|weekly|monthly&userId=...` — Get analytics data

---

## AI Provider Abstraction

ReplyOS supports multiple AI providers through a unified interface:

| Provider | Status | Models |
|----------|--------|--------|
| **Z.ai** | ✅ Default (built-in) | GLM-4.6 |
| **OpenAI** | ✅ Supported (user API key) | GPT-4o, GPT-4o-mini, etc. |
| **Anthropic** | ✅ Supported (user API key) | Claude 3.5 Sonnet, etc. |
| **Google AI** | ✅ Supported (user API key) | Gemini 1.5 Pro, etc. |
| **Custom** | ✅ Any OpenAI-compatible endpoint | Any |

Users can:
- Use the app's default Z.ai key (no setup required)
- Add their own API key in Settings → API Settings
- Switch providers anytime
- Set a fallback provider

---

## License

This project is proprietary. All rights reserved.

---

Built with care for Arabic-first business users.
