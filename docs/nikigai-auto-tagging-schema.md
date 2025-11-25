# Nikigai Auto-Tagging Schema

This document defines the AI-powered auto-tagging system for extracting meaningful patterns from user responses during the Life Map flow.

---

## Overview

After every user response (especially `text_list` inputs), the AI analyzes the content and extracts structured tags. These tags are then used for progressive clustering and generating insights.

---

## Tag Types

### 1. **skill_verb**
**Purpose:** Identifies action words that describe what the user does or enjoys doing.

**Examples:**
- creating
- facilitating
- building
- designing
- teaching
- organizing
- connecting
- analyzing
- storytelling
- problem-solving

**Extraction prompt:**
```
From the following user response, extract 3-5 skill verbs (action words)
that describe what they were doing:

User response: {user_input}

Return as JSON array: ["verb1", "verb2", ...]
```

---

### 2. **domain_topic**
**Purpose:** Identifies subject areas, fields, or domains the user engages with.

**Examples:**
- psychology
- design
- community building
- education
- technology
- music
- business strategy
- health & wellness
- storytelling
- nature

**Extraction prompt:**
```
From the following user response, extract 2-4 domain topics or subject areas:

User response: {user_input}

Return as JSON array: ["topic1", "topic2", ...]
```

---

### 3. **value**
**Purpose:** Identifies core values that emerge from the response.

**Examples:**
- creativity
- freedom
- service
- connection
- growth
- play
- authenticity
- courage
- curiosity
- impact

**Extraction prompt:**
```
From the following user response, extract 2-3 core values being expressed:

User response: {user_input}

Return as JSON array: ["value1", "value2", ...]
```

---

### 4. **emotion**
**Purpose:** Captures the emotional tone or feeling associated with the response.

**Examples:**
- joy
- pride
- excitement
- calm
- confidence
- freedom
- aliveness
- fulfillment
- curiosity
- peace

**Extraction prompt:**
```
What emotions or feelings are present in this response?

User response: {user_input}

Return as JSON array: ["emotion1", "emotion2", ...]
```

---

### 5. **context**
**Purpose:** Tags the life context or stage where this occurred.

**Values:**
- childhood
- highschool
- age18_25
- current
- work
- creative
- entrepreneurial
- future
- personal
- professional

**Note:** This is usually inferred from the `store_as` path (e.g., `life_map.hobbies.childhood`)

---

### 6. **problem_theme**
**Purpose:** Identifies challenges, problems, or changes the user cares about.

**Examples:**
- burnout
- disconnection
- lack of purpose
- inequality
- environmental damage
- mental health stigma
- educational rigidity
- creative suppression
- social isolation
- systemic injustice

**Extraction prompt:**
```
From the following user response, identify 1-3 problem themes or challenges
they care about solving:

User response: {user_input}

Return as JSON array: ["problem1", "problem2", ...]
```

---

### 7. **persona_hint**
**Purpose:** Identifies types of people the user relates to, helps, or resonates with.

**Examples:**
- young creatives
- leaders in transition
- parents seeking balance
- entrepreneurs
- students
- caregivers
- people in recovery
- marginalized communities
- professionals seeking meaning

**Extraction prompt:**
```
Based on this response, what type of people (personas) might this person
relate to or want to help?

User response: {user_input}

Return as JSON array: ["persona1", "persona2", ...]
```

---

## Weighting System

### Weight Types

Each bullet point receives three types of weights based on the context:

**1. joy_weight**
- Applied to responses from: hobbies, flow activities, high moments
- Range: 0.0 - 1.0
- Formula: `frequency_in_joy_contexts / total_joy_responses`

**2. meaning_weight**
- Applied to responses from: challenges, growth, turning points, impact created
- Range: 0.0 - 1.0
- Formula: `frequency_in_meaning_contexts / total_meaning_responses`

**3. direction_weight**
- Applied to responses from: future desires, aspirations, world changes
- Range: 0.0 - 1.0
- Formula: `frequency_in_future_contexts / total_future_responses`

### Bullet Score Calculation

```javascript
bullet_score = (0.5 * joy_weight) + (0.35 * meaning_weight) + (0.15 * direction_weight)
```

**Rationale:**
- Joy (50%): What they naturally love doing is the strongest signal
- Meaning (35%): What they've found meaningful through experience
- Direction (15%): What they aspire to (important but less proven)

---

## Clustering Logic

### Cluster Score Calculation

```javascript
cluster_score = average(bullet_scores_in_cluster) + diversity_bonus

diversity_bonus = unique_domains_in_cluster * 0.1 // Max +0.3
```

**Example:**
If a skill cluster has:
- 5 bullets with scores: [0.8, 0.75, 0.7, 0.65, 0.6]
- Average = 0.7
- Contains 3 unique domains (design, education, community)
- Diversity bonus = 3 * 0.1 = 0.3
- **Final cluster_score = 0.7 + 0.3 = 1.0**

### Cluster Generation Rules

**Target ranges (per CustomGPT instructions):**
- Skill candidates: 5-15 items
- Skill clusters: 3-6 groups
- Problem/Change themes: 3-6 clusters
- Personas: 2-4 types
- Market niches: 3-6 categories

**Clustering algorithm:**
1. Extract tags from all relevant responses
2. Calculate bullet_score for each item
3. Group similar tags using semantic similarity (e.g., cosine similarity on embeddings)
4. Ensure each cluster has 3-5 examples minimum
5. Name cluster with representative label
6. Sort clusters by cluster_score

---

## Progressive Enrichment

As the user progresses through the Life Map, clusters are enriched with new data:

**Flow:**
```
Hobbies → Skills (initial)
   ↓
High moments → Skills (enriched with values)
   ↓
Learning → Skills (enriched with domains)
   ↓
Work → Skills + Problems (enriched with professional context)
   ↓
Future → All clusters (weighted by direction)
```

**Merge strategy:**
- New tags added to existing clusters if semantic similarity > 0.7
- New clusters created if no match
- Duplicate tags removed
- Cluster scores recalculated with new weights

---

## Implementation Example (Claude API)

### Step 1: Extract Tags

```javascript
const systemPrompt = `You are a tag extraction AI. Extract structured tags from user responses.`

const userPrompt = `
From this response, extract:
- skill_verb (action words)
- domain_topic (subject areas)
- value (core values)
- emotion (feelings expressed)

User response: "I loved building Lego cities and organizing the different neighborhoods with my friends"

Return as JSON:
{
  "skill_verb": ["building", "organizing", "collaborating"],
  "domain_topic": ["architecture", "community design", "play"],
  "value": ["creativity", "order", "connection"],
  "emotion": ["joy", "satisfaction"]
}
`

const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  messages: [{ role: "user", content: userPrompt }],
  system: systemPrompt
})
```

### Step 2: Calculate Weights

```javascript
function calculateBulletScore(tags, context) {
  const joyContexts = ['hobbies', 'flow_activities', 'high_moments']
  const meaningContexts = ['turning_points', 'challenges', 'impact']
  const directionContexts = ['future', 'aspirations', 'world_changes']

  const joyWeight = joyContexts.includes(context) ? 1.0 : 0.0
  const meaningWeight = meaningContexts.includes(context) ? 1.0 : 0.0
  const directionWeight = directionContexts.includes(context) ? 1.0 : 0.0

  return (0.5 * joyWeight) + (0.35 * meaningWeight) + (0.15 * directionWeight)
}
```

### Step 3: Cluster Similar Tags

```javascript
const clusterPrompt = `
Group these skill verbs into 3-6 thematic clusters.
Each cluster should have a descriptive label and 3-5 related skills.

Skills: ${skillVerbs.join(', ')}

Return as JSON:
[
  {
    "label": "Creative Expression",
    "skills": ["designing", "storytelling", "creating"]
  },
  ...
]
`
```

---

## Storage Format

Tags are stored invisibly in the database alongside user responses:

```json
{
  "life_map.hobbies.childhood": {
    "raw_response": ["Building Lego cities", "Playing with friends"],
    "tags": [
      {
        "text": "Building Lego cities",
        "skill_verb": ["building", "designing"],
        "domain_topic": ["architecture", "play"],
        "value": ["creativity", "order"],
        "emotion": ["joy"],
        "context": "childhood",
        "joy_weight": 1.0,
        "meaning_weight": 0.0,
        "direction_weight": 0.0,
        "bullet_score": 0.5
      }
    ]
  }
}
```

---

## Quality Assurance

**Tag validation:**
- Minimum 2 tags per response
- No duplicate tags within same category
- Emotion tags must be positive or neutral for joy contexts
- Problem themes only extracted from relevant sections

**Cluster validation:**
- Minimum 3 examples per cluster
- Maximum 6 clusters per category
- Each cluster must have unique label
- No cluster should contain >40% of total items

---

## Next Steps

See also:
- `/docs/nikigai-role-archetypes.md` - Role naming for skill clusters
- `/docs/nikigai-structured-outputs.md` - Output formats for each lens
- `/docs/alfred-system-prompt.md` - AI personality and behavior

---

*Last updated: 2025-11-07*
