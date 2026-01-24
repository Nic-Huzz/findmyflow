/**
 * EmptyState - Friendly empty state displays
 * Used when lists or data areas have no content
 */
import { useNavigate } from 'react-router-dom'
import './EmptyState.css'

// Predefined empty state configurations
const EMPTY_STATES = {
  content: {
    icon: '📝',
    title: 'No content yet',
    description: 'Start creating posts to attract your audience',
    actionLabel: 'Create First Post',
    actionPath: '/crm/marketing',
  },
  contacts: {
    icon: '👥',
    title: 'No contacts yet',
    description: 'Add your first lead or customer to get started',
    actionLabel: 'Add Contact',
    actionPath: '/crm/contacts',
  },
  deals: {
    icon: '💼',
    title: 'No deals in pipeline',
    description: 'Add a deal to start tracking your sales',
    actionLabel: 'Add Deal',
    actionPath: '/crm/sales',
  },
  tasks: {
    icon: '✅',
    title: 'All caught up!',
    description: 'No tasks scheduled for this week',
    actionLabel: 'Plan Your Week',
    actionPath: '/crm/execute',
  },
  analytics: {
    icon: '📊',
    title: 'No data yet',
    description: 'Complete some activities to see your analytics',
    actionLabel: 'Get Started',
    actionPath: '/crm',
  },
  implementations: {
    icon: '🛠️',
    title: 'No implementations',
    description: 'Track your build progress here',
    actionLabel: 'Start Building',
    actionPath: '/crm/implementations',
  },
  scripts: {
    icon: '📜',
    title: 'Scripts ready to use',
    description: 'Browse proven frameworks for your sales calls',
    actionLabel: 'View Scripts',
    actionPath: '/crm/scripts',
  },
  pages: {
    icon: '🌐',
    title: 'No pages yet',
    description: 'Track your landing pages and sales pages here',
    actionLabel: 'Add Your First Page',
    actionPath: '/crm/pages',
  },
  generic: {
    icon: '📭',
    title: 'Nothing here yet',
    description: 'This area will populate as you use the app',
    actionLabel: null,
    actionPath: null,
  },
}

export default function EmptyState({
  type = 'generic',
  icon,
  title,
  description,
  actionLabel,
  actionPath,
  onAction,
  compact = false,
}) {
  const navigate = useNavigate()
  const preset = EMPTY_STATES[type] || EMPTY_STATES.generic

  // Allow overrides
  const displayIcon = icon || preset.icon
  const displayTitle = title || preset.title
  const displayDescription = description || preset.description
  const displayActionLabel = actionLabel !== undefined ? actionLabel : preset.actionLabel
  const displayActionPath = actionPath !== undefined ? actionPath : preset.actionPath

  function handleAction() {
    if (onAction) {
      onAction()
    } else if (displayActionPath) {
      navigate(displayActionPath)
    }
  }

  return (
    <div className={`empty-state ${compact ? 'compact' : ''}`}>
      <div className="empty-state-icon">{displayIcon}</div>
      <h3 className="empty-state-title">{displayTitle}</h3>
      <p className="empty-state-description">{displayDescription}</p>
      {displayActionLabel && (
        <button className="empty-state-action" onClick={handleAction}>
          {displayActionLabel}
        </button>
      )}
    </div>
  )
}

/**
 * Inline empty state for smaller areas (lists, cards)
 */
export function InlineEmptyState({ icon = '📭', message, action, onAction }) {
  return (
    <div className="inline-empty-state">
      <span className="inline-empty-icon">{icon}</span>
      <span className="inline-empty-message">{message}</span>
      {action && onAction && (
        <button className="inline-empty-action" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  )
}

/**
 * Card-style empty state for grid layouts
 */
export function EmptyStateCard({ icon, title, description, onClick }) {
  return (
    <div className="empty-state-card" onClick={onClick}>
      <div className="empty-card-icon">{icon || '➕'}</div>
      <div className="empty-card-content">
        <span className="empty-card-title">{title || 'Add new'}</span>
        {description && (
          <span className="empty-card-description">{description}</span>
        )}
      </div>
    </div>
  )
}
