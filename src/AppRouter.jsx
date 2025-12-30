import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App'
import PersonaAssessment from './PersonaAssessment'
import AttractionOfferFlow from './flows/AttractionOfferFlow'
import UpsellFlow from './flows/UpsellFlow'
import DownsellFlow from './flows/DownsellFlow'
import ContinuityFlow from './flows/ContinuityFlow'
import LeadsStrategyFlow from './flows/LeadsStrategyFlow'
import LeadMagnetFlow from './flows/LeadMagnetFlow'
import OfferBuilderFlow from './flows/OfferBuilderFlow'
import LeadMagnetSelectionFlow from './flows/LeadMagnetSelectionFlow'
import ProductSelectionFlow from './flows/ProductSelectionFlow'
import FunnelBuilderFlow from './flows/FunnelBuilderFlow'
import PersonaSelectionFlow from './flows/PersonaSelectionFlow'
import MoneyModelGuide from './MoneyModelGuide'
import Profile from './Profile'
import HealingCompass from './flows/HealingCompass'
import NervousSystemFlow from './flows/NervousSystemFlow'
import Challenge from './Challenge'
import FlowFinderSkills from './flows/FlowFinderSkills'
import FlowFinderProblems from './flows/FlowFinderProblems'
import FlowFinderPersona from './flows/FlowFinderPersona'
import FlowFinderIntegration from './flows/FlowFinderIntegration'
import ArchetypeSelection from './ArchetypeSelection'
import EssenceProfile from './profiles/EssenceProfile'
import ProtectiveProfile from './profiles/ProtectiveProfile'
import Feedback from './Feedback'
import NotificationSettings from './components/NotificationSettings'
import RetreatLanding from './RetreatLanding'
import FlowLibrary from './FlowLibrary'
import LibraryOfAnswers from './pages/LibraryOfAnswers'
import FlowCompassPage from './pages/FlowCompassPage'
import FlowMapMockups from './components/FlowMapMockups'
import PublicValidationFlow from './pages/PublicValidationFlow'
import ValidationFlowsManager from './pages/ValidationFlowsManager'
import AuthGate from './AuthGate'
import { AuthProvider } from './auth/AuthProvider'
import ErrorBoundary from './components/ErrorBoundary'
import BottomToolbar from './components/BottomToolbar'
import WeeklyPlanningFlow from './components/WeeklyPlanningFlow'
import './App.css'
import './PersonaAssessment.css'
import './AttractionOfferFlow.css'
import './UpsellFlow.css'
import './DownsellFlow.css'
import './ContinuityFlow.css'
import './LeadsStrategyFlow.css'
import './LeadMagnetFlow.css'
import './PersonaSelectionFlow.css'
import './MoneyModelGuide.css'
import './Profile.css'
import './Auth.css'
import './HybridEssenceFlow.css'
import './Challenge.css'
import './Feedback.css'
import './RetreatLanding.css'
import './FlowFinder.css'
import './flows/LeadMagnetSelectionFlow.css'
import './flows/ProductSelectionFlow.css'
import './flows/FunnelBuilderFlow.css'
import './components/BottomToolbar.css'
import './components/WeeklyPlanningFlow.css'

function AppRouter() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Homepage - Persona Assessment */}
            <Route path="/" element={<PersonaAssessment />} />
            <Route path="/log-in" element={<PersonaAssessment />} />

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

            {/* Funnel Builder - Stage 5 Campaign */}
            <Route path="/funnel-builder" element={
              <AuthGate>
                <FunnelBuilderFlow />
              </AuthGate>
            } />

            {/* Lead Magnet Type Assessment - In-App Challenge */}
            <Route path="/lead-magnet" element={
              <AuthGate>
                <LeadMagnetFlow />
              </AuthGate>
            } />

            {/* $100M Offer Builder - Product Creation Stage */}
            <Route path="/offer-builder" element={
              <AuthGate>
                <OfferBuilderFlow />
              </AuthGate>
            } />

            {/* Lead Magnet Selection - Follows Offer Builder */}
            <Route path="/lead-magnet-selection" element={
              <AuthGate>
                <LeadMagnetSelectionFlow />
              </AuthGate>
            } />

            {/* Product Selection - Follows Offer Builder */}
            <Route path="/product-selection" element={
              <AuthGate>
                <ProductSelectionFlow />
              </AuthGate>
            } />

            {/* Persona Selection Flow - In-App Challenge */}
            <Route path="/persona-selection" element={
              <AuthGate>
                <PersonaSelectionFlow />
              </AuthGate>
            } />

            {/* Money Model Guide - Educational Overview */}
            <Route path="/money-model-guide" element={<MoneyModelGuide />} />

            {/* FlowMap Style Mockups - For Review */}
            <Route path="/flow-mockups" element={<FlowMapMockups />} />

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
            <Route path="/weekly-planning" element={
              <AuthGate>
                <WeeklyPlanningFlow />
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
            <Route path="/nikigai/skills" element={
              <AuthGate>
                <FlowFinderSkills />
              </AuthGate>
            } />
            <Route path="/nikigai/problems" element={
              <AuthGate>
                <FlowFinderProblems />
              </AuthGate>
            } />
            <Route path="/nikigai/persona" element={
              <AuthGate>
                <FlowFinderPersona />
              </AuthGate>
            } />
            <Route path="/nikigai/integration" element={
              <AuthGate>
                <FlowFinderIntegration />
              </AuthGate>
            } />
            <Route path="/settings/notifications" element={
              <AuthGate>
                <NotificationSettings />
              </AuthGate>
            } />
            <Route path="/library" element={
              <AuthGate>
                <LibraryOfAnswers />
              </AuthGate>
            } />

            {/* Phase 4: Flow Compass */}
            <Route path="/flow-compass" element={
              <AuthGate>
                <FlowCompassPage />
              </AuthGate>
            } />

            {/* Validation Flows Manager */}
            <Route path="/validation-flows" element={
              <AuthGate>
                <ValidationFlowsManager />
              </AuthGate>
            } />
          </Routes>
          <BottomToolbar />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default AppRouter
