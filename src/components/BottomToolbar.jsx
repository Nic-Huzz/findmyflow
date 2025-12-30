/**
 * BottomToolbar.jsx
 *
 * Fixed bottom navigation for main app sections.
 * Routes: Home (/me) → Challenge (/7-day-challenge) → Compass (/flow-compass) → Library (/library)
 *
 * Story: See yourself → Take action → Track energy → Review insights
 */

import { useLocation, useNavigate } from 'react-router-dom'
import './BottomToolbar.css'

const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Home',
    icon: '🏠',
    path: '/me'
  },
  {
    id: 'challenge',
    label: 'Challenge',
    icon: '🎯',
    path: '/7-day-challenge'
  },
  {
    id: 'compass',
    label: 'Compass',
    icon: '🧭',
    path: '/flow-compass'
  },
  {
    id: 'library',
    label: 'Library',
    icon: '📚',
    path: '/library'
  }
]

// Routes where the toolbar should NOT appear
const HIDDEN_ROUTES = [
  '/',
  '/log-in',
  '/v/', // Public validation flows
  '/retreats',
  '/weekly-planning', // Full-screen planning flow
  '/nikigai/', // Flow finder flows
  '/nervous-system',
  '/healing-compass',
  '/attraction-offer',
  '/upsell-offer',
  '/downsell-offer',
  '/continuity-offer',
  '/leads-strategy',
  '/lead-magnet',
  '/offer-builder',
  '/persona-selection'
]

function BottomToolbar() {
  const location = useLocation()
  const navigate = useNavigate()

  // Check if toolbar should be hidden on this route
  const shouldHide = HIDDEN_ROUTES.some(route => {
    if (route === '/') return location.pathname === '/'
    return location.pathname.startsWith(route)
  })

  if (shouldHide) return null

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="bottom-toolbar">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`toolbar-item ${isActive(item.path) ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
          aria-label={item.label}
          aria-current={isActive(item.path) ? 'page' : undefined}
        >
          <span className="toolbar-icon">{item.icon}</span>
          <span className="toolbar-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default BottomToolbar
