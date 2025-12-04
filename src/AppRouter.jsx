import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App'
import PersonaAssessment from './PersonaAssessment'
import AttractionOfferFlow from './AttractionOfferFlow'
import UpsellFlow from './UpsellFlow'
import DownsellFlow from './DownsellFlow'
import ContinuityFlow from './ContinuityFlow'
import LeadsStrategyFlow from './LeadsStrategyFlow'
import LeadMagnetFlow from './LeadMagnetFlow'
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
import FlowCompass from './pages/FlowCompass'
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
import './LeadsStrategyFlow.css'
import './LeadMagnetFlow.css'
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

            {/* Attraction Offer Assessment - In-App Challenge */}
            <Route path="/attraction-offer" element={
              <AuthGate>
                <AttractionOfferFlow />
              </AuthGate>
            } />

            {/* Upsell Offer Assessment - In-App Challenge */}
            <Route path="/upsell-offer" element={
              <AuthGate>
                <UpsellFlow />
              </AuthGate>
            } />

            {/* Downsell Offer Assessment - In-App Challenge */}
            <Route path="/downsell-offer" element={
              <AuthGate>
                <DownsellFlow />
              </AuthGate>
            } />

            {/* Continuity Offer Assessment - In-App Challenge */}
            <Route path="/continuity-offer" element={
              <AuthGate>
                <ContinuityFlow />
              </AuthGate>
            } />

            {/* Leads Strategy Assessment - In-App Challenge */}
            <Route path="/leads-strategy" element={
              <AuthGate>
                <LeadsStrategyFlow />
              </AuthGate>
            } />

            {/* Lead Magnet Type Assessment - In-App Challenge */}
            <Route path="/lead-magnet" element={
              <AuthGate>
                <LeadMagnetFlow />
              </AuthGate>
            } />

            {/* Money Model Guide - Educational Overview */}
            <Route path="/money-model-guide" element={<MoneyModelGuide />} />

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

            {/* Phase 4: Flow Compass */}
            <Route path="/flow-compass" element={
              <AuthGate>
                <FlowCompass />
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
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default AppRouter
