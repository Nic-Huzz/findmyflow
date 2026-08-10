# Experience Dome — Data Pipeline (TODO)

## Auto-populating the dome from app activity

Tasks and courage challenges need to map to dome nodes so the snowflake auto-updates as users use the app.

### What needs to happen

1. **Node index** — each experiential dome node needs a stable ID + tags that can be matched against app activity. Possible tagging:
   - `branch` (already exists on quests: healing/movement/bonds/story/tools/status/nourishment/shelter/fire/threat/play/rest)
   - `skill_tags` (from the 10-skill PlaySkill taxonomy: storytelling, teaching, coaching, performing, creating, building, designing, leading, connecting, speaking_up)
   - `problem_tags` (from the 12-problem taxonomy)
   - New: `dome_node_ids` on quests/tasks — explicit mapping to which dome nodes an activity lights up

2. **Mapping strategy** — needs alignment on the final node set before building the index. Two approaches:
   - **Taxonomy bridge**: skill_tags + branch → dome node. E.g., a quest tagged `branch: healing, skill_tags: [coaching]` → lights up "Talk therapy", "Online coaching", "Executive coaching" nodes
   - **Explicit tagging**: each quest/task has `dome_node_ids: ['sub-mental-1964', 'sub-coaching-2010']`
   - Likely both: taxonomy for auto-mapping, explicit for precision

3. **Sources that feed the dome**
   - Quest completions (NS state from courage challenges)
   - Life path NS ratings (career alignment)
   - Daily check-in categories (practices, drains)
   - Direct rating (user taps a node and rates it)

### Prerequisite

Align on the final dome node map first. The current ~330 experiential nodes from `experienceDomeConfig.js` are a draft — some may need merging, splitting, or reframing before building the index.

### Skill taxonomy connection

The 10-skill wheel (`playSkillTaxonomyV2.json`) maps to dome branches:
- storytelling → Story branch
- teaching → Story/Oral, Bonds/Coaching
- coaching → Bonds/Coaching, Healing/Mental
- performing → Movement/Dance, Story/Oral
- creating → Story/Creator, Status/Craft
- building → Tools, Shelter
- designing → Status/Digital, Shelter/Architecture
- leading → Bonds/Ordeal, Bonds/Coaching
- connecting → Bonds/*, Comms
- speaking_up → Story/Oral, Threat/Safety

This creates a rough auto-map but needs refinement per node.
