import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import App from './App'
import Profile from './Profile'
import HealingCompass from './HealingCompass'
import NervousSystemFlow from './NervousSystemFlow'
import Challenge from './Challenge'
import ArchetypeSelection from './ArchetypeSelection'
import EssenceProfile from './EssenceProfile'
import ProtectiveProfile from './ProtectiveProfile'
import Feedback from './Feedback'
import NotificationSettings from './components/NotificationSettings'
import AuthGate from './AuthGate'
import { AuthProvider } from './auth/AuthProvider'
import ErrorBoundary from './components/ErrorBoundary'
import { updateManifestForCurrentPage } from './utils/dynamicManifest'
import './App.css'
import './Profile.css'
import './Auth.css'
import './HybridEssenceFlow.css'
import './Challenge.css'
import './Feedback.css'

// Component to update manifest on route changes
function ManifestUpdater() {
  const location = useLocation()

  useEffect(() => {
    // Update manifest on initial mount and whenever route changes
    updateManifestForCurrentPage()
  }, [location.pathname, location.search])

  return null
}

function AppRouter() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ManifestUpdater />
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/me" element={
              <AuthGate>
                <Profile />
              </AuthGate>
            } />
            <Route path="/healing-compass" element={
              <AuthGate>
                <HealingCompass />
              </AuthGate>
            } />
            <Route path="/nervous-system" element={
              <AuthGate>
                <NervousSystemFlow />
              </AuthGate>
            } />
            <Route path="/7-day-challenge" element={
              <AuthGate>
                <Challenge />
              </AuthGate>
            } />
            <Route path="/archetypes" element={
              <AuthGate>
                <ArchetypeSelection />
              </AuthGate>
            } />
            <Route path="/archetypes/essence" element={
              <AuthGate>
                <EssenceProfile />
              </AuthGate>
            } />
            <Route path="/archetypes/protective" element={
              <AuthGate>
                <ProtectiveProfile />
              </AuthGate>
            } />
            <Route path="/feedback" element={
              <AuthGate>
                <Feedback />
              </AuthGate>
            } />
            <Route path="/settings/notifications" element={
              <AuthGate>
                <NotificationSettings />
              </AuthGate>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default AppRouter
