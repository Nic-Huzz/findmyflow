# Skill Segment → Product Type Mapping

Maps the 12 Skills Wheel taxonomy segments to natural product types from the Offer Builder.
Used in `/offer-builder` (Q3 solution type suggestions) and `/product-designer` (mechanism & feature suggestions).

## Data Sources
- **Skills Wheel Segments**: `src/lib/wheelTaxonomy.js` → `SKILLS_SEGMENTS`
- **Product Types**: `src/flows/OfferBuilderFlow.jsx` → `SOLUTION_LABELS`
- **Skills Data**: `nikigai_clusters` table where `cluster_type = 'skills'`
- **Proficiency Rings**: emerging / establishing / mastering

---

## Direct Mappings (8 of 12)

These segments have a clear, natural product type. The skill points the user toward a specific delivery method.

### 1. Building (The Maker) → Products

| Field | Value |
|-------|-------|
| **Segment** | `building` |
| **Tagline** | "You turn ideas into reality" |
| **Primary Product Types** | Software/SaaS, Tech/Digital, Physical Product |
| **Secondary Product Types** | Digital Product, Done-For-You |
| **Why** | The example jobs are Software Developer, Engineer, Carpenter. They make things — the product IS what they make. |

**Proficiency guidance:**
- **Mastering**: Build and sell your own product. Premium positioning.
- **Establishing**: Build for others (Done-For-You) or contribute to a team product.
- **Emerging**: Prototype, but don't ship solo yet. Partner with someone who can polish.

---

### 2. Clarifying (The Translator) → Courses & Guides

| Field | Value |
|-------|-------|
| **Segment** | `clarifying` |
| **Tagline** | "You make the complex simple" |
| **Primary Product Types** | Self-Paced Course, Digital Product |
| **Secondary Product Types** | Group Program, Packaged Service |
| **Why** | Teachers and explainers are natural course creators and guide writers. The skill IS the delivery method — simplifying complex topics into structured learning. |

**Proficiency guidance:**
- **Mastering**: Create a flagship course or comprehensive guide. Charge premium.
- **Establishing**: Start with a smaller digital product (ebook, template pack) to build proof.
- **Emerging**: Guest teach or collaborate on someone else's course to develop the skill.

---

### 3. Nurturing (The Grower) → 1:1 & Group Coaching

| Field | Value |
|-------|-------|
| **Segment** | `nurturing` |
| **Tagline** | "You develop potential in others" |
| **Primary Product Types** | Custom Service (1:1), Group Program |
| **Secondary Product Types** | Live Cohort, Packaged Service |
| **Why** | Coaches, mentors, and therapists develop people. These product types exist specifically for that relationship-based development work. |

**Proficiency guidance:**
- **Mastering**: Lead a premium 1:1 practice or signature group program.
- **Establishing**: Offer coaching packages at mid-tier pricing. Document your methodology.
- **Emerging**: Peer coaching or accountability partnerships to build hours and confidence.

---

### 4. Connecting (The Bridge Builder) → Community & Membership

| Field | Value |
|-------|-------|
| **Segment** | `connecting` |
| **Tagline** | "You bring people together" |
| **Primary Product Types** | Membership, Group Program, Live Cohort |
| **Secondary Product Types** | Packaged Service (facilitation) |
| **Why** | Community managers, facilitators, and networkers naturally run communities and host events. The product is the space and connections they create. |

**Proficiency guidance:**
- **Mastering**: Launch a paid membership or recurring mastermind. You ARE the draw.
- **Establishing**: Facilitate within someone else's community or co-host events.
- **Emerging**: Build a free community first to develop facilitation skills.

---

### 5. Organizing (The Systems Architect) → Systems & Done-For-You

| Field | Value |
|-------|-------|
| **Segment** | `organizing` |
| **Tagline** | "You create order from chaos" |
| **Primary Product Types** | Done-For-You, Software/SaaS, Packaged Service |
| **Secondary Product Types** | Digital Product (templates, SOPs) |
| **Why** | Systems people create repeatable processes. "Packaged" and "Done-For-You" are literally about standardised, systematised delivery. SaaS tools that organise things are a natural extension. |

**Proficiency guidance:**
- **Mastering**: Sell your systems — either as a service (Done-For-You setup) or as a tool (SaaS).
- **Establishing**: Create template packs and SOPs as digital products.
- **Emerging**: Document and systematise your own workflow first. Sell it once it's proven.

---

### 6. Strategizing (The Gamemaker) → Consulting

| Field | Value |
|-------|-------|
| **Segment** | `strategizing` |
| **Tagline** | "You think 10 moves ahead" |
| **Primary Product Types** | Custom Service (consulting), Packaged Service (strategy packages) |
| **Secondary Product Types** | Group Program (mastermind) |
| **Why** | Consultants, strategists, and advisors sell their thinking. Strategy retainers and roadmap packages are the textbook product types for this skill. |

**Proficiency guidance:**
- **Mastering**: Premium 1:1 consulting or strategy retainers. Mastermind facilitation.
- **Establishing**: Packaged strategy audits at fixed pricing. Lower risk for buyers.
- **Emerging**: Offer free strategy sessions to build a portfolio of recommendations.

---

### 7. Analyzing (The Pattern Spotter) → Audits & Analytics Tools

| Field | Value |
|-------|-------|
| **Segment** | `analyzing` |
| **Tagline** | "You see what others miss" |
| **Primary Product Types** | Packaged Service (audits, diagnostics), Software/SaaS (analytics tools) |
| **Secondary Product Types** | Digital Product (scorecards, frameworks) |
| **Why** | Data analysts, researchers, and diagnosticians deliver insight. Packaged audits are the natural service format; analytics dashboards are the natural product format. |

**Proficiency guidance:**
- **Mastering**: Premium audit packages or build an analytics tool. Your insight is the product.
- **Establishing**: Create scorecard templates or diagnostic frameworks as digital products.
- **Emerging**: Offer free audits to build case studies and sharpen your diagnostic process.

---

### 8. Designing (The Experience Crafter) → Custom Service

| Field | Value |
|-------|-------|
| **Segment** | `designing` |
| **Tagline** | "You shape how things feel" |
| **Primary Product Types** | Custom Service (bespoke design work) |
| **Secondary Product Types** | Digital Product (templates, design systems), Packaged Service |
| **Why** | Most designers do bespoke client work — the craft is inherently custom. Templates and design systems are the productised extension, but the core is client-facing creative work. |

**Proficiency guidance:**
- **Mastering**: Premium custom design services. Your portfolio speaks for itself.
- **Establishing**: Create design templates and systems as digital products while building client work.
- **Emerging**: Contribute to others' projects. Build a portfolio before going solo.

---

## Amplifier Mappings (4 of 12)

These segments don't point to a single product type. Instead, they **amplify** whatever product the user builds. They make any offer more compelling, more original, or more visible.

In the UI, these should be surfaced differently — not as "build this product type" but as "this skill makes your offer stronger in this way."

### 9. Creating (The Originator) → Amplifies: Originality

| Field | Value |
|-------|-------|
| **Segment** | `creating` |
| **Tagline** | "You bring new things into existence" |
| **Default Product Types** | Productised Services, Digital Products |
| **Amplifier Effect** | Makes any product more original, novel, and differentiated |
| **Why it's an amplifier** | "Creating" is so broad (artists, writers, inventors, composers) that the skill doesn't point to a delivery method — it points to the quality of what's delivered. A creator can make a course, a product, a service, or content. The common thread is originality, not format. |

**How to surface in UI:**
> "Your creating skill means your offer will stand out through originality. Whatever you build, lead with what makes it uniquely yours."

**Proficiency guidance:**
- **Mastering**: Your original work IS the product. Lead with it.
- **Establishing**: Infuse originality into a proven format (course, service, product).
- **Emerging**: Experiment widely. Your creative voice is still forming.

---

### 10. Expressing (The Voice) → Amplifies: Visibility & Reach

| Field | Value |
|-------|-------|
| **Segment** | `expressing` |
| **Tagline** | "You give form to what matters" |
| **Default Product Types** | Content (Podcast, Newsletter, YouTube) |
| **Amplifier Effect** | Makes any product more visible, shareable, and emotionally compelling |
| **Why it's an amplifier** | Speakers, podcasters, and storytellers are natural content creators, but expression also supercharges marketing for ANY product type. A coach who can express well fills their practice. A builder who can express well gets users for their SaaS. |

**How to surface in UI:**
> "Your expressing skill is your marketing superpower. Whether you build content as your product or use it to promote another offer, your voice will be what draws people in."

**Proficiency guidance:**
- **Mastering**: Content can BE your product (podcast, newsletter, YouTube). Or use it as the growth engine for any other offer.
- **Establishing**: Start sharing your journey publicly. Build an audience alongside your core offer.
- **Emerging**: Practice expressing in low-stakes formats (writing, short videos) before going live.

---

### 11. Influencing (The Catalyst) → Amplifies: Conversion & Sales

| Field | Value |
|-------|-------|
| **Segment** | `influencing` |
| **Tagline** | "You move people to action" |
| **Default Product Types** | Custom Service (sales consulting, high-ticket closing) |
| **Amplifier Effect** | Makes any product sell better, convert higher, and command premium pricing |
| **Why it's an amplifier** | Sales professionals, marketers, and negotiators can sell anything. The skill is about persuasion and momentum — it applies to every product type. An influencer selling a course converts better than a non-influencer with the same course. |

**How to surface in UI:**
> "Your influencing skill means you can sell whatever you build. This is rare — most people build great things but struggle to sell them. You won't have that problem."

**Proficiency guidance:**
- **Mastering**: You can sell premium. High-ticket consulting, sales training, or be the sales engine for any business.
- **Establishing**: Use your influence to pre-sell and validate before building. Your conversion rate is your advantage.
- **Emerging**: Practice selling other people's products (affiliate, partnerships) to build the muscle.

---

### 12. Synthesizing (The Integrator) → Amplifies: Depth & Integration

| Field | Value |
|-------|-------|
| **Segment** | `synthesizing` |
| **Tagline** | "You see the whole picture" |
| **Default Product Types** | Content (frameworks, thought leadership), Productised Services |
| **Amplifier Effect** | Makes any product more comprehensive, integrated, and intellectually credible |
| **Why it's an amplifier** | Philosophers, systems thinkers, and futurists connect dots others miss. This skill makes a course deeper, a service more holistic, and content more thought-provoking. The delivery method varies; the depth doesn't. |

**How to surface in UI:**
> "Your synthesizing skill means you see connections others miss. Your offer will stand out through depth and integration — the 'aha' moments only you can create."

**Proficiency guidance:**
- **Mastering**: Create integrative frameworks and thought leadership content. Consulting at the highest level.
- **Establishing**: Build productised services that combine multiple disciplines. Your cross-domain thinking is the value.
- **Emerging**: Write and share your synthesis publicly. Frameworks and models are how you demonstrate this skill.

---

## Amplifier Behaviour in the UI

### In `/offer-builder` (Q3 — solution type selection)

**Direct mappings (8 segments):**
Surface as product type suggestions:
> "Based on your skills, you might consider: **Packaged Service** (your analyzing skill is perfect for audit packages)"

**Amplifier mappings (4 segments):**
Surface as value-add context alongside whatever type they choose:
> "Your expressing skill will be a major asset here — you'll naturally attract attention to whatever you build"

### In `/product-designer` (mechanism & features)

**Direct mappings:**
Pre-populate mechanism suggestions based on the skill:
> "How does this solve their problem? Your **organizing** skill suggests: through systematised processes and clear structure..."

**Amplifiers:**
Add to the features or proof sections:
> "Consider adding: **Original framework** (your creating skill) or **Video walkthrough** (your expressing skill)"

### Combined Example

A user with **Nurturing (mastering)** + **Expressing (establishing)** + **Organizing (emerging)**:

> **Recommended product type:** Custom Service (1:1 coaching) — your nurturing skill at mastering level
>
> **Amplifier boost:** Your expressing skill means content marketing will come naturally. Consider a podcast or newsletter to attract coaching clients.
>
> **Growth edge:** Your organizing skill is emerging — as it develops, you could systematise your coaching into a group program.

---

## Content Type Gap (RESOLVED Feb 2026)

"Content" (podcast, newsletter, YouTube) has been added as a product type:

| Location | Status | File |
|----------|--------|------|
| Income Calculator | Present | `src/lib/incomeCalculatorData.js` |
| OfferBuilderFlow Q8 | **Added** | `src/flows/OfferBuilderFlow.jsx` |
| DeliverySelector | **Added** | `src/components/onboarding/QuickCapture/DeliverySelector.jsx` |
| ProductSelectionFlow labels | **Added** | `src/flows/ProductSelectionFlow.jsx` |

Content subtypes: `content_podcast`, `content_newsletter`, `content_youtube`

---

## Integration Status

### `/offer-builder` (IMPLEMENTED Feb 2026)

The skill-product mapping is now integrated into Q8 (Solutions) via:
- `src/lib/skillProductMapping.js` — mapping data and helper functions
- `getSkillProductSuggestions(cluster)` — returns `{ suggestions, amplifierMessage, proficiencyTip, isAmplifier }`
- Skills panel shows amplifier badges and messages for Creating/Expressing/Influencing/Synthesizing
- Proficiency tips display based on the user's proficiency level

### `/product-designer` (TODO)

Still needs integration. In `ProductSelectionFlow.jsx`, fetch skills data and use the mapping to:
- Pre-populate mechanism suggestions based on skills
- Suggest features based on skill segments
- Show amplifier context in the proof section

### Data Query

```javascript
const { data: skillsClusters } = await supabase
  .from('nikigai_clusters')
  .select('cluster_label, proficiency, items, taxonomy_keys')
  .eq('user_id', user.id)
  .eq('cluster_type', 'skills')
  .eq('cluster_stage', 'final')
```

Then use `taxonomy_keys` to look up each cluster's segment and call `getSkillProductSuggestions(cluster)`.
