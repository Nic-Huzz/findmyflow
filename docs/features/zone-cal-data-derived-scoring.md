---
title: Zone Cal Radar - Data-Derived Scoring (Future)
tags: [zone-cal, radar, scoring, future-build]
created: 2026-09-12
status: parked - start with self-report, revisit when user data exists
---

# Zone Cal Radar - Data-Derived Scoring

> **Current approach:** Self-report (8 questions, 5 levels each). Works for both /try/ lead magnet and logged-in users.
>
> **Future approach:** Supplement self-report with app data signals as confidence indicators. "You said Identity is a 4, and your app data agrees."
>
> **Do NOT replace self-report with data-derived scores.** Self-report captures felt experience. Data captures behavior. They measure different things. Use data to validate, not override.

## Proposed Mappings (Needs Validation)

| Dimension | Data Signal | Confidence | Issue |
|-----------|------------|------------|-------|
| **Identity** | Essence Mirror completion + identity statement count + identity declaration edits | Medium | Completing a quiz is not the same as knowing yourself. Click-through without genuine reflection scores high falsely. |
| **Vulnerability** | Dome vulnerability dimension level (cumulative courage challenges with high vulnerability scores) | High | Direct behavioral measurement. You either showed up visibly or you didn't. |
| **Direction** | Number of active paths + naming clarity (has the path been named with specificity?) + path age (older = more committed) | Medium | Having paths is not the same as having direction. Multiple paths could indicate clarity OR scattered attention. |
| **Worth** | Income tracking data + charging milestones (first $100, first $1K) + Dome money dimension level | High | Charging real money is behavioral proof. Hard to fake. The money dimension directly measures willingness to ask. |
| **Growth** | Courage challenge frequency (weekly average) + dome expansion rate (new dimensions stretched per month) + challenge difficulty trend (are they doing harder things?) | High | Direct measurement. Frequency + difficulty trend together show calibrated growth, not just repetition. |
| **Output** | Quest task completion rate + consistency (weekly streak) + output-to-burnout ratio (from weekly review fuel ratings) | Medium | Completion rate misses quality and sustainability. The burnout signal from weekly review fuel helps but is self-report. |
| **Risk** | Dome stakes dimension level + dome rarity dimension level + highest-stakes challenge completed | High | The dome literally measures what you put on the line. Stakes + rarity together capture aligned risk. |
| **Play** | Weekly review fuel ratings (Choice + Connection + Mastery + Meaning averages) + Fun Signal from weekly review | Low | All self-report inside a review that itself feels like a chore. The signal is weak because the measurement context suppresses the thing being measured. |

## Implementation Notes

- **3 high-confidence mappings** (Vulnerability, Worth/Risk, Growth): Could supplement self-report immediately once user has 4+ weeks of data.
- **3 medium-confidence mappings** (Identity, Direction, Output): Need more thought. Could show as "your app data suggests..." rather than overriding the self-report score.
- **1 low-confidence mapping** (Play): Do not use data here. Play is the dimension most likely to be distorted by measurement. Keep it self-report only.
- **Display approach:** Show self-report radar as the primary shape. Show data-derived signals as small confidence indicators next to each spoke: checkmark if data agrees, question mark if data diverges from self-report.
- **When to introduce:** Once a user has 30+ days of app data. Before that, self-report only.
