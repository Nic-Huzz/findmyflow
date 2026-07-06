# Reddit Monitor — Silent Disco Headset Business

## Purpose
Scan Reddit every 12 hours for people who need silent disco headphones for events, 
classes, workshops, weddings, retreats, or wellness experiences. Catch buyer intent 
posts within 24 hours so we can engage helpfully before competitors.

## Running the Monitor

### Automated (Cloud — runs while you sleep)
A remote agent runs every 12 hours via Anthropic's cloud infrastructure.
- **Trigger ID:** `trig_01QQTjnwtWdrvGAgVBrCsdKA`
- **Schedule:** Every 12h (midnight + noon UTC = 8am + 8pm WITA)
- **What it does:** Searches Reddit via public JSON API, filters noise, scores leads, 
  commits new leads to this repo, emails you at nichuzz@gmail.com for HOT leads
- **Manage:** https://claude.ai/code/scheduled/trig_01QQTjnwtWdrvGAgVBrCsdKA
- **Model:** claude-sonnet-4-6

```bash
# Run it manually right now (from Claude Code):
/schedule run trig_01QQTjnwtWdrvGAgVBrCsdKA

# Pause it:
/schedule update trig_01QQTjnwtWdrvGAgVBrCsdKA enabled=false

# Resume it:
/schedule update trig_01QQTjnwtWdrvGAgVBrCsdKA enabled=true

# Or manage at: https://claude.ai/code/scheduled
```

### Manual (Local — deeper search with Composio)
Run the Claude Code skill for a deeper search using Composio Reddit tools 
(authenticated, higher rate limits, can fetch comments):
```
/reddit-headset-monitor
```
This uses the skill at `.claude/skills/reddit-headset-monitor.md` with Composio's 
`REDDIT_SEARCH_ACROSS_SUBREDDITS` tool (account: reddit_harder-miry / u/NicHuzz_).

### When to use which
| Scenario | Use |
|----------|-----|
| Set and forget daily monitoring | Automated (cloud trigger) |
| Deep dive on a specific subreddit | Manual (Composio skill) |
| Fetch + read comments on a lead | Manual (Composio skill) |
| Draft reply to a HOT lead | Manual (Composio skill) |
| Check if the loop is working | `/schedule list` or visit the manage URL |

## Leads File
All leads are saved to `scripts/reddit-headset-leads.md`. Check it daily.
- **HOT leads** also trigger an email to nichuzz@gmail.com
- **WARM leads** are logged but no email
- **COOL leads** are logged for market intel
- **Seen Post IDs** at the bottom prevent duplicate alerts

## How it works (under the hood)
1. Search Reddit for 6 query variants (silent disco + intent keywords)
2. Filter out gaming/entertainment noise (Disco Elysium, Steam, etc.)
3. Score each post by intent level (HOT / WARM / COOL)
4. Check against seen-posts list to avoid duplicates
5. Save new leads to `scripts/reddit-headset-leads.md`
6. HOT leads: email alert to nichuzz@gmail.com
7. Commit + push updates to the repo

## Search Queries

### Tier 1 — Direct Intent (every run)
- `"silent disco" rent OR hire OR buy OR headphones OR equipment OR recommend`
- `"silent disco" yoga OR wellness OR meditation OR breathwork OR retreat OR ecstatic`
- `"wireless headphones" class OR workshop OR group OR outdoor OR instructor`
- `"headphone party" planning OR organize OR start`

### Tier 2 — Warm Intent (every run)
- `"silent disco" wedding OR corporate OR party OR event`
- `"silent disco" worth it OR cost OR price OR budget OR how much`
- `"silent disco" start OR launch OR business OR side hustle`
- `"outdoor class" audio OR music OR speaker OR noise`

### Tier 3 — Market Intel (weekly only)
- `"silent disco" review OR experience OR amazing OR loved`
- `"ecstatic dance" headphones OR equipment OR setup`
- `"sound bath" event OR equipment OR portable`

## Scoring

### HOT (notify immediately)
Post contains: "rent" / "hire" / "buy" / "recommend" / "looking for" / "equipment" / 
"where to get" / "need headphones" / "headset for"

### WARM (daily digest)  
Post contains: "worth it" / "how to" / "planning" / "thinking about" / "organize" / 
"how much" / "cost" / "price"

### Subreddit Boost (add +1 tier)
r/ecstaticdance, r/yoga, r/yogateachers, r/breathwork, r/soundhealing, 
r/EventPlanning, r/WeddingPlanning, r/weddingplanning, r/Fitness, r/pilates, 
r/CrossFit, r/running, r/DJs

City subreddits with "silent disco" also get boosted.

## Noise Filter (CRITICAL — skip these)
- Subreddit contains: game, gaming, steam, playstation, xbox, nintendo
- Title/body contains: "Disco Elysium", "PS4", "PS5", "Xbox", "Switch", "DLC", 
  "Steam Sale", "Slay the Spire"
- Subreddit is any of: slaythespire, Gaminggridcommunity, deadbydaylight, 
  CoDCompetitive, leagueoflegends, SillyTavernAI, LittleDevilInside, billsimmons,
  GameSale, EmulationOnAndroid, SteamDeck, pcgaming, Steam, HFY, Wraeclast,
  SkyrimBackStory, writingscaling, VideoGameDealsCanada, VideoGameDealsUS,
  TaleofImmortal, SWGOH, callmebyyourname, WWMRecruitment, saudi_gamers,
  gamerecommendations

## Comment Rules (when engaging)
- 90/10: 9 genuine helpful comments per 1 business mention
- Value first: answer their question, share experience, be helpful
- No links in first comment ever
- Only mention buySilentDiscoHeadphones.com if directly asked "where can I rent?"
- Match sub energy: casual on event subs, professional on business subs
- Short: 3-5 sentences max
- Personal angle: "I run silent disco events in Bali" not "our company offers..."
- Target posts with 0-5 existing comments (you'll be more visible)
- Never comment on posts older than 3 days

## Voice
- Casual, helpful, experienced
- "I've done this" energy
- Specific practical advice (what transmitter, how many channels, pricing tips)
- Share real numbers when relevant ($20/person is the sweet spot, 3 channels works best)

## Output Format
For each lead found, log to `scripts/reddit-headset-leads.md`:

```
### [DATE] [HOT/WARM/COOL] r/subreddit — Post title
- Author: u/username
- Score: X | Comments: X
- URL: https://reddit.com/...
- Intent: What they're looking for
- Draft reply: (if HOT)
- Status: NEW / REPLIED / PASSED
```

## Key Market Intel (from research)
- $20/person is the global price sweet spot for silent disco events
- AliExpress competitor: 20 pairs + transmitters for ~$600 (quality gamble)
- silentsoundsystem.com has a dedicated "wellness package builder" — direct competitor
- "Heartbeat silent disco" is an active group in Portland
- Facilitators' #1 pain: tech complexity. They want plug-and-play, not DIY AV.
- Weekly class users want to BUY, not rent. Consider lease-to-own tier.
- Pre-natal classes are an underserved use case (ambient speaker + headphones)
