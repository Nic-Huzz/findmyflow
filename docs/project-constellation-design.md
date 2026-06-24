# Project Constellation — Design Doc

## Concept

Over time, separate projects reveal themselves as parts of a larger transformation. The Project Constellation visualizes how a user's projects connect through shared skill/problem/persona clusters — helping them see the meta-narrative of their work.

## The "Work as Art" Foundation

This builds on the art reframe introduced in Flow Finder:
- **Skills** = Your Art (the medium, the HOW)
- **Problems** = Your Message (the change, the WHAT)
- **Personas** = Your Audience (who feels it, the WHO)

The constellation shows how these three dimensions weave across multiple projects, revealing chapters and a broader life's work statement.

## Layered User Journey

1. **See it visually** — Project Constellation map shows projects as nodes connected by shared clusters
2. **Group it** — User manually groups projects into "chapters" or themes
3. **AI articulates it** — "Across your projects, the transformation you're creating is..."

## Three-Layer Confidence Strategy for AI Mapping

### Layer 1: Rich Project Descriptions (Input Quality)

Current project descriptions are too thin ("digital_product offering") for reliable AI matching. Need to prompt users to enrich descriptions:
> "In 2-3 sentences, what does this project do and who is it for?"

Could be a one-time enrichment flow or triggered when opening the Constellation view.

### Layer 2: AI Multi-Signal Matching (Algorithm)

Give Claude all projects + all clusters (labels + items + insights) in one prompt:

```
You are analyzing a user's projects and skill/problem/persona clusters
to find which clusters apply to which projects.

PROJECTS:
1. "{name}" — {description}
...

SKILL CLUSTERS:
- "{cluster_label}" — Insight: {insight}. Items: [{items}]
...

PROBLEM CLUSTERS: ...
PERSONA CLUSTERS: ...

For each project, list which clusters apply and your confidence (1-5).
Only include matches at confidence 3+. Explain why.
```

**What makes the AI confident:**
- Project description mentions terms matching cluster items → HIGH
- Multiple cluster items align with project purpose → HIGH
- User previously linked this cluster via Integration → HIGHEST
- Project description is generic → LOW
- Only the cluster label loosely matches → LOW

### Layer 3: User Confirmation (Trust Loop)

Show AI's suggested mappings as "draft connections" (dashed lines). User confirms, rejects, or adds:
- Catches AI errors
- Builds trust
- Creates training data for future matches
- Gives users the "aha" moment of seeing connections they hadn't noticed

## Data Model Considerations

Current state:
- `user_projects` has `linked_skill_cluster_id`, `linked_problem_cluster_id`, `linked_persona_cluster_id` (single link per wheel)
- Most projects have NULL links (created via onboarding, not Integration)

Future state options:
- **Junction table**: `project_cluster_links` (project_id, cluster_id, cluster_type, confidence, confirmed_by_user)
- Supports many-to-many: one project can have multiple skills/problems/personas
- Stores both AI confidence and user confirmation status

## Visual Design

- Dark background, brand purple → gold palette
- Projects as glowing nodes, sized by stage progression
- Group halos for natural chapters (color-coded)
- Connection lines colored by type: purple (shared skills), gold (shared problems), blue (shared personas)
- Hover reveals cluster details and connections
- Dashed lines for unconfirmed AI suggestions, solid for confirmed

## Prototype

HTML prototype at `docs/prototypes/project-constellation.html` using real user data with inferred mappings.

## Dependencies

- Requires Flow Finder completion (skill/problem/persona clusters exist)
- Benefits from rich project descriptions (current descriptions too thin)
- Could integrate with existing Integration flow (pre-linked clusters as seed data)

## Alternative: Guided Flow Instead of Constellation

Instead of (or alongside) a visual constellation map, this could be delivered as a **guided flow** — similar to Flow Finder's discovery process. Benefits:

- **Consistent UX**: Users already understand the flow pattern (questions → AI processing → reveal)
- **Structured discovery**: Walks users through enriching project descriptions, confirming cluster links, and grouping projects step by step — rather than presenting everything at once
- **Lower cognitive load**: A constellation map is visually impressive but could overwhelm users who have many projects. A flow sequences the insights
- **Progressive reveal**: Step 1: Enrich descriptions → Step 2: See AI-suggested connections → Step 3: Confirm/reject → Step 4: Group into chapters → Step 5: AI articulates the meta-narrative
- **Mobile-friendly**: Flows work well on mobile; interactive constellation maps less so

The constellation visualization could still exist as the **culmination** of the flow — the final reveal after guided discovery, rather than the primary interface.

## Open Questions

- Where does this live in the app? (Library of Answers? Standalone page? /me dashboard?)
- **Constellation map vs. guided flow vs. both?** Flow for discovery, constellation for ongoing reference?
- Should grouping be manual-only or can AI suggest groups?
- How does the "Life's Work Statement" interact with the existing art statement from Integration?
- Should confirmed connections feed back into the Integration flow or key outcomes?
