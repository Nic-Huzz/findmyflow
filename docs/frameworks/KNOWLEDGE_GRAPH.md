# Knowledge Graph

A standalone mind map of how concepts interconnect in the human experience.

## Root Structure

```
desire to be loved
    └── fear not good enough (when unmet)
            └── fear of failure (manifests as)
                    ├── fear of judgement (externalized)
                    └── interior motivations (antidote)
                            ├── purpose
                            ├── play
                            └── process
```

## Core Insight

Fear of failure is transcended not by avoiding it, but by shifting to **interior motivations** where the outcome becomes secondary to the experience itself:

- **Purpose** - Why you do it. Meaning beyond outcome.
- **Play** - Intrinsic enjoyment. The process itself is the reward.
- **Process** - Growth through iteration. Each attempt teaches regardless of result.

## Data Model

### Categories (Clusters)

| Category | Color | Description |
|----------|-------|-------------|
| core | #5e17eb (purple) | Deepest human drives |
| fear | #8B5CF6 (light purple) | Fear responses |
| motivation | #E9A23B (gold) | Interior motivations |
| external | #EF4444 (red) | External validation patterns |
| healing | #10B981 (green) | Integration/healing pathways |
| framework | #3B82F6 (blue) | Theoretical frameworks |
| practice | #F97316 (orange) | Actions/practices |

### Nodes

Each concept is a node with:
- `id` - Unique identifier
- `label` - Display name
- `category` - Cluster for coloring
- `description` - What it means
- `isRoot` - Whether it's a root node

### Edges

Connections between concepts:
- `source` - Origin node
- `target` - Destination node
- `label` - Relationship description
- `type` - Relationship type:
  - `causes` - A leads to B
  - `antidote` - A heals/transcends B
  - `contains` - A includes B

## File

`src/lib/knowledgeGraph.js`

## Future Branches

Potential expansions:
- Fear of judgement → people pleasing → masks → loss of self
- Interior motivations → flow states → peak experience
- Healing pathways → nervous system regulation → felt safety
- Frameworks → Ikigai, IFS, Polyvagal theory
- Purpose → calling → vocation → service
