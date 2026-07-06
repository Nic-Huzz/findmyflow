# Reddit Comment Drafts — June 22, 2026

*Review, edit in your voice, then approve for posting. Max 2 per day.*

---

## Draft 1 — BEST FIT
**Thread:** "I'm 32 and genuinely don't know what to do with my life anymore"
**Link:** https://www.reddit.com/r/findapath/comments/1ucyjhd/career_of_my_dream/
**Comments:** 3 | **Score:** 1
**Why:** 32yo, grew up poor, dreamed of astronomy, tried medicine, freelancing, now lost. Classic Head Full of Dreams.

**Draft comment:**

> The fact that you've tried this many things isn't a sign something's wrong with you. It's a sign you haven't found the thing that matches who you actually are yet.
>
> I was in a similar spot at 26. Corporate job, spent years and money trying to figure it out. What cracked it wasn't finding the "right career." It was realising I was scared of the things that actually excited me. The astronomy dream, the curiosity — that stuff doesn't go away. It just gets buried under "be practical."
>
> What helped me: I stopped trying to figure it all out and started doing one small thing a week that scared me. Not career moves. Just… things that made me feel something. Clarity came from that, not from more thinking.

**Tone check:** Personal, no links, no product mention, one insight. ✓

---

## Draft 2
**Thread:** "21, Confused, and Torn Between Passion, Pressure, and Practicality"
**Link:** https://www.reddit.com/r/findapath/comments/1ucyc80/21_confused_and_torn_between_passion_pressure_and/
**Comments:** 1 | **Score:** 1
**Why:** Stuck between AI freelancing, father's wishes, self-doubt. Classic gas-and-brake.

**Draft comment:**

> The sword hanging over your neck isn't the career choice. It's trying to make the "right" decision before you have enough data.
>
> At 21 you're not supposed to have this figured out. The people who look like they do are mostly just committed to one path and haven't hit their crisis yet.
>
> My take: do the AI thing on the side for 3 months. Actually do it, not research it. You'll know within a few weeks whether it lights you up or drains you. That data is worth more than any amount of thinking about it.

**Tone check:** Direct, practical, no links. ✓

---

## Draft 3
**Thread:** "I feel like my entire future plan has fallen apart and now I'm turning back to art"
**Link:** https://www.reddit.com/r/findapath/comments/1ucscsb/i_feel_like_my_entire_future_plan_has_fallen/
**Comments:** 1 | **Score:** 3
**Why:** 19, plan collapsed, returning to art. The "plan falling apart" IS the signal.

**Draft comment:**

> Your plan didn't fall apart. The plan that wasn't yours fell apart. That's different.
>
> The fact that you keep coming back to art isn't a failure of discipline. It's data. Your body is telling you something your brain hasn't fully accepted yet.
>
> I pushed away what I actually wanted for years because it didn't feel "practical." Turns out the impractical thing was ignoring it. The energy you spend fighting what you actually want is way more expensive than just exploring it.

**Tone check:** Reframe, personal, encouraging without being preachy. ✓

---

## Posting Rules
- [ ] Post max 2 today (pick your favourites)
- [ ] Wait 24h before posting the 3rd
- [ ] Edit these in YOUR words before posting — AI drafts get flagged
- [ ] No links, no app mentions (karma is still 2)
- [ ] Reply to any replies you get (genuine engagement builds karma)

## Next scan
Run again tomorrow or use: `/schedule` to automate daily

---

## Scan log — July 6, 2026

**Status: BLOCKED — no drafts generated (15th consecutive blocked run)**

Reddit remains inaccessible from the cloud execution environment. Confirmed: curl (exit 56, status 000). No change from any previous run.

---

## Scan log — July 5, 2026 (run 2)

**Status: BLOCKED — no drafts generated (14th consecutive blocked run)**

Reddit remains inaccessible from the cloud execution environment. Confirmed: curl (exit 56, status 000). No change from any previous run.

---

## Scan log — July 5, 2026 (run 1)

**Status: BLOCKED — no drafts generated (13th consecutive blocked run)**

Reddit remains inaccessible from the cloud execution environment. Confirmed: curl (exit 56, status 000). No change from any previous run.

---

## Scan log — July 4, 2026 (run 2)

**Status: BLOCKED — no drafts generated (12th consecutive blocked run)**

Reddit remains inaccessible from the cloud execution environment. Confirmed: curl (exit 56, status 000). No change from any previous run.

---

## Scan log — July 4, 2026 (run 1)

**Status: BLOCKED — no drafts generated (11th consecutive blocked run)**

Reddit remains inaccessible from the cloud execution environment. Confirmed: curl (exit 56, status 000). No change from any previous run.

---

## Scan log — July 3, 2026 (run 2)

**Status: BLOCKED — no drafts generated (10th consecutive blocked run)**

Reddit remains inaccessible from the cloud execution environment. Confirmed: curl (exit 56, status 000). No change.

---

## Scan log — July 3, 2026 (run 1)

**Status: BLOCKED — no drafts generated (9th consecutive blocked run)**

Reddit remains inaccessible from the cloud execution environment. Confirmed today: curl (exit 56, status 000). No change.

June 22 drafts are still available above.

---

## Scan log — July 2, 2026

**Status: BLOCKED — no drafts generated (confirmed twice today; 8th consecutive blocked run)**

Reddit remains inaccessible from the cloud execution environment. Confirmed twice today: curl (exit 56, status 000). No change from previous days.

June 22 drafts are still available above.

---

## Scan log — July 1, 2026

**Status: BLOCKED — no drafts generated (confirmed twice today; 6th consecutive blocked run)**

Reddit remains inaccessible from the cloud execution environment. All three routes tested and failed on both runs today: curl (exit 56, status 000), WebFetch ("unable to fetch"), WebSearch ("domain not accessible"). No new routes remain to try.

**This is a persistent environment-level network policy block, not a transient error.**

**Action required to fix (same as before):**
- Option A: Run the monitor locally where Reddit is accessible.
- Option B: Add reddit.com to the allowed domains in the Claude Code web environment network policy at code.claude.com/docs.
- Option C: Set up a GitHub Action (runs outside this environment) with Reddit API credentials to fetch posts and push results to the repo for Claude to draft from.

June 22 drafts are still available above.

---

## Scan log — June 30, 2026

**Status: BLOCKED — no drafts generated (confirmed twice this date)**

Reddit remains blocked by the cloud execution environment's network policy. Fourth consecutive blocked day. Both runs today confirmed: curl (status 000), WebFetch (explicit "unable to fetch" error), WebSearch (domain not accessible). All three routes fail identically, including RSS.

**To fix (action required):**
- Option A: Run the monitor locally where Reddit is accessible.
- Option B: Add reddit.com to the allowed domains in the Claude Code web environment network policy at code.claude.com/docs.
- Option C: Set up a local cron job or GitHub Action with Reddit API credentials that can reach Reddit, then push results to the repo.

June 22 drafts are still available above if you haven't posted them yet.

---

## Scan log — June 29, 2026

**Status: BLOCKED — no drafts generated**

Reddit is still blocked by the cloud execution environment's network policy. Tested: direct API (curl, status 000), RSS feed (status 000), and WebSearch (returns "domain not accessible"). All three routes fail.

**To fix:**
- Option A: Run the monitor locally where Reddit is accessible.
- Option B: Add reddit.com to the allowed domains in the Claude Code web environment network policy (see code.claude.com/docs).
- Option C: Switch to a third-party Reddit aggregator or Pushshift-style API that may not be blocked (untested).

June 22 drafts above are still available if you haven't posted them yet.

---

## Scan log — June 28, 2026

**Status: BLOCKED — no drafts generated**

Reddit (www.reddit.com, old.reddit.com) and all archive APIs (pullpush.io, teddit.net, libreddit.de) are blocked by the cloud execution environment's network policy. WebSearch also cannot crawl reddit.com.

**To fix:**
- Option A: Run the monitor locally where Reddit is accessible.
- Option B: Add reddit.com to the allowed domains in the Claude Code web environment network policy (see code.claude.com/docs).
- Option C: Switch to Reddit's RSS feed as the data source — `https://www.reddit.com/r/findapath/new/.rss` — which may route differently through the proxy. Worth testing.

June 22 drafts above are still unused if you haven't posted them.
