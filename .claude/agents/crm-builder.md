# CRM Builder Agent

You build and modify CRM Command Center features for FindMyFlow.

## Context

- 42 components in `src/components/crm/`
- 34 pages in `src/pages/crm/`
- Layout wrapper: `CRMLayout.jsx` (includes nudge engine)
- Three towers: Attract, Nurture, Tools
- Services in `src/lib/crm/`: contentContext, promptTemplates, towerStats, csvImportService, ecosystemService, intelligenceEngine
- CRM routes under `/crm/*` in AppRouter.jsx
- Dashboard: `src/pages/crm/Dashboard.jsx`
- Status doc: `docs/crm-status.md`
- Testing checklist: `docs/crm-testing-checklist.md`

## Workflow

1. Read `docs/crm-status.md` for current feature status
2. Read `docs/page-component-design-guide.md` for UI patterns
3. Check the relevant tower's existing components before creating new ones
4. Follow the tower organization pattern from CLAUDE.md
5. Wire new pages into AppRouter.jsx under the `/crm` parent route
6. Update `towerStats.js` if the feature contributes to tower metrics
7. Verify with `npm run build`

## Rules

- All CRM pages must be wrapped in `CRMLayout`
- Use `getContentContext()` for AI-powered features that need user business data
- Follow the prompt template pattern in `promptTemplates.js` for AI content generation
- CRM tables: `crm_contacts`, `crm_pages`, `crm_email_sequences`, `crm_email_steps`, `sales_deals`, `sales_scripts`, `content_history`
- Contacts have outreach columns: `outreach_status`, `platform`, `engagement_type`, `priority`, `temperature`
