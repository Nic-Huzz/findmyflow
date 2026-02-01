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

// CRM section navigation items - Tower structure
const CRM_NAV_ITEMS = [
  {
    id: 'home',
    label: 'Home',
    icon: '🏠',
    path: '/crm'
  },
  {
    id: 'attract',
    label: 'Attract',
    icon: '🎯',
    path: '/crm/attract'
  },
  {
    id: 'execute',
    label: 'Execute',
    icon: '🚀',
    path: '/crm/execute'
  },
  {
    id: 'nurture',
    label: 'Nurture',
    icon: '💜',
    path: '/crm/nurture'
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: '🧰',
    path: '/crm/tools'
  }
]

// Routes where the toolbar should NOT appear
const HIDDEN_ROUTES = [
  '/',
  '/log-in',
  '/get-started', // Onboarding persona assessment
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
  '/offer-builder-v2', // Grand Slam Offer evaluation flow
  '/offer-stack-builder', // Offer Stack Builder packaging flow
  '/lead-magnet-selection',
  '/product-selection',
  '/funnel-builder',
  '/funnel-calculator',
  '/persona-selection',
  '/report-card',
  '/mvp-readiness',
  '/feedback-analysis'
]

function BottomToolbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOnboarding, setIsOnboarding] = useState(false)

  // Watch for onboarding-active or project-selector-active class on body
  useEffect(() => {
    const checkShouldHide = () => {
      const hasOnboarding = document.body.classList.contains('onboarding-active')
      const hasProjectSelector = document.body.classList.contains('project-selector-active')
      setIsOnboarding(hasOnboarding || hasProjectSelector)
    }

    // Check immediately
    checkShouldHide()

    // Set up MutationObserver to watch for class changes
    const observer = new MutationObserver(checkShouldHide)
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

  // Active state check - for CRM towers, highlight parent when on sub-pages
  const isActive = (item) => {
    if (item.isReturn) return false // Return button is never "active"

    const path = location.pathname

    // CRM tower navigation logic
    if (isCRMSection) {
      // Home is active only on exact /crm path
      if (item.id === 'home') return path === '/crm'

      // Attract tower - includes content, pages, cold-outreach, marketing
      if (item.id === 'attract') {
        return path === '/crm/attract' ||
               path.startsWith('/crm/content') ||
               path.startsWith('/crm/pages') ||
               path.startsWith('/crm/cold-outreach') ||
               path.startsWith('/crm/marketing')
      }

      // Nurture tower - includes contacts, email, pipeline, sales, warm-outreach
      if (item.id === 'nurture') {
        return path === '/crm/nurture' ||
               path.startsWith('/crm/contacts') ||
               path.startsWith('/crm/email') ||
               path.startsWith('/crm/pipeline') ||
               path.startsWith('/crm/sales') ||
               path.startsWith('/crm/warm-outreach') ||
               path.startsWith('/crm/ascension')
      }

      // Tools tower - includes analytics, implementations, calculators, scripts
      if (item.id === 'tools') {
        return path === '/crm/tools' ||
               path.startsWith('/crm/analytics') ||
               path.startsWith('/crm/implementations') ||
               path.startsWith('/crm/calculators') ||
               path.startsWith('/crm/scripts')
      }

      // Execute - exact match
      if (item.id === 'execute') return path === '/crm/execute'
    }

    return path === item.path
  }

  return (
    <nav className={`bottom-toolbar ${isCRMSection ? 'crm-toolbar' : 'main-toolbar'}`}>
      {navItems.map(item => (
        <button
          key={item.id}
          className={`toolbar-item ${isActive(item) ? 'active' : ''} ${item.isReturn ? 'return-item' : ''} ${item.isLaunch ? 'launch-item' : ''}`}
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
