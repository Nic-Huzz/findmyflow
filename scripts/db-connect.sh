#!/bin/bash
# Connect to Supabase PostgreSQL database
# Usage: ./scripts/db-connect.sh

# Connection details from Supabase Dashboard > Settings > Database
PROJECT_REF="qlwfcfypnoptsocdpxuv"
DB_HOST="aws-0-ap-southeast-2.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.${PROJECT_REF}"

echo "Connecting to Supabase database..."
echo "Host: $DB_HOST"
echo ""
echo "You'll be prompted for the database password."
echo "Find it in: Supabase Dashboard > Settings > Database > Connection string"
echo ""

psql "postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"
