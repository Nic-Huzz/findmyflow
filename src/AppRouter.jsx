import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App'
import Profile from './Profile'
import HealingCompass from './HealingCompass'
import NervousSystemFlow from './NervousSystemFlow'
import Challenge from './Challenge'
import NikigaiTest from './NikigaiTest'
import ArchetypeSelection from './ArchetypeSelection'
import EssenceProfile from './EssenceProfile'
import ProtectiveProfile from './ProtectiveProfile'
import Feedback from './Feedback'
import NotificationSettings from './components/NotificationSettings'
import RetreatLanding from './RetreatLanding'
import FlowLibrary from './FlowLibrary'
import AuthGate from './AuthGate'
import { AuthProvider } from './auth/AuthProvider'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'
import './Profile.css'
import './Auth.css'
import './HybridEssenceFlow.css'
import './Challenge.css'
import './Feedback.css'
import './RetreatLanding.css'

function AppRouter() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/retreats" element={<RetreatLanding />} />
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
            <Route path="/nikigai-test" element={
              <AuthGate>
                <NikigaiTest />
              </AuthGate>
            } />
            <Route path="/nikigai/skills" element={
              <AuthGate>
                <NikigaiTest flowFile="nikigai-flow-1-skills.json" flowName="Skills Discovery" />
              </AuthGate>
            } />
            <Route path="/nikigai/problems" element={
              <AuthGate>
                <NikigaiTest flowFile="nikigai-flow-2-problems.json" flowName="Problems Discovery" />
              </AuthGate>
            } />
            <Route path="/nikigai/persona" element={
              <AuthGate>
                <NikigaiTest flowFile="nikigai-flow-3-persona.json" flowName="Persona Discovery" />
              </AuthGate>
            } />
            <Route path="/nikigai/integration" element={
              <AuthGate>
                <NikigaiTest flowFile="nikigai-flow-4-integration.json" flowName="Integration & Mission" />
              </AuthGate>
            } />
            <Route path="/settings/notifications" element={
              <AuthGate>
                <NotificationSettings />
              </AuthGate>
            } />
            <Route path="/library" element={
              <AuthGate>
                <FlowLibrary />
              </AuthGate>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default AppRouter
