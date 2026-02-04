import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'

// Static imports - Core infrastructure and frequently accessed pages
import LandingPage from './pages/LandingPage'
import PersonaAssessment from './PersonaAssessment'
import Profile from './Profile'
import Challenge from './Challenge'
import PublicValidationFlow from './pages/PublicValidationFlow'
import AuthGate from './AuthGate'
import { AuthProvider } from './auth/AuthProvider'
import ErrorBoundary from './components/ErrorBoundary'
import BottomToolbar from './components/BottomToolbar'
import { ZarloWidget } from './components/Zarlo'
import { OnboardingProvider } from './context/OnboardingContext'
import { CRMLayout } from './components/crm'

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
const IncomeCalculator = lazy(() => import('./flows/IncomeCalculator'))
const FunnelBaselineFlow = lazy(() => import('./flows/FunnelBaselineFlow'))
const MVPReadinessFlow = lazy(() => import('./flows/MVPReadinessFlow'))
const FeedbackAnalysisFlow = lazy(() => import('./flows/FeedbackAnalysisFlow'))
const OfferChecklist = lazy(() => import('./pages/OfferChecklist'))
const GrandSlamOfferFlow = lazy(() => import('./flows/GrandSlamOfferFlow'))
const OfferStackBuilderFlow = lazy(() => import('./flows/OfferStackBuilderFlow'))
const GrandSlamMatrix = lazy(() => import('./flows/GrandSlamMatrix'))
const PersonaSelectionFlow = lazy(() => import('./flows/PersonaSelectionFlow'))
const LaunchReadinessFlow = lazy(() => import('./flows/LaunchReadinessFlow'))

// Lazy-loaded flows - FlowFinder
const FlowFinderSkills = lazy(() => import('./flows/FlowFinderSkills'))
const FlowFinderProblems = lazy(() => import('./flows/FlowFinderProblems'))
const FlowFinderPersona = lazy(() => import('./flows/FlowFinderPersona'))
const FlowFinderIntegration = lazy(() => import('./flows/FlowFinderIntegration'))
const MindSpace = lazy(() => import('./flows/MindSpace'))
const PlayListFinderFlow = lazy(() => import('./flows/PlayListFinderFlow'))
const PersonaIdentifierFlow = lazy(() => import('./flows/PersonaIdentifierFlow'))
const FlowFinderExplainer = lazy(() => import('./flows/FlowFinderExplainer'))

// Lazy-loaded flows - Healing & Nervous System
const HealingCompass = lazy(() => import('./flows/HealingCompass'))
const NervousSystemFlow = lazy(() => import('./flows/NervousSystemFlow'))

// Lazy-loaded flows - Public Lead Magnets (no auth required)
const PublicMoneyModelFlow = lazy(() => import('./flows/PublicMoneyModelFlow'))
const PublicNervousSystemFlow = lazy(() => import('./flows/PublicNervousSystemFlow'))
const PublicOfferAuditFlow = lazy(() => import('./flows/PublicOfferAuditFlow'))
const CareerClarityQuiz = lazy(() => import('./flows/CareerClarityQuiz'))

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
const Reports = lazy(() => import('./pages/crm/Reports'))
const Calculators = lazy(() => import('./pages/crm/Calculators'))
const Execute = lazy(() => import('./pages/crm/Execute'))
const Attract = lazy(() => import('./pages/crm/Attract'))
const Nurture = lazy(() => import('./pages/crm/Nurture'))
const Tools = lazy(() => import('./pages/crm/Tools'))
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
const Pages = lazy(() => import('./pages/crm/Pages'))
const Contacts = lazy(() => import('./pages/crm/Contacts'))
const EmailSequences = lazy(() => import('./pages/crm/EmailSequences'))
const WarmOutreach = lazy(() => import('./pages/crm/WarmOutreach'))

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
const VoiceOfCustomerPage = lazy(() => import('./pages/VoiceOfCustomerPage'))
const WheelDemo = lazy(() => import('./pages/WheelDemo'))
const WeeklyPlanningFlow = lazy(() => import('./components/WeeklyPlanningFlow'))
const GroanMatrix = lazy(() => import('./components/GroanMatrix'))
const HeroCommandCenter = lazy(() => import('./components/HeroProfile/HeroCommandCenter'))
const BrandToneDemo = lazy(() => import('./pages/BrandToneDemo'))
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
// HybridEssenceFlow.css removed - component is archived, was causing style leaks
import './Challenge.css'
import './Feedback.css'
import './flows/FlowFinder.css'
import './flows/LeadMagnetSelectionFlow.css'
import './flows/ProductSelectionFlow.css'
import './flows/FunnelBuilderFlow.css'
import './flows/FunnelCalculator.css'
import './flows/FunnelBaselineFlow.css'
import './flows/MVPReadinessFlow.css'
import './flows/FeedbackAnalysisFlow.css'
import './flows/GrandSlamOfferFlow.css'
import './flows/OfferStackBuilderFlow.css'
import './flows/LaunchReadinessFlow.css'
import './flows/BusinessBaselineFlow.css'
import './flows/CustomerSegmentsFlow.css'
import './flows/CompetitorSnapshotFlow.css'
import './pages/crm/AutonomousSetup.css'
import './pages/crm/AscensionEngine.css'
import './pages/crm/ObjectionPatterns.css'
import './pages/crm/Contacts.css'
import './pages/crm/EmailSequences.css'
import './pages/crm/WarmOutreach.css'
import './pages/crm/Execute.css'
import './pages/crm/Attract.css'
import './pages/crm/Nurture.css'
import './pages/crm/Tools.css'
import './pages/crm/Reports.css'
import './pages/crm/Calculators.css'
import './pages/BrandToneDemo.css'
import './pages/VoiceOfCustomerPage.css'
import './components/BottomToolbar.css'
import './components/WeeklyPlanningFlow.css'
import './components/GroanMatrix.css'
import './components/HeroProfile/HeroProfile.css'
import './pages/LandingPage.css'
import './flows/CareerClarityQuiz.css'
import './flows/MindSpace.css'
import './flows/PlayListFinderFlow.css'
import './flows/PersonaIdentifierFlow.css'

// Conditionally render widgets (hide on some public routes)
function ConditionalZarlo() {
  const location = useLocation()
  // Hide Zarlo on /try/ routes, landing page, and career clarity quiz
  const isTryRoute = location.pathname.startsWith('/try/')
  const isLandingPage = location.pathname === '/'
  const isCareerClarity = location.pathname === '/career-clarity'

  if (isTryRoute || isLandingPage || isCareerClarity) return null
  return <ZarloWidget />
}

function ConditionalBottomToolbar() {
  const location = useLocation()
  const isPublicRoute = location.pathname.startsWith('/v/') ||
                        location.pathname.startsWith('/try/') ||
                        location.pathname === '/' ||
                        location.pathname === '/career-clarity' ||
                        location.pathname === '/launch-readiness' ||
                        location.pathname === '/funnel-baseline' ||
                        location.pathname === '/income-calculator' ||
                        location.pathname === '/mind-space' ||
                        location.pathname === '/play-list-finder' ||
                        location.pathname === '/persona-identifier'

  if (isPublicRoute) return null
  return <BottomToolbar />
}

function AppRouter() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <OnboardingProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Landing Page - Public */}
              <Route path="/" element={<LandingPage />} />

              {/* Signup/Onboarding */}
              <Route path="/get-started" element={<PersonaAssessment />} />
              <Route path="/log-in" element={<PersonaAssessment />} />

              {/* Career Clarity Quiz - Public */}
              <Route path="/career-clarity" element={<CareerClarityQuiz />} />

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

            {/* Funnel Builder - Stage 6 Campaign */}
            <Route path="/funnel-builder" element={
              <AuthGate>
                <FunnelBuilderFlow />
              </AuthGate>
            } />

            {/* Launch Readiness Check - Stage 6 Campaign */}
            <Route path="/launch-readiness" element={
              <AuthGate>
                <LaunchReadinessFlow />
              </AuthGate>
            } />

            {/* $100M Offer Builder - Product Creation Stage */}
            <Route path="/offer-builder" element={
              <AuthGate>
                <OfferBuilderFlow />
              </AuthGate>
            } />

            {/* Grand Slam Offer - Evaluation Flow (Proof, Speed, Ease, Obstacles, Score) */}
            <Route path="/offer-builder-v2" element={
              <AuthGate>
                <GrandSlamOfferFlow />
              </AuthGate>
            } />

            {/* Offer Stack Builder - Packaging Flow (Lead Magnet, Bonuses, Guarantee, Scarcity, Naming) */}
            <Route path="/offer-stack-builder" element={
              <AuthGate>
                <OfferStackBuilderFlow />
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

            {/* MVP Readiness - Stage 3 Testing */}
            <Route path="/mvp-readiness" element={
              <AuthGate>
                <MVPReadinessFlow />
              </AuthGate>
            } />

            {/* Feedback Analysis - Stage 3 Testing */}
            <Route path="/feedback-analysis" element={
              <AuthGate>
                <FeedbackAnalysisFlow />
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
            <Route path="/brand-tone-demo" element={<BrandToneDemo />} />

            {/* Public Validation Flow - No Auth Required */}
            <Route path="/v/:shareToken" element={<PublicValidationFlow />} />

            {/* Public Lead Magnet Flows - No Auth Required */}
            <Route path="/try/offer/:flowType" element={<PublicMoneyModelFlow />} />
            <Route path="/try/nervous-system" element={<PublicNervousSystemFlow />} />
            <Route path="/try/flow-audit" element={<PublicOfferAuditFlow />} />

            <Route path="/me" element={
              <AuthGate>
                <Profile />
              </AuthGate>
            } />

            {/* Hero Profile Dashboard */}
            <Route path="/hero-profile" element={
              <AuthGate>
                <HeroCommandCenter />
              </AuthGate>
            } />
            <Route path="/hero-profile/:projectId" element={
              <AuthGate>
                <HeroCommandCenter />
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
            <Route path="/groan-matrix" element={
              <AuthGate>
                <GroanMatrix />
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
            <Route path="/mind-space" element={
              <AuthGate>
                <MindSpace />
              </AuthGate>
            } />
            <Route path="/play-list-finder" element={
              <AuthGate>
                <PlayListFinderFlow />
              </AuthGate>
            } />
            <Route path="/persona-identifier" element={
              <AuthGate>
                <PersonaIdentifierFlow />
              </AuthGate>
            } />
            <Route path="/flow-finder-explainer" element={
              <AuthGate>
                <FlowFinderExplainer />
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

            {/* Offer Checklist */}
            <Route path="/offer-checklist/:category" element={
              <AuthGate>
                <Suspense fallback={<LoadingSpinner />}>
                  <OfferChecklist />
                </Suspense>
              </AuthGate>
            } />

            {/* Voice of Customer Database */}
            <Route path="/voice-of-customer" element={
              <AuthGate>
                <VoiceOfCustomerPage />
              </AuthGate>
            } />

            {/* Income Calculator - Public & Logged-in */}
            <Route path="/income-calculator" element={
              <IncomeCalculator />
            } />

            {/* Funnel Calculator - Stage 8 Tracking */}
            <Route path="/funnel-calculator" element={
              <AuthGate>
                <FunnelCalculator />
              </AuthGate>
            } />

            {/* Funnel Baseline - Weekly Tracking Quest */}
            <Route path="/funnel-baseline" element={
              <AuthGate>
                <FunnelBaselineFlow />
              </AuthGate>
            } />

            {/* Grand Slam Matrix - Solution to Tier Assignment */}
            <Route path="/grand-slam-matrix" element={
              <AuthGate>
                <GrandSlamMatrix />
              </AuthGate>
            } />

            {/* CRM Tower - Command Center */}
            <Route path="/crm" element={
              <AuthGate>
                <CRMLayout><Dashboard /></CRMLayout>
              </AuthGate>
            } />
            <Route path="/crm/marketing" element={
              <AuthGate>
                <CRMLayout><Marketing /></CRMLayout>
              </AuthGate>
            } />
            <Route path="/crm/sales" element={
              <AuthGate>
                <CRMLayout><Sales /></CRMLayout>
              </AuthGate>
            } />
            {/* Reports - Replaces Analytics with enhanced features */}
            <Route path="/crm/reports" element={
              <AuthGate>
                <CRMLayout><Reports /></CRMLayout>
              </AuthGate>
            } />
            {/* Redirect old analytics route to reports */}
            <Route path="/crm/analytics" element={<Navigate to="/crm/reports" replace />} />
            <Route path="/crm/execute" element={
              <AuthGate>
                <CRMLayout><Execute /></CRMLayout>
              </AuthGate>
            } />

            {/* CRM Tower Landing Pages */}
            <Route path="/crm/attract" element={
              <AuthGate>
                <CRMLayout><Attract /></CRMLayout>
              </AuthGate>
            } />
            <Route path="/crm/pages" element={
              <AuthGate>
                <CRMLayout><Pages /></CRMLayout>
              </AuthGate>
            } />
            <Route path="/crm/nurture" element={
              <AuthGate>
                <CRMLayout><Nurture /></CRMLayout>
              </AuthGate>
            } />
            <Route path="/crm/contacts" element={
              <AuthGate>
                <CRMLayout><Contacts /></CRMLayout>
              </AuthGate>
            } />
            <Route path="/crm/email-sequences" element={
              <AuthGate>
                <CRMLayout><EmailSequences /></CRMLayout>
              </AuthGate>
            } />
            <Route path="/crm/warm-outreach" element={
              <AuthGate>
                <CRMLayout><WarmOutreach /></CRMLayout>
              </AuthGate>
            } />
            <Route path="/crm/tools" element={
              <AuthGate>
                <CRMLayout><Tools /></CRMLayout>
              </AuthGate>
            } />
            <Route path="/crm/tools/calculators" element={
              <AuthGate>
                <CRMLayout><Calculators /></CRMLayout>
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
          <ConditionalBottomToolbar />
          <ConditionalZarlo />
        </Router>
        </OnboardingProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default AppRouter
