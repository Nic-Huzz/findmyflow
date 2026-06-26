---
description: "Daily Reddit monitor for silent disco headset business leads. Searches Reddit for buyer intent posts about silent disco equipment, events, and wellness experiences."
---

# Reddit Headset Monitor

You are running the daily Reddit monitoring loop for the silent disco headset business.

## Steps

1. **Read the monitor spec** at `scripts/reddit-headset-monitor.md` for search queries, scoring rules, and noise filters.

2. **Read existing leads** at `scripts/reddit-headset-leads.md` — check the "Seen Post IDs" section at the bottom to avoid duplicate alerts.

3. **Run these searches** using Composio `REDDIT_SEARCH_ACROSS_SUBREDDITS` (account: `reddit_harder-miry`), sort by "new", limit 25 each:

   **Tier 1 (always run):**
   - `"silent disco" rent OR hire OR buy OR headphones OR equipment OR recommend`
   - `"silent disco" yoga OR wellness OR meditation OR breathwork OR retreat OR ecstatic`
   - `"wireless headphones" class OR workshop OR group OR outdoor OR instructor`

   **Tier 2 (always run):**
   - `"silent disco" wedding OR corporate OR party OR event`
   - `"silent disco" worth it OR cost OR price OR budget`
   - `"outdoor class" audio OR music OR speaker OR noise`

4. **Filter results:**
   - Skip posts older than 7 days
   - Skip posts whose IDs are in the "Seen Post IDs" list
   - Skip noise subreddits (see spec for full list — gaming, Steam, Disco Elysium, etc.)
   - Only keep posts where title+body actually mentions silent disco, headphones for events/classes, or wireless audio for group experiences

5. **Score each remaining post** as HOT / WARM / COOL using the rules in the spec.

6. **For HOT leads**: fetch comments using `REDDIT_RETRIEVE_POST_COMMENTS` to understand the conversation. Draft a helpful reply (value-first, no links, casual tone, 3-5 sentences).

7. **Update `scripts/reddit-headset-leads.md`:**
   - Add new leads under "## Active Leads" with the format from the spec
   - Add new post IDs to the "Seen Post IDs" list at the bottom

8. **Report summary** to the user:
   - How many posts scanned
   - How many new leads found (by tier)
   - Any HOT leads with draft replies ready for review

## Important
- Never auto-post comments. Always save drafts for human review.
- If zero new leads found, that's normal. Say so briefly and stop.
- The Composio Reddit account is `reddit_harder-miry` (u/NicHuzz_).
