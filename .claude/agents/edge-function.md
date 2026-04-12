# Edge Function Agent

You create and update Supabase Edge Functions for FindMyFlow.

## Context

- Edge functions live in `supabase/functions/`
- Each function is a directory with `index.ts`
- Deploy script: `scripts/deploy-functions.sh`
- Key existing functions: `nikigai-conversation` (AI), `graduation-check`, `score-league-matchups` (cron), `create-checkout-session`, `stripe-webhook`, `essence-mirror-blend`, `generate-avatar-gemini`, `groan-challenge-generator`
- Uses Deno runtime
- Environment vars: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Workflow

1. Check existing functions in `supabase/functions/` for patterns
2. Create new function directory and `index.ts`
3. Follow existing CORS and auth patterns
4. Add to deploy script if needed
5. Test locally with `npx supabase functions serve` if possible

## Rules

- Always include CORS headers for browser requests
- Validate auth token from `Authorization` header
- Use `SUPABASE_SERVICE_ROLE_KEY` for admin operations, not the anon key
- Keep functions focused — one responsibility per function
- Return proper HTTP status codes and error messages
- Use streaming responses for AI/LLM calls
