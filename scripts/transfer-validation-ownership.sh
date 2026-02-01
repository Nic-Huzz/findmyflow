#!/bin/bash
# Transfer validation flow ownership from nichurrell@icloud.com to huzz@nichuzz.com

SUPABASE_PROJECT_REF="qlwfcfypnoptsocdpxuv"
SQL_FILE="supabase/migrations/Sql commands/transfer_validation_flow_ownership.sql"

echo "==================================="
echo "Validation Flow Ownership Transfer"
echo "==================================="
echo ""
echo "This script will transfer validation flows and analyses from:"
echo "  FROM: nichurrell@icloud.com"
echo "  TO:   huzz@nichuzz.com"
echo ""
echo "Options to run this:"
echo ""
echo "1. Via Supabase Dashboard (RECOMMENDED):"
echo "   - Go to: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new"
echo "   - Copy the contents of: ${SQL_FILE}"
echo "   - Run Step 1 first to see what will be transferred"
echo "   - Uncomment Step 2 and run it to perform the transfer"
echo "   - Run Step 3 to verify the transfer completed successfully"
echo ""
echo "2. Via Supabase CLI:"
echo "   First, run the preview (Step 1):"
echo "   npx supabase db execute --file \"${SQL_FILE}\" --project-ref ${SUPABASE_PROJECT_REF}"
echo ""
echo "   Then edit the SQL file to uncomment Step 2 and run again."
echo ""
echo "3. Manual SQL Editor:"
echo "   cat \"${SQL_FILE}\""
echo ""

# Offer to open the file
read -p "Open the SQL file now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  if command -v code &> /dev/null; then
    code "${SQL_FILE}"
  elif [ -n "$EDITOR" ]; then
    $EDITOR "${SQL_FILE}"
  else
    cat "${SQL_FILE}"
  fi
fi
