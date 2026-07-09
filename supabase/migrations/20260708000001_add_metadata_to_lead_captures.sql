-- Add metadata column to lead_captures for diagnostic answers
alter table lead_captures add column if not exists metadata jsonb;

-- Ensure the anon insert policy exists (may not have been applied)
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'lead_captures' and policyname = 'Anyone can insert lead captures'
  ) then
    create policy "Anyone can insert lead captures"
      on lead_captures for insert
      with check (true);
  end if;
end
$$;
