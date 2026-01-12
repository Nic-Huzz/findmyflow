/**
 * CRM Services - Barrel Export
 * Exports all CRM-related services for easy importing
 */

// Task Management
export {
  generateWeeklyTasks,
  checkWeeklyTasksExist,
  fetchWeeklyTasks,
  toggleTaskCompletion,
  updateTaskEngagement,
  getTopPerformers,
  getWeekInfo,
  getWeekStartDate,
  getTodayInfo,
  taskHasContentGeneration,
  taskHasEngagementTracking,
} from './taskService'

// Deal/Sales Pipeline
export {
  DEAL_STAGES,
  ACTIVE_STAGES,
  STAGE_INFO,
  LEGACY_STAGE_MAP,
  PRODUCTS,
  DEFAULT_PRODUCTS,
  fetchDeals,
  fetchDealsByStage,
  createDeal,
  updateDealStage,
  updateDeal,
  deleteDeal,
  calculateRevenueStats,
  getTransitionPoints,
  fetchUserProducts,
  saveDealOutcome,
  fetchDealOutcomes,
  getDealOutcomeStats,
  // New stage management
  scheduleMeeting,
  logContact,
  scheduleFollowUp,
  getFollowUpsDue,
  getStaleDeals,
  getUpcomingMeetings,
  calculateStageVelocity,
  getShowRate,
} from './dealService'

// Analytics & Reporting
export {
  getWeekRange,
  fetchWeeklyMarketingStats,
  fetchWeeklySalesStats,
  calculateGrade,
  calculateWeeklyGrade,
  fetchTopContent,
  compareWeeks,
  fetchPlatformBreakdown,
} from './analyticsService'

// Stats & Gamification
export {
  LEVELS,
  getLevel,
  getLevelProgress,
  getPointsToNextLevel,
  calculateStreak,
  fetchUserStats,
  addPoints,
  updateStreak,
  updateRevenueGoal,
} from './statsService'

// Funnel Actuals (Auto-calculated from CRM)
export {
  calculateFunnelActuals,
  saveFunnelActuals,
  getCurrentMonthFunnelActuals,
  getLastMonthFunnelActuals,
  updateCurrentMonthActuals,
  fetchFunnelActuals,
  analyzeFunnelHealth,
  getFunnelContext,
} from './funnelActualsService'

// Recommendations Engine
export {
  generateRecommendations,
  saveRecommendations,
  fetchPendingRecommendations,
  markRecommendationViewed,
  markRecommendationActed,
  dismissRecommendation,
  refreshRecommendations,
  DISMISS_REASONS,
} from './recommendationService'

// Content Triggers (Sales → Content Integration)
export {
  CONTENT_TRIGGERS,
  getContentConfigForTrigger,
  buildContentTriggerUrl,
  parseContentTriggerParams,
  getTriggersByCategory,
  getTriggerSummary,
} from './contentTriggers'

// Ascension Engine & Retention Tracking
export {
  VALUE_LADDER_RUNGS,
  getOrCreateCustomerAscension,
  recordAscension,
  fetchCustomerAscensions,
  getValueLadderStats,
  fetchAscensionTriggers,
  createDefaultTriggers,
  updateAscensionTrigger,
  deleteAscensionTrigger,
  // checkAscensionTriggers - internal helper, not exported
  // createAscensionTask - internal helper, not exported
  fetchPendingAscensionTasks,
  completeAscensionTask,
  dismissAscensionTask,
  rescheduleAscensionTask,
  markDealAsContinuity,
  fetchContinuityCustomers,
  updateContinuityStatus,
  getRetentionStats,
  processDealForAscension,
} from './ascensionService'
