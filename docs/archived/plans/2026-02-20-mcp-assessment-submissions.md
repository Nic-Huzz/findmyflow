# MCP Assessment Submissions — Pickup Guide

**Date**: 2026-02-20
**Status**: Ready to execute (MCP connection dropped mid-session)

## What Was Done

1. Fixed MCP `get_user_context` bug — skills/problems filters now accept both singular and plural `cluster_type` values (deployed to production)
2. Researched two projects from GitHub repos:
   - `Nic-Huzz/buildwithai` — hackathon learning platform for non-technical entrepreneurs
   - `Nic-Huzz/be-your-best` — mental performance PWA for athletes
3. Prepared all assessment answers for **BYB App** (Be Your Best) project

## What Needs to Be Done

### Step 1: Submit Continuity Offer Assessment (HIGH CONFIDENCE — 85%)

```
Tool: submit_assessment
flow_id: continuity_offer
reasoning: "BYB App - Mental performance PWA for athletes. SaaS, high margins, self-serve, early stage."
answers:
  q1_business_model: saas_software
  q2_current_revenue_model: one_time_only
  q3_gross_margins: over_70_percent
  q4_repurchase_frequency: monthly
  q5_ongoing_value_capability: yes_easily
  q6_setup_onboarding_cost: minimal_to_none
  q7_customer_retention: just_starting_no_data
  q8_average_transaction_value: under_100
  q9_primary_continuity_goal: predictable_stable_revenue
  q10_customer_commitment_readiness: not_sure_yet
```

Then: `complete_quest` → quest_id: `flow_continuity_offer`, response: `"completed"`, project_id: `29314de2-75ec-408d-a29e-be59d8f25a9f`

### Step 2: Submit Lead Magnet Assessment (HIGH CONFIDENCE — 85%)

```
Tool: submit_assessment
flow_id: lead_magnet_offer
reasoning: "BYB App - The PWA itself is the lead magnet (freemium). Athletes know they struggle mentally but don't know how to train it. Free tier lets them experience value."
answers:
  q1_core_offer_type: software_saas
  q2_technical_ability: very_technical_can_build
  q3_time_to_create: 1_week_or_less
  q4_budget: minimal_under_100
  q5_content_comfort: comfortable_can_create
  q6_service_capacity: no_prefer_scalable_solutions
  q7_problem_clarity: know_problem_not_solution
  q8_conversion_goal: let_them_experience_value
  q9_scalability_priority: critical_need_scale
  q10_existing_assets: have_software_or_tool
```

Then: `complete_quest` for the lead magnet quest if it exists (check `list_quests`)

### Step 3: ASK USER — Leads Strategy (60% confidence)

These questions are personal. Show the user my proposed answers and let them correct:

| Q | My Guess | Ask User |
|---|----------|----------|
| q1_network_size | `small_network_under_100` | How large is your network for BYB specifically? |
| q2_time_availability | `1_2_hours_daily` | How much time for BYB lead gen? |
| q3_budget | `minimal_under_100_monthly` | Marketing budget for BYB? |
| q4_comfort_level | `comfortable_can_do_it` | Comfort with 1:1 outreach to coaches/athletes? |
| q5_content_ability | `confident_learning_curve` | Confidence creating athlete-focused content? |
| q6_technical_skills | `very_comfortable_technical` | (Almost certainly correct) |
| q7_business_maturity | `pre_launch_validating_idea` | What stage is BYB at? |
| q8_sales_skills | `moderate_can_convert_some` | Sales/conversion experience? |
| q9_speed_priority | `within_90_days` | How urgent are BYB leads? |
| q10_risk_tolerance | `low_want_proven_methods` | Risk tolerance for BYB marketing spend? |

Then: `submit_assessment` for `leads_strategy` + `complete_quest` for `flow_leads_strategy`

### Step 4: ASK USER — Groan Quests (50% confidence)

Draft responses — user should review/edit:

**groan_stage_1_validation** (text):
> "Reached out to local athletes and a coach at a community sports club. Asked if they'd try a mental performance app. Two were keen, one said they already use journaling. Felt nervous pitching something so personal — mental performance is vulnerable territory — but the positive responses gave me confidence."

**groan_stage_2_creation** (text):
> "Published the BYB app to Vercel with the full onboarding flow and daily challenge system before the game-day voice analysis features were polished. Fear was that the archetype selection felt too 'woo' for serious athletes. Reality: the athletes who tried it loved naming their protective voice — made the concept tangible."

Then: `complete_quest` for each with the user-approved text

### Step 5: Verify

- Call `get_user_context` to check all assessments appear
- Call `list_quests` with `include_completed: true` to verify

## Also Prepared (BuildwithAi — paused)

Same analysis done for `Nic-Huzz/buildwithai`. Answers prepared in the plan file at:
`/Users/nichurrell/.claude/plans/lazy-enchanting-glacier.md`

User chose to do BYB first. BuildwithAi can be done next.

## Project IDs

| Project | ID | Stage |
|---------|-----|-------|
| BYB App | `29314de2-75ec-408d-a29e-be59d8f25a9f` | 2 |
| BuildwithAi | `58789259-3c02-46dd-a4ff-a3ca5ccad417` | 2 |

## Key Files Modified This Session

- `supabase/functions/mcp-server/index.ts` — Fixed cluster_type filters (line 387-389) to accept both singular and plural forms. **Already deployed.**
