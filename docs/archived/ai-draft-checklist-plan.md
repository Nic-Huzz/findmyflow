# AI Draft Buttons: Checklist Implementation Plan

**Date:** 2026-06-15
**Status:** Scoped, not yet built. Paused to explore template-first approach.

## Context

The Experience Pipeline has checklist items per node (marketing, organisation, followup). We want to add "AI Draft" buttons to 6 high-confidence items where the existing Content Generator + Creator Brain + Voice Profile can produce useful output.

## The 6 items

| Key | Node | What AI drafts | Content type | Platform |
|-----|------|---------------|-------------|----------|
| `content_piece_1` | Attract | Social post: problem/pain angle | educational | instagram |
| `content_piece_2` | Attract | Social post: transformation angle | transformation_story | instagram |
| `content_piece_3` | Attract | Social post: urgency/social proof | offer_teaser | instagram |
| `announce_audience` | Attract | Announcement post for the event | educational | instagram |
| `thank_you_email` | Grow | Thank-you email to attendees | email | email |
| `upsell_invite` | Grow | Upsell/next-event email | offer_teaser | email |

## Architecture

- No new edge functions. Use existing `content-generator` with `additionalInstructions`
- No new tables. Output writes to existing `notes` field on `experience_checklist_items`
- Buttons appear in ExperienceDetail (full editing view), not Pipeline read-only view
- Both `contentContext.js` (live data) and `brain` (inner game + identity) feed generation

## Files to create/modify

| File | Change | Lines |
|------|--------|-------|
| `src/lib/aiDraftPrompts.js` | **New**. Prompt configs for 6 items. | ~80 |
| `src/hooks/useAiDraft.js` | **New**. Hook wrapping generation logic. | ~60 |
| `src/lib/experienceChecklistTemplate.js` | Add 6 keys to `NOTABLE_KEYS`. | ~1 |
| `src/pages/ExperienceDetail.jsx` | Import hook, thread props, add AI Draft button. | ~30 |
| `src/pages/ExperienceDetail.css` | Button + loading styles. | ~15 |

## Data flow

```
User taps "Draft" on checklist item
  → Parallel: contentContext + brain + voiceProfile
  → Build item-specific additionalInstructions
  → Call content-generator edge function
  → Write output to notes field
  → Auto-open textarea for review/edit
  → Voice feedback: "Sounds like me" / "Doesn't"
```

## Voice feedback loop

One-tap rating after generation using existing `voice_feedback` table. Improves future drafts automatically via `getVoiceFeedbackInsights()`.

## Total scope: ~190 lines across 5 files
