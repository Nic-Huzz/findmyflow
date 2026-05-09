/**
 * leagueConfig.js — Fantasy League constants and category definitions
 */

// Content submission point values
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
    description: 'Engage with 3 league players — comment, DM, or reply to their content',
    submissionType: 'player_picker',
  },
  accountability_post: {
    label: 'Accountability Post',
    points: 4,
    icon: '📝',
    description: 'Share your weekly plan or goals publicly',
    submissionType: 'url',
    templateType: 'intentions',
  },
  shoutout_teammate: {
    label: 'Shout Out a Player',
    points: 4,
    icon: '🙌',
    description: 'Celebrate a teammate with a public shout-out post',
    submissionType: 'url',
    templateType: 'scorecard',
  },
  share_hero_profile: {
    label: 'Share Your Hero Profile',
    points: 4,
    icon: '🦸',
    description: 'Share your hero profile to your story or feed',
    submissionType: 'url',
    templateType: 'hero',
  },
  carousel_highlights: {
    label: 'Carousel Highlights',
    points: 8,
    icon: '🎠',
    description: 'Create a carousel post highlighting your week',
    submissionType: 'url',
  },
  playlist_proof: {
    label: 'Play-List Proof',
    points: 8,
    icon: '🎭',
    description: 'Share evidence of a courage challenge you completed',
    submissionType: 'url',
    templateType: 'courage',
  },
  customise_hero: {
    label: 'Customise Your Hero Profile',
    points: 10,
    icon: '🦸',
    description: 'Personalise your hero profile — name, image, superpower, or vision',
    submissionType: 'url',
  },
  offer_in_wild: {
    label: 'Offer in the Wild',
    points: 10,
    icon: '🎯',
    description: 'Show proof of your offer out there — a screenshot, DM, or conversation',
    submissionType: 'url',
  },
}

// Fantasy scoring categories — maps to quest_completions.quest_category
export const FANTASY_CATEGORIES = {
  play_list: {
    key: 'play_list',
    label: 'Play-List',
    icon: '🎮',
    color: '#E9A23B',
    dbFilter: ['Groans'],
    scoringType: 'raw', // Raw SUM(points)
  },
  healing: {
    key: 'healing',
    label: 'Healing',
    icon: '💚',
    color: '#10b981',
    dbFilter: ['Healing', 'Daily', 'Weekly'],
    scoringType: 'raw',
  },
  tune: {
    key: 'tune',
    label: 'Tune',
    icon: '☀️',
    color: '#10b981',
    dbFilter: ['Tune'],
    scoringType: 'raw',
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
