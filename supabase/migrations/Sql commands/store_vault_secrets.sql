-- Store Supabase secrets in vault for cron job access
-- Run this in Supabase SQL Editor before setting up the cron job

-- Store Supabase URL
SELECT vault.create_secret(
  'https://qlwfcfypnoptsocdpxuv.supabase.co',
  'SUPABASE_URL'
);

-- Store Service Role Key
SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsd2ZjZnlwbm9wdHNvY2RweHV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE4NjY3NSwiZXhwIjoyMDcyNzYyNjc1fQ.fHSSqR04LttB_igCJd8YJCNNFT6Xf3LtJWqO6FOlx68',
  'SUPABASE_SERVICE_ROLE_KEY'
);

-- Verify secrets were stored
SELECT name FROM vault.decrypted_secrets;
