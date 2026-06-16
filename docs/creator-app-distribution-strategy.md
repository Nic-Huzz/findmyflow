# Creator App Distribution Strategy

## Distribution Channels

| Platform | Method | Store Review? | IAP Required? |
|----------|--------|---------------|---------------|
| Desktop (Mac/Win/Linux) | PWA via `create.nichuzz.com` | No | No |
| iOS | Capacitor → App Store | Yes | No (3.1.3(f)) |
| Android | PWA or Capacitor → Play Store | Optional | No |

## Apple IAP Avoidance — Guideline 3.1.3(f)

**Strategy**: Model off HubSpot, Slack, Notion, Salesforce.

**Rule**: "Free apps acting as a stand-alone companion to a paid web-based tool do not need to use in-app purchase, provided there is no purchasing inside the app, or calls to action for purchase outside of the app."

**Requirements**:
1. App is **free** on the App Store
2. All signup and billing happens on the **website** (Stripe via viberise.nichuzz.com)
3. iOS app is a **companion** — users log in with existing credentials
4. **No purchase CTAs anywhere in the app**:
   - No upgrade buttons
   - No pricing screens
   - No "subscribe on our website" links
   - No messaging about locked features or what they're missing
5. Free-tier users see fewer features, but the app feels **complete** at their tier

**Build implementation**: Use `VITE_APP_MODE=creator` to strip from iOS/creator build:
- `UpgradePrompt.jsx` and any Stripe-related CTAs
- "Upgrade to unlock" messaging
- Links to pricing pages

**Risk factors**:
- Apple reviewers are inconsistent; B2B SaaS apps sometimes get rejected on first pass, approved on appeal
- Clear "professional business tool" positioning in App Store listing helps
- CRM/creator portal framing (not consumer entertainment) works in our favour

**Relevant Apple guidelines**:
- 3.1.3(f) — Free Stand-alone Apps (primary path)
- 3.1.3(c) — Enterprise Services (does NOT apply, we sell to individuals not orgs)
- 3.1.3(a) — Reader Apps (does NOT apply, only for media content)
- 3.1.3(b) — Multiplatform Services (requires IAP also be available, not useful)

## Desktop PWA

No Electron app needed. PWA provides:
- Install from browser (Chrome/Edge address bar → "Install", Safari → "Add to Dock")
- Offline capability via service worker
- Native-feeling window (no browser chrome)
- Auto-updates (no download/update cycle)

**To improve PWA experience for creators**:
- Consider a separate `manifest.creator.json` with name "Vibe Rise for Creators" and creator-specific icons
- Ensure service worker caches creator-specific routes

## iOS App Store Submission

Capacitor config already exists: `capacitor.config.creator.json` (bundle ID: `com.nichuzz.viberise.creator`)

See `docs/creator-app-deploy-checklist.md` section 5 for full iOS submission steps.

## Desktop App (Electron) — Terminal Features

The creator portal includes an AI Portal with 3 modes:
- **Agents Mode** (AI chat) — works everywhere (PWA, Electron, browser)
- **App Build Mode** (terminal + health scanner) — requires Electron (uses `node-pty` for shell execution)
- **Documents Mode** (batch file processing) — requires Electron (filesystem access)

### Mac App Store vs Direct Download

Apple's Mac App Store has sandboxing restrictions on apps that execute arbitrary code. `node-pty` spawning shell processes will likely get rejected.

**Option 1: Direct download (recommended for terminal features)**
- Notarized `.dmg` from website
- No App Store restrictions, terminal works fully
- This is what VS Code, Cursor, and most dev tools do
- Auto-updates via electron-updater

**Option 2: Mac App Store**
- Would need to sandbox or remove the terminal
- AI Agents tab would be fine
- Easier discovery but limited functionality

### Recommendation

- **Creators**: Ship the PWA at `create.nichuzz.com` (Agents chat works, no review needed, instant updates)
- **Power users / developers**: Distribute as a direct `.dmg` download for full terminal access
- **Do not** submit the terminal-enabled version to the Mac App Store

## Key Principle

Website sells. App serves. No overlap in the iOS build.
