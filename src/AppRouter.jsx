import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Static imports - Core infrastructure and frequently accessed pages
import PersonaAssessment from './PersonaAssessment'
import Profile from './Profile'
import Challenge from './Challenge'
import PublicValidationFlow from './pages/PublicValidationFlow'
import AuthGate from './AuthGate'
import { AuthProvider } from './auth/AuthProvider'
import ErrorBoundary from './components/ErrorBoundary'
import BottomToolbar from './components/BottomToolbar'
import { ZarloWidget } from './components/Zarlo'

// Loading component for Suspense fallback
function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      color: '#5e17eb'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
        <div>Loading...</div>
      </div>
    </div>
  )
}

// Lazy-loaded flows - Money Model
const AttractionOfferFlow = lazy(() => import('./flows/AttractionOfferFlow'))
const UpsellFlow = lazy(() => import('./flows/UpsellFlow'))
const DownsellFlow = lazy(() => import('./flows/DownsellFlow'))
const ContinuityFlow = lazy(() => import('./flows/ContinuityFlow'))
const LeadsStrategyFlow = lazy(() => import('./flows/LeadsStrategyFlow'))
const OfferBuilderFlow = lazy(() => import('./flows/OfferBuilderFlow'))
const LeadMagnetSelectionFlow = lazy(() => import('./flows/LeadMagnetSelectionFlow'))
const ProductSelectionFlow = lazy(() => import('./flows/ProductSelectionFlow'))
const FunnelBuilderFlow = lazy(() => import('./flows/FunnelBuilderFlow'))
const FunnelCalculator = lazy(() => import('./flows/FunnelCalculator'))
const OfferBuilder100M = lazy(() => import('./flows/OfferBuilder100M'))
const PersonaSelectionFlow = lazy(() => import('./flows/PersonaSelectionFlow'))

// Lazy-loaded flows - FlowFinder
const FlowFinderSkills = lazy(() => import('./flows/FlowFinderSkills'))
const FlowFinderProblems = lazy(() => import('./flows/FlowFinderProblems'))
const FlowFinderPersona = lazy(() => import('./flows/FlowFinderPersona'))
const FlowFinderIntegration = lazy(() => import('./flows/FlowFinderIntegration'))

// Lazy-loaded flows - Healing & Nervous System
const HealingCompass = lazy(() => import('./flows/HealingCompass'))
const NervousSystemFlow = lazy(() => import('./flows/NervousSystemFlow'))

// Lazy-loaded flows - Public Lead Magnets (no auth required)
const PublicMoneyModelFlow = lazy(() => import('./flows/PublicMoneyModelFlow'))
const PublicNervousSystemFlow = lazy(() => import('./flows/PublicNervousSystemFlow'))

// Lazy-loaded flows - Setup & Training
const BusinessBaselineFlow = lazy(() => import('./flows/BusinessBaselineFlow'))
const CustomerSegmentsFlow = lazy(() => import('./flows/CustomerSegmentsFlow'))
const CompetitorSnapshotFlow = lazy(() => import('./flows/CompetitorSnapshotFlow'))
const VoiceTraining = lazy(() => import('./flows/VoiceTraining'))

// Lazy-loaded pages - CRM
const Dashboard = lazy(() => import('./pages/crm/Dashboard'))
const Marketing = lazy(() => import('./pages/crm/Marketing'))
const Sales = lazy(() => import('./pages/crm/Sales'))
const Analytics = lazy(() => import('./pages/crm/Analytics'))
const ContentHistory = lazy(() => import('./pages/crm/ContentHistory'))
const ContentQueue = lazy(() => import('./pages/crm/ContentQueue'))
const PerformanceDashboard = lazy(() => import('./pages/crm/PerformanceDashboard'))
const ImplementationTracker = lazy(() => import('./pages/crm/ImplementationTracker'))
const GeneratedAssetsLibrary = lazy(() => import('./pages/crm/GeneratedAssetsLibrary'))
const AutonomousSetup = lazy(() => import('./pages/crm/AutonomousSetup'))
const PTUFCalculator = lazy(() => import('./pages/crm/PTUFCalculator'))
const LTVCalculator = lazy(() => import('./pages/crm/LTVCalculator'))
const CACTracker = lazy(() => import('./pages/crm/CACTracker'))
const SalesScripts = lazy(() => import('./pages/crm/SalesScripts'))
const SmartAlerts = lazy(() => import('./pages/crm/SmartAlerts'))
const ContentCreate = lazy(() => import('./pages/crm/ContentCreate'))
const AscensionEngine = lazy(() => import('./pages/crm/AscensionEngine'))
const ObjectionPatterns = lazy(() => import('./pages/crm/ObjectionPatterns'))

// Lazy-loaded pages - Other
const MoneyModelGuide = lazy(() => import('./MoneyModelGuide'))
const ArchetypeSelection = lazy(() => import('./ArchetypeSelection'))
const EssenceProfile = lazy(() => import('./profiles/EssenceProfile'))
const ProtectiveProfile = lazy(() => import('./profiles/ProtectiveProfile'))
const Feedback = lazy(() => import('./Feedback'))
const NotificationSettings = lazy(() => import('./components/NotificationSettings'))
const LibraryOfAnswers = lazy(() => import('./pages/LibraryOfAnswers'))
const FlowReportCard = lazy(() => import('./pages/FlowReportCard'))
const FlowCompassPage = lazy(() => import('./pages/FlowCompassPage'))
const FlowMapMockups = lazy(() => import('./components/FlowMapMockups'))
const ValidationFlowsManager = lazy(() => import('./pages/ValidationFlowsManager'))
const WheelDemo = lazy(() => import('./pages/WheelDemo'))
const WeeklyPlanningFlow = lazy(() => import('./components/WeeklyPlanningFlow'))
import './App.css'
import './PersonaAssessment.css'
import './flows/AttractionOfferFlow.css'
import './flows/UpsellFlow.css'
import './flows/DownsellFlow.css'
import './flows/ContinuityFlow.css'
import './flows/LeadsStrategyFlow.css'
import './flows/PersonaSelectionFlow.css'
import './MoneyModelGuide.css'
import './Profile.css'
import './Auth.css'
import './HybridEssenceFlow.css'
import './Challenge.css'
import './Feedback.css'
import './flows/FlowFinder.css'
import './flows/LeadMagnetSelectionFlow.css'
import './flows/ProductSelectionFlow.css'
import './flows/FunnelBuilderFlow.css'
import './flows/FunnelCalculator.css'
import './flows/BusinessBaselineFlow.css'
import './flows/CustomerSegmentsFlow.css'
import './flows/CompetitorSnapshotFlow.css'
import './pages/crm/AutonomousSetup.css'
import './pages/crm/AscensionEngine.css'
import './pages/crm/ObjectionPatterns.css'
import './components/BottomToolbar.css'
import './components/WeeklyPlanningFlow.css'

function AppRouter() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
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

            {/* $100M Offer Builder - Product Creation Stage */}
            <Route path="/offer-builder" element={
              <AuthGate>
                <OfferBuilderFlow />
              </AuthGate>
            } />

            {/* $100M Offer Builder v2 - 8-Step Flow with 3 Parallel Versions */}
            <Route path="/offer-builder-v2" element={
              <AuthGate>
                <OfferBuilder100M />
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
            <Route path="/wheel-demo" element={<WheelDemo />} />

            {/* Public Validation Flow - No Auth Required */}
            <Route path="/v/:shareToken" element={<PublicValidationFlow />} />

            {/* Public Lead Magnet Flows - No Auth Required */}
            <Route path="/try/offer/:flowType" element={<PublicMoneyModelFlow />} />
            <Route path="/try/nervous-system" element={<PublicNervousSystemFlow />} />

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
            <Route path="/report-card" element={
              <AuthGate>
                <FlowReportCard />
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

            {/* Funnel Calculator - Stage 7 Tracking */}
            <Route path="/funnel-calculator" element={
              <AuthGate>
                <FunnelCalculator />
              </AuthGate>
            } />

            {/* CRM Tower - Command Center */}
            <Route path="/crm" element={
              <AuthGate>
                <Dashboard />
              </AuthGate>
            } />
            <Route path="/crm/marketing" element={
              <AuthGate>
                <Marketing />
              </AuthGate>
            } />
            <Route path="/crm/sales" element={
              <AuthGate>
                <Sales />
              </AuthGate>
            } />
            <Route path="/crm/analytics" element={
              <AuthGate>
                <Analytics />
              </AuthGate>
            } />
            <Route path="/crm/content-history" element={
              <AuthGate>
                <ContentHistory />
              </AuthGate>
            } />
            <Route path="/crm/content-queue" element={
              <AuthGate>
                <ContentQueue />
              </AuthGate>
            } />
            <Route path="/crm/performance" element={
              <AuthGate>
                <PerformanceDashboard />
              </AuthGate>
            } />

            {/* Hormozi Features */}
            <Route path="/crm/ptuf" element={
              <AuthGate>
                <PTUFCalculator />
              </AuthGate>
            } />
            <Route path="/crm/ltv" element={
              <AuthGate>
                <LTVCalculator />
              </AuthGate>
            } />
            <Route path="/crm/cac" element={
              <AuthGate>
                <CACTracker />
              </AuthGate>
            } />
            <Route path="/crm/scripts" element={
              <AuthGate>
                <SalesScripts />
              </AuthGate>
            } />
            <Route path="/crm/alerts" element={
              <AuthGate>
                <SmartAlerts />
              </AuthGate>
            } />
            <Route path="/crm/content-create" element={
              <AuthGate>
                <ContentCreate />
              </AuthGate>
            } />
            <Route path="/crm/implementations" element={
              <AuthGate>
                <ImplementationTracker />
              </AuthGate>
            } />
            <Route path="/crm/assets" element={
              <AuthGate>
                <GeneratedAssetsLibrary />
              </AuthGate>
            } />

            {/* Autonomous Setup - Tier 4 Data Collection */}
            <Route path="/crm/setup" element={
              <AuthGate>
                <AutonomousSetup />
              </AuthGate>
            } />
            <Route path="/crm/setup/business-baseline" element={
              <AuthGate>
                <BusinessBaselineFlow />
              </AuthGate>
            } />
            <Route path="/crm/setup/customer-segments" element={
              <AuthGate>
                <CustomerSegmentsFlow />
              </AuthGate>
            } />
            <Route path="/crm/setup/competitor-snapshot" element={
              <AuthGate>
                <CompetitorSnapshotFlow />
              </AuthGate>
            } />

            {/* Voice Training Studio */}
            <Route path="/voice-training" element={
              <AuthGate>
                <VoiceTraining />
              </AuthGate>
            } />

            {/* Ascension Engine & Retention */}
            <Route path="/crm/ascension" element={
              <AuthGate>
                <AscensionEngine />
              </AuthGate>
            } />
            <Route path="/crm/objections" element={
              <AuthGate>
                <ObjectionPatterns />
              </AuthGate>
            } />
            </Routes>
          </Suspense>
          <BottomToolbar />
          <ZarloWidget />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default AppRouter
