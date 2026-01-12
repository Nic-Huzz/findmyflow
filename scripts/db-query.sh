#!/bin/bash
# Query Supabase database via REST API or direct psql
# Usage: ./scripts/db-query.sh <table|sql> [select] [filters]
#
# Examples:
#   REST API mode:
#     ./scripts/db-query.sh user_stage_progress
#     ./scripts/db-query.sh user_stage_progress "id,user_id,persona" "limit=5"
#     ./scripts/db-query.sh flow_sessions "id,flow_type,status" "status=eq.completed&limit=10"
#
#   Direct SQL mode (first arg is SQL query):
#     ./scripts/db-query.sh "SELECT * FROM profiles LIMIT 5"
#     ./scripts/db-query.sh "SELECT column_name FROM information_schema.columns WHERE table_name = 'nikigai_clusters'"

SUPABASE_URL="https://qlwfcfypnoptsocdpxuv.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsd2ZjZnlwbm9wdHNvY2RweHV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE4NjY3NSwiZXhwIjoyMDcyNzYyNjc1fQ.fHSSqR04LttB_igCJd8YJCNNFT6Xf3LtJWqO6FOlx68"

# Direct database connection (use this if pooler is down)
DB_HOST="db.qlwfcfypnoptsocdpxuv.supabase.co"
DB_USER="postgres"
DB_PASS="Plakapong@3"
DB_NAME="postgres"

INPUT="${1:-}"

if [ -z "$INPUT" ]; then
  echo "Usage: ./scripts/db-query.sh <table|sql> [select] [filters]"
  echo ""
  echo "REST API mode (table name):"
  echo "  ./scripts/db-query.sh user_stage_progress"
  echo "  ./scripts/db-query.sh flow_sessions 'id,flow_type,status' 'status=eq.completed&limit=10'"
  echo ""
  echo "Direct SQL mode (SQL query):"
  echo "  ./scripts/db-query.sh \"SELECT * FROM profiles LIMIT 5\""
  echo "  ./scripts/db-query.sh \"SELECT column_name FROM information_schema.columns WHERE table_name = 'nikigai_clusters'\""
  echo ""
  echo "Common tables:"
  echo "  user_stage_progress, flow_sessions, milestone_completions,"
  echo "  challenge_instances, nikigai_clusters, user_projects,"
  echo "  persona_profiles, nervous_system_responses, marketing_tasks,"
  echo "  sales_deals, offer_creations, validation_flows, content_history"
  exit 1
fi

# Check if input looks like SQL (starts with SELECT, INSERT, UPDATE, DELETE, etc.)
if [[ "$INPUT" =~ ^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|EXPLAIN) ]]; then
  # Direct SQL mode - use psql
  PGPASSWORD="$DB_PASS" /opt/homebrew/opt/postgresql@16/bin/psql \
    "postgresql://${DB_USER}:$(echo $DB_PASS | sed 's/@/%40/g')@${DB_HOST}:5432/${DB_NAME}" \
    -c "$INPUT"
else
  # REST API mode
  TABLE="$INPUT"
  SELECT="${2:-*}"
  FILTERS="${3:-limit=20}"

  curl -s "${SUPABASE_URL}/rest/v1/${TABLE}?select=${SELECT}&${FILTERS}" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" | python3 -m json.tool 2>/dev/null || cat
fi
