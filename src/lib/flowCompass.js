// Flow Compass Helper Functions
// Provides direction definitions, colors, and utilities for the Flow Tracker

/**
 * Flow Direction Definitions
 * Based on internal state (excited/tired) + external state (ease/resistance)
 */
export const FLOW_DIRECTIONS = {
  north: {
    id: 'north',
    label: 'Continue',
    fullLabel: 'Full Flow',
    internal: 'excited',
    external: 'ease',
    color: '#10B981', // Green - Go!
    icon: '⬆️',
    emoji: '🚀',
    signal: "Continue doing this - you're in flow",
    description: 'Excited energy + Easy results = Keep going!',
    action: "Double down on what's working"
  },
  east: {
    id: 'east',
    label: 'Pivot',
    fullLabel: 'Pivot Required',
    internal: 'excited',
    external: 'resistance',
    color: '#F59E0B', // Amber - Caution
    icon: '➡️',
    emoji: '🔄',
    signal: "You love it but something's not working - pivot the approach",
    description: 'Excited energy + Hard results = Change your approach',
    action: 'Try a different method'
  },
  south: {
    id: 'south',
    label: 'Rest',
    fullLabel: 'Rest or Stop',
    internal: 'tired',
    external: 'resistance',
    color: '#EF4444', // Red - Stop
    icon: '⬇️',
    emoji: '🛑',
    signal: "Stop or rest - this isn't the path",
    description: 'Tired energy + Hard results = Time to pause',
    action: 'Rest or reconsider this path'
  },
  west: {
    id: 'west',
    label: 'Explore',
    fullLabel: 'New Opportunity',
    internal: 'tired',
    external: 'ease',
    color: '#8B5CF6', // Purple - Explore
    icon: '⬅️',
    emoji: '✨',
    signal: 'A new opportunity dropped in - explore it',
    description: 'Tired energy + Easy results = Something interesting appeared',
    action: 'Explore this new path'
  }
};

/**
 * Get direction from internal and external state
 */
export const getDirectionFromStates = (internal, external) => {
  if (internal === 'excited' && external === 'ease') return 'north';
  if (internal === 'excited' && external === 'resistance') return 'east';
  if (internal === 'tired' && external === 'resistance') return 'south';
  if (internal === 'tired' && external === 'ease') return 'west';
  return null;
};

/**
 * Get direction config by ID
 */
export const getDirection = (directionId) => {
  return FLOW_DIRECTIONS[directionId] || null;
};

/**
 * Get direction color
 */
export const getDirectionColor = (directionId) => {
  return FLOW_DIRECTIONS[directionId]?.color || '#6B7280';
};

/**
 * Get direction label
 */
export const getDirectionLabel = (directionId) => {
  return FLOW_DIRECTIONS[directionId]?.label || directionId;
};

/**
 * Get direction full label
 */
export const getDirectionFullLabel = (directionId) => {
  return FLOW_DIRECTIONS[directionId]?.fullLabel || directionId;
};

/**
 * Get direction icon
 */
export const getDirectionIcon = (directionId) => {
  return FLOW_DIRECTIONS[directionId]?.icon || '●';
};

/**
 * Get direction emoji
 */
export const getDirectionEmoji = (directionId) => {
  return FLOW_DIRECTIONS[directionId]?.emoji || '📍';
};

/**
 * Get direction signal/description
 */
export const getDirectionSignal = (directionId) => {
  return FLOW_DIRECTIONS[directionId]?.signal || '';
};

/**
 * Get all directions as array
 */
export const getAllDirections = () => {
  return Object.values(FLOW_DIRECTIONS);
};

/**
 * Calculate direction distribution from entries
 * Returns object like { north: 5, east: 3, south: 2, west: 1 }
 */
export const calculateDistribution = (entries) => {
  const dist = { north: 0, east: 0, south: 0, west: 0 };
  entries.forEach(entry => {
    if (dist[entry.direction] !== undefined) {
      dist[entry.direction]++;
    }
  });
  return dist;
};

/**
 * Get dominant direction from distribution
 */
export const getDominantDirection = (distribution) => {
  if (!distribution) return null;
  const entries = Object.entries(distribution);
  if (entries.length === 0) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
};

/**
 * Calculate consistency score (0-1)
 * Higher = more consistent (user mostly logs same direction)
 */
export const calculateConsistency = (entries) => {
  if (!entries || entries.length === 0) return 0;
  const dist = calculateDistribution(entries);
  const total = entries.length;
  const max = Math.max(...Object.values(dist));
  return max / total;
};

/**
 * Format date for display
 */
export const formatFlowDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Get period start date based on analysis period
 */
export const getPeriodStart = (period) => {
  const now = new Date();
  switch (period) {
    case 'weekly':
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return weekAgo.toISOString().split('T')[0];

    case 'monthly':
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      return monthAgo.toISOString().split('T')[0];

    case 'all_time':
      return '2024-01-01'; // Or earliest possible date

    default:
      return new Date().toISOString().split('T')[0];
  }
};

/**
 * Validate flow entry data
 */
export const validateFlowEntry = (entry) => {
  const errors = [];

  if (!entry.direction || !['north', 'east', 'south', 'west'].includes(entry.direction)) {
    errors.push('Invalid direction');
  }

  if (!entry.internal_state || !['excited', 'tired'].includes(entry.internal_state)) {
    errors.push('Invalid internal state');
  }

  if (!entry.external_state || !['ease', 'resistance'].includes(entry.external_state)) {
    errors.push('Invalid external state');
  }

  if (!entry.reasoning || entry.reasoning.trim().length < 10) {
    errors.push('Reasoning must be at least 10 characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
