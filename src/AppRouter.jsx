import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App'
import PersonaAssessment from './PersonaAssessment'
import AttractionOfferFlow from './AttractionOfferFlow'
import UpsellFlow from './UpsellFlow'
import DownsellFlow from './DownsellFlow'
import ContinuityFlow from './ContinuityFlow'
import MoneyModelGuide from './MoneyModelGuide'
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
import FlowTracker from './pages/FlowTracker'
import PublicValidationFlow from './pages/PublicValidationFlow'
import ValidationFlowsManager from './pages/ValidationFlowsManager'
import AuthGate from './AuthGate'
import { AuthProvider } from './auth/AuthProvider'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'
import './PersonaAssessment.css'
import './AttractionOfferFlow.css'
import './UpsellFlow.css'
import './DownsellFlow.css'
import './ContinuityFlow.css'
import './MoneyModelGuide.css'
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
            {/* Homepage - Persona Assessment */}
            <Route path="/" element={<PersonaAssessment />} />

            {/* Attraction Offer Assessment - Public Lead Magnet */}
            <Route path="/attraction-offer" element={<AttractionOfferFlow />} />

            {/* Upsell Offer Assessment - Public Lead Magnet */}
            <Route path="/upsell-offer" element={<UpsellFlow />} />

            {/* Downsell Offer Assessment - Public Lead Magnet */}
            <Route path="/downsell-offer" element={<DownsellFlow />} />

            {/* Continuity Offer Assessment - Public Lead Magnet */}
            <Route path="/continuity-offer" element={<ContinuityFlow />} />

            {/* Money Model Guide - Educational Overview */}
            <Route path="/money-model-guide" element={<MoneyModelGuide />} />

            {/* Legacy lead magnet flow */}
            <Route path="/lead-magnet" element={<App />} />

            <Route path="/retreats" element={<RetreatLanding />} />

            {/* Public Validation Flow - No Auth Required */}
            <Route path="/v/:shareToken" element={<PublicValidationFlow />} />

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

            {/* Phase 4: Flow Tracker */}
            <Route path="/flow-tracker" element={
              <AuthGate>
                <FlowTracker />
              </AuthGate>
            } />

            {/* Validation Flows Manager */}
            <Route path="/validation-flows" element={
              <AuthGate>
                <ValidationFlowsManager />
              </AuthGate>
            } />

            {/* Persona-specific flows (Phase 2) */}
            <Route path="/100m-offer" element={
              <AuthGate>
                <NikigaiTest flowFile="100m-offer-flow.json" flowName="$100M Offer Builder" />
              </AuthGate>
            } />
            <Route path="/money-model" element={
              <AuthGate>
                <NikigaiTest flowFile="money-model-flow.json" flowName="Money Model Designer" />
              </AuthGate>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default AppRouter
