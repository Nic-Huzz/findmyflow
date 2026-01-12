---
description: Check stage requirements and user progress for graduation
agent: Explore
context: fork
---
# Check Stage Requirements

Debug stage progression and graduation requirements for FindMyFlow.

## Steps

1. **Read the stage system files**:
   - `src/lib/stageConfig.js` - stage definitions and requirements
   - `src/lib/graduationChecker.js` - graduation logic
   - `supabase/functions/graduation-check/index.ts` - server-side check

2. **Understand the 7-stage system**:
   | Stage | Name | Focus |
   |-------|------|-------|
   | 1 | Validation | Validate with real customers |
   | 2 | Product Creation | Build core offer + lead magnet |
   | 3 | Testing | Test with users, gather feedback |
   | 4 | Money Models | Upsells, downsells, continuity |
   | 5 | Campaign Creation | Lead generation strategy |
   | 6 | Launch | Execute launch with leads funnel |
   | 7 | Tracking | Funnel metrics (always accessible) |

3. **If checking specific user/project**, query:
   - `user_projects` - current stage, total points
   - `flow_sessions` - completed flows for project
   - `quest_completions` - completed quests
   - `milestone_completions` - completed milestones

4. **Graduation requirements typically include**:
   - Minimum points threshold
   - Required flows completed
   - Required quests completed
   - Specific milestones achieved

5. **Common issues to check**:
   - Flow completed but wrong `project_id`
   - Quest completed but not counted (missing category)
   - Points not updating (check trigger functions)
   - Stage not advancing (graduation check not running)

## Output
Provide:
- Requirements for the specified stage
- User's current progress toward those requirements
- What's missing/blocking graduation
- Suggested fixes if issues found
