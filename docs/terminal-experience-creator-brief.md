# Terminal for Experience Creators — Concept Brief

**Author:** Nic Huzz + Claude  
**Date:** May 2026  
**Status:** Concept  

---

## The Problem

Experience creators (workshop leaders, retreat facilitators, cohort runners) need to create landing pages, email sequences, event briefs, pitch decks, and marketing content — but they're not developers. They shouldn't need to learn terminal commands or prompt engineering.

## The Vision

The desktop app has a terminal running Claude Code. When a creator clicks a task in their Growth Line, the terminal auto-executes with full context about their event, voice profile, brand, and audience. The result is a ready-to-use asset — not a chat response.

```
Creator clicks "Create landing page for Bali Workshop"
  → Terminal runs Claude Code with:
    - Event details (name, date, price, type, description)
    - Voice profile (tone, catchphrases, writing style)
    - Brand config (colors, fonts, logo)
    - Template (landing page structure)
  → Claude generates a complete HTML landing page
  → Saved to /output/bali-workshop/landing-page.html
  → Preview appears in the right panel
```

## How It Works

### 1. Templates (Pre-uploaded by Nic)

Each use case has a **template** — a structured document that tells Claude what to create, in what format, following what rules. Templates live in the app and are selected automatically based on the task type.

Templates are stored at: `/templates/terminal/`

```
templates/terminal/
├── landing-page.md          # Landing page generator
├── email-sequence.md        # Welcome/nurture/launch emails
├── event-brief.md           # Full event planning document
├── workshop-flow.md         # Workshop runsheet/flow design
├── carousel-content.md      # Instagram carousel slides
├── social-posts.md          # Platform-specific social posts
├── pitch-deck.md            # Sponsor/partner pitch outline
├── sales-script.md          # DM outreach scripts
├── booking-page.md          # Simple booking/registration page
└── post-event-report.md     # Post-event summary + learnings
```

### 2. Context (Auto-pulled from the app)

Each template gets populated with real data from the user's account:

| Context | Source | Used by |
|---------|--------|---------|
| Event name, date, type, price | `experiences` table | All templates |
| One-line promise | `experiences.one_line_promise` | Landing page, social posts |
| Voice profile (tone, catchphrases, style) | `voice_profiles` table | All content templates |
| Target audience / persona | `nikigai_clusters` | Landing page, email, pitch |
| Archetype (workshop/retreat/cohort) | `experiences.experience_type` | Template selection |
| Past event learnings (3% chain) | `experiences.three_percent_note` | Event brief, flow design |
| Attendee data | `experience_attendees` | Post-event report |
| Checklist status | `experience_checklist_items` | Event brief |
| Offer stack (attraction/core/continuity) | `creator_assessments` | Pitch deck, landing page |
| Remarkable angle | `remarkable_angles` | Landing page, social posts |

### 3. Execution Flow

```
User clicks task in Growth Line
  ↓
App identifies template type from task.type
  ↓
App fetches context from Supabase
  ↓
App assembles prompt: template + context + user instructions
  ↓
Prompt sent to terminal via runInTerminal()
  ↓
Claude Code executes:
  - Reads template
  - Applies context
  - Generates output
  - Saves to /output/{event-name}/{asset-type}.{format}
  ↓
App detects new file → shows in preview panel
```

### 4. User Experience

The user never sees the prompt or the terminal commands. They see:

```
┌──────────────────────────────────────────────┐
│  Bali Workshop → Attract → Tools             │
│                                              │
│  [✨ Create Landing Page]                     │
│  [✉️  Write Email Sequence]                   │
│  [📋 Generate Event Brief]                    │
│                                              │
│  Click any button above to generate with AI   │
│  Your voice profile + event details are       │
│  included automatically.                      │
└──────────────────────────────────────────────┘
```

After clicking:

```
┌──────────────────────────────────────────────┐
│  ⚡ Generating landing page...                │
│  ████████████░░░░░░░░ 60%                     │
│                                              │
│  ✓ Using voice profile: Huzz                  │
│  ✓ Event: Bali Workshop · Jun 14 · $200       │
│  ✓ Template: Landing Page v2                  │
└──────────────────────────────────────────────┘
```

Result:

```
┌──────────────────────────────────────────────┐
│  ✅ Landing page ready                        │
│                                              │
│  [👁 Preview]  [📋 Copy HTML]  [💾 Download]   │
│  [✏️  Edit]    [🔄 Regenerate]                │
│                                              │
│  Saved to: output/bali-workshop/landing.html  │
└──────────────────────────────────────────────┘
```

---

## Template Format

Each template is a markdown file with:

1. **Frontmatter** — metadata (name, output format, required context)
2. **Instructions** — what Claude should create
3. **Structure** — the exact format/sections of the output
4. **Rules** — brand guidelines, voice rules, constraints
5. **Examples** — sample outputs for reference

### Example: `landing-page.md`

```markdown
---
name: Landing Page Generator
output_format: html
output_filename: landing-page.html
required_context:
  - event_name
  - event_date
  - ticket_price
  - one_line_promise
  - voice_profile
optional_context:
  - remarkable_angle
  - testimonials
  - offer_stack
---

# Instructions

Create a single-page landing page for the event described below. 
The page should convert visitors into ticket buyers.

# Structure

1. **Hero Section**
   - Event name (large, bold)
   - One-line promise as subtitle
   - Date + location
   - CTA button: "Get Your Ticket →"
   - Background: event photo or gradient

2. **The Problem**
   - 2-3 sentences about what the attendee is experiencing
   - Use the voice profile tone — not generic marketing speak

3. **The Transformation**
   - What will be different after the event
   - Specific, tangible outcomes (not vague promises)

4. **What's Included**
   - Bullet list of what happens at the event
   - Duration, format, what to bring

5. **Social Proof** (if testimonials available)
   - 1-3 quotes from past attendees
   - Name + context

6. **Pricing**
   - Ticket price
   - Early bird if available
   - What's included at that price

7. **FAQ**
   - 3-5 common questions
   - Address objections (time, money, "is this for me?")

8. **Final CTA**
   - Urgency (limited spots, date approaching)
   - Booking button

# Rules

- Use the creator's voice profile for ALL copy — match their tone, 
  catchphrases, and energy level
- Never use em dashes (—) — the creator's brand guide forbids them
- Brand colors: purple (#5e17eb) primary, gold (#E9A23B) accent
- Mobile-first responsive design
- Self-contained HTML (inline CSS, no external dependencies)
- Include Open Graph meta tags for social sharing
- Booking button links to: {booking_url} or placeholder if not set

# Example Output

[Include a sample HTML landing page here for Claude to reference]
```

---

## Templates to Create

### Attract Node
| Template | Output | Description |
|----------|--------|-------------|
| `landing-page.md` | HTML file | Event landing page with booking CTA |
| `social-posts.md` | Markdown file | 5 platform-specific posts (IG, LinkedIn, email) |
| `carousel-content.md` | JSON + HTML | Instagram carousel slides with copy |

### Capture Node
| Template | Output | Description |
|----------|--------|-------------|
| `email-sequence.md` | Markdown file | 5-email welcome/nurture sequence |
| `booking-page.md` | HTML file | Simple registration page with form |

### Convert Node
| Template | Output | Description |
|----------|--------|-------------|
| `sales-script.md` | Markdown file | DM scripts for warm outreach |
| `pitch-deck.md` | Markdown file | Sponsor/partner pitch outline |

### Deliver Node
| Template | Output | Description |
|----------|--------|-------------|
| `event-brief.md` | Markdown file | Full event plan (logistics, runsheet, checklist) |
| `workshop-flow.md` | Markdown file | Minute-by-minute runsheet with transitions |

### Grow Node
| Template | Output | Description |
|----------|--------|-------------|
| `post-event-report.md` | Markdown file | Summary, metrics, 3% learnings, testimonials |
| `follow-up-emails.md` | Markdown file | Thank you + feedback + next event invite |

---

## How to Add a Template

1. Write the template in markdown following the format above
2. Save to `/templates/terminal/{name}.md`
3. The app auto-discovers templates and maps them to Growth Line tasks
4. When a user clicks the task, the template + their context = the prompt

### Template Variables

Templates use `{variable_name}` placeholders that get replaced with real data:

```
{event_name}           → "Bali Workshop"
{event_date}           → "14 June 2026"
{event_type}           → "workshop"
{ticket_price}         → "$200"
{one_line_promise}     → "Move your body, free your mind"
{voice_name}           → "Huzz"
{voice_summary}        → "Translates woo into bro..."
{voice_catchphrases}   → ["healing but fun", "vibe rise", ...]
{remarkable_angle}     → "Healing doesn't need a therapist's office"
{booking_url}          → "https://viberise.nichuzz.com/book/bali"
{past_3pct_notes}      → ["Added integration time", "Recorded audio"]
{attendee_count}       → "12"
{checklist_marketing}  → "7/9 complete"
```

---

## Next Steps

1. **Nic writes 2-3 templates** (start with landing-page + social-posts)
2. **Build the template loader** — reads templates from /templates/terminal/
3. **Build the context assembler** — fetches data from Supabase, fills variables
4. **Build the prompt sender** — assembles template + context → sends to terminal
5. **Build the output viewer** — detects new files, shows preview
6. **Test with real events** — generate a landing page for Vibe Rise Fest

---

## Questions for Nic

- What's the most valuable first template? Landing page? Email sequence?
- Do you have existing examples of great landing pages or emails you've written that we can use as reference in templates?
- Should templates be editable by the user, or fixed by you?
- How much customisation should the user have before generating? (e.g., "make it more casual", "add urgency", "include this testimonial")
