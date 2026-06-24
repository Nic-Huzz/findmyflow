# Nikigai Cluster Refinement Interface Specification

## Overview

The cluster refinement interface allows users to improve AI-generated clusters by merging, splitting, renaming, or reorganizing items. This addresses clustering quality concerns and gives users control over their Nikigai journey.

---

## When to Show Refinement Interface

### Trigger Conditions

1. **After every cluster display** (optional refinement)
2. **When cluster quality is low** (recommended refinement)
3. **User requests it** via `/refine` command

### Quality Thresholds

```javascript
function shouldRecommendRefinement(clusterData) {
  const { qualityScore, distinctnessScore, clusters } = clusterData

  // Recommend refinement if:
  return (
    qualityScore < 0.7 ||               // Overall quality low
    distinctnessScore < 0.5 ||          // Clusters too similar
    clusters.some(c => c.items.length > 8) || // Cluster too large
    clusters.some(c => c.items.length < 2)    // Cluster too small
  )
}
```

---

## User Interface Flow

### Step 1: Display Clusters with Refinement Prompt

**Alfred's Message:**
```
✨ Based on your hobbies, here are your emerging skill clusters:

📦 **The Creator** (Creative Expression)
• Photography — capturing meaningful moments
• Graphic design — bringing ideas to life visually
• Writing poetry — expressing emotions through words
• Making handmade gifts — creating personal, thoughtful items

📦 **The Facilitator** (Enabling Others)
• Organizing community events — bringing people together
• Teaching kids coding — empowering the next generation
• Mentoring junior designers — guiding career growth

These clusters look strong! Would you like to:
✏️ **Keep as is** — Continue to next section
🔧 **Refine** — Merge, split, or rename clusters
⏭️ **Skip** — We can refine later
```

### Step 2: Refinement Operations Menu

If user selects "Refine":

```
🔧 Cluster Refinement

What would you like to do?
1️⃣ **Merge clusters** — Combine similar clusters
2️⃣ **Split a cluster** — Break down a large cluster
3️⃣ **Rename a cluster** — Change the archetype or label
4️⃣ **Move items** — Reassign items between clusters
5️⃣ **Delete items** — Remove irrelevant items
6️⃣ **Done refining** — Save and continue

Select an operation (1-6):
```

---

## Refinement Operations

### Operation 1: Merge Clusters

**Flow:**
1. User selects "Merge clusters"
2. System shows numbered list of clusters
3. User selects 2+ cluster numbers to merge
4. System suggests new name based on combined themes
5. User confirms or provides custom name

**Example:**

```
Which clusters would you like to merge?

1. The Creator (4 items)
2. The Facilitator (3 items)
3. The Strategist (5 items)

Enter cluster numbers separated by commas (e.g., 1,2):
> 1,2

Great! I'll merge "The Creator" and "The Facilitator".

Suggested name: **The Creative Enabler** (Building & Empowering)

Use this name, or type your own:
> The Community Builder

✅ Merged into "The Community Builder" (7 items)
```

**Code Implementation:**

```javascript
async function mergeClusters(clusterIds, userId, sessionId) {
  // Fetch clusters to merge
  const clusters = await supabase
    .from('nikigai_clusters')
    .select('*')
    .in('id', clusterIds)
    .eq('user_id', userId)

  // Combine all items
  const mergedItems = clusters.flatMap(c => c.items)

  // Get AI suggestion for new name
  const suggestedName = await suggestMergedClusterName(clusters)

  // Create merged cluster
  const merged = {
    user_id: userId,
    session_id: sessionId,
    cluster_type: clusters[0].cluster_type, // skills, problems, etc.
    cluster_label: suggestedName,
    archetype: null, // Will be suggested
    items: mergedItems,
    merged_from: clusterIds,
    created_at: new Date()
  }

  // Insert merged cluster
  const { data } = await supabase
    .from('nikigai_clusters')
    .insert(merged)
    .select()

  // Mark old clusters as archived
  await supabase
    .from('nikigai_clusters')
    .update({ archived: true, merged_into: data[0].id })
    .in('id', clusterIds)

  // Suggest new archetype
  const archetype = await suggestArchetype(data[0])

  return { ...data[0], suggested_archetype: archetype }
}

async function suggestMergedClusterName(clusters) {
  const prompt = `
Two skill clusters are being merged:

Cluster 1: "${clusters[0].cluster_label}"
Items: ${clusters[0].items.map(i => i.text).join(', ')}

Cluster 2: "${clusters[1].cluster_label}"
Items: ${clusters[1].items.map(i => i.text).join(', ')}

Suggest a new cluster name that captures both themes.
Return only the name, no explanation.
Format: "The [Archetype]" (Brief descriptor)
`

  const response = await callClaudeAPI(prompt)
  return response.trim()
}
```

---

### Operation 2: Split a Cluster

**Flow:**
1. User selects "Split a cluster"
2. System shows clusters with item counts
3. User selects which cluster to split
4. System shows items in that cluster (numbered)
5. User assigns items to Group A or Group B
6. System suggests names for both new clusters

**Example:**

```
Which cluster would you like to split?

1. The Creator (8 items) ⚠️ Large cluster
2. The Facilitator (3 items)

Select cluster number:
> 1

Split "The Creator" into two groups:

1. Photography — capturing meaningful moments
2. Graphic design — bringing ideas to life visually
3. Writing poetry — expressing emotions through words
4. Making handmade gifts — creating personal items
5. Video editing — telling stories through film
6. Web design — building beautiful experiences
7. Painting — exploring color and form
8. Woodworking — crafting functional art

For each item, enter A or B (or press Enter to let AI suggest):
Item 1 (Photography):
> A
Item 2 (Graphic design):
> A
Item 3 (Writing poetry):
> B
Item 4 (Making handmade gifts):
>
[AI suggestion: B - handcrafted focus]
Item 5 (Video editing):
> A
...

✅ Split into:
Group A (4 items): Digital Creative Expression
Group B (4 items): Handcrafted Artistry
```

**Code Implementation:**

```javascript
async function splitCluster(clusterId, itemAssignments, userId, sessionId) {
  // Fetch original cluster
  const { data: original } = await supabase
    .from('nikigai_clusters')
    .select('*')
    .eq('id', clusterId)
    .single()

  // Separate items into groups
  const groupA = []
  const groupB = []

  original.items.forEach((item, index) => {
    if (itemAssignments[index] === 'A') {
      groupA.push(item)
    } else {
      groupB.push(item)
    }
  })

  // Suggest names for new clusters
  const [nameA, nameB] = await suggestSplitNames(groupA, groupB)

  // Create two new clusters
  const clusters = [
    {
      user_id: userId,
      session_id: sessionId,
      cluster_type: original.cluster_type,
      cluster_label: nameA,
      items: groupA,
      split_from: clusterId
    },
    {
      user_id: userId,
      session_id: sessionId,
      cluster_type: original.cluster_type,
      cluster_label: nameB,
      items: groupB,
      split_from: clusterId
    }
  ]

  // Insert new clusters
  const { data } = await supabase
    .from('nikigai_clusters')
    .insert(clusters)
    .select()

  // Archive original
  await supabase
    .from('nikigai_clusters')
    .update({ archived: true, split_into: data.map(c => c.id) })
    .eq('id', clusterId)

  return data
}
```

---

### Operation 3: Rename a Cluster

**Flow:**
1. User selects "Rename a cluster"
2. System shows clusters with current names
3. User selects which cluster
4. System shows current archetype + label
5. User provides new name (or selects from suggestions)

**Example:**

```
Which cluster would you like to rename?

1. The Creator (Creative Expression) — 4 items
2. The Facilitator (Enabling Others) — 3 items

Select cluster number:
> 1

Current name: "The Creator" (Creative Expression)

Here are some alternative archetypes that might fit:
1. The Visionary
2. The Storyteller
3. The Artist
4. Keep "The Creator"
5. Write your own

Select 1-5, or type a custom name:
> The Storyteller

✅ Renamed to "The Storyteller"
```

**Code Implementation:**

```javascript
async function renameCluster(clusterId, newArchetype, newLabel, userId) {
  // Update cluster
  const { data } = await supabase
    .from('nikigai_clusters')
    .update({
      archetype: newArchetype,
      cluster_label: newLabel,
      user_modified: true,
      updated_at: new Date()
    })
    .eq('id', clusterId)
    .eq('user_id', userId)
    .select()

  return data[0]
}

async function suggestAlternativeArchetypes(cluster) {
  const prompt = `
Current cluster:
Archetype: "${cluster.archetype}"
Label: "${cluster.cluster_label}"
Items: ${cluster.items.map(i => i.text).join(', ')}

Suggest 3 alternative archetype names from this list:
${ROLE_ARCHETYPES.map(a => a.name).join(', ')}

Return as JSON array: ["The Creator", "The Visionary", "The Artist"]
`

  const response = await callClaudeAPI(prompt)
  return JSON.parse(response)
}
```

---

### Operation 4: Move Items Between Clusters

**Flow:**
1. User selects "Move items"
2. System shows all clusters and their items
3. User selects item to move
4. User selects destination cluster
5. System moves item and recalculates cluster scores

**Example:**

```
📦 Current Clusters:

1. The Creator (4 items)
   • Photography
   • Graphic design
   • Writing poetry
   • Making handmade gifts

2. The Facilitator (3 items)
   • Organizing community events
   • Teaching kids coding
   • Mentoring junior designers

Which item would you like to move?
Enter cluster number and item number (e.g., 1.3 for "Writing poetry"):
> 1.4

Move "Making handmade gifts" to which cluster?
1. The Facilitator
2. Create new cluster

Select destination:
> 2

Name for new cluster:
> The Craftsperson

✅ Moved "Making handmade gifts" to new cluster "The Craftsperson"
```

**Code Implementation:**

```javascript
async function moveItem(fromClusterId, itemIndex, toClusterId, userId) {
  // Fetch both clusters
  const { data: clusters } = await supabase
    .from('nikigai_clusters')
    .select('*')
    .in('id', [fromClusterId, toClusterId])
    .eq('user_id', userId)

  const fromCluster = clusters.find(c => c.id === fromClusterId)
  const toCluster = clusters.find(c => c.id === toClusterId)

  // Move item
  const item = fromCluster.items[itemIndex]
  fromCluster.items.splice(itemIndex, 1)
  toCluster.items.push(item)

  // Update both clusters
  await supabase
    .from('nikigai_clusters')
    .update({ items: fromCluster.items, user_modified: true })
    .eq('id', fromClusterId)

  await supabase
    .from('nikigai_clusters')
    .update({ items: toCluster.items, user_modified: true })
    .eq('id', toClusterId)

  // Recalculate scores
  await recalculateClusterScore(fromClusterId)
  await recalculateClusterScore(toClusterId)

  return { fromCluster, toCluster }
}
```

---

### Operation 5: Delete Items

**Flow:**
1. User selects "Delete items"
2. System shows all items across clusters
3. User selects items to delete
4. System removes items and asks if empty clusters should be deleted

**Example:**

```
Which items would you like to remove?

Cluster 1: The Creator
1.1 Photography
1.2 Graphic design
1.3 Writing poetry

Cluster 2: The Facilitator
2.1 Organizing community events
2.2 Teaching kids coding

Enter item numbers to delete (comma-separated):
> 1.3, 2.1

⚠️ This will remove:
• Writing poetry (from The Creator)
• Organizing community events (from The Facilitator)

Confirm deletion? (yes/no):
> yes

✅ Deleted 2 items
```

---

## Integration with Question Flow

### Update to v2.2 Flow Structure

**Add refinement option after each cluster display:**

```json
{
  "id": "2.1",
  "step_order_index": 5,
  "assistant_prompt": "✨ Beautiful — those early joys often hold the purest clues.\n\nBased on what you love doing, here are early **Skill clusters** emerging:\n\n{skills.preview.from_hobbies}\n\nI can already see some patterns forming. Do any of these feel like your natural way of showing up?\n\n✏️ **Keep as is** — These look good\n🔧 **Refine** — Adjust clusters (merge, split, rename)\n⏭️ **Skip** — Continue for now",
  "expected_inputs": [
    {
      "type": "choice",
      "options": ["keep", "refine", "skip"]
    }
  ],
  "next_step_rules": [
    { "if": "keep", "goto": "3.0" },
    { "if": "refine", "goto": "2.1.refine" },
    { "if": "skip", "goto": "3.0" }
  ]
},
{
  "id": "2.1.refine",
  "step_type": "cluster_refinement",
  "cluster_target": "skills.preview.from_hobbies",
  "operations_allowed": ["merge", "split", "rename", "move", "delete"],
  "on_complete": "2.1.review"
},
{
  "id": "2.1.review",
  "assistant_prompt": "✨ Great! Here are your refined clusters:\n\n{skills.preview.from_hobbies.refined}\n\nDoes this feel more accurate? Or refine again?",
  "next_step_rules": [
    { "if": "satisfied", "goto": "3.0" },
    { "if": "refine_more", "goto": "2.1.refine" }
  ]
}
```

---

## Data Schema Updates

### Add to `nikigai_clusters` Table

```sql
ALTER TABLE nikigai_clusters ADD COLUMN user_modified BOOLEAN DEFAULT FALSE;
ALTER TABLE nikigai_clusters ADD COLUMN archived BOOLEAN DEFAULT FALSE;
ALTER TABLE nikigai_clusters ADD COLUMN merged_from INTEGER[];
ALTER TABLE nikigai_clusters ADD COLUMN merged_into INTEGER;
ALTER TABLE nikigai_clusters ADD COLUMN split_from INTEGER;
ALTER TABLE nikigai_clusters ADD COLUMN split_into INTEGER[];
ALTER TABLE nikigai_clusters ADD COLUMN refinement_history JSONB DEFAULT '[]';
```

### Track Refinement History

```javascript
// Example refinement history entry
{
  "timestamp": "2025-11-12T10:30:00Z",
  "operation": "merge",
  "details": {
    "merged_clusters": ["The Creator", "The Facilitator"],
    "new_name": "The Community Builder",
    "reason": "user_initiated"
  }
}
```

---

## Analytics & Insights

### Track Refinement Patterns

```javascript
async function trackRefinementMetrics(userId, operation) {
  await supabase.from('analytics_events').insert({
    user_id: userId,
    event_type: 'cluster_refinement',
    event_data: {
      operation,
      timestamp: new Date()
    }
  })
}

// Useful metrics:
// - % of users who refine clusters
// - Most common operations (merge vs split vs rename)
// - Quality score before/after refinement
// - Time spent on refinement
```

---

## UI/UX Best Practices

### 1. **Keep it optional**
Never force refinement — always offer "Keep as is" or "Skip"

### 2. **Show AI confidence**
```
📦 The Creator (4 items) — 92% confidence ✅
📦 The Facilitator (3 items) — 68% confidence ⚠️ Consider refining
```

### 3. **Highlight problem clusters**
Use visual indicators when clusters are too large, too small, or too similar

### 4. **Preserve user intent**
If user renamed something, don't overwrite it in subsequent clustering

### 5. **Make it fast**
Refinement should feel quick and fluid, not laborious

---

## Example Full Refinement Flow

```
Alfred: ✨ Based on your hobbies, here are your emerging skill clusters:

📦 **The Creator** (Creative Expression) — 92% confidence
• Photography — capturing meaningful moments
• Graphic design — bringing ideas to life visually
• Writing poetry — expressing emotions through words
• Making handmade gifts — creating personal items

📦 **The Facilitator** (Enabling Others) — 85% confidence
• Organizing community events — bringing people together
• Teaching kids coding — empowering the next generation
• Mentoring junior designers — guiding career growth

These clusters look strong! Would you like to:
✏️ **Keep as is** (recommended)
🔧 **Refine** — Adjust clusters
⏭️ **Skip** — Continue for now

User: refine

Alfred: 🔧 What would you like to do?
1️⃣ Merge clusters
2️⃣ Split a cluster
3️⃣ Rename a cluster
4️⃣ Move items
5️⃣ Delete items
6️⃣ Done refining

User: 3

Alfred: Which cluster would you like to rename?
1. The Creator (4 items)
2. The Facilitator (3 items)

User: 1

Alfred: Current name: "The Creator" (Creative Expression)

Alternative archetypes that might fit:
1. The Visionary
2. The Storyteller
3. The Artist
4. Keep "The Creator"
5. Write your own

User: The Storyteller

Alfred: ✅ Renamed to "The Storyteller"

🔧 Any other refinements?
1️⃣ Merge clusters
2️⃣ Split a cluster
3️⃣ Rename a cluster
4️⃣ Move items
5️⃣ Delete items
6️⃣ Done refining

User: 6

Alfred: ✨ Perfect! Here are your refined clusters:

📦 **The Storyteller** (Creative Expression)
• Photography — capturing meaningful moments
• Graphic design — bringing ideas to life visually
• Writing poetry — expressing emotions through words
• Making handmade gifts — creating personal items

📦 **The Facilitator** (Enabling Others)
• Organizing community events — bringing people together
• Teaching kids coding — empowering the next generation
• Mentoring junior designers — guiding career growth

Ready to continue exploring what shaped you?
```

---

## Implementation Checklist

- [ ] Add refinement steps to v2.2 flow after each cluster display
- [ ] Implement merge operation + AI name suggestion
- [ ] Implement split operation + AI grouping assistance
- [ ] Implement rename operation + alternative archetype suggestions
- [ ] Implement move items operation
- [ ] Implement delete items operation
- [ ] Update database schema with refinement tracking
- [ ] Add quality indicators to cluster displays
- [ ] Create analytics tracking for refinement patterns
- [ ] Add `/refine` user command
- [ ] Add refinement history to `/summary` output
- [ ] Test with diverse user scenarios

---

**Status:** Ready for implementation
**Priority:** High (addresses clustering quality uncertainty)
**Estimated effort:** 2-3 days development + testing
