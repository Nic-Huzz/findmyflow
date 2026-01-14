# FindMyFlow - System Architecture Map

> Visual representation of how all components interconnect

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    FINDMYFLOW                                        │
│                    "Burnt-out Professional → Thriving Business Owner"                │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
            ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
            │   DISCOVERY   │   │   BUSINESS    │   │    HEALING    │
            │    (Inner)    │   │   (Outer)     │   │   (Safety)    │
            └───────────────┘   └───────────────┘   └───────────────┘
```

---

## User Journey Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                  ENTRY POINTS                                         │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│    PersonaAssessment (/log-in)                                                       │
│           │                                                                           │
│           ▼                                                                           │
│    ┌─────────────────┐                                                               │
│    │ Persona Quiz    │ ──────────────────────────────────────────────┐               │
│    │ (3 questions)   │                                               │               │
│    └─────────────────┘                                               │               │
│           │                                                          │               │
│           ▼                                                          ▼               │
│    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│    │ Vibe Seeker │    │ Vibe Riser  │    │  Movement   │    │  Existing   │         │
│    │ (Corporate) │    │ (Figuring   │    │   Maker     │    │  Project    │         │
│    │             │    │   out)      │    │  (Scaling)  │    │   Flow      │         │
│    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘         │
│           │                  │                  │                  │                 │
│           └──────────────────┴──────────────────┴──────────────────┘                 │
│                                      │                                               │
│                                      ▼                                               │
│                              ┌───────────────┐                                       │
│                              │    Profile    │                                       │
│                              │   Dashboard   │                                       │
│                              │     (/me)     │                                       │
│                              └───────────────┘                                       │
│                                                                                       │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Systems Interconnection

```
                                    ┌─────────────────────┐
                                    │   PROFILE (/me)     │
                                    │   ───────────────   │
                                    │ • Flow Map (River)  │
                                    │ • Stage Progress    │
                                    │ • Quick Actions     │
                                    └─────────┬───────────┘
                                              │
           ┌──────────────────────────────────┼──────────────────────────────────┐
           │                                  │                                  │
           ▼                                  ▼                                  ▼
┌─────────────────────┐          ┌─────────────────────┐          ┌─────────────────────┐
│   7-DAY CHALLENGE   │          │      CRM TOWER      │          │    FLOW COMPASS     │
│   ───────────────   │          │   ───────────────   │          │   ───────────────   │
│ • Daily Quests      │◄────────►│ • Sales Pipeline    │          │ • Energy Tracking   │
│ • Points/Streaks    │          │ • Marketing Tasks   │          │ • N/E/S/W Mapping   │
│ • Leaderboards      │          │ • Analytics         │          │ • Journey Timeline  │
│ • Groan Reflections │          │ • Content System    │          │                     │
└─────────┬───────────┘          └─────────┬───────────┘          └─────────────────────┘
          │                                │
          │         ┌──────────────────────┘
          │         │
          ▼         ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                                   DISCOVERY FLOWS                                      │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │
│  │   Skills    │──►│  Problems   │──►│   Persona   │──►│ Integration │               │
│  │   Flow      │   │    Flow     │   │    Flow     │   │    Flow     │               │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘               │
│         │                │                 │                  │                       │
│         └────────────────┴─────────────────┴──────────────────┘                       │
│                                    │                                                   │
│                                    ▼                                                   │
│                          ┌─────────────────┐                                          │
│                          │  AI Clustering  │ ──► nikigai_clusters table               │
│                          │   & Insights    │                                          │
│                          └─────────────────┘                                          │
│                                                                                        │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## CRM Tower Detail

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                                    CRM TOWER                                           │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│    ┌───────────────────────────────────────────────────────────────────────────┐      │
│    │                            CRM DASHBOARD                                   │      │
│    │    Points │ Streak │ Revenue │ Tasks │ Recommendations │ Quick Actions    │      │
│    └───────────────────────────────────────────────────────────────────────────┘      │
│                    │                    │                    │                         │
│         ┌──────────┘                    │                    └──────────┐              │
│         ▼                               ▼                               ▼              │
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐          │
│  │     SALES       │         │    MARKETING    │         │    ANALYTICS    │          │
│  │   (/crm/sales)  │         │ (/crm/marketing)│         │ (/crm/analytics)│          │
│  ├─────────────────┤         ├─────────────────┤         ├─────────────────┤          │
│  │ • Kanban Board  │         │ • Quest Board   │         │ • Weekly Stats  │          │
│  │ • Deal Cards    │         │ • Daily Tasks   │         │ • Platform Mix  │          │
│  │ • Lead Scoring  │         │ • Content Trig  │         │ • Conversion %  │          │
│  │ • Stage Actions │         │ • Engagement    │         │ • Grades        │          │
│  └────────┬────────┘         └────────┬────────┘         └─────────────────┘          │
│           │                           │                                                │
│           │    ┌──────────────────────┘                                               │
│           │    │                                                                       │
│           ▼    ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────┐      │
│  │                          CONTENT SYSTEM                                      │      │
│  ├─────────────────────────────────────────────────────────────────────────────┤      │
│  │                                                                              │      │
│  │  Voice Training ──► Voice Profile ──► Content Generator ──► Content Queue   │      │
│  │        │                   │                  │                    │         │      │
│  │        ▼                   ▼                  ▼                    ▼         │      │
│  │  voice_profiles    content_history     Approval Queue      Published        │      │
│  │                                                                              │      │
│  └─────────────────────────────────────────────────────────────────────────────┘      │
│                                                                                        │
│           │                                                                            │
│           ▼                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────┐      │
│  │                         ASCENSION ENGINE                                     │      │
│  ├─────────────────────────────────────────────────────────────────────────────┤      │
│  │                                                                              │      │
│  │  Deal Won ──► Offer Category ──► Value Ladder Position ──► Ascension Tasks  │      │
│  │                                                                              │      │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │      │
│  │  │Attract- │  │   Core  │  │  Upsell │  │Downsell │  │Continu- │           │      │
│  │  │  ion    │─►│  Offer  │─►│         │  │         │  │  ity    │           │      │
│  │  └─────────┘  └─────────┘  └────┬────┘  └────┬────┘  └─────────┘           │      │
│  │                                 │            │                              │      │
│  │                                 └────────────┘                              │      │
│  │                                       │                                     │      │
│  │                                       ▼                                     │      │
│  │                              Retention Tracking                             │      │
│  │                                                                              │      │
│  └─────────────────────────────────────────────────────────────────────────────┘      │
│                                                                                        │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Money Model / Offer Building Flow

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                              MONEY MODEL SYSTEM                                        │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│                            ┌─────────────────────┐                                    │
│                            │  $100M Offer Builder│                                    │
│                            │   (8-Step Flow)     │                                    │
│                            └──────────┬──────────┘                                    │
│                                       │                                               │
│              ┌────────────────────────┼────────────────────────┐                      │
│              │                        │                        │                      │
│              ▼                        ▼                        ▼                      │
│     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐              │
│     │    Product      │     │    Service      │     │     Hybrid      │              │
│     │    Version      │     │    Version      │     │    Version      │              │
│     └────────┬────────┘     └────────┬────────┘     └────────┬────────┘              │
│              │                       │                       │                        │
│              └───────────────────────┴───────────────────────┘                        │
│                                      │                                                │
│                                      ▼                                                │
│                    ┌─────────────────────────────────────┐                           │
│                    │         Grand Slam Score            │                           │
│                    │  (Dream Outcome × Probability ×     │                           │
│                    │   Speed × Ease - Cost - Effort)     │                           │
│                    └─────────────────────────────────────┘                           │
│                                      │                                                │
│    ┌─────────────────────────────────┼─────────────────────────────────┐             │
│    │                                 │                                 │             │
│    ▼                                 ▼                                 ▼             │
│ ┌──────────────┐            ┌──────────────┐            ┌──────────────┐            │
│ │  Lead Magnet │            │  Core Offer  │            │   Funnel     │            │
│ │  Selection   │───────────►│   Strategy   │───────────►│   Builder    │            │
│ └──────────────┘            └──────────────┘            └──────────────┘            │
│         │                          │                           │                     │
│         │                          │                           │                     │
│         ▼                          ▼                           ▼                     │
│ ┌──────────────┐            ┌──────────────┐            ┌──────────────┐            │
│ │  Attraction  │            │    Upsell    │            │   Funnel     │            │
│ │    Flow      │            │  / Downsell  │            │  Calculator  │            │
│ │              │            │  / Continuity│            │   (Stage 7)  │            │
│ └──────────────┘            └──────────────┘            └──────────────┘            │
│                                                                                       │
│    ┌─────────────────────────────────────────────────────────────────────────┐       │
│    │                    IMPLEMENTATION CHECKLISTS                             │       │
│    ├─────────────────────────────────────────────────────────────────────────┤       │
│    │  19 offer-type checklists with phases:                                  │       │
│    │  • Attraction (4 types)                                                 │       │
│    │  • Upsell (5 types)                                                     │       │
│    │  • Downsell (5 types)                                                   │       │
│    │  • Continuity (5 types)                                                 │       │
│    │                                                                          │       │
│    │  Each with: Quick Wins → Build Foundation → Scale → Master              │       │
│    └─────────────────────────────────────────────────────────────────────────┘       │
│                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Healing & Gamification Layer

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                           HEALING SYSTEM                                               │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│    ┌─────────────────────────────────────────────────────────────────────────────┐    │
│    │                         NERVOUS SYSTEM FLOW                                  │    │
│    │                        (11-Step Journey)                                     │    │
│    ├─────────────────────────────────────────────────────────────────────────────┤    │
│    │                                                                              │    │
│    │  Visibility Fear ──► Money Beliefs ──► Safety Contracts ──► Protective Voice│    │
│    │                                                                              │    │
│    └───────────────────────────────────┬─────────────────────────────────────────┘    │
│                                        │                                              │
│                                        ▼                                              │
│    ┌─────────────────────────────────────────────────────────────────────────────┐    │
│    │                          HEALING COMPASS                                     │    │
│    │                        (8-Screen Process)                                    │    │
│    ├─────────────────────────────────────────────────────────────────────────────┤    │
│    │                                                                              │    │
│    │  Past Parallel ──► Splinter Removal ──► Recalibration ──► New Safety        │    │
│    │                                                                              │    │
│    └───────────────────────────────────┬─────────────────────────────────────────┘    │
│                                        │                                              │
│              ┌─────────────────────────┼─────────────────────────────┐               │
│              │                         │                             │               │
│              ▼                         ▼                             ▼               │
│    ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐           │
│    │ Essence Profile  │     │Protective Profile│     │ Groan Reflections│           │
│    │ (Natural Gifts)  │     │(Defense Patterns)│     │   (5-Step)       │           │
│    └──────────────────┘     └──────────────────┘     └──────────────────┘           │
│                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────────────┐
│                           GAMIFICATION SYSTEM                                          │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│    ┌─────────────────────────────────────────────────────────────────────────────┐    │
│    │                          7-DAY CHALLENGE                                     │    │
│    ├─────────────────────────────────────────────────────────────────────────────┤    │
│    │                                                                              │    │
│    │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                │    │
│    │  │  GROANS   │  │  HEALING  │  │  BUSINESS │  │   BONUS   │                │    │
│    │  ├───────────┤  ├───────────┤  ├───────────┤  ├───────────┤                │    │
│    │  │• Recognise│  │• Release  │  │• Content  │  │• Extra    │                │    │
│    │  │• Rewire   │  │• Reconnect│  │• Outreach │  │  Credit   │                │    │
│    │  │• Reflect  │  │           │  │• Engage   │  │           │                │    │
│    │  └───────────┘  └───────────┘  └───────────┘  └───────────┘                │    │
│    │                                                                              │    │
│    └─────────────────────────────────────────────────────────────────────────────┘    │
│                                        │                                              │
│              ┌─────────────────────────┼─────────────────────────────┐               │
│              │                         │                             │               │
│              ▼                         ▼                             ▼               │
│    ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐           │
│    │      POINTS      │     │     STREAKS      │     │   LEADERBOARD    │           │
│    ├──────────────────┤     ├──────────────────┤     ├──────────────────┤           │
│    │ • Per quest type │     │ • Current streak │     │ • Weekly ranking │           │
│    │ • Level progress │     │ • Longest streak │     │ • All-time rank  │           │
│    │ • 10 levels      │     │ • Break penalty  │     │ • Group boards   │           │
│    └──────────────────┘     └──────────────────┘     └──────────────────┘           │
│                                                                                       │
│    ┌─────────────────────────────────────────────────────────────────────────────┐    │
│    │                       STAGE PROGRESSION                                      │    │
│    ├─────────────────────────────────────────────────────────────────────────────┤    │
│    │                                                                              │    │
│    │  Stage 1      Stage 2       Stage 3     Stage 4      Stage 5     Stage 6    │    │
│    │  Validation → Product    → Testing   → Money     → Campaign → Launch       │    │
│    │              Creation                  Models      Creation                  │    │
│    │                                                                              │    │
│    │                            + Stage 7: Tracking (Always Accessible)           │    │
│    │                                                                              │    │
│    └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## AI Layer (Zarlo)

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                              ZARLO AI CO-FOUNDER                                       │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│                              ┌─────────────────┐                                      │
│                              │  ZarloWidget    │ ◄── Floating button on all pages    │
│                              │  (Entry Point)  │                                      │
│                              └────────┬────────┘                                      │
│                                       │                                               │
│                                       ▼                                               │
│                              ┌─────────────────┐                                      │
│                              │   ZarloChat     │                                      │
│                              │ (Streaming UI)  │                                      │
│                              └────────┬────────┘                                      │
│                                       │                                               │
│         ┌─────────────────────────────┼─────────────────────────────┐                │
│         │                             │                             │                │
│         ▼                             ▼                             ▼                │
│  ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐            │
│  │ zarloEngine.js  │       │zarloPageContent │       │ Implementation  │            │
│  │                 │       │                 │       │     Coach       │            │
│  ├─────────────────┤       ├─────────────────┤       ├─────────────────┤            │
│  │ • Intake routing│       │ • Page context  │       │ • Task coaching │            │
│  │ • Accountability│       │ • Help content  │       │ • AI generation │            │
│  │ • Struggle map  │       │ • Quick replies │       │ • Clarity Q's   │            │
│  └─────────────────┘       └─────────────────┘       └─────────────────┘            │
│                                       │                                               │
│                                       ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐     │
│  │                        CONTEXT SOURCES                                       │     │
│  ├─────────────────────────────────────────────────────────────────────────────┤     │
│  │                                                                              │     │
│  │  User Data:          Business Data:           Healing Data:                  │     │
│  │  • Persona type      • Offer builder results  • NS responses                 │     │
│  │  • Current stage     • Voice profile          • Protective voice             │     │
│  │  • Points/streak     • Customer segments      • Safety contracts             │     │
│  │  • Recent quests     • Revenue goals          • Archetype                    │     │
│  │                                                                              │     │
│  └─────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Overview

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE TABLES                                           │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  USER CORE                         CRM                           CONTENT               │
│  ──────────                        ───                           ───────               │
│  • user_stage_progress             • sales_deals                 • content_history     │
│  • user_projects                   • deal_outcomes               • voice_profiles      │
│  • user_crm_stats                  • marketing_tasks             • generated_assets    │
│                                    • recommendations             • story_bank          │
│                                                                                        │
│  DISCOVERY                         ASCENSION                     GAMIFICATION          │
│  ─────────                         ─────────                     ────────────          │
│  • nikigai_responses               • ascension_records           • quest_completions   │
│  • nikigai_clusters                • ascension_triggers          • challenge_instances │
│  • nikigai_key_outcomes            • continuity_customers        • groan_reflections   │
│  • persona_profiles                                              • milestone_completions│
│                                                                                        │
│  HEALING                           ASSESSMENTS                   TRACKING              │
│  ───────                           ───────────                   ────────              │
│  • nervous_system_responses        • attraction_offer_*          • funnel_metrics      │
│  • healing_compass_responses       • upsell_assessments          • flow_entries        │
│  • lead_flow_profiles              • downsell_assessments        • autonomy_setup_*    │
│                                    • continuity_assessments                            │
│                                    • leads_assessments                                 │
│                                                                                        │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                DATA FLOW                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   USER INPUT                    PROCESSING                      OUTPUT              │
│   ──────────                    ──────────                      ──────              │
│                                                                                      │
│   Discovery Flows ──────────► AI Clustering ──────────────► Insights & Clusters    │
│                                                                                      │
│   Offer Builder ────────────► Grand Slam Scoring ─────────► Product Strategy       │
│                                                                                      │
│   Voice Training ───────────► DNA Extraction ─────────────► Voice Profile          │
│                                                                                      │
│   Content Trigger ──────────► Content Generator ──────────► Platform Content       │
│                                                                                      │
│   Deal Won ─────────────────► Ascension Processing ───────► Value Ladder Position  │
│                                                                                      │
│   Quest Completion ─────────► Points/Streaks ─────────────► Leaderboard Update     │
│                                                                                      │
│   Nervous System ───────────► Archetype Analysis ─────────► Protective Profile     │
│                                                                                      │
│   Marketing Task ───────────► Engagement Capture ─────────► Analytics/Grade        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Navigation Map

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              ROUTE STRUCTURE                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  /                        Login/Signup + Persona Quiz                               │
│  /me                      Profile Dashboard (main hub)                              │
│  /7-day-challenge         Gamified Quest System                                     │
│  /flow-compass            Energy/Direction Tracking                                 │
│  /library                 All Discoveries Organized                                 │
│                                                                                      │
│  /nikigai/*               Discovery Flows                                           │
│    /skills                  Skills Discovery                                         │
│    /problems                Problems Discovery                                       │
│    /persona                 Persona Discovery                                        │
│    /integration             Synthesis Flow                                           │
│                                                                                      │
│  /offer-builder*          Money Model Building                                       │
│    /offer-builder           Original Offer Builder                                   │
│    /offer-builder-v2        8-Step $100M Flow                                        │
│    /lead-magnet-selection   Lead Magnet Types                                        │
│    /product-selection       Product Value Equation                                   │
│    /funnel-builder          Campaign Builder                                         │
│    /funnel-calculator       Metrics Tracker                                          │
│                                                                                      │
│  /crm/*                   CRM Tower                                                  │
│    /crm                     Dashboard                                                │
│    /crm/sales               Pipeline                                                 │
│    /crm/marketing           Task Board                                               │
│    /crm/analytics           Stats                                                    │
│    /crm/ascension           Value Ladder                                             │
│    /crm/objections          Win/Loss Patterns                                        │
│    /crm/content-*           Content System                                           │
│    /crm/setup               Autonomous Setup                                         │
│                                                                                      │
│  /nervous-system          Trauma Boundary Mapping                                   │
│  /healing-compass         Healing Process Flow                                      │
│  /archetypes/*            Profile Displays                                          │
│  /voice-training          Voice DNA Extraction                                      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Flow Dependencies & Context Cascade

> How each question flow feeds, supports, and adds context to subsequent flows

### Master Flow Dependency Map

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           FLOW DEPENDENCY HIERARCHY                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  TIER 0: ONBOARDING V2 (Entry + Path Selection)                                     │
│  ═══════════════════════════════════════════════                                     │
│                                                                                      │
│       ┌─────────────────────────────────────────────────────────────────────┐       │
│       │                    PERSONA ASSESSMENT (Q1-Q3)                        │       │
│       ├─────────────────────────────────────────────────────────────────────┤       │
│       │                                                                      │       │
│       │  Q1: Employment Status                                               │       │
│       │      → employed_exploring | employed_building | solo_early | solo_est│       │
│       │                          ↓                                           │       │
│       │  Q2: Wealth Ladder Position                                          │       │
│       │      → pre_ladder | service | productized | products                 │       │
│       │                          ↓                                           │       │
│       │  Q3: Primary Goal                                                    │       │
│       │      → discovery | creation | monetization | growth                  │       │
│       │                                                                      │       │
│       └──────────────────────────┬──────────────────────────────────────────┘       │
│                                  │                                                   │
│                                  │ OUTPUTS:                                          │
│                                  │ • persona_type (derived from wealth_ladder)       │
│                                  │ • guidance_emphasis (8 types)                     │
│                                  │ • starting_stage (0-6 based on ladder/goal)       │
│                                  │ • onboarding_path (1-4)                           │
│                                  │                                                   │
│                                  ▼                                                   │
│       ┌──────────────────────────┴──────────────────────────┐                       │
│       │                                                      │                       │
│       ▼                                                      ▼                       │
│  ┌─────────────┐                                    ┌─────────────────────┐         │
│  │   PATH 1    │                                    │    PATHS 2-4        │         │
│  │ pre_ladder  │                                    │ service/product-    │         │
│  │             │                                    │ ized/products       │         │
│  └──────┬──────┘                                    └──────────┬──────────┘         │
│         │                                                      │                     │
│         ▼                                                      ▼                     │
│  ┌─────────────────┐                            ┌──────────────────────────┐        │
│  │   Flow Finder   │                            │     QUICK CAPTURE        │        │
│  │ (/nikigai/skills)│                            │     (5-Step Flow)        │        │
│  │                 │                            ├──────────────────────────┤        │
│  │ Deep Discovery  │                            │ 1. Skills (wheel picker) │        │
│  │ or Fast Track   │                            │ 2. Problems (wheel)      │        │
│  │                 │                            │ 3. Personas (wheel)      │        │
│  └─────────────────┘                            │ 4. Products (multi-add)  │        │
│                                                 │ 5. Summary               │        │
│                                                 └────────────┬─────────────┘        │
│                                                              │                       │
│                                                              │ OUTPUTS:              │
│                                                              │ • nikigai_responses   │
│                                                              │   (skills/problems/   │
│                                                              │    personas)          │
│                                                              │ • products[] with     │
│                                                              │   money_model_tier    │
│                                                              │ • Starting stage set  │
│                                                              │                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  8 GUIDANCE EMPHASIS TYPES (Determined by Q2 + Q3)                                  │
│  ═════════════════════════════════════════════════                                   │
│                                                                                      │
│  ┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐          │
│  │ deep_discovery  │ fast_track_     │ offer_          │ client_         │          │
│  │ (Purple)        │ creation (Amber)│ refinement(Blue)│ acquisition     │          │
│  │ Stages 0-1      │ Stages 0-2      │ Stages 2-3      │ (Emerald) 2-4   │          │
│  ├─────────────────┼─────────────────┼─────────────────┼─────────────────┤          │
│  │ suite_building  │ launch_sales    │ pipeline_       │ scale_systems   │          │
│  │ (Violet)        │ (Red)           │ optimization    │ (Orange)        │          │
│  │ Stages 3-5      │ Stages 4-6      │ (Cyan) 5-7      │ Stages 1-7      │          │
│  └─────────────────┴─────────────────┴─────────────────┴─────────────────┘          │
│                                                                                      │
│  Each emphasis affects: Quest priorities, Dashboard hero, Zarlo personality         │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Tier 0.5: Quick Capture → Discovery Bridge

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  QUICK CAPTURE ↔ FLOW FINDER RELATIONSHIP                                           │
│  ════════════════════════════════════════                                            │
│                                                                                      │
│  Quick Capture (Paths 2-4)              Flow Finder (Path 1 + Deep Dive)            │
│  ─────────────────────────              ────────────────────────────────            │
│  • Fast: 5 steps, wheel pickers         • Deep: AI-guided conversations             │
│  • Captures existing knowledge          • Discovers hidden skills/patterns          │
│  • Products pre-defined                 • Products emerge from discovery            │
│  • Source: 'quick_capture'              • Source: 'flow_finder'                     │
│                                                                                      │
│  BOTH write to same tables:                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐       │
│  │ nikigai_responses (skills, problems, personas)                          │       │
│  │ products (product suite with money_model_tier)                          │       │
│  └─────────────────────────────────────────────────────────────────────────┘       │
│                                                                                      │
│  Quick Capture users can LATER do Flow Finder for:                                  │
│  • Deeper skill exploration                                                         │
│  • Uncover problems they didn't know they solve                                     │
│  • Refine persona with AI conversation                                              │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Tier 1: Discovery (Deep Dive Path)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  TIER 1: DISCOVERY (Who Am I? What Do I Offer?)                                     │
│  ═══════════════════════════════════════════════                                     │
│                                                                                      │
│       ┌──────────────┐      ┌──────────────┐      ┌──────────────┐                  │
│       │    Skills    │─────►│   Problems   │─────►│   Persona    │                  │
│       │    Flow      │      │     Flow     │      │     Flow     │                  │
│       └──────┬───────┘      └──────┬───────┘      └──────┬───────┘                  │
│              │                     │                     │                           │
│              │    "What am I       │    "What problems   │   "Who needs             │
│              │     good at?"       │     can I solve?"   │    this help?"           │
│              │                     │                     │                           │
│              └─────────────────────┼─────────────────────┘                           │
│                                    │                                                 │
│                                    ▼                                                 │
│                          ┌──────────────────┐                                       │
│                          │   Integration    │                                       │
│                          │      Flow        │                                       │
│                          └────────┬─────────┘                                       │
│                                   │                                                  │
│                                   │ OUTPUTS:                                         │
│                                   │ • nikigai_clusters (skills, problems)            │
│                                   │ • persona_profiles (ideal customer)              │
│                                   │ • nikigai_key_outcomes (opportunities)           │
│                                   │                                                  │
└───────────────────────────────────┼──────────────────────────────────────────────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
```

### Tier 1 → Tier 2 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  TIER 2A: OFFER BUILDING (What Do I Sell?)                                          │
│  ═════════════════════════════════════════                                           │
│                                                                                      │
│  FROM ONBOARDING + DISCOVERY:                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐            │
│  │ • wealth_ladder_rung → Default product category                     │            │
│  │ • products[] from Quick Capture → Pre-populated product suite       │            │
│  │ • Skills clusters → Inform "What you deliver"                       │            │
│  │ • Problems solved → Inform "Dream Outcome" descriptions             │            │
│  │ • Persona profile → Pre-populate "Who this is for"                  │            │
│  └─────────────────────────────────────────────────────────────────────┘            │
│                                      │                                               │
│         ┌────────────────────────────┴────────────────────────────┐                 │
│         │                                                         │                 │
│         ▼                                                         ▼                 │
│  ┌─────────────────────────┐                      ┌─────────────────────────┐       │
│  │   $100M Offer Builder   │                      │   GRAND SLAM OFFER V2   │       │
│  │     (V1: 8-Step Flow)   │─────────────────────►│   (/offer-builder-v2)   │       │
│  │                         │     REQUIRED         │                         │       │
│  │  • Dream Outcome        │     PREREQUISITE     │  • Bonuses (min 1)      │       │
│  │  • Proof Stack          │                      │  • Guarantee            │       │
│  │  • Speed Advantage      │                      │  • Scarcity             │       │
│  │  • Ease Factor          │                      │  • Offer Naming         │       │
│  │  • Obstacles            │                      │                         │       │
│  └────────────┬────────────┘                      └────────────┬────────────┘       │
│               │                                                │                     │
│               │ OUTPUTS:                                       │ OUTPUTS:            │
│               │ • offer_builder_assessments                    │ • grand_slam_offers │
│               │ • Grand Slam Score                             │ • Total bonus value │
│               │ • Core offer definition                        │ • Complete offer    │
│               │                                                │   package           │
│               │                                                │                     │
│               └────────────────────┬───────────────────────────┘                    │
│                                    │                                                 │
│              ┌──────────────────────┼──────────────────────┐                        │
│              │                      │                      │                        │
│              ▼                      ▼                      ▼                        │
│      ┌────────────────┐    ┌────────────────┐    ┌────────────────┐                │
│      │    Product     │    │    Service     │    │     Hybrid     │                │
│      │    Version     │    │    Version     │    │    Version     │                │
│      └───────┬────────┘    └───────┬────────┘    └───────┬────────┘                │
│              │                     │                     │                          │
│              └─────────────────────┼─────────────────────┘                          │
│                                    │                                                 │
│                                    │ COMBINED OUTPUTS:                               │
│                                    │ • Grand Slam Score (Dream × Prob × Speed × Ease)│
│                                    │ • Core Offer definition + Bonuses + Guarantee   │
│                                    │ • Pricing strategy                              │
│                                    │ • Value elements breakdown                      │
│                                    │ • Proof stack requirements                      │
│                                    │ • Bonuses/Obstacle removers                     │
│                                    │                                                 │
│                                    ▼                                                 │
│                  ┌─────────────────────────────────────┐                            │
│                  │       Lead Magnet Selection         │                            │
│                  └─────────────────┬───────────────────┘                            │
│                                    │                                                 │
│   FROM OFFER BUILDER:              │ OUTPUTS:                                        │
│   • Core Offer → Informs magnet    │ • Lead magnet type                             │
│     that leads to it               │ • Value preview strategy                       │
│   • Dream Outcome → Shapes         │ • Conversion hook                              │
│     "quick win" magnet offers      │                                                │
│                                    │                                                 │
│                                    ▼                                                 │
│                  ┌─────────────────────────────────────┐                            │
│                  │        Attraction Offer Flow        │                            │
│                  └─────────────────┬───────────────────┘                            │
│                                    │                                                 │
│   FROM LEAD MAGNET:                │ OUTPUTS:                                        │
│   • Magnet type → Shapes           │ • Attraction offer strategy                    │
│     attraction messaging           │ • Engagement hooks                             │
│   FROM DISCOVERY:                  │ • Entry point positioning                      │
│   • Persona pain points →          │                                                │
│     Attraction triggers            │                                                │
│                                    │                                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Value Ladder Flow Chain

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  TIER 2B: VALUE LADDER (How Do I Maximize Customer Value?)                          │
│  ═════════════════════════════════════════════════════════                           │
│                                                                                      │
│       ┌────────────────────────────────────────────────────────────────────────┐    │
│       │                     FROM CORE OFFER:                                    │    │
│       │  • Price point → Determines upsell/downsell ranges                     │    │
│       │  • Value elements → What to enhance or simplify                        │    │
│       │  • Customer journey → Where additional offers fit                      │    │
│       └────────────────────────────────────────────────────────────────────────┘    │
│                                         │                                            │
│                    ┌────────────────────┼────────────────────┐                      │
│                    │                    │                    │                      │
│                    ▼                    ▼                    ▼                      │
│           ┌──────────────┐     ┌──────────────┐     ┌──────────────┐               │
│           │  Upsell Flow │     │ Downsell Flow│     │ Continuity   │               │
│           │              │     │              │     │    Flow      │               │
│           └──────┬───────┘     └──────┬───────┘     └──────┬───────┘               │
│                  │                    │                    │                        │
│   USES:          │     USES:          │     USES:          │                        │
│   • Core offer   │     • Core offer   │     • All offers   │                        │
│     success to   │       rejection    │       to build     │                        │
│     enhance      │       to offer     │       recurring    │                        │
│     value        │       alternative  │       revenue      │                        │
│                  │                    │                    │                        │
│   OUTPUTS:       │     OUTPUTS:       │     OUTPUTS:       │                        │
│   • Premium tier │     • Lower-tier   │     • Membership   │                        │
│   • Add-ons      │       option       │       model        │                        │
│   • Fast-track   │     • Payment plan │     • Retention    │                        │
│     options      │     • Lite version │       hooks        │                        │
│                  │                    │                    │                        │
│                  └────────────────────┼────────────────────┘                        │
│                                       │                                              │
│                                       ▼                                              │
│                        ┌─────────────────────────┐                                  │
│                        │   Leads Strategy Flow   │                                  │
│                        └────────────┬────────────┘                                  │
│                                     │                                                │
│   FROM ALL OFFERS:                  │ OUTPUTS:                                       │
│   • Complete value ladder →         │ • Lead generation channels                    │
│     Informs traffic strategy        │ • Acquisition cost targets                    │
│   • Customer LTV → Budget           │ • Traffic sources                             │
│     for lead acquisition            │ • Conversion pathways                         │
│                                     │                                                │
│                                     ▼                                                │
│                        ┌─────────────────────────┐                                  │
│                        │     Funnel Builder      │                                  │
│                        └────────────┬────────────┘                                  │
│                                     │                                                │
│   FROM ALL FLOWS:                   │ OUTPUTS:                                       │
│   • Attraction → Entry point        │ • Complete funnel structure                   │
│   • Lead Magnet → Opt-in step       │ • Page sequence                               │
│   • Core Offer → Sales page         │ • Automation sequences                        │
│   • Upsell/Downsell → Post-sale     │ • Offer stack visualization                   │
│   • Continuity → Retention          │                                                │
│                                     │                                                │
│                                     ▼                                                │
│                        ┌─────────────────────────┐                                  │
│                        │   Funnel Calculator     │ ◄── Stage 7 (Always Accessible) │
│                        │      (Stage 7)          │                                  │
│                        └─────────────────────────┘                                  │
│                                                                                      │
│   FROM FUNNEL BUILDER:              OUTPUTS:                                         │
│   • Offer prices → Revenue calcs    • Actual vs. planned metrics                    │
│   • Stage conversion targets        • Industry benchmark comparisons                │
│   • Expected traffic volume         • Revenue projections                           │
│                                     • Optimization recommendations                  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Healing Flow Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  TIER 2C: HEALING (Why Am I Stuck?)                                                 │
│  ══════════════════════════════════                                                  │
│                                                                                      │
│  FROM PERSONA QUIZ:                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐            │
│  │ • Persona type → Tailors nervous system questions                   │            │
│  │ • Career stage → Informs visibility/money fear context              │            │
│  └─────────────────────────────────────────────────────────────────────┘            │
│                                      │                                               │
│                                      ▼                                               │
│                        ┌─────────────────────────┐                                  │
│                        │   Nervous System Flow   │                                  │
│                        │    (11-Step Journey)    │                                  │
│                        └────────────┬────────────┘                                  │
│                                     │                                                │
│   QUESTIONS EXPLORE:                │ OUTPUTS:                                       │
│   • Visibility fears                │ • Visibility fear score                       │
│   • Money beliefs                   │ • Money belief patterns                       │
│   • Safety contracts                │ • Safety contract list                        │
│   • Protective voice                │ • Protective archetype                        │
│   • Essence voice                   │ • Essence archetype                           │
│                                     │                                                │
│                                     ▼                                                │
│                        ┌─────────────────────────┐                                  │
│                        │    Healing Compass      │                                  │
│                        │   (8-Screen Process)    │                                  │
│                        └────────────┬────────────┘                                  │
│                                     │                                                │
│   FROM NS FLOW:                     │ OUTPUTS:                                       │
│   • Safety contracts →              │ • Past parallel identified                    │
│     "What are you protecting?"      │ • Splinter removed                            │
│   • Visibility fears →              │ • New safety anchor                           │
│     "Where does this come from?"    │ • Recalibrated response                       │
│   • Protective voice →              │                                                │
│     "What is it trying to say?"     │                                                │
│                                     │                                                │
│                                     ▼                                                │
│          ┌──────────────────────────┴──────────────────────────┐                    │
│          │                                                      │                    │
│          ▼                                                      ▼                    │
│  ┌───────────────────┐                              ┌───────────────────┐           │
│  │  Essence Profile  │                              │ Protective Profile│           │
│  │  (Natural Gifts)  │                              │ (Defense Patterns)│           │
│  └─────────┬─────────┘                              └─────────┬─────────┘           │
│            │                                                  │                      │
│            │                                                  │                      │
│            └──────────────────────┬───────────────────────────┘                     │
│                                   │                                                  │
│                                   ▼                                                  │
│                  ┌─────────────────────────────────────┐                            │
│                  │       7-Day Challenge Quests        │                            │
│                  │       (Groan Reflections)           │                            │
│                  └─────────────────────────────────────┘                            │
│                                                                                      │
│   FROM HEALING FLOWS:              INTEGRATION:                                      │
│   • Protective voice →             • Recognise quests use archetypes                │
│     Daily groan recognition        • Rewire quests target specific patterns         │
│   • Essence voice →                • Release quests process stuck emotions          │
│     What wants to emerge           • Reconnect quests rebuild safety                │
│   • Safety contracts →                                                               │
│     What behaviors to notice                                                        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Content & CRM Flow Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  TIER 3: EXECUTION (How Do I Take Action?)                                          │
│  ═════════════════════════════════════════                                           │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                           VOICE TRAINING                                     │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                         │                                            │
│   FROM DISCOVERY:                       │ OUTPUTS:                                   │
│   • Skills → Communication style        │ • Voice DNA profile                       │
│   • Problems → Expert framing           │ • Tone patterns                           │
│   • Persona → Audience resonance        │ • Language preferences                    │
│                                         │ • Content archetypes                      │
│   FROM HEALING:                         │                                            │
│   • Essence → Authentic expression      │                                            │
│   • Protective → What to avoid          │                                            │
│                                         │                                            │
│                                         ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                          CONTENT GENERATOR                                   │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                         │                                            │
│   FROM ALL FLOWS:                       │ OUTPUTS:                                   │
│   • Voice Profile → Tone/style          │ • Platform-specific content               │
│   • nikigai_clusters → Topics           │ • Captions, posts, emails                 │
│   • Persona → Audience targeting        │ • Story prompts                           │
│   • Offers → CTAs and hooks             │ • Lead magnet content                     │
│   • NS insights → Authentic themes      │                                            │
│                                         │                                            │
│                                         ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                            CRM SYSTEM                                        │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                         │                                            │
│          ┌──────────────────────────────┼──────────────────────────────┐            │
│          │                              │                              │            │
│          ▼                              ▼                              ▼            │
│  ┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐       │
│  │   Sales Pipeline  │      │  Marketing Tasks  │      │    Analytics      │       │
│  └─────────┬─────────┘      └─────────┬─────────┘      └─────────┬─────────┘       │
│            │                          │                          │                  │
│   USES:    │             USES:        │              USES:       │                  │
│   • Persona profiles     • Content     │              • All flow  │                  │
│     for lead scoring       outputs     │                outputs   │                  │
│   • Offer pricing        • Voice       │              • Deal      │                  │
│     for deal values        profile     │                patterns  │                  │
│   • Objections from      • Offer       │              • Content   │                  │
│     NS patterns            hooks       │                perform   │                  │
│            │                          │                          │                  │
│            └──────────────────────────┼──────────────────────────┘                  │
│                                       │                                              │
│                                       ▼                                              │
│                        ┌─────────────────────────┐                                  │
│                        │    Ascension Engine     │                                  │
│                        └─────────────────────────┘                                  │
│                                                                                      │
│   FROM ALL FLOWS:                      OUTPUTS:                                      │
│   • Complete value ladder →            • Next offer recommendations                 │
│     Position customers                 • Retention tasks                            │
│   • Deal outcomes →                    • Upsell triggers                            │
│     Inform ladder movement             • Win-back campaigns                         │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Complete Context Cascade Summary

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        FLOW → FLOW CONTEXT DEPENDENCIES                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  SOURCE FLOW              →    RECEIVING FLOW              CONTEXT PROVIDED          │
│  ───────────────────────────────────────────────────────────────────────────────    │
│                                                                                      │
│  ══════════════════════════════════════════════════════════════════════════════     │
│  ONBOARDING V2 (NEW)                                                                 │
│  ══════════════════════════════════════════════════════════════════════════════     │
│                                                                                      │
│  Q1 Employment Status     →    Path Selection              Which onboarding path    │
│  Q1 Employment Status     →    Quick Capture               has_side_project flag    │
│                                                                                      │
│  Q2 Wealth Ladder         →    Path Selection              Path 1-4 routing         │
│  Q2 Wealth Ladder         →    Quick Capture               Default product category │
│  Q2 Wealth Ladder         →    Persona Derivation          vibe_seeker/riser/maker  │
│  Q2 Wealth Ladder         →    Starting Stage              Stage 0-6 assignment     │
│                                                                                      │
│  Q3 Primary Goal          →    Guidance Emphasis           8 emphasis types         │
│  Q3 Primary Goal          →    Quest Priorities            Which quests surface     │
│  Q3 Primary Goal          →    Zarlo Personality           Coaching style           │
│  Q3 Primary Goal          →    Dashboard Hero              Focus messaging          │
│                                                                                      │
│  Quick Capture            →    nikigai_responses           Skills/Problems/Personas │
│  Quick Capture            →    products table              Product suite with tiers │
│  Quick Capture            →    Offer Builder               Pre-populated products   │
│  Quick Capture            →    Money Model Flows           Products to enhance      │
│  Quick Capture            →    CRM Sales                   Products for deals       │
│                                                                                      │
│  ══════════════════════════════════════════════════════════════════════════════     │
│  DISCOVERY (DEEP DIVE)                                                               │
│  ══════════════════════════════════════════════════════════════════════════════     │
│                                                                                      │
│  Skills Flow              →    Problems Flow               "What you're good at"    │
│  Skills Flow              →    Offer Builder               Deliverable expertise    │
│  Skills Flow              →    Voice Training              Communication style      │
│                                                                                      │
│  Problems Flow            →    Persona Flow                "Who has these problems" │
│  Problems Flow            →    Offer Builder               Dream Outcome framing    │
│  Problems Flow            →    Content Generator           Topic ideas              │
│                                                                                      │
│  Persona Flow             →    Integration                 Complete picture         │
│  Persona Flow             →    Offer Builder               "Who this is for"        │
│  Persona Flow             →    CRM Lead Scoring            Ideal customer profile   │
│  Persona Flow             →    Content Generator           Audience targeting       │
│                                                                                      │
│  Integration Flow         →    All Business Flows          nikigai_clusters data    │
│                                                                                      │
│  ══════════════════════════════════════════════════════════════════════════════     │
│  OFFER BUILDING                                                                      │
│  ══════════════════════════════════════════════════════════════════════════════     │
│                                                                                      │
│  Offer Builder V1         →    Grand Slam V2               REQUIRED prerequisite    │
│  Offer Builder V1         →    Grand Slam V2               Core offer definition    │
│  Offer Builder V1         →    Grand Slam V2               Dream outcome for naming │
│                                                                                      │
│  Grand Slam V2            →    CRM Sales                   Complete offer package   │
│  Grand Slam V2            →    Content Generator           Bonus/guarantee hooks    │
│  Grand Slam V2            →    Funnel Builder              Full offer stack         │
│                                                                                      │
│  Offer Builder            →    Lead Magnet Selection       Core offer to lead to    │
│  Offer Builder            →    All Money Model Flows       Price anchoring, value   │
│  Offer Builder            →    Funnel Builder              Offer stack structure    │
│  Offer Builder            →    CRM Sales                   Deal values, stages      │
│                                                                                      │
│  ══════════════════════════════════════════════════════════════════════════════     │
│  HEALING                                                                             │
│  ══════════════════════════════════════════════════════════════════════════════     │
│                                                                                      │
│  Nervous System Flow      →    Healing Compass             Safety contracts, fears  │
│  Nervous System Flow      →    Archetype Profiles          Essence/Protective type  │
│  Nervous System Flow      →    7-Day Challenge             Groan recognition        │
│  Nervous System Flow      →    Voice Training              Authentic expression     │
│                                                                                      │
│  Healing Compass          →    7-Day Challenge             Rewire/Release targets   │
│  Healing Compass          →    Content Generator           Authentic themes         │
│                                                                                      │
│  ══════════════════════════════════════════════════════════════════════════════     │
│  VALUE LADDER                                                                        │
│  ══════════════════════════════════════════════════════════════════════════════     │
│                                                                                      │
│  Lead Magnet Selection    →    Attraction Offer Flow       Entry point strategy     │
│  Lead Magnet Selection    →    Funnel Builder              Opt-in step              │
│                                                                                      │
│  Attraction Offer         →    Leads Strategy              Traffic targeting        │
│                                                                                      │
│  Upsell/Downsell/Cont.    →    Leads Strategy              Customer LTV calcs       │
│  Upsell/Downsell/Cont.    →    Funnel Builder              Post-sale sequence       │
│  Upsell/Downsell/Cont.    →    Ascension Engine            Value ladder position    │
│                                                                                      │
│  ══════════════════════════════════════════════════════════════════════════════     │
│  EXECUTION                                                                           │
│  ══════════════════════════════════════════════════════════════════════════════     │
│                                                                                      │
│  Leads Strategy           →    Funnel Builder              Traffic sources          │
│  Leads Strategy           →    CRM Marketing               Task priorities          │
│                                                                                      │
│  Funnel Builder           →    Funnel Calculator           Baseline targets         │
│                                                                                      │
│  Voice Training           →    Content Generator           Tone, style, language    │
│                                                                                      │
│  All Flows                →    Zarlo AI                    Contextual coaching      │
│  All Flows                →    Library of Answers          Organized reference      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Database Context Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         HOW TABLES SHARE CONTEXT                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ══════════════════════════════════════════════════════════════════════════════    │
│   ONBOARDING V2 DATA FLOW (NEW)                                                     │
│   ══════════════════════════════════════════════════════════════════════════════    │
│                                                                                      │
│   user_stage_progress ─────────►   Path routing (wealth_ladder_rung)                │
│     (employment_status,            Starting stage calculation                       │
│      wealth_ladder_rung,           Guidance emphasis selection                      │
│      primary_goal,                 Quest prioritization                             │
│      guidance_emphasis)            Zarlo personality mode                           │
│                                    Dashboard hero messaging                         │
│                                                                                      │
│   products ────────────────────►   offer_builder_assessments (Product suite)        │
│     (from Quick Capture)           sales_deals (Products for deals)                 │
│                                    Money Model flows (Products to enhance)          │
│                                    Funnel Builder (Offer stack)                     │
│                                                                                      │
│   ══════════════════════════════════════════════════════════════════════════════    │
│   DISCOVERY DATA FLOW                                                               │
│   ══════════════════════════════════════════════════════════════════════════════    │
│                                                                                      │
│   nikigai_responses ────┐                                                           │
│   nikigai_clusters ─────┼───────►  offer_builder_assessments (Dream Outcome text)   │
│   persona_profiles ─────┘          attraction_offer_assessments (Persona targeting)  │
│                                    content_history (Topic generation)                │
│                                    sales_deals (Lead qualification)                  │
│                                                                                      │
│   ══════════════════════════════════════════════════════════════════════════════    │
│   OFFER BUILDING DATA FLOW                                                          │
│   ══════════════════════════════════════════════════════════════════════════════    │
│                                                                                      │
│   offer_builder_assessments ───►   grand_slam_offers (REQUIRED prerequisite)        │
│                                    upsell_assessments (Price anchoring)             │
│                                    downsell_assessments (Alternative pricing)        │
│                                    continuity_assessments (Recurring model)          │
│                                    funnel_metrics (Revenue projections)              │
│                                                                                      │
│   grand_slam_offers ───────────►   sales_deals (Complete offer for deals)           │
│     (bonuses, guarantee,           content_history (Bonus/guarantee hooks)          │
│      scarcity, offer_name)         Funnel Builder (Full offer stack)                │
│                                                                                      │
│   ══════════════════════════════════════════════════════════════════════════════    │
│   HEALING DATA FLOW                                                                 │
│   ══════════════════════════════════════════════════════════════════════════════    │
│                                                                                      │
│   nervous_system_responses ────►   lead_flow_profiles (Archetype assignment)        │
│                                    groan_reflections (Pattern recognition)           │
│                                    voice_profiles (Authentic expression)             │
│                                                                                      │
│   offer_builder_assessments ───►   upsell_assessments (Price anchoring)             │
│                                    downsell_assessments (Alternative pricing)        │
│                                    continuity_assessments (Recurring model)          │
│                                    funnel_metrics (Revenue projections)              │
│                                                                                      │
│   voice_profiles ──────────────►   content_history (Tone matching)                  │
│                                    generated_assets (Style consistency)              │
│                                                                                      │
│   All assessment tables ───────►   recommendations (AI-driven next steps)           │
│                                    implementation_coaching (Task generation)        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```
