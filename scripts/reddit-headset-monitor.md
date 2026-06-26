# Reddit Headset Lead Monitor — Spec

## Purpose
Find Reddit posts from people who need silent disco / wireless headphone equipment for events, classes, workshops, weddings, retreats, or wellness experiences.

## Search Queries

Run these against Reddit's public JSON API:
```
https://www.reddit.com/search.json?q=QUERY&sort=new&limit=25&restrict_sr=false
```

1. `"silent disco" rent OR hire OR buy OR headphones OR equipment`
2. `"silent disco" yoga OR wellness OR meditation OR breathwork OR retreat`
3. `"silent disco" wedding OR corporate OR party OR event`
4. `"silent disco" worth it OR cost OR price OR budget`
5. `"wireless headphones" class OR workshop OR outdoor OR instructor`
6. `"outdoor class" audio OR music OR speaker`

## Noise Filters

Skip posts if:
- Older than 7 days (compare `created_utc` to current time)
- Post ID already in the "Seen Post IDs" list in `reddit-headset-leads.md`
- Subreddit is in the gaming/entertainment blocklist (see below)
- Title or body contains: "Disco Elysium", "Steam Sale", "Slay the Spire", "PS4", "PS5", "Xbox", "Switch", "DLC"

### Blocked subreddits
slaythespire, Gaminggridcommunity, deadbydaylight, CoDCompetitive, leagueoflegends, SillyTavernAI, LittleDevilInside, billsimmons, GameSale, EmulationOnAndroid, SteamDeck, pcgaming, Steam, HFY, Wraeclast, SkyrimBackStory, writingscaling, VideoGameDealsCanada, VideoGameDealsUS, TaleofImmortal, SWGOH, callmebyyourname, WWMRecruitment, saudi_gamers, gamerecommendations, MusicBattlestations, Schiit

Only keep posts where title+body actually mentions silent disco, headphones for events/classes, or wireless audio for group experiences.

## Scoring

**HOT** — post contains any of: `rent`, `hire`, `buy`, `recommend`, `looking for`, `equipment`, `where to get`, `need headphones`, `headset for`

**WARM** — post contains any of: `worth it`, `how to`, `planning`, `thinking about`, `organize`, `how much`, `cost`, `price`

**COOL** — everything else that passed filters

### Tier boosts (+1 tier)
If subreddit is any of: `ecstaticdance`, `yoga`, `yogateachers`, `breathwork`, `soundhealing`, `EventPlanning`, `WeddingPlanning`, `weddingplanning`, `Fitness`, `pilates`, `CrossFit`, `running`, `DJs`

## Alert Rules

- **HOT leads**: email `nichuzz@gmail.com` with subject `🔥 Reddit HOT Lead — Silent Disco Headsets`
- **No HOT leads**: no email
- **Zero new leads**: no commit, just report "No new leads found"

## Output Format (leads file)

```markdown
### [DATE] [HOT/WARM/COOL] r/subreddit — Post title
- Author: u/username
- Score: X | Comments: X
- URL: https://reddit.com/r/...
- Intent: Brief description of what they want
- Status: NEW
```
