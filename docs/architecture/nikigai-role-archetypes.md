# Nikigai Role Archetypes Library

This document defines the role archetypes used to name skill clusters in the Skills Lens.

---

## Purpose

After skill clusters are generated, each cluster is assigned a **Role Archetype** name that captures the essence of how the user contributes. This makes the clusters more memorable and actionable.

---

## How Role Archetypes Work

1. **AI analyzes** the skill cluster (label + example skills)
2. **Suggests** 1-2 archetype names from this library
3. **User confirms or renames** the archetype
4. **Archetype becomes** the cluster identity

**Example:**
```
Cluster: "Creative Expression"
Skills: designing, storytelling, creating visual content
→ Suggested Role: "The Creator"
```

---

## Role Archetype Categories

### 🎨 **Creative Roles**

#### **The Creator**
- **Core skills:** Designing, making, building, crafting, producing
- **Essence:** Brings new things into existence
- **Examples:** Designer, Artist, Producer, Maker, Inventor

#### **The Storyteller**
- **Core skills:** Writing, narrating, communicating, expressing
- **Essence:** Shapes and shares narratives
- **Examples:** Writer, Content Creator, Speaker, Journalist, Poet

#### **The Visionary**
- **Core skills:** Imagining, envisioning, conceptualizing, innovating
- **Essence:** Sees what could be and inspires others
- **Examples:** Creative Director, Strategist, Innovator, Founder

#### **The Curator**
- **Core skills:** Selecting, organizing, taste-making, refining
- **Essence:** Finds and elevates quality
- **Examples:** Art Curator, Tastemaker, Editor, Selector

---

### 🤝 **Relational Roles**

#### **The Connector**
- **Core skills:** Networking, introducing, bridging, matchmaking
- **Essence:** Brings people and ideas together
- **Examples:** Community Manager, Networker, Relationship Builder

#### **The Facilitator**
- **Core skills:** Guiding discussions, enabling collaboration, holding space
- **Essence:** Helps groups do their best work
- **Examples:** Workshop Leader, Moderator, Meeting Facilitator, Coach

#### **The Guide**
- **Core skills:** Teaching, mentoring, coaching, advising
- **Essence:** Helps others navigate their path
- **Examples:** Coach, Mentor, Advisor, Teacher, Counselor

#### **The Advocate**
- **Core skills:** Supporting, defending, amplifying voices, championing
- **Essence:** Stands up for people or causes
- **Examples:** Social Activist, Advocate, Champion, Ally

---

### 🔧 **Operational Roles**

#### **The Builder**
- **Core skills:** Constructing, assembling, implementing, executing
- **Essence:** Takes ideas and makes them real
- **Examples:** Project Manager, Builder, Implementer, Developer

#### **The Organizer**
- **Core skills:** Planning, structuring, coordinating, systematizing
- **Essence:** Creates order from chaos
- **Examples:** Operations Manager, Planner, Coordinator, Administrator

#### **The Optimizer**
- **Core skills:** Improving, refining, streamlining, enhancing
- **Essence:** Makes things work better
- **Examples:** Process Improvement Specialist, Efficiency Expert

#### **The Operator**
- **Core skills:** Managing, running, maintaining, executing
- **Essence:** Keeps things running smoothly
- **Examples:** Manager, Administrator, Operator, Steward

---

### 🧠 **Analytical Roles**

#### **The Analyst**
- **Core skills:** Researching, analyzing, interpreting data, investigating
- **Essence:** Uncovers insights from information
- **Examples:** Data Analyst, Researcher, Investigator, Strategist

#### **The Strategist**
- **Core skills:** Planning, forecasting, positioning, designing systems
- **Essence:** Sees the big picture and charts the course
- **Examples:** Strategic Planner, Business Strategist, Architect

#### **The Problem-Solver**
- **Core skills:** Troubleshooting, debugging, resolving, fixing
- **Essence:** Finds solutions to complex challenges
- **Examples:** Consultant, Troubleshooter, Solutions Architect

#### **The Researcher**
- **Core skills:** Investigating, questioning, exploring, discovering
- **Essence:** Pursues knowledge and understanding
- **Examples:** Scientist, Scholar, Investigator, Explorer

---

### 💫 **Transformational Roles**

#### **The Healer**
- **Core skills:** Nurturing, restoring, caring, supporting recovery
- **Essence:** Helps others return to wholeness
- **Examples:** Therapist, Counselor, Healer, Caregiver

#### **The Activator**
- **Core skills:** Inspiring, energizing, mobilizing, catalyzing
- **Essence:** Gets people into motion
- **Examples:** Motivational Speaker, Catalyst, Igniter, Spark

#### **The Transformer**
- **Core skills:** Changing, evolving, revolutionizing, reimagining
- **Essence:** Drives fundamental change
- **Examples:** Change Agent, Revolutionary, Reformer

#### **The Liberator**
- **Core skills:** Freeing, empowering, breaking barriers, enabling
- **Essence:** Helps others break free from limitations
- **Examples:** Empowerment Coach, Freedom Fighter, Enabler

---

### 🌱 **Nurturing Roles**

#### **The Cultivator**
- **Core skills:** Growing, developing, nurturing, tending
- **Essence:** Helps things flourish over time
- **Examples:** Teacher, Developer, Gardener, Mentor

#### **The Gardener**
- **Core skills:** Planting seeds, nurturing growth, patience, cultivation
- **Essence:** Creates conditions for organic development
- **Examples:** Community Builder, Ecosystem Creator, Cultivator

#### **The Nurturer**
- **Core skills:** Caring, supporting, encouraging, protecting
- **Essence:** Provides what others need to thrive
- **Examples:** Caregiver, Support Provider, Guardian

#### **The Steward**
- **Core skills:** Protecting, maintaining, sustaining, caring for resources
- **Essence:** Ensures long-term health and sustainability
- **Examples:** Sustainability Manager, Caretaker, Guardian

---

### 🎪 **Expressive Roles**

#### **The Performer**
- **Core skills:** Presenting, entertaining, engaging, captivating
- **Essence:** Brings energy and presence to the moment
- **Examples:** Speaker, Entertainer, Presenter, Host

#### **The Host**
- **Core skills:** Welcoming, creating atmosphere, holding space, entertaining
- **Essence:** Makes people feel at home
- **Examples:** Event Host, Community Builder, Hospitality Professional

#### **The Inspirer**
- **Core skills:** Motivating, uplifting, encouraging, energizing
- **Essence:** Lifts others' spirits and possibilities
- **Examples:** Motivational Speaker, Coach, Leader, Muse

---

### 🛡️ **Protective Roles**

#### **The Guardian**
- **Core skills:** Protecting, defending, securing, watching over
- **Essence:** Keeps people and things safe
- **Examples:** Security Specialist, Protector, Defender, Advocate

#### **The Mediator**
- **Core skills:** Resolving conflicts, finding common ground, negotiating
- **Essence:** Brings peace to tensions
- **Examples:** Conflict Resolution Specialist, Negotiator, Peacemaker

#### **The Anchor**
- **Core skills:** Stabilizing, grounding, providing consistency, centering
- **Essence:** Provides stability in chaos
- **Examples:** Steady Leader, Rock, Stabilizer

---

## Using the Library

### For AI Generation

**Prompt template:**
```
Based on this skill cluster, suggest 1-2 role archetypes from the library:

Cluster Label: "{cluster_label}"
Skills: {skill_list}

Choose from: The Creator, The Connector, The Builder, The Guide,
The Analyst, The Healer, The Cultivator, The Performer, etc.

Which archetype(s) best capture this cluster?
Return as JSON: { "primary": "The Creator", "alternative": "The Visionary" }
```

### For User Selection

Present as options:
```
This cluster feels like a **Creator** role — bringing new things into existence.

Does "The Creator" resonate, or would you prefer:
- The Visionary (sees what could be)
- The Maker (hands-on builder)
- Custom name: ________
```

---

## Customization Guidelines

Users should feel empowered to:
1. **Rename** any archetype to match their voice
2. **Combine** archetypes (e.g., "The Creative Strategist")
3. **Create new** archetypes that feel more authentic

**Good custom examples:**
- The Creative Problem-Solver
- The Systems Healer
- The Community Weaver
- The Conscious Catalyst
- The Empathetic Builder

---

## Mapping to Job Titles

Once role archetypes are confirmed, they can suggest job titles:

**The Creator** →
- Graphic Designer
- Product Designer
- Creative Director
- Content Creator
- Brand Designer

**The Facilitator** →
- Workshop Facilitator
- Team Coach
- Meeting Designer
- Collaboration Lead
- Process Facilitator

**The Builder** →
- Project Manager
- Product Manager
- Implementation Lead
- Operations Manager
- Delivery Lead

*(See Skills Lens module for full job title mapping)*

---

## Implementation Notes

**Storage:**
```json
{
  "skills.final": [
    {
      "cluster_id": "skill_cluster_1",
      "label": "Creative Expression",
      "role_archetype": "The Creator",
      "skills": ["designing", "storytelling", "creating"],
      "example_job_titles": ["Graphic Designer", "Content Creator"]
    }
  ]
}
```

**Display format:**
```
🎨 The Creator

Skills: Designing, Storytelling, Creating visual content

This is how you bring new ideas into the world — through creative expression
and making things that didn't exist before.

Possible paths: Graphic Designer, Content Creator, Creative Director
```

---

## Next Steps

See also:
- `/docs/nikigai-structured-outputs.md` - Output formats for each lens
- `/docs/nikigai-auto-tagging-schema.md` - Tag extraction system
- `Nikigai Question Flow v2.2.json` - Skills Lens flow definition

---

*Last updated: 2025-11-07*
