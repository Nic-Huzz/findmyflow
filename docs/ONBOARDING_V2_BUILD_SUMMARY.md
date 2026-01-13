# Onboarding V2 Build Summary

**Built:** January 13, 2026
**Verified:** January 14, 2026
**Status:** Core implementation complete, bugs fixed, ready for QA testing

---

## Overview

Onboarding V2 replaces the persona-voting system with a wealth-ladder + goal-based path routing system. Users answer three questions (Q1: Journey Stage, Q2: Wealth Ladder, Q3: Goal) and are routed to one of four paths with appropriate guidance emphasis.

### Key Concepts

- **Wealth Ladder (Nathan Barry):** pre_ladder → service → productized → products
- **Guidance Emphasis:** 8 values that control quest priority, dashboard hero, and Zarlo personality
- **Persona Derivation:** Personas are now derived from wealth ladder position, not voted
- **Quick Capture:** Non-pre-ladder users capture their business info via wheels + product cards

---

## Files Created

### Phase 1: Database Migration
| File | Description |
|------|-------------|
| `supabase/migrations/20260114000000_onboarding_v2_schema.sql` | V2 schema changes + products table |

### Phase 2: Core Components
| File | Description |
|------|-------------|
| `src/lib/onboardingV2.js` | Path routing logic, emphasis config, persona display |
| `src/components/onboarding/PersonaReveal.jsx` | Animated persona reveal component |
| `src/components/onboarding/PersonaReveal.css` | Persona reveal styles |
| `src/components/onboarding/OnboardingV2.jsx` | Orchestrator component |
| `src/components/onboarding/OnboardingV2.css` | Orchestrator styles |
| `src/components/onboarding/index.js` | Barrel exports |

### Phase 3: Quick Capture
| File | Description |
|------|-------------|
| `src/components/onboarding/QuickCapture/WheelPicker.jsx` | Wheel segment picker with ring follow-ups |
| `src/components/onboarding/QuickCapture/WheelPicker.css` | Wheel picker styles |
| `src/components/onboarding/QuickCapture/DeliverySelector.jsx` | Product type selector |
| `src/components/onboarding/QuickCapture/DeliverySelector.css` | Delivery selector styles |
| `src/components/onboarding/QuickCapture/ProductCard.jsx` | Individual product capture card |
| `src/components/onboarding/QuickCapture/ProductCard.css` | Product card styles |
| `src/components/onboarding/QuickCapture/MultiProductCapture.jsx` | Multi-product manager |
| `src/components/onboarding/QuickCapture/MultiProductCapture.css` | Multi-product styles |
| `src/components/onboarding/QuickCapture/QuickCapture.jsx` | Quick capture orchestrator |
| `src/components/onboarding/QuickCapture/QuickCapture.css` | Quick capture styles |
| `src/components/onboarding/QuickCapture/index.js` | Barrel exports |

### Phase 4: Flow Report Card
| File | Description |
|------|-------------|
| `src/pages/FlowReportCard.jsx` | New report card page |
| `src/pages/FlowReportCard.css` | Report card styles |

### Phase 5: Integration
| File | Description |
|------|-------------|
| `src/lib/productsService.js` | Products CRUD service |

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/HomeFirstTime.jsx` | Added Q1-Q3 screens, Quick Capture routing, V2 handlers |
| `src/lib/graduationChecker.js` | Added auto-emphasis progression on graduation |
| `src/AppRouter.jsx` | Added /report-card route |

---

## Path Routing Logic

### Path 1: Pre-Ladder
- **Wealth Ladder:** `pre_ladder`
- **Valid Goals:** `discovery`, `creation`
- **Emphasis:** `deep_discovery` or `fast_track_creation`
- **Flow:** Q1-Q3 → Persona Reveal → Flow Finder explainer → `/nikigai/skills`

### Path 2: Service
- **Wealth Ladder:** `service`
- **Valid Goals:** `creation`, `monetization`
- **Emphasis:** `offer_refinement` or `client_acquisition`
- **Flow:** Q1-Q3 → Persona Reveal → Quick Capture

### Path 3: Productized
- **Wealth Ladder:** `productized`
- **Valid Goals:** `creation`, `monetization`, `growth`
- **Emphasis:** `suite_building` or `launch_sales`
- **Flow:** Q1-Q3 → Persona Reveal → Quick Capture

### Path 4: Products
- **Wealth Ladder:** `products`
- **Valid Goals:** `monetization`, `growth`
- **Emphasis:** `pipeline_optimization` or `scale_systems`
- **Flow:** Q1-Q3 → Persona Reveal → Quick Capture

---

## Wheel Follow-up Questions (Ring System)

Each wheel has a dimensional follow-up after segment selection:

| Wheel | Question | Rings |
|-------|----------|-------|
| Skills | "How confident are you with this skill?" | Emerging, Establishing, Mastering |
| Problems | "What's your experience with this?" | Exploring, Pursuing, Proven |
| Personas | "Where are they in their journey?" | Awakening, Struggling, Ready |

---

## Verification Results (January 14, 2026)

### Items Verified
1. **wheelTaxonomy.js** - All required exports confirmed present
2. **persona-assessment.json** - Q3 goal values confirmed correct (discovery, creation, monetization, growth)
3. **GradientWheel component** - Confirmed accepts required props (segments, rings, litCells, size, centerLabel, interactive)
4. **Database migration** - Schema verified complete with RLS policies

### Bugs Fixed
| Issue | File | Fix |
|-------|------|-----|
| Wrong column name | FlowReportCard.jsx:206 | Changed `persona_type` to `persona` |
| Wrong property access | FlowReportCard.jsx:400 | Changed `personaInfo.label` to `personaInfo.name` |
| Wrong column name | productsService.js:71 | Changed `price` to `price_amount` |
| Wrong column name | productsService.js:223-228 | Changed `product.price` to `product.price_amount` |
| Wrong column name | QuickCapture.jsx:160 | Changed `price` to `price_amount` |
| Wrong column name | FlowReportCard.jsx:361 | Changed `product.price` to `product.price_amount` |
| Wrong column name | QuickCapture.jsx:182 | Changed `quick_capture_completed` to `onboarding_v2_completed` |
| Summary showing IDs | QuickCapture.jsx:319-354 | Now uses `getSegmentName()` helper for display names |

---

## Remaining Items to Review

### 1. **Database migration needs to be applied**
Run the migration to create the products table and add V2 columns:
```bash
npm run db:push
# or apply manually via Supabase dashboard
```

### 2. **Products table RLS policies**
The migration creates RLS policies but they should be tested:
- Users can only view/edit their own products
- Insert, update, delete policies are in place

### 3. **Quick Capture localStorage handling**
Quick capture saves progress to localStorage. Test:
- Resuming from different steps
- Clearing localStorage on completion
- Edge cases (browser refresh mid-flow)

### 4. **Auto-emphasis progression edge cases**
The progression logic triggers on stage completion. Test:
- User manually changes emphasis vs. auto-progression
- Emphasis doesn't progress if user is at `scale_systems` (terminal state)

---

## Testing Checklist

### Path 1 (Pre-Ladder) - Code Verified
- [x] Q1 shows all journey options (persona-assessment.json lines 13-54)
- [x] Q2 shows wealth ladder options (persona-assessment.json lines 72-108)
- [x] Q3 greys out `monetization` and `growth` (onboardingV2.js:128-129)
- [x] Persona reveal shows `vibe_seeker` (onboardingV2.js:114)
- [x] Continue goes to Flow Finder explainer (HomeFirstTime.jsx:227-229)
- [x] "I have 5 minutes" goes to `/nikigai/skills` (HomeFirstTime.jsx:511)

### Path 2-4 (Non-Pre-Ladder) - Code Verified
- [x] Q3 greys out appropriate options based on Q2 (onboardingV2.js:126-139)
- [x] Persona reveal shows correct derived persona (onboardingV2.js:112-120)
- [x] Continue goes to Quick Capture (HomeFirstTime.jsx:230-232)
- [x] Skills wheel shows ring follow-up modal (WheelPicker.jsx:140-173)
- [x] Problems wheel shows ring follow-up modal (WheelPicker.jsx:140-173)
- [x] Personas wheel shows ring follow-up modal (WheelPicker.jsx:140-173)
- [x] Product capture works with all steps (QuickCapture.jsx orchestrates all steps)
- [x] Summary shows captured data with display names (QuickCapture.jsx:319-370)
- [x] Complete saves to database (QuickCapture.jsx:112-200)

### Flow Report Card - Code Verified
- [x] Route `/report-card` loads correctly (AppRouter.jsx:306)
- [x] Hero section shows persona, ladder, emphasis (FlowReportCard.jsx:396-419)
- [x] Wheels render with correct segments lit (FlowReportCard.jsx:239-304)
- [x] Products section shows products grouped by tier (FlowReportCard.jsx:306-374)
- [x] Quick actions navigate correctly (FlowReportCard.jsx:433-443)

### Existing User Migration - Schema Verified
- [x] Users with V1 data can still access their data (new columns are nullable)
- [x] New V2 fields default to null for existing users (migration lines 323-349)
- [x] Challenge system still works with existing users (unchanged)

---

## Next Steps

1. **Apply database migration** - Required before testing
2. **Test all 4 paths** - Manual QA through each onboarding flow
3. **Update CRM scripts** - May need to reference products table
4. **Dashboard integration** - Use `EMPHASIS_CONFIG.dashboardHero` for personalized dashboard
5. **Zarlo personality** - Implement `zarloPersonality` from emphasis config

---

## Files Structure Reference

```
src/
├── components/
│   └── onboarding/
│       ├── PersonaReveal.jsx
│       ├── PersonaReveal.css
│       ├── OnboardingV2.jsx
│       ├── OnboardingV2.css
│       ├── index.js
│       └── QuickCapture/
│           ├── WheelPicker.jsx
│           ├── WheelPicker.css
│           ├── DeliverySelector.jsx
│           ├── DeliverySelector.css
│           ├── ProductCard.jsx
│           ├── ProductCard.css
│           ├── MultiProductCapture.jsx
│           ├── MultiProductCapture.css
│           ├── QuickCapture.jsx
│           ├── QuickCapture.css
│           └── index.js
├── pages/
│   ├── FlowReportCard.jsx
│   └── FlowReportCard.css
├── lib/
│   ├── onboardingV2.js
│   └── productsService.js
└── supabase/
    └── migrations/
        └── 20260114000000_onboarding_v2_schema.sql
```

---

*Generated by Claude Code - January 13, 2026*
*Updated with verification and bug fixes - January 14, 2026*
