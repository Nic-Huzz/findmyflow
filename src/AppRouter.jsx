import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App'
import Profile from './Profile'
import HealingCompass from './HealingCompass'
import Challenge from './Challenge'
import ArchetypeSelection from './ArchetypeSelection'
import EssenceProfile from './EssenceProfile'
import ProtectiveProfile from './ProtectiveProfile'
import AuthGate from './AuthGate'
import { AuthProvider } from './auth/AuthProvider'
import './App.css'
import './Profile.css'
import './Auth.css'
import './HybridEssenceFlow.css'
import './Challenge.css'

function AppRouter() {
  return (
    <AuthProvider>
      <Router>
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
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default AppRouter
