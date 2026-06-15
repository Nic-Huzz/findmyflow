# Reddit Posting Session Notes

Session: 2026-04-08 to 2026-04-30 | Agent: Claude Code (Opus)

Use this doc to continue the daily Reddit posting cadence. Strategy docs live at `docs/reddit-strategy/`.

---

## Account

- **Username:** u/NicHuzz_
- **Created:** 2026-04-02
- **Karma at last check:** 2 (comment: 1, link: 1)
- **Avatar:** Customized Reddit snoo (no longer default)
- **Inbox:** 1 unread message as of 2026-04-20 (never checked)

## Composio MCP Setup

- Reddit connected via Composio MCP (`mcp__composio__*` tools)
- Token expires periodically; user runs `! /mcp` to reconnect
- Session ID for Composio calls: generate a new one each session with `{"generate_id": true}`
- Key tools: `REDDIT_POST_REDDIT_COMMENT`, `REDDIT_SEARCH_ACROSS_SUBREDDITS`, `REDDIT_RETRIEVE_POST_COMMENTS`, `REDDIT_RETRIEVE_SPECIFIC_COMMENT`, `REDDIT_EDIT_REDDIT_COMMENT_OR_POST`, `REDDIT_DELETE_REDDIT_COMMENT`, `REDDIT_GET_REDDIT_USER_ABOUT`
- TikTok: tools available but NOT connected (needs developer app setup, parked)

## Voice Profile

- **Source of truth:** Supabase `voice_profiles` table, user_id `ebe69854-2ebd-4236-a437-3a362f5e1af4`, project `qlwfcfypnoptsocdpxuv`
- **Local backup:** `/Users/nichuzz/.claude/projects/-Users-nichuzz-creations-Findmyflow/memory/user_voice_and_stories.md`
- **Global pointer:** `~/.claude/CLAUDE.md` has the Supabase query

## Strategy Summary

Full strategy: `docs/reddit-strategy/reddit-strategy.md`
Thread tracker: `docs/reddit-strategy/reddit-thread-tracker.md`

### Rules
1. Value first, link never (or last). 90% of comments should have ZERO links
2. One subreddit per day max (flexible if threads are perfect)
3. Never say "I built an app." Share frameworks as personal insight
4. Genuine engagement. Reply to replies
5. Huzz's voice, not corporate

### Target Subs (Tier 1)
- r/findapath (490K+) — "what should I do with my life"
- r/careerguidance (1.2M+) — "should I quit?"
- r/DecidingToBeBetter (540K+) — "why can't I change" (NOTE: keeps removing our posts, likely karma/age filter)
- r/Entrepreneur (2.3M+) — impostor syndrome, scared to start

### Target Subs (Tier 2)
- r/selfimprovement (2M+) — "tried everything still stuck"
- r/getdisciplined (1M+) — "can't force myself to do the thing"

## Posting History

| # | Date | Sub | Thread | Comment ID | Status |
|---|------|-----|--------|------------|--------|
| 1 | 2026-04-08 | r/findapath | Stuck in research mode | oex9pt9 | Live, score 2 |
| 2 | 2026-04-09 | r/findapath | I feel so behind at 28 | of6cgzj | DELETED (AI slop callout) |
| 3 | 2026-04-11 | r/careerguidance | Marketing career, feel trapped | ofkwsyx | Live |
| 4 | 2026-04-12 | r/getdisciplined | Difficult feeling stopping action | ofqjgac | Live |
| 5 | 2026-04-12 | r/DecidingToBeBetter | Plans loop, not following through | ofqld2m | Removed by mods |
| 6 | 2026-04-14 | r/DecidingToBeBetter | Repost of #5 | og35zv3 | Removed by Reddit |
| 7 | 2026-04-22 | r/findapath | Same pattern after setbacks | ohlhjqc | Live |
| 8 | 2026-04-29 | r/careerguidance | Work-life balance vs hustle | oiuv8ec | Live |

## Key Lessons Learned

### AI Slop Callout (Day 2)
- Comment #2 got called out as "Good advice but also AI slop" by u/Affectionate-Top8628
- Root cause: too polished, perfect structure (hook-reframe-list-question), zero typos, "nervous system" repeated as framework label, essay length on a 2-karma account
- Fix: Huzz now writes his own comments, Claude just cleans up typos and adds paragraph breaks
- Deleted the comment immediately. New account can't survive that label.

### DecidingToBeBetter Blocks Us
- Both original post and repost got removed (likely karma/account-age AutoMod filter)
- Avoid this sub until karma is significantly higher (50+)

### What Works
- **Huzz writes the comment himself** — Claude formats/cleans, doesn't draft
- **Short comments** (3-5 sentences) outperform essays
- **One insight per comment**, not five
- **Lead with empathy**, not insight
- **One anchor quote** ("we don't rise to the level of our ambitions, we fall to the level of what feels safe")
- **No closing questions** — share what worked and let them come to you
- **Casual surface, structured thinking** — "100000%", "Brother", loose punctuation

### Rate Limiting
- Reddit rate limits new accounts aggressively
- After Composio reconnects, wait ~10 min before posting (triggers spam detection)
- 24h between comments is safest while karma is low

## Huzz's Key Story Beats (verified)

- **Age now:** 29
- **Quit at:** 26
- **Previous role:** VC firm in Sydney, ~5 years
- **The crack:** Knew for 3+ years the job wasn't his calling but was too terrified to leave
- **$30K on 52 courses** while still in the job. Didn't help.
- **The breakthrough:** One thing a week that terrified him. Started with two friends for a month, then solo for a year.
- **Timeline:** Within 6 weeks = working remotely from Bali. Within 3 months = quit. Within 6 months = self-funding life in Thailand.
- **Key quote:** "We don't rise to the level of our ambitions, we fall to the level of what feels safe"
- **Now:** 3 years later, still in Bali, building FindMyFlow

## Huzz's Frameworks (use naturally, don't name them)

- **Safety Dome:** We all live in a dome. Inside = safe. Outside = fear. Expand it via: 1) fear challenges, 2) healing somatic wounds
- **Fear vs Love decisions:** Two places to make decisions from. Fear choice vs love choice.
- **Skills/Problem/People:** What does a business do? Solves a problem, for a person, using skills. Problems = industry, People = niche, Skills = job title
- **Burnout reframe:** Burnout comes from forcing misaligned work. Aligned work = tired sometimes but still excited.
- **"Nervous system" usage:** Say it naturally or describe the feeling. Don't use as a clinical framework label.

## Workflow for Next Agent

1. Reconnect Composio: user runs `! /mcp`
2. Search for threads: `REDDIT_SEARCH_ACROSS_SUBREDDITS` across target subs with keywords like "stuck", "lost", "quit", "scared", "burnout", "20s"
3. Filter for: 20-somethings, emotional posts (not just tactical career questions), low comment count (first voice), fresh (last 24-48h)
4. Pull full post: `REDDIT_RETRIEVE_POST_COMMENTS` with the article ID
5. Share the full OP text with Huzz and let him draft the comment
6. Clean up typos, add paragraph breaks, confirm with Huzz
7. Post via `REDDIT_POST_REDDIT_COMMENT` with `thing_id: "t3_{article_id}"`
8. Log in tracker: `docs/reddit-strategy/reddit-thread-tracker.md`
9. Check previous comments: `REDDIT_RETRIEVE_SPECIFIC_COMMENT` with comment IDs from history

## Pending / Next Steps

- [ ] Check inbox message (1 unread as of 2026-04-20)
- [ ] Thread A from Apr 28 still unposted: "Does a safe career path even exist?" (r/findapath, 1sybjtn, score 87)
- [ ] Thread B from Apr 28 still unposted: "31, experienced but still can't find the right path" (r/findapath, 1sye8lt, score 3)
- [ ] Build karma to 50+ to unlock DecidingToBeBetter
- [ ] Eventually: start replying to replies on our own comments (genuine engagement per strategy)
- [ ] Week 3+ of strategy: soft mentions of FindMyFlow when people DM or ask for resources
