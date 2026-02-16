/**
 * Preload functions for lazy-loaded route chunks.
 * Called by: idle preloader (AppRouter), hover/touch (BottomToolbar).
 * Each function returns the import() promise — safe to call multiple times
 * (browser caches the module after first load).
 */
export const preloadMePage = () => import('../pages/MePage')
export const preloadChallenge = () => import('../Challenge')
export const preloadFlowCompass = () => import('../pages/FlowCompassPage')
export const preloadProfileHub = () => import('../pages/ProfileHub')
export const preloadCRMDashboard = () => import('../pages/crm/Dashboard')
