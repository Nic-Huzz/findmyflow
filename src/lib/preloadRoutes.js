/**
 * Preload functions for lazy-loaded route chunks.
 * Called by: idle preloader (AppRouter), hover/touch (BottomToolbar),
 *           Challenge page (flow routes).
 * Each function returns the import() promise — safe to call multiple times
 * (browser caches the module after first load).
 */
export const preloadMePage = () => import('../pages/MePage')
export const preloadChallenge = () => import('../Challenge')
export const preloadFlowCompass = () => import('../pages/FlowCompassPage')
export const preloadProfileHub = () => import('../pages/ProfileHub')
export const preloadCRMDashboard = () => import('../pages/crm/Dashboard')

// Flow routes — preloaded when Challenge page mounts so tapping "Start" is instant
export const preloadOfferBuilder = () => import('../flows/OfferBuilderFlow')
export const preloadLeadsStrategy = () => import('../flows/LeadsStrategyFlow')
export const preloadLeadMagnetSelection = () => import('../flows/LeadMagnetSelectionFlow')
export const preloadFunnelBuilder = () => import('../flows/FunnelBuilderFlow')
export const preloadGrandSlamOffer = () => import('../flows/GrandSlamOfferFlow')
export const preloadLetsPlay = () => import('../flows/LetsPlayFlow')
export const preloadSelfTest = () => import('../flows/SelfTestFlow')
export const preloadHealingCompass = () => import('../flows/HealingCompass')
export const preloadLimitingBelief = () => import('../flows/LimitingBeliefRewire')
export const preloadShadowWork = () => import('../flows/ShadowWorkFlow')
export const preloadNervousSystem = () => import('../flows/NervousSystemFlow')
export const preloadEarthquakeQuiz = () => import('../flows/EarthquakeQuiz')
export const preloadMVPReadiness = () => import('../flows/MVPReadinessFlow')

/**
 * Preload all challenge flow chunks immediately on Challenge mount.
 * Fires right away (no idle/timeout delay) so chunks are cached
 * before the user taps "Start". Safe to call multiple times —
 * the browser deduplicates identical import() calls.
 */
export function preloadChallengeFlows() {
  preloadOfferBuilder()
  preloadLeadsStrategy()
  preloadLeadMagnetSelection()
  preloadFunnelBuilder()
  preloadGrandSlamOffer()
  preloadLetsPlay()
  preloadSelfTest()
  preloadHealingCompass()
  preloadLimitingBelief()
  preloadShadowWork()
  preloadNervousSystem()
  preloadEarthquakeQuiz()
  preloadMVPReadiness()
}

/**
 * Preload a specific flow by route path.
 * Called on touchStart of quest cards for instant navigation.
 */
const ROUTE_PRELOADERS = {
  '/offer-builder': preloadOfferBuilder,
  '/leads-strategy': preloadLeadsStrategy,
  '/lead-magnet-selection': preloadLeadMagnetSelection,
  '/funnel-builder': preloadFunnelBuilder,
  '/offer-builder-v2': preloadGrandSlamOffer,
  '/lets-play': preloadLetsPlay,
  '/self-test': preloadSelfTest,
  '/healing-compass': preloadHealingCompass,
  '/limiting-belief': preloadLimitingBelief,
  '/shadow-work': preloadShadowWork,
  '/nervous-system': preloadNervousSystem,
  '/try/earthquake': preloadEarthquakeQuiz,
  '/mvp-readiness': preloadMVPReadiness,
}

export function preloadFlowByRoute(route) {
  ROUTE_PRELOADERS[route]?.()
}
