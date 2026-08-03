# MCP OAuth Fix Plan (v2)

**Date**: 2026-08-02
**Status**: Ready to implement

## What Works (Tested)
- Token endpoint proxy: Vercel rewrite → Supabase ✅ (returns `invalid_grant`, not HTML)
- Token endpoint with `resource` param: Supabase accepts it ✅
- MCP endpoint proxy: Vercel rewrite → edge function ✅ (returns 401 correctly)
- `.well-known/oauth-authorization-server`: served correctly ✅
- OAuth consent page: renders, user can log in + approve ✅
- OAuth client registered via admin API ✅

## What's Broken
Error: `mcp_token_exchange_failed` after user approves in consent page.

Console also showed: `GET https://claude.ai/v1/toolbox/shttp/mcp/... 405 (Method Not Allowed)`

## The Two Remaining Fixes

### Fix 1: Add `/.well-known/oauth-protected-resource` (REQUIRED by MCP spec)

Claude fetches this as part of its discovery flow. Without it, Claude may fall back to default behavior that doesn't work correctly with our setup. The spec (2025-06-18) makes this MUST.

**Create**: `public/.well-known/oauth-protected-resource`

```json
{
  "resource": "https://findmyflow.nichuzz.com/api/mcp",
  "authorization_servers": ["https://findmyflow.nichuzz.com"],
  "scopes_supported": ["mcp:tools"],
  "bearer_methods_supported": ["header"]
}
```

Note: `authorization_servers` points to our domain (not Supabase). Claude will then fetch `/.well-known/oauth-authorization-server` from our domain, which we already serve correctly.

**Confidence**: 95%. Static file, spec is explicit.

### Fix 2: Update `WWW-Authenticate` header with `resource_metadata` URL

The 401 response must tell Claude WHERE to find the protected resource metadata. Current header is bare `Bearer`, spec requires the URL.

**Modify**: `supabase/functions/_shared/auth.ts`

```
'WWW-Authenticate': 'Bearer resource_metadata="https://findmyflow.nichuzz.com/.well-known/oauth-protected-resource"'
```

Then redeploy the edge function.

**Confidence**: 95%. One line change.

## Implementation (3 Steps, ~30 min)

### Step 1: Create protected resource metadata + fix header

1. Create `public/.well-known/oauth-protected-resource` (static file)
2. Update `auth.ts` WWW-Authenticate header
3. `npm run build` to verify
4. Deploy edge function: `npx supabase functions deploy mcp-server --no-verify-jwt`
5. Git push to deploy to Vercel

### Step 2: Verify both `.well-known` endpoints serve correctly

```bash
curl -s "https://findmyflow.nichuzz.com/.well-known/oauth-protected-resource"
# Should return JSON with resource + authorization_servers

curl -s "https://findmyflow.nichuzz.com/.well-known/oauth-authorization-server"
# Should return JSON with endpoints (already works)
```

### Step 3: Test full OAuth flow

1. Delete existing Vibe Rise connector in Claude.ai
2. Re-add: URL `https://findmyflow.nichuzz.com/api/mcp`, Client ID `63fbbf56-01e2-488a-a0e5-e6ef09464d1e`
3. Connect → should redirect to consent → approve → token exchange → connected
4. Test: ask Claude "call get_interior_scoreboard"

## If It Still Fails

The console showed `GET .../shttp/mcp/... 405`. This could mean Claude GOT a token but failed to use it for MCP. Possible causes:

**A. The Vercel rewrite for `/api/mcp` doesn't forward the Authorization header**
Vercel rewrites to external URLs may strip auth headers. Test:
```bash
curl -s -X POST "https://findmyflow.nichuzz.com/api/mcp" \
  -H "Authorization: Bearer fmf_k1_4fc8e40feb8cacf87991bebdd2cd9025f4d9adae2d99e498" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"ping"}'
```
If this returns `{"error":"Authorization required"}` instead of `{}`, headers are being stripped.

**B. Supabase JWT validation fails in the edge function**
The OAuth token is a Supabase JWT, validated by `authenticateOAuthToken` in auth.ts. If `getUser(token)` fails, check edge function logs:
```bash
npx supabase functions logs mcp-server --project-ref qlwfcfypnoptsocdpxuv
```

**C. MCP transport mismatch**
Claude's `shttp` transport might expect SSE streaming support. Our MCP server responds with plain JSON. This should be fine per the Streamable HTTP spec, but worth checking.

## Reference Docs
- [MCP Auth Spec 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
- [RFC 9728 - Protected Resource Metadata](https://www.rfc-editor.org/rfc/rfc9728)
- [Official Example Server](https://github.com/modelcontextprotocol/example-remote-server)
- [GitHub Issue #313 - 405 on callback](https://github.com/anthropics/claude-ai-mcp/issues/313)
