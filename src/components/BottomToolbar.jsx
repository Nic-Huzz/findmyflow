/**
 * BottomToolbar.jsx
 *
 * Context-aware bottom navigation that changes based on app section.
 *
 * Main App: Home (/me) → Challenge (/7-day-challenge) → League (/league) → Profile (/profile-hub)
 * CRM Section: Sales (/crm/sales) → Marketing (/crm/marketing) → Analytics (/crm/analytics) → Portal (back to challenge)
 */

import { useLocation } from 'react-router-dom'
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
    label: "Let's Play",
    icon: '🎮',
    path: '/7-day-challenge'
  },
  {
    id: 'league',
    label: 'League',
    icon: '🏆',
    path: '/league'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: '👤',
    path: '/profile-hub'
  }
]

// Create portal navigation items
const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron

const CREATE_NAV_ITEMS = [
  {
    id: 'identity',
    label: 'Identity',
    icon: '✨',
    path: '/create'
  },
  {
    id: 'experiences',
    label: 'Experiences',
    icon: '🎪',
    path: '/create/experiences'
  },
  {
    id: 'growth',
    label: 'Growth',
    icon: '📈',
    path: '/create/growth'
  },
  ...(isElectron ? [{
    id: 'ai-portal',
    label: 'Terminal',
    icon: '⚡',
    path: '/create/terminal'
  }] : []),
  {
    id: 'creator-profile',
    label: 'Profile',
    icon: '👤',
    path: '/create/profile'
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
  '/validation-flows', // Validation flows manager
  '/try/', // Public lead magnet flows
  '/weekly-planning', // Full-screen planning flow
  '/nikigai/', // Flow finder flows
  '/flow-finder-explainer', // Flow Finder framework explainer
  '/what-is-healing-explainer', // Healing explainer
  '/emotional-splinter-explainer', // Emotional splinter explainer
  '/how-do-we-heal-explainer', // How do we heal explainer
  '/play-skills-identifier', // Standalone play-skills identification
  '/play-list-finder', // Quick skills discovery
  '/persona-identifier', // Quick persona discovery
  '/mind-space', // Mind space extraction
  '/nervous-system',
  '/healing-compass',
  '/limiting-belief-rewire',
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
  '/feedback-analysis',
  '/archetypes/', // Essence and Shadow deep dive pages
  '/crm/import', // CSV import wizard has bottom action buttons
  '/money-model-guide', // Money Model explainer slides
  '/sol', // Sol AI co-founder onboarding + dashboard
  '/shift-scorecard', // Public Shift Architecture audit scorecard
  '/experience-creators', // Experience Creator Matching (public lead magnet)
  '/scope-map', // Scope Map diagnostic flow
  '/movement-makers', // Movement Makers landing page
  '/settings/' // Settings pages (notifications, etc.)
]

function BottomToolbar() {
  const location = useLocation()
  const [isOnboarding, setIsOnboarding] = useState(false)

  // Watch for onboarding-active, project-selector-active, or modal-active class on body
  useEffect(() => {
    const checkShouldHide = () => {
      const hasOnboarding = document.body.classList.contains('onboarding-active')
      const hasProjectSelector = document.body.classList.contains('project-selector-active')
      const hasModal = document.body.classList.contains('modal-active')
      setIsOnboarding(hasOnboarding || hasProjectSelector || hasModal)
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

  // Detect which section we're in
  const isCRMSection = location.pathname.startsWith('/crm')
  const isCreateSection = location.pathname === '/create' || location.pathname.startsWith('/create/')

  // Select appropriate nav items based on section
  const navItems = isCreateSection ? CREATE_NAV_ITEMS
    : isCRMSection ? CRM_NAV_ITEMS
    : MAIN_NAV_ITEMS

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

    // Create portal navigation logic
    if (isCreateSection) {
      if (item.id === 'identity') return path === '/create'
      if (item.id === 'experiences') {
        return path.startsWith('/create/experience') ||
               path === '/create/inspiration'
      }
      if (item.id === 'growth') {
        return path === '/create/growth' ||
               path === '/create/pay-rent' ||
               path === '/create/remarkable' ||
               path === '/create/scale-income' ||
               path === '/create/plays' ||
               path === '/create/attraction-stack' ||
               path === '/create/marketing-campaign'
      }
      if (item.id === 'ai-portal') return path === '/create/terminal'
      if (item.id === 'creator-profile') return path === '/create/profile'
    }

    // Main nav: League is active on any /league/* path
    if (item.id === 'league') return path === '/league' || path.startsWith('/league/')

    return path === item.path
  }

  return (
    <nav className={`bottom-toolbar ${isCreateSection ? 'create-toolbar' : isCRMSection ? 'crm-toolbar' : 'main-toolbar'}`}>
      {navItems.map(item => (
        // Use plain <a> instead of navigate() — React Router v7 wraps navigate()
        // in startTransition which suppresses Suspense fallbacks for lazy routes.
        // Plain links force a full browser navigation that always works.
        <a
          key={item.id}
          href={item.locked ? undefined : item.path}
          className={`toolbar-item ${isActive(item) ? 'active' : ''} ${item.isReturn ? 'return-item' : ''} ${item.isLaunch ? 'launch-item' : ''} ${item.locked ? 'locked-item' : ''}`}
          aria-label={item.label}
          aria-current={isActive(item) ? 'page' : undefined}
          onClick={item.locked ? (e) => e.preventDefault() : undefined}
        >
          <span className="toolbar-icon">{item.icon}</span>
          <span className="toolbar-label">{item.label}</span>
        </a>
      ))}
    </nav>
  )
}

export default BottomToolbar
