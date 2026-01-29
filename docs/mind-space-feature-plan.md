# Mind Space Feature Plan

## Overview

Mind Space is a new onboarding feature that leverages users' existing AI conversation history to extract their skills, problems, and personas - pre-filling their wheel taxonomy with minimal effort.

**Core Insight:** Users have already revealed their patterns through conversations with AI tools. Rather than asking them to answer 45+ minutes of Flow Finder questions, we let them extract insights from conversations they've already had.

## User Journey

```
OLD: Flow Finder (45 min) → Wheel Taxonomy → Integration

NEW: Mind Space (5 min) → Review & Confirm (5 min) → Optional Deep Dives
```

### Why This Works Better

1. **Lower barrier** - 10 min vs 45+ min to get started
2. **Higher quality** - AI sees patterns users can't consciously recognize
3. **Evidence-backed** - Each item has proof from real conversations
4. **Modern UX** - Leverages tools they already use
5. **Same data captured** - Identical wheel taxonomy output

---

## The Three-Step Flow

### Step 1: Generate & Copy Prompt

User sees a pre-written prompt they copy to their clipboard.

**The Prompt:**

```
Analyze our entire conversation history together. I want you to identify patterns that reveal what I'm naturally drawn to — the intersection of my Skills, the Problems I care about, and the People (Personas) I want to serve.

Please extract and organize your findings in this EXACT format (I'll be pasting this into an app):

---START EXTRACTION---

## SKILLS (Things I'm good at or learning)
For each skill, provide:
- SKILL: [Name]
- EVIDENCE: [Brief quote or pattern you noticed]
- FREQUENCY: [Low/Medium/High - how often this appeared]
- CATEGORY: [Technical / Creative / Interpersonal / Strategic / Healing / Other]

## PROBLEMS (Issues I care about solving)
For each problem, provide:
- PROBLEM: [Name/Description]
- EVIDENCE: [What made you identify this]
- FREQUENCY: [Low/Medium/High]
- EMOTIONAL_CHARGE: [Low/Medium/High - how much passion I showed]

## PERSONAS (Types of people I want to help or relate to)
For each persona, provide:
- PERSONA: [Description]
- EVIDENCE: [What made you identify this]
- FREQUENCY: [Low/Medium/High]
- CONNECTION: [Why I might relate to this persona]

## RECURRING THEMES
List 3-5 themes that appear across multiple conversations:
- THEME: [Name]
- CONNECTS: [Which skills, problems, or personas this links]

## CURIOSITY GAPS
Things I've circled around but haven't fully explored:
- GAP: [Topic]
- EVIDENCE: [Why you think I'm curious but haven't gone deep]
- SUGGESTED_CONNECTION: [What existing interest this might link to]

## NORTH STAR HYPOTHESIS
Based on everything above, complete this sentence:
"You seem most alive when you're using [SKILLS] to help [PERSONAS] solve [PROBLEMS]."

---END EXTRACTION---

Important guidelines:
1. Be specific — use my actual words and topics, not generic descriptions
2. Look for PATTERNS, not just one-off mentions
3. Include things I might not consciously recognize about myself
4. Note contradictions or tensions if you see them
5. Prioritize depth over breadth — fewer items with rich detail is better
6. For frequency, base it on how often the topic genuinely appeared
7. Keep each evidence note under 20 words
```

**UI Elements:**
- Copy button with success feedback
- "Open ChatGPT" / "Open Claude" quick links
- Tips: "Use this with any AI you've had long conversations with"

---

### Step 2: Paste AI Response

User pastes the AI's response into a large text area.

**UI Elements:**
- Large text area with placeholder
- "Paste" button for mobile
- Parse button: "Extract My Patterns"
- Loading state while parsing

**Parsing Logic:**
- Look for `---START EXTRACTION---` and `---END EXTRACTION---` markers
- Extract structured sections (Skills, Problems, Personas, Themes, Gaps, North Star)
- Map extracted items to wheel taxonomy categories using keyword matching

---

### Step 3: Review & Confirm

User sees their wheel taxonomy pre-filled and confirms/adjusts.

#### Skills Section

Each extracted skill is mapped to one of 12 wheel categories. User selects their level.

| Wheel Category | Icon | Aspirational Title |
|----------------|------|-------------------|
| Clarifying | 💡 | The Translator |
| Analyzing | 📊 | The Pattern Spotter |
| Strategizing | 🎯 | The Chess Player |
| Organizing | ⚙️ | The Systems Architect |
| Building | 🔨 | The Maker |
| Designing | 🎨 | The Experience Crafter |
| Creating | ✨ | The Originator |
| Expressing | 🎙️ | The Voice |
| Connecting | 🤝 | The Bridge Builder |
| Influencing | 🔥 | The Catalyst |
| Nurturing | 🌱 | The Grower |
| Synthesizing | 🔮 | The Integrator |

**Three Levels (user selects):**
- **Emerging** - Still learning, passionate but developing
- **Establishing** - Competent and building experience
- **Mastering** - Expert level, could teach others

#### Problems Section

Each extracted problem is mapped to one of 12 wheel categories. User selects their level.

| Wheel Category | Icon | Sphere | Aspirational Title |
|----------------|------|--------|-------------------|
| Physical Vitality | 💪 | Self | Body Whisperer |
| Mental Wellbeing | 🧠 | Self | Mind Guardian |
| Personal Mastery | 🎓 | Self | Growth Catalyst |
| Intimate Bonds | 💕 | Relational | Heart Healer |
| Service & Care | 🫶 | Relational | Care Champion |
| Creative Expression | 🎭 | Relational | Voice Liberator |
| Local Impact | 🏘️ | Community | Community Builder |
| Cultural Movements | 📢 | Community | Movement Maker |
| Economic Freedom | 🚀 | Community | Freedom Architect |
| Social Justice | ⚖️ | World | Equity Champion |
| Planetary Health | 🌍 | World | Earth Guardian |
| Human Progress | 🔬 | World | Future Builder |

**Three Levels (user selects):**
- **Exploring** - Curious but haven't pursued yet
- **Pursuing** - Currently working on this problem
- **Proven** - Have results and experience

#### Personas Section

Each extracted persona is mapped to one of 12 wheel categories. User selects their level.

| Wheel Category | Icon | Core Drive | Aspirational Title |
|----------------|------|------------|-------------------|
| Seekers | 🧭 | Direction | The Compass |
| Builders | 🏗️ | Creation | The Architect |
| Healers | 🩹 | Wholeness | The Mender |
| Teachers | 📚 | Growth | The Illuminator |
| Connectors | 🕸️ | Belonging | The Weaver |
| Achievers | 🏆 | Success | The Accelerator |
| Explorers | 🗺️ | Freedom | The Liberator |
| Visionaries | 🔭 | Impact | The Pioneer |
| Protectors | 🛡️ | Security | The Shield |
| Creators | 🎨 | Expression | The Muse |
| Nurturers | ⚓ | Care | The Anchor |
| Challengers | ⚡ | Justice | The Truth Teller |

**Three Levels (user selects):**
- **Awakening** - Just realized they have this problem
- **Struggling** - Actively trying to solve, hitting walls
- **Ready** - Have budget, urgency, seeking solution

#### User Actions in Review

For each pre-filled item, user can:

1. **Select Level** - Choose Emerging/Establishing/Mastering (or equivalent)
2. **Star as Top 3** - Mark their strongest in each category
3. **Remove** - Delete items that don't resonate
4. **Add Missing** - Add wheel categories the AI didn't catch

Additional sections:

5. **View Evidence** - Expand to see AI's reasoning (the EVIDENCE field)
6. **View Themes** - See recurring patterns that connect items
7. **View Curiosity Gaps** - Suggested areas to explore
8. **View North Star** - The synthesized "you seem most alive when..." statement

---

## Data Model

### Parsed Response Structure

```javascript
{
  skills: [
    {
      name: "Systems & Framework Design",
      evidence: "mapping… diagnostic quizzes, matrices",
      frequency: "High",
      category: "Strategic",
      mappedTo: "organizing", // wheel taxonomy id
      userLevel: null // user selects: emerging | establishing | mastering
    }
  ],
  problems: [
    {
      name: "People feel disconnected from playful essence",
      evidence: "reclaim childhood joy, playful carefree state",
      frequency: "High",
      emotionalCharge: "High",
      mappedTo: "mental_wellbeing", // wheel taxonomy id
      userLevel: null // user selects: exploring | pursuing | proven
    }
  ],
  personas: [
    {
      name: "The Playful but Blocked Seeker",
      evidence: "craves joy, stuck in seriousness or burnout",
      frequency: "High",
      connection: "Mirrors your post-crisis phase",
      mappedTo: "seekers", // wheel taxonomy id
      userLevel: null // user selects: awakening | struggling | ready
    }
  ],
  themes: [
    {
      name: "Play as Medicine",
      connects: ["designing", "mental_wellbeing", "seekers"]
    }
  ],
  curiosityGaps: [
    {
      name: "Long-term outcome measurement",
      evidence: "Frequent mention, no finalized metric system",
      suggestedConnection: "Frequency audits + Vibe Mirror data"
    }
  ],
  northStar: "You seem most alive when you're using systems thinking..."
}
```

### Database Storage

Store in existing `nikigai_responses` or new `mind_space_extractions` table:

```sql
CREATE TABLE mind_space_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Raw data
  raw_response TEXT NOT NULL,
  parsed_data JSONB NOT NULL,

  -- Confirmed wheel taxonomy
  confirmed_skills JSONB DEFAULT '[]',
  confirmed_problems JSONB DEFAULT '[]',
  confirmed_personas JSONB DEFAULT '[]',

  -- Extras
  themes JSONB DEFAULT '[]',
  curiosity_gaps JSONB DEFAULT '[]',
  north_star TEXT,

  -- Metadata
  source_ai TEXT, -- 'chatgpt', 'claude', 'other'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);
```

---

## Mapping Algorithm

### Keyword Matching

Use existing `keywords` arrays from wheel taxonomy to map extracted items:

```javascript
function mapToWheelCategory(extractedItem, wheelType) {
  const segments = getSegmentsForWheel(wheelType);

  const scores = segments.map(segment => {
    const matchScore = segment.keywords.reduce((score, keyword) => {
      if (extractedItem.name.toLowerCase().includes(keyword)) {
        return score + 2;
      }
      if (extractedItem.evidence?.toLowerCase().includes(keyword)) {
        return score + 1;
      }
      return score;
    }, 0);

    return { segmentId: segment.id, score: matchScore };
  });

  // Return top match(es) above threshold
  return scores
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2); // Allow dual-mapping
}
```

### Fallback: User Selection

If no confident match, show user a picker:

```
"We couldn't auto-map 'Somatic Facilitation'. Which fits best?"
[Nurturing] [Connecting] [Other...]
```

---

## Integration Points

### 1. Flow Finder (Optional Deep Dive)

After Mind Space completion, Flow Finder becomes optional:

```
"Want more clarity on your Skills?"
[Yes, explore deeper] → /nikigai/skills (pre-filled)
[No, this captures it] → Continue
```

### 2. Wheel Taxonomy Data

Mind Space output feeds same data structures as Flow Finder:

- `nikigai_clusters` - Populated with confirmed items
- `nikigai_key_outcomes` - North Star becomes key outcome
- Wheel visualizations work identically

### 3. Challenge Quest

Add Mind Space as a quest in Flow Finder stage (Stage 0):

```json
{
  "id": "mind_space_extraction",
  "category": "Business",
  "type": "Flow Finder",
  "frequency": "anytime",
  "stage_required": 0,
  "name": "Mind Space Extraction",
  "description": "Use AI to map your curiosities, skills, and passions",
  "points": 10,
  "inputType": "flow",
  "flow_id": "mind_space",
  "flow_route": "/mind-space"
}
```

### 4. Mind Space Visualization (Future)

The extracted data can power a force-directed graph visualization:

- **Nodes**: Skills, Problems, Personas (colored by type)
- **Size**: Frequency (High = large)
- **Connections**: Themes link related nodes
- **Hollow nodes**: Curiosity gaps (unexplored)

---

## Technical Implementation

### Files to Create

```
src/
├── flows/
│   └── MindSpace.jsx          # Main component
│   └── MindSpace.css          # Styles
├── lib/
│   └── mindSpaceParser.js     # Parse AI response
│   └── mindSpaceMapper.js     # Map to wheel taxonomy
```

### Route

Add to AppRouter.jsx:
```javascript
<Route path="/mind-space" element={<MindSpace />} />
```

### Migration

```sql
-- supabase/migrations/20260128200000_mind_space.sql
CREATE TABLE mind_space_extractions (
  -- schema above
);
```

---

## UI/UX Details

### Step 1: Prompt Screen

- Purple gradient header
- Large copy button (gold accent)
- Quick links to AI tools
- "How it works" accordion

### Step 2: Paste Screen

- Large text area (full width)
- Character count
- "Extract My Patterns" button (gold)
- Loading spinner with steps

### Step 3: Review Screen

- Three expandable sections (Skills, Problems, Personas)
- Each item shows: Icon, Name, Evidence (collapsed), Level selector
- Star toggle for "Top 3"
- Add/Remove buttons
- Bottom: North Star quote highlighted
- "Confirm & Continue" button

### Mobile Considerations

- Paste button for clipboard access
- Collapsible sections
- Swipe to remove items
- Bottom sheet for level selection

---

## Success Metrics

1. **Completion rate** - % who finish all 3 steps
2. **Time to complete** - Target: <10 minutes
3. **Items confirmed** - Avg items per category
4. **Flow Finder opt-in** - % who choose to go deeper
5. **Wheel accuracy** - User satisfaction with pre-fill

---

## Open Questions

1. **Multiple AI sources** - Allow combining extractions from ChatGPT + Claude?
2. **Re-extraction** - Can users re-run with new conversations later?
3. **Privacy** - Do we store the raw AI response or just parsed data?
4. **Visualization** - Build force-directed graph now or later phase?

---

## Next Steps

1. [ ] Create database migration
2. [ ] Build MindSpace.jsx component
3. [ ] Implement parser for AI response
4. [ ] Implement mapper to wheel taxonomy
5. [ ] Add to AppRouter
6. [ ] Add challenge quest
7. [ ] Test with real AI responses
8. [ ] Mobile optimization
