# Nikigai Structured Output Templates

This document defines the exact formats for outputs in each Nikigai lens.

---

## Overview

Each lens has specific output structures that guide how the AI generates and presents information to users. Consistency in these formats ensures clarity and actionability.

---

## Skills Lens Outputs

### 1. Skill Cluster Format

```json
{
  "cluster_id": "skills_cluster_1",
  "label": "Creative Expression",
  "role_archetype": "The Creator",
  "skills": [
    "Designing visual content",
    "Storytelling through media",
    "Creating brand identities",
    "Crafting user experiences",
    "Building compelling narratives"
  ],
  "resonance_score": 9,
  "cluster_score": 0.85
}
```

**Display format:**
```
🎨 The Creator — Creative Expression

Skills:
• Designing visual content
• Storytelling through media
• Creating brand identities
• Crafting user experiences
• Building compelling narratives

Resonance: ⭐⭐⭐⭐⭐⭐⭐⭐⭐ (9/10)
```

### 2. Job Title Suggestions Format

```json
{
  "role_archetype": "The Creator",
  "job_titles": [
    {
      "title": "Brand Designer",
      "match_score": 0.92,
      "key_skills_used": ["Designing visual content", "Creating brand identities"]
    },
    {
      "title": "Content Strategist",
      "match_score": 0.88,
      "key_skills_used": ["Storytelling through media", "Building compelling narratives"]
    },
    {
      "title": "UX Designer",
      "match_score": 0.85,
      "key_skills_used": ["Crafting user experiences", "Designing visual content"]
    }
  ]
}
```

**Display format:**
```
Based on your Creator skills, here are roles that align:

🎯 Brand Designer (92% match)
   Uses: Designing visual content, Creating brand identities

🎯 Content Strategist (88% match)
   Uses: Storytelling through media, Building compelling narratives

🎯 UX Designer (85% match)
   Uses: Crafting user experiences, Designing visual content
```

---

## Problems Lens Outputs

### 1. Change Statement Format

**Structure:** One sentence describing the positive transformation

**Template:**
> "Helping [people] [overcome/experience/achieve] [desired state]"

**Examples:**
```json
{
  "cluster_id": "problem_cluster_1",
  "label": "Emotional Healing",
  "change_statement": "Helping people feel safe being fully themselves",
  "problem_examples": [
    "Overcoming shame and self-judgment",
    "Breaking free from people-pleasing",
    "Healing from perfectionism",
    "Learning to set boundaries"
  ],
  "resonance_score": 10
}
```

**Display format:**
```
💫 Emotional Healing

Change Statement:
"Helping people feel safe being fully themselves"

This theme includes:
• Overcoming shame and self-judgment
• Breaking free from people-pleasing
• Healing from perfectionism
• Learning to set boundaries

Resonance: ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ (10/10)
```

### 2. Industry/Sector Mapping

```json
{
  "change_theme": "Emotional Healing",
  "aligned_industries": [
    {
      "industry": "Mental Health & Wellness",
      "relevance": 0.95,
      "sub-sectors": ["Therapy", "Coaching", "Mindfulness", "Personal Development"]
    },
    {
      "industry": "Education",
      "relevance": 0.75,
      "sub-sectors": ["Social-Emotional Learning", "Teacher Training", "Student Wellness"]
    },
    {
      "industry": "Corporate Wellbeing",
      "relevance": 0.70,
      "sub-sectors": ["Employee Wellness", "Leadership Development", "Culture Change"]
    }
  ]
}
```

**Display format:**
```
Your "Emotional Healing" theme aligns with:

🏢 Mental Health & Wellness (95% fit)
   → Therapy, Coaching, Mindfulness, Personal Development

🏢 Education (75% fit)
   → Social-Emotional Learning, Teacher Training, Student Wellness

🏢 Corporate Wellbeing (70% fit)
   → Employee Wellness, Leadership Development, Culture Change
```

---

## People Lens Outputs

### 1. Empathy Snapshot Format

**Structure:** Four-part description of a persona

```json
{
  "persona_id": "persona_1",
  "label": "The Seekers",
  "archetype_name": "The Awakening Professional",
  "empathy_snapshot": {
    "who_they_are": "Mid-career professionals (30-45) who feel successful on paper but empty inside. Often high-achievers questioning if their work truly matters.",
    "what_they_struggle_with": "Feeling trapped in golden handcuffs. Burnout masked as success. Fear of starting over. Disconnect between values and daily work. Imposter syndrome despite accomplishments.",
    "what_they_crave": "Meaning and alignment. Work that reflects their values. Permission to pivot. A path that honors both their skills and their soul. Community of others on similar journeys.",
    "your_connection": "I've been there. I know what it's like to achieve everything you thought you wanted and still feel lost. I understand the courage it takes to ask 'what if there's more?'"
  },
  "primary_persona": true,
  "resonance_score": 9
}
```

**Display format:**
```
👥 The Awakening Professional

Who they are:
Mid-career professionals (30-45) who feel successful on paper but empty inside.
Often high-achievers questioning if their work truly matters.

What they struggle with:
Feeling trapped in golden handcuffs. Burnout masked as success. Fear of starting
over. Disconnect between values and daily work.

What they crave:
Meaning and alignment. Work that reflects their values. Permission to pivot.
A path that honors both their skills and their soul.

Your connection:
I've been there. I know what it's like to achieve everything you thought you
wanted and still feel lost. I understand the courage it takes to ask
'what if there's more?'

⭐ Primary Persona | Resonance: 9/10
```

### 2. Persona Characteristics Grid

```json
{
  "persona": "The Awakening Professional",
  "demographics": {
    "age_range": "30-45",
    "life_stage": "Mid-career, often with dependents",
    "income_level": "Middle to upper-middle class"
  },
  "psychographics": {
    "values": ["Authenticity", "Growth", "Impact", "Alignment"],
    "fears": ["Starting over", "Financial instability", "Judgment", "Failure"],
    "desires": ["Meaningful work", "Integration", "Freedom", "Purpose"],
    "behaviors": ["Reading self-help", "Considering career change", "Seeking coaches/mentors"]
  },
  "pain_points": [
    "Sunday night dread",
    "Success without fulfillment",
    "Skills don't match passion",
    "Trapped by lifestyle"
  ]
}
```

---

## Market Lens Outputs

### 1. Solution Category Format

```json
{
  "category": "Coaching & Consulting",
  "description": "One-on-one or group guidance helping people navigate transitions",
  "existing_players": [
    "Career coaches",
    "Life coaches",
    "Transition consultants",
    "Purpose coaches"
  ],
  "your_unique_angle": "Combining creative expression with strategic clarity for burned-out high-achievers",
  "market_fit": 0.88,
  "estimated_demand": "High - growing market of $15B+ globally"
}
```

**Display format:**
```
💼 Coaching & Consulting

What it is:
One-on-one or group guidance helping people navigate transitions

Who's already there:
Career coaches, Life coaches, Transition consultants, Purpose coaches

Your unique edge:
Combining creative expression with strategic clarity for burned-out high-achievers

Market fit: 88%
Demand: High - growing market of $15B+ globally
```

### 2. Opportunity Space Map

```json
{
  "opportunity_spaces": [
    {
      "space_id": "opp_1",
      "name": "Purpose-Driven Career Transitions",
      "intersection": {
        "skills": "The Guide + The Strategist",
        "problems": "Burnout + Lack of Purpose",
        "people": "The Awakening Professional",
        "market": "Coaching & Consulting"
      },
      "competitive_density": "Medium",
      "differentiation_potential": "High",
      "entry_barriers": "Low to Medium"
    }
  ]
}
```

---

## Integration Lens Outputs

### 1. Opportunity Statement Format

**Template:**
> "Helping [persona] overcome [problem] using [skill/approach] in [market/context]"

**Examples:**
```json
{
  "opportunity_statements": [
    {
      "statement": "Helping burned-out professionals rediscover their purpose by guiding them through creative self-discovery processes in 1-on-1 coaching sessions",
      "components": {
        "persona": "burned-out professionals",
        "problem": "lost sense of purpose",
        "skill": "guiding through creative self-discovery",
        "market": "1-on-1 coaching"
      },
      "resonance_score": 10,
      "alignment_score": 9,
      "excitement_score": 10,
      "truth_score": 9
    }
  ]
}
```

**Display format:**
```
🎯 Opportunity Statement #1

"Helping burned-out professionals rediscover their purpose by guiding them
through creative self-discovery processes in 1-on-1 coaching sessions"

Resonance: ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ (10/10)

How it feels:
• Aligned (calm, clear, grounded): 9/10
• Exciting (expansive, alive): 10/10
• True (simple, natural, authentic): 9/10
```

### 2. Mission Statement Format

**Template options:**

**Option A (Impact-focused):**
> "My mission is to help [people] overcome [problem] by [how], so they can [outcome]"

**Option B (Essence-focused):**
> "I exist to [verb] [who] through [method/magic]"

**Examples:**
```json
{
  "mission_statements": [
    {
      "statement": "My mission is to help high-achievers reconnect with their authentic selves through creative self-discovery, so they can build careers that honor both their gifts and their values",
      "template_used": "impact_focused",
      "alignment_score": 9,
      "excitement_score": 8,
      "truth_score": 10
    },
    {
      "statement": "I exist to guide lost souls back to their inner knowing through the alchemy of storytelling and strategic clarity",
      "template_used": "essence_focused",
      "alignment_score": 10,
      "excitement_score": 9,
      "truth_score": 9
    }
  ]
}
```

**Display format:**
```
✨ Your Mission Statement

"My mission is to help high-achievers reconnect with their authentic selves
through creative self-discovery, so they can build careers that honor both
their gifts and their values"

Does it feel:
• Aligned (calm, clear, grounded)? 9/10
• Exciting (expansive, alive)? 8/10
• True (simple, natural, authentic)? 10/10
```

### 3. Vision in Action Format

**Structure:** 3-5 sentence narrative describing daily life living the mission

```json
{
  "vision_in_action": "I wake up energized to facilitate transformational workshops where burned-out professionals rediscover their creative spark. My days blend 1-on-1 coaching sessions, designing new workshop experiences, and building a community of awakening changemakers. I work from my home studio surrounded by art and nature, with the freedom to travel for retreats. I'm writing a book that weaves together my own journey with the stories of those I've guided. Most importantly, I see the light return to people's eyes when they remember who they truly are.",
  "key_elements": {
    "daily_activities": ["Facilitating workshops", "1-on-1 coaching", "Designing experiences"],
    "environment": "Home studio with art and nature",
    "freedom": "Flexibility to travel for retreats",
    "creative_expression": "Writing a book",
    "impact": "Seeing light return to people's eyes"
  }
}
```

**Display format:**
```
🌟 Vision in Action

I wake up energized to facilitate transformational workshops where burned-out
professionals rediscover their creative spark. My days blend 1-on-1 coaching
sessions, designing new workshop experiences, and building a community of
awakening changemakers.

I work from my home studio surrounded by art and nature, with the freedom to
travel for retreats. I'm writing a book that weaves together my own journey
with the stories of those I've guided.

Most importantly, I see the light return to people's eyes when they remember
who they truly are.
```

### 4. First Step Format

**Structure:** One concrete, small action to take this week

```json
{
  "first_step": "This week, reach out to three people in your network who have made career transitions and ask them to coffee. Share your emerging mission and ask: 'What was the turning point that gave you permission to leap?'",
  "why_this_matters": "Real conversations anchor your vision and reveal you're not alone",
  "success_metric": "Three conversations scheduled"
}
```

**Display format:**
```
🚀 Your First Step This Week

This week, reach out to three people in your network who have made career
transitions and ask them to coffee. Share your emerging mission and ask:
'What was the turning point that gave you permission to leap?'

Why this matters:
Real conversations anchor your vision and reveal you're not alone

Success metric: Three conversations scheduled
```

---

## Export Format (Final Blueprint)

### PDF/Markdown Structure

```markdown
# My Nikigai Blueprint

## Skills — What I'm Great At

### The Creator — Creative Expression
- Designing visual content
- Storytelling through media
- Creating brand identities

**Possible paths:** Brand Designer, Content Strategist, UX Designer

---

## Problems — What the World Needs

### Emotional Healing
**Change Statement:** "Helping people feel safe being fully themselves"

**This includes:**
- Overcoming shame and self-judgment
- Breaking free from people-pleasing
- Healing from perfectionism

---

## People — Who I Love Helping

### The Awakening Professional
Mid-career professionals questioning if their work truly matters

**They struggle with:** Success without fulfillment, fear of starting over
**They crave:** Meaning, alignment, permission to pivot
**My connection:** I've been there. I understand the courage it takes.

---

## Market — Where I Fit

### Coaching & Consulting
My unique edge: Combining creative expression with strategic clarity for
burned-out high-achievers

---

## My Mission

"My mission is to help high-achievers reconnect with their authentic selves
through creative self-discovery, so they can build careers that honor both
their gifts and their values"

---

## Vision in Action

[3-5 sentence narrative]

---

## First Step

[Concrete action this week]
```

---

## Implementation Notes

### Storage Schema

```json
{
  "nikigai_blueprint": {
    "session_id": "session_123",
    "user_id": "user_456",
    "completed_at": "2025-11-07T10:30:00Z",
    "path_type": "Career / Job Clarity",

    "skills": {
      "clusters": [...],
      "top_roles": [...],
      "job_titles": [...]
    },

    "problems": {
      "change_themes": [...],
      "change_statements": [...],
      "top_themes": [...]
    },

    "people": {
      "personas": [...],
      "primary_personas": [...],
      "empathy_snapshots": [...]
    },

    "market": {
      "solution_categories": [...],
      "unique_edge": "...",
      "opportunity_spaces": [...]
    },

    "integration": {
      "opportunity_statements": [...],
      "mission_statements": [...],
      "vision_in_action": "...",
      "first_step": "..."
    }
  }
}
```

---

## Next Steps

See also:
- `/docs/nikigai-auto-tagging-schema.md` - Tag extraction system
- `/docs/nikigai-role-archetypes.md` - Role archetype library
- `/docs/alfred-system-prompt.md` - AI personality and behavior

---

*Last updated: 2025-11-07*
