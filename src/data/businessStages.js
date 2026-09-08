/**
 * businessStages.js — Self-identified business stage for money model filtering
 *
 * User picks where they are. Card shows the models relevant to that stage.
 * Expandable to see the full growth path.
 */

export const BUSINESS_STAGES = [
  {
    id: 'hobby',
    label: 'Hobby / side thing',
    subtitle: 'No real business structure',
    icon: '🌱',
    currentModels: ['employed', 'per_session'],
    nextModels: ['group_program', 'content'],
    nextPrompt: 'Charge for the first time',
  },
  {
    id: 'first_revenue',
    label: 'First revenue',
    subtitle: "You've charged someone, once",
    icon: '💡',
    currentModels: ['per_session', 'content'],
    nextModels: ['group_program'],
    nextPrompt: 'Make it repeatable',
  },
  {
    id: 'repeatable',
    label: 'Repeatable income',
    subtitle: 'Regular clients or customers, it works',
    icon: '🔁',
    currentModels: ['group_program', 'content', 'per_session'],
    nextModels: ['digital_product', 'membership'],
    nextPrompt: 'Stop trading time for money',
  },
  {
    id: 'full_time',
    label: 'Full-time',
    subtitle: "This is your livelihood, you've quit the other thing",
    icon: '🚀',
    currentModels: ['group_program', 'membership', 'digital_product'],
    nextModels: ['certification'],
    nextPrompt: 'Build leverage',
  },
  {
    id: 'team_scale',
    label: 'Team / scale',
    subtitle: 'Other people depend on this business',
    icon: '🏗',
    currentModels: ['certification', 'membership'],
    nextModels: [],
    nextPrompt: 'Let others deliver your method',
  },
]
