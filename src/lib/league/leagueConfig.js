/**
 * leagueConfig.js — Fantasy League constants and category definitions
 */

// Content submission point values (Reach category tasks)
// Keys match league_content_submissions.content_type — DO NOT rename keys (breaks existing rows)
export const CONTENT_POINT_VALUES = {
  share_leaderboard: {
    label: 'Share the Leaderboard',
    points: 2,
    icon: '📊',
    description: 'Post your league standings to your story or feed',
    submissionType: 'url',
    templateType: 'leaderboard',
  },
  comment_engage: {
    label: 'Comment & Engage',
    points: 2,
    icon: '💬',
    description: 'Engage with 3 league players this week',
    submissionType: 'player_picker',
    autoApprove: true,
  },
  accountability_post: {
    label: 'Accountability Post',
    points: 4,
    icon: '📝',
    description: 'Commit to courage challenges publicly this week',
    submissionType: 'quest_task_picker',
    autoApprove: true,
  },
  shoutout_teammate: {
    label: 'Shout Out a Player',
    points: 4,
    icon: '🙌',
    description: 'Celebrate a teammate with a public shout-out',
    submissionType: 'url',
    templateType: 'scorecard',
    autoApprove: true,
  },
  playlist_proof: {
    label: 'Courage Proof',
    points: 8,
    icon: '💪',
    description: 'Share evidence of a courage challenge you completed',
    submissionType: 'url',
    templateType: 'courage',
    crossPostToFeed: true,
  },
  offer_in_wild: {
    label: 'Flow in the Wild',
    points: 10,
    icon: '🌍',
    description: 'Proof of your flow in the real world: screenshot, DM, or testimonial',
    submissionType: 'url',
    crossPostToFeed: true,
  },
}

// Fantasy scoring categories — maps to quest_completions.quest_category
// Tune + Courage + Reach (win 2 of 3). Healing merged into Courage.
export const FANTASY_CATEGORIES = {
  tune: {
    key: 'tune',
    label: 'Tune',
    icon: '☀️',
    color: '#f9a8d4',
    dbFilter: ['Tune'],
    scoringType: 'raw',
  },
  courage: {
    key: 'courage',
    label: 'Courage',
    icon: '🔥',
    color: '#E9A23B',
    dbFilter: ['Groans', 'Healing', 'Daily', 'Weekly'],
    scoringType: 'raw',
  },
  reach: {
    key: 'reach',
    label: 'Community',
    icon: '📣',
    color: '#67e8f9',
    dbFilter: [],
    scoringType: 'content',
  },
}

export const CATEGORY_KEYS = Object.keys(FANTASY_CATEGORIES)

// Match point awards (3 categories: win 2+ = WIN, 1-1 = DRAW)
export const MATCH_POINTS = {
  WIN: 3,   // Win 2+ of 3 categories
  DRAW: 1,  // 1-1 split (with 1 tied)
  LOSS: 0,  // Win 0 categories
}

// League statuses
export const LEAGUE_STATUSES = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

// Invite code length
// Reverse-lookup: quest category → fantasy emoji
export const getCategoryEmoji = (questCategory) => {
  for (const cat of Object.values(FANTASY_CATEGORIES)) {
    if (cat.dbFilter.includes(questCategory)) return cat.icon
  }
  return ''
}

// Reverse-lookup: quest category → fantasy color
export const getCategoryColor = (questCategory) => {
  for (const cat of Object.values(FANTASY_CATEGORIES)) {
    if (cat.dbFilter.includes(questCategory)) return cat.color
  }
  return null
}

export const INVITE_CODE_LENGTH = 6
