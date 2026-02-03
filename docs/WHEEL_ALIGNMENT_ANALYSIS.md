# Wheel Alignment Analysis System

## Overview

This document defines how the three competence wheels (Skills, Problems, Personas) connect and how we calculate alignment scores, detect gaps, and surface opportunities.

**Purpose**: Help users discover their "Founder DNA sweet spot" - where their skills, the problems they care about, and their ideal customers naturally align.

**Alignment Definition**: "This skill CAN help solve this problem" (capability-based, not attraction-based)

---

## Key Taxonomy Insights

From reading `/src/lib/wheelTaxonomy.js`:

1. **Skills** have a `valueCreated` field that describes the transformation (e.g., "Turning confusion into understanding")
2. **Problems** are organized by **Spheres of Impact**: Self → Relational → Community → World
3. **Personas** are **psychographic types** (not demographics) with a `coreDrive` field (Direction, Creation, Wholeness, etc.)
4. Each segment has `keywords` that help with AI classification

---

## The Three Wheels

### Skills Wheel (12 Segments)
What you're naturally good at.

| Segment ID | Display Name | Description |
|------------|--------------|-------------|
| clarifying | The Clarifier | Makes complex things simple, asks powerful questions |
| analyzing | The Analyzer | Breaks down data, finds patterns, logical thinking |
| strategizing | The Strategist | Plans paths forward, sees the big picture |
| organizing | The Organizer | Creates systems, structures, processes |
| building | The Builder | Makes things work, implements solutions |
| designing | The Designer | Shapes experiences, visual and UX thinking |
| creating | The Creator | Generates new ideas, innovation |
| expressing | The Expresser | Communicates powerfully, storytelling |
| connecting | The Connector | Brings people together, builds relationships |
| influencing | The Influencer | Persuades, inspires action, leadership |
| nurturing | The Nurturer | Supports growth, empathy, care |
| synthesizing | The Synthesizer | Combines ideas, sees connections others miss |

**Proficiency Rings**: Emerging → Establishing → Mastering

---

### Problems Wheel (12 Segments)
What problems you're passionate about solving.

| Segment ID | Display Name | Description |
|------------|--------------|-------------|
| economic_freedom | Economic Freedom | Financial independence, wealth building, career success |
| physical_vitality | Physical Vitality | Health, fitness, energy, longevity |
| mental_wellbeing | Mental Wellbeing | Emotional health, stress, anxiety, mindset |
| personal_mastery | Personal Mastery | Self-improvement, productivity, habits, growth |
| intimate_bonds | Intimate Bonds | Relationships, family, partnership, connection |
| local_impact | Local Impact | Community, local business, neighborhood improvement |
| service_care | Service & Care | Helping professions, caregiving, support systems |
| creative_expression | Creative Expression | Art, music, writing, creative pursuits |
| cultural_movements | Cultural Movements | Social change, trends, cultural shifts |
| social_justice | Social Justice | Equality, fairness, advocacy, rights |
| human_progress | Human Progress | Technology, innovation, advancing humanity |
| environmental | Environmental | Sustainability, nature, climate, conservation |

**Proficiency Rings**: Exploring → Pursuing → Proven

---

### Personas Wheel (12 Segments)
Who you want to serve.

| Segment ID | Display Name | Description |
|------------|--------------|-------------|
| career_changers | Career Changers | Professionals pivoting to new paths |
| founders | Founders | Entrepreneurs building businesses |
| executives | Executives | Leaders managing teams and organizations |
| creatives | Creatives | Artists, designers, content creators |
| parents | Parents | Those raising children |
| retirees | Retirees | Those transitioning out of traditional work |
| students | Students | Those in formal education |
| youth | Youth | Young people finding their path |
| hobbyists | Hobbyists | Passionate pursuers of interests |
| advocates | Advocates | Those fighting for causes |
| healers | Healers | Those in healing/helping professions |
| community_leaders | Community Leaders | Those building local movements |

**Journey Stages**: Awakening → Struggling → Ready

---

## Cross-Wheel Alignment Mappings

### Skills → Problems Mapping

This defines: "If you have THIS skill, you CAN help solve THESE problems."

| Skill | Value Created | Problems It Can Solve | Reasoning |
|-------|---------------|----------------------|-----------|
| **clarifying** | Turning confusion into understanding | `mental_wellbeing`, `personal_mastery`, `human_progress`, `economic_freedom` | Translators help explain emotions (therapy), teach skills (mastery), demystify tech (progress), simplify business concepts (freedom) |
| **analyzing** | Turning data into insight | `physical_vitality`, `economic_freedom`, `human_progress`, `planetary_health` | Pattern Spotters analyze health metrics, financial data, research findings, environmental data |
| **strategizing** | Turning goals into plans | `economic_freedom`, `personal_mastery`, `local_impact`, `human_progress` | Gamemakers create business strategy, life roadmaps, community plans, innovation strategy |
| **organizing** | Turning chaos into order | `economic_freedom`, `service_care`, `local_impact`, `personal_mastery` | Systems Architects build business operations, care coordination, team structure, productivity systems |
| **building** | Turning blueprints into reality | `economic_freedom`, `human_progress`, `creative_expression`, `local_impact` | Makers build products/businesses, tech solutions, creative tools, community platforms |
| **designing** | Turning function into experience | `creative_expression`, `economic_freedom`, `human_progress`, `mental_wellbeing` | Experience Crafters shape art/brand, product UX, tech interfaces, healing experiences |
| **creating** | Turning nothing into something | `creative_expression`, `cultural_movements`, `human_progress`, `economic_freedom` | Originators generate art, cultural content, innovations, new product ideas |
| **expressing** | Turning ideas into impact | `creative_expression`, `cultural_movements`, `mental_wellbeing`, `social_justice` | Voices tell stories, shape culture, provide therapeutic expression, advocate for causes |
| **connecting** | Turning strangers into allies | `intimate_bonds`, `local_impact`, `cultural_movements`, `service_care` | Bridge Builders deepen relationships, build communities, grow movements, connect caregivers |
| **influencing** | Turning resistance into momentum | `economic_freedom`, `cultural_movements`, `social_justice`, `personal_mastery` | Catalysts drive sales/business, influence culture, advocate causes, motivate growth |
| **nurturing** | Turning potential into performance | `mental_wellbeing`, `intimate_bonds`, `service_care`, `personal_mastery` | Growers provide emotional support, nurture relationships, give care, coach development |
| **synthesizing** | Turning fragments into wholeness | `personal_mastery`, `mental_wellbeing`, `human_progress`, `economic_freedom` | Integrators connect growth dots, see holistic health, unite innovations, build comprehensive strategy |

**REVIEW NEEDED**: Are these mappings accurate to the Nikigai framework? Should any skills map to different problems?

---

### Problems → Personas Mapping

This defines: "If you solve THIS problem, THESE personas (psychographic types) typically need it most."

| Problem | Sphere | Personas Who Face This | Reasoning |
|---------|--------|------------------------|-----------|
| **physical_vitality** | Self | `achievers`, `nurturers`, `protectors`, `healers` | High performers burning out, stressed caregivers, health-conscious security seekers, those recovering |
| **mental_wellbeing** | Self | `healers`, `seekers`, `nurturers`, `creators` | Those in pain, those who are lost/stressed, overwhelmed caregivers, emotional creatives |
| **personal_mastery** | Self | `teachers`, `builders`, `achievers`, `seekers` | Lifelong learners, those building skills, ambitious growers, those finding their path |
| **intimate_bonds** | Relational | `nurturers`, `seekers`, `healers`, `protectors` | Family-focused, those seeking relationship clarity, relationship trauma, wanting stability |
| **service_care** | Relational | `nurturers`, `healers`, `protectors`, `connectors` | Caring for family, those giving care, safety for loved ones, community care networks |
| **creative_expression** | Relational | `creators`, `seekers`, `explorers`, `visionaries` | Those wanting expression, finding their voice, artistic freedom, creative innovation |
| **local_impact** | Community | `builders`, `connectors`, `visionaries`, `nurturers` | Building community projects, bringing people together, local change agents, community care |
| **cultural_movements** | Community | `visionaries`, `challengers`, `creators`, `explorers` | Culture changers, norm disruptors, cultural creators, cultural explorers |
| **economic_freedom** | Community | `builders`, `achievers`, `explorers`, `seekers` | Building businesses, financial success driven, escaping 9-5, seeking career clarity |
| **social_justice** | World | `challengers`, `visionaries`, `connectors`, `explorers` | Fighting injustice, systemic change, collective action, liberation seekers |
| **planetary_health** | World | `challengers`, `visionaries`, `protectors`, `connectors` | Environmental advocates, sustainability innovators, planet protectors, collective action |
| **human_progress** | World | `visionaries`, `builders`, `teachers`, `achievers` | Future builders, tech builders, educators, field advancers |

**REVIEW NEEDED**: Do these persona mappings reflect your target user base? Are there obvious connections I've missed?

---

### Skills → Personas Mapping (Direct)

This is a secondary mapping: "Which personas naturally SEEK OUT people with this skill?"

| Skill | Personas Who Seek This | Reasoning |
|-------|------------------------|-----------|
| **clarifying** | `seekers`, `teachers`, `builders` | Lost people needing clarity, learners wanting explanations, entrepreneurs needing simplification |
| **analyzing** | `achievers`, `builders`, `protectors` | Data-driven achievers, analytical entrepreneurs, risk-assessing security seekers |
| **strategizing** | `builders`, `achievers`, `visionaries` | Entrepreneurs needing roadmaps, ambitious goal-setters, big-picture thinkers |
| **organizing** | `builders`, `nurturers`, `protectors` | Entrepreneurs needing systems, overwhelmed caregivers, stability seekers |
| **building** | `builders`, `visionaries`, `creators` | Entrepreneurs building products, innovators, creative tool seekers |
| **designing** | `creators`, `builders`, `visionaries` | Artists/creatives, product builders, experience innovators |
| **creating** | `creators`, `visionaries`, `explorers` | Artists needing inspiration, innovators, freedom seekers wanting new ideas |
| **expressing** | `creators`, `challengers`, `visionaries` | Creatives finding voice, advocates needing messaging, leaders communicating vision |
| **connecting** | `connectors`, `builders`, `seekers` | Network builders, entrepreneurs needing introductions, isolated people seeking community |
| **influencing** | `builders`, `challengers`, `achievers` | Entrepreneurs selling, advocates persuading, ambitious leaders |
| **nurturing** | `healers`, `nurturers`, `seekers` | Those recovering, caregivers needing support, lost people needing guidance |
| **synthesizing** | `visionaries`, `seekers`, `teachers` | Big-picture thinkers, those seeking meaning, integrative learners |

**REVIEW NEEDED**: Is this direct Skills→Personas mapping needed, or should alignment always flow through Problems?

---

## Alignment Score Calculation

### Formula

```
Total Alignment = (Skills→Problems × 0.4) + (Problems→Personas × 0.4) + (Skills→Personas × 0.2)
```

**Weighting Rationale**:
- Skills→Problems and Problems→Personas are the primary chains (40% each)
- Skills→Personas is a secondary validation check (20%)

### Calculation Steps

1. **Skills→Problems Score**:
   - For each lit skill, check if ANY of its mapped problems are also lit
   - Score = (skills with matching problems) / (total lit skills) × 100

2. **Problems→Personas Score**:
   - For each lit problem, check if ANY of its mapped personas are also lit
   - Score = (problems with matching personas) / (total lit problems) × 100

3. **Skills→Personas Score** (optional):
   - For each lit skill, check if ANY of its mapped personas are also lit
   - Score = (skills with matching personas) / (total lit skills) × 100

### Score Interpretation

| Score Range | Interpretation |
|-------------|----------------|
| 80-100% | Strong alignment - clear Founder DNA |
| 60-79% | Good alignment - solid foundation with room to refine |
| 40-59% | Moderate alignment - some connections, exploration needed |
| 20-39% | Weak alignment - mismatched focus areas |
| 0-19% | No alignment - wheels don't connect yet |

**REVIEW NEEDED**: Are these score ranges and interpretations appropriate? Should weighting be different?

---

## Gap Analysis

### Gap Types

| Gap Type | Detection Rule | Severity | User Message |
|----------|----------------|----------|--------------|
| **Missing Wheel** | One or more wheels have 0 lit segments | High | "Complete your [wheel] to see full alignment" |
| **Orphan Skill** | Lit skill with no matching lit problems | Medium | "Your [skill] skills don't connect to your current problem focus" |
| **Orphan Problem** | Lit problem with no matching lit personas | Medium | "You're solving [problem] but haven't identified who needs it most" |
| **Broken Chain** | Skill→Problem connection exists but Problem→Persona doesn't | Low | "Your [skill]→[problem] path needs a target audience" |
| **Proficiency Mismatch** | High proficiency skill connecting to low proficiency problem | Low | "Your strongest skill connects to an area you're still exploring" |

### Gap Priority

1. Missing Wheel (blocks all alignment)
2. Orphan Skills (you have capability without purpose)
3. Orphan Problems (you have passion without audience)
4. Broken Chains (incomplete paths)
5. Proficiency Mismatches (optimization opportunities)

---

## Opportunity Detection

### Opportunity Patterns

| Pattern | Detection Rule | Opportunity Type | User Message |
|---------|----------------|------------------|--------------|
| **Ready to Launch** | Skill (Mastering) + Problem (Proven) + Persona (Ready) all aligned | Immediate Action | "You're ready to serve [persona] with [problem] using your [skill] skills" |
| **Growth Path** | Skill (Establishing+) + Problem (Pursuing+) + Persona (Struggling+) aligned | Development | "Build your [problem] expertise to better serve [persona]" |
| **Emerging Sweet Spot** | All three aligned but at lowest proficiency levels | Exploration | "Early signs of alignment - keep exploring this direction" |
| **Skill Monetization** | Mastering skill with no aligned problems yet | Discovery Needed | "Your [skill] mastery could solve problems you haven't mapped yet" |
| **Audience Clarity** | Strong Skill→Problem alignment but no personas | Persona Discovery | "You know what you do and why - now discover who needs it most" |
| **Problem Validation** | Strong Skills + Personas but weak problem connection | Problem Discovery | "You have skills and know your audience - clarify the specific problem" |

### Opportunity Scoring

Each opportunity is scored by:
1. **Alignment strength** (0-100): How directly do the segments connect?
2. **Proficiency level** (0-100): Average proficiency across the aligned segments
3. **Completeness** (0-100): Are all three wheels represented?

```
Opportunity Score = (Alignment × 0.4) + (Proficiency × 0.3) + (Completeness × 0.3)
```

**REVIEW NEEDED**: Is this scoring formula appropriate? Should certain opportunities rank higher?

---

## Zarlo Integration

### How Zarlo Uses This Data

1. **Context Injection**: Wheel data is formatted into the AI prompt so Zarlo understands the user's Founder DNA

2. **Smart Recommendations**: Based on gaps and opportunities, Zarlo suggests next actions:
   - Missing wheel → "Let's discover your [problems/personas]"
   - Orphan skill → "Your [skill] could help with [suggested problems]"
   - Ready to launch → "You're aligned! Let's build your offer around [opportunity]"

3. **Coaching Prompts**: Zarlo asks questions based on wheel state:
   - Low alignment → "I notice your skills and problems don't quite connect yet. Tell me more about..."
   - High alignment → "Your Founder DNA is clear! What's holding you back from launching?"

### Zarlo Context Format

```
## Your Founder DNA

### Skills (What You Do)
- [Skill Name] (Proficiency Level)
- ...

### Problems (What You Solve)
- [Problem Name] (Proficiency Level)
- ...

### Personas (Who You Serve)
- [Persona Name] (Journey Stage)
- ...

### Alignment Score: X%
- Skills→Problems: X%
- Problems→Personas: X%

### Strong Alignments (Your Sweet Spots)
- [Skill] → [Problem] → [Persona]

### Gaps to Address
- [Gap description]

### Top Opportunity
- [Opportunity description with suggested action]
```

---

## Open Questions for Review

1. **Mapping Accuracy**: Are the Skills→Problems and Problems→Personas mappings accurate to the Nikigai framework?

2. **Weighting**: Should Skills→Problems be weighted equally to Problems→Personas? Or is one more important?

3. **Direct Skills→Personas**: Is this mapping needed, or should alignment always flow through Problems?

4. **Proficiency Impact**: How much should proficiency level affect alignment scores vs. just detecting connections?

5. **Opportunity Prioritization**: Which opportunity patterns are most actionable for users?

6. **Negative Patterns**: Should we detect and warn about anti-patterns (e.g., too scattered across segments)?

7. **Thresholds**: What alignment score should trigger "ready to launch" messaging? 70%? 80%?

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Mapping definitions | UPDATED | Based on full taxonomy review - awaiting your approval |
| Alignment calculation | NEEDS REVIEW | Formula documented above |
| Gap detection | NEEDS REVIEW | Rules documented above |
| Opportunity detection | NEEDS REVIEW | Patterns documented above |
| Zarlo integration | NEEDS REVIEW | Context format documented above |

**Note**: Mappings have been updated after reading the full `wheelTaxonomy.js` definitions. Each skill's `valueCreated` field was used to determine which problems it can solve.

**Next Steps**:
1. You review and approve/adjust the mappings
2. Confirm the scoring formula and thresholds
3. I implement `wheelAlignment.js` based on approved spec
4. Integrate with Zarlo
