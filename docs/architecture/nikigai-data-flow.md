# Nikigai Data Flow & Supabase Setup

## Overview
The Nikigai flow collects user responses through 39 questions, extracts AI-powered tags, and generates skill/problem/people/market clusters to help users discover their purpose.

---

## Database Tables

### 1. **nikigai_sessions** (Main Session Tracker)

**Purpose**: Track each user's journey through the flow

**Data Collected**:
- `id` - Unique session ID (UUID)
- `user_id` - Reference to authenticated user
- `flow_version` - Which version they're using (v2.2)
- `started_at` / `completed_at` - Timing
- `last_step_id` - Where they left off (e.g., "2.1")
- `last_active_at` - Last interaction time
- `status` - "in_progress", "completed", or "abandoned"
- `completion_percentage` - Progress (0-100)
- `nikigai_path` - Choice: "career", "entrepreneurial", or "both"
- `life_map_data` - JSONB storing all their answers
- `tag_weights` - JSONB with weighted tag scores
- `session_metadata` - JSONB for additional context

**When It's Created**:
- When user starts the Nikigai flow (NikigaiTest.jsx, `initSession()`)

**Example Row**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "user-uuid",
  "flow_version": "v2.2",
  "started_at": "2025-11-14T10:00:00Z",
  "last_step_id": "3.1",
  "status": "in_progress",
  "completion_percentage": 45
}
```

---

### 2. **nikigai_responses** (Individual Question Responses)

**Purpose**: Store every single answer to every question

**Data Collected**:
- `id` - Response UUID
- `session_id` - Links to nikigai_sessions
- `user_id` - Reference to authenticated user
- `step_id` - Question ID (e.g., "2.0", "2.1", "2.2")
- `step_order_index` - Sequential number (1, 2, 3...)
- `question_text` - The actual question asked
- `response_raw` - User's raw text answer
- `response_structured` - JSONB for structured answers (if applicable)
- `bullet_count` - Number of bullet points user provided
- `tags_extracted` - **JSONB with AI-extracted tags**
- `tag_weights` - JSONB with weighted scores
- `quality_score` - Response quality (0-1)
- `sparsity_flag` - True if response was too short
- `time_to_respond_seconds` - How long they took
- `store_as` - Semantic identifier (e.g., "life_map.hobbies.childhood") **← NEW FIELD**

**When It's Created**:
- Every time user submits an answer (NikigaiTest.jsx, `handleSubmit()`)

**Example Row**:
```json
{
  "id": "resp-uuid",
  "session_id": "session-uuid",
  "step_id": "2.0",
  "step_order_index": 2,
  "question_text": "What did you love doing most in childhood?",
  "response_raw": "- Building with Lego\n- Drawing cartoons\n- Playing video games",
  "bullet_count": 3,
  "tags_extracted": {
    "skill_verb": ["building", "drawing", "playing"],
    "domain_topic": ["construction", "art", "gaming"],
    "value": ["creativity"],
    "emotion": ["joy"],
    "context": [],
    "problem_theme": [],
    "persona_hint": []
  },
  "store_as": "life_map.hobbies.childhood"
}
```

---

### 3. **nikigai_clusters** (Generated Skill/Problem Clusters)

**Purpose**: Store AI-generated clusters at each checkpoint

**Data Collected**:
- `id` - Cluster UUID
- `session_id` - Links to nikigai_sessions
- `user_id` - Reference to authenticated user
- `cluster_type` - "skills", "problems", "people", or "market"
- `cluster_stage` - "preview", "intermediate", or "final"
- `cluster_label` - Generated name (e.g., "Creative Design & Storytelling")
- `archetype` - Role archetype (if applicable)
- `items` - JSONB array of bullet points in this cluster
- `score` - Overall cluster quality (0-1)
- `coherence_score` - How related items are (0-1)
- `quality_grade` - Letter grade: A, B, C, D, F
- `user_modified` - True if user edited it
- `archived` - True if user deleted it
- `source_responses` - JSONB tracking which questions contributed
- `source_tags` - Array of tag types used (e.g., ["skill_verb", "domain_topic"])

**When It's Created**:
- At clustering checkpoints (steps 2.3, 3.3, 4.3, 5.3)
- When user chooses "Keep" or "Edit" clusters

**Example Row**:
```json
{
  "id": "cluster-uuid",
  "session_id": "session-uuid",
  "cluster_type": "skills",
  "cluster_stage": "preview",
  "cluster_label": "Creative Design & Storytelling",
  "items": [
    {
      "text": "Building with Lego",
      "tags": {"skill_verb": ["building"], "domain_topic": ["construction"]},
      "source_step": "2.0",
      "bullet_score": 0.92
    },
    {
      "text": "Drawing cartoons",
      "tags": {"skill_verb": ["drawing"], "domain_topic": ["art"]},
      "source_step": "2.0",
      "bullet_score": 0.88
    }
  ],
  "coherence_score": 0.85,
  "quality_grade": "A",
  "source_tags": ["skill_verb", "domain_topic", "value"]
}
```

---

### 4. **nikigai_key_outcomes** (Final Summary)

**Purpose**: Store the final "Library of Answers" - distilled outcomes

**Data Collected** (when flow is complete):
- `session_id` - Links to nikigai_sessions
- `top_skill_clusters` - JSONB array of top 3-5 skill clusters
- `suggested_job_titles` - JSONB array with match scores
- `core_skills` - Text array for filtering
- `top_problem_clusters` - JSONB array of problems they care about
- `change_statements` - Text array of "I help X do Y" statements
- `empathy_snapshot` - JSONB describing their ideal audience
- `target_personas` - Text array of who they serve
- `solution_categories` - Array like ["coaching", "digital-products"]
- `opportunity_statements` - JSONB with business opportunities
- `mission_statement` - Their purpose in one sentence
- `life_story_one_sentence` - Their journey summarized

**When It's Created**:
- At the end of the flow (future implementation)

---

## Data Flow Diagram

```
User Starts Flow
       ↓
[nikigai_sessions] created (status: in_progress)
       ↓
User answers question 2.0 (childhood hobbies)
       ↓
[Edge Function] extracts tags via Claude AI
       ↓
[nikigai_responses] row created with:
  - response_raw: "- Building Lego\n- Drawing"
  - tags_extracted: {"skill_verb": ["building", "drawing"], ...}
  - store_as: "life_map.hobbies.childhood"
       ↓
User answers questions 2.1 and 2.2 (more hobbies)
       ↓
(Same tag extraction + response storage)
       ↓
User reaches step 2.3 (CLUSTERING CHECKPOINT)
       ↓
[Clustering Algorithm] runs:
  1. Filter nikigai_responses where store_as matches:
     - "life_map.hobbies.childhood"
     - "life_map.hobbies.highschool"
     - "life_map.hobbies.current"
  2. Extract all bullet points
  3. Group by similar tags
  4. Generate cluster labels
       ↓
[nikigai_clusters] rows created (one per cluster)
       ↓
User sees clusters + chooses "Keep", "Edit", or "Skip"
       ↓
Flow continues through 39 questions...
       ↓
Flow Complete
       ↓
[nikigai_key_outcomes] created with final summary
       ↓
[nikigai_sessions] updated (status: completed, completion_percentage: 100)
```

---

## Tag Extraction Process

**When**: Every text response submission

**How**:
1. User submits answer
2. Frontend calls Supabase Edge Function: `extract-nikigai-tags`
3. Edge Function sends to Claude AI (Haiku model)
4. Claude returns structured JSON with 7 tag types:
   - `skill_verb` - Actions (e.g., "teaching", "designing")
   - `domain_topic` - Fields (e.g., "UX design", "education")
   - `value` - Principles (e.g., "integrity", "growth")
   - `emotion` - Feelings (e.g., "joy", "excitement")
   - `context` - Situations (e.g., "remote work")
   - `problem_theme` - Challenges (e.g., "burnout")
   - `persona_hint` - Groups (e.g., "burned-out teachers")

**Example**:
```javascript
Input: "I love teaching kids how to code"

Output:
{
  "skill_verb": ["teaching"],
  "domain_topic": ["coding"],
  "emotion": ["love"],
  "persona_hint": ["kids"],
  "value": [],
  "context": [],
  "problem_theme": []
}
```

---

## Clustering Process

**When**: At checkpoints (steps 2.3, 3.3, 4.3, 5.3)

**How**:
1. **Filter Responses**: Get all responses where `store_as` matches the checkpoint's `tag_from` array
2. **Extract Items**: Pull out individual bullet points with their tags
3. **Calculate Similarity**: Compare tags between items using Jaccard similarity
4. **Group Into Clusters**: Create 3-6 clusters based on tag overlap
5. **Generate Labels**: AI creates descriptive names like "Creative Design & Storytelling"
6. **Calculate Quality**: Coherence (how related), Distinctness (how unique), Balance (similar sizes)
7. **Assign Grade**: A (0.8+), B (0.6-0.8), C (0.4-0.6), D (0.2-0.4), F (<0.2)

**Example Checkpoint** (step 2.3):
```json
{
  "tag_from": [
    "life_map.hobbies.childhood",
    "life_map.hobbies.highschool",
    "life_map.hobbies.current"
  ],
  "cluster": {
    "target": "skills",
    "source_tags": ["skill_verb", "domain_topic", "value"],
    "target_clusters_min": 3,
    "target_clusters_max": 6
  }
}
```

---

## Security (Row Level Security)

**ALL tables have RLS enabled**:
- Users can only see/edit their own data
- Queries automatically filter by `user_id` or `auth.uid()`
- Prevents users from accessing each other's Nikigai data

**Policies**:
```sql
-- Users can only view their own responses
CREATE POLICY "Users can view own responses"
  ON nikigai_responses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own data
CREATE POLICY "Users can insert own responses"
  ON nikigai_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## Current Implementation Status

✅ **Implemented**:
- nikigai_sessions table
- nikigai_responses table (with new `store_as` column)
- nikigai_clusters table
- Tag extraction via Edge Function
- Progressive clustering at 4 checkpoints
- Quality metrics (coherence, distinctness, balance)

🚧 **Not Yet Implemented**:
- nikigai_key_outcomes (final summary generation)
- library_display_cache (pre-computed Library of Answers page)
- User editing of clusters (Keep/Edit/Skip options show but editing UI incomplete)

---

## Files Reference

**Schema**: `supabase/migrations/create_nikigai_schema.sql`
**Migration**: `supabase/migrations/add_store_as_to_nikigai_responses.sql`
**Edge Function**: `supabase/functions/extract-nikigai-tags/index.ts`
**Frontend Component**: `src/NikigaiTest.jsx`
**Clustering Logic**: `src/lib/clustering.js`
**Tag Extraction**: `src/lib/tagExtraction.js`
**Question Flow**: `public/nikigai-flow-v2.2.json`

---

## Summary

**What data is collected?**
- Raw text answers to 39 questions
- AI-extracted semantic tags (7 types)
- Timing data (how long per question)
- Generated skill/problem/people/market clusters
- Quality metrics for each cluster

**Where is it stored?**
- `nikigai_sessions` - Overall journey
- `nikigai_responses` - Individual answers
- `nikigai_clusters` - Generated groupings
- `nikigai_key_outcomes` - Final summary (future)

**How is it secured?**
- Row Level Security on all tables
- Users can only access their own data
- API keys stored as Supabase secrets (not in code)

**What's the purpose?**
- Help users discover their unique combination of skills, passions, and purpose
- Generate actionable insights about career/business opportunities
- Create a "Library of Answers" they can reference later
