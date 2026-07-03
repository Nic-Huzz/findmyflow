## Phase 2 Metrics Specification

### Metrics

- Conversion to email = unique users who submit email ÷ unique users who start lead magnet. Window: same session or ≤24h.
- Completion rate = unique users who complete lead magnet ÷ unique users who start.
- Account creation rate = unique users who create account ÷ unique users who submit email. Window: ≤24h from email.
- Profile revisit rate = unique users who view `Profile` ≥2 times within 7 days ÷ unique users who view `Profile` once.

### Events (client → Supabase `events`)

- `leadmagnet_start` { sessionId, variantId }
- `leadmagnet_complete` { resultArchetype, archetypeType }
- `email_submitted` { emailHash }
- `account_created` { userId, source }
- `profile_view` { userId, entry }

All events include: `session_id`, `name`, `payload`, `created_at`.

### Data model (for metrics)

- `events` (id, session_id, user_id nullable, name, payload JSONB, created_at)
- `lead_magnet_results` optional (if needed), otherwise computed from events
- `profiles` as existing (`lead_flow_profiles`) is used for persisted profile

### Targets (initial)

- Conversion to email: 35–45%
- Completion rate: 65–75%
- Account creation rate: 25–35% of emails
- Profile revisit (7d): 20–30%

### Dashboards

- Funnel: start → complete → email → account
- Cohort: profile revisit within 7 days


