#!/bin/bash
# Deploy all Supabase Edge Functions
# Usage: ./scripts/deploy-functions.sh [function-name]

set -e

FUNCTIONS_DIR="supabase/functions"

if [ -n "$1" ]; then
  # Deploy specific function
  echo "Deploying function: $1"
  supabase functions deploy "$1"
else
  # Deploy all functions
  echo "Deploying all edge functions..."

  for dir in "$FUNCTIONS_DIR"/*/; do
    if [ -d "$dir" ]; then
      func_name=$(basename "$dir")
      echo "Deploying: $func_name"
      supabase functions deploy "$func_name"
    fi
  done

  echo "All functions deployed!"
fi

# List deployed functions
echo ""
echo "Deployed functions:"
supabase functions list
