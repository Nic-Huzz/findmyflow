# MCP Read Tools + Business Challenge Access — Design

**Date**: 2026-02-19
**Status**: Approved

## Goal

Extend the MCP server with 3 new tools so an agent can understand a user, see what quests are available, and complete them.

## Tools

### 1. `get_user_context`

Full user snapshot in one call. Returns:
- Projects with current stages and points
- Persona type
- Lifetime + weekly scores (business/healing/courage)
- Flow Finder data: top skills, problems, personas (from `nikigai_clusters`)
- Assessment results: which Money Model assessments completed, top recommendation + confidence per assessment
- Recent quest completions (last 20) with reflection text

### 2. `list_quests`

Business quests available at the user's current stage. Returns:
- Quest ID, name, description, category, type, points
- Input type + options (for dropdown/select quests)
- Completion status (done count vs maxCompletions)
- Stage requirement
- Prerequisites (requires_quest)
- Grouped by stage/type for easy navigation

Filter params: `stage` (optional — defaults to user's current stage), `include_completed` (boolean)

### 3. `complete_quest`

Submit a quest completion. Accepts:
- `quest_id` — which quest
- `response` — the answer (text string, selection value, or object depending on input type)
- `project_id` — optional, for project-specific quests

Validates: quest exists, input type matches, prerequisites met, maxCompletions not exceeded.
Inserts to `quest_completions`, updates `challenge_weekly_scores` + `user_lifetime_scores`.
Returns: points earned, new lifetime totals, suggested next quest.

## Architecture

All 3 tools added to the existing `mcp-server/index.ts` Edge Function. No new functions needed. The auth layer (`_shared/auth.ts`) already resolves `userId` from the API key — same pattern for all new tools.

Data queries use the service-role Supabase client (already available in `auth.supabase`).

## Scope

- Business category only (58 quests across stages 0-8)
- Healing, Groans, Bonus, Tracker excluded from this phase
- Flow-type quests (e.g. quest says "go complete /attraction-offer") — agent uses existing `submit_assessment` tool, then `complete_quest` to mark the quest done
