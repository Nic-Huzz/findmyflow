---
name: run-assessment
description: "Guide a user through a FindMyFlow business assessment conversationally, then save results to their account. Use when the user wants help with offers, lead generation, upsells, downsells, or continuity models."
---

# Run a FindMyFlow Business Assessment

## Overview

Guide the user through one of FindMyFlow's 6 business strategy assessments conversationally. Do NOT present it as a quiz — have a natural business conversation, gather the information, and submit the scored results.

## Available Assessments

Use the `list_flows` tool to see all available flows. The 6 assessments are:

| Flow ID | What It Determines |
|---------|-------------------|
| `leads_strategy` | Which lead generation method fits your resources |
| `lead_magnet_offer` | What type of free value to offer prospects |
| `attraction_offer` | Your front-end offer to bring in new customers |
| `upsell_offer` | How to increase revenue per customer |
| `downsell_offer` | How to capture sales from people who say no |
| `continuity_offer` | Your recurring revenue model |

**Recommended order** (if the user hasn't done any): Leads Strategy → Lead Magnet → Attraction → Upsell → Downsell → Continuity.

## Process

### Step 1: Pick the Right Assessment

Ask what the user needs help with. Match to the right flow:
- "How do I get customers?" → `leads_strategy`
- "What should I give away?" → `lead_magnet_offer`
- "What's my entry offer?" → `attraction_offer`
- "How do I increase order value?" → `upsell_offer`
- "What about people who say no?" → `downsell_offer`
- "How do I get recurring revenue?" → `continuity_offer`

### Step 2: Load the Questions

Call `get_flow_questions` with the chosen `flow_id`. This returns the 10 questions with all answer options.

### Step 3: Have a Conversation

Do NOT read all 10 questions in order like a survey. Instead:

1. Start by asking about their business naturally
2. As they describe their situation, mentally map answers to the closest options
3. Only ask about things you genuinely don't know from context
4. You might get 5-7 answers from a single description — that's ideal
5. For ambiguous answers, briefly confirm: "Sounds like your margins are in the 60-85% range — does that feel right?"

**Key principle:** The fewer explicit questions you ask, the better the experience. A great run feels like a business strategy conversation, not a form.

### Step 4: Submit Results

Once you have all 10 answers mapped to option values, call `submit_assessment` with:
- `flow_id`: The assessment ID
- `answers`: Object mapping each question ID to the selected option value
- `reasoning`: (Optional) Your notes on why you chose each answer — helpful for the user to review later

### Step 5: Present the Recommendation

After submission, you'll get back the scored recommendation. Present it as:

1. **The recommendation** and WHY — connect it to their specific answers
2. **Confidence level** — explain what the percentage means
3. **Top 3 actions** they should take this week
4. **What assessment to do next** in the sequence

## Tips

- If the user has already completed other assessments, reference those results to inform this one
- Flag contradictions: "You mentioned needing to profit on every sale, but a loss-leader strategy requires strong backend offers"
- Be honest about low confidence scores: "At 35% confidence, this is worth trying but isn't a slam dunk"
- If disqualified options come up, explain WHY they were ruled out
