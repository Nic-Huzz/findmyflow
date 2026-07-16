# Reddit Silent Disco Headset Lead Monitor — Spec

## Purpose

Monitor Reddit for people who need silent disco headphone equipment for events, classes, workshops, weddings, retreats, or wellness experiences.

## Search Queries

Run against `https://www.reddit.com/search.json?q=QUERY&sort=new&limit=25&restrict_sr=false`

1. `"silent disco" rent OR hire OR buy OR headphones OR equipment`
2. `"silent disco" yoga OR wellness OR meditation OR breathwork OR retreat`
3. `"silent disco" wedding OR corporate OR party OR event`
4. `"silent disco" worth it OR cost OR price OR budget`
5. `"wireless headphones" class OR workshop OR outdoor OR instructor`
6. `"outdoor class" audio OR music OR speaker`

## Scoring Rules

**HOT** — post contains any of: rent, hire, buy, recommend, looking for, equipment, where to get, need headphones, headset for  
**WARM** — post contains any of: worth it, how to, planning, thinking about, organize, how much, cost, price  
**COOL** — everything else that passed filters  

**Tier boost (+1)** if subreddit is: ecstaticdance, yoga, yogateachers, breathwork, soundhealing, EventPlanning, WeddingPlanning, weddingplanning, Fitness, pilates, CrossFit, running, DJs

## Noise Filters

### Age filter
Discard posts older than 7 days (compare `created_utc` to current UTC timestamp).

### Seen IDs filter
Discard any post whose `id` already appears in the "Seen Post IDs" section of `reddit-headset-leads.md`.

### Gaming subreddits (discard)
slaythespire, Gaminggridcommunity, deadbydaylight, CoDCompetitive, leagueoflegends, SillyTavernAI, LittleDevilInside, billsimmons, GameSale, EmulationOnAndroid, SteamDeck, pcgaming, Steam, HFY, Wraeclast, SkyrimBackStory, writingscaling, VideoGameDealsCanada, VideoGameDealsUS, TaleofImmortal, SWGOH, callmebyyourname, WWMRecruitment, saudi_gamers, gamerecommendations, MusicBattlestations, Schiit

### Content keywords (discard if title+body contains)
Disco Elysium, Steam Sale, Slay the Spire, PS4, PS5, Xbox, Switch, DLC

### Relevance requirement
Only keep posts where title+body actually mentions silent disco, headphones for events/classes, or wireless audio for group experiences.

## Lead Format

```
### [DATE] [HOT/WARM/COOL] r/subreddit — Post title
- Author: u/username
- Score: X | Comments: X  
- URL: https://reddit.com/r/...
- Intent: Brief description of what they want
- Status: NEW
```

## Email Alert

Send to nichuzz@gmail.com when any HOT leads are found:
- Subject: "🔥 Reddit HOT Lead — Silent Disco Headsets"
- Body: list each HOT lead with subreddit, title, author, URL, brief summary

## Commit Convention

`chore: reddit monitor — X new leads found`  
Only commit when new leads exist.
