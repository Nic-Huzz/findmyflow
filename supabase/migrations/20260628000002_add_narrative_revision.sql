-- Add narrative revision field to weekly reviews (Identity Bridge Stage 6)
alter table weekly_reviews add column if not exists narrative_revision text;
