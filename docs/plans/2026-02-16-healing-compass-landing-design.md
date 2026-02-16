# Healing Compass Workshop Landing Page — Design

> **Created:** February 16, 2026
> **Status:** Approved

## Purpose

Post-workshop reference page for Healing Compass attendees. Single scrolling page that recaps the workshop frameworks, collects 4 personal answers, and emails results via Resend.

## Route & Files

| Type | Path |
|------|------|
| Route | `/healing-compass-workshop` (public, no AuthGate) |
| Component | `src/pages/HealingCompassLanding.jsx` |
| CSS | `src/pages/HealingCompassLanding.css` |
| Edge Function | `supabase/functions/send-workshop-profile/index.ts` |
| Migration | `supabase/migrations/20260216100000_workshop_submissions.sql` |

No new npm dependencies. Follows `FantasyLeagueLanding.jsx` pattern.

## Page Sections

| # | Section | Background | Content |
|---|---------|-----------|---------|
| 1 | Hero | Dark purple gradient | "Your Healing Compass Results" headline, workshop branding, subtext |
| 2 | Emotional Splinters | Light | Brief explanation — childhood wounds that create protective patterns |
| 3 | 4 Emotional Needs | Dark | Life Design, Connection, Mastery, Meaning (Survive/Thrive split). **User selects 1** |
| 4 | Action Commitment | Light | Free text: "What action will you take when this need isn't met?" |
| 5 | 5 Protective Patterns | Dark | Ghost, Controller, Performer, Perfectionist, People Pleaser cards. **User selects 1** |
| 6 | The 4R's | Light | Recognise, Release, Rewire, Reconnect — framework summary |
| 7 | 8 Essence Archetypes | Dark | Illustrated cards from `essenceProfiles.js`. **User selects 1** |
| 8 | Future Self Letter | Warm gradient | Dynamic template filled from selections (Today I discovered... / The truth is... / When the pattern shows up... / You are...) |
| 9 | Email Delivery | Dark | Name + email inputs → "Send My Results" gold CTA |
| 10 | Footer | Dark | FindMyFlow branding |

## Interactive Elements (4 answers)

1. **Emotional Need** — select 1 of 4 cards (Life Design, Connection, Mastery, Meaning)
2. **Action Commitment** — free text input
3. **Protective Pattern** — select 1 of 5 cards (Ghost, Controller, Performer, Perfectionist, People Pleaser)
4. **Essence Archetype** — select 1 of 8 cards (from `essenceProfiles.js`)

State: single `useState` object. No auth. Gold border/glow on selected cards.

## Workshop Content Reference

### Emotional Needs (from workshop PDF)
- **Life Design** (Autonomy): "I need to feel like I have choices and control over my own path"
- **Connection** (Relatedness): "I need to feel seen, loved, and like I belong"
- **Mastery** (Competence): "I need to feel like I'm growing, learning, and getting better"
- **Meaning** (Purpose): "I need to feel like my life matters and I'm contributing to something bigger"
- Split: Survive (Life Design + Connection) / Thrive (Mastery + Meaning)

### Protective Patterns (from workshop PDF)
- **The Ghost**: Disappears. Withdraws. Becomes invisible to avoid being hurt.
- **The Controller**: Takes charge of everything. If I control it, it can't hurt me.
- **The Performer**: Becomes whoever you need me to be. Earns love through achievement.
- **The Perfectionist**: If I'm perfect, I can't be criticised. Delays and overthinks.
- **The People Pleaser**: Says yes to everything. Puts everyone else first to stay safe.

### The 4R's (from workshop PDF)
- **Recognise**: Notice the pattern. Name the protective voice. See when it activates.
- **Release**: Let the body process. Breathwork, shaking, somatic release.
- **Rewire**: Create the new story. Reframe the belief. Build the new neural pathway.
- **Reconnect**: Return to the younger self. Give them what they needed. Integration.

### 8 Essence Archetypes (from essenceProfiles.js)
Compassionate Leader, Truth-Teller, Radiant Rebel, Playful Creator, Sacred Jester, Wild Alchemist, Heart Holder, Cosmic Connector — grouped as Activator / Bridger / Transmuter / Stabiliser.

Plus: Mystic Messenger, Grounded Guardian, Rhythm Architect, Wise Sage (12 total in the data file, 8 shown in workshop).

### Future Self Letter Template
```
Dear [Name],

Today I discovered that my core emotional need is [need] —
and that when it's not met, I've been using [pattern] to protect myself.

The truth is, [pattern] kept me safe when I was younger.
But I don't need that armour anymore.

When the [pattern] shows up, I will remember to [action].

You are a [archetype] — [poetic_line].

With love,
[Name]
```

## Email Design

Follows `send-archetype-profile/index.ts` Resend pattern. HTML email contains:

1. **Header** — Healing Compass Workshop branding
2. **Your Answers** — Emotional Need + description, Action commitment, Protective Pattern + description
3. **Your Essence Archetype** — Full profile (poetic_line, superpower, north_star, energetic_transmission, recognition_pattern, essence_wound, inner_child_desire, characters, vision_in_action)
4. **The 4R's Framework** — Summary of all 4 with one-liners
5. **Your Future Self Letter** — Pre-filled template
6. **CTA** — "Continue Your Journey on FindMyFlow" button
7. Notification copy to `huzz@nichuzz.com`

## Database

```sql
CREATE TABLE workshop_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  emotional_need TEXT NOT NULL,
  action_commitment TEXT,
  protective_pattern TEXT NOT NULL,
  essence_archetype TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public insert only (no auth required), no client-side reads
ALTER TABLE workshop_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert" ON workshop_submissions FOR INSERT WITH CHECK (true);
```

## Design Tokens

- CSS scoped to `.hcl` prefix
- Dark sections: `#0a0118`
- Light sections: white → cream gradient
- Brand gradient: purple `#5e17eb` → gold `#E9A23B`
- Card selections: gold border + subtle glow
- Mobile-first, 768px breakpoint
- IntersectionObserver reveal animations (existing `useReveal` hooks)
- Sticky mobile CTA

## Data Flow

```
User scrolls → selects answers → enters name/email → clicks "Send"
  → POST to Edge Function /send-workshop-profile
    → Validate inputs
    → Insert into workshop_submissions
    → Build HTML email with answers + framework content
    → Send via Resend API
    → Send notification to huzz@nichuzz.com
    → Return success
  → Show confirmation screen with "Check your inbox" message
```
