#!/bin/bash
# Quick user data audit and transfer tool

SUPABASE_PROJECT_REF="qlwfcfypnoptsocdpxuv"
SUPABASE_SQL_URL="https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new"
SQL_DIR="supabase/migrations/Sql commands"

echo "=========================================="
echo "FindMyFlow - User Data Audit & Transfer"
echo "=========================================="
echo ""
echo "What would you like to do?"
echo ""
echo "1. 📊 Audit user data (see row counts)"
echo "2. 📋 Detailed data report (see actual records)"
echo "3. 🔄 Transfer validation flows only"
echo "4. 🔄 Transfer ALL user data"
echo "5. 📖 Read the transfer guide"
echo "6. 🌐 Open Supabase SQL Editor"
echo "7. ❌ Exit"
echo ""
read -p "Enter your choice (1-7): " choice

case $choice in
  1)
    echo ""
    echo "Opening audit script..."
    echo "File: ${SQL_DIR}/audit_user_data.sql"
    echo ""
    if command -v code &> /dev/null; then
      code "${SQL_DIR}/audit_user_data.sql"
    elif command -v open &> /dev/null; then
      open "${SQL_DIR}/audit_user_data.sql"
    else
      cat "${SQL_DIR}/audit_user_data.sql"
    fi
    echo ""
    echo "Next steps:"
    echo "1. Copy the SQL script"
    echo "2. Go to: ${SUPABASE_SQL_URL}"
    echo "3. Paste and run the script"
    ;;

  2)
    echo ""
    echo "Opening detailed report script..."
    echo "File: ${SQL_DIR}/detailed_user_data_report.sql"
    echo ""
    if command -v code &> /dev/null; then
      code "${SQL_DIR}/detailed_user_data_report.sql"
    elif command -v open &> /dev/null; then
      open "${SQL_DIR}/detailed_user_data_report.sql"
    else
      cat "${SQL_DIR}/detailed_user_data_report.sql"
    fi
    echo ""
    echo "Next steps:"
    echo "1. Copy the SQL script"
    echo "2. Go to: ${SUPABASE_SQL_URL}"
    echo "3. Paste and run the script"
    ;;

  3)
    echo ""
    echo "Opening validation flows transfer script..."
    echo "File: ${SQL_DIR}/transfer_validation_flow_ownership.sql"
    echo ""
    echo "⚠️  IMPORTANT:"
    echo "- Step 1 is safe (preview only)"
    echo "- Step 2 is commented out (actual transfer)"
    echo "- You must uncomment Step 2 to execute"
    echo ""
    if command -v code &> /dev/null; then
      code "${SQL_DIR}/transfer_validation_flow_ownership.sql"
    elif command -v open &> /dev/null; then
      open "${SQL_DIR}/transfer_validation_flow_ownership.sql"
    else
      cat "${SQL_DIR}/transfer_validation_flow_ownership.sql"
    fi
    echo ""
    echo "Next steps:"
    echo "1. Copy the SQL script"
    echo "2. Go to: ${SUPABASE_SQL_URL}"
    echo "3. Run Step 1 (preview)"
    echo "4. Review output"
    echo "5. Uncomment Step 2"
    echo "6. Run Step 2 (transfer)"
    echo "7. Run Step 3 (verify)"
    ;;

  4)
    echo ""
    echo "Opening ALL data transfer script..."
    echo "File: ${SQL_DIR}/transfer_all_user_data.sql"
    echo ""
    echo "⚠️  IMPORTANT:"
    echo "- This transfers ALL user data (40+ tables)"
    echo "- Step 1 is safe (preview only)"
    echo "- Step 2 is commented out (actual transfer)"
    echo "- You must uncomment Step 2 to execute"
    echo ""
    if command -v code &> /dev/null; then
      code "${SQL_DIR}/transfer_all_user_data.sql"
    elif command -v open &> /dev/null; then
      open "${SQL_DIR}/transfer_all_user_data.sql"
    else
      cat "${SQL_DIR}/transfer_all_user_data.sql"
    fi
    echo ""
    echo "Next steps:"
    echo "1. Copy the SQL script"
    echo "2. Go to: ${SUPABASE_SQL_URL}"
    echo "3. Run Step 1 (preview)"
    echo "4. Review output carefully"
    echo "5. Uncomment Step 2"
    echo "6. Run Step 2 (transfer)"
    echo "7. Run Step 3 (verify)"
    ;;

  5)
    echo ""
    echo "Opening transfer guide..."
    echo "File: ${SQL_DIR}/USER_DATA_TRANSFER_GUIDE.md"
    echo ""
    if command -v code &> /dev/null; then
      code "${SQL_DIR}/USER_DATA_TRANSFER_GUIDE.md"
    elif command -v open &> /dev/null; then
      open "${SQL_DIR}/USER_DATA_TRANSFER_GUIDE.md"
    else
      cat "${SQL_DIR}/USER_DATA_TRANSFER_GUIDE.md"
    fi
    ;;

  6)
    echo ""
    echo "Opening Supabase SQL Editor..."
    if command -v open &> /dev/null; then
      open "${SUPABASE_SQL_URL}"
    elif command -v xdg-open &> /dev/null; then
      xdg-open "${SUPABASE_SQL_URL}"
    else
      echo "URL: ${SUPABASE_SQL_URL}"
    fi
    ;;

  7)
    echo "Goodbye!"
    exit 0
    ;;

  *)
    echo "Invalid choice. Please run the script again."
    exit 1
    ;;
esac

echo ""
echo "=========================================="
echo "Supabase SQL Editor:"
echo "${SUPABASE_SQL_URL}"
echo "=========================================="
