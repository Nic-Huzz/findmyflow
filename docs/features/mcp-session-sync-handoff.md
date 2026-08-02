# MCP Session Sync — Handoff Document

**Date**: 2026-08-02
**Author**: Claude Opus 4.6
**Status**: Core MCP tools working. OAuth for Claude.ai connectors NOT working. Claude Code API key auth works perfectly.

## What Was Built This Session

### 1. MCP Server Tools (WORKING)

Two new tools added to `supabase/functions/mcp-server/index.ts`:

**`get_interior_scoreboard`** — Returns the user's full self-knowledge state:
- Clarity/Action scores, zone detection
- All 10 skills with XP/levels
- Active quests with task progress + uncompleted tasks
- Unstarted life paths (careers without quests)
- Context mappings (directory → quest)
- Identity statements with reinforcement counts
- Full mode: protective voice evidence, state streaks, drain patterns, chain health

**`commit_progress`** — Writes task progress from a Claude session:
- Creates/completes tasks on quests (2 RP create + 3 RP complete = 5 per task)
- Awards skill XP + behavioral evidence for courage-level states (vibe_rise/stress)
- Saves identity statements (vibe_rise) and protective voice evidence (stress)
- Heals broken data chains (missing skill_tags, cluster links)
- Returns notable evidence (level-ups, voice counts, re-gen ready clusters, action score)
- Supports context mapping (directory/project → quest auto-detection)

### 2. Supporting Infrastructure (WORKING)

- `supabase/functions/_shared/taxonomy.ts` — Skill/branch IDs, level thresholds, state mappings
- `supabase/functions/_shared/chainHealer.ts` — Chain health detection + healing
- `supabase/migrations/20260729000001_quest_context_mappings.sql` — Maps directories/projects to quests
- `findmyflow-plugin/skills/sync/SKILL.md` — /sync skill prompt for Claude Code

### 3. OAuth for Claude.ai Connectors (NOT WORKING)

Attempted to add OAuth so users can connect via Claude.ai Connectors UI (Settings → Connectors → Add Custom Connector). The consent page, auth.ts JWT support, and metadata endpoints are built, but the full flow fails at token exchange.

**What works in the OAuth flow:**
- Supabase OAuth Server enabled
- OAuth client registered: `63fbbf56-01e2-488a-a0e5-e6ef09464d1e`
- `/.well-known/oauth-protected-resource` served correctly
- `/.well-known/oauth-authorization-server` served correctly
- 401 response includes `resource_metadata` URL in `WWW-Authenticate` header
- `/authorize` React route redirects to Supabase GoTrue
- `/oauth/consent` consent page renders, user can log in + approve
- `/api/oauth/token` Vercel rewrite proxies POST to Supabase correctly
- `/api/mcp` Vercel rewrite proxies to edge function with auth headers
- `auth.ts` accepts both `fmf_k1_` API keys AND Supabase OAuth JWTs

**What fails:**
- After user approves consent, Claude shows `"Authorization with Vibe Rise failed"` or `mcp_token_exchange_failed`
- Console shows `GET https://claude.ai/v1/toolbox/shttp/mcp/... 405 (Method Not Allowed)`
- Error reference IDs: `ofid_390a4005cba74ee0`, `ofid_c47713f4b8c77c3b`

**Possible remaining causes:**
1. The Supabase approve endpoint may return a 307 redirect instead of 302/303 (the MCP spec and GitHub issues say this causes 405 on Claude's callback)
2. The `issuer` in `oauth-authorization-server` is `https://qlwfcfypnoptsocdpxuv.supabase.co/auth/v1` but `authorization_servers` points to `https://findmyflow.nichuzz.com` — this domain mismatch might confuse Claude's issuer validation
3. Supabase GoTrue's OAuth server may not be fully compatible with the MCP auth spec (RFC 9728 resource indicators, etc.)
4. The consent page's approve mechanism (REST API fallback via fetch POST) might not work correctly with Supabase's OAuth flow

**Next steps for OAuth (for a future agent):**
1. Read the official example: https://github.com/modelcontextprotocol/example-remote-server
2. Consider building a custom OAuth server (4 edge functions: authorize, token, register, consent) instead of trying to use Supabase GoTrue as the auth server. GoTrue works for USER auth but may not implement all MCP-required OAuth extensions.
3. Alternatively, look at Cloudflare Workers MCP template: https://github.com/coleam00/remote-mcp-server-with-auth
4. The fix plan is at `docs/features/mcp-oauth-fix-plan.md`

## What DOES Work Right Now

### Claude Code — API Key Auth (FULLY WORKING)

The MCP server works perfectly with API key auth from Claude Code. Tested end-to-end:

```bash
# Test scoreboard
curl -X POST https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/mcp-server \
  -H "Authorization: Bearer fmf_k1_4fc8e40feb8cacf87991bebdd2cd9025f4d9adae2d99e498" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_interior_scoreboard","arguments":{"mode":"light"}}}'

# Test commit
curl -X POST https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/mcp-server \
  -H "Authorization: Bearer fmf_k1_4fc8e40feb8cacf87991bebdd2cd9025f4d9adae2d99e498" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"commit_progress","arguments":{"entries":[{"quest_id":"8b07e527-3881-40df-b618-a4e6edd65849","task_text":"Test task","skill_tags":["building"],"state":"vibe_rise","identity_statement":"builds things"}]}}}'
```

Both return correct JSON responses with full data.

### Connection Config

**For Claude Code** (`.mcp.json` in project or `claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "viberise": {
      "url": "https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/mcp-server",
      "headers": {
        "Authorization": "Bearer fmf_k1_4fc8e40feb8cacf87991bebdd2cd9025f4d9adae2d99e498"
      }
    }
  }
}
```

**API key in shell**: Already in `~/.zshrc`:
```bash
export FINDMYFLOW_API_KEY="fmf_k1_4fc8e40feb8cacf87991bebdd2cd9025f4d9adae2d99e498"
```

**User ID**: `ebe69854-2ebd-4236-a437-3a362f5e1af4` (huzz@nichuzz.com)

### SessionEnd Hook Opportunity

There's a `SessionEnd` hook in `~/.claude/settings.json` that runs a Python script to save session digests to Obsidian. This could be extended to also call the MCP `/sync` flow to automatically sync progress at session end.

## Files Created/Modified This Session

### New Files
| File | Purpose |
|------|---------|
| `supabase/functions/_shared/taxonomy.ts` | Skill/branch taxonomy data, level thresholds, state mappings |
| `supabase/functions/_shared/chainHealer.ts` | Chain health detection + healing utilities |
| `supabase/migrations/20260729000001_quest_context_mappings.sql` | Context mapping table |
| `findmyflow-plugin/skills/sync/SKILL.md` | /sync skill prompt |
| `src/pages/OAuthConsent.jsx` | OAuth consent page |
| `src/pages/OAuthRedirect.jsx` | /authorize + /token redirect routes |
| `public/.well-known/oauth-authorization-server` | OAuth server metadata |
| `public/.well-known/oauth-protected-resource` | Protected resource metadata |
| `docs/features/mcp-session-sync-implementation-plan.md` | Full implementation plan |
| `docs/features/mcp-oauth-fix-plan.md` | OAuth fix plan |
| `scripts/register-oauth-client.js` | One-time OAuth client registration script |

### Modified Files
| File | Changes |
|------|---------|
| `supabase/functions/mcp-server/index.ts` | +900 lines: scoreboard + commit handlers |
| `supabase/functions/_shared/auth.ts` | JWT auth alongside API keys, WWW-Authenticate header |
| `src/AppRouter.jsx` | Added /oauth/consent, /authorize, /token routes |
| `src/PersonaAssessment.jsx` | Post-login OAuth redirect |
| `findmyflow-plugin/README.md` | Updated with session sync docs |
| `findmyflow-plugin/.claude-plugin/plugin.json` | Updated to v2.0.0 |
| `vercel.json` | Added /api/mcp, /api/oauth/token rewrites + .well-known headers |

### Obsidian Notes Created
| Note | Path |
|------|------|
| Paid To Have Fun Thesis | `Frameworks/Paid To Have Fun Thesis.md` |
| Whoever Owns The Brain Is King | `Frameworks/Whoever Owns The Brain Is King.md` |

### Branch
All code is on `main` (cherry-picked from `feature/mcp-session-sync`).

## Key Decisions Made

1. **Evidence over interpretation**: Edge function returns raw counts/signals. Claude interprets conversationally.
2. **Claude does the matching**: No Haiku AI classification in the edge function. Claude (Opus/Sonnet) matches accomplishments to quests using scoreboard data.
3. **Directory/project → quest mapping**: One-time setup, persists in `quest_context_mappings` table.
4. **State determines depth**: vibe_rise/stress = courage-level (XP + evidence). fun/boring = task signal only.
5. **RP matches app**: 2 create + 3 complete = 5 RP per task (not courage-level 7-10 RP).
6. **Backward compatible auth**: API keys still work alongside OAuth JWTs.

## Thesis Notes (Obsidian)

- **"Paid to Have Fun"**: School failed, Vibe Rise collects dots to find personal monopoly
- **"Whoever Owns The Brain Is King"**: Structured self-knowledge data is the most valuable asset in AI-native world. MCP makes the brain portable.
