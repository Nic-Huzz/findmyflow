#!/bin/bash

# Manual test script for scheduled-notifications edge function
# This will help diagnose what's actually happening

echo "==================================="
echo "Testing Scheduled Notifications"
echo "==================================="
echo ""

# You'll need to replace this with your actual service role key from .env
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsd2ZjZnlwbm9wdHNvY2RweHV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE4NjY3NSwiZXhwIjoyMDcyNzYyNjc1fQ.fHSSqR04LttB_igCJd8YJCNNFT6Xf3LtJWqO6FOlx68"

echo "Calling edge function..."
echo ""

response=$(curl -s -X POST \
  'https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/scheduled-notifications' \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H 'Content-Type: application/json' \
  -d '{}')

echo "Response:"
echo "$response" | jq . 2>/dev/null || echo "$response"
echo ""

# Check if response contains error
if echo "$response" | grep -q "error"; then
  echo "❌ ERROR DETECTED"
  echo "Check the response above for details"
else
  echo "✅ No error in response"
fi

echo ""
echo "==================================="
echo "Next steps:"
echo "1. Check the response above"
echo "2. Look for 'sent', 'failed', 'total' counts"
echo "3. If error, check Edge Function logs in Supabase Dashboard"
echo "==================================="
