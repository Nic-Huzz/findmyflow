# Session Handoff: MCP Session Sync (2026-07-28 to 2026-08-03)

## What was done

### MCP Server Tools (deployed, working)
- `get_interior_scoreboard` — returns Clarity/Action scores, skills, quests, life paths, identity statements, pattern evidence. Light/full modes.
- `commit_progress` — creates/completes tasks, awards RP (5 per task), skill XP + behavioral evidence for vibe_rise/stress states, saves identity statements and protective voices.
- `supabase/functions/_shared/taxonomy.ts` — skill/branch IDs, level thresholds, state mappings.
- `supabase/functions/_shared/chainHealer.ts` — fixes broken skill_tags and cluster links.
- `supabase/migrations/20260729000001_quest_context_mappings.sql` — directory → quest mapping table.

### OAuth for Claude.ai Connectors (NOT working)
- Consent page at `/oauth/consent`, JWT auth in `auth.ts`, `.well-known` metadata files, Vercel rewrites for `/authorize` and `/api/oauth/token`, OAuth client registered (`63fbbf56-01e2-488a-a0e5-e6ef09464d1e`).
- Token exchange fails with `mcp_token_exchange_failed`. Detailed in `docs/features/mcp-oauth-fix-plan.md`.

### /sync Skill + Integration
- `/sync` skill at `~/.claude/skills/sync/SKILL.md` — triggered manually or during `/handoff`.
- Global MCP connection at user scope in `~/.claude.json` (viberise server).
- Global CLAUDE.md updated with directory → quest mapping and sync instructions.
- `/handoff` skill updated with Part 0 (sync before handoff).

### Obsidian Notes
- `Frameworks/Paid To Have Fun Thesis.md` — school failed, Vibe Rise collects dots to find personal monopoly.
- `Frameworks/Whoever Owns The Brain Is King.md` — data sovereignty thesis, MCP makes the brain portable.

## Decisions made

1. **Evidence over interpretation**: Edge function returns raw counts. Claude interprets conversationally. Why: interpretations change as more data arrives, evidence is permanent.
2. **Claude does the matching, not Haiku**: Saves API cost, more accurate (full conversation context), simpler (one tool call not two).
3. **State determines depth**: vibe_rise/stress = courage-level (XP + evidence). fun/boring = task signal only. Why: matches the app's distinction between courage challenges and regular tasks.
4. **RP matches app exactly**: 2 create + 3 complete = 5 per task. Not courage-level 7-10 RP.
5. **Protective voice only on stress + when described**: Don't ask for voice on every stress task. Only when user describes avoidance or resistance.
6. **Confidence shown on inferred data**: Quest match and skill tags show % confidence. User-provided data (state, identity text) doesn't need confidence.

## In progress / next steps

1. **OAuth for Claude.ai/Desktop** — token exchange fails. Next: follow the official example at `github.com/modelcontextprotocol/example-remote-server` and consider building a custom OAuth server instead of using Supabase GoTrue. Plan at `docs/features/mcp-oauth-fix-plan.md`.
2. **Test /sync in a fresh session** — MCP server is registered globally but hasn't been tested loading tools in a new Claude Code session.
3. **Journey tab UI** — design exists for a "Sync with Claude" card on the Journey tab. Not built yet.

## Gotchas discovered

1. **Vercel rewrites to external URLs don't work for `.well-known` paths** — the catch-all `/(.*) → /index.html` eats them. Use static files in `public/.well-known/` instead.
2. **Supabase GoTrue OAuth server exists but isn't fully MCP-compatible** — missing `/.well-known/oauth-protected-resource` at domain root, `issuer` mismatch between domains.
3. **`ExperienceDomeOnboarding` import in AppRouter was breaking ALL Vercel deploys** — files were imported but never committed. Fixed by committing the source files.
4. **`people-pleaser` vs `people_pleaser`** — app canonical is hyphen (`protectiveVoices.js`), DB uses underscores. MCP taxonomy uses underscores to match DB.
5. **reflection_text JSON must use internal state names** — `vibe` not `vibe_rise`, `peace` not `fun`, `anxious` not `stress`, `shutdown` not `boring`.

## Recommendations

1. **Fix OAuth by studying the official example server** — don't keep guessing. The `modelcontextprotocol/example-remote-server` repo has a working implementation with Auth0/Okta. Port the pattern.
2. **Test the /sync flow in a fresh session** — verify the MCP tools load from the global `~/.claude.json` config and the skill works end-to-end.
3. **Build the Journey tab card** — this is the onboarding path for other users to discover and set up the sync.
