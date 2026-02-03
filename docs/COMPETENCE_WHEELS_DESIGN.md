# Competence Wheels - Visual Design System

## Overview

A color wheel visualization system showing users where their interests, skills, and ideal customers cluster based on Flow Finder responses. Three separate wheels, one for each flow:

1. **Problem Space Wheel** - What problems resonate with you
2. **Skills Wheel** - What capabilities you bring
3. **Persona Wheel** - Who you're drawn to serve (2D: psychographics + life stage)

### The Three DNAs

FindMyFlow captures three distinct knowledge bases that power the AI Co-Founder:

| DNA Type | What it captures | Primary sources |
|----------|------------------|-----------------|
| **Founder DNA** | Who YOU are - skills, passions, energy, fears, boundaries | Wheels, Flow Compass, Groans, Nervous System |
| **Market DNA** | Who your CUSTOMERS are - validated personas, problems, journey | Validation Flow, Customer feedback, Sales data |
| **Build DNA** | What you're CREATING - features, tech, offers, content | Product Blueprint, Offer Builder, Funnel Metrics, Voice Profile |

These three DNAs form the complete context for intelligent AI assistance.

---

## Wheel Segments as Cluster Headings

### The Insight

Currently, Flow Finder flows use AI to generate cluster names dynamically. This creates inconsistent, somewhat random groupings that don't map to anything else in the system.

**Proposed change:** The wheel segment taxonomy BECOMES the cluster system.

### Current vs Proposed

```
CURRENT APPROACH:
┌─────────────────────────────────────────────────────────────┐
│ User completes Flow Finder Skills                          │
│                    ↓                                        │
│ AI analyzes responses                                       │
│                    ↓                                        │
│ AI generates clusters: "Strategic Thinking", "People       │
│ Skills", "Creative Problem Solving" (random names)         │
│                    ↓                                        │
│ User sees clusters in Library of Answers                    │
│                    ↓                                        │
│ No connection to anything else                              │
└─────────────────────────────────────────────────────────────┘

PROPOSED APPROACH:
┌─────────────────────────────────────────────────────────────┐
│ User completes Flow Finder Skills                          │
│                    ↓                                        │
│ AI maps each response to wheel segments:                    │
│ - "I'm good at explaining complex things" → Clarifying     │
│ - "I love building systems" → Organizing + Building        │
│ - "I can sell anything" → Influencing                      │
│                    ↓                                        │
│ Clusters ARE the wheel segments (predefined taxonomy)       │
│                    ↓                                        │
│ User sees: "Clarifying (3 responses)", "Organizing (5)"... │
│                    ↓                                        │
│ Same segments light up on Skills Wheel                      │
│                    ↓                                        │
│ Same vocabulary flows to Blueprint, Offer Builder, etc.     │
└─────────────────────────────────────────────────────────────┘
```

### Benefits

| Benefit | Description |
|---------|-------------|
| **Consistency** | Same 12 categories everywhere, users learn the vocabulary |
| **Direct mapping** | Clusters → Wheel segments → Blueprint features → Content |
| **Reduced AI randomness** | AI classifies into predefined buckets, not inventing names |
| **Accumulated intelligence** | Each response tagged to segment builds wheel accuracy |
| **Cross-flow coherence** | Skills clusters use same logic as Problem clusters as Persona clusters |

### How It Works

#### During Flow Finder

```javascript
// AI prompt for response classification
const classificationPrompt = `
Given this user response about their skills:
"${userResponse}"

Classify into ONE OR MORE of these predefined skill categories:
1. Clarifying - explaining, simplifying, teaching
2. Analyzing - data analysis, pattern recognition, logic
3. Strategizing - planning, prioritizing, decision frameworks
4. Organizing - systems, processes, operations
5. Building - coding, engineering, making things
6. Designing - UX, visual design, aesthetics
7. Creating - art, writing, ideation, invention
8. Expressing - storytelling, performing, voice
9. Connecting - networking, empathy, facilitation
10. Influencing - sales, persuasion, motivation
11. Nurturing - coaching, mentoring, developing
12. Synthesizing - integration, wisdom, big-picture

Return JSON: { "segments": ["clarifying", "building"], "confidence": 0.85 }
`;
```

#### In Library of Answers

```
YOUR SKILLS (grouped by wheel segment)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 ANALYZING (4 responses)
├── "I can spot patterns in data that others miss"
├── "I love debugging complex problems"
├── "I'm good at breaking down big challenges"
└── "Numbers and spreadsheets make sense to me"

🎯 STRATEGIZING (3 responses)
├── "I naturally think about the big picture"
├── "I'm always planning 3 steps ahead"
└── "People come to me for decision-making"

💡 CLARIFYING (2 responses)
├── "I can explain complex things simply"
└── "Teaching comes naturally to me"

[See all 12 segments →]
```

#### On the Wheel

Each segment shows:
- Number of responses tagged
- Sample responses on hover
- Maturity ring based on depth/frequency
- Energy source based on Flow Compass correlation

### Data Structure Change

```javascript
// OLD: Random cluster names
{
  clusters: [
    { name: "Strategic Thinking", responses: [...] },  // AI-generated name
    { name: "People Skills", responses: [...] },       // Different every time
  ]
}

// NEW: Predefined segment tags
{
  segments: {
    analyzing: {
      responses: [...],
      count: 4,
      maturity: 'proficient',  // Based on depth/frequency
      energy: 'intrinsic',     // From Flow Compass correlation
    },
    strategizing: {
      responses: [...],
      count: 3,
      maturity: 'mastery',
      energy: 'intrinsic',
    },
    clarifying: {
      responses: [...],
      count: 2,
      maturity: 'emerging',
      energy: 'developed',
    },
    // All 12 segments, even if empty
  }
}
```

### Mapping Tables

The AI uses these as classification guides:

#### Skills Flow → Skills Wheel Segments

| Segment | Classification keywords/patterns |
|---------|----------------------------------|
| Clarifying | explain, teach, simplify, translate, communicate, make clear |
| Analyzing | data, patterns, logic, debug, diagnose, research, investigate |
| Strategizing | plan, strategy, prioritize, decide, roadmap, vision, direction |
| Organizing | systems, processes, operations, logistics, order, structure |
| Building | make, build, code, engineer, create things, construct, develop |
| Designing | design, UX, visual, aesthetic, experience, interface, beautiful |
| Creating | art, write, ideate, invent, imagine, originate, compose |
| Expressing | story, perform, present, voice, speak, share, articulate |
| Connecting | network, empathy, facilitate, collaborate, bring together |
| Influencing | sell, persuade, convince, motivate, negotiate, advocate |
| Nurturing | coach, mentor, develop, grow, support, care, guide |
| Synthesizing | integrate, wisdom, big-picture, meaning, philosophy, connect dots |

#### Problems Flow → Problem Wheel Segments

| Segment | Classification keywords/patterns |
|---------|----------------------------------|
| Physical Vitality | health, fitness, energy, body, sleep, nutrition, illness |
| Mental Wellbeing | anxiety, stress, mindset, emotions, mental health, burnout |
| Personal Mastery | skills, learning, productivity, habits, growth, development |
| Intimate Bonds | relationship, marriage, dating, family, parenting, love |
| Service & Care | caregiving, elder, disability, support, helping others |
| Creative Expression | art, creativity, voice, identity, expression, blocked |
| Local Impact | team, organization, community, neighborhood, local |
| Cultural Movements | belonging, identity, culture, movement, trends |
| Economic Freedom | money, business, career, job, income, financial, work |
| Social Justice | inequality, discrimination, access, rights, fairness |
| Planetary Health | climate, environment, sustainability, planet, nature |
| Human Progress | technology, innovation, knowledge, future, advancement |

#### Persona Flow → Persona Wheel Segments

| Segment | Classification keywords/patterns |
|---------|----------------------------------|
| Seekers | lost, direction, purpose, meaning, clarity, finding themselves |
| Builders | creating, building, making, entrepreneurship, starting |
| Healers | hurting, recovering, healing, trauma, pain, suffering |
| Teachers | learning, growing, developing, knowledge, education |
| Connectors | lonely, isolated, community, belonging, connection |
| Achievers | success, winning, status, recognition, ambitious |
| Explorers | freedom, adventure, autonomy, escape, flexibility |
| Visionaries | future, change, innovation, big ideas, transformation |
| Protectors | security, safety, stability, risk, protection |
| Creators | expression, art, originality, creativity, voice |
| Nurturers | family, caring, devoted, loved ones, support |
| Challengers | injustice, change, disruption, truth, advocacy |

### Migration Path

For existing users with old-style clusters:

```javascript
// Migration script
async function migrateToSegmentClusters(userId) {
  const oldClusters = await getOldClusters(userId);

  for (const cluster of oldClusters) {
    // AI reclassifies each response into new segment taxonomy
    const segmentTags = await classifyResponseToSegments(cluster.responses);

    // Store with new structure
    await saveSegmentTaggedResponses(userId, segmentTags);
  }

  // Mark migration complete
  await setMigrationFlag(userId, 'segment_clusters', true);
}
```

### Impact on Other Features

| Feature | How it benefits |
|---------|-----------------|
| **Library of Answers** | Consistent categories, easier navigation |
| **Wheel Visualization** | Direct 1:1 mapping from responses to segments |
| **Product Blueprint** | Feature recommendations use same vocabulary |
| **Validation Flow** | Questions map to same segments |
| **Content Generator** | Can reference specific segments by name |
| **Zarlo AI** | Uses consistent vocabulary across all features |

### Aspirational Titles (User-Facing)

**Important:** While we use technical segment names internally for consistency, users should see **aspirational, inspiring titles** that make them feel capable and motivated.

Each segment has:
- **Internal ID:** Technical name for data/code (e.g., `analyzing`)
- **Display Name:** Clean name for UI (e.g., "Analyzing")
- **Aspirational Title:** Inspiring label users identify with (e.g., "The Pattern Spotter")

#### Skills Wheel - Aspirational Titles

| Segment | Internal ID | Display Name | Aspirational Title |
|---------|-------------|--------------|-------------------|
| 1 | `clarifying` | Clarifying | **The Translator** - You make the complex simple |
| 2 | `analyzing` | Analyzing | **The Pattern Spotter** - You see what others miss |
| 3 | `strategizing` | Strategizing | **The Gamemaker** - You think 10 moves ahead |
| 4 | `organizing` | Organizing | **The Systems Architect** - You create order from chaos |
| 5 | `building` | Building | **The Maker** - You turn ideas into reality |
| 6 | `designing` | Designing | **The Experience Crafter** - You shape how things feel |
| 7 | `creating` | Creating | **The Originator** - You bring new things into existence |
| 8 | `expressing` | Expressing | **The Voice** - You give form to what matters |
| 9 | `connecting` | Connecting | **The Bridge Builder** - You bring people together |
| 10 | `influencing` | Influencing | **The Catalyst** - You move people to action |
| 11 | `nurturing` | Nurturing | **The Grower** - You develop potential in others |
| 12 | `synthesizing` | Synthesizing | **The Integrator** - You see the whole picture |

#### Problem Wheel - Aspirational Titles

| Segment | Internal ID | Display Name | Aspirational Title |
|---------|-------------|--------------|-------------------|
| 1 | `physical_vitality` | Physical Vitality | **Body Whisperer** - You help bodies thrive |
| 2 | `mental_wellbeing` | Mental Wellbeing | **Mind Guardian** - You restore inner peace |
| 3 | `personal_mastery` | Personal Mastery | **Growth Catalyst** - You unlock human potential |
| 4 | `intimate_bonds` | Intimate Bonds | **Heart Healer** - You deepen connection |
| 5 | `service_care` | Service & Care | **Care Champion** - You support those who need it most |
| 6 | `creative_expression` | Creative Expression | **Voice Liberator** - You free creative spirits |
| 7 | `local_impact` | Local Impact | **Community Builder** - You strengthen local bonds |
| 8 | `cultural_movements` | Cultural Movements | **Movement Maker** - You shape culture |
| 9 | `economic_freedom` | Economic Freedom | **Freedom Architect** - You liberate from systems |
| 10 | `social_justice` | Social Justice | **Equity Champion** - You fight for fairness |
| 11 | `planetary_health` | Planetary Health | **Earth Guardian** - You protect our planet |
| 12 | `human_progress` | Human Progress | **Future Builder** - You advance humanity |

#### Persona Wheel - Aspirational Titles

| Segment | Internal ID | Display Name | Aspirational Title |
|---------|-------------|--------------|-------------------|
| 1 | `seekers` | Seekers | **The Compass** - You guide lost souls home |
| 2 | `builders` | Builders | **The Architect** - You help dreams take shape |
| 3 | `healers` | Healers | **The Mender** - You restore what's broken |
| 4 | `teachers` | Teachers | **The Illuminator** - You light the path of knowledge |
| 5 | `connectors` | Connectors | **The Weaver** - You create belonging |
| 6 | `achievers` | Achievers | **The Accelerator** - You propel success |
| 7 | `explorers` | Explorers | **The Liberator** - You set the caged free |
| 8 | `visionaries` | Visionaries | **The Pioneer** - You chart new territories |
| 9 | `protectors` | Protectors | **The Shield** - You create safety |
| 10 | `creators` | Creators | **The Muse** - You inspire expression |
| 11 | `nurturers` | Nurturers | **The Anchor** - You hold families together |
| 12 | `challengers` | Challengers | **The Truth Teller** - You speak what must be said |

#### How Aspirational Titles Appear

```
Library of Answers:

YOUR SKILLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 THE GAMEMAKER (Strategizing)
   "You think 10 moves ahead"
   ├── "I naturally think about the big picture"
   ├── "I'm always planning 3 steps ahead"
   └── "People come to me for decision-making"

📊 THE PATTERN SPOTTER (Analyzing)
   "You see what others miss"
   ├── "I can spot patterns in data"
   └── "Numbers make sense to me"

💡 THE TRANSLATOR (Clarifying)
   "You make the complex simple"
   └── "I can explain anything to anyone"
```

#### Combined Identity Statement

When multiple segments are lit, generate a combined identity:

```
YOUR FOUNDER IDENTITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are THE STRATEGIC LIBERATOR

A Gamemaker who spots patterns and translates complexity,
helping Explorers escape systems that trap them.

Your superpower: Turning confusion into clear escape routes.
```

---

## 1. Problem Space Wheel

### Current Taxonomy (v1.0)

12 segments representing all domains where problems exist:

| # | Segment | Covers | Color |
|---|---------|--------|-------|
| 1 | Health & Wellness | Physical, mental, healthcare systems, fitness | |
| 2 | Environment & Climate | Sustainability, conservation, climate tech | |
| 3 | Education & Learning | Teaching, skill development, access to knowledge | |
| 4 | Economy & Work | Business, careers, finance, poverty, employment | |
| 5 | Technology & Innovation | Digital, AI, software, infrastructure | |
| 6 | Relationships & Community | Connection, belonging, social bonds, family | |
| 7 | Justice & Equity | Rights, fairness, access, policy | |
| 8 | Creativity & Culture | Arts, design, expression, media, entertainment | |
| 9 | Leadership & Organization | Management, teams, systems, operations | |
| 10 | Communication & Influence | Marketing, storytelling, persuasion, media | |
| 11 | Security & Stability | Safety, peace, risk, mental security | |
| 12 | Meaning & Purpose | Spirituality, values, identity, life direction | |

### Proposed Taxonomy (v2.0) - 20% Improvement

Cleaner boundaries, reduced overlap:

| # | Segment | Covers | Improvement |
|---|---------|--------|-------------|
| 1 | **Physical Health** | Body, fitness, medicine, longevity | Split from mental |
| 2 | **Mental Wellbeing** | Mindset, emotions, psychology, stress | Now distinct domain |
| 3 | **Relationships** | Love, family, friendship, intimate bonds | Smaller scale connection |
| 4 | **Community & Belonging** | Groups, culture, identity, movements | Larger scale connection |
| 5 | **Career & Livelihood** | Work, jobs, professional growth, income | Individual focus |
| 6 | **Business & Enterprise** | Entrepreneurship, organizations, commerce | Organizational focus |
| 7 | **Education & Growth** | Learning, skills, knowledge, development | Combined with growth |
| 8 | **Environment & Planet** | Climate, sustainability, nature, conservation | Unchanged |
| 9 | **Technology & Digital** | Software, AI, tools, infrastructure | Unchanged |
| 10 | **Creativity & Expression** | Arts, design, media, voice | Clearer focus |
| 11 | **Justice & Society** | Rights, equity, policy, governance | Combined with society |
| 12 | **Meaning & Spirituality** | Purpose, values, philosophy, transcendence | Unchanged |

**Key changes:**
- Split Health into Physical + Mental (critical distinction)
- Split Relationships (intimate) from Community (collective)
- Split Career (individual) from Business (organizational)
- Removed Communication overlap (now within Career/Business/Creativity as needed)

### Proposed Taxonomy (v3.0) - 100% Reimagining

**Organizing principle: Spheres of Impact**

The wheel is organized as concentric themes, but displayed as a single wheel where adjacent segments flow naturally from personal → relational → community → world.

```
           [WORLD SPHERE]
        11    12     1
      ┌───┬───┬───┬───┐
   10 │   │   │   │   │ 2
      ├───┼───┼───┼───┤
    9 │   │ ● │   │   │ 3    ● = Your lit segments
      ├───┼───┼───┼───┤
    8 │   │   │   │   │ 4
      └───┴───┴───┴───┘
         7     6     5
          [SELF SPHERE]
```

**Full v3.0 Taxonomy with Examples:**

| # | Segment | Sphere | Problems in this space | Example niches |
|---|---------|--------|------------------------|----------------|
| 1 | **Physical Vitality** | Self | Health, fitness, energy, longevity, chronic illness | Fitness coaches, nutritionists, sleep consultants |
| 2 | **Mental Wellbeing** | Self | Anxiety, depression, stress, mindset, emotional regulation | Therapists, mindset coaches, meditation teachers |
| 3 | **Personal Mastery** | Self | Skill gaps, productivity, habits, self-discipline, learning | Productivity coaches, skill trainers, habit designers |
| 4 | **Intimate Bonds** | Relational | Relationships, dating, marriage, parenting, family dynamics | Relationship coaches, family therapists, dating consultants |
| 5 | **Service & Care** | Relational | Caregiving, eldercare, childcare, disability support | Care coordinators, support workers, accessibility consultants |
| 6 | **Creative Expression** | Relational | Artistic blocks, finding voice, identity, personal brand | Creative coaches, brand strategists, art therapists |
| 7 | **Local Impact** | Community | Team dysfunction, org culture, neighborhood issues, local business | Team coaches, culture consultants, community organizers |
| 8 | **Cultural Movements** | Community | Belonging, identity groups, trends, subcultures, movements | Community builders, movement leaders, cultural strategists |
| 9 | **Economic Freedom** | Community | Career traps, financial stress, business struggles, wealth gaps | Business coaches, financial advisors, career strategists |
| 10 | **Social Justice** | World | Inequality, discrimination, access barriers, policy failures | Advocates, policy consultants, DEI specialists |
| 11 | **Planetary Health** | World | Climate change, sustainability, conservation, pollution | Climate tech, sustainability consultants, environmental educators |
| 12 | **Human Progress** | World | Tech ethics, knowledge gaps, innovation barriers, global coordination | Tech ethicists, futurists, education reformers |

**Why v3 is better than v2:**
- Clear organizing principle (spheres) makes it intuitive
- Renamed "Economic Systems" → "Economic Freedom" (more emotionally resonant)
- Each segment has concrete examples to aid AI classification
- Flow from Self → World creates a natural narrative
- Incorporates all v2 improvements (split health, split relationships, etc.)

### Proposed Taxonomy (v4.0) - 1000% Reimagining

**What if we add a second dimension: Problem TYPE?**

Instead of just "what domain" the problem is in, we could also capture "what kind of problem" it is:

| Problem Type | Description | Example |
|--------------|-------------|---------|
| **Access** | Can't get what they need | "I can't afford therapy" |
| **Knowledge** | Don't know how | "I don't know how to start a business" |
| **Capability** | Can't do it (skill gap) | "I can't code" |
| **Motivation** | Won't do it (mindset) | "I keep procrastinating" |
| **Connection** | Isolated/disconnected | "I have no network" |
| **System** | Trapped by structures | "My job won't let me work remotely" |

This creates a matrix: **Domain × Problem Type**

For example, "Economic Freedom + System Problem" = people trapped in 9-5 wanting freedom
Versus "Economic Freedom + Knowledge Problem" = people who don't know how to start

*Decision needed: Is the 2D matrix worth the complexity, or is v3 (domain only) sufficient?*

---

## 2. Skills Wheel

### Current Taxonomy (v1.0)

| # | Segment | Covers |
|---|---------|--------|
| 1 | Analytical | Logic, data, patterns, problem-solving |
| 2 | Technical | Building, coding, engineering, making |
| 3 | Creative | Design, art, aesthetics, ideation |
| 4 | Verbal | Writing, speaking, storytelling |
| 5 | Interpersonal | Empathy, connection, facilitation |
| 6 | Leadership | Vision, direction, motivation, strategy |
| 7 | Organizational | Systems, processes, planning, execution |
| 8 | Investigative | Research, discovery, curiosity, learning |
| 9 | Physical | Movement, sports, hands-on, spatial |
| 10 | Nurturing | Care, support, healing, development |
| 11 | Persuasive | Sales, influence, negotiation, advocacy |
| 12 | Philosophical | Meaning-making, wisdom, ethics, big-picture |

### Comparison to Existing Frameworks

**Gardner's Multiple Intelligences:**
- Linguistic → Verbal
- Logical-Mathematical → Analytical
- Musical → (missing, could add)
- Bodily-Kinesthetic → Physical
- Spatial → (merged with Creative/Technical)
- Interpersonal → Interpersonal
- Intrapersonal → Philosophical
- Naturalistic → (missing, environmental awareness)

**Holland Codes (RIASEC):**
- Realistic → Physical, Technical
- Investigative → Analytical, Investigative
- Artistic → Creative
- Social → Interpersonal, Nurturing
- Enterprising → Leadership, Persuasive
- Conventional → Organizational

### Proposed Skills Taxonomy (v2.0)

Refined for clearer distinction and better mapping:

| # | Segment | Core Ability | Example Skills |
|---|---------|--------------|----------------|
| 1 | **Analyzing** | Breaking down complexity | Data analysis, logic, debugging, pattern recognition |
| 2 | **Building** | Creating tangible things | Coding, engineering, crafting, construction |
| 3 | **Designing** | Shaping form & experience | Visual design, UX, aesthetics, architecture |
| 4 | **Communicating** | Transmitting ideas | Writing, speaking, presenting, teaching |
| 5 | **Connecting** | Building relationships | Networking, empathy, facilitation, collaboration |
| 6 | **Leading** | Directing people & vision | Strategy, management, motivation, decision-making |
| 7 | **Organizing** | Creating order & systems | Planning, processes, operations, logistics |
| 8 | **Discovering** | Finding new knowledge | Research, experimentation, investigation, learning |
| 9 | **Performing** | Physical/embodied action | Athletics, music, dance, hands-on work |
| 10 | **Nurturing** | Growing people | Coaching, mentoring, caring, developing |
| 11 | **Influencing** | Changing minds & behavior | Sales, marketing, negotiation, advocacy |
| 12 | **Synthesizing** | Making meaning | Philosophy, wisdom, integration, big-picture thinking |

### Proposed Skills Taxonomy (v3.0) - 100% Reimagining

**Organizing principle: How You Create Value**

Instead of asking "what can you do?" we ask "how do you create value for others?"

| # | Segment | Value Created | How it shows up | Adjacent to |
|---|---------|---------------|-----------------|-------------|
| 1 | **Clarifying** | Turning confusion into understanding | Explaining, simplifying, teaching, translating | 2, 12 |
| 2 | **Analyzing** | Turning data into insight | Pattern recognition, diagnosis, research, logic | 1, 3 |
| 3 | **Strategizing** | Turning goals into plans | Planning, prioritizing, decision frameworks | 2, 4 |
| 4 | **Organizing** | Turning chaos into order | Systems, processes, operations, logistics | 3, 5 |
| 5 | **Building** | Turning ideas into reality | Coding, engineering, crafting, making | 4, 6 |
| 6 | **Designing** | Turning function into experience | UX, visual design, aesthetics, form | 5, 7 |
| 7 | **Creating** | Turning nothing into something | Art, writing, ideation, invention | 6, 8 |
| 8 | **Expressing** | Turning inner truth into outer form | Storytelling, performing, voice, presence | 7, 9 |
| 9 | **Connecting** | Turning strangers into relationships | Networking, empathy, facilitation, community | 8, 10 |
| 10 | **Influencing** | Turning minds toward action | Sales, persuasion, motivation, advocacy | 9, 11 |
| 11 | **Nurturing** | Turning potential into growth | Coaching, mentoring, developing, caring | 10, 12 |
| 12 | **Synthesizing** | Turning fragments into wholeness | Integration, wisdom, meaning-making, vision | 11, 1 |

**Why v3 is better:**
- Each segment is defined by the TRANSFORMATION it creates
- "Adjacent to" shows how skills naturally flow into each other on the wheel
- More emotionally resonant (people identify with the value they create)
- Cleaner verb-based naming

### Proposed Skills Taxonomy (v4.0) - 1000% Reimagining

**What if Skills had 2 dimensions too?**

**Dimension 1 (Around the wheel): Skill Domain** - What kind of value do you create?
- Use the 12 segments from v3

**Dimension 2 (Rings): Skill Maturity** - How developed is this skill?

| Ring | Level | Description | Indicators |
|------|-------|-------------|------------|
| Inner | **Emerging** | Natural aptitude, developing | "I'm drawn to this, learning" |
| Middle | **Proficient** | Reliable capability | "I can do this well consistently" |
| Outer | **Mastery** | Expert, can teach others | "People pay me for this, I mentor others" |

**This creates coordinates like:**
- "Emerging Builder" = naturally drawn to making things, still learning
- "Mastery Influencer" = expert at persuasion, could teach sales

**Alternative v4 concept: Energy Source**

What if the second dimension was WHERE the skill energy comes from?

| Ring | Source | Description |
|------|--------|-------------|
| Inner | **Intrinsic** | Do it for the love of it, would do it for free |
| Middle | **Developed** | Learned it, proficient, but not passionate |
| Outer | **Compensated** | Do it for money, not passion |

This would reveal interesting patterns:
- Inner ring skills = follow for fulfillment
- Outer ring skills = monetize but don't over-invest emotionally

*Decision needed: Is Skill Maturity or Energy Source more valuable as the second dimension?*

---

## 3. Persona Wheel (2D)

### Concept: Radial + Concentric

Unlike the other wheels, the Persona wheel is **two-dimensional**:
- **Angle (around wheel)** = Psychographic type
- **Distance from center** = Life stage

```
                        SEEKERS
                           |
              VISIONARIES  |  BUILDERS
                    \      |      /
                     \   [===]   /    ← Inner ring: Early Stage
        EXPLORERS ----[  ===  ]---- HEALERS
                     /   [===]   \    ← Middle ring: Growth Stage
                    /      |      \   ← Outer ring: Mastery Stage
              ACHIEVERS    |  TEACHERS
                           |
                      CONNECTORS
```

### Psychographic Segments (Around the wheel)

| # | Type | Motivation | Values | Fears |
|---|------|------------|--------|-------|
| 1 | **Seekers** | Finding direction | Authenticity, meaning | Being lost, wasting life |
| 2 | **Builders** | Creating something | Achievement, impact | Failure, irrelevance |
| 3 | **Healers** | Reducing suffering | Compassion, service | Helplessness, pain |
| 4 | **Teachers** | Sharing wisdom | Knowledge, growth | Ignorance, stagnation |
| 5 | **Connectors** | Bringing together | Harmony, community | Isolation, conflict |
| 6 | **Achievers** | Winning, success | Status, excellence | Mediocrity, losing |
| 7 | **Explorers** | New experiences | Freedom, adventure | Routine, limitation |
| 8 | **Visionaries** | Changing the future | Innovation, progress | Status quo, constraints |
| 9 | **Protectors** | Keeping safe | Security, stability | Chaos, uncertainty |
| 10 | **Creators** | Self-expression | Originality, beauty | Conformity, silence |
| 11 | **Nurturers** | Caring for others | Family, devotion | Abandonment, neglect |
| 12 | **Challengers** | Disrupting norms | Justice, truth | Complacency, injustice |

### Life Stage Rings (Distance from center)

| Ring | Stage | Age Range | Characteristics |
|------|-------|-----------|-----------------|
| Inner | **Emerging** | ~20-30 | Finding footing, exploring identity, building foundation |
| Middle | **Establishing** | ~30-50 | Building expertise, growing impact, peak productivity |
| Outer | **Mastering** | ~50+ | Wisdom, legacy, teaching, transition |

### How Selection Works

When users complete the Persona flow, they select:
1. **Primary psychographic** (which segment lights up)
2. **Life stage** (which ring within that segment)

This creates a specific "coordinate" on the wheel, e.g., "Emerging Builders" or "Mastering Teachers"

### Proposed Persona Taxonomy (v3.0) - 100% Improvement

**Clarification: This is the CUSTOMER'S life stage, not the user's**

The rings represent where your ideal customer is in their journey:

| Ring | Customer Stage | Description | Their Mindset |
|------|----------------|-------------|---------------|
| Inner | **Awakening** | Just realized they have this problem | "Something needs to change" |
| Middle | **Struggling** | Actively trying to solve, hitting walls | "I've tried things, nothing works" |
| Outer | **Ready** | Have budget, urgency, seeking solution | "I need help NOW, take my money" |

**Why this is better than age-based life stages:**
- More actionable for business (different messaging for each ring)
- Not tied to demographics (a 25-year-old can be "Ready", a 50-year-old can be "Awakening")
- Maps to buyer journey (awareness → consideration → decision)

**Refined Psychographic Segments:**

| # | Type | Core Drive | What they're seeking | Your role for them |
|---|------|-----------|---------------------|-------------------|
| 1 | **Seekers** | Direction | Clarity on their path | Guide, compass |
| 2 | **Builders** | Creation | Help building something | Architect, enabler |
| 3 | **Healers** | Wholeness | Recovery from pain | Healer, supporter |
| 4 | **Teachers** | Growth | Knowledge and skills | Mentor, expert |
| 5 | **Connectors** | Belonging | Community and relationships | Host, facilitator |
| 6 | **Achievers** | Success | Status and recognition | Coach, accelerator |
| 7 | **Explorers** | Freedom | Adventure and autonomy | Liberator, guide |
| 8 | **Visionaries** | Impact | Change the future | Partner, amplifier |
| 9 | **Protectors** | Security | Safety and stability | Guardian, advisor |
| 10 | **Creators** | Expression | Voice and originality | Muse, champion |
| 11 | **Nurturers** | Care | Support for loved ones | Helper, resource |
| 12 | **Challengers** | Justice | Fight against injustice | Ally, activist |

### Proposed Persona Taxonomy (v4.0) - 1000% Reimagining

**Three-dimensional persona mapping?**

What if we captured THREE aspects of the ideal customer:

1. **Psychographic (wheel position)** - Who they ARE (Seeker, Builder, etc.)
2. **Journey Stage (inner ring)** - Where they are in awareness (Awakening → Struggling → Ready)
3. **Engagement Depth (outer ring)** - What level of help they want

**Engagement Depth dimension:**

| Level | Type | What they want | Price sensitivity |
|-------|------|----------------|-------------------|
| Light | **DIY** | Content, templates, self-serve | Low ticket |
| Medium | **Guided** | Courses, group coaching, community | Mid ticket |
| Deep | **Done-With** | 1:1 coaching, consulting, high-touch | High ticket |

**This creates 3D coordinates like:**
- "Struggling Builders wanting Guided help" = perfect for a group coaching program
- "Ready Achievers wanting Done-With support" = premium 1:1 consulting

**Visual representation:**
```
        [Psychographic around wheel]
              SEEKERS
                 │
    ┌────────────┼────────────┐
    │   ○ ○ ○    │    ○ ○ ○   │  ← Outer: Ready
    │  ○ ○ ○ ○   │   ○ ○ ○ ○  │  ← Middle: Struggling
    │   ○ ○ ○    │    ○ ○ ○   │  ← Inner: Awakening
    └────────────┼────────────┘
              BUILDERS

    Each ○ = Engagement depth (DIY / Guided / Done-With)
```

*Decision: Is 3D too complex? Or is the clarity worth it?*

---

## Technical Implementation Notes

### Data Structure

```javascript
// Problem/Skills wheels (1D)
{
  wheel_type: 'problems' | 'skills',
  segments: [
    { id: 'physical_health', lit: true },
    { id: 'mental_wellbeing', lit: false },
    // ...
  ]
}

// Persona wheel (2D)
{
  wheel_type: 'persona',
  segments: [
    {
      id: 'seekers',
      rings: {
        emerging: true,
        establishing: false,
        mastering: false
      }
    },
    // ...
  ]
}
```

### AI Mapping Requirements

The AI needs to map user responses to segments. Options:
1. **Keyword matching** - Extract keywords, map to segments
2. **Embedding similarity** - Compare response embeddings to segment descriptions
3. **LLM classification** - Ask Claude to classify each response

### Visual Component Structure

```
src/components/
  CompetenceWheels/
    ProblemWheel.jsx
    SkillsWheel.jsx
    PersonaWheel.jsx
    WheelSegment.jsx
    WheelLegend.jsx
    index.js
```

---

## Design Decisions (Confirmed)

### Problem Space Wheel: 2D
- **Around wheel:** Domain (12 segments from v3 - Spheres of Impact)
- **Rings:** Problem Type (Access / Knowledge / Capability / Motivation / Connection / System)
- **Coordinate example:** "Economic Freedom + System Problem"

### Skills Wheel: 2D + Bonus
- **Around wheel:** Value Creation (12 segments from v3)
- **Rings:** Skill Maturity (Emerging / Proficient / Mastery)
- **Bonus question:** Energy Source (Intrinsic / Developed / Compensated)
- **Insight:** Inner energy + Emerging skill = "Keep investing here!"

### Persona Wheel: 2D + Bonus
- **Around wheel:** Psychographic (12 types)
- **Rings:** Journey Stage (Awakening / Struggling / Ready)
- **Bonus question:** Engagement Depth (DIY / Guided / Done-With)
- **Coordinate example:** "Struggling Explorers"

---

## 1000% Evolution Ideas

### Cross-Wheel Intelligence

**1. Alignment Scoring**
When the same segments light up across all 3 wheels = strong Nikigai fit.

```
Problem: Economic Freedom [LIT]
Skills: Building, Strategizing [LIT]
Persona: Builders, Explorers [LIT]

ALIGNMENT SCORE: 87% 🎯
"Your skills directly match the problems you care about
 AND the people you want to serve. This is your sweet spot."
```

**2. Gap Analysis**
Automatically detect mismatches that reveal opportunities:

| Pattern | What it means | Suggested action |
|---------|---------------|------------------|
| Problem LIT, Skill DARK | You care but can't help yet | Learn this skill, or partner |
| Skill LIT, Problem DARK | You can but don't care | Monetize, don't make it your mission |
| Skill MASTERY, Persona AWAKENING | You're expert, they're early | Create beginner content |
| Skill EMERGING, Persona READY | You're learning, they need expert | Not ready for this market yet |

**3. Opportunity Matrix**
Cross-reference all three wheels to surface specific business opportunities:

```
Your lit areas suggest these opportunities:

┌─────────────────────────────────────────────────────────┐
│ OPPORTUNITY: "Escape the 9-5" Coaching Program         │
├─────────────────────────────────────────────────────────┤
│ Problem: Economic Freedom + System Trap                 │
│ Skills: Strategizing (Mastery) + Nurturing (Proficient)│
│ Persona: Struggling Explorers wanting Guided help       │
│                                                         │
│ Fit Score: 92% ⭐⭐⭐⭐⭐                                │
│ Suggested Offer: Group coaching program ($997-2997)    │
└─────────────────────────────────────────────────────────┘
```

### Temporal Evolution

**4. Wheel History**
Track how wheels change over time:
- "3 months ago you had 2 segments lit. Now you have 6."
- "Your skills have matured from Emerging to Proficient in Building"
- "Your persona focus has narrowed (good! more clarity)"

**5. Goal Setting**
Let users set intentions:
- "I want to light up the Climate segment"
- App suggests: "Complete these quests to explore this space"
- Gamified progression toward lighting up desired segments

**6. Predictive Insights**
Based on patterns:
- "Users with your wheel pattern often light up [X] next"
- "Your trajectory suggests you're becoming a [archetype]"

### Social/Collaborative

**7. Wheel Matching**
- Find mentors with complementary wheels
- Team composition analysis (startup co-founders)
- "You need someone strong in [dark segment]"

**8. Aggregate Patterns**
- "78% of FindMyFlow users have Economic Freedom lit"
- "Only 12% have Planetary Health lit - you're rare!"
- Industry benchmarks for different business types

### Zarlo Integration

**9. Context-Aware Coaching**
Zarlo can reference wheel state:
- "I see your Skills wheel shows Emerging in Influencing. Want to work on that?"
- "Your Problem and Persona wheels are aligned but Skills has a gap. Let's address that."
- "Based on your wheels, here's what I'd focus on this week..."

**10. Dynamic Quest Recommendations**
Challenge quests that specifically target:
- Unlit segments you might care about
- Moving skills from Emerging → Proficient
- Testing if a Problem segment truly resonates

---

## Application to FindMyFlow

### Where Wheels Should Live

| Location | Purpose | Priority |
|----------|---------|----------|
| **Library of Answers** | Primary home - full wheel visualization | P0 |
| **Dashboard mini-widget** | Quick glance at wheel state | P1 |
| **Flow completion screen** | "You just lit up [segment]!" celebration | P1 |
| **Zarlo context** | AI references wheels in conversation | P2 |
| **Dedicated /competence page** | Deep dive with all insights | P2 |

### Implementation Phases

**Phase 1: Foundation**
1. Define final taxonomy in code (constants/enums)
2. Update Flow Finder AI to classify responses into segments
3. Create database schema for wheel state
4. Build basic wheel visualization component

**Phase 2: Core Experience**
1. Integrate with existing Flow Finder flows
2. Add to Library of Answers page
3. Celebration animations when segments light up
4. Basic cross-wheel alignment scoring

**Phase 3: Intelligence**
1. Gap analysis and opportunity detection
2. Zarlo integration
3. Wheel history tracking
4. Goal setting for segments

**Phase 4: Social**
1. Aggregate patterns (anonymous)
2. Mentor/team matching
3. Comparative insights

### Database Schema (Draft)

```sql
-- Store wheel state per user per project
CREATE TABLE competence_wheels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES user_projects(id),
  wheel_type TEXT NOT NULL, -- 'problems' | 'skills' | 'persona'
  segments JSONB NOT NULL,  -- Array of segment states
  bonus_answers JSONB,      -- Energy source, engagement depth
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track wheel changes over time
CREATE TABLE wheel_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  wheel_id UUID REFERENCES competence_wheels(id),
  snapshot JSONB NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Component Structure

```
src/components/CompetenceWheels/
├── ProblemWheel.jsx      # 2D wheel with problem type rings
├── SkillsWheel.jsx       # 2D wheel with maturity rings
├── PersonaWheel.jsx      # 2D wheel with journey rings
├── WheelSegment.jsx      # Individual segment (lit/unlit states)
├── WheelRing.jsx         # Concentric ring component
├── WheelLegend.jsx       # Color/segment legend
├── WheelInsights.jsx     # Alignment score, gap analysis
├── WheelMini.jsx         # Dashboard widget version
├── WheelCelebration.jsx  # Animation when segment lights up
└── index.js
```

---

## Design Decisions (Additional)

- **Color scheme:** True rainbow (each segment gets a distinct hue)
- **Multiple segments:** Light both when responses span segments

---

## Wheel Data Ecosystem

### CAPTURE: Where insights flow IN

#### From the User (refining YOUR wheels)

| Source | What it captures | Which wheel |
|--------|------------------|-------------|
| **Flow Finder flows** | Primary discovery | All 3 wheels |
| **Groan reflections** | Problems you care about emotionally | Problem wheel |
| **Quest completions** | Skills you're developing | Skills wheel (maturity progression) |
| **Flow Compass entries** | Which work energizes vs drains | Skills wheel (energy source) |
| **Offer Builder answers** | Who you're designing for | Persona wheel validation |
| **Sales/client conversations** | Real customer patterns | Persona wheel refinement |

#### From Target Customers (validating YOUR assumptions)

| Source | What it captures | How it refines wheels |
|--------|------------------|----------------------|
| **Validation Flow surveys** | Customer self-identification | Confirms/adjusts Persona wheel |
| **Lead magnet opt-in questions** | Problem resonance | Validates Problem wheel |
| **Quiz results** | Psychographic signals | Refines Persona segments |
| **Sales call notes** | Journey stage signals | Validates Persona rings |
| **Testimonials/reviews** | What problem you actually solved | Confirms Problem wheel |
| **Refund/churn reasons** | Mismatches to investigate | Reveals wheel gaps |

### APPLY: Where insights flow OUT

#### Validation Flow Integration

The Validation Flow questions can be auto-generated based on wheel state:

**Current approach:** Generic survey questions
**Wheel-enhanced approach:**

```
Based on your wheels, we'll ask your audience:

PROBLEM VALIDATION (from Problem Wheel)
───────────────────────────────────────
Your lit segment: Economic Freedom + System Problem
Generated question: "What's your biggest frustration with your current work situation?"
Options mapped to problem types:
  □ I can't find opportunities (Access)
  □ I don't know how to start (Knowledge)
  □ I lack the skills needed (Capability)
  □ I keep putting it off (Motivation)
  □ I don't know the right people (Connection)
  □ My job/situation won't allow it (System) ← validates your assumption

PERSONA VALIDATION (from Persona Wheel)
───────────────────────────────────────
Your lit segment: Struggling Explorers
Generated question: "Which best describes where you are right now?"
Options mapped to journey stage:
  □ I'm just starting to realize I want change (Awakening)
  □ I've been trying to figure this out for a while (Struggling) ← validates
  □ I'm ready to invest in a solution NOW (Ready)

Generated question: "What matters most to you?"
Options mapped to psychographics:
  □ Freedom and flexibility (Explorer) ← validates
  □ Building something meaningful (Builder)
  □ Recognition and success (Achiever)
  □ Helping others (Healer)
```

**The feedback loop:**
1. User sends Validation Flow to 50 people
2. 35 say "System problem" + "Struggling" + "Explorer"
3. Wheel confidence increases for those segments
4. 10 say "Knowledge problem" + "Awakening" + "Builder"
5. NEW segments light up (secondary audience discovered!)

#### Offer Builder Integration

| Wheel Data | How it shapes the offer |
|------------|------------------------|
| **Problem segment** | Core pain point to address in headline |
| **Problem type** | What the offer actually delivers |
| **Skill maturity** | Whether you deliver content vs done-for-you |
| **Persona psychographic** | Emotional hooks and positioning |
| **Persona journey** | Awareness level → messaging complexity |
| **Engagement depth** | Delivery method and price point |

**Example auto-suggestions:**

```
Based on your wheels, here's your offer blueprint:

┌─────────────────────────────────────────────────────────────┐
│ OFFER BUILDER SUGGESTIONS                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ TARGET PAIN (from Problem Wheel):                           │
│ "Trapped in a 9-5 with no clear escape path"                │
│ → System problem in Economic Freedom                        │
│                                                             │
│ YOUR DELIVERY (from Skills Wheel):                          │
│ Strategizing: Mastery → You can teach frameworks            │
│ Building: Proficient → You can guide, not do-for-them       │
│ Nurturing: Proficient → Group coaching suits you            │
│                                                             │
│ THEIR READINESS (from Persona Wheel):                       │
│ Struggling Explorers → They've tried things, need guidance  │
│ → Don't over-explain basics, show the path forward          │
│ → Price: Mid-ticket ($500-2000) - they'll invest but        │
│   need to see clear ROI                                     │
│                                                             │
│ RECOMMENDED OFFER STRUCTURE:                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ "90-Day Business Escape Plan" - Group Coaching Program  │ │
│ │ Price: $1,497                                           │ │
│ │ Includes: Weekly strategy calls + templates + community │ │
│ │ Promise: Clear roadmap from 9-5 to side income          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Lead Magnet Selection

| Persona Psychographic | Best Lead Magnet Types |
|----------------------|------------------------|
| **Seekers** | Quizzes ("Find Your Path"), assessments |
| **Builders** | Templates, blueprints, checklists |
| **Healers** | Guides, workbooks, self-assessment |
| **Teachers** | Cheat sheets, frameworks, quick-reference |
| **Connectors** | Community access, group challenges |
| **Achievers** | Case studies, ROI calculators, benchmarks |
| **Explorers** | Mini-courses, video series, "Day in the Life" |
| **Visionaries** | Trend reports, future predictions, manifestos |
| **Protectors** | Checklists, risk assessments, "avoid mistakes" guides |
| **Creators** | Prompts, inspiration collections, mood boards |
| **Nurturers** | Resource libraries, "for your family" guides |
| **Challengers** | Manifestos, myth-busting content, "truth about X" |

| Journey Stage | Lead Magnet Focus |
|---------------|-------------------|
| **Awakening** | "Is this you?" content, awareness-building |
| **Struggling** | "Here's why you're stuck" + solution preview |
| **Ready** | Comparison guides, "how to choose" content |

#### Content Generator Integration (CRM)

Wheel data can inform AI-generated content:

```javascript
// Content generation prompt context
const wheelContext = {
  problem: "Economic Freedom - System Problem",
  persona: "Struggling Explorers",

  // AI uses this to adjust:
  tone: "empathetic but action-oriented", // Explorers want movement
  painPoints: ["feeling trapped", "lack of autonomy", "trading time for money"],
  emotionalHooks: ["freedom", "adventure", "escape", "possibility"],
  avoidLanguage: ["safe", "secure", "stable"], // Explorers resist this
  journeyAwareness: "solution-aware", // Don't over-explain the problem
}
```

#### Funnel Builder Integration

| Journey Stage | Funnel Stage Focus |
|---------------|-------------------|
| **Awakening** | Heavy awareness content, problem agitation |
| **Struggling** | Solution education, objection handling |
| **Ready** | Social proof, urgency, clear CTA |

```
FUNNEL CUSTOMIZATION (based on Persona Wheel):

Your audience: Struggling Explorers

Recommended funnel flow:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   ATTRACT    │     │   NURTURE    │     │   CONVERT    │
│              │     │              │     │              │
│ "Quiz: What's│     │ 5-day email  │     │ Webinar:     │
│ keeping you  │ --> │ showing the  │ --> │ "The Escape  │
│ stuck?"      │     │ escape path  │     │ Blueprint"   │
│              │     │              │     │              │
│ (validates   │     │ (builds      │     │ (presents    │
│ problem type)│     │ trust)       │     │ offer)       │
└──────────────┘     └──────────────┘     └──────────────┘

Skip for Ready audience → direct to offer
Extend for Awakening → more awareness content first
```

#### Product Value Equation (Hormozi)

The 4 variables weighted by persona:

| Variable | Explorer weighting | Builder weighting | Achiever weighting |
|----------|-------------------|-------------------|-------------------|
| **Dream Outcome** | Freedom, flexibility | Creation, legacy | Status, recognition |
| **Perceived Likelihood** | Medium priority | High priority | Highest priority |
| **Time Delay** | Want it fast | Patient if building | Want results NOW |
| **Effort & Sacrifice** | Low effort preferred | Will work hard | Willing if ROI clear |

#### Price Point Suggestions

| Engagement Depth | Journey Stage | Suggested Range |
|------------------|---------------|-----------------|
| DIY | Awakening | Free - $47 |
| DIY | Struggling | $47 - $197 |
| DIY | Ready | $197 - $497 |
| Guided | Awakening | $197 - $497 |
| Guided | Struggling | $497 - $1,997 |
| Guided | Ready | $1,997 - $4,997 |
| Done-With | Awakening | Rarely appropriate |
| Done-With | Struggling | $2,997 - $7,997 |
| Done-With | Ready | $5,000 - $25,000+ |

---

## Other Integration Opportunities

### Money Model Flows
- **Upsell suggestions** based on what skills you have at Mastery
- **Downsell suggestions** based on what you can automate (lower skill maturity needed)
- **Continuity model** matched to persona engagement depth preferences

### Challenge Quests
- Dynamic quests that target specific wheel development
- "This week: Move your Influencing skill from Emerging to Proficient"
- "Validate your Persona assumptions with 5 conversations"

### Zarlo Prompts
- "Your wheels suggest you should focus on [X] this week"
- "I notice a gap between your Problem wheel and Skills wheel - want to address it?"
- "Your validation data is shifting your Persona wheel - your audience might be different than you thought"

### Flow Compass Integration
- Log entries could tag which segment the work relates to
- Track energy by segment over time
- "You consistently feel North when doing [Nurturing] work"

---

## Problem Space → Product Feature Matrix

### The Insight

Different problem spaces naturally require different types of product features. When users identify their problem space on the wheel, we can suggest the core features their product likely needs.

### Feature Archetypes

Before mapping to problem spaces, here are the core feature types that appear across products:

| Archetype | What it does | Examples |
|-----------|--------------|----------|
| **Tracking** | Record data over time | Habit logs, mood journals, expense tracking |
| **Analysis** | Make sense of data | Dashboards, reports, trend visualization |
| **Planning** | Map out future actions | Calendars, roadmaps, goal setting |
| **Communication** | Connect people | Messaging, forums, video calls |
| **Creation** | Make something new | Editors, templates, builders |
| **Learning** | Acquire knowledge/skills | Courses, tutorials, practice exercises |
| **Accountability** | Keep people on track | Reminders, streaks, check-ins, coaches |
| **Community** | Shared experience | Groups, challenges, leaderboards |
| **Matching** | Connect supply and demand | Marketplaces, directories, recommendations |
| **Automation** | Do work for the user | Workflows, integrations, AI agents |

### Problem Space → Core Features

| # | Problem Space | Core Feature Needs | Why these features |
|---|---------------|-------------------|-------------------|
| 1 | **Physical Vitality** | Tracking, Analysis, Accountability | Health requires consistent monitoring + behavior change |
| 2 | **Mental Wellbeing** | Tracking, Learning, Accountability | Mental health needs reflection + skill-building + support |
| 3 | **Personal Mastery** | Learning, Tracking, Community | Skill development needs practice + progress + peers |
| 4 | **Intimate Bonds** | Communication, Planning, Tracking | Relationships need connection + coordination + awareness |
| 5 | **Service & Care** | Planning, Communication, Matching | Caregiving needs coordination + connection + resources |
| 6 | **Creative Expression** | Creation, Community, Matching | Creativity needs tools + feedback + audience |
| 7 | **Local Impact** | Communication, Planning, Community | Teams need alignment + coordination + belonging |
| 8 | **Cultural Movements** | Community, Communication, Creation | Movements need belonging + spreading ideas + content |
| 9 | **Economic Freedom** | Analysis, Planning, Learning, Automation | Business needs numbers + strategy + skills + efficiency |
| 10 | **Social Justice** | Community, Communication, Matching | Advocacy needs organizing + amplifying + connecting |
| 11 | **Planetary Health** | Tracking, Community, Analysis | Environment needs measurement + collective action + impact |
| 12 | **Human Progress** | Learning, Creation, Community, Analysis | Innovation needs knowledge + building + collaboration + data |

### Detailed Feature Maps by Problem Space

#### 1. Physical Vitality Products

```
CORE FEATURES:
┌─────────────────────────────────────────────────────────┐
│ TRACKING            │ ANALYSIS           │ ACCOUNTABILITY│
│ • Activity logs     │ • Progress charts  │ • Daily check-ins
│ • Nutrition diary   │ • Trend insights   │ • Streak tracking
│ • Sleep tracking    │ • Correlations     │ • Coach/buddy
│ • Symptom logging   │ • Goal vs actual   │ • Reminders
│ • Biometric input   │ • Predictions      │ • Milestone rewards
└─────────────────────────────────────────────────────────┘

EXAMPLE PRODUCTS: MyFitnessPal, Whoop, Noom, Headspace

MVP FEATURE SET:
1. Simple daily logging (what + how much)
2. Visual progress (chart/calendar)
3. Streak/reminder system
```

#### 2. Mental Wellbeing Products

```
CORE FEATURES:
┌─────────────────────────────────────────────────────────┐
│ TRACKING            │ LEARNING           │ ACCOUNTABILITY│
│ • Mood logging      │ • Guided exercises │ • Check-in prompts
│ • Journaling        │ • Psychoeducation  │ • Therapist connect
│ • Trigger tracking  │ • Coping skills    │ • Crisis resources
│ • Gratitude logs    │ • Meditation       │ • Progress reviews
│ • Pattern notes     │ • Breathwork       │ • Support community
└─────────────────────────────────────────────────────────┘

EXAMPLE PRODUCTS: Calm, BetterHelp, Daylio, Woebot

MVP FEATURE SET:
1. Daily mood/journal entry
2. One guided exercise type (breathing/meditation)
3. Weekly reflection prompt
```

#### 3. Personal Mastery Products

```
CORE FEATURES:
┌─────────────────────────────────────────────────────────┐
│ LEARNING            │ TRACKING           │ COMMUNITY     │
│ • Skill curriculum  │ • Practice logs    │ • Peer groups
│ • Tutorials/lessons │ • Progress levels  │ • Leaderboards
│ • Practice exercises│ • Time invested    │ • Mentorship
│ • Feedback loops    │ • Skill assessment │ • Challenges
│ • Certifications    │ • Portfolio        │ • Accountability
└─────────────────────────────────────────────────────────┘

EXAMPLE PRODUCTS: Duolingo, Skillshare, Chess.com, Codecademy

MVP FEATURE SET:
1. Structured learning path
2. Practice + immediate feedback
3. Progress visualization (levels/XP)
```

#### 4. Intimate Bonds Products

```
CORE FEATURES:
┌─────────────────────────────────────────────────────────┐
│ COMMUNICATION       │ PLANNING           │ TRACKING      │
│ • Private messaging │ • Shared calendar  │ • Relationship logs
│ • Conversation aids │ • Date planning    │ • Appreciation notes
│ • Conflict tools    │ • Goal setting     │ • Love language
│ • Appreciation      │ • Milestone marking│ • Quality time
│ • Check-in prompts  │ • Task sharing     │ • Issue patterns
└─────────────────────────────────────────────────────────┘

EXAMPLE PRODUCTS: Lasting, Paired, Gottman Card Decks, Cozi

MVP FEATURE SET:
1. Daily/weekly check-in prompts
2. Appreciation/gratitude sharing
3. Shared calendar or to-do
```

#### 5. Service & Care Products

```
CORE FEATURES:
┌─────────────────────────────────────────────────────────┐
│ PLANNING            │ COMMUNICATION      │ MATCHING      │
│ • Care schedules    │ • Family updates   │ • Provider directory
│ • Task assignment   │ • Status sharing   │ • Resource finder
│ • Medication remind │ • Emergency alerts │ • Support groups
│ • Appointment mgmt  │ • Care team chat   │ • Respite matching
│ • Document storage  │ • Progress notes   │ • Equipment sharing
└─────────────────────────────────────────────────────────┘

EXAMPLE PRODUCTS: CaringBridge, Lotsa Helping Hands, Care.com

MVP FEATURE SET:
1. Shared care calendar
2. Task signup/coordination
3. Update broadcasting to family
```

#### 6. Creative Expression Products

```
CORE FEATURES:
┌─────────────────────────────────────────────────────────┐
│ CREATION            │ COMMUNITY          │ MATCHING      │
│ • Canvas/editor     │ • Feedback/critique│ • Audience building
│ • Templates/prompts │ • Inspiration feed │ • Commission market
│ • Asset libraries   │ • Challenges       │ • Collaboration
│ • Version history   │ • Showcase/gallery │ • Client matching
│ • Export/publish    │ • Creator profiles │ • Licensing
└─────────────────────────────────────────────────────────┘

EXAMPLE PRODUCTS: Canva, Behance, Figma, Wattpad

MVP FEATURE SET:
1. Simple creation tool
2. Easy sharing/publishing
3. Community feedback mechanism
```

#### 7. Local Impact Products

```
CORE FEATURES:
┌─────────────────────────────────────────────────────────┐
│ COMMUNICATION       │ PLANNING           │ COMMUNITY     │
│ • Team chat/forums  │ • Project boards   │ • Member directory
│ • Meeting tools     │ • Task management  │ • Role assignment
│ • Decision-making   │ • Timeline/roadmap │ • Recognition
│ • Announcements     │ • Resource allocate│ • Onboarding
│ • Feedback channels │ • Goal tracking    │ • Culture tools
└─────────────────────────────────────────────────────────┘

EXAMPLE PRODUCTS: Slack, Notion, Monday.com, Culture Amp

MVP FEATURE SET:
1. Communication channel
2. Shared task/project board
3. Team directory with roles
```

#### 8. Cultural Movements Products

```
CORE FEATURES:
┌─────────────────────────────────────────────────────────┐
│ COMMUNITY           │ COMMUNICATION      │ CREATION      │
│ • Member spaces     │ • Broadcasting     │ • Content creation
│ • Events/gatherings │ • Story sharing    │ • Meme/asset tools
│ • Identity markers  │ • Amplification    │ • Manifesto builder
│ • Rituals/traditions│ • Cross-posting    │ • Merchandise
│ • Membership tiers  │ • Newsletter       │ • Campaign tools
└─────────────────────────────────────────────────────────┘

EXAMPLE PRODUCTS: Mighty Networks, Discord, Substack, Patreon

MVP FEATURE SET:
1. Community space (forum/chat)
2. Content sharing capability
3. Membership/identity system
```

#### 9. Economic Freedom Products

```
CORE FEATURES:
┌─────────────────────────────────────────────────────────┐
│ ANALYSIS            │ PLANNING           │ LEARNING      │ AUTOMATION
│ • Financial dashbrd │ • Goal setting     │ • Business edu│ • Workflows
│ • Revenue tracking  │ • Roadmapping      │ • Skill courses│ • Integrations
│ • Expense analysis  │ • Milestone plan   │ • Mentorship  │ • Templates
│ • Projections       │ • Resource allocate│ • Case studies│ • AI assistance
│ • KPI monitoring    │ • Scenario planning│ • Playbooks   │ • Scheduling
└─────────────────────────────────────────────────────────┘

EXAMPLE PRODUCTS: QuickBooks, Kajabi, Notion, FindMyFlow 😉

MVP FEATURE SET:
1. Progress/milestone tracking
2. Educational content/guidance
3. Planning/roadmap tool
```

#### 10. Social Justice Products

```
CORE FEATURES:
┌─────────────────────────────────────────────────────────┐
│ COMMUNITY           │ COMMUNICATION      │ MATCHING      │
│ • Organizing hubs   │ • Campaign tools   │ • Volunteer match
│ • Action groups     │ • Petition systems │ • Resource directory
│ • Training/education│ • Story amplifying │ • Legal aid connect
│ • Safety tools      │ • Witness/document │ • Ally matching
│ • Impact tracking   │ • Policy tracking  │ • Donation routing
└─────────────────────────────────────────────────────────┘

EXAMPLE PRODUCTS: Change.org, Action Network, Mobilize

MVP FEATURE SET:
1. Campaign/petition creation
2. Supporter sign-up/action
3. Impact counter/social proof
```

#### 11. Planetary Health Products

```
CORE FEATURES:
┌─────────────────────────────────────────────────────────┐
│ TRACKING            │ COMMUNITY          │ ANALYSIS      │
│ • Carbon footprint  │ • Group challenges │ • Impact dashboard
│ • Consumption logs  │ • Local initiatives│ • Comparison tools
│ • Habit tracking    │ • Knowledge sharing│ • Trend analysis
│ • Impact actions    │ • Collective goals │ • Scenario modeling
│ • Offset tracking   │ • Accountability   │ • Resource guides
└─────────────────────────────────────────────────────────┘

EXAMPLE PRODUCTS: Joro, Olio, Good On You, Ecosia

MVP FEATURE SET:
1. Simple impact calculator
2. Action suggestions
3. Progress tracking + community comparison
```

#### 12. Human Progress Products

```
CORE FEATURES:
┌─────────────────────────────────────────────────────────┐
│ LEARNING            │ CREATION           │ COMMUNITY     │ ANALYSIS
│ • Research access   │ • Prototyping tools│ • Collaboration│ • Data tools
│ • Knowledge bases   │ • Documentation    │ • Peer review │ • Visualization
│ • Trend tracking    │ • Experimentation  │ • Funding match│ • Prediction
│ • Skill building    │ • Publishing       │ • Open source │ • Citation
│ • Cross-pollination │ • Version control  │ • Mentorship  │ • Impact metrics
└─────────────────────────────────────────────────────────┘

EXAMPLE PRODUCTS: GitHub, ResearchGate, Notion, Observable

MVP FEATURE SET:
1. Knowledge/research repository
2. Collaboration tools
3. Publishing/sharing mechanism
```

### Feature Priority by Problem Type

Remember: Problem Space has TWO dimensions - Domain AND Problem Type.

The Problem Type affects which features are most critical:

| Problem Type | Priority Features | Why |
|--------------|-------------------|-----|
| **Access** | Matching, Community | They need to FIND resources they can't reach |
| **Knowledge** | Learning, Analysis | They need to UNDERSTAND what they don't know |
| **Capability** | Learning, Tracking, Accountability | They need to BUILD skills they lack |
| **Motivation** | Accountability, Community, Tracking | They need SUPPORT to take action |
| **Connection** | Matching, Communication, Community | They need to CONNECT with others |
| **System** | Automation, Planning, Analysis | They need to ESCAPE or WORK AROUND structures |

### Example: Economic Freedom Products by Problem Type

Same domain, different problem types = different feature priorities:

| Problem Type | Product Focus | Core Features |
|--------------|---------------|---------------|
| **Access** (can't find opportunities) | Opportunity marketplace | Matching, Discovery, Filtering |
| **Knowledge** (don't know how) | Educational platform | Learning, Courses, Mentorship |
| **Capability** (lack skills) | Skill-building tool | Practice, Feedback, Progress tracking |
| **Motivation** (procrastinating) | Accountability system | Community, Streaks, Coaching |
| **Connection** (no network) | Networking platform | Matching, Communication, Events |
| **System** (trapped in 9-5) | Escape planning tool | Planning, Analysis, Milestones, Automation |

### Integration with Offer Builder

When users complete their wheels, Offer Builder can suggest:

```
┌─────────────────────────────────────────────────────────────┐
│ PRODUCT FEATURE SUGGESTIONS                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Based on your Problem Wheel:                                │
│ Domain: Economic Freedom                                    │
│ Type: System Problem                                        │
│                                                             │
│ Your product should prioritize:                             │
│                                                             │
│ 1. PLANNING features (escape roadmap, milestone tracking)   │
│ 2. ANALYSIS features (current situation assessment, gaps)   │
│ 3. AUTOMATION features (templates, workflows, shortcuts)    │
│ 4. ACCOUNTABILITY features (coach check-ins, community)     │
│                                                             │
│ MVP Feature Set:                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ □ Step-by-step escape roadmap with milestones           │ │
│ │ □ Current situation assessment tool                      │ │
│ │ □ Weekly check-in prompts                                │ │
│ │ □ Resource/template library                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Nice-to-Have (Phase 2):                                     │
│ • Community of fellow escapees                              │
│ • AI-powered personalized advice                            │
│ • Integration with financial tracking                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Feature Archetype Compatibility

Some feature archetypes work better together:

```
NATURAL COMBINATIONS:
Tracking + Analysis = "Know yourself" products
Learning + Accountability = "Change yourself" products
Creation + Community = "Express yourself" products
Matching + Communication = "Connect yourself" products
Planning + Automation = "Free yourself" products

TENSION COMBINATIONS (pick one focus):
Tracking vs Creation (reflection vs production)
Learning vs Automation (skill-building vs shortcutting)
Community vs Matching (belonging vs transacting)
```

---

## Product Blueprint Flow (Draft)

### Overview

A guided flow that transforms wheel insights into a concrete product feature blueprint. Users complete the flow and receive a customized MVP feature set, technical recommendations, and integration with Offer Builder.

### Flow Position in App

```
Flow Finder (Skills/Problems/Persona)
            ↓
    Competence Wheels Generated
            ↓
    ┌───────────────────────┐
    │  PRODUCT BLUEPRINT    │  ← NEW FLOW
    │  /product-blueprint   │
    └───────────────────────┘
            ↓
    Offer Builder (pricing, positioning)
            ↓
    Validation Flow (test with customers)
```

### User Journey

**Entry Points:**
1. After completing all 3 Flow Finder flows → Prompt: "Ready to design your product?"
2. From Library of Answers → "Build Product Blueprint" button
3. From Stage 2 (Product Creation) quest in Challenge
4. Direct navigation to `/product-blueprint`

### Flow Screens

#### Screen 1: Wheel Summary

**Purpose:** Show user their wheel data, confirm it's accurate before generating blueprint.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              YOUR COMPETENCE WHEELS                         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  PROBLEMS   │  │   SKILLS    │  │   PERSONA   │         │
│  │   [wheel]   │  │   [wheel]   │  │   [wheel]   │         │
│  │             │  │             │  │             │         │
│  │ Economic    │  │ Strategizing│  │ Struggling  │         │
│  │ Freedom     │  │ Building    │  │ Explorers   │         │
│  │ + System    │  │ Nurturing   │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ YOUR NIKIGAI SUMMARY                                │   │
│  │                                                     │   │
│  │ You help freedom-seeking professionals escape       │   │
│  │ the 9-5 through strategic business coaching,        │   │
│  │ combining your ability to build systems with        │   │
│  │ your ability to nurture growth.                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Does this feel accurate?                                   │
│                                                             │
│  [ Yes, continue ]          [ Refine my wheels ]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**If wheels incomplete:** Redirect to Flow Finder or show quick-capture version.

---

#### Screen 2: Problem Deep-Dive

**Purpose:** Confirm the specific problem type and gather additional context.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              LET'S GET SPECIFIC                             │
│                                                             │
│  Your Problem Domain: ECONOMIC FREEDOM                      │
│                                                             │
│  What TYPE of problem do your customers face?               │
│  (Select the primary one)                                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ○ ACCESS - They can't find opportunities            │   │
│  │   "I don't know where to look for clients"          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ○ KNOWLEDGE - They don't know how                   │   │
│  │   "I don't understand how to start a business"      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ○ CAPABILITY - They lack the skills                 │   │
│  │   "I can't do the technical/sales/marketing parts"  │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ○ MOTIVATION - They can't make themselves do it     │   │
│  │   "I keep procrastinating and self-sabotaging"      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ○ CONNECTION - They're isolated                     │   │
│  │   "I don't know anyone who can help"                │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ● SYSTEM - They're trapped by structures            │   │ ← Selected
│  │   "My job/life situation won't let me escape"       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                        [ Continue → ]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

#### Screen 3: Delivery Capability Check

**Purpose:** Understand how the user can deliver (based on skills + preference).

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              HOW WILL YOU DELIVER?                          │
│                                                             │
│  Based on your Skills Wheel, you're strong in:              │
│  • Strategizing (Mastery)                                   │
│  • Building (Proficient)                                    │
│  • Nurturing (Proficient)                                   │
│                                                             │
│  What delivery method excites you most?                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ○ CONTENT - Courses, templates, guides              │   │
│  │   You create once, they consume on their own        │   │
│  │   Best for: Scaling, passive income                 │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ● GROUP - Coaching, cohorts, community              │   │ ← Selected
│  │   You guide groups through a transformation         │   │
│  │   Best for: Leverage + personal touch               │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ○ 1:1 - Consulting, done-with-you                   │   │
│  │   You work closely with individuals                 │   │
│  │   Best for: Premium pricing, deep impact            │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ○ DONE-FOR - Agency, productized service            │   │
│  │   You do the work for them                          │   │
│  │   Best for: Higher revenue, operational complexity  │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ○ SOFTWARE - App, tool, platform                    │   │
│  │   Technology does the work                          │   │
│  │   Best for: Scale, but requires dev capability      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                        [ Continue → ]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

#### Screen 4: Feature Priority Selection

**Purpose:** Show recommended features, let user prioritize.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              RECOMMENDED FEATURES                           │
│                                                             │
│  Based on: Economic Freedom + System Problem + Group        │
│                                                             │
│  We recommend these feature priorities:                     │
│                                                             │
│  MUST HAVE (MVP):                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✓ PLANNING                                          │   │
│  │   Escape roadmap, milestone tracking, action steps  │   │
│  │   Why: System problems need clear escape routes     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ✓ ACCOUNTABILITY                                    │   │
│  │   Check-ins, group calls, progress sharing          │   │
│  │   Why: Group delivery needs community structure     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ✓ COMMUNITY                                         │   │
│  │   Member forum, peer support, shared wins           │   │
│  │   Why: Explorers thrive with fellow travelers       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  SHOULD HAVE (Phase 2):                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ □ ANALYSIS - Current situation assessment           │   │
│  │ □ LEARNING - Educational modules, tutorials         │   │
│  │ □ AUTOMATION - Templates, workflows, shortcuts      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  COULD HAVE (Phase 3):                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ □ MATCHING - Mentor pairing, accountability buddies │   │
│  │ □ TRACKING - Progress metrics, streak tracking      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [ Customize priorities ]              [ Continue → ]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Customize modal:** Drag-and-drop to reprioritize features.

---

#### Screen 5: MVP Feature Specification

**Purpose:** Turn priorities into specific features for the MVP.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              YOUR MVP FEATURES                              │
│                                                             │
│  Let's specify exactly what you'll build first:             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📋 PLANNING                                         │   │
│  │                                                     │   │
│  │ Which planning features will you include?           │   │
│  │                                                     │   │
│  │ ☑ Step-by-step escape roadmap                       │   │
│  │ ☑ Weekly milestone tracker                          │   │
│  │ ☑ Action item checklists                            │   │
│  │ ☐ Scenario planning tool                            │   │
│  │ ☐ Timeline visualization                            │   │
│  │                                                     │   │
│  │ [ + Add custom feature ]                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👥 ACCOUNTABILITY                                   │   │
│  │                                                     │   │
│  │ Which accountability features will you include?     │   │
│  │                                                     │   │
│  │ ☑ Weekly group coaching calls                       │   │
│  │ ☑ Check-in prompts (daily/weekly)                   │   │
│  │ ☑ Progress sharing in community                     │   │
│  │ ☐ 1:1 hot seat sessions                             │   │
│  │ ☐ Accountability buddy matching                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🤝 COMMUNITY                                        │   │
│  │                                                     │   │
│  │ Which community features will you include?          │   │
│  │                                                     │   │
│  │ ☑ Private member forum/chat                         │   │
│  │ ☑ Win sharing channel                               │   │
│  │ ☐ Resource library                                  │   │
│  │ ☐ Expert Q&A sessions                               │   │
│  │ ☐ Member directory                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                        [ Continue → ]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

#### Screen 6: Tech Stack Recommendations

**Purpose:** Suggest tools/platforms to build with (based on delivery method + features).

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              RECOMMENDED TECH STACK                         │
│                                                             │
│  Based on your choices, here's how to build this:           │
│                                                             │
│  DELIVERY: Group Coaching Program                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🏠 PLATFORM OPTIONS                                 │   │
│  │                                                     │   │
│  │ RECOMMENDED: Skool                                  │   │
│  │ • Community + courses in one                        │   │
│  │ • Built-in gamification                             │   │
│  │ • $99/month                                         │   │
│  │                                                     │   │
│  │ ALTERNATIVES:                                       │   │
│  │ • Circle - More customizable community              │   │
│  │ • Kajabi - All-in-one but pricier                   │   │
│  │ • Mighty Networks - Good for courses + community    │   │
│  │ • DIY (Notion + Discord) - Cheapest, most work      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📹 CALLS & SESSIONS                                 │   │
│  │                                                     │   │
│  │ RECOMMENDED: Zoom                                   │   │
│  │ • Industry standard, reliable                       │   │
│  │ • Recording + breakout rooms                        │   │
│  │ • $150/year                                         │   │
│  │                                                     │   │
│  │ ALTERNATIVES:                                       │   │
│  │ • Google Meet - Free, basic                         │   │
│  │ • Riverside - Better recording quality              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💰 PAYMENTS                                         │   │
│  │                                                     │   │
│  │ RECOMMENDED: Stripe                                 │   │
│  │ • Most widely used, reliable                        │   │
│  │ • 2.9% + $0.30 per transaction                      │   │
│  │                                                     │   │
│  │ ALTERNATIVES:                                       │   │
│  │ • Platform built-in (Skool, Kajabi)                 │   │
│  │ • PayPal - Higher fees, wider reach                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Monthly tech cost estimate: ~$120-200/month               │
│                                                             │
│                                        [ Continue → ]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

#### Screen 7: Blueprint Summary

**Purpose:** Show complete blueprint, option to save/export/continue to Offer Builder.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              YOUR PRODUCT BLUEPRINT                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  "90-DAY BUSINESS ESCAPE PLAN"                      │   │
│  │  Group Coaching Program                             │   │
│  │                                                     │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                                                     │   │
│  │  TARGET CUSTOMER:                                   │   │
│  │  Struggling Explorers trapped in 9-5 jobs          │   │
│  │  seeking time and location freedom                  │   │
│  │                                                     │   │
│  │  PROBLEM SOLVED:                                    │   │
│  │  System trap in Economic Freedom domain             │   │
│  │  "My job won't let me build what I want"            │   │
│  │                                                     │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                                                     │   │
│  │  MVP FEATURES:                                      │   │
│  │                                                     │   │
│  │  📋 Planning                                        │   │
│  │     • Step-by-step escape roadmap                   │   │
│  │     • Weekly milestone tracker                      │   │
│  │     • Action item checklists                        │   │
│  │                                                     │   │
│  │  👥 Accountability                                  │   │
│  │     • Weekly group coaching calls                   │   │
│  │     • Check-in prompts                              │   │
│  │     • Progress sharing                              │   │
│  │                                                     │   │
│  │  🤝 Community                                       │   │
│  │     • Private member forum                          │   │
│  │     • Win sharing channel                           │   │
│  │                                                     │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                                                     │   │
│  │  TECH STACK:                                        │   │
│  │  • Platform: Skool ($99/mo)                         │   │
│  │  • Calls: Zoom ($13/mo)                             │   │
│  │  • Payments: Stripe (2.9%)                          │   │
│  │                                                     │   │
│  │  Est. monthly cost: ~$120                           │   │
│  │                                                     │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                                                     │   │
│  │  PHASE 2 FEATURES:                                  │   │
│  │  • Current situation assessment tool                │   │
│  │  • Educational modules                              │   │
│  │  • Template/resource library                        │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Save to      │  │  Export as   │  │ Continue to  │      │
│  │ Library      │  │  PDF         │  │ Offer Builder│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Data Flow

```
                    ┌─────────────────┐
                    │ competence_wheels│
                    │ (existing data) │
                    └────────┬────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   PRODUCT BLUEPRINT FLOW                    │
│                                                             │
│  Screen 1: Wheel Summary (read from competence_wheels)      │
│  Screen 2: Problem Type (new input → problem_type)          │
│  Screen 3: Delivery Method (new input → delivery_method)    │
│  Screen 4: Feature Priorities (computed + customized)       │
│  Screen 5: MVP Features (user selection)                    │
│  Screen 6: Tech Stack (computed recommendations)            │
│  Screen 7: Blueprint Summary (aggregated output)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │product_blueprints│
                    │ (new table)     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │  Offer   │   │ Library  │   │Validation│
       │ Builder  │   │    of    │   │   Flow   │
       │          │   │ Answers  │   │          │
       └──────────┘   └──────────┘   └──────────┘
```

---

### Database Schema

```sql
CREATE TABLE product_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES user_projects(id),

  -- Input data
  problem_domain TEXT NOT NULL,        -- From Problem Wheel
  problem_type TEXT NOT NULL,          -- Access/Knowledge/Capability/Motivation/Connection/System
  persona_psychographic TEXT NOT NULL, -- From Persona Wheel
  persona_journey TEXT NOT NULL,       -- Awakening/Struggling/Ready
  delivery_method TEXT NOT NULL,       -- Content/Group/1:1/Done-for/Software

  -- Computed/selected features
  mvp_features JSONB NOT NULL,         -- Array of selected MVP features
  phase2_features JSONB,               -- Array of Phase 2 features
  phase3_features JSONB,               -- Array of Phase 3 features
  custom_features JSONB,               -- User-added custom features

  -- Tech stack
  tech_stack JSONB NOT NULL,           -- Recommended platforms/tools
  estimated_monthly_cost DECIMAL,      -- Calculated cost

  -- Metadata
  blueprint_name TEXT,                 -- User-defined name
  status TEXT DEFAULT 'draft',         -- draft/active/archived
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_blueprints_user_project ON product_blueprints(user_id, project_id);
```

---

### Component Structure

```
src/flows/ProductBlueprint/
├── ProductBlueprintFlow.jsx       # Main flow orchestrator
├── WheelSummary.jsx               # Screen 1: Show wheels
├── ProblemTypeSelector.jsx        # Screen 2: Problem type selection
├── DeliveryMethodSelector.jsx     # Screen 3: How you'll deliver
├── FeaturePrioritizer.jsx         # Screen 4: Feature priorities
├── MVPFeatureSelector.jsx         # Screen 5: Specific feature selection
├── TechStackRecommender.jsx       # Screen 6: Tech recommendations
├── BlueprintSummary.jsx           # Screen 7: Final blueprint
├── BlueprintExport.jsx            # PDF/save functionality
└── index.js

src/lib/
├── featureMatrix.js               # Problem → Feature mapping logic
├── techStackRecommendations.js    # Delivery → Tech stack logic
└── blueprintGenerator.js          # Blueprint computation utilities
```

---

### Feature Matrix Logic (featureMatrix.js)

```javascript
// Problem Type → Priority Features
const PROBLEM_TYPE_FEATURES = {
  access: ['matching', 'community', 'discovery'],
  knowledge: ['learning', 'analysis', 'content'],
  capability: ['learning', 'tracking', 'accountability', 'practice'],
  motivation: ['accountability', 'community', 'tracking', 'gamification'],
  connection: ['matching', 'communication', 'community', 'events'],
  system: ['planning', 'analysis', 'automation', 'accountability'],
};

// Problem Domain → Core Features
const DOMAIN_FEATURES = {
  physical_vitality: ['tracking', 'analysis', 'accountability'],
  mental_wellbeing: ['tracking', 'learning', 'accountability'],
  personal_mastery: ['learning', 'tracking', 'community'],
  intimate_bonds: ['communication', 'planning', 'tracking'],
  service_care: ['planning', 'communication', 'matching'],
  creative_expression: ['creation', 'community', 'matching'],
  local_impact: ['communication', 'planning', 'community'],
  cultural_movements: ['community', 'communication', 'creation'],
  economic_freedom: ['analysis', 'planning', 'learning', 'automation'],
  social_justice: ['community', 'communication', 'matching'],
  planetary_health: ['tracking', 'community', 'analysis'],
  human_progress: ['learning', 'creation', 'community', 'analysis'],
};

// Delivery Method → Feature modifiers
const DELIVERY_FEATURES = {
  content: ['learning', 'automation', 'tracking'],
  group: ['community', 'accountability', 'communication'],
  '1:1': ['accountability', 'planning', 'analysis'],
  'done-for': ['automation', 'analysis', 'communication'],
  software: ['tracking', 'analysis', 'automation', 'matching'],
};

// Persona Psychographic → Feature preferences
const PERSONA_FEATURES = {
  seekers: ['discovery', 'analysis', 'planning'],
  builders: ['creation', 'planning', 'tracking'],
  healers: ['accountability', 'community', 'tracking'],
  teachers: ['learning', 'content', 'community'],
  connectors: ['community', 'matching', 'communication'],
  achievers: ['tracking', 'analysis', 'gamification'],
  explorers: ['discovery', 'community', 'creation'],
  visionaries: ['planning', 'creation', 'communication'],
  protectors: ['tracking', 'analysis', 'automation'],
  creators: ['creation', 'community', 'matching'],
  nurturers: ['community', 'communication', 'tracking'],
  challengers: ['community', 'communication', 'content'],
};

export function computeFeaturePriorities(wheelData, inputs) {
  const { problemDomain, problemType, deliveryMethod, personaPsychographic } = inputs;

  // Merge all feature arrays with weighting
  const featureScores = {};

  // Weight: Domain features (base)
  DOMAIN_FEATURES[problemDomain]?.forEach((f, i) => {
    featureScores[f] = (featureScores[f] || 0) + (3 - i) * 3; // Higher weight
  });

  // Weight: Problem type features (high priority)
  PROBLEM_TYPE_FEATURES[problemType]?.forEach((f, i) => {
    featureScores[f] = (featureScores[f] || 0) + (3 - i) * 4; // Highest weight
  });

  // Weight: Delivery method features
  DELIVERY_FEATURES[deliveryMethod]?.forEach((f, i) => {
    featureScores[f] = (featureScores[f] || 0) + (3 - i) * 2;
  });

  // Weight: Persona preferences
  PERSONA_FEATURES[personaPsychographic]?.forEach((f, i) => {
    featureScores[f] = (featureScores[f] || 0) + (3 - i) * 1;
  });

  // Sort by score
  const sorted = Object.entries(featureScores)
    .sort(([, a], [, b]) => b - a)
    .map(([feature]) => feature);

  return {
    mvp: sorted.slice(0, 3),      // Top 3
    phase2: sorted.slice(3, 6),   // Next 3
    phase3: sorted.slice(6, 9),   // Remaining
  };
}
```

---

### Tech Stack Recommendations Logic

```javascript
const TECH_STACKS = {
  group: {
    platform: [
      { name: 'Skool', cost: 99, features: ['community', 'courses', 'gamification'], recommended: true },
      { name: 'Circle', cost: 89, features: ['community', 'events', 'customization'] },
      { name: 'Mighty Networks', cost: 99, features: ['community', 'courses', 'app'] },
      { name: 'Kajabi', cost: 149, features: ['all-in-one', 'courses', 'email'] },
    ],
    calls: [
      { name: 'Zoom', cost: 13, features: ['recording', 'breakouts'], recommended: true },
      { name: 'Google Meet', cost: 0, features: ['basic', 'free'] },
    ],
    payments: [
      { name: 'Stripe', cost: '2.9%', recommended: true },
      { name: 'Platform built-in', cost: 'varies' },
    ],
  },
  content: {
    platform: [
      { name: 'Teachable', cost: 59, features: ['courses', 'quizzes'], recommended: true },
      { name: 'Thinkific', cost: 49, features: ['courses', 'communities'] },
      { name: 'Podia', cost: 39, features: ['courses', 'downloads', 'email'] },
    ],
    // ... etc
  },
  // ... other delivery methods
};

export function getTechRecommendations(deliveryMethod, mvpFeatures) {
  const stack = TECH_STACKS[deliveryMethod] || TECH_STACKS.group;

  // Filter/rank based on MVP features needed
  // Return top recommendations with reasons
  return {
    platform: stack.platform[0],
    alternatives: stack.platform.slice(1),
    calls: stack.calls?.[0],
    payments: stack.payments?.[0],
    estimatedMonthlyCost: calculateCost(stack),
  };
}
```

---

### Integration Points

#### → Offer Builder

```javascript
// When user clicks "Continue to Offer Builder"
const blueprintData = {
  targetCustomer: `${persona.journey} ${persona.psychographic}`,
  problemSolved: `${problem.type} in ${problem.domain}`,
  deliveryMethod: blueprint.deliveryMethod,
  mvpFeatures: blueprint.mvpFeatures,
  suggestedPrice: calculatePrice(persona.journey, blueprint.deliveryMethod),
};

navigate('/offer-builder', { state: { prefill: blueprintData } });
```

#### → Validation Flow

```javascript
// Generate validation questions from blueprint
const validationQuestions = [
  {
    question: `What's your biggest challenge with ${problem.domain}?`,
    options: PROBLEM_TYPES.map(type => ({
      label: type.label,
      value: type.id,
      validatesSegment: type.id === blueprint.problemType,
    })),
  },
  {
    question: "Where are you in your journey?",
    options: JOURNEY_STAGES.map(stage => ({
      label: stage.label,
      value: stage.id,
      validatesSegment: stage.id === blueprint.personaJourney,
    })),
  },
  // ... etc
];
```

#### → Challenge Quests

```javascript
// Stage 2 quest integration
const stage2Quests = [
  {
    id: 'complete-product-blueprint',
    title: 'Create Your Product Blueprint',
    type: 'Product',
    route: '/product-blueprint',
    completionCheck: () => hasCompletedBlueprint(userId, projectId),
  },
];
```

---

### Open Questions (Blueprint Flow)

1. Should we allow multiple blueprints per project (for different offers)?
2. How detailed should tech stack recommendations be? (just platforms vs full setup guides)
3. Should there be a "quick mode" that skips customization and generates best-guess blueprint?
4. Integration with actual build tools (e.g., "Set up Skool account" button)?
5. Should blueprints evolve based on validation feedback?

---

## AI Co-Founder Vision

### The Big Picture

FindMyFlow evolves from a **guided discovery tool** into an **AI co-founder** that:
1. Deeply understands YOU (wheels, preferences, skills, energy)
2. Deeply understands YOUR CUSTOMERS (validated persona, journey stage, problems)
3. Deeply understands YOUR PRODUCT (blueprint, features, tech stack)
4. Can ACT on that understanding (generate specs, suggest improvements, help build)

### Data Captured → AI Intelligence

Every piece of data we capture powers the AI co-founder:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AI CO-FOUNDER KNOWLEDGE BASE                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ABOUT YOU (Founder DNA):                                           │
│  ├── Problem Wheel → What you care about solving                    │
│  ├── Skills Wheel → What you can deliver (and maturity)             │
│  ├── Persona Wheel → Who you connect with naturally                 │
│  ├── Energy Source → What energizes vs drains you                   │
│  ├── Flow Compass history → When you're in flow vs stuck            │
│  ├── Groan reflections → Your fears and protective patterns         │
│  └── Nervous System data → Your boundaries and triggers             │
│                                                                     │
│  ABOUT YOUR CUSTOMERS (Market DNA):                                 │
│  ├── Validation responses → What they actually said                 │
│  ├── Persona refinements → Who they really are                      │
│  ├── Journey stage data → Where they are in awareness               │
│  ├── Problem type confirmation → What's actually blocking them      │
│  └── Engagement preferences → How they want to be helped            │
│                                                                     │
│  ABOUT YOUR PRODUCT (Build DNA):                                    │
│  ├── Product Blueprint → Features, priorities, phases               │
│  ├── Tech stack choices → What you're building with                 │
│  ├── Offer structure → Pricing, delivery, promise                   │
│  ├── Funnel metrics → What's working, what isn't                    │
│  └── Content history → Your voice, messaging, what resonates        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### AI Co-Founder Capabilities

#### Level 1: Advisor (Current Zarlo)
- Answer questions based on context
- Suggest next actions
- Provide encouragement and accountability

#### Level 2: Strategist (Near-term)
- Generate strategic recommendations from wheel data
- Identify gaps and opportunities
- Create weekly focus plans

#### Level 3: Spec Writer (Product Blueprint output)
- Generate product requirement documents
- Create user stories from persona + features
- Write technical specifications

```
Based on your Product Blueprint, here's your MVP spec:

## User Stories

### Epic: Escape Roadmap
As a Struggling Explorer trapped in a 9-5,
I want to see a clear step-by-step path to freedom,
So that I know exactly what to do each week.

Acceptance Criteria:
- [ ] User sees 12-week roadmap on dashboard
- [ ] Each week has 3-5 action items
- [ ] Progress bar shows completion percentage
- [ ] Milestone celebrations at weeks 4, 8, 12

### Epic: Weekly Check-ins
As a member of the coaching program,
I want weekly prompts to reflect on my progress,
So that I stay accountable and don't fall behind.

Acceptance Criteria:
- [ ] Push notification every Sunday at 6pm
- [ ] 5-question reflection form
- [ ] Progress shared to community (opt-in)
- [ ] Coach can see all check-ins in dashboard
```

#### Level 4: Build Partner (Future)
- Generate actual code from specs
- Create content from voice profile + wheel data
- Build landing pages, email sequences, course outlines
- Integrate with no-code tools (Skool, Kajabi, etc.)

### The Spec Generation Flow

```
┌─────────────────┐
│ Product         │
│ Blueprint       │
│ (features)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ AI Spec         │────▶│ Technical       │
│ Generator       │     │ Requirements    │
└────────┬────────┘     └─────────────────┘
         │
         ├──────────────────────────────────┐
         ▼                                  ▼
┌─────────────────┐              ┌─────────────────┐
│ User Stories    │              │ Content Brief   │
│ (PRD format)    │              │ (copy, emails)  │
└─────────────────┘              └─────────────────┘
         │                                  │
         ▼                                  ▼
┌─────────────────┐              ┌─────────────────┐
│ Implementation  │              │ Content         │
│ Tasks           │              │ Generation      │
│ (dev handoff)   │              │ (AI-assisted)   │
└─────────────────┘              └─────────────────┘
```

### Spec Document Structure (Generated)

```markdown
# [Product Name] MVP Specification
Generated: [Date]
Based on: Product Blueprint v1.0

## 1. Overview
- **Target Customer:** [From Persona Wheel]
- **Problem Solved:** [From Problem Wheel]
- **Core Promise:** [From Offer Builder]
- **Delivery Method:** [From Blueprint]

## 2. User Personas
### Primary: [Psychographic] in [Journey Stage]
- **Motivation:** [From persona data]
- **Fears:** [From persona data]
- **Goals:** [Inferred from problem type]

## 3. Feature Specifications

### 3.1 [Feature Category 1: e.g., Planning]
**Priority:** MVP
**User Stories:**
- As a [persona], I want [capability], so that [outcome]
- ...

**Functional Requirements:**
- FR-001: System shall display [X]
- FR-002: User shall be able to [Y]
- ...

**UI/UX Notes:**
- Based on [persona psychographic], emphasize [X]
- Avoid [language/patterns] that conflict with [fears]

### 3.2 [Feature Category 2: e.g., Accountability]
...

## 4. Technical Requirements
- **Platform:** [From tech stack]
- **Integrations:** [Inferred from features]
- **Data Model:** [Generated from features]

## 5. Content Requirements
- **Tone:** [From Voice Profile / Persona match]
- **Key Messages:** [From problem + persona]
- **Email Sequences:** [Outline based on journey stage]

## 6. Success Metrics
- [KPIs based on funnel calculator data]
- [Validation metrics from surveys]

## 7. Implementation Phases
- **Phase 1 (MVP):** [From blueprint]
- **Phase 2:** [From blueprint]
- **Phase 3:** [From blueprint]
```

### Integration with Voice DNA

If user has completed Voice Training:

```javascript
const specContext = {
  // From wheels
  problem: 'Economic Freedom - System Problem',
  persona: 'Struggling Explorers',

  // From Voice DNA
  voiceProfile: {
    tone: 'encouraging but direct',
    vocabulary: ['freedom', 'escape', 'build', 'control'],
    avoidWords: ['safe', 'secure', 'stable'],
    sentenceStyle: 'short, punchy, action-oriented',
  },

  // AI generates content that matches voice
  generateWelcomeEmail: () => {
    // Uses voiceProfile to write in user's authentic voice
    // Uses persona data to hit emotional triggers
    // Uses journey stage to calibrate awareness level
  }
};
```

### Future: AI-Assisted Building

```
USER: "Help me set up my community on Skool"

AI CO-FOUNDER:
Based on your Product Blueprint, here's your Skool setup:

1. COMMUNITY STRUCTURE
   ├── #introductions (Struggling Explorers love seeing others like them)
   ├── #wins (Core to Explorer motivation - freedom stories)
   ├── #weekly-checkins (Your accountability feature)
   ├── #resources (For Phase 2 template library)
   └── #ask-[your-name] (Direct access builds trust)

2. CLASSROOM STRUCTURE
   ├── Week 1-4: Foundation (Assessment → First Steps)
   ├── Week 5-8: Building (Core Escape Actions)
   └── Week 9-12: Launch (Go Live Steps)

3. GAMIFICATION SETTINGS
   Based on Achiever traits in your secondary persona:
   - Enable points for engagement
   - Weekly leaderboard (optional)
   - Milestone badges at weeks 4, 8, 12

Want me to generate the welcome post for #introductions in your voice?
```

### Data → Intelligence → Action Loop

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   CAPTURE              UNDERSTAND           ACT                      │
│                                                                      │
│   Flow Finder    →     Wheels         →     Blueprint               │
│   Validation     →     Refined Data   →     Spec Generation         │
│   Voice Training →     Voice Profile  →     Content Generation      │
│   Funnel Metrics →     Performance    →     Optimization Suggestions│
│   Groan Logs     →     Founder Health →     Protective Prompts      │
│                                                                      │
│   ↑                                                           │     │
│   └───────────────────── FEEDBACK LOOP ───────────────────────┘     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Why This Matters

Traditional approach:
1. Founder has idea
2. Founder talks to customers (maybe)
3. Founder guesses features
4. Developer builds (expensive)
5. Product fails (no validation)
6. Repeat

FindMyFlow AI Co-Founder approach:
1. Founder discovers self (wheels)
2. Founder validates with customers (data)
3. AI generates optimal features (blueprint)
4. AI writes spec (documentation)
5. AI assists build (generation)
6. AI optimizes based on metrics (iteration)

**The more data captured upfront, the smarter the AI co-founder becomes.**

---

## BuildWithAI Integration (Future Vision)

### The Ultimate Output

All the data we capture (Three DNAs, Wheels, Blueprint) can generate a **complete tech spec** that users take to AI coding tools to build their first version.

**The vision:** A user completes FindMyFlow's discovery process, and we generate a customized starting prompt so their v1 is as accurate and functional as possible from the start.

### The BuildWithAI Spec Template

This is the prompt structure users would receive, pre-populated with their data:

```markdown
I want to build a web application. Here's my complete spec:

# [App Name] - Spec Sheet

## Layer 1: Product Spec

### Problem It Solves
[Auto-filled from Problem Wheel + Problem Type]
"Helps [Persona Psychographic] in [Journey Stage] overcome [Problem Type]
in the [Problem Domain] space."

### Users
[Auto-filled from Persona Wheel]
"[Aspirational Title]: [Psychographic description] who are [Journey Stage]
and prefer [Engagement Depth] solutions."

### Success Metric
[Auto-filled from Blueprint MVP features]
"Users should be able to [core action from top MVP feature]"

### Core Prompt
[If AI-powered: Generated from Voice Profile + Persona + Problem]
"You are a [role based on user's aspirational title] helping [persona]
with [problem]. Speak in [voice characteristics]. Focus on [key outcomes]."

### UI & Flow
[Auto-filled from Product Blueprint screens]
Step 1: [From Blueprint - e.g., "User completes assessment"]
Step 2: [From Blueprint - e.g., "See personalized roadmap"]
Step 3: [From Blueprint - e.g., "Track weekly milestones"]
Step 4: [From Blueprint - e.g., "Join community discussion"]
Step 5: [From Blueprint - e.g., "Celebrate completion"]

### Design Style
[Based on Persona Psychographic preferences]
- Explorers: Open, airy, freedom-evoking
- Achievers: Bold, status-signaling, premium
- Healers: Soft, nurturing, safe
[Include suggested colors, typography]

### Test Data Example
[Generated from user's own journey as example]
"A [persona] named [example name] who wants to [goal]. They're currently
[current state] and want to achieve [outcome]."

---

## Layer 2: Technical Spec

### Data Model
[Auto-generated from MVP features]
| Table | Columns |
|-------|--------|
| users | id, email, created_at, persona_type, journey_stage |
| [feature_1_table] | [columns based on feature needs] |
| [feature_2_table] | [columns based on feature needs] |

### Pages/Routes
[Auto-generated from Blueprint flow]
| Page | What's on it |
|------|-------------|
| / | Landing + signup |
| /onboarding | [From Blueprint Step 1] |
| /dashboard | [From Blueprint core view] |
| /[feature] | [Each MVP feature gets a route] |

### Auth Requirements
[Based on Engagement Depth]
- DIY products: Simple email signup
- Guided products: Full auth + profiles
- Done-With: Admin dashboard + client portal

### Integrations
[Auto-suggested from Tech Stack recommendations]
| Service | What for | API key needed? |
|---------|----------|----------------|
| Supabase | Database + Auth | Yes |
| [Platform from Blueprint] | [Purpose] | [Yes/No] |
| Stripe | Payments | Yes (if paid) |

### Environment Variables
[Auto-listed based on integrations]
SUPABASE_URL=
SUPABASE_ANON_KEY=
[Additional based on tech stack]

---

Build a complete working first version of this app...
```

### How Data Maps to Spec

| FindMyFlow Data | Spec Field | Example |
|-----------------|------------|---------|
| Problem Wheel (domain) | Problem It Solves | "Economic Freedom" |
| Problem Wheel (type) | Problem Type | "System trap" |
| Persona Wheel (psychographic) | Users | "Explorers" |
| Persona Wheel (journey) | User State | "Struggling" |
| Product Blueprint (MVP features) | UI & Flow | "Roadmap, Check-ins, Community" |
| Product Blueprint (tech stack) | Integrations | "Skool, Zoom, Stripe" |
| Voice Profile | Core Prompt tone | "Direct, action-oriented" |
| Aspirational Titles | App personality | "The Liberator" |

### Pre-Population Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FINDMYFLOW DISCOVERY                             │
│                                                                     │
│  Flow Finder → Wheels → Blueprint → Offer Builder → Voice Training │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SPEC GENERATOR                                   │
│                                                                     │
│  Pulls from:                                                        │
│  • Founder DNA (skills, energy, voice)                              │
│  • Market DNA (validated persona, journey, problems)                │
│  • Build DNA (features, tech stack, pricing)                        │
│                                                                     │
│  Generates:                                                         │
│  • Complete Product Spec (Layer 1)                                  │
│  • Complete Technical Spec (Layer 2)                                │
│  • Customized AI prompts                                            │
│  • Test data based on real user examples                            │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BUILDWITHAI OUTPUT                               │
│                                                                     │
│  User receives:                                                     │
│  • Pre-filled spec sheet (copy-paste ready)                         │
│  • Customized Claude/GPT prompt                                     │
│  • Suggested folder structure                                       │
│  • Database schema SQL                                              │
│  • Example .env file                                                │
│                                                                     │
│  User takes to:                                                     │
│  • Claude Code / Cursor / Replit                                    │
│  • Gets working v1 in hours, not weeks                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Example: Your Spec (Based on Earlier Example)

If you completed FindMyFlow with your "Business Building for 9-5 escapees" answers:

```markdown
# EscapePlan - Spec Sheet

## Layer 1: Product Spec

### Problem It Solves
Helps Explorers who are Struggling overcome System traps in the
Economic Freedom space. They're stuck in 9-5 jobs and want time
and location freedom but don't have a clear escape route.

### Users
The Liberators: Freedom-seeking professionals who are actively trying
to escape their 9-5 but hitting walls. They prefer Guided solutions
(courses, coaching) over DIY or Done-For-You.

### Success Metric
Users should be able to see their complete 90-day escape roadmap
and track weekly progress toward their first $1k outside their job.

### Core Prompt
"You are The Strategic Liberator - a coach who helps trapped
professionals escape the 9-5. Speak directly and action-oriented.
Focus on practical next steps, not theory. Celebrate small wins.
Avoid words like 'safe', 'secure', 'stable' - your users are
seeking freedom, not safety."

### UI & Flow
Step 1: User completes "Escape Assessment" (current situation)
Step 2: See personalized 90-day Escape Roadmap
Step 3: Complete weekly milestones with check-ins
Step 4: Share wins and get support in community
Step 5: Celebrate first income milestone

### Design Style
Explorer-optimized:
- Colors: Deep teal (#0D9488), warm amber (#F59E0B), white space
- Typography: Clean, modern, open (Inter or similar)
- Feel: Expansive, possibility-focused, action-oriented
- Imagery: Open roads, horizons, movement

### Test Data Example
"Sarah, a 34-year-old marketing manager at a Fortune 500 company.
She's been in her role for 6 years, earns $95k, but feels trapped.
She's tried starting a side business twice but keeps stalling at
the 'what to sell' stage. She's Struggling but Ready to invest
in guidance."

---

## Layer 2: Technical Spec

### Data Model
| Table | Columns |
|-------|--------|
| users | id, email, name, created_at, assessment_completed |
| assessments | id, user_id, current_income, desired_income, escape_timeline, biggest_blocker |
| roadmaps | id, user_id, generated_at, milestones (jsonb) |
| milestones | id, roadmap_id, week_number, title, tasks (jsonb), completed_at |
| checkins | id, user_id, milestone_id, reflection, wins, blockers, created_at |
| community_posts | id, user_id, type (win/question/support), content, created_at |

### Pages/Routes
| Page | What's on it |
|------|-------------|
| / | Landing page with escape quiz CTA |
| /assessment | 5-question escape assessment |
| /roadmap | Personalized 90-day plan |
| /week/[n] | Weekly milestone detail + tasks |
| /checkin | Weekly reflection form |
| /community | Win sharing + support forum |
| /profile | Progress stats + settings |

### Auth Requirements
- Email/password signup (Supabase Auth)
- Users can only see their own roadmap/checkins
- Community posts visible to all authenticated users
- No admin dashboard for MVP

### Integrations
| Service | What for | API key needed? |
|---------|----------|----------------|
| Supabase | Database + Auth | Yes |
| OpenAI | Roadmap generation | Yes |
| Resend | Email notifications | Yes |

### Environment Variables
SUPABASE_URL=
SUPABASE_ANON_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
```

### Why This Matters

**Traditional approach:**
1. User has idea
2. User tries to explain to developer
3. Lost in translation
4. Multiple iterations
5. Months later, maybe something works

**FindMyFlow → BuildWithAI approach:**
1. User discovers self (guided, structured)
2. User validates with customers (data-backed)
3. User gets complete spec (auto-generated)
4. User pastes to AI coding tool
5. Working v1 in hours

**The spec isn't guessed—it's derived from validated data.**

### Implementation Notes

The spec generator would be:
- A new Edge Function: `generate-build-spec`
- Pulls from all three DNA sources
- Uses templates with variable replacement
- Outputs markdown (copy-paste ready)
- Optional: Direct export to Claude Code format

```javascript
// generate-build-spec/index.ts
export async function generateBuildSpec(userId: string, projectId: string) {
  // Gather all DNA
  const founderDNA = await getFounderDNA(userId);
  const marketDNA = await getMarketDNA(userId, projectId);
  const buildDNA = await getBuildDNA(userId, projectId);

  // Generate spec from template
  const spec = populateSpecTemplate({
    problemDomain: founderDNA.problemWheel.primarySegment,
    problemType: buildDNA.blueprint.problemType,
    persona: marketDNA.validatedPersona,
    features: buildDNA.blueprint.mvpFeatures,
    techStack: buildDNA.blueprint.techStack,
    voiceProfile: founderDNA.voiceProfile,
    // ... etc
  });

  return spec;
}
```

---

## Implementation Guide

### Phase 0: Foundation (Week 1)

**Goal:** Establish the taxonomy and data structures before touching UI.

#### 0.1 Create Taxonomy Constants

```javascript
// src/lib/wheelTaxonomy.js

export const SKILLS_SEGMENTS = [
  {
    id: 'clarifying',
    displayName: 'Clarifying',
    aspirationalTitle: 'The Translator',
    tagline: 'You make the complex simple',
    keywords: ['explain', 'teach', 'simplify', 'translate', 'communicate'],
    color: '#FF6B6B', // Position 1 on rainbow
    icon: '💡',
  },
  {
    id: 'analyzing',
    displayName: 'Analyzing',
    aspirationalTitle: 'The Pattern Spotter',
    tagline: 'You see what others miss',
    keywords: ['data', 'patterns', 'logic', 'debug', 'diagnose', 'research'],
    color: '#FF8E53', // Position 2
    icon: '📊',
  },
  // ... all 12
];

export const PROBLEM_SEGMENTS = [/* ... 12 segments */];
export const PERSONA_SEGMENTS = [/* ... 12 segments */];

export const PROBLEM_TYPES = [
  { id: 'access', label: 'Access', description: "They can't find what they need" },
  { id: 'knowledge', label: 'Knowledge', description: "They don't know how" },
  { id: 'capability', label: 'Capability', description: "They lack the skills" },
  { id: 'motivation', label: 'Motivation', description: "They can't make themselves do it" },
  { id: 'connection', label: 'Connection', description: "They're isolated" },
  { id: 'system', label: 'System', description: "They're trapped by structures" },
];

export const JOURNEY_STAGES = [
  { id: 'awakening', label: 'Awakening', ring: 'inner' },
  { id: 'struggling', label: 'Struggling', ring: 'middle' },
  { id: 'ready', label: 'Ready', ring: 'outer' },
];

export const SKILL_MATURITY = [
  { id: 'emerging', label: 'Emerging', ring: 'inner' },
  { id: 'proficient', label: 'Proficient', ring: 'middle' },
  { id: 'mastery', label: 'Mastery', ring: 'outer' },
];
```

#### 0.2 Database Migration

```sql
-- supabase/migrations/20260108_competence_wheels.sql

-- Main wheel state table
CREATE TABLE competence_wheels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
  wheel_type TEXT NOT NULL CHECK (wheel_type IN ('problems', 'skills', 'persona')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id, wheel_type)
);

-- Individual segment states
CREATE TABLE wheel_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wheel_id UUID REFERENCES competence_wheels(id) ON DELETE CASCADE,
  segment_id TEXT NOT NULL, -- e.g., 'analyzing', 'economic_freedom'
  is_lit BOOLEAN DEFAULT FALSE,

  -- For 2D wheels
  ring TEXT, -- 'inner', 'middle', 'outer' (maturity/journey stage)
  problem_type TEXT, -- For problem wheel 2D

  -- Bonus dimensions
  energy_source TEXT, -- 'intrinsic', 'developed', 'compensated'
  engagement_depth TEXT, -- 'diy', 'guided', 'done_with'

  -- Metadata
  response_count INTEGER DEFAULT 0,
  confidence DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(wheel_id, segment_id)
);

-- Link responses to segments
CREATE TABLE segment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES wheel_segments(id) ON DELETE CASCADE,
  response_id UUID REFERENCES nikigai_responses(id) ON DELETE CASCADE,
  confidence DECIMAL DEFAULT 0.8,
  classified_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(segment_id, response_id)
);

-- Track wheel history for temporal visualization
CREATE TABLE wheel_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wheel_id UUID REFERENCES competence_wheels(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product blueprints
CREATE TABLE product_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,

  -- From wheels
  problem_domain TEXT NOT NULL,
  problem_type TEXT NOT NULL,
  persona_psychographic TEXT NOT NULL,
  persona_journey TEXT NOT NULL,

  -- User selections
  delivery_method TEXT NOT NULL,
  mvp_features JSONB NOT NULL,
  phase2_features JSONB,
  phase3_features JSONB,
  custom_features JSONB,

  -- Tech stack
  tech_stack JSONB NOT NULL,
  estimated_monthly_cost DECIMAL,

  -- Metadata
  blueprint_name TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wheels_user_project ON competence_wheels(user_id, project_id);
CREATE INDEX idx_segments_wheel ON wheel_segments(wheel_id);
CREATE INDEX idx_blueprints_user ON product_blueprints(user_id);
```

#### 0.3 Classification Edge Function

```typescript
// supabase/functions/classify-response/index.ts

import { SKILLS_SEGMENTS, PROBLEM_SEGMENTS, PERSONA_SEGMENTS } from './taxonomy.ts';

interface ClassificationResult {
  segments: Array<{
    id: string;
    confidence: number;
  }>;
  primarySegment: string;
}

export async function classifyResponse(
  response: string,
  wheelType: 'skills' | 'problems' | 'persona'
): Promise<ClassificationResult> {

  const segments = wheelType === 'skills' ? SKILLS_SEGMENTS
    : wheelType === 'problems' ? PROBLEM_SEGMENTS
    : PERSONA_SEGMENTS;

  const prompt = `
    Classify this user response into the predefined categories.

    Response: "${response}"

    Categories:
    ${segments.map(s => `- ${s.id}: ${s.keywords.join(', ')}`).join('\n')}

    Return JSON with segments array (can be 1-3 matches) and confidence scores (0-1).
    Format: { "segments": [{ "id": "analyzing", "confidence": 0.9 }] }
  `;

  const result = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307', // Fast, cheap for classification
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const parsed = JSON.parse(result.content[0].text);

  return {
    segments: parsed.segments,
    primarySegment: parsed.segments[0]?.id,
  };
}
```

---

### Phase 1: Core Wheel Visualization (Week 2-3)

**Goal:** Build the visual wheel components.

#### 1.1 Component Structure

```
src/components/CompetenceWheels/
├── WheelBase.jsx           # Shared SVG wheel structure
├── WheelSegment.jsx        # Individual segment (lit/unlit states)
├── WheelRing.jsx           # Concentric ring for 2D wheels
├── WheelTooltip.jsx        # Hover details
├── ProblemWheel.jsx        # Problem-specific wheel
├── SkillsWheel.jsx         # Skills-specific wheel
├── PersonaWheel.jsx        # Persona-specific wheel (2D)
├── WheelLegend.jsx         # Color/segment legend
├── WheelMini.jsx           # Small dashboard version
├── WheelSet.jsx            # All 3 wheels together
├── useWheelData.js         # Data fetching hook
├── wheelUtils.js           # Helper functions
├── WheelBase.css           # Shared styles
└── index.js
```

#### 1.2 SVG Wheel Component

```jsx
// src/components/CompetenceWheels/WheelBase.jsx

import { useState } from 'react';
import WheelSegment from './WheelSegment';
import WheelTooltip from './WheelTooltip';
import './WheelBase.css';

export default function WheelBase({
  segments,
  segmentData,
  size = 300,
  showLabels = true,
  onSegmentClick,
  rings = 1, // 1 for simple, 3 for 2D wheels
}) {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const center = size / 2;
  const outerRadius = (size / 2) - 20;
  const segmentAngle = 360 / segments.length;

  const getSegmentPath = (index, ringIndex = 0) => {
    const innerRadius = rings > 1
      ? outerRadius * (ringIndex / rings)
      : 0;
    const ringOuterRadius = rings > 1
      ? outerRadius * ((ringIndex + 1) / rings)
      : outerRadius;

    const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);

    const x1 = center + innerRadius * Math.cos(startAngle);
    const y1 = center + innerRadius * Math.sin(startAngle);
    const x2 = center + ringOuterRadius * Math.cos(startAngle);
    const y2 = center + ringOuterRadius * Math.sin(startAngle);
    const x3 = center + ringOuterRadius * Math.cos(endAngle);
    const y3 = center + ringOuterRadius * Math.sin(endAngle);
    const x4 = center + innerRadius * Math.cos(endAngle);
    const y4 = center + innerRadius * Math.sin(endAngle);

    const largeArc = segmentAngle > 180 ? 1 : 0;

    if (innerRadius === 0) {
      // Pie slice
      return `M ${center} ${center} L ${x2} ${y2} A ${ringOuterRadius} ${ringOuterRadius} 0 ${largeArc} 1 ${x3} ${y3} Z`;
    } else {
      // Ring segment
      return `M ${x1} ${y1} L ${x2} ${y2} A ${ringOuterRadius} ${ringOuterRadius} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1} Z`;
    }
  };

  const handleSegmentHover = (segment, event) => {
    setHoveredSegment(segment);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  return (
    <div className="wheel-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((segment, index) => (
          <WheelSegment
            key={segment.id}
            segment={segment}
            data={segmentData[segment.id]}
            path={getSegmentPath(index)}
            isLit={segmentData[segment.id]?.is_lit}
            onHover={(e) => handleSegmentHover(segment, e)}
            onLeave={() => setHoveredSegment(null)}
            onClick={() => onSegmentClick?.(segment)}
          />
        ))}

        {/* Center circle */}
        <circle cx={center} cy={center} r={20} fill="#1a1a2e" />
      </svg>

      {hoveredSegment && (
        <WheelTooltip
          segment={hoveredSegment}
          data={segmentData[hoveredSegment.id]}
          position={tooltipPosition}
        />
      )}

      {showLabels && (
        <div className="wheel-labels">
          {segments.filter(s => segmentData[s.id]?.is_lit).map(segment => (
            <div key={segment.id} className="wheel-label">
              <span className="wheel-label-icon">{segment.icon}</span>
              <span className="wheel-label-title">{segment.aspirationalTitle}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 1.3 Data Hook

```jsx
// src/components/CompetenceWheels/useWheelData.js

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function useWheelData(userId, projectId) {
  const [wheels, setWheels] = useState({
    problems: null,
    skills: null,
    persona: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWheelData() {
      try {
        // Fetch all wheels for this user/project
        const { data: wheelData, error: wheelError } = await supabase
          .from('competence_wheels')
          .select(`
            *,
            wheel_segments (*)
          `)
          .eq('user_id', userId)
          .eq('project_id', projectId);

        if (wheelError) throw wheelError;

        // Transform into lookup structure
        const transformed = {
          problems: null,
          skills: null,
          persona: null,
        };

        wheelData?.forEach(wheel => {
          const segmentLookup = {};
          wheel.wheel_segments?.forEach(seg => {
            segmentLookup[seg.segment_id] = seg;
          });
          transformed[wheel.wheel_type] = {
            ...wheel,
            segments: segmentLookup,
          };
        });

        setWheels(transformed);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    if (userId && projectId) {
      fetchWheelData();
    }
  }, [userId, projectId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const subscription = supabase
      .channel('wheel-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wheel_segments',
      }, (payload) => {
        // Refetch on changes
        fetchWheelData();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [userId, projectId]);

  return { wheels, loading, error };
}
```

---

### Phase 2: Flow Finder Integration (Week 4)

**Goal:** Modify Flow Finder to classify responses into segments.

#### 2.1 Update Flow Finder Response Handler

```jsx
// In FlowFinderSkills.jsx (and similar for Problems, Persona)

import { classifyAndSaveResponse } from '../../lib/wheelClassification';

async function handleResponseComplete(response) {
  // Existing: Save to nikigai_responses
  const { data: savedResponse } = await supabase
    .from('nikigai_responses')
    .insert({ user_id: userId, flow_type: 'skills', response })
    .select()
    .single();

  // NEW: Classify into wheel segments
  await classifyAndSaveResponse({
    userId,
    projectId,
    responseId: savedResponse.id,
    response: response,
    wheelType: 'skills',
  });
}
```

#### 2.2 Classification Helper

```javascript
// src/lib/wheelClassification.js

import { supabase } from './supabaseClient';

export async function classifyAndSaveResponse({
  userId,
  projectId,
  responseId,
  response,
  wheelType,
}) {
  // Call edge function to classify
  const { data: classification } = await supabase.functions.invoke(
    'classify-response',
    { body: { response, wheelType } }
  );

  // Ensure wheel exists
  const { data: wheel } = await supabase
    .from('competence_wheels')
    .upsert({
      user_id: userId,
      project_id: projectId,
      wheel_type: wheelType,
    }, { onConflict: 'user_id,project_id,wheel_type' })
    .select()
    .single();

  // Update segments
  for (const seg of classification.segments) {
    // Upsert segment
    const { data: segment } = await supabase
      .from('wheel_segments')
      .upsert({
        wheel_id: wheel.id,
        segment_id: seg.id,
        is_lit: true,
        response_count: 1, // Will increment
        confidence: seg.confidence,
      }, {
        onConflict: 'wheel_id,segment_id',
        // Increment response_count on conflict
      })
      .select()
      .single();

    // Link response to segment
    await supabase
      .from('segment_responses')
      .insert({
        segment_id: segment.id,
        response_id: responseId,
        confidence: seg.confidence,
      });
  }

  return classification;
}
```

---

### Phase 3: Library of Answers Integration (Week 5)

**Goal:** Display responses grouped by wheel segments.

#### 3.1 Updated Library View

```jsx
// src/pages/LibraryOfAnswers.jsx

import { useWheelData } from '../components/CompetenceWheels/useWheelData';
import { SKILLS_SEGMENTS } from '../lib/wheelTaxonomy';
import WheelSet from '../components/CompetenceWheels/WheelSet';

export default function LibraryOfAnswers() {
  const { user } = useAuth();
  const { wheels, loading } = useWheelData(user.id, currentProjectId);
  const [selectedWheel, setSelectedWheel] = useState('skills');
  const [selectedSegment, setSelectedSegment] = useState(null);

  const segments = selectedWheel === 'skills' ? SKILLS_SEGMENTS
    : selectedWheel === 'problems' ? PROBLEM_SEGMENTS
    : PERSONA_SEGMENTS;

  const wheelData = wheels[selectedWheel];

  return (
    <div className="library-container">
      {/* Wheel visualization */}
      <div className="library-wheels">
        <WheelSet
          wheels={wheels}
          onSegmentClick={(segment) => setSelectedSegment(segment)}
          activeWheel={selectedWheel}
        />

        <div className="wheel-tabs">
          <button onClick={() => setSelectedWheel('skills')}>Skills</button>
          <button onClick={() => setSelectedWheel('problems')}>Problems</button>
          <button onClick={() => setSelectedWheel('persona')}>Persona</button>
        </div>
      </div>

      {/* Segment details */}
      <div className="library-segments">
        {selectedSegment ? (
          <SegmentDetail
            segment={selectedSegment}
            data={wheelData?.segments[selectedSegment.id]}
          />
        ) : (
          <SegmentList
            segments={segments}
            segmentData={wheelData?.segments || {}}
          />
        )}
      </div>
    </div>
  );
}

function SegmentList({ segments, segmentData }) {
  const litSegments = segments.filter(s => segmentData[s.id]?.is_lit);

  return (
    <div className="segment-list">
      {litSegments.map(segment => (
        <div key={segment.id} className="segment-card">
          <div className="segment-header">
            <span className="segment-icon">{segment.icon}</span>
            <div>
              <h3>{segment.aspirationalTitle}</h3>
              <p className="segment-tagline">{segment.tagline}</p>
            </div>
          </div>
          <p className="segment-count">
            {segmentData[segment.id]?.response_count} responses
          </p>
        </div>
      ))}

      {litSegments.length === 0 && (
        <div className="empty-state">
          Complete Flow Finder to light up your wheel!
        </div>
      )}
    </div>
  );
}
```

---

### Phase 4: Product Blueprint Flow (Week 6-7)

**Goal:** Build the 7-screen blueprint flow.

See wireframes in doc above. Key components:
- `ProductBlueprintFlow.jsx` - Main orchestrator
- `ProblemTypeSelector.jsx` - Screen 2
- `DeliveryMethodSelector.jsx` - Screen 3
- `FeaturePrioritizer.jsx` - Screen 4
- `MVPFeatureSelector.jsx` - Screen 5
- `TechStackRecommender.jsx` - Screen 6
- `BlueprintSummary.jsx` - Screen 7

---

### Phase 5: BuildWithAI Spec Generator (Week 8)

**Goal:** Generate downloadable tech specs.

```typescript
// supabase/functions/generate-build-spec/index.ts

export async function generateBuildSpec(userId: string, projectId: string) {
  // Gather DNA
  const founderDNA = await getFounderDNA(userId);
  const marketDNA = await getMarketDNA(userId, projectId);
  const buildDNA = await getBuildDNA(userId, projectId);

  // Generate spec from template
  const spec = `
# ${buildDNA.blueprint.name || 'My App'} - Spec Sheet

## Layer 1: Product Spec

### Problem It Solves
Helps ${marketDNA.persona.aspirationalTitle} (${marketDNA.persona.psychographic})
who are ${marketDNA.persona.journeyStage} overcome ${buildDNA.blueprint.problemType}
problems in the ${founderDNA.problemWheel.primarySegment.displayName} space.

### Users
${marketDNA.persona.aspirationalTitle}: ${marketDNA.persona.description}
Journey stage: ${marketDNA.persona.journeyStage}
Preferred engagement: ${marketDNA.persona.engagementDepth}

### Success Metric
Users should be able to ${buildDNA.blueprint.mvpFeatures[0].successMetric}

### Core Prompt
${generateCorePrompt(founderDNA, marketDNA)}

### UI & Flow
${buildDNA.blueprint.mvpFeatures.map((f, i) =>
  `Step ${i + 1}: ${f.userAction}`
).join('\n')}

### Design Style
${getDesignStyle(marketDNA.persona.psychographic)}

---

## Layer 2: Technical Spec

### Data Model
${generateDataModel(buildDNA.blueprint.mvpFeatures)}

### Pages/Routes
${generateRoutes(buildDNA.blueprint.mvpFeatures)}

### Integrations
${generateIntegrations(buildDNA.blueprint.techStack)}

---

Build a complete working first version of this app.
`;

  return spec;
}
```

---

### Phase 6: Advanced Features (Week 9+)

- Cross-wheel alignment scoring
- Gap analysis
- Wheel history/evolution
- Zarlo integration
- Validation Flow wheel questions

---

## Additional Ideas

### 1. Gamification
- **Segment Achievements:** "The Pattern Spotter Unlocked!" when first response lands in Analyzing
- **Wheel Completion:** Progress bar showing % of segments lit
- **Combo Bonuses:** Special recognition when related segments align across wheels

### 2. Social Features
- **Shareable Wheel Profile:** Public URL showing your wheels
- **Co-Founder Matching:** Find people with complementary wheels
- **Team Composition:** See how a team's wheels overlap/complement

### 3. Temporal Visualization
- **Wheel Timeline:** Slider showing wheel state over time
- **Growth Tracking:** "You've lit 4 new segments this quarter"
- **Maturity Progression:** Animate skill moving from Emerging → Mastery

### 4. AI Enhancements
- **Segment Suggestions:** "Based on your responses, you might also be strong in [X]"
- **Gap Identification:** "Your Problem and Skills wheels don't overlap here"
- **Weekly Focus:** "This week, focus on developing [segment]"

### 5. Content Integration
- **Segment-Based Content:** Blog posts tagged to segments
- **Learning Paths:** Courses suggested based on Emerging skills
- **Case Studies:** Examples of successful people with similar wheels

---

## Open Questions (For You)

### Architecture
1. **Wheel Scope:** Should wheels be per-project or per-user?
   - Per-project: Different projects might have different focus areas
   - Per-user: Your core skills/passions don't change project-to-project

2. **Migration:** How should we handle existing users with old-style clusters?
   - Auto-migrate in background?
   - Prompt them to "upgrade" their library?
   - Grandfather old data, new system going forward?

3. **Flow Finder Changes:** Should we modify the existing flows or create new ones?
   - Modify: Faster, but might break things
   - New: Safer, but parallel systems to maintain

### Visual Design
4. **Wheel Style:** True color wheel (rainbow) or brand-colored segments?
5. **Animation:** How should segments animate when lighting up?
6. **Mobile:** How do wheels work on small screens?

### Business Logic
7. **Minimum Responses:** How many responses needed to "light" a segment?
8. **Confidence Threshold:** What confidence score is required from AI?
9. **Decay:** Should segments "dim" if not reinforced over time?

### Prioritization
10. **MVP Scope:** What's the absolute minimum for first release?
    - My suggestion: Phase 0-2 (taxonomy, database, basic wheels, Flow Finder integration)
    - Everything else iterative

---

## Recommended Build Order

| Priority | Feature | Why first |
|----------|---------|-----------|
| **P0** | Taxonomy constants | Everything builds on this |
| **P0** | Database migration | Data foundation |
| **P1** | Classification edge function | Enables segment tagging |
| **P1** | Basic wheel SVG component | Users need to SEE something |
| **P1** | Flow Finder integration | Starts populating wheels |
| **P2** | Library of Answers update | Shows segments grouped |
| **P2** | Aspirational titles display | Makes it inspiring |
| **P3** | Product Blueprint flow | Major new feature |
| **P3** | 2D wheel rings | Adds depth |
| **P4** | BuildWithAI spec generator | End-to-end vision |
| **P4** | Cross-wheel insights | Intelligence layer |
| **P5** | History/temporal | Nice to have |
| **P5** | Social features | Future expansion |

---

## Open Questions (Remaining)

1. Should segments have icons/emojis for quick recognition? *(Added above)*
2. Animation style for lighting up segments?
3. How detailed should the Validation Flow wheel questions be? (Simple vs comprehensive)
4. Wheel scope: per-project or per-user?
5. What's the MVP cutoff point?
4. What's the priority order for AI co-founder capabilities? (Advisor → Strategist → Spec Writer → Build Partner)

---

---

## Example Mapping

### Input: "Business Building for people who want time and location freedom that are currently working 9-5 jobs"

This is a real Flow Finder response. Here's how it would map to each wheel:

### Problem Space Wheel (v3.0)

**Primary segments lit:**

| Segment | Lit? | Why |
|---------|------|-----|
| **9. Economic Freedom** | ✅ YES | Core problem: trapped in 9-5, want financial independence |
| **3. Personal Mastery** | ✅ YES | They need to develop business skills they don't have |
| **7. Local Impact** | ⚪ MAYBE | If they want to leave corporate to start local business |

**Visual:**
```
           [WORLD SPHERE]
        11    12     1
          ○     ○     ○
       10 ○           ○ 2

        9 ●           ● 3    ● = LIT

        8 ○           ○ 4
          ○     ○     ○
         7     6     5
          [SELF SPHERE]
```

**Insight:** Your problem space clusters in the **Community Sphere** (Economic Freedom) with extension into **Self Sphere** (Personal Mastery). You're solving a "system trap" problem - people constrained by structures wanting liberation.

---

### Skills Wheel (v3.0)

Based on "Business Building" - what skills would YOU bring to help these people?

**Likely lit segments (hypothetical, based on typical business builder):**

| Segment | Value Created | Relevant? |
|---------|---------------|-----------|
| **3. Strategizing** | Turning goals into plans | ✅ Business planning, roadmapping |
| **5. Building** | Turning ideas into reality | ✅ Actually creating the business |
| **4. Organizing** | Turning chaos into order | ✅ Systems, automation, processes |
| **10. Influencing** | Turning minds toward action | ✅ Marketing, sales, getting clients |
| **11. Nurturing** | Turning potential into growth | ✅ Coaching, mentoring aspiring entrepreneurs |
| **1. Clarifying** | Turning confusion into understanding | ✅ Teaching business concepts |

**Visual:**
```
              CLARIFYING
            1 ●
        12 ○     ● 2

     11 ●           ● 3   STRATEGIZING
    NURTURING
     10 ●           ● 4   ORGANIZING
    INFLUENCING
        9 ○     ● 5
              BUILDING
```

**Insight:** Your skills cluster around the **BUILD-ORGANIZE-STRATEGIZE** arc (turning ideas into systems into plans) and the **INFLUENCE-NURTURE** arc (getting and growing clients). Classic entrepreneur-coach pattern.

---

### Persona Wheel (v3.0)

**Psychographic identification:**

| Type | Match? | Evidence from response |
|------|--------|------------------------|
| **7. Explorers** | ✅ PRIMARY | "time and location freedom" = Freedom is their core drive |
| **2. Builders** | ✅ SECONDARY | They want to BUILD a business |
| **6. Achievers** | ⚪ POSSIBLE | Some may be driven by success/status |

**Journey Stage:**

| Stage | Match? | Evidence |
|-------|--------|----------|
| Inner: Awakening | ⚪ | Just realized 9-5 isn't for them |
| Middle: **Struggling** | ✅ LIKELY | "currently working 9-5" = stuck, trying to escape |
| Outer: Ready | ⚪ | Have decided, budget ready |

**Engagement Depth (v4.0):**
- These customers likely want **Guided** (courses, group coaching) initially
- Top performers graduate to **Done-With** (1:1 support)

**Full Persona Coordinate:**
> **"Struggling Explorers seeking Guided help"**

**Visual:**
```
              SEEKERS
                 │
    ┌───────────●┼────────────┐
    │    ○      │      ○     │  EXPLORERS
    │   ●●●     │     ○○     │  ← Middle ring (Struggling) = LIT
    │    ○      │      ○     │  BUILDERS (secondary)
    └───────────┼─●──────────┘
              ACHIEVERS
```

---

### Combined Insight

When all three wheels align:

| Wheel | Your Lit Area | What it means |
|-------|---------------|---------------|
| Problems | Economic Freedom + Personal Mastery | You solve "trapped by systems" problems |
| Skills | Building + Strategizing + Influencing + Nurturing | You're an entrepreneur-coach who can do AND teach |
| Persona | Struggling Explorers | Your people are mid-journey freedom-seekers who need guidance |

**Nikigai Sweet Spot:**
> You help freedom-seeking professionals trapped in 9-5 jobs build businesses through strategic coaching, combining your ability to build systems with your ability to nurture growth.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-01-06 | Initial concept and taxonomy proposals |
| 0.2 | 2026-01-06 | Added v3 and v4 for all wheels, example mapping |
| 0.3 | 2026-01-06 | Confirmed 2D designs, 1000% evolutions, implementation plan |
| 0.4 | 2026-01-06 | Wheel Data Ecosystem - capture sources and application integrations |
| 0.5 | 2026-01-06 | Problem Space → Product Feature Matrix (10 archetypes, 12 domain maps, MVP sets) |
| 0.6 | 2026-01-06 | Product Blueprint Flow (7-screen draft with wireframes, data flow, code structure) |
| 0.7 | 2026-01-06 | AI Co-Founder Vision (4 capability levels, spec generation, data→intelligence→action loop) |
| 0.8 | 2026-01-06 | Three DNAs (Founder/Market/Build) + Wheel Segments as Cluster Headings architecture |
| 0.9 | 2026-01-06 | Aspirational Titles for all 36 segments + Combined Identity Statements |
| 1.0 | 2026-01-06 | BuildWithAI Integration - auto-generated tech specs from Three DNAs |
| 1.1 | 2026-01-07 | Implementation Guide (6 phases, code examples), Additional Ideas, Open Questions |
| 1.2 | 2026-01-07 | Finalized 2D wheel designs - 5 Role Archetypes, progressive 1D→2D reveal, mockup flow |

---

## Finalized 2D Wheel Design (v1.2)

### Core Decision: Progressive Reveal with Per-Segment 2D Mapping

During Flow Finder, users see **simpler 1D wheels** for Problems and Persona to reduce cognitive load. Before the final summary, the system asks **per-segment questions** to capture accurate 2D coordinates. The final summary shows **all three wheels as 2D**.

```
FLOW SEQUENCE:
┌─────────────────────────────────────────────────────────────┐
│ DURING FLOWS                                                │
│                                                             │
│ Skills Flow:     2D wheel shown (12 skills × 5 roles)       │
│ Problems Flow:   1D wheel shown (12 domains only)           │
│ Persona Flow:    1D wheel shown (12 psychographics only)    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ BEFORE SUMMARY (per-segment questions)                      │
│                                                             │
│ FOR EACH LIT PROBLEM SEGMENT:                               │
│ "For [Economic Freedom], what type of problem do you        │
│  primarily solve?" (MULTI-SELECT)                           │
│     → Access / Knowledge / Capability / Motivation /        │
│       Connection / System                                   │
│                                                             │
│ FOR EACH LIT PERSONA SEGMENT:                               │
│ "When working with [Seekers], where are they typically      │
│  in their journey?" (MULTI-SELECT)                          │
│     → Awakening / Struggling / Ready                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ FINAL SUMMARY                                               │
│                                                             │
│ Skills Wheel:  2D (12 segments × 5 role rings)              │
│ Problem Wheel: 2D (12 domains × 6 problem type rings)       │
│ Persona Wheel: 2D (12 psychographics × 3 journey rings)     │
│                                                             │
│ Each cell lit based on per-segment answers                  │
│ Combined Identity Statement generated from intersections    │
└─────────────────────────────────────────────────────────────┘
```

### Why Per-Segment Questions?

| Approach | What You Get | Accuracy |
|----------|--------------|----------|
| **One global question** | All lit segments share same ring | Low - oversimplified |
| **Per-segment questions** | Each segment maps to specific cells | High - accurate 2D mapping |

**Example - Per-Segment Problem Type:**
```
User's lit problem segments:
├── "Economic Freedom" → Motivation + Knowledge (2 cells lit)
├── "Personal Mastery" → Capability (1 cell lit)
└── "Career Navigation" → Access + Knowledge (2 cells lit)

Result: 5 specific cells lit across 3 segments × multiple rings
vs. one ring fully lit (inaccurate)
```

**Multi-Select Support:**
- Problem Types: YES - you can solve Access AND Capability problems in same domain
- Journey Stages: YES - your audience may span Awakening AND Struggling

### The 5 Role Archetypes (Skills Second Dimension)

| Role | Description | Job Types | Delivery Mode |
|------|-------------|-----------|---------------|
| **Maker** | Builds products, systems, content | Engineer, Developer, Creator, Producer | Products, Tools, Content |
| **Guide** | Develops people directly | Coach, Teacher, Mentor, Therapist | 1:1 or Group Sessions |
| **Analyst** | Researches, discovers insights | Researcher, Data Scientist, Investigator | Reports, Analysis, Recommendations |
| **Strategist** | Plans, advises, directs | Consultant, Advisor, Fractional Executive | Strategy, Roadmaps, Decisions |
| **Connector** | Facilitates, networks, hosts | Community Builder, Networker, Facilitator | Events, Introductions, Spaces |

**Why 5 (not 4)?** The Connector archetype captures facilitators, community builders, and networkers who don't fit neatly into Maker/Guide/Analyst/Strategist but create immense value through bringing people together.

### The 6 Problem Types (Problems Second Dimension)

| Type | Core Issue | What You Provide | Example |
|------|------------|------------------|---------|
| **Access** | Can't get to what they need | Entry, pathways, doors | "I help people get into competitive industries" |
| **Knowledge** | Don't know what they don't know | Information, education, awareness | "I help people understand their options" |
| **Capability** | Know what but not how | Skills, methods, frameworks | "I help people build the skills to execute" |
| **Motivation** | Can do it but won't | Inspiration, accountability, energy | "I help people finally take action" |
| **Connection** | Missing the right people | Relationships, networks, communities | "I help people find their tribe" |
| **System** | Wrong structures/incentives | Redesign, process, optimization | "I help people fix broken systems" |

**Captured in:** Offer Builder flow (where value proposition is defined)

### The 3 Journey Stages (Persona Second Dimension)

| Stage | Where They Are | What They Need | Your Role |
|-------|----------------|----------------|-----------|
| **Awakening** | Just realized there's a problem | Clarity, validation, hope | Mirror, Validator |
| **Struggling** | Trying solutions, hitting walls | Direction, support, tools | Guide, Supporter |
| **Ready** | Know what they want, need execution | Implementation, systems, action | Partner, Executor |

**Captured in:**
1. Question before final summary (for user's perception)
2. Validation Form (for real customer validation)

### 2D Wheel Coordinates

Each lit cell on a 2D wheel is identified by coordinates:

```javascript
// Skills Wheel: "segmentIndex-roleIndex"
// Example: "2-1" = Strategizing (segment 2) × Guide (role 1)
{
  segmentId: 'strategizing',
  roleId: 'guide',
  coordinate: '2-1',
  label: 'Strategic Guide',
  description: 'You coach people through strategic decisions'
}

// Problem Wheel: "domainIndex-problemTypeIndex"
// Example: "7-3" = Economic Freedom × Motivation
{
  domainId: 'economic-freedom',
  problemTypeId: 'motivation',
  coordinate: '7-3',
  label: 'Freedom Motivation',
  description: 'You help people finally take action toward financial freedom'
}

// Persona Wheel: "psychographicIndex-journeyStageIndex"
// Example: "4-1" = Seekers × Struggling
{
  psychographicId: 'seekers',
  journeyStageId: 'struggling',
  coordinate: '4-1',
  label: 'Struggling Seeker',
  description: 'Meaning-driven people actively searching for their path'
}
```

### Cell Counts Per Wheel

| Wheel | Segments | Rings | Total Cells | During Flow | Final Summary |
|-------|----------|-------|-------------|-------------|---------------|
| Skills | 12 | 5 | 60 | 2D (60 cells) | 2D (60 cells) |
| Problems | 12 | 6 | 72 | 1D (12 segments) | 2D (72 cells) |
| Persona | 12 | 3 | 36 | 1D (12 segments) | 2D (36 cells) |

### Intersection Assessment

The "putting-it-together" Integration flow asks users to rate themselves at specific intersections:

```
EXAMPLE INTERSECTION ASSESSMENTS:

Based on your Skills + Problems + Persona combination:
"Clarifying × Guide × Knowledge × Struggling Seekers"

How confident are you in this specific capability?
"Teaching knowledge-seeking people who are actively struggling"

[1 - Just starting] [2 - Building] [3 - Proficient] [4 - Mastery]

Rate each lit intersection to build accurate maturity profile.
```

### Mockups Created

| Mockup | Path | Shows |
|--------|------|-------|
| Skills 2D | `/mockups/skills-2d-wheel-mockup.html` | 12×5 grid with role rings |
| Three Wheels | `/mockups/three-wheels-mockup.html` | All three interactive |
| Final Summary | `/mockups/final-summary-2d-wheels.html` | Complete 1D→questions→2D flow |

### Visual Design: HSL Gradient Wheel

All wheels use true HSL color wheel aesthetics (not segmented pie charts):

```
RENDERING APPROACH:
- Canvas-based smooth gradient background
- Lit segments: Full saturation + glow effect
- Unlit segments: Desaturated/dimmed (50% lightness, 30% saturation)
- Segments: 30° each for 12-segment wheel
- Rings: Concentric circles at 33%/66%/100% radius (varies by wheel)
- Hover: Tooltip with segment name, description, response count
- Click: Toggle lit state / view responses
```

### Integration Points Summary

| Data Point | Captured In | Used In |
|------------|-------------|---------|
| Skill × Role intersection | Skills Flow (AI classification) | Skills Wheel, Blueprint |
| Problem domain | Problems Flow (AI classification) | Problem Wheel, Blueprint |
| Problem type | Offer Builder | Problem Wheel 2D, Value Prop |
| Persona psychographic | Persona Flow (AI classification) | Persona Wheel, Messaging |
| Journey stage (self) | Question before summary | Persona Wheel 2D, Strategy |
| Journey stage (validated) | Validation Form | Market DNA, Real data |
| Intersection maturity | Integration Flow | All wheels, AI guidance |
