# FindMyFlow - User Journey Map

## Public Entry Points

```
              ┌─────────────────────────┬─────────────────────────┐
              │                         │                         │
    ┌─────────▼──────────┐  ┌──────────▼──────────┐  ┌──────────▼──────────┐
    │   Landing Page (/)  │  │  Career Clarity Quiz │  │  Public Lead Magnets │
    │                     │  │   /career-clarity    │  │   /try/offer/:type   │
    │  "Live Your         │  │   (4-min assessment) │  │   /try/nervous-system│
    │   Ambitions Quicker"│  │                      │  │   /try/flow-audit    │
    └─────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘
              │                         │                         │
              └─────────────┬───────────┘                         │
                            ▼                                     │
              ┌─────────────────────────┐                         │
              │  /get-started or /log-in │◄────────────────────────┘
              │   PersonaAssessment      │      (CTA at end of public flows)
              │   - Magic link auth      │
              │   - Archetype discovery  │
              └────────────┬────────────┘
                           │
                           ▼
```

## First-Time Onboarding

```
         ╔═════════════════════════════════════╗
         ║  FIRST-TIME ONBOARDING (/me)       ║
         ║  HomeFirstTime.jsx                  ║
         ╠═════════════════════════════════════╣
         ║  Q1: Employment status              ║
         ║  Q2: Wealth ladder rung             ║
         ║  Q3: Primary goal                   ║
         ║         │                           ║
         ║         ▼                           ║
         ║  Persona Reveal                     ║
         ║  (Vibe Seeker / Vibe Riser /        ║
         ║   Movement Maker)                   ║
         ╚══════════════╤══════════════════════╝
                        │
           ┌────────────┴────────────┐
           │                         │
     ┌─────▼──────┐          ┌──────▼───────┐
     │ Vibe Seeker │          │ Vibe Riser / │
     │ (new idea)  │          │ Movement     │
     │             │          │ Maker        │
     └─────┬──────┘          │ (existing    │
           │                 │  project)    │
           │                 └──────┬───────┘
           │                        │
           │                 ┌──────▼───────┐
           │                 │ QuickCapture  │
           │                 │ 5-step biz    │
           │                 │ data capture  │
           │                 └──────┬───────┘
           │                        │
           └────────┬───────────────┘
                    ▼
```

## Home & Navigation

```
  ╔═══════════════════════════════════════════════════════════════╗
  ║                    HOME (/me) - PROFILE                      ║
  ║  Projects list │ Stage progress │ Archetypes │ Streaks       ║
  ╠═══════════════════════════════════════════════════════════════╣
  ║                                                               ║
  ║   ┌─────────────────── Bottom Toolbar ──────────────────┐    ║
  ║   │  🏠 Home    🎯 Challenge    🧭 Compass    👤 Profile│    ║
  ║   │   /me      /7-day-challenge  /flow-compass  /profile│    ║
  ║   └─────────────────────────────────────────────────────┘    ║
  ╚═══════════════════════════════════════════════════════════════╝
```

## 10-Stage Progression System

Per project, following a purple (#5e17eb) → gold (#E9A23B) ombre gradient.

```
  ┌─────────────────────────────────────────────────────────────────┐
  │ STAGE 0: FLOW FINDER 🧭 (user-level, always accessible)       │
  │ #5e17eb                                                         │
  │                                                                 │
  │  /mind-space ──► /play-list-finder ──► /persona-identifier     │
  │  (required)      (optional)             (optional)              │
  │                                                                 │
  │  Deep dives: /nikigai/skills → /problems → /persona → /integration
  └─────────────────────────────────┬───────────────────────────────┘
                                    │
  ┌─────────────────────────────────▼───────────────────────────────┐
  │ STAGE 0.5: PLAY 🎮 (user-level, always accessible)            │
  │ #6d26d7                                                         │
  │  /groan-matrix — 2D courage challenges (Skills × Visibility)   │
  │  /lets-play ──► /lets-play-review                               │
  └─────────────────────────────────┬───────────────────────────────┘
                                    │
  ┌─────────────────────────────────▼───────────────────────────────┐
  │ STAGE 1: VALIDATION 🔍   #7d36c4                               │
  │  /persona-selection → /validation-flows                         │
  │  Groan: Fear of rejection when asking for feedback              │
  └─────────────────────────────────┬───────────────────────────────┘
                                    │
  ┌─────────────────────────────────▼───────────────────────────────┐
  │ STAGE 2: PRODUCT CREATION 🛠️   #8c45b0                        │
  │  /offer-builder → /lead-magnet-selection → /product-selection   │
  │  Groan: Fear of shipping before it's ready                      │
  └─────────────────────────────────┬───────────────────────────────┘
                                    │
  ┌─────────────────────────────────▼───────────────────────────────┐
  │ STAGE 3: TESTING 🎯   #9c559d                                  │
  │  /mvp-readiness → /feedback-analysis                            │
  │  Groan: Fear of hearing negative feedback                       │
  └─────────────────────────────────┬───────────────────────────────┘
                                    │
  ┌─────────────────────────────────▼───────────────────────────────┐
  │ STAGE 4: MONEY MODELS 💰   #ab6489                             │
  │  /attraction-offer → /upsell-offer → /downsell-offer           │
  │                   → /continuity-offer                           │
  │  Groan: Fear of charging money / being "salesy"                 │
  └─────────────────────────────────┬───────────────────────────────┘
                                    │
  ┌─────────────────────────────────▼───────────────────────────────┐
  │ STAGE 5: OFFER CREATION (Grand Slam) 🎯   #bb7476             │
  │  /offer-builder-v2 → /offer-stack-builder → /grand-slam-matrix │
  │  Groan: Fear of making offer too good / giving too much         │
  └─────────────────────────────────┬───────────────────────────────┘
                                    │
  ┌─────────────────────────────────▼───────────────────────────────┐
  │ STAGE 6: CAMPAIGN CREATION 📢   #ca8362                        │
  │  /leads-strategy → /funnel-builder → /launch-readiness         │
  │  Groan: Fear of public visibility                               │
  │  Links to → CRM Attract Tower                                   │
  └─────────────────────────────────┬───────────────────────────────┘
                                    │
  ┌─────────────────────────────────▼───────────────────────────────┐
  │ STAGE 7: LAUNCH 🚀   #da934f                                   │
  │  Execute launch with leads funnel                               │
  │  Groan: Fear of failure after going "all in"                    │
  │  Links to → CRM Sales Tower + Analytics                        │
  └─────────────────────────────────┬───────────────────────────────┘
                                    │
  ┌─────────────────────────────────▼───────────────────────────────┐
  │ STAGE 8: TRACKING 📊   #E9A23B (always accessible)            │
  │  /funnel-calculator (actual + planner modes)                    │
  │  /income-calculator  /funnel-baseline                           │
  │  Links to → CRM Analytics Dashboard                            │
  └─────────────────────────────────────────────────────────────────┘
```

## Support Systems (accessible anytime)

```
  ╔═══════════════════════════════════════════════════════════════════════╗
  ║                                                                       ║
  ║  🎯 7-Day Challenge (/7-day-challenge)                               ║
  ║     Daily & weekly quests across categories:                          ║
  ║     Groans (Recognise/Rewire/Reconnect) │ Healing │ Flow Finder      ║
  ║     Bonus │ Tracker                                                   ║
  ║                                                                       ║
  ║  🧭 Flow Compass (/flow-compass)                                     ║
  ║     Energy tracking: N(Flow) / E(Redirect) / S(Rest) / W(Honour)    ║
  ║                                                                       ║
  ║  📅 Weekly Planning (/weekly-planning)                                ║
  ║     4-phase cycle: Push → Flow → Rest → Launch                       ║
  ║                                                                       ║
  ║  💜 Healing Tools                                                     ║
  ║     /healing-compass │ /nervous-system                                ║
  ║                                                                       ║
  ║  👤 Profile Hub (/profile-hub)                                        ║
  ║     /archetypes → /archetypes/essence │ /archetypes/protective       ║
  ║     /hero-profile │ /guidebook (Codex lore library)                  ║
  ║                                                                       ║
  ║  📚 Library (/library)    🗣 Feedback (/feedback)                     ║
  ║                                                                       ║
  ║  🤖 Zarlo AI — Floating widget on every page (context-aware)         ║
  ╚═══════════════════════════════════════════════════════════════════════╝
```

## CRM Command Center

```
  ╔═══════════════════════════════════════════════════════════════════════╗
  ║              CRM COMMAND CENTER (/crm)                               ║
  ║              Bottom toolbar switches to CRM mode                     ║
  ╠═══════════════════════════════════════════════════════════════════════╣
  ║                                                                       ║
  ║         ┌──────────────── /crm (Dashboard) ────────────────┐         ║
  ║         │  Stats │ DailyActions │ EcosystemWidget │ Quick Actions │   ║
  ║         └───────────────────────┬──────────────────────────┘         ║
  ║                                 │                                     ║
  ║     ┌───────────────┬───────────┼───────────┬──────────────┐         ║
  ║     │               │           │           │              │         ║
  ║     ▼               ▼           ▼           ▼              ▼         ║
  ║  ┌──────┐     ┌──────────┐  ┌───────┐  ┌────────┐  ┌──────────┐   ║
  ║  │ATTRACT│     │ EXECUTE  │  │NURTURE│  │ TOOLS  │  │  SETUP   │   ║
  ║  │Tower 🎯│    │  🚀     │  │Tower💜│  │Tower🧰│  │  (CRM)   │   ║
  ║  └──┬───┘     └──────────┘  └──┬────┘  └──┬─────┘  └────┬─────┘   ║
  ║     │                           │          │              │         ║
  ║     ├─ Content Create           ├─ Contacts│              │         ║
  ║     ├─ Content Queue            ├─ Email   ├─ Analytics   ├─ Business║
  ║     ├─ Content History          │  Sequences├─ Calculators│  Baseline║
  ║     ├─ Pages                    ├─ Warm    │  (PTUF/LTV/ ├─ Customer║
  ║     └─ Marketing                │  Outreach│   CAC)       │  Segments║
  ║                                 ├─ Sales   ├─ Scripts     └─ Competitor║
  ║                                 ├─ Scripts ├─ Biz Systems    Snapshot║
  ║                                 ├─ Ascension├─ Import                ║
  ║                                 └─ Objections└─ Reports             ║
  ║                                                                       ║
  ║   ┌─────────────────── CRM Bottom Toolbar ──────────────────────┐    ║
  ║   │  🏠 Home   🎯 Attract   🚀 Execute   💜 Nurture   🧰 Tools│    ║
  ║   └─────────────────────────────────────────────────────────────┘    ║
  ╚═══════════════════════════════════════════════════════════════════════╝
```

## Key Flow Summary

| Journey | Path |
|---------|------|
| **New User** | Landing Page → Career Clarity Quiz or Get Started → Magic Link Auth → Archetype Discovery → Persona Assessment (3 questions) → Branch by persona type → Home (`/me`) |
| **Daily Loop** | Home → 7-Day Challenge (quests) → Flow Compass (energy check-in) → Profile Hub |
| **Stage Progression** | Each project progresses through Stages 1-7, completing required flows and milestones to "graduate" to the next stage. Each stage has a **Groan Challenge** (courage-based fear to face). Stages 0, 0.5, and 8 are always accessible. |
| **CRM Transition** | Once users reach Stage 6-7, the CRM Command Center becomes relevant — the bottom toolbar switches to CRM mode with its own 3-tower navigation (Attract, Nurture, Tools). |

## Color Gradient

The entire journey follows a purple → gold ombre:

| Stage | Color | Meaning |
|-------|-------|---------|
| 0 Flow Finder | `#5e17eb` | Discovery (brand purple) |
| 0.5 Play | `#6d26d7` | |
| 1 Validation | `#7d36c4` | |
| 2 Product | `#8c45b0` | |
| 3 Testing | `#9c559d` | |
| 4 Money Models | `#ab6489` | |
| 5 Grand Slam | `#bb7476` | |
| 6 Campaign | `#ca8362` | |
| 7 Launch | `#da934f` | |
| 8 Tracking | `#E9A23B` | Success (gold) |
