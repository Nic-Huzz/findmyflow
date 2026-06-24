# Library of Answers - Tab Reorganization Plan

## Status: IMPLEMENTED

---

## Nervous System Card Display (Completed)

Fixed the Nervous System card to show:
- Income edge (e.g., "$50,000")
- Visibility edge (e.g., "500 people")
- Core fear (in italics)
- Archetype (green tag)
- Limiting beliefs count (red tag)
- Date

---

## Tab Structure (Implemented)

### Design Decisions
1. Each flow exists inside a stage - stages as tabs, flow answers within
2. Dropdown selector for Business stages (cleaner UX since some stages have few flows)

---

## Tab 1: Flow Finder (Stage 0)

| Flow ID | Display Name |
|---------|--------------|
| nikigai_skills | Skills |
| nikigai_problems | Problems |
| nikigai_persona | Personas |
| nikigai_integration | Integration / Key Outcomes |

---

## Tab 2: Business (Stages 1-8)

### Option A: Stage Subtabs
### Option B: Dropdown selector

| Stage | Name | Flows |
|-------|------|-------|
| **1** | Validation | persona_selection |
| **2** | Product Creation | 100m_offer, lead_magnet_selection, product_selection |
| **3** | Testing | mvp_readiness, feedback_analysis |
| **4** | Money Models | attraction_offer, upsell_offer, downsell_offer, continuity_offer |
| **5** | Offer Creation | offer_builder_v2 (Grand Slam) |
| **6** | Campaign | leads_strategy |
| **7** | Launch | *(No flows - milestones only)* |
| **8** | Tracking | funnel_calculator |

### Flow Details by Stage

**Stage 1 - Validation**
- Persona Selection

**Stage 2 - Product Creation**
- $100M Offer Assessment
- Lead Magnet Selection
- Product Selection

**Stage 3 - Testing**
- MVP Readiness
- Feedback Analysis

**Stage 4 - Money Models**
- Attraction Offer
- Upsell Offer
- Downsell Offer
- Continuity Offer

**Stage 5 - Offer Creation**
- Offer Builder / Grand Slam

**Stage 6 - Campaign**
- Leads Strategy

**Stage 7 - Launch**
- *(Milestone-based, no flow responses to display)*

**Stage 8 - Tracking**
- Funnel Calculator metrics

---

## Tab 3: Healing

| Flow | Description |
|------|-------------|
| Nervous System Boundaries | Income/visibility edges, core fear, limiting beliefs |
| Healing Compass | Directional healing journey |

---

## Final Implementation

### 3 Main Tabs:
1. **Flow Finder** - Skills, Problems, Personas, Key Outcomes (unchanged)
2. **Business** - Stage dropdown selector with flows for each stage
3. **Healing** - Nervous System + Healing Compass combined

### Business Tab Dropdown
```
Stage: [4. Money Models ▼]
         ↓
   Attraction Offers
   Upsells
   Downsells
   Continuity Offers
```

### Files Modified
- `src/pages/LibraryOfAnswers.jsx` - New tab structure, stage dropdown, combined Healing
- `src/pages/LibraryOfAnswers.css` - Stage dropdown styling

---

*Implemented: January 2025*
