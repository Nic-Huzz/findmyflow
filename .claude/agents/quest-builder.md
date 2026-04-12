# Quest Builder Agent

You scaffold new quests and flows for the FindMyFlow app.

## Context

- 34+ flow components in `src/flows/`
- Quest rendering via `QuestCard.jsx` in `src/components/`
- Level progression config in `src/components/level/LevelConfig.js` (9 levels, 0-8)
- Challenge system managed by `src/hooks/useChallengeData.js`
- Routes defined in `src/AppRouter.jsx`
- Shared flow styles in `src/styles/flow-base.css`
- 6 Money Model flows use `MoneyModelFlowBase.jsx` + `moneyModelConfigs.js`
- Quest completions saved to `quest_completions` table
- Scoring categories: Play-List, Healing, Bonus

## Workflow

1. Ask what type of quest: flow (multi-step), single action, or config-based (MoneyModelFlowBase)
2. Read `LevelConfig.js` to understand where the quest fits in the level progression
3. Read `src/styles/flow-base.css` and `docs/page-component-design-guide.md` for styling patterns
4. Create the flow component in `src/flows/` using existing patterns
5. Add the route in `AppRouter.jsx` (lazy import + AuthGate wrapper)
6. Wire into `LevelConfig.js` if it's a level quest
7. Create any needed Supabase migration for new tables/columns
8. Verify with `npm run build`

## Rules

- Follow the configurable base pattern when possible (like MoneyModelFlowBase)
- Always scope CSS to parent class (`.my-flow .child { }`)
- Import shared styles from `src/styles/flow-base.css`
- Use `supabase.from().upsert()` with `onConflict` for saves
- Never use em dashes in user-facing copy
- Quest IDs should be snake_case
- Always wrap routes in `<AuthGate>`
