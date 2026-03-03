import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigationType } from 'react-router-dom'

// Retry wrapper for lazy imports — handles stale chunks after deploys
// When Vite rebuilds, old chunk hashes are invalidated. A full page reload
// fetches the new index.html with correct chunk references.
function lazyRetry(importFn) {
  return lazy(() =>
    importFn().catch((error) => {
      // Check if we already tried reloading for this deploy
      const reloadedKey = 'chunk_reload_' + window.location.pathname
      const alreadyReloaded = sessionStorage.getItem(reloadedKey)

      if (!alreadyReloaded) {
        // Mark that we're reloading so we don't loop
        sessionStorage.setItem(reloadedKey, '1')
        // Full reload fetches new index.html with correct chunk hashes
        window.location.reload()
        // Return a never-resolving promise to prevent rendering during reload
        return new Promise(() => {})
      }

      // Already reloaded once — clear the flag and let the error bubble
      // so the ErrorBoundary can show the fallback UI
      sessionStorage.removeItem(reloadedKey)
      throw error
    })
  )
}

// Static imports - Core infrastructure
import LandingPage from './pages/LandingPage'
import PersonaAssessment from './PersonaAssessment'
import PublicValidationFlow from './pages/PublicValidationFlow'

// Lazy-load heavy pages — preloaded after initial render (see useEffect below)
const MePage = lazyRetry(() => import('./pages/MePage'))
const Challenge = lazyRetry(() => import('./Challenge'))

import { preloadMePage, preloadChallenge, preloadFlowCompass, preloadProfileHub } from './lib/preloadRoutes'
import AuthGate from './AuthGate'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import LocationAwareErrorBoundary, { ErrorBoundary } from './components/ErrorBoundary'
import BottomToolbar from './components/BottomToolbar'
import { ZarloWidget } from './components/Zarlo'
import { OnboardingProvider } from './context/OnboardingContext'
import { CRMLayout } from './components/crm'
import { initVibeColor } from './hooks/useVibeColor'

// Initialize vibe color before first render (restores saved preference)
initVibeColor()

// Scroll to top on route changes (PUSH/REPLACE only, not browser back/forward)
function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  React.useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0)
    }
  }, [pathname, navigationType])

  return null
}


// Preload core pages after initial render so they're ready when user navigates.
// All 4 bottom toolbar routes are preloaded so navigate() works instantly.
function PreloadCoreRoutes() {
  React.useEffect(() => {
    const preload = () => {
      preloadMePage()
      preloadChallenge()
      preloadFlowCompass()
      preloadProfileHub()
    }
    const id = typeof requestIdleCallback === 'function'
      ? requestIdleCallback(preload)
      : setTimeout(preload, 2000)
    return () => {
      typeof cancelIdleCallback === 'function'
        ? cancelIdleCallback(id)
        : clearTimeout(id)
    }
  }, [])
  return null
}

// Branded loading spinner (purple→gold ring, delayed fade-in)
function LoadingSpinner() {
  return (
    <div className="app-loading-spinner">
      <div className="app-spinner-ring" />
    </div>
  )
}

// Lazy-loaded flows - Money Model
const AttractionOfferFlow = lazyRetry(() => import('./flows/AttractionOfferFlow'))
const UpsellFlow = lazyRetry(() => import('./flows/UpsellFlow'))
const DownsellFlow = lazyRetry(() => import('./flows/DownsellFlow'))
const ContinuityFlow = lazyRetry(() => import('./flows/ContinuityFlow'))
const LeadsStrategyFlow = lazyRetry(() => import('./flows/LeadsStrategyFlow'))
const OfferBuilderFlow = lazyRetry(() => import('./flows/OfferBuilderFlow'))
const LeadMagnetSelectionFlow = lazyRetry(() => import('./flows/LeadMagnetSelectionFlow'))
const ProductSelectionFlow = lazyRetry(() => import('./flows/ProductSelectionFlow'))
const FunnelBuilderFlow = lazyRetry(() => import('./flows/FunnelBuilderFlow'))
const FunnelCalculator = lazyRetry(() => import('./flows/FunnelCalculator'))
const IncomeCalculator = lazyRetry(() => import('./flows/IncomeCalculator'))
const FunnelBaselineFlow = lazyRetry(() => import('./flows/FunnelBaselineFlow'))
const MVPReadinessFlow = lazyRetry(() => import('./flows/MVPReadinessFlow'))
const FeedbackAnalysisFlow = lazyRetry(() => import('./flows/FeedbackAnalysisFlow'))
const OfferChecklist = lazyRetry(() => import('./pages/OfferChecklist'))
const GrandSlamOfferFlow = lazyRetry(() => import('./flows/GrandSlamOfferFlow'))
const OfferStackBuilderFlow = lazyRetry(() => import('./flows/OfferStackBuilderFlow'))
const GrandSlamMatrix = lazyRetry(() => import('./flows/GrandSlamMatrix'))
const ProductSuiteMapFlow = lazyRetry(() => import('./flows/ProductSuiteMapFlow'))
const PersonaSelectionFlow = lazyRetry(() => import('./flows/PersonaSelectionFlow'))
const LaunchReadinessFlow = lazyRetry(() => import('./flows/LaunchReadinessFlow'))

// Lazy-loaded flows - FlowFinder
const FlowFinderSkills = lazyRetry(() => import('./flows/FlowFinderSkills'))
const FlowFinderProblems = lazyRetry(() => import('./flows/FlowFinderProblems'))
const FlowFinderPersona = lazyRetry(() => import('./flows/FlowFinderPersona'))
const FlowFinderIntegration = lazyRetry(() => import('./flows/FlowFinderIntegration'))
const MindSpace = lazyRetry(() => import('./flows/MindSpace'))
const PlayListFinderFlow = lazyRetry(() => import('./flows/PlayListFinderFlow'))
const PersonaIdentifierFlow = lazyRetry(() => import('./flows/PersonaIdentifierFlow'))
const FlowFinderExplainer = lazyRetry(() => import('./flows/FlowFinderExplainer'))
const PlayListExplainer = lazyRetry(() => import('./flows/PlayListExplainer'))
const ValidationExplainer = lazyRetry(() => import('./flows/ValidationExplainer'))
const ProductExplainer = lazyRetry(() => import('./flows/ProductExplainer'))
const TestingExplainer = lazyRetry(() => import('./flows/TestingExplainer'))
const OfferCreationExplainer = lazyRetry(() => import('./flows/OfferCreationExplainer'))
const CampaignExplainer = lazyRetry(() => import('./flows/CampaignExplainer'))
const LaunchExplainer = lazyRetry(() => import('./flows/LaunchExplainer'))
const WhatIsHealingExplainer = lazyRetry(() => import('./flows/WhatIsHealingExplainer'))
const HowDoWeHealExplainer = lazyRetry(() => import('./flows/HowDoWeHealExplainer'))
const EmotionalSplinterExplainer = lazyRetry(() => import('./flows/EmotionalSplinterExplainer'))
const LetsPlayFlow = lazyRetry(() => import('./flows/LetsPlayFlow'))
const LetsPlayReviewFlow = lazyRetry(() => import('./flows/LetsPlayReviewFlow'))
const SelfTestFlow = lazyRetry(() => import('./flows/SelfTestFlow'))
const SelfTestReviewFlow = lazyRetry(() => import('./flows/SelfTestReviewFlow'))
const PlayProfileFlow = lazyRetry(() => import('./flows/PlayProfileFlow'))

// Lazy-loaded flows - Healing & Nervous System
const HealingCompass = lazyRetry(() => import('./flows/HealingCompass'))
const LimitingBeliefRewire = lazyRetry(() => import('./flows/LimitingBeliefRewire'))
const ShadowWorkFlow = lazyRetry(() => import('./flows/ShadowWorkFlow'))
const NervousSystemFlow = lazyRetry(() => import('./flows/NervousSystemFlow'))

// Lazy-loaded flows - Public Lead Magnets (no auth required)
const PublicMoneyModelFlow = lazyRetry(() => import('./flows/PublicMoneyModelFlow'))
const PublicNervousSystemFlow = lazyRetry(() => import('./flows/PublicNervousSystemFlow'))
const PublicOfferAuditFlow = lazyRetry(() => import('./flows/PublicOfferAuditFlow'))
const CareerClarityQuiz = lazyRetry(() => import('./flows/CareerClarityQuiz'))
const EarthquakeQuiz = lazyRetry(() => import('./flows/EarthquakeQuiz'))
const TryPlayProfile = lazyRetry(() => import('./flows/TryPlayProfile'))
const OldLandingPage = lazyRetry(() => import('./pages/OldLandingPage'))
const FantasyLeagueLanding = lazyRetry(() => import('./pages/FantasyLeagueLanding'))
const HealingCompassLanding = lazyRetry(() => import('./pages/HealingCompassLanding'))
const WhyICreatedThis = lazyRetry(() => import('./pages/WhyICreatedThis'))

// Lazy-loaded flows - Setup & Training
const BusinessBaselineFlow = lazyRetry(() => import('./flows/BusinessBaselineFlow'))
const CustomerSegmentsFlow = lazyRetry(() => import('./flows/CustomerSegmentsFlow'))
const CompetitorSnapshotFlow = lazyRetry(() => import('./flows/CompetitorSnapshotFlow'))
const VoiceTraining = lazyRetry(() => import('./flows/VoiceTraining'))

// Lazy-loaded pages - CRM
const Dashboard = lazyRetry(() => import('./pages/crm/Dashboard'))
const Marketing = lazyRetry(() => import('./pages/crm/Marketing'))
const Sales = lazyRetry(() => import('./pages/crm/Sales'))
const Analytics = lazyRetry(() => import('./pages/crm/Analytics'))
const Reports = lazyRetry(() => import('./pages/crm/Reports'))
const Calculators = lazyRetry(() => import('./pages/crm/Calculators'))
const Execute = lazyRetry(() => import('./pages/crm/Execute'))
const Attract = lazyRetry(() => import('./pages/crm/Attract'))
const Nurture = lazyRetry(() => import('./pages/crm/Nurture'))
const Tools = lazyRetry(() => import('./pages/crm/Tools'))
const ContentHistory = lazyRetry(() => import('./pages/crm/ContentHistory'))
const ContentQueue = lazyRetry(() => import('./pages/crm/ContentQueue'))
const PerformanceDashboard = lazyRetry(() => import('./pages/crm/PerformanceDashboard'))
const ImplementationTracker = lazyRetry(() => import('./pages/crm/ImplementationTracker'))
const GeneratedAssetsLibrary = lazyRetry(() => import('./pages/crm/GeneratedAssetsLibrary'))
const AutonomousSetup = lazyRetry(() => import('./pages/crm/AutonomousSetup'))
const PTUFCalculator = lazyRetry(() => import('./pages/crm/PTUFCalculator'))
const LTVCalculator = lazyRetry(() => import('./pages/crm/LTVCalculator'))
const CACTracker = lazyRetry(() => import('./pages/crm/CACTracker'))
const SalesScripts = lazyRetry(() => import('./pages/crm/SalesScripts'))
const SmartAlerts = lazyRetry(() => import('./pages/crm/SmartAlerts'))
const ContentCreate = lazyRetry(() => import('./pages/crm/ContentCreate'))
const AscensionEngine = lazyRetry(() => import('./pages/crm/AscensionEngine'))
const ObjectionPatterns = lazyRetry(() => import('./pages/crm/ObjectionPatterns'))
const Pages = lazyRetry(() => import('./pages/crm/Pages'))
const Contacts = lazyRetry(() => import('./pages/crm/Contacts'))
const EmailSequences = lazyRetry(() => import('./pages/crm/EmailSequences'))
const WarmOutreach = lazyRetry(() => import('./pages/crm/WarmOutreach'))
const BusinessSystems = lazyRetry(() => import('./pages/crm/BusinessSystems'))
const DataImport = lazyRetry(() => import('./pages/crm/DataImport'))
const SalesPlaybook = lazyRetry(() => import('./pages/crm/SalesPlaybook'))
const Expenses = lazyRetry(() => import('./pages/crm/Expenses'))

// Lazy-loaded pages - Other
const MoneyModelGuide = lazyRetry(() => import('./MoneyModelGuide'))
const ArchetypeSelection = lazyRetry(() => import('./ArchetypeSelection'))
const EssenceProfile = lazyRetry(() => import('./profiles/EssenceProfile'))
const Feedback = lazyRetry(() => import('./Feedback'))
const NotificationSettings = lazyRetry(() => import('./components/NotificationSettings'))
const LibraryOfAnswers = lazyRetry(() => import('./pages/LibraryOfAnswers'))
const FlowReportCard = lazyRetry(() => import('./pages/FlowReportCard'))
const FlowCompassPage = lazyRetry(() => import('./pages/FlowCompassPage'))
const BusinessPage = lazyRetry(() => import('./pages/BusinessPage'))
const FlowMapMockups = lazyRetry(() => import('./components/FlowMapMockups'))
const ValidationFlowsManager = lazyRetry(() => import('./pages/ValidationFlowsManager'))
const VoiceOfCustomerPage = lazyRetry(() => import('./pages/VoiceOfCustomerPage'))
const WheelDemo = lazyRetry(() => import('./pages/WheelDemo'))
const WeeklyPlanningFlow = lazyRetry(() => import('./components/WeeklyPlanningFlow'))
const GroanMatrix = lazyRetry(() => import('./components/GroanMatrix'))
const HeroCommandCenter = lazyRetry(() => import('./components/HeroProfile/HeroCommandCenter'))
const Codex = lazyRetry(() => import('./pages/Codex'))
const CodexEntry = lazyRetry(() => import('./pages/CodexEntry'))
const ProfileHub = lazyRetry(() => import('./pages/ProfileHub'))
const UserSettings = lazyRetry(() => import('./pages/UserSettings'))
const AgentAccess = lazyRetry(() => import('./pages/AgentAccess'))
const BrandToneDemo = lazyRetry(() => import('./pages/BrandToneDemo'))
const AdminDashboard = lazyRetry(() => import('./pages/AdminDashboard'))
const ContentReview = lazyRetry(() => import('./pages/ContentReview'))

// Lazy-loaded pages - Fantasy League
const LeagueOverview = lazyRetry(() => import('./pages/league/LeagueOverview'))
const WeekMatchups = lazyRetry(() => import('./pages/league/WeekMatchups'))
const MatchupDetails = lazyRetry(() => import('./pages/league/MatchupDetails'))
const ContentSubmit = lazyRetry(() => import('./pages/league/ContentSubmit'))
const LeagueAdmin = lazyRetry(() => import('./pages/league/LeagueAdmin'))
const NewsfeedPage = lazyRetry(() => import('./pages/league/NewsfeedPage'))
const LeagueGuide = lazyRetry(() => import('./flows/LeagueGuide'))

import './App.css'
import './PersonaAssessment.css'
import './flows/AttractionOfferFlow.css'
import './flows/UpsellFlow.css'
import './flows/DownsellFlow.css'
import './flows/ContinuityFlow.css'
import './flows/LeadsStrategyFlow.css'
import './flows/PersonaSelectionFlow.css'
import './MoneyModelGuide.css'
import './flows/ProductSuiteMapFlow.css'
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
import './pages/crm/BusinessSystems.css'
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
import './components/VibeColorPicker.css'
import './pages/Codex.css'
import './pages/LandingPage.css'
import './flows/CareerClarityQuiz.css'
import './flows/EarthquakeQuiz.css'
import './pages/FantasyLeagueLanding.css'
import './pages/HealingCompassLanding.css'
import './flows/MindSpace.css'
import './flows/PlayListFinderFlow.css'
import './flows/PersonaIdentifierFlow.css'
import './components/crm/CSVImport/CSVImportWizard.css'
import './pages/crm/SalesPlaybook.css'
import './pages/crm/Expenses.css'
import './pages/AgentAccess.css'
import './pages/AdminDashboard.css'
import './pages/ContentReview.css'
import './pages/league/LeagueOverview.css'
import './pages/league/WeekMatchups.css'
import './pages/league/MatchupDetails.css'
import './pages/league/ContentSubmit.css'
import './pages/league/LeagueAdmin.css'
import './pages/league/NewsfeedPage.css'

// Conditionally render widgets (hide on some public routes)
function ConditionalZarlo() {
  const location = useLocation()
  const { user } = useAuth()
  if (!user) return null
  // Hide Zarlo on /try/ routes, landing page, career clarity quiz, and fantasy LP
  const isTryRoute = location.pathname.startsWith('/try/')
  const isLandingPage = location.pathname === '/' || location.pathname === '/old-landing-page'
  const isCareerClarity = location.pathname === '/career-clarity'
  const isFantasyLP = location.pathname === '/fantasy'
  const isHealingWorkshopLP = location.pathname === '/healing-compass-workshop'
  const isWhyPage = location.pathname === '/why-i-created-this'

  if (isTryRoute || isLandingPage || isCareerClarity || isFantasyLP || isHealingWorkshopLP || isWhyPage) return null
  return <ZarloWidget />
}

function ConditionalBottomToolbar() {
  const location = useLocation()
  const { user } = useAuth()
  if (!user) return null
  const isPublicRoute = location.pathname.startsWith('/v/') ||
                        location.pathname.startsWith('/try/') ||
                        location.pathname.startsWith('/guidebook') ||
                        location.pathname === '/' ||
                        location.pathname === '/career-clarity' ||
                        location.pathname === '/launch-readiness' ||
                        location.pathname === '/funnel-baseline' ||
                        location.pathname === '/income-calculator' ||
                        location.pathname === '/mind-space' ||
                        location.pathname === '/play-list-finder' ||
                        location.pathname === '/persona-identifier' ||
                        location.pathname === '/play-profile' ||
                        location.pathname === '/lets-play' ||
                        location.pathname === '/lets-play-review' ||
                        location.pathname === '/self-test' ||
                        location.pathname === '/self-test-review' ||
                        location.pathname === '/validation-explainer' ||
                        location.pathname === '/product-explainer' ||
                        location.pathname === '/testing-explainer' ||
                        location.pathname === '/offer-creation-explainer' ||
                        location.pathname === '/campaign-explainer' ||
                        location.pathname === '/launch-explainer' ||
                        location.pathname === '/flow-finder-explainer' ||
                        location.pathname === '/play-list-explainer' ||
                        location.pathname === '/fantasy' ||
                        location.pathname === '/healing-compass-workshop' ||
                        location.pathname === '/why-i-created-this' ||
                        location.pathname.startsWith('/league') ||
                        location.pathname === '/content-review' ||
                        location.pathname === '/product-suite-map'

  if (isPublicRoute) return null
  return <BottomToolbar />
}

// Wrapper that adds key={location.key} to Suspense so lazy routes
// show the loading spinner instead of freezing on the old page.
// Without this, navigate() uses startTransition which suppresses
// Suspense fallbacks during lazy chunk loading.
function SuspenseRoutes({ children }) {
  const location = useLocation()
  return (
    <Suspense key={location.key} fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  )
}

function AppRouter() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <OnboardingProvider>
        <Router>
          <ScrollToTop />
          <PreloadCoreRoutes />
          <LocationAwareErrorBoundary>
          <SuspenseRoutes>
            <Routes>
              {/* Landing Page - Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/old-landing-page" element={<Suspense fallback={<LoadingSpinner />}><OldLandingPage /></Suspense>} />

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
            <Route path="/try/earthquake" element={<EarthquakeQuiz />} />
            <Route path="/try/play-profile" element={<TryPlayProfile />} />

            {/* Fantasy League Landing Page - Public */}
            <Route path="/fantasy" element={<FantasyLeagueLanding />} />

            {/* Healing Compass Workshop Landing - Public */}
            <Route path="/healing-compass-workshop" element={<HealingCompassLanding />} />

            {/* Why I Created This - Public explainer slides */}
            <Route path="/why-i-created-this" element={<WhyICreatedThis />} />

            <Route path="/me" element={
              <AuthGate>
                <MePage />
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

            {/* Guidebook - Lore Library */}
            <Route path="/guidebook" element={
              <AuthGate>
                <Codex />
              </AuthGate>
            } />
            <Route path="/guidebook/:entryId" element={
              <AuthGate>
                <CodexEntry />
              </AuthGate>
            } />
            <Route path="/healing-compass" element={
              <AuthGate>
                <HealingCompass />
              </AuthGate>
            } />
            <Route path="/limiting-belief-rewire" element={
              <AuthGate>
                <LimitingBeliefRewire />
              </AuthGate>
            } />
            <Route path="/shadow-work" element={
              <AuthGate>
                <ShadowWorkFlow />
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
                <EssenceProfile />
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
            <Route path="/self-test" element={
              <AuthGate>
                <SelfTestFlow />
              </AuthGate>
            } />
            <Route path="/self-test-review" element={
              <AuthGate>
                <SelfTestReviewFlow />
              </AuthGate>
            } />
            <Route path="/lets-play" element={
              <AuthGate>
                <LetsPlayFlow />
              </AuthGate>
            } />
            <Route path="/lets-play-review" element={
              <AuthGate>
                <LetsPlayReviewFlow />
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
            <Route path="/play-profile" element={
              <AuthGate>
                <PlayProfileFlow />
              </AuthGate>
            } />
            <Route path="/flow-finder-explainer" element={
              <AuthGate>
                <FlowFinderExplainer />
              </AuthGate>
            } />
            <Route path="/play-list-explainer" element={
              <AuthGate>
                <PlayListExplainer />
              </AuthGate>
            } />
            <Route path="/validation-explainer" element={
              <AuthGate>
                <ValidationExplainer />
              </AuthGate>
            } />
            <Route path="/product-explainer" element={
              <AuthGate>
                <ProductExplainer />
              </AuthGate>
            } />
            <Route path="/testing-explainer" element={
              <AuthGate>
                <TestingExplainer />
              </AuthGate>
            } />
            <Route path="/offer-creation-explainer" element={
              <AuthGate>
                <OfferCreationExplainer />
              </AuthGate>
            } />
            <Route path="/campaign-explainer" element={
              <AuthGate>
                <CampaignExplainer />
              </AuthGate>
            } />
            <Route path="/launch-explainer" element={
              <AuthGate>
                <LaunchExplainer />
              </AuthGate>
            } />
            <Route path="/what-is-healing-explainer" element={
              <AuthGate>
                <WhatIsHealingExplainer />
              </AuthGate>
            } />
            <Route path="/emotional-splinter-explainer" element={
              <AuthGate>
                <EmotionalSplinterExplainer />
              </AuthGate>
            } />
            <Route path="/how-do-we-heal-explainer" element={
              <AuthGate>
                <HowDoWeHealExplainer />
              </AuthGate>
            } />
            <Route path="/settings/notifications" element={
              <AuthGate>
                <NotificationSettings />
              </AuthGate>
            } />
            <Route path="/profile-hub" element={
              <AuthGate>
                <ProfileHub />
              </AuthGate>
            } />
            <Route path="/user-settings" element={
              <AuthGate>
                <UserSettings />
              </AuthGate>
            } />
            <Route path="/agent-access" element={
              <AuthGate>
                <AgentAccess />
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

            {/* Business Page */}
            <Route path="/business" element={
              <AuthGate>
                <BusinessPage />
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

            {/* Product Suite Map - Visual Money Model Builder */}
            <Route path="/product-suite-map" element={
              <AuthGate>
                <ProductSuiteMapFlow />
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
            <Route path="/crm/tools/systems" element={
              <AuthGate>
                <CRMLayout><BusinessSystems /></CRMLayout>
              </AuthGate>
            } />
            <Route path="/crm/tools/expenses" element={
              <AuthGate>
                <CRMLayout><Expenses /></CRMLayout>
              </AuthGate>
            } />
            <Route path="/crm/import" element={
              <AuthGate>
                <DataImport />
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
            <Route path="/crm/sales-playbook" element={
              <AuthGate>
                <CRMLayout>
                  <SalesPlaybook />
                </CRMLayout>
              </AuthGate>
            } />

            {/* Fantasy League */}
            <Route path="/league/week" element={
              <AuthGate>
                <WeekMatchups />
              </AuthGate>
            } />
            <Route path="/league/matchup" element={
              <AuthGate>
                <MatchupDetails />
              </AuthGate>
            } />
            <Route path="/league" element={
              <AuthGate>
                <LeagueOverview />
              </AuthGate>
            } />
            <Route path="/league/submit" element={
              <AuthGate>
                <ContentSubmit />
              </AuthGate>
            } />
            <Route path="/league/admin" element={
              <AuthGate>
                <LeagueAdmin />
              </AuthGate>
            } />
            <Route path="/league/guide" element={
              <AuthGate>
                <LeagueGuide />
              </AuthGate>
            } />

            {/* League Newsfeed */}
            <Route path="/newsfeed" element={
              <AuthGate>
                <NewsfeedPage />
              </AuthGate>
            } />

            {/* Admin Dashboard */}
            <Route path="/admin-dashboard" element={
              <AuthGate>
                <AdminDashboard />
              </AuthGate>
            } />

            {/* Content Review */}
            <Route path="/content-review" element={
              <AuthGate>
                <ContentReview />
              </AuthGate>
            } />
            </Routes>
          </SuspenseRoutes>
          <ConditionalBottomToolbar />
          <ConditionalZarlo />
          </LocationAwareErrorBoundary>
        </Router>
        </OnboardingProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default AppRouter
