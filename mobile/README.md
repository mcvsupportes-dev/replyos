# ReplyOS — Mobile App (Flutter)

ReplyOS is an AI assistant app for WhatsApp business users. This Flutter app is **Arabic-first** with full **RTL** support, powered by **Firebase** (Auth, Realtime Database, Storage) and connects to the ReplyOS Next.js backend (`https://replyos-bbbmu.vercel.app`).

## Features

- Arabic-first UI with RTL by default
- Material 3 design system with emerald-green primary color
- Onboarding flow (4 slides)
- Authentication: Email/Password, Google Sign-In, Guest mode (local)
- Profile setup wizard (name, age, profession, location)
- Home dashboard (AI status, WhatsApp status, counts, quick actions)
- AI Assistant chat (calls `/api/ai/chat` on the backend)
- WhatsApp Business Cloud API connection flow
- Reply settings (toggle AI, tone, length, working hours, delay) → Firebase RTDB
- Natural-language rules engine (CRUD)
- Contacts browser
- File & image uploads (Firebase Storage)
- Custom AI API key settings (provider/model selection, test connection)
- Analytics dashboard
- Subscription tiers (Free / Pro / Business)
- App settings: language toggle, theme, RTL/LTR, notifications, privacy, logout, clear cache

## Tech Stack

| Layer            | Choice                                            |
|------------------|---------------------------------------------------|
| Framework        | Flutter 3.19+                                     |
| Language         | Dart 3                                            |
| State Management | `provider`                                         |
| Backend          | Firebase Auth + Realtime Database + Storage       |
| AI / WhatsApp    | Next.js backend API (`https://replyos-bbbmu.vercel.app`) |
| Notifications    | `flutter_local_notifications`                     |
| Fonts            | Cairo (via `google_fonts`)                         |
| Icons            | `lucide_icons`                                    |

## Project Structure

```
lib/
  main.dart
  core/
    theme/        app_theme.dart, app_colors.dart, app_text_styles.dart
    config/       firebase_config.dart, app_config.dart
    services/     auth_service.dart, database_service.dart,
                  storage_service.dart, ai_service.dart, whatsapp_service.dart
    models/       user_model.dart, rule_model.dart, message_model.dart,
                  file_model.dart, settings_model.dart
    utils/        validators.dart, extensions.dart, constants.dart
  features/
    splash/  onboarding/  auth/  profile_setup/  home/
    ai_assistant/  whatsapp/  reply_settings/  rules/  contacts/
    uploads/  api_settings/  analytics/  subscription/  settings/
  shared/
    widgets/  layouts/
```

## Setup

```bash
cd mobile
flutter pub get
flutter run
```

## Backend API

- `POST /api/ai/chat` — AI chat completion (body: `{ messages, tone, length, providerId }`)
- `POST /api/whatsapp/send-message` — Send a WhatsApp message

Both endpoints are called via relative paths through the app's configured base URL (`https://replyos-bbbmu.vercel.app`).

## Notes

- Guest mode uses `shared_preferences` for local persistence (no Firebase account).
- Profile setup writes to `/profiles/{uid}` in Firebase Realtime Database.
- Theme, language, and RTL preferences persist locally via `shared_preferences`.
