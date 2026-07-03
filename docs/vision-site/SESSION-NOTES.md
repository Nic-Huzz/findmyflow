# Vibe Rise Pitch Deck — Session Notes

## Project Setup

- **Source file**: `/Users/nichuzz/creations/Findmyflow/public/vibe-rise-full-pitch.html`
- **Deploy site**: `/Users/nichuzz/creations/content-site/` (standalone Vercel project)
- **Live URL**: https://content.nichuzz.com
- **Vercel project**: `nic-huzzs-projects/content-site`
- **DNS**: CNAME `content` → `cname.vercel-dns.com` on Cloudflare (nichuzz.com)

## Deploy Process

1. Copy source to content-site: `cp /Users/nichuzz/creations/Findmyflow/public/vibe-rise-full-pitch.html /Users/nichuzz/creations/content-site/index.html`
2. Deploy: `cd /Users/nichuzz/creations/content-site && vercel --prod`

The source of truth is the HTML in the Findmyflow repo (`public/vibe-rise-full-pitch.html`). The content-site just copies it as `index.html` for deployment.

## Changes Made This Session

### Slide 3 — "Both dials dim"
- "School: right answer or laughed at. Expression dims." → **"School: Sit there for 6 hours and wear a uniform. Expression dims."**
- "High school: the dance you didn't do, the thing you didn't say. Safety dims." → **"High school: judged on standardised testing and compliance. Safety dims."**
- "performing a version of themselves that feels acceptable" → **"fear of judgement suppressing their expression"**

### Slide 23 — Drive to Survive
- "for growing a movement" → **"for growing experiences"**

### All "Shift Architecture" references → "Vibe Rise Architecture"
- Slide 17 heading
- Slide 31 heading
- CSS comment
- HTML comment

### Pricing removed
- Slide ~14: "14-day trial → $14.99/mo or $99/year" → **"14-day free trial"**
- Depth slide: "$14.99/mo · $99/year · 14-day free trial" → **"14-day free trial"**

### Slide 31 (closing) — Removed "VIBE RISE" logo
- Kept just the sentence: "The content engine that makes Vibe Rise a globally recognised brand."

### New slide 27 — "Me first. Then everyone."
- Inserted after slide 26 ("You film it. We edit it.")
- Concept: Start with Huzz as the case study, build undeniable proof, then build repeatable systems the team can execute at scale
- Closer: "Proof first. System second. Then we open the floodgates."

### Slide 30 (now "The Europe Tour ask") — Rewritten for Kenj
- Was: generic "Content by layer" with 3 cards (Europe Tour, Fantasy League, Headset Ads)
- Now: Specific ask for Kenj's agency — 9 short-form videos (20-30s each)
  - **3 Arc Videos**: Tour Intro, Mid-Tour Check-in, End-of-Tour Highlight
  - **6 Venue Highlights**: One per monument event

### Centering fixes
- Added `margin:1rem auto` to left-aligned paragraphs on slides 21, 27, 30, 31

## Content Plan Decisions

Full plan saved at: `docs/europe-tour-content-plan.md` in the Findmyflow repo.

### Kenj (Agency) — $1000 USD budget, 9 videos
- 3 arc videos (intro, mid-tour check-in, end highlight) — 20-30s each
- 6 venue highlight reels — 20-30s each
- ~$111 per edit

### Spiff + Huzz (self-edited)

**Europe Tour:**
- Road trip vlogs (raw van life style)
- BTS reels per event
- Stories / daily content

**Fantasy League — 4 videos per week (16 per 4-week season):**

| Day | Video | Length |
|-----|-------|--------|
| Monday | **Matchup Preview** — Player photo + biz one-liner, side-by-side | 15s |
| Mid-week | **My Check-in** — Huzz to camera, personal healing/wahoo journey | 30-60s |
| Friday | **Weekly Highlights** — Compilation of best wahoos + healing breakthroughs | 30-45s |
| Sunday | **Results Recap** — Scoreboard, standings, season narrative | 15-20s |

### Dropped
- Creator positioning content (teaching experience creators how to blow up their positioning) was discussed but dropped to keep focus on the 4 weekly league videos.

## Indie Campers Commitments
What was promised to Indie Campers (van sponsor):
- **12-24 viral event content**: Cinematic edits of each silent disco event, Indie Campers tagged and credited
- **4-8 road trip vlogs**: Van life between cities, driving shots, cooking, waking up at landmarks

The Kenj venue highlights + self-edited road trip vlogs and BTS reels cover these commitments.

## Who Is Who
- **Huzz (Nic)** — Founder, on-camera, co-films
- **Spiff** — Co-films, co-edits self-made content
- **Kenj** — External editing agency, handles the 9 polished videos
- **Monkgrid** — Mentioned in original Indie Campers pitch as cinematic travel film editor (may or may not still be involved)
