# Custom Essence Archetype — Session Notes

**Date**: 2026-02-04

## Overview

Added the ability for users to customize their essence archetype display name and avatar photo. Custom values override defaults everywhere across the app. Also added several UX enhancements: shareable archetype card, AI avatar prompt generator, image compression, first-time tooltip, and a ratio slider for the voice tracker.

## Database Changes

**Migration**: `supabase/migrations/20260204100000_custom_essence_archetype.sql`

Added two columns to `lead_flow_profiles`:
- `custom_essence_name TEXT` — overrides `essence_archetype` for display
- `custom_essence_image TEXT` — URL to uploaded custom avatar (Supabase Storage)

No RLS changes needed — existing policies already allow users to update their own rows.

## New Files

### `src/lib/essencePreferences.js`
Core utility with 6 functions:
- `getEssenceDisplayName(profile)` — returns `custom_essence_name || essence_archetype || 'Unknown'`
- `getEssenceImagePath(profile)` — returns custom image URL or default PNG path
- `compressImage(file, maxDimension, quality)` — canvas-based resize to max 800px, preserves PNG transparency
- `buildAvatarPrompt({...})` — assembles a rich image generation prompt from archetype + project data for use in ChatGPT/Midjourney/etc
- `uploadEssenceAvatar(userId, file)` — uploads to `deal-screenshots` bucket in Supabase Storage
- `updateEssencePreferences(userId, email, updates)` — saves custom name/image to DB (user_id first, email fallback targets only most recent row)

### `src/components/HeroProfile/EditEssenceModal.jsx`
Full-featured edit modal:
- Text input for custom name (max 40 chars) with subtle progress bar near limit
- Image upload with circular preview (matches avatar display), auto-compression
- AI Prompt section — generates and copies a rich prompt for external image tools
- Reset-to-default buttons for both name and image
- Disabled save button when nothing has changed
- Toast feedback ("Saved!") with 600ms delay before close
- Proper blob URL cleanup (tracks previous URLs, cleans on unmount)
- setTimeout cleanup via ref to prevent setState-on-unmounted

### `src/components/HeroProfile/ShareableArchetypeCard.jsx`
Canvas-rendered shareable card (no external dependencies):
- Purple-to-gold gradient background
- Circular avatar with cover-fit
- Name, group, poetic line, superpower, shadow
- Footer branding
- Web Share API on mobile, PNG download fallback
- CORS fallback: if Supabase image taints canvas, re-renders with text initial

## Modified Files

### Hook & Data Layer
| File | Changes |
|------|---------|
| `src/hooks/useHeroProfile.js` | Added `custom_essence_name`, `custom_essence_image` to SELECT; uses utility for `essence.name` and `essence.image`; exposes `originalName`, `customName`, `customImage` on archetypes |
| `src/hooks/useChallengeData.js` | Uses `getEssenceDisplayName()` for voice quest personalization |

### Hero Profile Components
| File | Changes |
|------|---------|
| `src/components/HeroProfile/HeroIdentityCard.jsx` | Uses `essence.image` from hook; edit pencil + share button; first-time tooltip (localStorage); passes project skill/problem data for prompt generator; renders EditEssenceModal + ShareableArchetypeCard |
| `src/components/HeroProfile/HeroCommandCenter.jsx` | Passes `projects`, `userId`, `userEmail`, `onRefresh` to HeroIdentityCard |
| `src/components/HeroProfile/EssenceVsProtectiveTracker.jsx` | Converted to two-sided ratio slider bar with percentage labels inside each half |
| `src/components/HeroProfile/HeroProfile.css` | All new styles: action buttons, tooltip, edit modal (toast, char bar, circular preview, prompt section, scroll), shareable card modal, ratio slider bar |

### Other Consuming Components
| File | Changes |
|------|---------|
| `src/Profile.jsx` | Uses `getEssenceDisplayName()` + `getEssenceImagePath()` for both collapsed and expanded archetype views |
| `src/profiles/EssenceProfile.jsx` | Uses utility for display name + image; looks up archetype data via original name |
| `src/ArchetypeSelection.jsx` | Uses utility for display name + image path |
| `src/components/HomeFirstTime.jsx` | Merges custom display name into essence archetype object during onboarding load |
| `src/components/RecogniseQuestInput.jsx` | Added `custom_essence_name` to SELECT; uses `getEssenceDisplayName()`; stores `essenceOriginal` for data file lookups |
| `src/components/RewireQuestInput.jsx` | Added `custom_essence_name` to SELECT; uses `getEssenceDisplayName()` |

## Architecture: Preference Layer

The core pattern is simple — a utility function that returns `custom || original`:

```javascript
export function getEssenceDisplayName(profile) {
  return profile?.custom_essence_name || profile?.essence_archetype || 'Unknown'
}
```

All consuming components call this instead of reading `essence_archetype` directly. The original archetype data (group, superpower, poetic line, characters) stays unchanged — only the display name and avatar are customizable.

For data file lookups (essenceProfiles, protectiveProfiles), components still use the **original** archetype name since those files are keyed by the quiz-assigned name.

## Features Summary

1. **Custom Name** — Users can rename their archetype (max 40 chars). Shows everywhere: hero profile, /me page, challenge voice quests, archetype selection, onboarding
2. **Custom Photo** — Upload JPG/PNG/WebP (auto-compressed to 800px max). Stored in Supabase Storage
3. **Reset to Default** — One-tap reset for both name and image
4. **Image Compression** — Canvas-based, max 800px dimension, 85% JPEG quality, preserves PNG transparency
5. **AI Avatar Prompt** — Generates a rich prompt from archetype + skills + problems + persona for use in any AI image tool. Copy-to-clipboard
6. **Shareable Archetype Card** — Canvas-rendered PNG with purple-gold gradient, avatar, name, superpower, shadow. Web Share API or download
7. **First-Time Tooltip** — Gold "Make it yours" tooltip on edit button, shows once per user (localStorage)
8. **Disabled Save** — Button grayed out when nothing has changed
9. **Toast Feedback** — "Saved!" toast after successful save
10. **Ratio Slider** — Voice tracker bar now shows two-sided fill with percentage labels

## Bugs Found & Fixed During Review

- **Missing SELECT columns** in RecogniseQuestInput + RewireQuestInput — `custom_essence_name` wasn't included in queries
- **Object URL memory leak** — Blob URLs now tracked via `prevBlobRef` pattern with proper cleanup on transitions and unmount
- **Multi-row update** — Email fallback in `updateEssencePreferences` now fetches most recent row ID first, updates only that row
- **Data file lookup with custom name** — RecogniseQuestInput was looking up essenceProfiles using display name (could be custom). Fixed to use `essenceOriginal`
- **PNG transparency** — `compressImage` now preserves format for PNGs instead of converting to JPEG
- **setTimeout on unmounted component** — Close timer stored in ref, cleared on unmount
- **Canvas CORS** — ShareableArchetypeCard catches tainted canvas errors and re-renders with fallback
- **Duplicate CSS block** — Merged duplicate `.edit-essence-modal` definitions

## Testing Checklist

- [ ] Go to `/hero-profile`, click edit icon on identity card
- [ ] Enter custom name → save → verify shows on hero profile, /me, /archetypes/essence
- [ ] Upload custom photo → verify circular preview → save → verify on hero profile + /me
- [ ] Click "Reset to Default" for both fields → verify originals restored
- [ ] Click "AI Prompt" → verify prompt includes archetype data → copy works
- [ ] Click share icon → verify card renders with correct data → share/download works
- [ ] First-time tooltip appears once, then never again
- [ ] Save button disabled when nothing changed
- [ ] Voice tracker shows ratio slider with percentages (need voice quest completions)
- [ ] Edge case: user with no `lead_flow_profiles` record → edit button should not appear
- [ ] 7-day challenge → Business → Voices tab → verify custom name in voice quests
