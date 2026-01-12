---
description: Query the Supabase database
---
# Database Query

Run a query against the FindMyFlow Supabase database.

## Usage

Execute the database query script with the user's request:

```bash
./scripts/db-query.sh "<SQL or table query>"
```

## Common Queries

**List tables:**
```bash
./scripts/db-query.sh "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
```

**View table structure:**
```bash
./scripts/db-query.sh "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'TABLE_NAME'"
```

**Count records:**
```bash
./scripts/db-query.sh "SELECT COUNT(*) FROM table_name"
```

**Recent records:**
```bash
./scripts/db-query.sh "SELECT * FROM table_name ORDER BY created_at DESC LIMIT 10"
```

## Key Tables Reference

| Table | Purpose |
|-------|---------|
| `user_projects` | User projects with stages |
| `flow_sessions` | Completed flows |
| `quest_completions` | Challenge quest completions |
| `nikigai_clusters` | AI-generated clusters |
| `flow_entries` | Flow compass entries |
| `funnel_metrics` | Stage 7 funnel tracking |
| `zarlo_conversations` | Zarlo chat history |

## Output
Run the query and summarize the results in a readable format.
