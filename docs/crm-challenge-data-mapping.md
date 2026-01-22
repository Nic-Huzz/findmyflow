# CRM ← Challenge Data Mapping

> This document maps which challenge data feeds into each CRM prompt generator and component.

---

## CONNECTION STATUS: What Exists vs What's Missing

### Currently Connected (Existing Code)

These services already aggregate challenge data for CRM use:

#### 1. `contentContext.js` → Content Generator
| Table | Data | Connected |
|-------|------|-----------|
| `nikigai_clusters` | Persona, problems, skills | ✅ YES |
| `validation_responses` | Raw survey answers | ✅ YES |
| `offer_builder_assessments` | V1 offer (niche, MVP) | ✅ YES |
| `offer_creations` | V2 offer (dream outcome, bonuses) | ✅ YES |
| `voice_profiles` | Origin story, catchphrases | ✅ YES |
| `marketing_tasks` | Top performing content | ✅ YES |
| `sales_deals` | Recent wins, objections | ✅ YES |

#### 2. `businessProfile.js` → CRM AI Features
| Table | Data | Connected |
|-------|------|-----------|
| `attraction_offer_assessments` | Attraction offer strategy | ✅ YES |
| `upsell_assessments` | Upsell strategy | ✅ YES |
| `downsell_assessments` | Downsell strategy | ✅ YES |
| `continuity_assessments` | Continuity strategy | ✅ YES |
| `leads_assessments` | Core Four strategy | ✅ YES |
| `persona_profiles` | Customer persona | ✅ YES |
| `nikigai_key_outcomes` | Opportunities | ✅ YES |
| `ltv_models` | LTV calculations | ✅ YES |
| `products` | Product stack | ✅ YES |

#### 3. `recommendationService.js` → Smart Alerts
| Data Source | What It Uses | Connected |
|-------------|--------------|-----------|
| `sales_deals` | Deal stage, win/loss | ✅ YES |
| `deal_outcomes` | Win/loss reasons | ✅ YES |
| `funnel_actuals` | Conversion rates | ✅ YES |
| `autonomous_setup_progress` | Setup completeness | ✅ YES |

#### 4. `funnelActualsService.js` → Pipeline Analytics
| Data Source | What It Uses | Connected |
|-------------|--------------|-----------|
| `sales_deals` | Deals by stage | ✅ YES |
| Calculated | Conversion rates | ✅ YES |

---

### NOT Connected (Missing - Need to Build)

These tables exist but have **NO connection** to any CRM service:

| Table | Data Available | Should Feed Into |
|-------|----------------|------------------|
| `offer_stack_builds` | Lead magnet, bonuses, guarantee, scarcity, offer name | Sales page prompts, Email sequences |
| `grand_slam_offers` | Proof stack, speed/ease data, obstacles, score | All copy prompts, Objection handling |
| `launch_readiness_assessments` | Pricing, audience size, proof inventory, launch approach | Launch Mode, Email sequences |
| `validation_analysis` | AI-analyzed pain language, objections, dream outcomes | All prompts (different from raw `validation_responses`) |
| `product_selections` | Value equation data, dream outcomes per product | Product descriptions, Benefits copy |
| `lead_magnet_assessments` | Magnet type, idea, reasoning | Lead capture pages |
| `mvp_readiness_assessments` | Testers list, MVP definition | Testing coordination |
| `feedback_analysis_assessments` | Key learnings, planned changes | Product iteration |
| `funnel_plans` | Funnel architecture | Launch Mode visualization |

### Psychological Data (Available but Not Used)

| Table | Data | CRM Use Case |
|-------|------|--------------|
| `groan_reflections` | Fear type, protective archetype, flow direction | Adapt prompt tone (softer CTAs if high fear) |
| `nervous_system_responses` | Visibility ceiling, earning ceiling | Price confidence, outreach assertiveness |
| `healing_compass_responses` | Healing journey progress | Motivational messaging |
| `conversation_logs` | Validation conversations | Extract actual objections heard |

### Views Available (Ready to Query)

These SQL views exist and aggregate useful patterns:

| View | Data | CRM Use Case |
|------|------|--------------|
| `user_fear_patterns` | Fear occurrences by type, last 30 days | Personalize outreach tone |
| `user_archetype_patterns` | Dominant protective archetype | Adapt messaging style |
| `user_visibility_flow_patterns` | How visibility work feels | Predict comfort with outreach |
| `user_fear_progression` | Fear patterns by stage | Show growth progress |

---

## PRIORITY BUILD ORDER

### Phase 1: High-Value Missing Connections
```
1. offer_stack_builds → All prompt generators
2. grand_slam_offers → Proof/credibility in prompts
3. validation_analysis → Pain language in prompts
4. launch_readiness_assessments → Launch Mode
```

### Phase 2: Calculator Pre-Population
```
1. LTV Calculator ← Money Models pricing
2. CAC Tracker ← Core Four channel focus
3. Ascension Engine ← Value ladder from offer stack
```

### Phase 3: Psychological Personalization
```
1. Prompt tone adjustment ← groan_reflections + nervous_system
2. Objection Patterns ← validation_analysis comparison
```

---

## Overview: Data Flow

```
CHALLENGES (Planning)                    CRM (Execution)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────┐
│ STAGE 0: DISCOVERY  │
│ • Flow Finder       │────┐
│ • Nervous System    │    │
│ • Healing Compass   │    │
└─────────────────────┘    │
                           │
┌─────────────────────┐    │
│ STAGE 1: VALIDATION │    │
│ • Persona Validation│────┤
│ • Collect Responses │    │
│ • Analyze Responses │    │
└─────────────────────┘    │
                           │      ┌──────────────────────────┐
┌─────────────────────┐    │      │     CRM ATTRACT TOWER    │
│ STAGE 2: PRODUCT    │    │      │                          │
│ • Product Builder   │────┼─────▶│  📄 Pages                │
│ • Lead Magnet       │    │      │  📝 Content (auto-gen)   │
│ • Product Designer  │    │      │  💬 Cold Outreach        │
└─────────────────────┘    │      │  📣 Ads                  │
                           │      │                          │
┌─────────────────────┐    │      └──────────────────────────┘
│ STAGE 3: TESTING    │    │
│ • MVP Readiness     │────┤
│ • Collect Feedback  │    │
│ • Analyze Feedback  │    │
└─────────────────────┘    │
                           │      ┌──────────────────────────┐
┌─────────────────────┐    │      │     CRM NURTURE TOWER    │
│ STAGE 4: MONEY      │    │      │                          │
│ • Attraction Offer  │────┼─────▶│  👥 Contacts             │
│ • Upsell Offer      │    │      │  📧 Email Sequences      │
│ • Downsell Offer    │    │      │  💬 Warm Outreach        │
│ • Continuity Offer  │    │      │  🎯 Pipeline             │
└─────────────────────┘    │      │                          │
                           │      └──────────────────────────┘
┌─────────────────────┐    │
│ STAGE 5: OFFER      │    │
│ • Grand Slam Eval   │────┤
│ • Offer Stack       │    │
└─────────────────────┘    │
                           │      ┌──────────────────────────┐
┌─────────────────────┐    │      │     CRM LAUNCH MODE      │
│ STAGE 6: CAMPAIGN   │    │      │                          │
│ • Core Four         │────┼─────▶│  📅 Timeline             │
│ • Funnel Builder    │    │      │  📊 Live Metrics         │
│ • Launch Readiness  │    │      │  🎯 Sales Tracking       │
└─────────────────────┘    │      │                          │
                           │      └──────────────────────────┘
┌─────────────────────┐    │
│ STAGE 7-8: LAUNCH   │    │
│ • Daily Implement   │────┘
│ • Funnel Calculator │
│ • Post-Launch       │
└─────────────────────┘
```

---

## ATTRACT TOWER: Data Sources

### 📄 Pages Section (Landing Page & Sales Page Prompts)

**Prompt: Landing Page Copy**

| Data Field | Source Challenge | Database Table | Field Path |
|------------|------------------|----------------|------------|
| Persona name | Flow Finder: Personas | `nikigai_clusters` | `cluster_name` where type='persona' |
| Persona description | Flow Finder: Personas | `nikigai_clusters` | `description` |
| Main problems | Flow Finder: Problems | `nikigai_clusters` | `cluster_name` where type='problem' |
| Pain language | Validation Analysis | `validation_analysis` | `language_patterns[]` |
| Dream outcome | Product Designer | `product_selection` | `dream_outcome` |
| Lead magnet name | Offer Stack Builder | `offer_stack_builder` | `lead_magnet.name` |
| Lead magnet promise | Offer Stack Builder | `offer_stack_builder` | `lead_magnet.promise` |
| Objections | Validation Analysis | `validation_analysis` | `objections[]` |

**Prompt: Sales Page Copy**

| Data Field | Source Challenge | Database Table | Field Path |
|------------|------------------|----------------|------------|
| *All landing page fields above* | | | |
| Core offer name | Offer Stack Builder | `offer_stack_builder` | `offer_name` |
| Core offer description | Product Builder | `offer_builder_assessments` | `core_product[]` |
| Price | Launch Readiness | `launch_readiness_assessments` | `pricing_data.coreOfferPrice` |
| Bonuses | Offer Stack Builder | `offer_stack_builder` | `bonuses[]` |
| Guarantee | Offer Stack Builder | `offer_stack_builder` | `guarantee` |
| Scarcity | Offer Stack Builder | `offer_stack_builder` | `scarcity` |
| Proof stack | Grand Slam Evaluation | `grand_slam_offers` | `proof_stack` |
| Testimonials | Launch Readiness | `launch_readiness_assessments` | `proof_data.types.testimonials` |
| Case studies | Launch Readiness | `launch_readiness_assessments` | `proof_data.types.case_studies` |
| Speed advantage | Grand Slam Evaluation | `grand_slam_offers` | `speed_advantage` |
| Ease factor | Grand Slam Evaluation | `grand_slam_offers` | `ease_factor` |
| Obstacles addressed | Grand Slam Evaluation | `grand_slam_offers` | `obstacles` |

---

### 📝 Content Section (Auto-Generation - Already Built)

The existing ContentGenerator already pulls from these sources via `contentContext.js`:

| Data Category | Source Challenge | Database Table |
|---------------|------------------|----------------|
| Persona data | Flow Finder | `nikigai_clusters` |
| Problems | Flow Finder | `nikigai_clusters` |
| Skills/expertise | Flow Finder | `nikigai_clusters` |
| Validation insights | Validation Analysis | `validation_analysis` |
| Pain language | Validation Analysis | `validation_analysis` |
| Offer details | Offer Stack Builder | `offer_stack_builder` |
| Voice profile | Voice Training | `voice_profiles` |
| Performance data | CRM Marketing | `marketing_tasks` |
| Recent wins | CRM Sales | `sales_deals` |

**Enhancement: Add "View Prompt" to show users what's being used.**

---

### 💬 Cold Outreach Section (Prompt Generator)

**Prompt: Cold DM/Email Scripts**

| Data Field | Source Challenge | Database Table | Field Path |
|------------|------------------|----------------|------------|
| Persona | Flow Finder: Personas | `nikigai_clusters` | type='persona' |
| Their problems | Flow Finder: Problems | `nikigai_clusters` | type='problem' |
| Pain language | Validation Analysis | `validation_analysis` | `language_patterns[]` |
| Your expertise | Flow Finder: Skills | `nikigai_clusters` | type='skill' |
| Lead magnet | Offer Stack Builder | `offer_stack_builder` | `lead_magnet` |
| Credibility/proof | Grand Slam Evaluation | `grand_slam_offers` | `proof_stack` |
| Core Four strategy | Leads Strategy | `leads_strategy_assessments` | `chosen_strategy` |

**Additional Context (Psychological):**

| Data Field | Source Challenge | Database Table | Purpose |
|------------|------------------|----------------|---------|
| Visibility fears | Nervous System | `nervous_system_responses` | Tailor message confidence level |
| Rejection patterns | Groan Reflections | `groan_reflections` | Identify growth edge |
| Protective voice | Recognise Quest | `quest_completions` | Address self-sabotage |

---

### 📣 Ads Section (Prompt Generator - Future)

**Prompt: Ad Copy**

| Data Field | Source Challenge | Database Table | Field Path |
|------------|------------------|----------------|------------|
| Persona | Flow Finder: Personas | `nikigai_clusters` | type='persona' |
| Hook (pain point) | Validation Analysis | `validation_analysis` | `pain_points[0]` |
| Pain language | Validation Analysis | `validation_analysis` | `language_patterns[]` |
| Dream outcome | Product Designer | `product_selection` | `dream_outcome` |
| Lead magnet | Offer Stack Builder | `offer_stack_builder` | `lead_magnet` |
| Social proof | Grand Slam Evaluation | `grand_slam_offers` | `proof_stack` |
| Urgency | Offer Stack Builder | `offer_stack_builder` | `scarcity` |

---

## NURTURE TOWER: Data Sources

### 👥 Contacts Section

**No prompt generator needed** - This is a data management section.

However, contacts can be enriched with challenge data:

| Enrichment | Source | Purpose |
|------------|--------|---------|
| Lead source | Core Four Strategy | Know which channel they came from |
| Persona match | Flow Finder: Personas | Segment contacts by persona |
| Pain points | Validation Analysis | Personalize follow-up |

---

### 📧 Email Sequences Section (Prompt Generator)

**Prompt: Nurture Sequence (5 emails)**

| Data Field | Source Challenge | Database Table | Field Path |
|------------|------------------|----------------|------------|
| Persona | Flow Finder: Personas | `nikigai_clusters` | type='persona' |
| Main problems | Flow Finder: Problems | `nikigai_clusters` | type='problem' |
| Pain language | Validation Analysis | `validation_analysis` | `language_patterns[]` |
| Dream outcomes | Validation Analysis | `validation_analysis` | `dream_outcomes[]` |
| Objections | Validation Analysis | `validation_analysis` | `objections[]` |
| Your story | Voice Profile | `voice_profiles` | `origin_story` |
| Case study/proof | Grand Slam Evaluation | `grand_slam_offers` | `proof_stack` |
| Lead magnet | Offer Stack Builder | `offer_stack_builder` | `lead_magnet` |
| Core offer | Product Builder | `offer_builder_assessments` | `core_product` |
| Offer name | Offer Stack Builder | `offer_stack_builder` | `offer_name` |

**Email Structure (5-part):**
1. Welcome + Quick Win → Uses: lead_magnet, dream_outcome
2. Your Story → Uses: origin_story, why_you_care
3. Case Study/Proof → Uses: proof_stack, testimonials
4. Objection Buster → Uses: objections[], pain_language
5. Invitation → Uses: offer_name, core_offer, pricing

---

**Prompt: Launch Sequence (7 emails)**

| Data Field | Source Challenge | Database Table | Field Path |
|------------|------------------|----------------|------------|
| *All nurture sequence fields above* | | | |
| Launch approach | Launch Readiness | `launch_readiness_assessments` | `launch_approach` |
| Price | Launch Readiness | `launch_readiness_assessments` | `pricing_data.coreOfferPrice` |
| Bonuses | Offer Stack Builder | `offer_stack_builder` | `bonuses[]` |
| Bonus deadline | Offer Stack Builder | `offer_stack_builder` | `scarcity.deadline` |
| Guarantee | Offer Stack Builder | `offer_stack_builder` | `guarantee` |
| Scarcity | Offer Stack Builder | `offer_stack_builder` | `scarcity.type` |
| Audience size | Launch Readiness | `launch_readiness_assessments` | `audience_data.currentListSize` |

**Email Structure (7-day):**
- Day -3: Teaser → Uses: problem, dream_outcome
- Day -1: Countdown → Uses: offer_name, bonuses
- Day 0: LAUNCH → Uses: full offer details, pricing, guarantee
- Day +1: Social proof → Uses: proof_stack, testimonials
- Day +2: FAQ/Objections → Uses: objections[]
- Day +3: Bonus deadline → Uses: bonuses, scarcity
- Day +7: Final call → Uses: scarcity, guarantee

---

**Prompt: Re-engagement Sequence**

| Data Field | Source Challenge | Database Table | Field Path |
|------------|------------------|----------------|------------|
| Persona | Flow Finder: Personas | `nikigai_clusters` | type='persona' |
| Problems | Flow Finder: Problems | `nikigai_clusters` | type='problem' |
| New proof | Grand Slam Evaluation | `grand_slam_offers` | `proof_stack` |
| Updated offer | Offer Stack Builder | `offer_stack_builder` | latest |
| What's changed | Post-Launch Review | `milestone_completions` | `response_text` |

---

### 💬 Warm Outreach Section (Prompt Generator)

**Prompt: Follow-up Scripts**

| Data Field | Source Challenge | Database Table | Field Path |
|------------|------------------|----------------|------------|
| Persona | Flow Finder: Personas | `nikigai_clusters` | type='persona' |
| Previous interaction | CRM Sales | `sales_deals` | `notes`, `stage` |
| Their specific pain | Validation Analysis | `validation_analysis` | `pain_points[]` |
| Offer | Offer Stack Builder | `offer_stack_builder` | `offer_name` |
| Objection handlers | Validation Analysis | `validation_analysis` | `objections[]` |

**Prompt: Objection Handling Scripts**

| Data Field | Source Challenge | Database Table | Field Path |
|------------|------------------|----------------|------------|
| Common objections | Validation Analysis | `validation_analysis` | `objections[]` |
| Pricing objections | Validation Analysis | `validation_analysis` | `pricing_signals` |
| Guarantee | Offer Stack Builder | `offer_stack_builder` | `guarantee` |
| Proof | Grand Slam Evaluation | `grand_slam_offers` | `proof_stack` |
| ROI calculation | Funnel Calculator | `funnel_metrics` | calculated |

---

### 🎯 Pipeline Section

**No prompt generator needed** - This is the existing Sales Kanban.

Enriched with challenge data:

| Enrichment | Source | Purpose |
|------------|--------|---------|
| Deal value | Money Models | Expected revenue per deal stage |
| Conversion rates | Funnel Calculator | Pipeline projections |
| Lead score factors | Validation Analysis | Which objections they mentioned |

---

## LAUNCH MODE: Data Sources

| Data Field | Source Challenge | Database Table | Purpose |
|------------|------------------|----------------|---------|
| Launch approach | Launch Readiness | `launch_readiness_assessments` | Beta/Founding/Public |
| Readiness score | Launch Readiness | `launch_readiness_assessments` | Show % ready |
| Gaps | Launch Readiness | `launch_readiness_assessments` | Checklist items |
| Audience size | Launch Readiness | `launch_readiness_assessments` | Target metrics |
| Pricing | Launch Readiness | `launch_readiness_assessments` | Revenue projections |
| Content scheduled | CRM Content | `content_history` | Posts ready |
| Emails scheduled | CRM Email | `crm_sequences` | Emails queued |
| Sales tracking | CRM Pipeline | `sales_deals` | Live revenue |

---

## DATA COMPLETENESS BY CRM SECTION

### Required vs Optional Data

| CRM Section | Required Data | Optional Data |
|-------------|---------------|---------------|
| **Landing Page** | Persona, Problems, Lead Magnet | Pain language, Objections |
| **Sales Page** | All above + Offer, Price, Proof | Bonuses, Guarantee, Scarcity |
| **Content** | Persona, Problems | Voice, Performance data |
| **Cold Outreach** | Persona, Problems, Offer | Credibility, Strategy |
| **Nurture Email** | Persona, Problems, Offer, Lead Magnet | Story, Proof, Objections |
| **Launch Email** | All above + Price, Bonuses, Scarcity | Audience size |
| **Warm Outreach** | Previous interaction, Offer | Objection handlers |

---

## CHALLENGE COMPLETION → CRM UNLOCKS

| Challenge Completed | CRM Feature Unlocked | Why |
|---------------------|---------------------|-----|
| Flow Finder (all 3) | Content generator personalization | Knows persona, problems, skills |
| Validation Analysis | Pain language in all prompts | Has customer's exact words |
| Product Builder | Landing page prompt | Knows what to sell |
| Offer Stack Builder | Full sales page prompt | Has complete offer |
| Launch Readiness | Launch Mode | Has all launch details |
| Core Four Strategy | Outreach prompts | Knows primary channel |

---

## PSYCHOLOGICAL DATA (Groan Challenges)

This data influences HOW prompts are written, not WHAT they contain:

| Data | Source | CRM Impact |
|------|--------|------------|
| Visibility fears | Nervous System | Softer CTAs, more proof needed |
| Rejection patterns | Groan Reflections | Warmer outreach tone |
| Protective voice | Recognise Quests | Encouraging copy vs pushy |
| Growth edges | Stage Groans | Know what feels uncomfortable |
| Earning boundaries | Nervous System | Price confidence in copy |

**Future Feature:** Adapt prompt tone based on psychological profile.

---

## IMPLEMENTATION: Data Fetching Service

```javascript
// src/lib/crm/challengeDataService.js

export async function fetchAllChallengeData(userId) {
  const [
    flowFinder,
    validation,
    offer,
    grandSlam,
    launchReadiness,
    coreStrategy,
    psychological
  ] = await Promise.all([
    fetchFlowFinderData(userId),
    fetchValidationData(userId),
    fetchOfferData(userId),
    fetchGrandSlamData(userId),
    fetchLaunchReadinessData(userId),
    fetchCoreStrategyData(userId),
    fetchPsychologicalData(userId)
  ])

  return {
    // Persona & Problems
    persona: flowFinder.persona,
    problems: flowFinder.problems,
    skills: flowFinder.skills,

    // Validation
    painLanguage: validation.languagePatterns,
    objections: validation.objections,
    dreamOutcomes: validation.dreamOutcomes,
    pricingSignals: validation.pricingSignals,

    // Offer
    offerName: offer.offerName,
    coreProduct: offer.coreProduct,
    leadMagnet: offer.leadMagnet,
    bonuses: offer.bonuses,
    guarantee: offer.guarantee,
    scarcity: offer.scarcity,

    // Proof
    proofStack: grandSlam.proofStack,
    speedAdvantage: grandSlam.speedAdvantage,
    easeFactor: grandSlam.easeFactor,

    // Launch
    pricing: launchReadiness.pricingData,
    audienceSize: launchReadiness.audienceData,
    launchApproach: launchReadiness.launchApproach,
    socialProof: launchReadiness.proofData,

    // Strategy
    coreStrategy: coreStrategy.chosenStrategy,

    // Psychological (optional)
    psychological: {
      visibilityFears: psychological.visibilityBoundaries,
      earningCeiling: psychological.earningCeiling,
      protectiveVoice: psychological.dominantProtective
    },

    // Completeness
    completeness: calculateCompleteness(/* all data */)
  }
}
```

---

## SUMMARY: Challenge → CRM Quick Reference

| Challenge | Feeds Into | Data Provided |
|-----------|------------|---------------|
| **Flow Finder: Skills** | Content, Outreach | Expertise areas |
| **Flow Finder: Problems** | All prompts | Pain points |
| **Flow Finder: Personas** | All prompts | Target customer |
| **Validation Analysis** | All prompts | Language, objections, pricing |
| **Product Builder** | Pages, Email | Core product, lead magnet |
| **Product Designer** | Pages | Dream outcome, value equation |
| **Money Models** | Pipeline | Offer types, pricing strategy |
| **Grand Slam Evaluation** | Pages, Email | Proof, speed, ease |
| **Offer Stack Builder** | Pages, Email, Outreach | Complete offer package |
| **Core Four Strategy** | Outreach, Content | Channel focus |
| **Funnel Builder** | Launch Mode | Funnel architecture |
| **Launch Readiness** | Launch Mode, Email | Pricing, proof inventory, audience |
| **Nervous System** | Prompt tone adjustment | Psychological boundaries |
| **Groan Challenges** | Prompt tone adjustment | Fear patterns, growth edges |

---

## CALCULATOR TOOLS: Data Pre-Population

### 💰 LTV Calculator (`/crm/calculators/ltv`)

**Purpose:** Calculate customer lifetime value with multiple revenue streams.

**Pre-populate from Challenge Data:**

| Input Field | Source Challenge | Database Table | Field Path |
|-------------|------------------|----------------|------------|
| Attraction Offer Price | Offer Stack Builder | `offer_stack_builder` | `lead_magnet.price` or `attraction_offer.price` |
| Core Offer Price | Launch Readiness | `launch_readiness_assessments` | `pricing_data.coreOfferPrice` |
| Upsell Price | Money Models: Upsell | `upsell_assessments` | `pricing` |
| Downsell Price | Money Models: Downsell | `downsell_assessments` | `pricing` |
| Continuity Price | Money Models: Continuity | `continuity_assessments` | `monthly_price` |
| Conversion Rates | Funnel Calculator | `funnel_metrics` | calculated from actual data |

**Calculated Outputs Used By:**
- CACTracker (for LTV:CAC ratio)
- AscensionEngine (for customer value projections)
- SmartAlerts (for revenue recommendations)

---

### 📊 CAC Tracker (`/crm/calculators/cac`)

**Purpose:** Track customer acquisition costs by channel.

**Pre-populate from Challenge Data:**

| Input Field | Source Challenge | Database Table | Field Path |
|-------------|------------------|----------------|------------|
| Channels to focus | Core Four Strategy | `leads_strategy_assessments` | `chosen_strategy` |
| LTV (for ratio) | LTV Calculator | calculated | `ltvPerCustomer` |
| Channel leads | CRM Contacts | `crm_contacts` | `lead_source` |
| Channel customers | CRM Deals | `sales_deals` | `source` |

**Connection to Challenges:**
- Core Four Strategy defines which channels to prioritize
- Validation conversations may reveal how customers found you

---

### 🧮 PTUF Calculator (`/crm/calculators/ptuf`)

**Purpose:** Profit Taking Upfront Fee calculator.

**Pre-populate from Challenge Data:**

| Input Field | Source Challenge | Database Table | Field Path |
|-------------|------------------|----------------|------------|
| Core offer price | Launch Readiness | `launch_readiness_assessments` | `pricing_data.coreOfferPrice` |
| Upsell revenue | Money Models: Upsell | `upsell_assessments` | `pricing` × take rate |
| Continuity revenue | Money Models: Continuity | `continuity_assessments` | `monthly_price` × months |

---

## ASCENSION ENGINE: Data Sources

### 🪜 Value Ladder (`/crm/ascension`)

**Purpose:** Track customer journey through offer stack (Lead Magnet → Core → Upsell → Continuity).

**Value Ladder Structure from Challenges:**

| Rung | Source Challenge | Database Table | Data |
|------|------------------|----------------|------|
| Lead Magnet | Lead Magnet Selection | `lead_magnet_assessments` | `magnet_type`, `name` |
| Attraction Offer | Offer Stack Builder | `offer_stack_builder` | `attraction_offer` |
| Core Offer | Product Builder | `offer_builder_assessments` | `core_product` |
| Upsell | Money Models: Upsell | `upsell_assessments` | `offer_details` |
| Downsell | Money Models: Downsell | `downsell_assessments` | `offer_details` |
| Continuity | Money Models: Continuity | `continuity_assessments` | `program_details` |

**Ascension Triggers from Challenges:**

| Trigger | Source | Purpose |
|---------|--------|---------|
| Time-based (days after purchase) | Default triggers | Auto-create upsell tasks |
| Engagement signals | CRM Sales activity | When customer is ready to upgrade |
| Satisfaction indicators | Validation feedback | Happy customers = upsell ready |

**Retention Data:**
- Churn reasons → Map to `ObjectionPatterns` loss reasons
- Tenure data → Validates Continuity flow assumptions

---

## OBJECTION PATTERNS: Data Sources

### 📊 Win/Loss Analysis (`/crm/objection-patterns`)

**Purpose:** Visualize patterns from won/lost deals.

**Compare CRM Data to Challenge Data:**

| CRM Capture | Challenge Comparison | Purpose |
|-------------|---------------------|---------|
| Loss reason: "Price too high" | Validation Analysis `pricing_signals` | Are you pricing as validated? |
| Loss reason: "Not a fit" | Flow Finder: Persona | Are you selling to right people? |
| Loss reason: "Competitor" | Grand Slam Evaluation `differentiators` | Is your offer differentiated? |
| Win reason: "Clear value" | Product Designer `value_equation` | Is value equation working? |
| Win reason: "Trust" | Proof stack in Grand Slam | Is social proof effective? |

**AI-Enhanced Insights (Future):**

| Pattern Detected | Challenge Data Used | Recommendation |
|------------------|---------------------|----------------|
| Price objection spike | Compare to `pricing_signals` from Validation | Adjust pricing or add value |
| "Timing" losses | Check `urgency` from Offer Stack Builder | Strengthen scarcity/urgency |
| Low trust indicators | Check `proof_stack` completeness | Add more social proof |
| Wrong fit losses | Check persona alignment in Flow Finder | Refine targeting |

---

## SMART ALERTS: Data Integration

### 🔔 Intelligent Recommendations (`/crm/smart-alerts`)

**Alert Types & Challenge Data Sources:**

| Alert Category | Challenge Data Used | Trigger Condition |
|----------------|---------------------|-------------------|
| Funnel Health | Funnel Calculator `funnel_metrics` | Conversion rate drops below benchmark |
| Win/Loss Pattern | ObjectionPatterns + Validation Analysis | Recurring loss reason pattern |
| Capacity | Core Four Strategy | Channel performing but not scaled |
| Pricing | Validation Analysis `pricing_signals` | Mismatch between price and perceived value |
| Completion | Challenge progress | Incomplete flows blocking CRM features |

**Recommendation Engine Inputs:**

```javascript
// src/lib/crm/recommendationEngine.js
const inputs = {
  // From Challenges
  funnelMetrics: await fetchFunnelMetrics(userId),
  validationData: await fetchValidationData(userId),
  offerCompleteness: await calculateOfferCompleteness(userId),

  // From CRM
  dealOutcomes: await fetchDealOutcomes(userId),
  pipelineHealth: await calculatePipelineHealth(userId),
  marketingConsistency: await fetchMarketingStats(userId),
}
```

---

## ANALYTICS DASHBOARD: Data Sources

### 📈 Performance Analytics (`/crm/analytics`)

**Metrics Powered by Challenge Data:**

| Metric | Challenge Source | CRM Source | Calculation |
|--------|------------------|------------|-------------|
| Funnel Conversion | Funnel Calculator benchmarks | Actual `funnel_metrics` | Actual vs Expected |
| Offer Performance | Grand Slam evaluation score | Deal win rate | Score vs Conversion |
| Price Optimization | Validation `pricing_signals` | Actual close prices | Are you leaving money? |
| Channel ROI | Core Four Strategy | CAC by channel | Which channel wins? |
| LTV Accuracy | LTV Calculator projections | Actual customer value | Projection vs Reality |

---

## COMPLETENESS GATES

The CRM should progressively unlock features as challenge data becomes available:

### Minimum Viable Data (Unlock Basic CRM)
- [ ] Flow Finder completed (Persona + Problems + Skills)
- [ ] At least 1 Money Model flow completed

### Prompt Generator Ready (Unlock AI Copy)
- [ ] Validation Analysis completed (pain language, objections)
- [ ] Offer Stack Builder completed (full offer details)
- [ ] Voice Profile training (optional but improves quality)

### Full Launch Mode (Unlock All Features)
- [ ] Launch Readiness completed
- [ ] Grand Slam Evaluation completed
- [ ] Core Four Strategy selected
- [ ] At least 3 nurture sequences drafted

### Optimization Ready (Unlock Analytics)
- [ ] Funnel Calculator has actual data
- [ ] 10+ deals tracked in pipeline
- [ ] 3+ deal outcomes captured

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Data Fetching Service
```javascript
// src/lib/crm/challengeDataService.js
export async function getChallengeCompleteness(userId) {
  return {
    flowFinder: { skills: bool, problems: bool, persona: bool },
    validation: { completed: bool, hasLanguage: bool },
    offerStack: { completed: bool, hasAllComponents: bool },
    launchReadiness: { completed: bool, score: number },
    grandSlam: { completed: bool, score: number },
    coreStrategy: { selected: bool, channel: string },
  }
}
```

### Phase 2: Prompt Context Builder
```javascript
// src/lib/crm/promptContext.js
export async function buildPromptContext(userId, promptType) {
  const data = await fetchAllChallengeData(userId)

  return {
    // Always include
    persona: data.persona,
    problems: data.problems,

    // Include based on prompt type
    ...(promptType === 'salesPage' && {
      offer: data.offer,
      proof: data.proofStack,
      scarcity: data.scarcity,
    }),

    // Include if available
    ...(data.painLanguage && { painLanguage: data.painLanguage }),
    ...(data.voiceProfile && { voiceProfile: data.voiceProfile }),
  }
}
```

### Phase 3: Calculator Pre-Population
```javascript
// src/pages/crm/LTVCalculator.jsx
useEffect(() => {
  async function loadDefaults() {
    const offerData = await fetchOfferStackData(userId)
    if (offerData) {
      setCoreOffer(offerData.coreOfferPrice || 497)
      setUpsellPrice(offerData.upsellPrice || 997)
      setContinuityPrice(offerData.continuityPrice || 97)
    }
  }
  loadDefaults()
}, [userId])
```

---

## ADDITIONAL CHALLENGE → CRM CONNECTIONS

### Tier 4 Autonomous System Data (Already Connected via businessProfile.js)

These flows feed into `getAutonomousContext()` for advanced AI personalization:

| Flow | Table | CRM Connection |
|------|-------|----------------|
| Business Baseline | `business_profiles` | Revenue targets, margins, capacity |
| Customer Segments | `customer_segments` | Best/worst customer profiles |
| Competitor Snapshot | `competitor_analysis` | Competitive positioning |

**Currently Used In:**
- Recommendation engine (capacity alerts)
- Content personalization (competitor differentiation)

---

### Stage 3: Testing Data → CRM Opportunities

| Flow | Table | Potential CRM Use |
|------|-------|-------------------|
| MVP Readiness | `mvp_readiness_assessments` | **Testers list** → Warm leads in CRM contacts |
| MVP Readiness | `mvp_readiness_assessments` | MVP definition → Product messaging |
| Feedback Analysis | `feedback_analysis_assessments` | Key learnings → Product iteration tracking |
| Feedback Analysis | `feedback_analysis_assessments` | Planned changes → Task generation |
| Testing Flows | `validation_flows` where stage='testing' | Testing surveys → Feedback collection |
| Feedback Sessions | `validation_sessions` | Completed responses → NPS scores, testimonials |

**Actionable Connection:**
```javascript
// Sync MVP testers to CRM contacts
const { testers } = await fetchMVPReadiness(userId)
for (const testerName of testers.filter(Boolean)) {
  await createCRMContact({
    name: testerName,
    source: 'mvp_tester',
    stage: 'lead',
    notes: 'Early tester from MVP Readiness flow'
  })
}
```

---

### Product Designer (Value Equation) → CRM Copy

| Data Point | Field | CRM Use |
|------------|-------|---------|
| Mechanism | `product_selections.mechanism` | "How it works" section on sales page |
| Features | `product_selections.features[]` | Feature → Benefit bullets |
| Dream Outcome | `product_selections.dream_outcome` | Headline, sub-headline |
| Time Delay | `product_selections.time_delay` | Speed claims ("In just X weeks...") |
| Perceived Likelihood | `product_selections.proof_strategy` | What proof to emphasize |
| Value Score | `product_selections.value_score` | Pricing confidence indicator |

**Priority:** HIGH - This is core sales copy data

---

### Conversation Logs → CRM Intelligence

| Data Point | Table | CRM Use |
|------------|-------|---------|
| Person type | `conversation_logs.person_type` | Segment: ideal customer, edge case, or poor fit |
| Key insights | `conversation_logs.key_insights` | Extract actual objections, desires |
| Conversation summary | `conversation_logs.conversation_summary` | Training data for AI prompts |
| Count | `user_stage_progress.conversations_logged` | Validation progress indicator |

**Actionable Connection:**
```javascript
// Feed conversation insights to prompt generator
const logs = await fetchConversationLogs(userId)
const actualObjections = logs
  .flatMap(log => log.key_insights)
  .filter(insight => insight.includes('objection') || insight.includes('concern'))
```

---

### Groan Challenges → Psychological Personalization

These capture HOW users feel about visibility/sales work:

| Data Point | Table | CRM Use |
|------------|-------|---------|
| Protective Archetype | `groan_reflections.protective_archetype` | Adapt prompt assertiveness |
| Fear Type | `groan_reflections.fear_type` | Know what holds them back |
| Flow Direction | `groan_reflections.flow_direction` | Track comfort with external work |
| Reflection Note | `groan_reflections.reflection_note` | Qualitative insight |

**Personalization Rules:**

| If Pattern Shows | Adjust Prompts |
|------------------|----------------|
| High rejection fear | Softer CTAs, more proof, testimonials first |
| High judgment fear | More credibility, authority positioning |
| Ghost archetype | Encourage visibility, celebrate small wins |
| Perfectionist archetype | Emphasize "done > perfect", MVP mindset |
| Controller archetype | Give options, autonomy in messaging |

---

### Nervous System → Pricing & Visibility Confidence

| Data Point | Table | CRM Use |
|------------|-------|---------|
| Visibility ceiling | `nervous_system_responses` | Max audience size comfort |
| Earning ceiling | `nervous_system_responses` | Price confidence indicator |
| Calibration data | `nervous_system_responses` | Pre/post healing comparison |

**Actionable Connection:**
```javascript
// Adjust price suggestions based on earning ceiling
const { earningCeiling } = await fetchNervousSystemData(userId)
if (earningCeiling < launchReadiness.pricingData.coreOfferPrice) {
  // Show alert: "Your price is above your earning ceiling -
  // this may cause subconscious self-sabotage"
}
```

---

### Quest Completions → Behavior Patterns

| Data Point | Table | CRM Use |
|------------|-------|---------|
| Streak data | `challenge_instances` | Consistency indicator |
| Quest category | `quest_completions.quest_category` | Where they focus energy |
| Skip patterns | `quest_completions` (missing entries) | Identify resistance areas |
| Points earned | `user_projects.total_points` | Gamification/motivation |

---

### Weekly Plans → CRM Task Sync

| Data Point | Table | CRM Use |
|------------|-------|---------|
| Planned tasks | `weekly_plans.planned_tasks` | Could sync to CRM tasks |
| Priorities | `weekly_plans.priorities` | Focus areas for content |
| Blockers | `weekly_plans.blockers` | AI coaching opportunities |

---

## IMPLEMENTATION: New challengeDataService.js

```javascript
// src/lib/crm/challengeDataService.js (NEW FILE)

import { supabase } from '../supabaseClient'

// ============================================================================
// MISSING DATA FETCHERS
// ============================================================================

export async function fetchOfferStackData(userId) {
  const { data, error } = await supabase
    .from('offer_stack_builds')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching offer stack:', error)
  }
  return data
}

export async function fetchGrandSlamData(userId) {
  const { data, error } = await supabase
    .from('grand_slam_offers')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching grand slam:', error)
  }
  return data
}

export async function fetchValidationAnalysis(userId) {
  const { data, error } = await supabase
    .from('validation_analysis')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching validation analysis:', error)
  }
  return data
}

export async function fetchLaunchReadiness(userId) {
  const { data, error } = await supabase
    .from('launch_readiness_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching launch readiness:', error)
  }
  return data
}

export async function fetchProductSelections(userId) {
  const { data, error } = await supabase
    .from('product_selections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) console.error('Error fetching product selections:', error)
  return data || []
}

export async function fetchMVPReadiness(userId) {
  const { data, error } = await supabase
    .from('mvp_readiness_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching MVP readiness:', error)
  }
  return data
}

// ============================================================================
// PSYCHOLOGICAL DATA FETCHERS
// ============================================================================

export async function fetchPsychologicalProfile(userId) {
  const [groanPatterns, nervousSystem] = await Promise.all([
    fetchGroanPatterns(userId),
    fetchNervousSystemData(userId)
  ])

  return {
    dominantFear: groanPatterns.topFear,
    dominantArchetype: groanPatterns.topArchetype,
    visibilityComfort: groanPatterns.flowPatterns,
    earningCeiling: nervousSystem?.earning_ceiling,
    visibilityCeiling: nervousSystem?.visibility_ceiling,
    recommendedTone: calculateRecommendedTone(groanPatterns, nervousSystem)
  }
}

async function fetchGroanPatterns(userId) {
  // Use the SQL views for aggregated data
  const [{ data: fears }, { data: archetypes }, { data: flow }] = await Promise.all([
    supabase.from('user_fear_patterns').select('*').eq('user_id', userId),
    supabase.from('user_archetype_patterns').select('*').eq('user_id', userId),
    supabase.from('user_visibility_flow_patterns').select('*').eq('user_id', userId)
  ])

  return {
    topFear: fears?.sort((a, b) => b.occurrence_count - a.occurrence_count)[0]?.fear_type,
    topArchetype: archetypes?.sort((a, b) => b.occurrence_count - a.occurrence_count)[0]?.protective_archetype,
    flowPatterns: flow || []
  }
}

async function fetchNervousSystemData(userId) {
  const { data, error } = await supabase
    .from('nervous_system_responses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching NS data:', error)
  }
  return data
}

function calculateRecommendedTone(groanPatterns, nervousSystem) {
  // Returns 'assertive', 'balanced', or 'gentle'
  const { topFear, topArchetype } = groanPatterns

  if (topFear === 'rejection' || topArchetype === 'ghost') {
    return 'gentle'
  }
  if (topArchetype === 'performer' || topArchetype === 'controller') {
    return 'assertive'
  }
  return 'balanced'
}

// ============================================================================
// COMPLETENESS CHECK
// ============================================================================

export async function getChallengeCompleteness(userId) {
  const [
    offerStack,
    grandSlam,
    validation,
    launchReadiness,
    productSelections
  ] = await Promise.all([
    fetchOfferStackData(userId),
    fetchGrandSlamData(userId),
    fetchValidationAnalysis(userId),
    fetchLaunchReadiness(userId),
    fetchProductSelections(userId)
  ])

  return {
    offerStack: {
      completed: offerStack?.status === 'completed',
      hasLeadMagnet: !!offerStack?.lead_magnet_type,
      hasBonuses: offerStack?.bonuses?.length > 0,
      hasGuarantee: !!offerStack?.guarantee_type,
      hasScarcity: offerStack?.scarcity_types?.length > 0
    },
    grandSlam: {
      completed: grandSlam?.status === 'completed',
      score: grandSlam?.grand_slam_score,
      hasProof: !!grandSlam?.proof_data
    },
    validation: {
      completed: !!validation,
      hasPainLanguage: validation?.language_patterns?.length > 0,
      hasObjections: validation?.objections?.length > 0
    },
    launchReadiness: {
      completed: !!launchReadiness,
      score: launchReadiness?.readiness_score,
      grade: launchReadiness?.readiness_grade
    },
    productDesign: {
      completed: productSelections?.length > 0,
      productsDesigned: productSelections?.length || 0
    }
  }
}
```

---

*Last Updated: January 2025*
