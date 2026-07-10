# PLAN: Android Play Store Release

**Rank: #5.** In-flight work signals: `AndroidManifest.xml` just gained `POST_NOTIFICATIONS` (uncommitted), `public/play-store-feature-graphic.html` is a fresh untracked asset, and `android/app/build.gradle` sits at versionCode 1 / versionName "1.0". iOS already shipped via Capacitor; Android is the untapped distribution channel. Ranked last because it has the most external friction (Play Console review, signing, assets) and the least compounding effect on the product itself.

## Goal

Vibe Rise (consumer app, `com.nichuzz.viberise`) live on Google Play internal testing track, promotable to production.

## Current state (verified 2026-07-08)

- `android/` Capacitor project exists; `versionCode 1`, `versionName "1.0"`.
- `POST_NOTIFICATIONS` permission added to manifest (uncommitted) — implies push is intended on Android.
- Feature graphic being designed at `public/play-store-feature-graphic.html` (needs rendering to 1024×500 PNG).
- Unknown: signing keystore existence, applicationId, notification delivery mechanism on Android. Verify all in step 1.

## Steps (in order)

1. **Audit the Android project.** Check `android/app/build.gradle` for `applicationId` (expect `com.nichuzz.viberise`), `targetSdkVersion` (Play requires API 34+ for new apps in 2026 — confirm current requirement), and whether a release `signingConfig` / keystore exists. Check `capacitor.config.json` server config points at the production bundle, not a dev URL.
2. **Resolve push notifications honestly.** The app uses Web Push (`push_subscriptions`, VAPID keys) which works in browsers, but inside a Capacitor WebView, web push does NOT work — Android needs FCM via `@capacitor/push-notifications`. Decide with Nic: (a) ship v1 WITHOUT push on Android (remove or keep the permission but don't prompt), or (b) do the FCM integration first (Firebase project, google-services.json, plugin wiring, server-side FCM sends alongside VAPID). Option (a) ships weeks earlier; recommend it and note (b) as follow-up. Do not ship a notification prompt that can never deliver.
3. **Create the signing keystore** (if none): `keytool -genkey -v -keystore viberise-release.keystore -alias viberise -keyalg RSA -keysize 2048 -validity 10000`. **Store the keystore + passwords somewhere Nic controls (password manager) and NEVER commit it.** Add `*.keystore` to `.gitignore`. Losing it means losing the app identity — say this to Nic explicitly. Prefer Play App Signing (upload key model) so Google holds the final signing key.
4. **Build:** `npm run build && npx cap sync android`, then in `android/`: `./gradlew bundleRelease` → signed `.aab`. Test the release build on a device/emulator (`./gradlew installRelease` needs a signed config, or use bundletool) — WebView behavior differs from Chrome; specifically test auth redirect flow, safe-area insets, and back-button behavior (Android hardware back should navigate, not exit — check Capacitor's back-button handling).
5. **Assets:** render `public/play-store-feature-graphic.html` to 1024×500 PNG (open in browser at exact viewport, screenshot, or use Playwright). Also need: 512×512 icon (exists as `icon-512.png` — verify no alpha issues), ≥2 phone screenshots (1080×1920+), short description (80 chars), full description (4000 chars, reuse App Store copy).
6. **Play Console:** create app, complete Data Safety form (declare: account data/email via Supabase auth, analytics if any — mirror the iOS privacy answers), content rating questionnaire, privacy policy URL (must be live; check if one exists on viberise.nichuzz.com, create if not — REQUIRED, blocks submission), upload `.aab` to **internal testing** track first.
7. **Internal test → production.** Install via internal testing link on a real device, run through signup → Essence Mirror → 7-day challenge, then promote.

## Edge cases a weaker model would miss

- **Web push doesn't work in Android WebView** (step 2) — the single biggest trap here.
- **New Play developer accounts require 12+ testers for 14 days before production** (personal accounts, policy since 2023 — verify current rules; may force a closed-testing period. Plan around it, don't discover it at submission).
- **`versionCode` must increment on every upload**, even to testing tracks.
- **Deep links / OAuth redirect:** Supabase magic-link auth opens the browser; returning to the app needs an intent filter (check how iOS handled it — `capacitor.config.json` scheme). Test login on-device before submitting.
- **Two-product repo:** this plan is the CONSUMER app only (`npm run build`, not `build:creator`). Don't mix manifests.
- **Feature graphic must be exactly 1024×500, no transparency, JPG/24-bit PNG.**

## Acceptance criteria

- [ ] Signed `.aab` builds reproducibly; keystore backed up outside the repo
- [ ] Login, Essence Mirror, and 7-day challenge work in the release build on a real Android device
- [ ] No notification permission prompt unless push actually works
- [ ] All Play Console listing sections green (assets, data safety, content rating, privacy policy)
- [ ] App live on internal testing track with install link shared with Nic
