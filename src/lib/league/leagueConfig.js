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
  },
  shoutout_teammate: {
    label: 'Shout Out a Teammate',
    points: 4,
    icon: '🙌',
    description: 'Celebrate a teammate with a public shout-out post',
    submissionType: 'url',
  },
  share_hero_profile: {
    label: 'Share Your Hero Profile',
    points: 4,
    icon: '🦸',
    description: 'Share your hero profile to your story or feed',
    submissionType: 'url',
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
  business_efficiency: {
    key: 'business_efficiency',
    label: 'Business Efficiency',
    icon: '💼',
    color: '#5e17eb',
    dbFilter: ['Business', 'Flow Finder'],
    scoringType: 'efficiency', // SUM(points) / COUNT(DISTINCT quest_id)
  },
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
  voice: {
    key: 'voice',
    label: 'Voice',
    icon: '🎭',
    color: '#8B5CF6',
    dbFilter: ['Voices'],
    scoringType: 'raw',
  },
  bonus: {
    key: 'bonus',
    label: 'Bonus',
    icon: '⭐',
    color: '#3B82F6',
    dbFilter: ['Bonus'],
    scoringType: 'raw', // Raw SUM(points) + approved content submissions
  },
}

export const CATEGORY_KEYS = Object.keys(FANTASY_CATEGORIES)

// Match point awards
export const MATCH_POINTS = {
  WIN: 3,   // Win 3+ categories
  DRAW: 1,  // Win exactly 2 categories
  LOSS: 0,  // Win 0-1 categories
}

// League statuses
export const LEAGUE_STATUSES = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

// Invite code length
export const INVITE_CODE_LENGTH = 6
