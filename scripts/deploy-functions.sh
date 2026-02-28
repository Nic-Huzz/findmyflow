#!/bin/bash
# Deploy all Supabase Edge Functions
# Usage: ./scripts/deploy-functions.sh [function-name]

set -e

FUNCTIONS_DIR="supabase/functions"

# Functions that use custom auth instead of Supabase JWT
NO_VERIFY_JWT_FUNCTIONS="mcp-server analyze-validation-responses create-checkout-session stripe-webhook"

if [ -n "$1" ]; then
  # Deploy specific function
  echo "Deploying function: $1"
  if echo "$NO_VERIFY_JWT_FUNCTIONS" | grep -qw "$1"; then
    supabase functions deploy "$1" --no-verify-jwt
  else
    supabase functions deploy "$1"
  fi
else
  # Deploy all functions
  echo "Deploying all edge functions..."

  for dir in "$FUNCTIONS_DIR"/*/; do
    if [ -d "$dir" ]; then
      func_name=$(basename "$dir")
      echo "Deploying: $func_name"
      if echo "$NO_VERIFY_JWT_FUNCTIONS" | grep -qw "$func_name"; then
        supabase functions deploy "$func_name" --no-verify-jwt
      else
        supabase functions deploy "$func_name"
      fi
    fi
  done

  echo "All functions deployed!"
fi

# List deployed functions
echo ""
echo "Deployed functions:"
supabase functions list
