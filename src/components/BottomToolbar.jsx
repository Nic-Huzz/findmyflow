/**
 * BottomToolbar.jsx
 *
 * Context-aware bottom navigation that changes based on app section.
 *
 * Main App: Home (/me) → Challenge (/7-day-challenge) → Compass (/flow-compass) → Library (/library)
 * CRM Section: Sales (/crm/sales) → Marketing (/crm/marketing) → Analytics (/crm/analytics) → Portal (back to challenge)
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './BottomToolbar.css'

// Main app navigation items
const MAIN_NAV_ITEMS = [
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

// CRM section navigation items
const CRM_NAV_ITEMS = [
  {
    id: 'sales',
    label: 'Sales',
    icon: '💰',
    path: '/crm/sales'
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: '📣',
    path: '/crm/marketing'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: '📊',
    path: '/crm/analytics'
  },
  {
    id: 'portal',
    label: 'Portal',
    icon: '🔙',
    path: '/7-day-challenge',
    isReturn: true // Special flag for return button styling
  }
]

// Routes where the toolbar should NOT appear
const HIDDEN_ROUTES = [
  '/',
  '/log-in',
  '/v/', // Public validation flows
  '/try/', // Public lead magnet flows
  '/weekly-planning', // Full-screen planning flow
  '/nikigai/', // Flow finder flows
  '/nervous-system',
  '/healing-compass',
  '/attraction-offer',
  '/upsell-offer',
  '/downsell-offer',
  '/continuity-offer',
  '/leads-strategy',
  '/offer-builder',
  '/lead-magnet-selection',
  '/product-selection',
  '/funnel-builder',
  '/funnel-calculator',
  '/persona-selection',
  '/report-card'
]

function BottomToolbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOnboarding, setIsOnboarding] = useState(false)

  // Watch for onboarding-active class on body
  useEffect(() => {
    const checkOnboarding = () => {
      setIsOnboarding(document.body.classList.contains('onboarding-active'))
    }

    // Check immediately
    checkOnboarding()

    // Set up MutationObserver to watch for class changes
    const observer = new MutationObserver(checkOnboarding)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  // Check if toolbar should be hidden on this route
  const shouldHide = HIDDEN_ROUTES.some(route => {
    if (route === '/') return location.pathname === '/'
    return location.pathname.startsWith(route)
  })

  if (shouldHide || isOnboarding) return null

  // Detect if we're in the CRM section
  const isCRMSection = location.pathname.startsWith('/crm')

  // Select appropriate nav items based on section
  const navItems = isCRMSection ? CRM_NAV_ITEMS : MAIN_NAV_ITEMS

  // Active state check - for CRM, also check if we're on any CRM subpage
  const isActive = (item) => {
    if (item.isReturn) return false // Return button is never "active"
    if (isCRMSection && item.path.startsWith('/crm')) {
      // For CRM items, check exact match or if we're on a CRM tool page
      // This keeps Sales/Marketing/Analytics highlighted when on their pages
      return location.pathname === item.path
    }
    return location.pathname === item.path
  }

  return (
    <nav className={`bottom-toolbar ${isCRMSection ? 'crm-toolbar' : 'main-toolbar'}`}>
      {navItems.map(item => (
        <button
          key={item.id}
          className={`toolbar-item ${isActive(item) ? 'active' : ''} ${item.isReturn ? 'return-item' : ''}`}
          onClick={() => navigate(item.path)}
          aria-label={item.label}
          aria-current={isActive(item) ? 'page' : undefined}
        >
          <span className="toolbar-icon">{item.icon}</span>
          <span className="toolbar-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default BottomToolbar
