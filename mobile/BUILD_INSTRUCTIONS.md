# ReplyOS Mobile App — Build Instructions

This ZIP contains the complete Flutter source code for the ReplyOS mobile app.

## ✦ Requirements

- **Flutter SDK** ≥ 3.22 — https://docs.flutter.dev/get-started/install
- **Java JDK** 17+ (Android Studio bundles it)
- **Android SDK** (via Android Studio → SDK Manager)
  - compileSdk 35, minSdk 21, targetSdk 35
- **Android Studio** (recommended) OR command-line `flutter` + `adb`

Verify after install:
```bash
flutter doctor
flutter --version
```

## ✦ First-time Setup

1. Unzip this file:
   ```bash
   unzip replyos-mobile-source.zip
   cd replyos-mobile-source
   ```

2. Get the dependencies:
   ```bash
   flutter pub get
   ```

3. Add the Firebase config file (`google-services.json`) you already have at:
   ```
   android/app/google-services.json
   ```
   (Without it, the app will compile but Firebase Auth/Google Sign-In will fail at runtime.)

4. Make sure your `lib/core/config/app_config.dart` points at the live dashboard:
   ```dart
   static const String backendBaseUrl = 'https://replyos-bbbmu.vercel.app';
   ```

## ✦ Build APK for All Android Devices (Recommended)

A "fat APK" that contains native libs for **arm64-v8a + armeabi-v7a + x86_64** — runs on any Android device (old, modern, emulator).

```bash
flutter build apk --release --no-tree-shake-icons
```

Output:
```
build/app/outputs/flutter-apk/app-release.apk   (~ 9–12 MB)
```

Install on a connected device:
```bash
flutter install
# or
adb install build/app/outputs/flutter-apk/app-release.apk
```

## ✦ Build Per-ABI APKs (Smaller per-device size)

Produces 3 separate APKs — each device downloads only the one it needs.

```bash
flutter build apk --release --split-per-abi --no-tree-shake-icons
```

Outputs:
```
app-armeabi-v7a-release.apk   (~5 MB)  →  32-bit ARM (old phones)
app-arm64-v8a-release.apk     (~4 MB)  →  64-bit ARM (most modern phones)
app-x86_64-release.apk        (~6 MB)  →  emulators / Chromebooks
```

## ✦ Build App Bundle (AAB) for Google Play

Required by Google Play Store — generates a single `.aab` and Google serves optimized APKs per device.

```bash
flutter build appbundle --release --no-tree-shake-icons
```

Output:
```
build/app/outputs/bundle/release/app-release.aab
```

Upload to: https://play.google.com/console

## ✦ Build for iOS (Requires macOS + Xcode)

```bash
flutter build ios --release --no-codesign
```

Then open `ios/Runner.xcworkspace` in Xcode, set your signing team, and archive.

> iOS builds cannot be produced on Linux/Windows. You need a Mac.

## ✦ Build for Web

```bash
flutter build web --release
```

Output: `build/web/` (deploy to any static host).

## ✦ Run in Debug Mode (Live Reload)

```bash
flutter run                    # auto-detect device
flutter run -d chrome          # web
flutter run -d emulator-5554   # specific emulator
```

## ✦ Common Issues

### 1. `google-services.json` not found
Place it at `android/app/google-services.json`. Get it from Firebase Console →
Project Settings → Your apps → Android app → Download config.

### 2. `minSdkVersion` conflict
Open `android/app/build.gradle` and ensure:
```gradle
android {
    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 35
        multiDexEnabled true
    }
}
```

### 3. Google Sign-In fails
Make sure your **SHA-1** fingerprint is added in Firebase Console →
Project Settings → Your apps → Android app → Add fingerprint.
On debug builds, also add the debug SHA-1:
```bash
cd android
./gradlew signingReport
```

### 4. Network calls fail on Android 9+
Ensure `android/app/src/main/AndroidManifest.xml` has:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<application
    android:usesCleartextTraffic="true"
    ... >
```
(Vercel uses HTTPS so cleartext is not strictly needed, but keep it for local testing.)

### 5. App crashes immediately on launch
- Check `flutter doctor` for missing tools
- Check `adb logcat -s flutter` for the stack trace
- 90% of the time it's a missing `google-services.json` or a wrong package name
  (must be `com.replyme.replyme` — see `android/app/build.gradle` `applicationId`)

## ✦ Backend / Dashboard

The mobile app talks to the ReplyOS dashboard deployed on Vercel:
- Base URL: `https://replyos-bbbmu.vercel.app`
- Public APIs: `/api/public/auth/*`, `/api/public/plans`, `/api/public/me`,
  `/api/public/whatsapp/*`, `/api/public/subscribe`
- WhatsApp bridge (Baileys) runs on a separate Ubuntu server at `http://13.60.186.223`
  and is proxied through the dashboard.

## ✦ Project Structure

```
lib/
├── core/
│   ├── config/      → app_config.dart (backend URL, prefs keys)
│   ├── services/    → auth, whatsapp, plans, ai, database, storage
│   ├── theme/       → app_colors.dart
│   └── models/      → user_model.dart
├── features/
│   ├── auth/        → login, signup, forgot password
│   ├── home/        → main dashboard
│   ├── whatsapp/    → connection screen (pairing + status)
│   ├── subscription/→ plans screen
│   ├── ai_assistant/
│   ├── analytics/
│   ├── contacts/
│   ├── rules/
│   ├── reply_settings/
│   ├── uploads/
│   ├── api_settings/
│   ├── settings/
│   ├── profile_setup/
│   ├── onboarding/
│   └── splash/
└── shared/
    └── widgets/     → reusable UI components
```

## ✦ Build Command Cheat Sheet

| Goal | Command | Output |
|------|---------|--------|
| Fat APK (all devices) | `flutter build apk --release --no-tree-shake-icons` | `app-release.apk` (~10 MB) |
| Per-ABI APKs | `flutter build apk --release --split-per-abi --no-tree-shake-icons` | 3 APKs |
| Play Store AAB | `flutter build appbundle --release --no-tree-shake-icons` | `app-release.aab` |
| iOS | `flutter build ios --release` (macOS only) | `.app` |
| Web | `flutter build web --release` | `build/web/` |

---

Built with ❤️ — ReplyOS 2026
