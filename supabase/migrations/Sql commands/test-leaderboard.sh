#!/bin/bash

# Test the check-leaderboard-changes edge function
# Replace YOUR_SERVICE_ROLE_KEY with your actual service role key

curl -X POST \
  https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/check-leaderboard-changes \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsd2ZjZnlwbm9wdHNvY2RweHV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE4NjY3NSwiZXhwIjoyMDcyNzYyNjc1fQ.fHSSqR04LttB_igCJd8YJCNNFT6Xf3LtJWqO6FOlx68" \
  -H "Content-Type: application/json"
