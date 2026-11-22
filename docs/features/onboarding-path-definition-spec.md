# Onboarding Path Definition Spec

## Context

Path definition is the per-quest commitment flow: aliveness baseline, dimension setup, life fuels, fears, identity declaration, and first courage challenge. Previously a standalone in-app route at `/path-definition/:questId`. Now embedded in onboarding after Choose Quests.

## Design Decision

Users pick **one** path to define during onboarding. Remaining paths (if any) are completed in-app. This keeps onboarding focused while ensuring the app opens with at least one fully configured quest.

## Onboarding Flow

```
Choose Quests → [Quest Picker if 2+] → Path Definition (1 quest) → Avatar → Download
```

### Quest Picker Screen

Shown only when the user created 2+ quests in Choose Quests. If only 1 quest, skip straight to Path Definition.

- Headline: "Which path do you want to set up first?"
- Subtext: "Pick one to define now. You can set up the rest in the app."
- Cards: one per quest, using quest label. Tap to select and proceed.
- Skip button: "Skip for now" goes straight to avatar.

### Single Quest Path Definition

Renders `PathDefinitionFlow` with the selected quest's ID and an `onComplete` callback. When done, proceeds to avatar.

PathDefinitionFlow accepts optional props for embedding:
- `questId` (string) - overrides `useParams().questId`
- `onComplete` (function) - overrides `navigate('/7-day-challenge?tab=weekly')`

When both are omitted, works as the standalone route it always was.

## In-App: Incomplete Path Definitions

### Paths Tab Banner

Quests without path definition data are usable (can add courage challenges, track progress). But show a card/banner on the Paths tab prompting the user to complete setup.

**Detection**: A quest needs path definition if `precursor_level IS NULL` AND `current_dimensions IS NULL`. ChooseQuestsFlow creates quests without path definition data. PathDefinitionFlow writes `precursor_level`, `current_dimensions`, `dream_dimensions`, `staying_fuels`, `path_fuels`, `buts`, `fear_outcome`, `identity_declaration`, `protective_voice` to the `quests` table.

**Banner design**: Show on `QuestBoardCard` or as a top-level card in the Paths tab:
- "Define your path" 
- "Set your dimensions, identity, and first step for [quest name]"
- CTA: "Set up path" links to `/path-definition/:questId`

**Priority**: Show banner for quests missing path definition. Dismiss after path definition is completed. Order: most recently created first.

### Implementation (deferred to next session)

1. Add `needsPathDefinition` computed flag to quest loading hooks
2. Add banner component to `LevelTab.jsx` (Paths tab)
3. Banner links to existing `/path-definition/:questId` route

## localStorage Session Flags

| Key | Set when | Used for |
|-----|----------|----------|
| `archetype_generated` | After Stage 1 AI + archetype AI complete | Session restore: resume at correct stage |
| `avatar_generated` | After avatar image generation succeeds | Session restore: skip avatar on return |
| `avatar_url` | After avatar image generation succeeds | Display on return if needed |

## Files Changed

- `src/flows/VoiceStemFlow.jsx` - Quest picker screen, single-quest PathDefinitionFlow embed
- `src/flows/PathDefinitionFlow.jsx` - Optional `questId` and `onComplete` props
- `src/components/LevelTab.jsx` - (deferred) Banner for incomplete path definitions
