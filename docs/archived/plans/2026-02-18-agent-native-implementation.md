# Agent-Native FindMyFlow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make FindMyFlow's 6 Money Model business flows navigable by AI agents, starting with an auto-generated `llms-full.txt` knowledge file and followed by a Supabase Edge Function API for saving results.

**Architecture:** A Node script reads the existing JSON question files, offer/scoring files, and implementation checklists, then merges them with hand-authored agent context to produce `public/llms-full.txt`. This keeps the generated output permanently in sync with the app's actual data. Phase 2 adds a single Edge Function for programmatic result submission.

**Tech Stack:** Node.js script (generator), JSON (agent context), Supabase Edge Functions + Deno (Phase 2), React (API key UI)

**Vision doc:** `docs/plans/2026-02-18-agent-native-vision.md`

---

## Source Files

The generator reads from these existing files (same ones the web app uses):

| Flow | Questions | Offers/Scoring | Checklists |
|------|-----------|---------------|------------|
| Attraction Offer | `public/attraction-offer-questions.json` | `public/Money Model/Attraction/offers.json` | `public/Money Model/Attraction/implementation_checklists.json` |
| Upsell | `public/upsell-questions.json` | `public/Money Model/Upsell/offers.json` | `public/Money Model/Upsell/implementation_checklists.json` |
| Downsell | `public/downsell-questions.json` | `public/Money Model/Downsell/offers.json` | `public/Money Model/Downsell/implementation_checklists.json` |
| Continuity | `public/continuity-questions.json` | `public/Money Model/Continuity/offers.json` | `public/Money Model/Continuity/implementation_checklists.json` |
| Leads Strategy | `public/leads-strategy-questions.json` | `public/leads-strategy-offers.json` | N/A |
| Lead Magnet | `public/lead-magnet-questions.json` | `public/lead-magnet-offers.json` | N/A |

Also read:
- `src/flows/moneyModelConfigs.js` — flow metadata (names, DB tables, stage groups)
- `src/flows/MoneyModelFlowBase.jsx:269-318` — scoring algorithm (reference for the explanation)
- `public/Money Model/Attraction/results_templates.json` — confidence thresholds

---

## Phase 1: The Guide's Brain

### Task 1: Create the Generator Script

**Files:**
- Create: `scripts/generate-llms-full.js`

**Step 1: Write the generator**

The script:
1. Reads the hand-authored content files (Tasks 2 & 3)
2. Reads all 6 question JSONs
3. Reads all 6 offer JSONs (scoring weights, disqualifiers, descriptions)
4. Reads the 4 implementation checklist JSONs
5. For each flow, generates:
   - Purpose & "when to use" section
   - All questions with options, merged with hand-authored agent context
   - Full scoring matrix (auto-generated table from offer scoring_weights)
   - All possible outcomes with descriptions, disqualifiers, and top actions
6. Assembles the final file: header → framework overview → 6 flow sections → guidance footer
7. Writes to `public/llms-full.txt`

```javascript
#!/usr/bin/env node
/**
 * Generates public/llms-full.txt from:
 * - public/agent-context/framework-overview.md (hand-authored)
 * - public/agent-context/guidance.md (hand-authored)
 * - public/agent-context/flows/*.json (hand-authored agent hints per question)
 * - public/*-questions.json (app source of truth)
 * - public/Money Model/*/offers.json + public/*-offers.json (app source of truth)
 * - public/Money Model/*/implementation_checklists.json (app source of truth)
 *
 * Run: node scripts/generate-llms-full.js
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const read = (p) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf-8'))
const readText = (p) => readFileSync(resolve(ROOT, p), 'utf-8')

// Flow definitions — maps to moneyModelConfigs.js
const FLOWS = [
  {
    id: 'attraction_offer',
    name: 'Attraction Offer',
    questionsPath: 'public/attraction-offer-questions.json',
    offersPath: 'public/Money Model/Attraction/offers.json',
    checklistsPath: 'public/Money Model/Attraction/implementation_checklists.json',
    contextPath: 'public/agent-context/flows/attraction-offer.json'
  },
  {
    id: 'upsell_offer',
    name: 'Upsell Offer',
    questionsPath: 'public/upsell-questions.json',
    offersPath: 'public/Money Model/Upsell/offers.json',
    checklistsPath: 'public/Money Model/Upsell/implementation_checklists.json',
    contextPath: 'public/agent-context/flows/upsell.json'
  },
  {
    id: 'downsell_offer',
    name: 'Downsell Offer',
    questionsPath: 'public/downsell-questions.json',
    offersPath: 'public/Money Model/Downsell/offers.json',
    checklistsPath: 'public/Money Model/Downsell/implementation_checklists.json',
    contextPath: 'public/agent-context/flows/downsell.json'
  },
  {
    id: 'continuity_offer',
    name: 'Continuity Offer',
    questionsPath: 'public/continuity-questions.json',
    offersPath: 'public/Money Model/Continuity/offers.json',
    checklistsPath: 'public/Money Model/Continuity/implementation_checklists.json',
    contextPath: 'public/agent-context/flows/continuity.json'
  },
  {
    id: 'leads_strategy',
    name: 'Leads Strategy (Core Four)',
    questionsPath: 'public/leads-strategy-questions.json',
    offersPath: 'public/leads-strategy-offers.json',
    checklistsPath: null,
    contextPath: 'public/agent-context/flows/leads-strategy.json'
  },
  {
    id: 'lead_magnet_offer',
    name: 'Lead Magnet',
    questionsPath: 'public/lead-magnet-questions.json',
    offersPath: 'public/lead-magnet-offers.json',
    checklistsPath: null,
    contextPath: 'public/agent-context/flows/lead-magnet.json'
  }
]

function generateScoringMatrix(questions, offers) {
  // Build header: | Question/Answer | Offer1 | Offer2 | ... |
  const offerNames = offers.map(o => o.name)
  let table = `| Question / Answer |`
  offerNames.forEach(name => { table += ` ${name} |` })
  table += '\n|---|'
  offerNames.forEach(() => { table += '---|' })
  table += '\n'

  questions.forEach(q => {
    q.options.forEach(opt => {
      const normalizedQId = q.id.replace(/^q(\d+)/, 'Q$1')
      table += `| ${q.id}: ${opt.value} |`
      offers.forEach(offer => {
        const weight = offer.scoring_weights?.[normalizedQId]?.[opt.value]
        table += ` ${weight !== undefined ? (weight >= 0 ? '+' + weight : weight) : '0'} |`
      })
      table += '\n'
    })
  })
  return table
}

function generateFlowSection(flow) {
  const questions = read(flow.questionsPath)
  const questionsArr = questions.questions || questions
  const offers = read(flow.offersPath)
  const checklists = flow.checklistsPath && existsSync(resolve(ROOT, flow.checklistsPath))
    ? read(flow.checklistsPath) : null
  const context = existsSync(resolve(ROOT, flow.contextPath))
    ? read(flow.contextPath) : {}

  let out = `## Assessment: ${flow.name}\n\n`
  out += `**Flow ID:** \`${flow.id}\`\n`
  out += `**Purpose:** ${context.purpose || 'See framework overview.'}\n`
  out += `**When to use:** ${context.when_to_use || 'When the user needs guidance on this area.'}\n\n`

  // Questions
  out += `### Questions\n\n`
  questionsArr.forEach((q, i) => {
    const qContext = context.questions?.[q.id] || {}
    out += `#### Q${i + 1}: ${q.question}\n`
    if (q.subtext) out += `*${q.subtext}*\n`
    out += `**Options:**\n`
    q.options.forEach(opt => {
      out += `- \`${opt.value}\` — ${opt.label}${opt.description ? ': ' + opt.description : ''}\n`
    })
    out += '\n'
    if (qContext.agent_context) {
      out += `**Agent context:** ${qContext.agent_context}\n\n`
    }
    if (qContext.if_unknown) {
      out += `**If you don't know:** ${qContext.if_unknown}\n\n`
    }
  })

  // Scoring matrix
  out += `### Scoring Matrix\n\n`
  out += generateScoringMatrix(questionsArr, offers)
  out += '\n'

  // Disqualifiers
  out += `### Disqualifiers\n\n`
  offers.forEach(offer => {
    const disqualifiers = offer.hard_disqualifiers
      || offer.eligibility_rules?.hard_disqualifiers || []
    if (disqualifiers.length > 0) {
      out += `**${offer.name}** is disqualified if:\n`
      disqualifiers.forEach(d => {
        out += `- \`${d.field}\` is any of: ${d.disallowed.map(v => '`' + v + '`').join(', ')}\n`
      })
      out += '\n'
    }
  })

  // Possible outcomes
  out += `### Possible Outcomes\n\n`
  offers.forEach(offer => {
    const offerContext = context.outcomes?.[offer.id] || {}
    out += `#### ${offer.name}\n`
    out += `${offer.description}\n\n`
    if (offerContext.best_for) out += `**Best for:** ${offerContext.best_for}\n`
    if (offerContext.tell_the_user) out += `**Tell the user:** ${offerContext.tell_the_user}\n`

    // Implementation actions from checklists
    if (checklists && checklists[offer.id]) {
      const checklist = checklists[offer.id]
      out += `**First actions:**\n`
      const firstPhase = checklist.implementation_checklist?.[0]
      if (firstPhase) {
        firstPhase.tasks.slice(0, 3).forEach(task => {
          out += `1. ${task.task} — ${task.description}\n`
        })
      }
    }
    out += '\n'
  })

  return out
}

// Assemble
let output = readText('public/agent-context/framework-overview.md')
output += '\n\n---\n\n'

FLOWS.forEach(flow => {
  output += generateFlowSection(flow)
  output += '\n---\n\n'
})

output += readText('public/agent-context/guidance.md')

writeFileSync(resolve(ROOT, 'public/llms-full.txt'), output)
console.log(`Generated public/llms-full.txt (${output.length} chars)`)
```

**Step 2: Add to package.json**

```json
"scripts": {
  "generate:llms": "node scripts/generate-llms-full.js"
}
```

**Step 3: Run it (will fail — content files don't exist yet, that's Tasks 2 & 3)**

```bash
npm run generate:llms
```

Expected: Error — `public/agent-context/framework-overview.md` not found.

**Step 4: Commit**

```bash
git add scripts/generate-llms-full.js package.json
git commit -m "feat: add llms-full.txt generator script"
```

---

### Task 2: Author the Agent Context Files

**Files:**
- Create: `public/agent-context/flows/attraction-offer.json`
- Create: `public/agent-context/flows/upsell.json`
- Create: `public/agent-context/flows/downsell.json`
- Create: `public/agent-context/flows/continuity.json`
- Create: `public/agent-context/flows/leads-strategy.json`
- Create: `public/agent-context/flows/lead-magnet.json`

This is the intellectual work — the ONLY hand-authored content. Each file provides:
- `purpose`: What this assessment determines (1-2 sentences)
- `when_to_use`: When an agent should suggest this flow
- `questions.{id}.agent_context`: Why this question matters strategically (2-3 sentences explaining scoring implications)
- `questions.{id}.if_unknown`: What to ask the user if the agent doesn't know
- `outcomes.{id}.best_for`: 1-line summary of who this outcome suits
- `outcomes.{id}.tell_the_user`: What to say when recommending this outcome

**Step 1: Create `public/agent-context/flows/attraction-offer.json`**

To write the agent context, read:
- `public/attraction-offer-questions.json` — to understand each question
- `public/Money Model/Attraction/offers.json` — to understand how answers affect scoring (look at scoring_weights per offer to see which answers push toward which offers, then explain WHY in plain English)

Structure:

```json
{
  "purpose": "Identifies which front-end offer strategy best fits the user's business model, margins, and growth goals. The attraction offer is the entry point to their offer ecosystem — it's how new customers come in.",
  "when_to_use": "When the user needs to figure out their front-end offer, is starting a new business, wants to optimize customer acquisition, or asks about lead magnets, free trials, or guarantees.",
  "questions": {
    "q1_business_model": {
      "agent_context": "This is the single most influential scoring factor across all offers. Coaching/consulting and agency models score highest for relationship-based offers (Win Your Money Back, consultation-based strategies) because the personal relationship justifies risk-reversal guarantees and the high margins absorb the risk. Digital products and SaaS favor volume strategies (Free Trial, Bundle) because they scale without per-customer cost. Physical products severely limit options due to COGS — most guarantee-based offers become unprofitable when you have to eat shipping and manufacturing costs.",
      "if_unknown": "Ask: 'What do you sell, and how do you deliver it to customers?' If they describe services → coaching_consulting or agency. If they describe a product people download → digital_product. If they ship something → physical_product."
    },
    "q2_gross_margin": {
      "agent_context": "Margin determines which risk-reversal strategies are viable. At 85%+ margins (typical for coaching, digital), you can afford aggressive guarantees like Win Your Money Back because refunds barely cost you. At 60-85%, you have room for moderate guarantees. Below 40%, guarantee-based offers are dangerous — a refund costs you real money. Low-margin businesses should lean toward Free Trial or Bundle strategies where the risk is controlled.",
      "if_unknown": "Ask: 'Roughly what percentage of your revenue is profit after delivering the product/service? For example, if you charge $100 and it costs you $20 to deliver, that's 80% margin.' For coaches: assume 85%+. For agencies: typically 40-60%. For physical products: typically under 40%."
    },
    "q3_cashflow_tolerance": {
      "agent_context": "This separates aggressive growth strategies from conservative ones. If the user MUST profit on every front-end sale, they're disqualified from the most powerful offers (Win Your Money Back, Free Trial) because those are loss-leaders designed to be recouped on the backend. 'Can afford short-term loss' or 'can run free front-end' unlocks the highest-scoring strategies. This is heavily correlated with backend strength — you can only afford to lose money upfront if you have strong upsells.",
      "if_unknown": "Ask: 'Can you afford to break even or even lose money on the first sale, knowing you'll make it back on upsells? Or do you need to profit immediately on every transaction?'"
    },
    "q4_capacity": {
      "agent_context": "High capacity favors volume-based strategies (Free Trial, Bundle) that bring in lots of customers at once. Low capacity favors exclusive, high-touch strategies (consultation, application-based) that control flow. If someone has no capacity, most aggressive acquisition strategies are counterproductive — they'll get overwhelmed. This question also signals business maturity: high capacity usually means systems are in place.",
      "if_unknown": "Ask: 'If your offer worked really well and brought in a big spike of new customers, could you handle that? Or are you already near capacity?'"
    },
    "q5_tracking": {
      "agent_context": "This is a hard disqualifier for Win Your Money Back — if you can't track whether customers complete the required actions, the whole guarantee falls apart. 'Can track everything' scores +4 for WYMB. 'Cannot track at all' disqualifies it entirely (-5 score). For other offers like Free Trial or Bundle, tracking matters less. This question reveals operational maturity.",
      "if_unknown": "Ask: 'Can you measure whether your customers are actually getting results? Do you have a system to track their progress, or is it more of a guess?'"
    },
    "q6_lead_challenge": {
      "agent_context": "This maps directly to which offer type solves their specific problem. 'Leads don't trust me yet' → Win Your Money Back (risk reversal builds trust). 'Price sensitive' → Free Trial or loss-leader (remove the price barrier). 'Slow sales cycle' → urgency-based offers. 'Not enough leads' → volume-focused strategies. The answer reveals what the offer needs to SOLVE, not just what sounds good.",
      "if_unknown": "Ask: 'What's the main reason potential customers don't buy from you? Is it trust, price, they take too long to decide, or something else?'"
    },
    "q7_backend_strength": {
      "agent_context": "This is CRITICAL and often underestimated. If there's no backend offer, aggressive front-end strategies (loss leaders, free trials) are financial suicide — you lose money acquiring customers with no way to recoup it. Multiple strong upsells (+3) means you can be very aggressive on the front end. No backend (-4) means you need front-end profitability, which limits your options severely. This is the #1 question where agents should push back if the user picks an aggressive strategy without backend offers.",
      "if_unknown": "Ask: 'After someone buys your main thing, what else can you sell them? Do you have upsells, premium tiers, or additional services?' If the answer is 'nothing yet', flag this as a critical gap."
    },
    "q8_repeat_purchase": {
      "agent_context": "Repeat purchase behavior affects long-term ROI calculations. Frequent repurchase means you can afford higher acquisition costs because LTV is high. One-time purchase means you need to capture maximum value at the point of sale. This question has relatively low scoring impact across most offers (mostly 0s) but slightly penalizes one-time-purchase businesses for strategies that depend on repeat engagement.",
      "if_unknown": "Ask: 'Do customers typically buy from you more than once, or is it usually a one-time transaction?'"
    },
    "q9_primary_goal": {
      "agent_context": "This aligns the offer to the user's strategic priority. 'Get more leads fast' → volume strategies. 'Build trust' → risk-reversal. 'Generate testimonials' → Win Your Money Back (designed to produce social proof). 'Fill a program' → urgency/scarcity offers. 'Sell high-ticket' → consultation/application. 'Grow email list' → lead magnet-first strategies. The scoring weights are moderate here — it's a tiebreaker more than a primary factor.",
      "if_unknown": "Ask: 'If this offer could only achieve ONE thing for your business, what would that be? More leads, more trust, more testimonials, or something else?'"
    },
    "q10_lead_preference": {
      "agent_context": "Volume vs quality trade-off. 'As many as possible' favors low-barrier offers (free trial, bundle). 'Only likely buyers' favors high-barrier qualifying offers (application, consultation). 'Balanced' is a neutral signal. This is a secondary factor — it won't flip the primary recommendation but can strengthen or weaken marginal candidates.",
      "if_unknown": "Ask: 'Would you rather have 1,000 leads where maybe 10 buy, or 50 leads where 25 buy? Some offers attract volume, others attract quality.'"
    }
  },
  "outcomes": {
    "win_your_money_back": {
      "best_for": "High-margin coaching/consulting with strong backend offers and ability to track customer completion.",
      "tell_the_user": "Your business model supports a results-based guarantee. You can afford the risk because your margins are high and you have backend offers to recoup any refunds. The key is making the completion criteria specific and trackable — customers who complete earn their money back, which creates testimonials, engagement, and upsell opportunities."
    },
    "free_trial": {
      "best_for": "Digital products and SaaS with scalable delivery and strong conversion from trial to paid.",
      "tell_the_user": "A free trial lets people experience your product's value before committing. Your delivery model scales well, so adding trial users costs you almost nothing. Focus on making the trial experience demonstrate clear value within the first 48 hours — that's when most conversion decisions happen."
    },
    "consultation_offer": {
      "best_for": "High-ticket services where the sales process benefits from personal connection.",
      "tell_the_user": "A free or low-cost consultation positions you as the expert while qualifying leads in real-time. You'll attract fewer but much higher-quality leads who are ready for your premium offer."
    },
    "bundle_discount": {
      "best_for": "Product businesses with multiple SKUs where perceived value can exceed actual cost.",
      "tell_the_user": "Bundling multiple products at a discount increases perceived value while maintaining margin. Your customers get more value, you increase average order size, and you can introduce them to products they wouldn't have tried individually."
    },
    "loss_leader": {
      "best_for": "Businesses with strong backend monetization that can afford to acquire customers at a loss.",
      "tell_the_user": "You can afford to sell your front-end offer at or below cost because your upsell ecosystem will recoup the investment. This is an aggressive growth strategy — you'll outcompete anyone who needs to profit on every sale."
    },
    "challenge_offer": {
      "best_for": "Coaching/education businesses that can create a time-bound transformation experience.",
      "tell_the_user": "A paid challenge (typically 5-30 days) gives participants a structured transformation experience at a low price point. The shared experience creates community, testimonials, and natural upsell momentum into your main offer."
    }
  }
}
```

**Step 2: Create the other 5 flow context files**

Follow the same pattern for each flow. Read the corresponding questions JSON and offers JSON to understand what each question measures and how the scoring works, then write agent context that explains the STRATEGY, not just the data.

For each flow, the key strategic angles are:

- **Upsell**: Timing of the upsell (immediate vs delayed), product compatibility with core offer, customer readiness signals, order-bump vs separate upsell page
- **Downsell**: Recovering otherwise-lost sales, price anchoring psychology, preserving the relationship for future sales, maintaining perceived value at lower price
- **Continuity**: Recurring revenue stability, retention vs acquisition focus, community vs content vs service models, churn prevention
- **Leads Strategy**: The Core Four framework ($100M Leads), matching resources/skills/budget to the right lead gen method, why warm outreach first for beginners, scaling from warm to cold to paid
- **Lead Magnet**: Production effort vs perceived value, lead quality vs volume trade-offs, matching the magnet to the core offer, quick wins vs deep dives

**Step 3: Commit**

```bash
git add public/agent-context/
git commit -m "feat: author agent context for all 6 Money Model flows"
```

---

### Task 3: Author the Framework Overview and Guidance

**Files:**
- Create: `public/agent-context/framework-overview.md`
- Create: `public/agent-context/guidance.md`

**Step 1: Create `public/agent-context/framework-overview.md`**

```markdown
# FindMyFlow — Complete Agent Guide

> This document contains everything an AI agent needs to guide a user through
> FindMyFlow's business strategy assessments. It is the open, free knowledge
> layer — any AI can use this to help their owner make better business decisions.

## How to Use This Guide

You are acting as a business strategy advisor using the FindMyFlow methodology.
Your job is to:
1. Understand where the user is in their business journey
2. Walk them through the relevant assessment(s) conversationally
3. Score their answers using the scoring matrices below
4. Recommend specific actions based on the results

You do NOT need to present this as a quiz. Have a natural conversation, gather
the information you need, map it to the closest answer options, and provide
the scored recommendation with reasoning.

## Framework: The Money Model

Based on Alex Hormozi's $100M Offers, the Money Model helps solopreneurs and
small business owners design their complete offer ecosystem. There are 6
assessments, each with 10 multiple-choice questions:

| Assessment | What It Determines | Key Question It Answers |
|------------|-------------------|------------------------|
| Leads Strategy | Which of the Core Four lead gen methods fits you | "How should I get customers?" |
| Lead Magnet | What type of free value to offer | "What should I give away to capture leads?" |
| Attraction Offer | Your front-end offer strategy | "How do I bring new customers in?" |
| Upsell | How to increase order value | "What do I sell next to maximize revenue?" |
| Downsell | How to capture lost sales | "What do I offer people who say no?" |
| Continuity | Your recurring revenue model | "How do I create predictable income?" |

## Scoring Algorithm

For each assessment, answers are scored against multiple possible offer/strategy
options using weighted scoring:

1. Start with score = 0 for each possible outcome
2. For each of the 10 questions, look up the scoring weight for the user's answer
3. Add the weight to the running score (weights can be negative)
4. Check hard disqualifiers — if any answer triggers a disqualifier, that outcome
   is removed regardless of score
5. Calculate confidence = totalScore / maxPossibleScore
6. Rank all non-disqualified outcomes by score (highest first)
7. Primary recommendation = highest scoring non-disqualified outcome

Confidence levels:
- 55%+ = Strong recommendation (primary)
- 30-55% = Worth considering (secondary)
- Below 30% = Experimental at best
```

**Step 2: Create `public/agent-context/guidance.md`**

```markdown
## How to Guide a User Through FindMyFlow

### Recommended Assessment Order

If the user hasn't completed any assessments, guide them in this order:
1. **Leads Strategy** — How will you get customers? (Foundation — everything else depends on this)
2. **Lead Magnet** — What free value will you offer? (Top of funnel)
3. **Attraction Offer** — What's your entry-point offer? (Converts leads to customers)
4. **Upsell** — How do you increase order value? (Revenue maximizer)
5. **Downsell** — How do you capture lost sales? (Revenue recovery)
6. **Continuity** — How do you create recurring revenue? (Stability)

### Conversational Approach

Do NOT present this as a quiz. Instead:
1. Start by understanding their business context naturally
2. As they describe their business, mentally map answers to the question options
3. Ask clarifying questions ONLY for information you genuinely don't have
4. When you have enough to score all 10 questions, run the scoring
5. Present the recommendation with reasoning tied to THEIR specific situation
6. Give them the top 3 implementation actions immediately

### Cross-Flow Intelligence

Results from one assessment inform others. Use these connections:
- Leads Strategy → Warm Outreach? Their Attraction Offer should be relationship-based (Win Your Money Back, Consultation) since they're building trust through personal outreach
- Leads Strategy → Paid Ads? Their Attraction Offer should be scalable (Free Trial, Bundle) to handle volume
- Attraction Offer → Free Trial? Their Lead Magnet should be high-volume compatible (checklist, template, tool) not 1:1 (audit, consultation)
- Attraction Offer → Win Your Money Back? They MUST have strong tracking systems
- No backend offers? Flag this as a critical gap BEFORE suggesting any loss-leader or free front-end strategy
- Continuity → Membership? Their Upsell should upgrade access level or add premium features

### What to Tell the User After Scoring

1. Their primary recommendation and WHY — connect it to their specific answers ("Because you run a coaching business with 85%+ margins and strong backend offers, the Win Your Money Back strategy lets you...")
2. The top 3 actions they should take THIS WEEK (from implementation checklists)
3. Any disqualified options and why — so they understand the trade-offs
4. How this connects to their other assessments (if completed)
5. What assessment they should do next

### Red Flags to Watch For

- User says "must profit on front-end" but wants aggressive growth → they need backend offers first
- User says "no capacity" but wants volume strategies → mismatch, suggest high-touch strategies instead
- User can't track results but wants Win Your Money Back → hard disqualifier, explain why
- User has no backend but wants loss-leader → financial danger, flag immediately

## Submitting Results to FindMyFlow (API)

If the user has a FindMyFlow account and an API key, you can save results
programmatically so they appear in their web dashboard:

```
POST https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/agent-submit
Authorization: Bearer {user_api_key}
Content-Type: application/json

{
  "flow_id": "attraction_offer",
  "answers": {
    "q1_business_model": "coaching_consulting",
    "q2_gross_margin": "85_plus_percent",
    ...all 10 answers with question_id: selected_value...
  },
  "reasoning": {
    "q1_business_model": "User mentioned they do 1:1 executive coaching at $5k/month",
    ...optional reasoning per answer explaining why you chose it...
  }
}
```

Valid flow_id values: `attraction_offer`, `upsell_offer`, `downsell_offer`,
`continuity_offer`, `leads_strategy`, `lead_magnet_offer`

Note: This API requires an API key generated from the user's FindMyFlow profile.
If they don't have one, guide them to complete the assessment at
https://findmyflow.nichuzz.com

## About FindMyFlow

FindMyFlow helps professionals aged 25-35 with deep domain knowledge gain the
confidence and clarity to build their own business and products. The methodology
combines Alex Hormozi's $100M Offers framework with the Nikigai framework
(Skills × Problems × Persona = unique flow) and nervous system regulation.

Website: https://findmyflow.nichuzz.com
```

**Step 3: Commit**

```bash
git add public/agent-context/
git commit -m "feat: author framework overview and agent guidance sections"
```

---

### Task 4: Generate, Test, and Iterate

**Step 1: Run the generator**

```bash
npm run generate:llms
```

Expected: `public/llms-full.txt` is created with all 6 flows, scoring matrices, agent context, and guidance assembled into a single file.

**Step 2: Verify file size and structure**

```bash
wc -l public/llms-full.txt
# Should be roughly 800-1500 lines depending on number of offers per flow
```

Scan the file — verify:
- Framework overview at the top
- All 6 flow sections with questions, scoring matrices, disqualifiers, outcomes
- Agent context merged correctly into each question
- Guidance section at the bottom

**Step 3: Update `public/llms.txt` to reference the full guide**

Add to the bottom of the existing `llms.txt`:

```markdown

## For AI Agents

For the complete agent guide with all assessment questions, scoring logic,
and action recommendations: https://findmyflow.nichuzz.com/llms-full.txt
```

**Step 4: Test with a real AI conversation**

Copy the contents of `llms-full.txt` and paste into a fresh Claude or ChatGPT conversation with:

> "Using this guide, help me figure out my attraction offer. I run a coaching business helping engineers become CTOs. I charge $5k/month, my margins are over 85%, I have a strong backend mentorship program, and my main issue is that leads don't trust me yet."

Verify:
- The AI does NOT ask all 10 questions — it should already know answers for ~6 of them from context
- It asks clarifying questions only for genuinely missing info (capacity, tracking ability, repeat purchase, lead preference)
- It correctly scores using the matrix (coaching + high margin + trust issue → should lean toward Win Your Money Back)
- It explains WHY with reasoning connected to the user's specific situation
- It gives actionable next steps from the implementation checklist

**Step 5: Fix any issues found during testing**

If the AI misinterprets a question or gives wrong scoring:
- Update the agent context in the relevant `public/agent-context/flows/*.json` file
- Re-run `npm run generate:llms` to regenerate
- Re-test

**Step 6: Add generate command to build pipeline (optional)**

If desired, add to the Vite build so llms-full.txt is always fresh:

```json
"scripts": {
  "prebuild": "node scripts/generate-llms-full.js"
}
```

**Step 7: Commit everything**

```bash
git add public/llms-full.txt public/llms.txt package.json
git commit -m "feat: generate and test llms-full.txt agent guide"
```

---

## Phase 2: Save Results Back (Edge Function)

### Task 5: Extract Scoring Engine to Shared Module

**Files:**
- Create: `src/lib/scoring.js`
- Modify: `src/flows/MoneyModelFlowBase.jsx:269-318`

**Step 1: Create `src/lib/scoring.js`**

Extract the `calculateOfferScores` function from `MoneyModelFlowBase.jsx:269-318` into a standalone, importable module. The function signature stays identical:

```javascript
export function calculateOfferScores(userAnswers, offersData) {
  // Exact same logic as MoneyModelFlowBase.jsx lines 269-318
  // See source file for the implementation
}
```

**Step 2: Update MoneyModelFlowBase.jsx**

Replace the inline function definition with:
```javascript
import { calculateOfferScores } from '../lib/scoring'
```

Delete the `calculateOfferScores` function body (lines ~269-318). Call sites are unchanged — same function name, same arguments.

**Step 3: Verify**

Run `npm run dev`, open `http://localhost:5173/attraction-offer`, complete the flow. Results should be identical to before. No console errors.

**Step 4: Commit**

```bash
git add src/lib/scoring.js src/flows/MoneyModelFlowBase.jsx
git commit -m "refactor: extract scoring engine to shared lib/scoring.js"
```

---

### Task 6: Database Setup (API Keys + Agent Columns)

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_agent_api_infrastructure.sql`

**Step 1: Write a single migration for all agent infrastructure**

```sql
-- ============================================
-- Agent API Infrastructure
-- ============================================

-- 1. API Keys table
CREATE TABLE IF NOT EXISTS agent_api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  label text NOT NULL DEFAULT 'My Agent',
  permissions jsonb DEFAULT '{"flows": ["attraction_offer", "upsell_offer", "downsell_offer", "continuity_offer", "leads_strategy", "lead_magnet_offer"]}'::jsonb,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  is_active boolean DEFAULT true
);

CREATE INDEX idx_agent_api_keys_hash ON agent_api_keys(key_hash);
CREATE INDEX idx_agent_api_keys_user ON agent_api_keys(user_id);

ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own API keys"
  ON agent_api_keys FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Agent tracking columns on all assessment tables
ALTER TABLE attraction_offer_assessments
  ADD COLUMN IF NOT EXISTS agent_reasoning jsonb,
  ADD COLUMN IF NOT EXISTS submitted_via text DEFAULT 'web_ui';

ALTER TABLE upsell_assessments
  ADD COLUMN IF NOT EXISTS agent_reasoning jsonb,
  ADD COLUMN IF NOT EXISTS submitted_via text DEFAULT 'web_ui';

ALTER TABLE downsell_assessments
  ADD COLUMN IF NOT EXISTS agent_reasoning jsonb,
  ADD COLUMN IF NOT EXISTS submitted_via text DEFAULT 'web_ui';

ALTER TABLE continuity_assessments
  ADD COLUMN IF NOT EXISTS agent_reasoning jsonb,
  ADD COLUMN IF NOT EXISTS submitted_via text DEFAULT 'web_ui';

ALTER TABLE leads_assessments
  ADD COLUMN IF NOT EXISTS agent_reasoning jsonb,
  ADD COLUMN IF NOT EXISTS submitted_via text DEFAULT 'web_ui';

ALTER TABLE lead_magnet_assessments
  ADD COLUMN IF NOT EXISTS agent_reasoning jsonb,
  ADD COLUMN IF NOT EXISTS submitted_via text DEFAULT 'web_ui';
```

**Step 2: Apply and commit**

```bash
git add supabase/migrations/
git commit -m "feat: add agent API keys table and agent tracking columns"
```

---

### Task 7: Build `agent-submit` Edge Function

**Files:**
- Create: `supabase/functions/agent-submit/index.ts`

**Step 1: Create the Edge Function**

Port the scoring logic from `src/lib/scoring.js` into Deno-compatible TypeScript. The function:

1. Validates the API key (SHA-256 hash lookup in `agent_api_keys`)
2. Parses flow_id + answers + optional reasoning from request body
3. Fetches the correct offers JSON from the app URL
4. Runs the scoring algorithm
5. Inserts results into the correct assessment table (using flow config mapping from `moneyModelConfigs.js`)
6. Returns the scored recommendation

See previous version of this plan for the full Edge Function code — it is correct. Key details:

- Flow config maps flow_id → offers URL, DB table, DB column names
- Answers can be simple strings (`"coaching_consulting"`) or objects (`{value, label}`) — the function normalizes both
- Uses `--no-verify-jwt` deployment since it uses its own API key auth
- Sets `submitted_via: 'agent_api'` to distinguish from web UI submissions

**Step 2: Deploy and test**

```bash
npx supabase functions deploy agent-submit --no-verify-jwt
```

Test with curl using a manually-created test API key.

**Step 3: Commit**

```bash
git add supabase/functions/agent-submit/
git commit -m "feat: create agent-submit Edge Function"
```

---

### Task 8: Profile Page API Key Generation

**Files:**
- Modify: `src/Profile.jsx`

**Step 1: Add "Agent Access" section**

Add a collapsible section to the profile page with:
- "Generate API Key" button
- Key generation: `fmf_k1_` + 32 random hex chars. SHA-256 hash stored in DB, raw key shown once.
- List of existing keys (prefix, label, created_at, last_used_at)
- Revoke button per key (sets `is_active: false`)
- Copy-to-clipboard for the raw key on generation

Follow the existing profile page design patterns (purple gradient cards, gold CTAs — see `docs/page-component-design-guide.md`).

**Step 2: Test end-to-end**

1. Generate a key from profile page
2. Use it to call agent-submit with curl
3. Verify results appear in the web app's assessment results page
4. Revoke the key
5. Verify the revoked key returns 401

**Step 3: Commit**

```bash
git add src/Profile.jsx
git commit -m "feat: add Agent API key generation to profile page"
```

---

## Summary

| Task | Phase | Description | Depends On |
|------|-------|-------------|------------|
| 1 | 1 | Generator script | — |
| 2 | 1 | Agent context JSON files (all 6 flows) | — |
| 3 | 1 | Framework overview + guidance markdown | — |
| 4 | 1 | Generate, test with AI, iterate | 1, 2, 3 |
| 5 | 2 | Extract scoring engine to shared module | — |
| 6 | 2 | DB migration (API keys + agent columns) | — |
| 7 | 2 | agent-submit Edge Function | 5, 6 |
| 8 | 2 | Profile page API key generation UI | 6, 7 |

**Phase 1 (Tasks 1-4):** Generator script + authored content + generate + test. Deliverable: `public/llms-full.txt` that any AI can use immediately, auto-generated from the same JSONs the app uses. Tasks 1-3 can be done in parallel.

**Phase 2 (Tasks 5-8):** Scoring extraction + DB + Edge Function + UI. Deliverable: agents can programmatically submit results that appear in the web app. Tasks 5 and 6 can be done in parallel.
