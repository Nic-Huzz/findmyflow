# AI Insights Features

Documentation for the Problem-Solution Coverage Matrix and AI Niche Sharpener features.

**Created:** December 30, 2024
**Status:** Implemented, placement TBD

---

## 1. Problem-Solution Coverage Matrix

### What It Does

A visual grid that shows how your skills align with the problems you can solve. It calculates "fit" scores based on tag overlap between your skill clusters and problem clusters from the Flow Finder flows.

### Visual Example

```
                    │ Teaching &    │ Strategic    │ Creative
                    │ Mentoring     │ Thinking     │ Problem Solving
────────────────────┼───────────────┼──────────────┼─────────────────
Burnout Recovery    │  75% (green)  │ 40% (yellow) │  15% (gray)
────────────────────┼───────────────┼──────────────┼─────────────────
Career Transitions  │  60% (yellow) │ 85% (green)  │  35% (orange)
────────────────────┼───────────────┼──────────────┼─────────────────
Creative Blocks     │  25% (orange) │ 30% (orange) │  90% (green)
```

### Color Coding

| Color | Score Range | Meaning |
|-------|-------------|---------|
| Green | 60%+ | Strong match - high tag overlap |
| Yellow | 40-60% | Good match - moderate overlap |
| Orange | 20-40% | Weak match - some overlap |
| Gray | <20% | Gap - little to no overlap |

### How Scores Are Calculated

1. Extracts all tags from each cluster's items (skill_verb, domain_topic, value, problem_theme, etc.)
2. Compares tags between a skill cluster and problem cluster
3. Uses weighted Jaccard similarity:
   - `domain_topic`: 2.0x weight
   - `problem_theme`: 1.5x weight
   - `value`: 1.5x weight
   - `skill_verb`: 1.0x weight
   - Other tags: 0.5-0.8x weight

### Features

- **Summary stats**: Shows count of strong matches, average coverage %, and gaps
- **Click to expand**: Click any cell to see which specific tags matched
- **Legend**: Color-coded legend for quick reference
- **Responsive**: Works on mobile with horizontal scroll

### Use Cases

1. **Before building an offer**: See which skill/problem combo is strongest
2. **Finding gaps**: Identify problems you want to solve but lack skills for
3. **Validating positioning**: Confirm your chosen niche has strong coverage

### Current Location

`Library of Answers` → `Flow Finder` tab → "Coverage Matrix" button

### Files

- Component: `/src/components/CoverageMatrix.jsx`
- Styles: `/src/components/CoverageMatrix.css`

### Potential Alternative Placements

1. **Offer Builder** - As a step before creating attraction offer
2. **FlowFinderIntegration** - Help users choose their combo
3. **Project Summary** - Project-specific view

---

## 2. AI Niche Sharpener

### What It Does

Uses Claude Haiku 3.5 to analyze ALL your discovery data and generate a sharper, more differentiated market positioning. It pulls from:

- Skills clusters
- Problems clusters
- Persona clusters
- Customer persona profile (pain level, problem area, income level)
- Existing attraction offers

### What It Returns

| Section | Description |
|---------|-------------|
| **Current Positioning** | Analysis of where you are now based on your data |
| **Niche Statement** | Sharp, specific statement (15-25 words): "I help [audience] [outcome] through [approach]" |
| **Positioning Statement** | Marketing-ready: "For [target], unlike [alternatives], we [differentiator], so that [benefit]" |
| **Unique Advantage** | What makes you uniquely qualified based on your experience |
| **Refinement Options** | 2-3 ways to further sharpen, with pros/cons for each |
| **Action Items** | 3 specific next steps to take |

### Example Output

```
NICHE STATEMENT:
"I help burnt-out tech professionals rediscover their creative passion
through nervous system regulation and ikigai-based career design."

POSITIONING STATEMENT:
"For tech workers experiencing burnout, unlike generic career coaches
who focus on resume optimization, we address the root nervous system
patterns blocking your flow, so that you can build a career aligned
with your natural energy."

UNIQUE ADVANTAGE:
"Your personal experience with burnout recovery combined with your
teaching background gives you both the empathy and methodology to
guide others through this transition."

REFINEMENT OPTIONS:
1. Narrow to senior engineers only (Pros: higher ticket, Cons: smaller market)
2. Focus on creative side projects (Pros: unique angle, Cons: less urgent pain)
3. Add team/org consulting (Pros: B2B revenue, Cons: different sales process)
```

### Technical Details

- **Model**: Claude 3.5 Haiku (`claude-3-5-haiku-20241022`)
- **Response format**: Structured JSON via tool calling
- **Latency**: ~5-10 seconds
- **Cost**: Very low (Haiku pricing)

### Features

- **Copy to clipboard**: One-click copy of niche statement
- **Expandable refinements**: Click to see pros/cons
- **Regenerate**: Get fresh analysis with same data
- **Data source badge**: Shows what data was analyzed

### Current Location

`Library of Answers` → `Flow Finder` tab → "AI Niche Sharpener" button

### Files

- Edge Function: `/supabase/functions/niche-sharpener/index.ts`
- Component: `/src/components/NicheSharpener.jsx`
- Styles: `/src/components/NicheSharpener.css`

### Potential Alternative Placements

1. **Offer Builder** - First step before building attraction offer
2. **Dedicated page** - `/niche-sharpener` route
3. **Project onboarding** - When creating a new project
4. **7-Day Challenge** - As a quest/milestone

---

## Integration Notes

Both features are currently integrated into `LibraryOfAnswers.jsx`:

```jsx
// Shows when user has both skills and problems clusters
{skillsClusters.length > 0 && problemsClusters.length > 0 && (
  <div className="ai-tools-container">
    <div className="ai-tools-header">AI-Powered Insights</div>
    <div className="ai-tools-buttons">
      <button onClick={() => setShowCoverageMatrix(!showCoverageMatrix)}>
        Coverage Matrix
      </button>
      <button onClick={() => setShowNicheSharpener(!showNicheSharpener)}>
        AI Niche Sharpener
      </button>
    </div>
  </div>
)}
```

### Dependencies

Both require completed Flow Finder flows:
- **Coverage Matrix**: Needs skills + problems clusters
- **Niche Sharpener**: Needs skills + problems (personas/offers optional but enhance results)

---

## Future Enhancements

### Coverage Matrix
- [ ] Add persona dimension (3D view)
- [ ] Show which combos have existing offers
- [ ] Export as image for pitches
- [ ] Project-specific filtering

### Niche Sharpener
- [ ] Save preferred niche statement to project
- [ ] A/B test different niche statements
- [ ] Track changes over time
- [ ] Integrate with validation surveys (test niche with real people)

---

## Decision Needed

**Where should these live permanently?**

| Option | Pros | Cons |
|--------|------|------|
| Library of Answers | Central location, easy to find | Not in workflow |
| Offer Builder (before flow) | In natural workflow | May overwhelm new users |
| Separate dedicated pages | Clear purpose | More navigation |
| Both locations | Flexible access | Code duplication concerns |

Recommend: **Offer Builder pre-step** with link from Library of Answers.

---

## 3. Pattern Insight Card (Future)

### What It Does

Displays a single, personalized insight at the top of the Groans Summary page based on the user's data patterns. Makes raw stats feel actionable and helps users feel "seen".

### Data Sources

- `quest_completions` - All groan completions with response_data
- Calculated percentages: fears, layers, areas, essence/protective balance

### Pattern Detection Rules

| Pattern | Trigger | Example Output |
|---------|---------|----------------|
| Fear Avoidance | One fear < 10% while others > 30% | "You face 'Judged' fears often but avoid 'Might Fail' - consider pushing into failure territory" |
| Layer Plateau | Stuck at one layer for 3+ weeks | "You're comfortable at SCREEN level - ready to try a LIVE challenge?" |
| Area Blind Spot | One area at 0% with 5+ total groans | "Work and Self show up often, but Family hasn't appeared - worth exploring?" |
| Voice Imbalance | Essence or Protective > 80% | "You're very connected to your Essence - don't forget to acknowledge your Protective voice too" |
| Comfort Zone | Same fear + layer combo 3+ times | "You keep facing 'Judged' at SCREEN level - time to level up?" |
| Growth Celebration | New layer conquered | "You just conquered your first TRIBE challenge! How did it feel?" |

### Technical Approach

- **Phase 1**: Rule-based pattern detection (no AI needed)
- **Phase 2**: AI-generated insights using Claude Haiku
- **Caching**: Generate once per day, cache result
- **Fallback**: If no strong pattern, show encouragement or tip

### Implementation Priority

High - This is the "soul" of the summary page. Without it, percentages feel like raw data rather than guidance.

---

## 4. Fear Pattern Insights (Future)

### What It Does

After 4+ weeks of groan challenge data, analyzes patterns in which fears the user tends to avoid vs. confront, providing actionable insights.

### Data Sources

- `quest_completions` - All groan-related completions with response_data
- `groan_reflections` - Fear selections, layer choices, outcomes
- `weekly_plans` - Weekly groan selections and completion status

### What It Returns

| Section | Description |
|---------|-------------|
| **Fear Avoidance Pattern** | "You've faced 'Judged' 5 times but avoided 'Might Fail'" |
| **Layer Comfort Zone** | Which visibility layers they stay in vs. push beyond |
| **Growth Edges** | Specific suggestions for where to push next |
| **Progress Timeline** | Visual of fear confrontation over time |

### Example Output

```
FEAR AVOIDANCE PATTERN:
"You frequently confront 'Judged' fears (7 times) but tend to avoid
'Might Fail' situations. This might indicate underlying perfectionism."

LAYER COMFORT ZONE:
"You're comfortable at SCREEN and LIVE levels but haven't ventured
into TRIBE, MONEY, or HEART visibility layers yet."

GROWTH EDGES:
1. Try a groan challenge involving your inner circle (TRIBE level)
2. Pick a task with potential for failure, not just judgment
3. Consider a money-related visibility challenge when ready

BLIND SPOT ALERT:
"No 'Not Enough' fears logged in 6 weeks - either you've mastered
this fear, or it might be worth exploring why you avoid it."
```

### Technical Approach

- **Trigger**: Auto-generate after 4+ weeks of groan data
- **Model**: Claude 3.5 Haiku for analysis
- **Location**: GroansSummary page or dedicated insights section

### Implementation Notes

1. Aggregate fear counts from `quest_completions.response_data`
2. Compare against total available groan challenges
3. Identify patterns using simple statistical analysis
4. Use AI to generate human-readable insights
5. Cache results weekly to avoid repeated API calls

---

## 5. Smart Groan Suggestions (Future)

### What It Does

Uses Nervous System calibration data + past groan history to suggest the optimal next groan challenge - one that pushes growth without overwhelming the user.

### Data Sources

- `nervous_system_responses` - Visibility boundaries, earning limits, safety contracts
- `groan_reflections` - Past groan outcomes and intensity ratings
- `weekly_plans` - Current week type (Push/Flow/Rest/Launch)
- `challenge_progress` - Current streak and momentum

### Algorithm

```
1. Get user's NS visibility boundary (e.g., stuck at LIVE level)
2. Get their most recent groan outcomes (better/expected/harder)
3. Factor in current week type:
   - Push Week → suggest next layer up
   - Flow Week → suggest comfort zone + slight stretch
   - Rest Week → suggest easiest layer
   - Launch Week → suggest whatever supports launch goals
4. Consider streak:
   - Long streak → can handle bigger push
   - Streak at risk → suggest achievable win
5. Generate 2-3 suggestions ranked by fit
```

### What It Returns

| Section | Description |
|---------|-------------|
| **Recommended Challenge** | Top pick with reasoning |
| **Alternative Options** | 2 other options for different moods |
| **Stretch Challenge** | Optional harder option for high-momentum days |
| **Why This Fits** | Personalized explanation based on their data |

### Example Output

```
RECOMMENDED FOR YOU THIS WEEK:
"Post a vulnerable reflection on social media (SCREEN level)"

WHY THIS FITS:
- Your week type is FLOW (moderate push)
- You've successfully completed 3 SCREEN challenges
- Your NS data shows LIVE is your current edge
- This builds momentum without overwhelming

ALTERNATIVES:
1. "Ask for feedback from a colleague" (TRIBE level) - Bigger stretch
2. "Share a behind-the-scenes story" (SCREEN level) - Easier win

STRETCH OPTION (if feeling bold):
"Go live on Instagram for 5 minutes" (LIVE level)
This would push your visibility boundary by one level.
```

### Technical Approach

- **Trigger**: When user opens Weekly Planning Flow or Groans tab
- **Model**: Claude 3.5 Haiku for personalization
- **Caching**: Cache suggestions for current week, regenerate on new week
- **Fallback**: If no NS data, suggest based on week type only

### Integration Points

1. **Weekly Planning Flow** - Show during groan selection step
2. **Groans Tab** - "Suggested for You" section at top
3. **Push Notifications** - "This week's groan suggestion"

---

## 6. Implementation Priority

| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| Coverage Matrix | ✅ Done | - | High |
| Niche Sharpener | ✅ Done | - | High |
| Pattern Insight Card | High | Low | Very High |
| Fear Pattern Insights | Medium | Medium | High |
| Smart Groan Suggestions | High | Medium | Very High |

**Recommended Next Steps:**
1. Implement Pattern Insight Card first (low effort, high impact, rule-based)
2. Implement Smart Groan Suggestions (enables weekly planning)
3. Add Fear Pattern Insights after 4+ weeks of user data exists
