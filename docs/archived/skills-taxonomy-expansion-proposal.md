# Skills Taxonomy Expansion Proposal

**Date:** 2026-02-01
**Status:** Proposal
**Purpose:** Expand 4 skill segments to cover gaps (physical/performing, hosting, curating, protecting)

---

## The Problem

The current 12 skill segments have gaps that don't capture certain job types well:

| Gap | Examples | Current Best Fit | Issue |
|-----|----------|------------------|-------|
| **Physical/Performing** | Athletes, Dancers, Surgeons, DJs | Expressing | Weak - misses embodiment |
| **Hosting/Entertaining** | MCs, Event Hosts, Party Planners | Connecting | Weak - misses the "creating fun" energy |
| **Curating/Selecting** | Editors, DJs, Art Curators, Playlist makers | Synthesizing | Weak - misses taste/selection |
| **Protecting/Securing** | Security, Risk, Compliance, Safety | Organizing | Weak - misses protection focus |

### Real Example: Silent Discos

Nic's life-changing activity (hosting silent discos) doesn't fit cleanly:
- It's not just "Connecting" (bringing people together)
- It's not just "Designing" (crafting an experience)
- It includes **Hosting** (MC energy, creating fun) and **Curating** (music selection)

---

## Proposed Solution: Expand 4 Segments

Keep 12 total segments. Rename and expand keywords for 4 of them.

### 1. Expressing → **Performing**

| Attribute | Current | Proposed |
|-----------|---------|----------|
| **displayName** | Expressing | Performing |
| **aspirationalTitle** | The Voice | The Performer |
| **tagline** | You give form to what matters | You bring ideas to life through presence |
| **keywords** | story, perform, present, voice, speak, share, articulate, storytelling | story, perform, present, voice, speak, share, articulate, storytelling, **movement, dance, athletics, entertain, embody, physical expression, stage, MC** |
| **exampleJobs** | Speaker, Presenter, Podcaster, Storyteller, Broadcaster | Speaker, Presenter, Podcaster, **Dancer, Athlete, DJ, MC, Actor, Comedian** |
| **valueCreated** | Turning ideas into impact | Turning presence into impact |

**What's added:** Physical performance, dance, athletics, entertainment, embodiment

---

### 2. Connecting → **Gathering**

| Attribute | Current | Proposed |
|-----------|---------|----------|
| **displayName** | Connecting | Gathering |
| **aspirationalTitle** | The Bridge Builder | The Host |
| **tagline** | You bring people together | You bring people together and create belonging |
| **keywords** | network, empathy, facilitate, collaborate, bring together, relationships, listen | network, empathy, facilitate, collaborate, bring together, relationships, listen, **host, MC, events, community, party, celebrate, space-holding, welcome** |
| **exampleJobs** | Community Manager, Facilitator, Networker, Partnership Manager, Mediator | Community Manager, Facilitator, **Event Host, Party Planner, Retreat Leader, Community Builder, MC** |
| **valueCreated** | Turning strangers into allies | Turning strangers into community |

**What's added:** Hosting, event energy, party/celebration, space-holding

---

### 3. Organizing → **Organizing** (expanded keywords)

| Attribute | Current | Proposed |
|-----------|---------|----------|
| **displayName** | Organizing | Organizing |
| **aspirationalTitle** | The Systems Architect | The Systems Architect |
| **tagline** | You create order from chaos | You create order and safety from chaos |
| **keywords** | systems, processes, operations, logistics, order, structure, efficiency | systems, processes, operations, logistics, order, structure, efficiency, **security, risk, safety, compliance, protecting, governance** |
| **exampleJobs** | Operations Manager, Project Manager, Systems Administrator, Logistics Coordinator, Process Engineer | Operations Manager, Project Manager, **Security Analyst, Risk Manager, Compliance Officer, Safety Coordinator** |
| **valueCreated** | Turning chaos into order | Turning chaos into order and safety |

**What's added:** Security, risk, safety, compliance, protection

---

### 4. Synthesizing → **Curating**

| Attribute | Current | Proposed |
|-----------|---------|----------|
| **displayName** | Synthesizing | Curating |
| **aspirationalTitle** | The Integrator | The Curator |
| **tagline** | You see the whole picture | You find signal in the noise |
| **keywords** | integrate, wisdom, big-picture, meaning, philosophy, connect dots, holistic | integrate, wisdom, big-picture, meaning, philosophy, connect dots, holistic, **select, edit, taste, discernment, playlist, collection, filter, refine** |
| **exampleJobs** | Philosopher, Systems Thinker, Integration Specialist, Futurist, Wisdom Keeper | **Editor, Curator, DJ, Playlist Creator, Tastemaker**, Philosopher, Systems Thinker |
| **valueCreated** | Turning fragments into wholeness | Turning noise into signal |

**What's added:** Selection, editing, taste-making, curation, discernment

---

## Visual Summary

| # | Current | Proposed | Key Addition |
|---|---------|----------|--------------|
| 8 | 🎙️ Expressing | 🎙️ **Performing** | Physical performance, entertainment |
| 9 | 🤝 Connecting | 🤝 **Gathering** | Hosting, events, celebration |
| 4 | ⚙️ Organizing | ⚙️ **Organizing** | Security, risk, safety |
| 12 | 🔮 Synthesizing | 🔮 **Curating** | Selection, taste, editing |

**Icons stay the same.** Names shift slightly. Keywords expand significantly.

---

## The Silent Disco Test

With proposed changes:

| Role Model | Activity | Now Maps To |
|------------|----------|-------------|
| Tony Robbins | Group seminars | **Performing** + Influencing |
| Day Breaker | Sunrise Silent Discos | **Gathering** + **Curating** |
| Alyce | Retreats | **Gathering** + Nurturing |

✅ All three now have clear homes.

---

## Implementation

### Files to Update

1. `src/lib/wheelTaxonomy.js` - Update 4 SKILLS_SEGMENTS entries
2. Any tests referencing old names

### Migration Considerations

- Existing user data uses segment IDs (`expressing`, `connecting`, `organizing`, `synthesizing`)
- IDs stay the same, only display names and keywords change
- No database migration needed

---

## Unchanged Segments (8)

These remain as-is:

| # | Segment | Tagline |
|---|---------|---------|
| 1 | 💡 Clarifying | You make the complex simple |
| 2 | 📊 Analyzing | You see what others miss |
| 3 | 🎯 Strategizing | You think 10 moves ahead |
| 5 | 🔨 Building | You turn ideas into reality |
| 6 | 🎨 Designing | You shape how things feel |
| 7 | ✨ Creating | You bring new things into existence |
| 10 | 🔥 Influencing | You move people to action |
| 11 | 🌱 Nurturing | You develop potential in others |

---

## Decision Needed

- [ ] Approve proposal
- [ ] Update wheelTaxonomy.js with changes
- [ ] Test in QuickCapture flow

---

## Related

- `hero-journey-game-design.md` - Play-List concept aligns with this expansion
- Play List Finder flow (proposed) - Uses these segments to identify skills via role models
