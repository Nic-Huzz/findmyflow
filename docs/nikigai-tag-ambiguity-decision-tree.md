# Nikigai Tag Ambiguity Decision Tree

## Overview

This decision tree helps AI consistently categorize ambiguous concepts into the correct tag types. Use this as a reference when extracting tags from user responses.

---

## The 7 Tag Types (Quick Reference)

1. **skill_verb** — Actions/abilities (designing, building, teaching)
2. **domain_topic** — Fields/subjects (UX, education, psychology)
3. **value** — Principles/beliefs (integrity, growth, authenticity)
4. **emotion** — Feeling words (joy, fear, excitement, frustration)
5. **context** — Situations/environments (team settings, solo work, remote)
6. **problem_theme** — Challenges/pain points (burnout, disconnection, uncertainty)
7. **persona_hint** — WHO they serve/identify with (parents, creatives, professionals)

---

## Decision Tree

### START: Identify the Concept Type

```
┌─────────────────────────────────────┐
│  What is the user expressing?       │
└──────────────┬──────────────────────┘
               │
               ├─► Is it an ACTION? ──────────► skill_verb
               │
               ├─► Is it a TOPIC/FIELD? ──────► domain_topic
               │
               ├─► Is it a PRINCIPLE? ────────► value
               │
               ├─► Is it a FEELING? ──────────► emotion
               │
               ├─► Is it a SITUATION? ────────► context
               │
               ├─► Is it a PROBLEM? ──────────► problem_theme
               │
               └─► Is it about WHO? ──────────► persona_hint
```

---

## Detailed Decision Rules

### Rule 1: ACTION vs. PRINCIPLE

**Ambiguous concepts:** creativity, leadership, innovation, empathy

**Decision Logic:**

```
IF the word describes DOING something
  → skill_verb (use the verb form)

IF the word describes a GUIDING PRINCIPLE
  → value (use the noun form)
```

**Examples:**

| User said | Tag type | Tagged as | Reasoning |
|-----------|----------|-----------|-----------|
| "I love creating things" | skill_verb | creating | Action - they DO it |
| "Creativity is important to me" | value | creativity | Principle - guides their choices |
| "I led a team project" | skill_verb | leading | Action - they DID it |
| "Leadership matters in my work" | value | leadership | Principle - what they value |
| "I practice empathy with clients" | skill_verb | empathizing | Action - they DO it |
| "Empathy is core to who I am" | value | empathy | Principle - core belief |

**Rule of thumb:** If you can add "-ing" to make it an action, it's likely a skill_verb. If it's a belief/principle, it's a value.

---

### Rule 2: FEELING vs. PROBLEM

**Ambiguous concepts:** burnout, anxiety, frustration, loneliness

**Decision Logic:**

```
IF it's a temporary EMOTIONAL STATE
  → emotion

IF it's a recurring CHALLENGE or PATTERN
  → problem_theme
```

**Examples:**

| User said | Tag type | Tagged as | Reasoning |
|-----------|----------|-----------|-----------|
| "I felt frustrated during that project" | emotion | frustration | Temporary feeling |
| "I'm passionate about solving workplace frustration" | problem_theme | workplace frustration | Recurring problem they want to solve |
| "I experienced anxiety before presentations" | emotion | anxiety | Temporary state |
| "I help people overcome anxiety in social settings" | problem_theme | social anxiety | Recurring challenge they address |
| "That moment made me feel lonely" | emotion | loneliness | Temporary feeling |
| "I work with people experiencing chronic loneliness" | problem_theme | chronic loneliness | Ongoing problem they care about |

**Rule of thumb:** Context matters! If describing their OWN momentary experience → emotion. If describing a PROBLEM they want to solve for others → problem_theme.

---

### Rule 3: TOPIC vs. SKILL

**Ambiguous concepts:** design, music, psychology, writing

**Decision Logic:**

```
IF it's a FIELD OF KNOWLEDGE or SUBJECT AREA
  → domain_topic

IF it's something they actively DO
  → skill_verb (convert to verb form)
```

**Examples:**

| User said | Tag type | Tagged as | Reasoning |
|-----------|----------|-----------|-----------|
| "I studied psychology" | domain_topic | psychology | Field of study |
| "I analyze people's motivations" | skill_verb | analyzing | Action they perform |
| "I love design" | domain_topic | design | Field/domain |
| "I design websites" | skill_verb | designing | Action they perform |
| "I learned about music theory" | domain_topic | music | Field of study |
| "I compose music" | skill_verb | composing | Action they perform |

**Rule of thumb:** Would this appear as a course catalog category or job industry? → domain_topic. Is it a verb of what they DO? → skill_verb.

---

### Rule 4: WHO vs. VALUE

**Ambiguous concepts:** "helping others," "serving communities," "supporting families"

**Decision Logic:**

```
IF it identifies a specific GROUP of people
  → persona_hint

IF it describes a guiding principle without specifying WHO
  → value
```

**Examples:**

| User said | Tag type | Tagged as | Reasoning |
|-----------|----------|-----------|-----------|
| "I care about helping people" | value | service, helpfulness | General principle |
| "I help parents navigate career transitions" | persona_hint | parents in transition | Specific group |
| "Community matters to me" | value | community | Principle/belief |
| "I serve the startup founder community" | persona_hint | startup founders | Specific group |
| "Supporting others energizes me" | value | support | General principle |
| "I support mid-career women in tech" | persona_hint | mid-career women in tech | Specific group |

**Rule of thumb:** Can you name the specific demographic/identity? → persona_hint. Is it a broad principle? → value.

---

### Rule 5: SITUATION vs. TOPIC

**Ambiguous concepts:** "remote work," "team settings," "corporate environments"

**Decision Logic:**

```
IF it describes WHERE or HOW they work
  → context

IF it's a field/industry they work IN
  → domain_topic
```

**Examples:**

| User said | Tag type | Tagged as | Reasoning |
|-----------|----------|-----------|-----------|
| "I thrive in remote work settings" | context | remote work | Working condition |
| "I work in the remote work technology space" | domain_topic | remote work tech | Industry/field |
| "I love collaborating in team environments" | context | team collaboration | Working style |
| "I study team dynamics and organizational behavior" | domain_topic | organizational behavior | Field of study |
| "I prefer solo work" | context | solo work | Working condition |
| "I consult in the solopreneur space" | domain_topic | entrepreneurship | Industry/field |

**Rule of thumb:** Is it a CONDITION of work (how, where, with whom)? → context. Is it a FIELD or INDUSTRY? → domain_topic.

---

### Rule 6: PROBLEM vs. VALUE

**Ambiguous concepts:** "lack of purpose," "disconnection," "inequality"

**Decision Logic:**

```
IF it describes something WRONG that needs fixing
  → problem_theme

IF it describes something RIGHT to strive for
  → value
```

**Examples:**

| User said | Tag type | Tagged as | Reasoning |
|-----------|----------|-----------|-----------|
| "I struggled with lack of purpose" | problem_theme | lack of purpose | Something wrong |
| "Purpose is what drives me" | value | purpose | Something to strive for |
| "I experienced disconnection from my work" | problem_theme | workplace disconnection | Problem they faced |
| "Connection is core to everything I do" | value | connection | Guiding principle |
| "I care about addressing inequality" | problem_theme | inequality | Problem to solve |
| "Fairness guides my decisions" | value | fairness | Principle to uphold |

**Rule of thumb:** Frame it as positive vs. negative. Negative = problem_theme. Positive = value.

---

## Multi-Tag Scenarios

Some concepts should receive **multiple tags** to capture full meaning.

### Example 1: "I love teaching design to beginners"

**Tags:**
- skill_verb: `teaching`, `designing`
- domain_topic: `design`, `education`
- persona_hint: `beginners`, `design learners`

### Example 2: "I help burned-out professionals find purpose through creative expression"

**Tags:**
- persona_hint: `burned-out professionals`
- problem_theme: `burnout`, `lack of purpose`
- domain_topic: `career coaching`, `creativity`
- skill_verb: `guiding`, `facilitating`
- value: `purpose`, `self-expression`

### Example 3: "Building inclusive team cultures in remote tech companies"

**Tags:**
- skill_verb: `building`, `fostering`
- value: `inclusion`, `belonging`
- context: `remote work`, `team settings`
- domain_topic: `tech`, `organizational culture`
- persona_hint: `remote tech teams`

---

## Edge Cases & How to Handle

### Edge Case 1: Noun vs. Verb Ambiguity

**User says:** "Design"

**Solution:** Look at surrounding context
- "I studied design" → domain_topic
- "I design products" → skill_verb (`designing`)
- "Good design matters to me" → value

### Edge Case 2: Abstract Concepts

**User says:** "Flow state," "presence," "mindfulness"

**Decision:**
- If describing their EXPERIENCE → emotion (`flow`, `presence`)
- If describing what they TEACH → skill_verb (`cultivating presence`)
- If it's a guiding PRINCIPLE → value (`mindfulness`)

### Edge Case 3: Demographics in Values

**User says:** "I value diversity"

**Tags:**
- value: `diversity`, `inclusion`
- (Do NOT tag as persona_hint unless they specify WHO they serve)

### Edge Case 4: Industry + Action

**User says:** "Product management"

**Decision:** Extract BOTH
- domain_topic: `product management`
- skill_verb: `managing`, `strategizing`, `prioritizing`

(Look at context to identify the actions within that domain)

---

## AI Extraction Prompt Template

Use this prompt structure for Claude API:

```
Extract tags from this user response:
"{user_response}"

Use these tag types:
1. skill_verb — actions (use -ing form: designing, teaching)
2. domain_topic — fields/subjects (UX, education, psychology)
3. value — principles (integrity, growth, connection)
4. emotion — feelings (joy, fear, excitement)
5. context — situations (remote work, team settings)
6. problem_theme — challenges (burnout, disconnection)
7. persona_hint — who they serve (parents, creatives, mid-career professionals)

DECISION RULES:
- Action words → skill_verb (use verb form)
- Fields/subjects → domain_topic
- Principles/beliefs → value
- Temporary feelings → emotion
- Recurring challenges → problem_theme
- Working conditions → context
- Specific groups of people → persona_hint

EXAMPLES:
- "I love creating digital art" → skill_verb: [creating], domain_topic: [digital art]
- "Helping burned-out teachers" → persona_hint: [burned-out teachers], problem_theme: [teacher burnout]
- "Purpose drives me" → value: [purpose]

Return as JSON:
{
  "skill_verb": ["verb1", "verb2"],
  "domain_topic": ["topic1"],
  "value": ["value1"],
  "emotion": [],
  "context": [],
  "problem_theme": [],
  "persona_hint": []
}

Only include tags that clearly appear in the response. Empty arrays are fine.
```

---

## Testing Your Decision

Ask yourself these questions:

1. **Is it an action?** → skill_verb
2. **Is it a field of knowledge?** → domain_topic
3. **Is it a guiding principle?** → value
4. **Is it a temporary feeling?** → emotion
5. **Is it a recurring problem?** → problem_theme
6. **Is it a working condition?** → context
7. **Is it a specific group?** → persona_hint

If it fits multiple categories, **use multiple tags**.

---

## Common Mistakes to Avoid

❌ **Tagging nouns as skills**
- Wrong: skill_verb: `creativity`
- Right: skill_verb: `creating` OR value: `creativity`

❌ **Confusing problems with values**
- Wrong: value: `burnout`
- Right: problem_theme: `burnout` OR value: `sustainable work`

❌ **Missing persona hints**
- Wrong: "I help people" → No tags
- Right: persona_hint: `people in career transition` (if they specified)

❌ **Over-tagging vague concepts**
- User says: "I like helping"
- Don't force a persona_hint if they didn't specify WHO
- Tag as: value: `service`, `helpfulness`

❌ **Forgetting context tags**
- User says: "I thrive in fast-paced startup environments"
- Don't forget: context: `fast-paced`, `startup environments`

---

## Decision Tree Flowchart

```
                    ┌──────────────────┐
                    │  Ambiguous Word  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Is it an action? │
                    └────────┬─────────┘
                         Yes │ No
                             │
                    ┌────────▼─────────┐
                    │   skill_verb     │
                    │ (use -ing form)  │
                    └──────────────────┘
                             │
                             No
                             │
                    ┌────────▼─────────┐
                    │ Is it a field/   │
                    │     topic?       │
                    └────────┬─────────┘
                         Yes │ No
                             │
                    ┌────────▼─────────┐
                    │  domain_topic    │
                    └──────────────────┘
                             │
                             No
                             │
                    ┌────────▼─────────┐
                    │ Is it a guiding  │
                    │    principle?    │
                    └────────┬─────────┘
                         Yes │ No
                             │
                    ┌────────▼─────────┐
                    │      value       │
                    └──────────────────┘
                             │
                             No
                             │
                    ┌────────▼─────────┐
                    │ Is it a feeling? │
                    └────────┬─────────┘
                         Yes │ No
                             │
                    ┌────────▼─────────┐
                    │     emotion      │
                    └──────────────────┘
                             │
                             No
                             │
                    ┌────────▼─────────┐
                    │Is it a recurring │
                    │    problem?      │
                    └────────┬─────────┘
                         Yes │ No
                             │
                    ┌────────▼─────────┐
                    │  problem_theme   │
                    └──────────────────┘
                             │
                             No
                             │
                    ┌────────▼─────────┐
                    │ Is it a working  │
                    │   condition?     │
                    └────────┬─────────┘
                         Yes │ No
                             │
                    ┌────────▼─────────┐
                    │     context      │
                    └──────────────────┘
                             │
                             No
                             │
                    ┌────────▼─────────┐
                    │ Is it a specific │
                    │      group?      │
                    └────────┬─────────┘
                         Yes │ No
                             │
                    ┌────────▼─────────┐
                    │  persona_hint    │
                    └──────────────────┘
                             │
                             No
                             │
                    ┌────────▼─────────┐
                    │   Tag as OTHER   │
                    │  or skip if too  │
                    │     vague        │
                    └──────────────────┘
```

---

## Implementation Checklist

- [ ] Integrate decision rules into AI extraction prompts
- [ ] Add examples to extraction prompts for clarity
- [ ] Test with ambiguous user responses
- [ ] Track categorization consistency across different responses
- [ ] Build feedback loop if users flag incorrect categorizations
- [ ] Create validation layer to check for common mistakes
- [ ] Update Alfred system prompt with decision tree reference
- [ ] Add edge case handling for abstract concepts

---

**Status:** Ready for implementation
**Priority:** High (addresses 65% confidence concern on tag ambiguity)
**Estimated effort:** 1 day to integrate into extraction logic
