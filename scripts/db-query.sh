#!/bin/bash
# Query Supabase database via REST API
# Usage: ./scripts/db-query.sh <table> [select] [filters]
#
# Examples:
#   ./scripts/db-query.sh user_stage_progress
#   ./scripts/db-query.sh user_stage_progress "id,user_id,persona" "limit=5"
#   ./scripts/db-query.sh flow_sessions "id,flow_type,status" "status=eq.completed&limit=10"

SUPABASE_URL="https://qlwfcfypnoptsocdpxuv.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsd2ZjZnlwbm9wdHNvY2RweHV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE4NjY3NSwiZXhwIjoyMDcyNzYyNjc1fQ.fHSSqR04LttB_igCJd8YJCNNFT6Xf3LtJWqO6FOlx68"

TABLE="${1:-}"
SELECT="${2:-*}"
FILTERS="${3:-limit=20}"

if [ -z "$TABLE" ]; then
  echo "Usage: ./scripts/db-query.sh <table> [select] [filters]"
  echo ""
  echo "Examples:"
  echo "  ./scripts/db-query.sh user_stage_progress"
  echo "  ./scripts/db-query.sh flow_sessions 'id,flow_type,status' 'status=eq.completed&limit=10'"
  echo ""
  echo "Common tables:"
  echo "  user_stage_progress, flow_sessions, milestone_completions,"
  echo "  challenge_instances, nikigai_clusters, user_projects,"
  echo "  persona_profiles, nervous_system_responses"
  exit 1
fi

curl -s "${SUPABASE_URL}/rest/v1/${TABLE}?select=${SELECT}&${FILTERS}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" | python3 -m json.tool 2>/dev/null || cat
