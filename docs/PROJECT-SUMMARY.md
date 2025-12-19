# FindMyFlow - Project Summary

## What is FindMyFlow?

FindMyFlow is a personal development web application designed for burnt-out professionals seeking career clarity and entrepreneurial direction. The app guides users through AI-powered discovery flows to identify their natural strengths, the problems they're uniquely positioned to solve, and their ideal customer personas.

## Core Concept: Nikigai Framework

The app is built on the **Nikigai** framework—a personalized adaptation of the Japanese concept of Ikigai (reason for being). Through interactive AI conversations, users discover:

- **Skills** - What you're naturally good at
- **Problems** - Issues you're passionate about solving
- **Persona** - Who you're meant to serve
- **Integration** - How these elements combine into a viable business

## User Archetypes

Three distinct user journeys based on where you are in your entrepreneurial path:

| Archetype | Description | Stages |
|-----------|-------------|--------|
| **Vibe Seeker** | Exploring and finding clarity | 1 stage |
| **Vibe Riser** | Building your first product | 4 stages: Validation → Creation → Testing → Launch |
| **Movement Maker** | Scaling an existing business | 3 stages: Ideation → Creation → Launch |

## Key Features

### 1. Flow Finder (AI Discovery)
AI-guided conversational flows that help users articulate their skills, identify problems worth solving, and define their ideal customer.

### 2. Money Model Flows
Business-building assessments based on Alex Hormozi's $100M Offers framework:
- $100M Offer Builder
- Attraction Offer
- Upsell/Downsell/Continuity flows
- Lead Magnet & Leads Strategy

### 3. 7-Day Challenge System
Gamified daily quests with:
- Streak tracking and points
- Stage-specific challenges
- Leaderboard competition
- **Groan Challenges** - Tasks that push you past comfort zones

### 4. Nervous System Flow
AI chat that reveals how past experiences may have created boundaries around visibility and earning potential.

### 5. Healing Compass
A guided process to work through limiting beliefs and patterns.

### 6. Flow Compass
Track energy and progress on projects using a N/E/S/W directional system.

### 7. Graduation System
Progress through stages by completing required flows, milestones, and maintaining challenge streaks.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Routing | React Router v7 |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| AI | Anthropic Claude API |
| Hosting | Vercel |
| Notifications | Web Push API |

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Full page views
├── lib/            # Core logic (AI, clustering, graduation)
├── auth/           # Authentication
├── data/           # Static configuration
└── [Flow].jsx      # Assessment flow components

supabase/
├── functions/      # Edge Functions (AI handlers)
└── migrations/     # Database schema changes

public/
└── *.json          # Flow question definitions
```

## URLs

- **Production**: https://findmyflow.nichuzz.com
- **Repository**: https://github.com/Nic-Huzz/findmyflow

## Documentation

- `docs/7-day-challenge-system.md` - Challenge system details
- `docs/design-guide.md` - Brand colors and typography
- `docs/supabase-setup.md` - Database configuration
- `CLAUDE.md` - Full technical guide for development
