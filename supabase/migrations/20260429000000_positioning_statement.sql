-- Add positioning_statement to scope_map_results
alter table scope_map_results add column if not exists positioning_statement text;
