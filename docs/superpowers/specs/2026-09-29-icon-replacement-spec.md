# Icon Replacement — Emojis to Heroicons

**Date:** 2026-09-29
**Status:** Ready to implement
**Decision:** SF Symbols style (C) — filled solid icons
**Package:** `@heroicons/react` (solid variant — `@heroicons/react/24/solid`)

## Problem

The app uses emojis throughout for icons (toolbar, cards, buttons, state indicators). This looks prototype-y and was called out in user testing: "Design own icons. Not emoji's." Replacing with a consistent icon library gives an instant "designed" feel.

## Approach

Install `@heroicons/react` and replace emojis with solid Heroicons. Work in phases — ship the high-visibility surfaces first (toolbar, cards, headers), then sweep the rest.

## Icon Mapping

### Toolbar (`src/components/BottomToolbar.jsx`)
| Current | Heroicon | Import |
|---------|----------|--------|
| 🏠 Home | `HomeIcon` | `@heroicons/react/24/solid` |
| ⚡ Let's Play | `BoltIcon` | `@heroicons/react/24/solid` |
| 👤 Profile | `UserIcon` | `@heroicons/react/24/solid` |
| ✨ Identity | `SparklesIcon` | `@heroicons/react/24/solid` |
| 🎪 Experiences | `StarIcon` | `@heroicons/react/24/solid` |
| 📈 Growth | `ArrowTrendingUpIcon` | `@heroicons/react/24/solid` |
| 📲 Get App | `DevicePhoneMobileIcon` | `@heroicons/react/24/solid` |
| 🎯 Attract | `CursorArrowRaysIcon` | `@heroicons/react/24/solid` |
| 🚀 Execute | `RocketLaunchIcon` | `@heroicons/react/24/solid` |
| 💜 Nurture | `HeartIcon` | `@heroicons/react/24/solid` |
| 🧰 Tools | `WrenchScrewdriverIcon` | `@heroicons/react/24/solid` |
| 🧭 Compass | `MapPinIcon` | `@heroicons/react/24/solid` |

### Challenge Header (`src/components/ChallengeHeader.jsx`)
| Current | Heroicon |
|---------|----------|
| 🔥 streak flame | `FireIcon` |
| ⚙️ settings | `Cog6ToothIcon` |

### Quest Board Card (`src/components/QuestBoardCard.jsx`)
| Current | Heroicon |
|---------|----------|
| ⚡ courage task | `BoltIcon` |
| 💚 healing task | `HeartIcon` (green tint via className) |
| 🎉 achieved | `CheckCircleIcon` |
| 🤔 lost interest | `PauseCircleIcon` |
| ⏳ not now | `ClockIcon` |
| 🔥 lit up | `FireIcon` |
| 😐 okay | `MinusCircleIcon` |
| 😴 bored | `MoonIcon` |

### NS State Indicators (used across DailyCheckin, QuestBoardCard, DiscoverTab)
| Current | Heroicon | State |
|---------|----------|-------|
| 🔥 / ✦ | `FireIcon` (gold) | vibe_rise |
| 😊 / ○ | `FaceSmileIcon` (green) | fun |
| 😰 / ◇ | `ExclamationTriangleIcon` (red) | pressure/sympathetic |
| 😐 / — | `MinusCircleIcon` (gray) | bored/dorsal |

### Profile (`src/Profile.jsx`)
| Current | Heroicon |
|---------|----------|
| 📊 Dashboard | `ChartBarIcon` |
| ✨ Archetypes | `SparklesIcon` |
| 🧭 Compass | `MapPinIcon` |
| 📚 Library | `BookOpenIcon` |
| 📖 Explainer | `InformationCircleIcon` |
| 💬 Feedback | `ChatBubbleLeftIcon` |
| ☀️ Daily | `SunIcon` |
| 📅 Weekly | `CalendarIcon` |
| 🎯 Stage | `FlagIcon` |
| 🔥 Daily streak | `FireIcon` |
| 💪 Groan streak | `HandRaisedIcon` |
| 🚀 New project | `RocketLaunchIcon` |

### Healing Patterns (`src/components/HealingFlowModal.jsx`)
| Current | Heroicon |
|---------|----------|
| 👻 Ghost | `EyeSlashIcon` |
| 🧱 Controller | `ShieldCheckIcon` |
| 🤖 Auto-Pilot | `CpuChipIcon` |
| 🎯 Perfectionist | `AdjustmentsHorizontalIcon` |
| 🪞 People Pleaser | `UsersIcon` |
| 💚 Healing header | `HeartIcon` |

### Flow/Compass (`src/components/SeeYourFlow.jsx`, `CompassCheck.jsx`)
| Current | Heroicon |
|---------|----------|
| 🔥 Flowing | `FireIcon` |
| 😴 Resting | `MoonIcon` |
| ✨ Healing | `SparklesIcon` |
| 🧗 Climbing | `ArrowUpIcon` |
| 🧭 Compass | `MapPinIcon` |
| 🎉 Celebration | `CheckCircleIcon` |

### Discover Tab (`src/components/DiscoverTab.jsx`)
| Current | Heroicon |
|---------|----------|
| ⚡ Experience Game | `BoltIcon` |
| ✨ Essence Mirror | `SparklesIcon` |
| 💼 Current Job | `BriefcaseIcon` |
| ✅ Completed step | `CheckCircleIcon` |

## Implementation Plan

### Phase 1: Install + Toolbar (ship immediately)
1. `npm install @heroicons/react`
2. Replace BottomToolbar.jsx emoji strings with Heroicon components
3. Update toolbar CSS — icons are now `<svg>` components, not text. Set `width: 24px; height: 24px;` on `.toolbar-icon svg`
4. Replace ChallengeHeader.jsx emojis (streak flame, settings gear)
5. Build + cherry-pick to main

### Phase 2: Cards + States
6. QuestBoardCard.jsx — task icons, completion buttons, signal indicators
7. DailyCheckin.jsx — NS state buttons (currently use `NERVOUS_SYSTEM_STATES` emoji field)
8. DiscoverTab.jsx — card icons, step indicators
9. Update `src/lib/nervousSystemConstants.js` — add `icon` component field alongside `emoji`

### Phase 3: Profile + Flows
10. Profile.jsx — sidebar nav, stat cards, streak badges
11. HealingFlowModal.jsx — pattern icons
12. SeeYourFlow.jsx + CompassCheck.jsx — flow state icons
13. EssenceMirrorFlow.jsx — archetype emojis (ARCHETYPE_EMOJI map)

### Phase 4: Long tail
14. Grep for remaining emoji usage: `grep -rn '[\x{1F300}-\x{1F9FF}]' src/` 
15. CRM components (src/components/crm/)
16. Creator portal components
17. Data files that define emojis (essenceArchetypes.js, etc.)

## Technical Notes

- Heroicons are React components: `<BoltIcon className="w-6 h-6" />` 
- Solid variant (filled): `import { BoltIcon } from '@heroicons/react/24/solid'`
- Outline variant available at `@heroicons/react/24/outline` if needed for inactive states
- Color via `className` or inline `style` — inherits `currentColor` by default
- Where emojis are stored in data files / DB (e.g. `NERVOUS_SYSTEM_STATES`), add an `icon` field with the component name string, resolve at render time
- The purple Let's Play button already uses white text — white Heroicon will match

## Files to Modify (Priority Order)

### Phase 1 (8 files)
- `package.json` — add @heroicons/react
- `src/components/BottomToolbar.jsx` — 14 emoji replacements
- `src/components/BottomToolbar.css` — icon sizing for svg
- `src/components/ChallengeHeader.jsx` — 2 emoji replacements

### Phase 2 (5 files)
- `src/components/QuestBoardCard.jsx` — 12 emoji replacements
- `src/components/DailyCheckin.jsx` — NS state icons
- `src/components/DiscoverTab.jsx` — 4 emoji replacements
- `src/lib/nervousSystemConstants.js` — add icon field

### Phase 3 (5 files)
- `src/Profile.jsx` — 15 emoji replacements
- `src/components/HealingFlowModal.jsx` — 6 emoji replacements
- `src/components/SeeYourFlow.jsx` — 8 emoji replacements
- `src/components/CompassCheck.jsx` — 5 emoji replacements
- `src/flows/EssenceMirrorFlow.jsx` — ARCHETYPE_EMOJI map

### Phase 4 (80+ files)
- Full grep sweep of remaining emojis across src/

## Testing

- All toolbar icons render at correct size (24px) and color
- Purple Let's Play button shows white icon
- Active/inactive toolbar states show correct contrast
- NS state buttons still visually distinct (color-coded)
- Quest card icons align properly (were inline text, now SVG)
- No layout shifts from emoji→SVG size differences
- iOS Capacitor build still works (Heroicons are standard React)
