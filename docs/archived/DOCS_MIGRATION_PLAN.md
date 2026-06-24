# Docs Folder Migration Plan

> **Generated:** January 23, 2026
> **Status:** PENDING APPROVAL - Review before executing

---

## Proposed Folder Structure

```
docs/
├── archive/                    # Historical records, completed work
│   ├── sessions/               # Dated session logs
│   └── completed/              # Implemented plans & specs
│
├── reference/                  # Evergreen documentation
│   ├── architecture/           # System design, data flows
│   ├── guides/                 # How-to docs, conventions
│   └── brand/                  # Voice, design, branding
│
├── planning/                   # Active & future work
│   ├── active/                 # Currently being implemented
│   └── backlog/                # Roadmaps, future features
│
├── specs/                      # Feature specifications (not yet built)
│
├── systems/                    # Domain-specific systems
│   ├── nikigai/                # Nikigai framework docs
│   ├── crm/                    # CRM system docs
│   └── wheel-taxonomy/         # Competence wheels system
│
└── mockups/                    # (already exists)
```

---

## Migration Mapping

### → `archive/sessions/` (18 files)
*Dated session logs documenting completed work*

| File | Reasoning |
|------|-----------|
| `2024-12-20-implementation-summary.md` | Dec 2024 session - completed |
| `2024-12-20-major-refactor-plan.md` | Dec 2024 refactor - completed |
| `2024-12-21-refactoring-session.md` | Dec 2024 session - completed |
| `session-2024-12-26-journey-mapping.md` | Dec 2024 session - completed |
| `session-2024-12-27-business-tab-rename.md` | Dec 2024 session - completed |
| `session-2024-12-28-ui-updates.md` | Dec 2024 session - completed |
| `session-2024-12-30-product-lead-magnet-enhancements.md` | Dec 2024 session - completed |
| `session-2024-12-30-ui-improvements.md` | Dec 2024 session - completed |
| `session-2024-12-30-weekly-planning-polish.md` | Dec 2024 session - completed |
| `session-learnings-2025-12-15.md` | Session learnings - historical |
| `session-updates-2024-12-13.md` | Session updates - historical |
| `bug-fixes-dec-2024.md` | Bug fixes completed - historical |
| `CHANGELOG-phase3-enhancements.md` | Changelog - historical record |

---

### → `archive/completed/` (15 files)
*Implementation plans & specs for features that are shipped*

| File | Reasoning |
|------|-----------|
| `zarlo-v1-implementation-spec.md` | Zarlo V1 shipped |
| `zarlo-page-content.md` | Zarlo page content - implemented |
| `ONBOARDING_V2_BUILD_SUMMARY.md` | Build complete - implementation record |
| `ONBOARDING_V2_IMPLEMENTATION_PLAN.md` | Onboarding V2 implemented |
| `weekly-planning-system-plan.md` | Weekly planning - implemented |
| `groan-layers-and-fears-proposal.md` | Groan system - implemented |
| `nervous-system-healing-compass-rebuild.md` | NS flow - rebuilt/shipped |
| `challenge-tabs-restructure.md` | Old restructure - superseded |
| `architecture-review-dec-2024.md` | Dec 2024 review - historical |
| `business-summary-tab-ideas.md` | Ideas explored - historical |
| `challenge-portal-recommendations.md` | Recommendations - addressed |

---

### → `reference/architecture/` (8 files)
*Current system design - keep updated as system evolves*

| File | Reasoning |
|------|-----------|
| `SYSTEM_ARCHITECTURE_MAP.md` | Core architecture reference |
| `crm-architecture.md` | CRM system architecture |
| `AUTONOMOUS_SYSTEM_ARCHITECTURE.md` | Autonomous system design |
| `BUSINESS_PROFILE_ARCHITECTURE.md` | Business profile structure |
| `PRODUCT_SUITE_ARCHITECTURE.md` | Product suite design |
| `CONTENT_SYSTEM_ARCHITECTURE.md` | Content system design |
| `supabase-setup.md` | Database setup reference |

---

### → `reference/guides/` (6 files)
*How-to documentation & conventions*

| File | Reasoning |
|------|-----------|
| `CSS-SCOPING-GUIDELINES.md` | CSS conventions - active reference |
| `CSS-SCOPING-TEST-CHECKLIST.md` | CSS testing checklist |
| `CSS_CONVENTIONS.md` | Additional CSS conventions |
| `7-day-challenge-system.md` | Challenge system reference |
| `user-commands-spec.md` | User commands reference |
| `offer-flow-branding-guide.md` | Offer flow branding |

---

### → `reference/brand/` (3 files)
*Brand identity & design guidelines*

| File | Reasoning |
|------|-----------|
| `design-guide.md` | Brand colors, typography |
| `BRAND_VOICE.md` | Brand voice guidelines |
| `VISION_AND_CONTEXT.md` | Project vision document |

---

### → `planning/active/` (8 files)
*Currently being implemented or recently active*

| File | Reasoning |
|------|-----------|
| `challenge-restructure-plan.md` | Active - voices tab restructure |
| `crm-implementation-plan.md` | Active - CRM hybrid approach |
| `crm-challenge-data-mapping.md` | Active - data mapping work |
| `2025-01-05-follow-up-tasks.md` | Has unchecked tasks |
| `2026-01-05-crm-hormozi-implementation.md` | Active CRM work |
| `2026-01-05-crm-updates.md` | Active CRM updates |
| `2026-01-05-implementation-plan.md` | Active implementation |
| `2026-01-10-quest-input-refactor-testing.md` | Testing in progress |

---

### → `planning/backlog/` (12 files)
*Roadmaps & future features*

| File | Reasoning |
|------|-----------|
| `FEATURES_ROADMAP.md` | Feature roadmap |
| `ANALYTICS_ROADMAP.md` | Analytics roadmap |
| `AUTOPILOT_SCOPE.md` | Autopilot future scope |
| `AI_CONTENT_AUTOPILOT_FLOW.md` | Future AI flow |
| `AI_CONTENT_COPILOT_PLAN.md` | Future AI copilot |
| `AI_SAFETY_IMPLEMENTATION_PLAN.md` | Safety features backlog |
| `ai-co-founder-agent-system.md` | Agent system planning |
| `ai-insights-features.md` | AI insights backlog |
| `crm-future-features.md` | CRM future features |
| `2026-01-05-next-phase-guide.md` | Future phases |
| `2026-01-07-ux-improvement-recommendations.md` | UX improvements backlog |
| `VALIDATION_FLOW_1000000_IMPROVEMENTS.md` | Validation flow improvements |

---

### → `specs/` (8 files)
*Feature specifications - not yet fully built*

| File | Reasoning |
|------|-----------|
| `ONBOARDING_V2_SPEC.md` | Keep for reference until stable |
| `PERSONALIZED_INSIGHTS_SPEC.md` | Insights spec - not fully built |
| `SALES_TOWER_V2_PLAN.md` | Sales tower V2 spec |
| `SALES_TOWER_AGENT_PROMPT.md` | Agent prompt spec |
| `TIER_3_AI_IMPLEMENTATION_COACH.md` | Tier 3 coach spec |
| `2026-01-08-sales-tower-implementation-tiers.md` | Implementation tiers |
| `2026-01-08-tier4-data-requirements.md` | Tier 4 requirements |
| `MARKETING_TOWER_UNIFIED.md` | Marketing tower spec |

---

### → `systems/nikigai/` (12 files)
*Nikigai framework documentation*

| File | Reasoning |
|------|-----------|
| `nikigai-auto-tagging-schema.md` | Tagging schema |
| `nikigai-cluster-refinement-interface.md` | Cluster UI |
| `nikigai-clustering-quality-metrics.md` | Quality metrics |
| `nikigai-fallback-strategies.md` | Fallback handling |
| `nikigai-job-title-mapping.md` | Job title mapping |
| `nikigai-role-archetypes.md` | Role archetypes |
| `nikigai-sparse-data-handling.md` | Sparse data |
| `nikigai-structured-outputs.md` | Structured outputs |
| `nikigai-supabase-schema.md` | Database schema |
| `nikigai-tag-ambiguity-decision-tree.md` | Tag decisions |
| `nikigai-validation-layer.md` | Validation layer |
| `nikigai-weighting-functions.md` | Weighting functions |

---

### → `systems/crm/` (6 files)
*CRM system documentation*

| File | Reasoning |
|------|-----------|
| `CRM_BY_BUSINESS_TYPE.md` | CRM by business type |
| `CONTENT_AUTOPILOT_SALES_INTEGRATION.md` | Content + sales integration |
| `2026-01-05-crm-test-checklist.md` | CRM testing checklist |
| `2026-01-07-marketing-pillars-implementation.md` | Marketing pillars |
| `P3_BUSINESS_TYPES_FRAMEWORK.md` | Business types framework |

---

### → Keep in root `docs/` (8 files)
*High-level project docs that should be easily discoverable*

| File | Reasoning |
|------|-----------|
| `PROJECT-SUMMARY.md` | Project overview |
| `PROJECT_NOTES_ORGANIZED.md` | Organized notes |
| `PUBLIC_FLOWS_TESTING_CHECKLIST.md` | Active testing |
| `2026-01-10-flow-context-gaps-analysis.md` | Recent analysis |
| `VISION_PILLARS_ASSESSMENT.md` | Vision assessment |
| `alfred-system-prompt.md` | AI system prompt |

---

### → `systems/wheel-taxonomy/` (4 files)
*Wheel/competence system documentation*

| File | Reasoning |
|------|-----------|
| `COMPETENCE_WHEELS_DESIGN.md` | Wheel design system |
| `WHEEL_ALIGNMENT_ANALYSIS.md` | Wheel alignment analysis |
| `WHEEL_TAXONOMY.md` | Wheel taxonomy reference |
| `USER_WHEEL_PROFILE_NIC.md` | User wheel profile example |

---

## Summary Stats

| Destination | File Count |
|-------------|------------|
| `archive/sessions/` | 13 |
| `archive/completed/` | 11 |
| `reference/architecture/` | 8 |
| `reference/guides/` | 6 |
| `reference/brand/` | 3 |
| `planning/active/` | 8 |
| `planning/backlog/` | 12 |
| `specs/` | 8 |
| `systems/nikigai/` | 12 |
| `systems/crm/` | 5 |
| `systems/wheel-taxonomy/` | 4 |
| Keep in root | 8 |
| **Total** | **98** |

---

## Execution Commands

Once approved, run these commands:

```bash
# Create folder structure
cd /Users/nichurrell/creations/Findmyflow/docs
mkdir -p archive/sessions archive/completed
mkdir -p reference/architecture reference/guides reference/brand
mkdir -p planning/active planning/backlog
mkdir -p specs
mkdir -p systems/nikigai systems/crm systems/wheel-taxonomy

# Then move files per the mapping above
# (Full move commands will be generated after approval)
```

---

## After Migration

1. **Update CLAUDE.md** - Change docs folder structure reference
2. **Add README.md to each folder** - Brief description of what goes there
3. **Set up review cadence** - Monthly check: move completed plans to archive

---

## Approval

- [ ] Reviewed migration mapping
- [ ] Ready to execute migration

**To proceed:** Reply with approval and any changes to the mapping.
