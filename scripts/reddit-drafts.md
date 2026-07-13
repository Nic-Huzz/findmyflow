# Reddit Comment Drafts — 2026-07-13 (scan 4)

*Review, edit in your voice, then approve for posting. Max 2 per day.*

---

## This scan: No drafts

**Reason:** Reddit is still blocked by this environment's network policy.

All three access methods confirmed blocked:
- `curl` to `www.reddit.com` — no output (CONNECT tunnel blocked at proxy)
- `WebSearch` with `allowed_domains: ["reddit.com"]` — explicit API error: "reddit.com not accessible to our user agent"
- `WebFetch` to `https://www.reddit.com/r/findapath/new.json` — error: "Claude Code is unable to fetch from www.reddit.com"

This has been the case since at least 2026-07-09 across all scans (1, 2, 3, and now 4).

**To fix this:** Add `reddit.com` to the allowed domains in the Claude Code on the web environment settings: https://code.claude.com/docs/en/claude-code-on-the-web

**Until then:** This routine cannot fetch posts or produce drafts.

---

## Posting Rules
- [ ] Post max 2 today (pick your favourites)
- [ ] Edit these in YOUR words before posting
- [ ] No links, no app mentions
- [ ] Reply to any replies you get

## Next scan
Automatic — runs every 12 hours.
