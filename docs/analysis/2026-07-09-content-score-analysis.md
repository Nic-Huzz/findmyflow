---
type: analysis
created: 2026-07-09
status: baseline
---

# Content Score Analysis: First 20 Reels

## Formula

```
Step 1: Skip Rate Gate (>35% = score zeroed, hook failure)
Step 2: WES = (likes x 1) + (comments x 2) + (saves x 3) + (shares x 4)
Step 3: Retention Multiplier (avg_watch_time):
  - > 8s: 1.5x
  - 5-8s: 1.0x
  - 3-5s: 0.6x
  - < 3s: 0.3x
Step 4: Content Score = (WES / views) x Retention Multiplier x 1000
```

Based on research of 30+ sources (InfluenceFlow, Mosseri statements, Socialinsider, reverse-engineering analyses). Shares > Saves > Comments > Likes is the universal consensus. Skip rate as a gate (not multiplier) reflects how Instagram's distribution algorithm works: if the hook fails, the reel never enters the distribution funnel.

## Results (July 9, 2026)

### Scored Reels (passed skip gate)

| # | Post | Skip% | Views | WES | Avg Watch | Mult | Score |
|---|------|-------|-------|-----|-----------|------|-------|
| 1 | Coffee wake up | 31% | 4,253 | 186 | 8.5s | 1.5x | **65.6** |
| 2 | Harvard education (new ver.) | 23% | 2,586 | 86 | 7.6s | 1.0x | **33.3** |
| 3 | Did everything right | 26% | 7,292 | 130 | 8.4s | 1.5x | **26.7** |
| 4 | Shirt rip superhero | 27% | 671 | 3 | 6.2s | 1.0x | **4.5** |
| 5 | Harvard opened 1600s | 29% | 1,519 | 5 | 5.8s | 1.0x | **3.3** |
| 6 | Hit hard recently | 22% | 1,815 | 4 | 7.3s | 1.0x | **2.2** |
| 7 | Slapped 22yo Nic | 29% | 246 | 0 | 6.2s | 1.0x | **0** |
| 8 | Beer logo 22yo | 24% | 378 | 0 | 6.1s | 1.0x | **0** |

### Gate Failures (skip rate > 35%, score zeroed)

| Post | Skip% | WES | Insight |
|------|-------|-----|---------|
| Massive partier (x2) | 86%, 82% | 0 | Hook catastrophe |
| Saved 3 years (short) | 77% | 1 | Dead on arrival |
| Gamified life | 68% | 0 | Hook didn't land |
| Terrified weekly | 66% | 1 | Same |
| 43/100 quit job (dupe) | 55% | 0 | Repost penalty |
| Fear judgement | 51% | 4 | Had a share but hook lost half |
| Rise & Vibe Monday | 51% | 8 | Had 2 shares, hook still failed |
| **43/100 quit job (19 shares)** | **51%** | **79** | **Most shareable reel, killed by hook** |
| 3+ years saved | 43% | 7 | Hook barely failed |
| One thing a week | 42% | 1 | Just missed the gate |
| Vulnerable things | 35% | 0 | Right on the edge |

## Key Insights

### 1. Biggest missed opportunity
The "quit job, Bali, silent discos" reel: 19 shares on 166 views (11.4% share rate, insanely viral content) but 51% skip rate killed distribution. The people who watched it loved it. Re-shoot with a stronger 3-second hook.

### 2. Best hooks on least engaging content
"Beer logo" (24% skip), "Hit hard recently" (22%), "Slapped 22yo" (29%) all have great hooks but zero or near-zero engagement. The hook works, the content doesn't convert to action.

### 3. Only one complete reel
"Coffee wake up" is the only reel with good hook (31% skip) + high engagement (186 WES) + strong retention (8.5s). Everything else is strong in one dimension but weak in another.

### 4. 55% hook failure rate
11 out of 20 reels fail the skip gate. The single biggest lever is the first 3 seconds.

### 5. Shares drive everything
Top 3 scored reels all have significant shares (23, 20, 30). Posts with 0 shares almost always score under 5. 1 share = 4 WES points = 4 likes equivalent.

## Scoring Sources

- Mosseri (Jan 2025): watch time #1, sends/reach #2, likes/reach #3
- 1 DM share ~ 15 likes in distribution weight
- Share-to-View Ratio > 2% = viral signal, > 3% = breakout
- Skip rate < 35% = distribution qualified (reverse-engineered threshold)
- 75%+ avg watch time in first hour = performance tier unlock
- Weighted engagement formula (InfluenceFlow, creator agencies): shares 4x > saves 3x > comments 2x > likes 1x
