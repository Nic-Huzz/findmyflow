# PLAN: Populate the 5 Stubbed Experience Pipeline Templates

**Rank: #4.** `src/lib/experienceTemplates.js` has 5 template stubs with `items: []` and TODO markers. Because `getTemplatesForNode()` filters `items.length > 0`, populating them makes them appear in the Creator Portal pipeline automatically — zero UI work. This is the "fill the room" toolkit for experience creators, the core promise of the Scale product.

## Goal

All 5 templates produce real, usable AI-generated output in the pipeline: Pre-Event Sales Sequence, Post-Event Follow-Up, Social Content Pack, Affiliate Outreach, Attraction Offer Copy.

## Current state (verified 2026-07-08)

- `src/lib/experienceTemplates.js` lines ~38-82: five stubs, each `items: []` with `// TODO: populate`.
- `getTemplatesForNode(nodeKey)` filters by node AND `t.items.length > 0` — populated templates surface automatically.
- **No populated template currently exists in the file to copy the item schema from** (Event Page Copy was moved to NODE_TOOLS in `pipelineConfig.js`).
- Uncommitted diffs already touch `ContentGenerator.jsx` (+121), `EmailSequences.jsx` (+83), `promptTemplates.js`, `useExperiencePipeline.js`, `pipelineConfig.js` — read these diffs first; this work may be partially started.

## Steps (in order)

1. **Determine the exact `items[]` schema by reading the consumers, not by guessing.** Read `src/components/crm/ContentGenerator.jsx`, `src/hooks/useExperiencePipeline.js`, and `src/lib/crm/promptTemplates.js` to find where template `items` are rendered/executed, and what fields each item needs (likely: id, name, prompt or promptTemplate, output type, maybe day-offset for sequences). Also check git history: `git log --follow -p src/lib/experienceTemplates.js` to see what the removed Event Page Copy items looked like — that's the reference schema.
2. **Gather content sources before writing prompts:**
   - `docs/features/cold-outreach-content-guide.md` — outreach structure rules
   - `docs/start-running-experiences-email-roadmap.md` (email playbook, Ship30 reverse-engineering) — sequence structure
   - Existing prompt patterns in `src/lib/crm/promptTemplates.js` and `src/lib/templates/`
   - Voice: `SELECT * FROM voice_profiles WHERE user_id = 'ebe69854-2ebd-4236-a437-3a362f5e1af4'` (Supabase project qlwfcfypnoptsocdpxuv)
3. **Write the items:**
   - `pre_event_emails` (attract, email_sequence): 5 emails tied to event countdown — announce → story/why → social proof/what happens in the room → objection/logistics → last call. Each prompt must pull the creator's context (experience details, rule break, positioning) the same way existing generators do via `getContentContext`.
   - `post_event_emails` (grow, email_sequence): thank you + photo/moment recap → feedback ask → upsell/next event invite.
   - `social_content_pack` (attract, copy_blocks): 5 posts, 5 different angles (story, contrarian/rule-break, behind-the-scenes, testimonial, direct invite).
   - `affiliate_outreach` (attract, copy_blocks): 3 messages — warm friend ask, past-attendee ask, venue/partner cosign ask.
   - `attraction_offer_copy` (attract, copy_blocks): copy per selected Attraction Stack strategy — check where the user's chosen strategies are stored (grep for attraction stack / `attraction_offer_assessments`) and make the prompt consume them; if per-strategy dynamic generation is too complex for the schema, ship the 3 most common (early bird, bring-a-friend, guarantee) as fixed items.
4. **Test each in the pipeline UI** (`npm run dev:creator`, `/create/experience/:id`): each template appears under its node, generates output, and the output saves/queues the way ContentGenerator expects for its `outputType`.

## Edge cases a weaker model would miss

- **`email_sequence` vs `copy_blocks` output types are handled differently downstream** — verify both render paths before assuming one schema fits both.
- **Writing style is a hard product rule:** NO em dashes anywhere in generated copy or prompt instructions; 12-year-old plain language; concrete over abstract. Bake these constraints INTO the prompts ("Never use em dashes...") because the AI output is user-facing.
- **Creators without pipeline data** (no rule break, no positioning): prompts must degrade gracefully — instruct the AI to work with whatever context fields are present rather than emitting "[MISSING]" placeholders.
- **Don't hardcode Nic's business into the prompts.** These templates serve every creator; context comes from their data at generation time.
- **The uncommitted diffs may have already changed the schema** (`promptTemplates.js` shows -/+ churn). Reconcile with the working-tree state, not the last commit.

## Acceptance criteria

- [ ] All 5 templates appear in the pipeline UI under the correct node (attract ×4, grow ×1)
- [ ] Each generates coherent output using the creator's real context in dev
- [ ] Zero em dashes in prompts or sample outputs; language passes the 12-year-old test
- [ ] Sequences produce the right number of items (5 / 3 / 5 / 3 / ≥3)
- [ ] No TODO comments remain in `experienceTemplates.js`
