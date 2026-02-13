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
  POST_SALE_STAGES,
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
  getMonthRange,
  fetchWeeklyMarketingStats,
  fetchWeeklySalesStats,
  fetchMonthlyMarketingStats,
  fetchMonthlySalesStats,
  fetchMonthlyPlatformBreakdown,
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

// Funnel Sync (CRM ↔ funnel_metrics bidirectional sync)
export {
  syncCRMToFunnel,
  getMergedFunnelMetrics,
  getFunnelComparison,
  getLastSyncTime,
  forceCRMSync,
} from './funnelSyncService'

// Challenge Data Service (connects challenges to CRM)
export {
  // Offer & Product Data
  fetchOfferStackData,
  fetchGrandSlamData,
  fetchValidationAnalysis,
  fetchLaunchReadiness,
  fetchProductSelections,
  fetchLeadMagnetAssessment,
  // Testing Data
  fetchMVPReadiness,
  fetchFeedbackAnalysis,
  fetchConversationLogs,
  // Psychological Data
  fetchPsychologicalProfile,
  // Funnel Trends
  getFunnelTrends,
  analyzeFunnelTrends,
  // Completeness Checking
  getChallengeCompleteness,
  calculateCRMReadiness,
  // Aggregated Data
  fetchAllChallengeData,
  // MVP Testers Sync
  syncMVPTestersToContacts,
  getUnsyncedTesters,
} from './challengeDataService'

// Tone Adapter (Psychological Prompt Personalization)
export {
  wrapPromptWithTone,
  getToneWord,
  adaptTextToTone,
  generateTonedFeedback,
  buildToneContext,
  getToneInfo,
} from './toneAdapter'

// Tower Stats (Live stats for tower cards)
export {
  getAttractStats,
  getNurtureStats,
  getToolsStats,
} from './towerStats'

// Ecosystem / Business Flywheel System
export {
  getEcosystemProgress,
  getEcosystemSummary,
  toggleSystemItem,
  getEcosystemStats,
  detectAutoChecks,
} from './ecosystemService'

export {
  ECOSYSTEM_PHASES,
  AUTO_CHECK_MAP,
  getPhaseItems,
  getTotalItemCount,
} from './ecosystemConfig'

// Groan Challenge Service (Matrix System)
export {
  // Challenge CRUD
  fetchGroanChallenges,
  fetchGroanChallenge,
  createGroanChallenge,
  acceptGroanChallenge,
  completeGroanChallenge,
  skipGroanChallenge,
  updateChallengeScores,
  // Proof Collection
  addGroanProof,
  fetchGroanProof,
  deleteGroanProof,
  uploadProofScreenshot,
  // Contract Evidence
  addContractEvidence,
  fetchContractEvidence,
  getContractProgress,
  // Outcomes (48hr follow-up)
  recordGroanOutcome,
  getChallengesNeedingFollowUp,
  // Streaks
  fetchGroanStreak,
  getStreakWithProgress,
  // User Preferences
  fetchGroanPreferences,
  updateGroanPreferences,
  // Analytics
  getProtectivePatterns,
  getRevenueByLayer,
  getEssenceZoneStats,
  getGroanStats,
  // Matrix Data
  fetchFlowFinderData,
  getMatrixCellChallenges,
  getCurrentWeekChallenge,
  hasCompletedFlowFinder,
  // Skill × Problem Matrix
  createSkillProblemChallenge,
  getSkillProblemCellChallenge,
  getAllSkillProblemChallenges,
} from './groanChallengeService'

// Weekly Planning Service
export {
  getWeekStart,
  getUpcomingMonday,
  shouldShowWeeklyPlanning,
  getPlanningWeekStart,
  getCurrentWeekPlan,
  saveWeeklyPlan,
  hasCurrentWeekPlan,
  getTaskMenuByPhase,
  PHASES,
  calculateExecutionScore,
  calculateConversionScore,
  calculateImprovementScore,
  getWeeklyScores,
  getLastWeekScores,
} from './weeklyPlanningService'

// Reflection Service
export {
  getFlowDirection,
  FLOW_DIRECTIONS,
  getReflectionQuestion,
  saveReflection,
  getReflection,
  getReflectionHistory,
  getRecentFlowEntries,
  analyzeFlowPatterns,
} from './reflectionService'

// CSV Import Service
export {
  TABLE_CONFIGS,
  parseCSV,
  autoMapHeaders,
  validateRow,
  validateAllRows,
  transformRow,
  importData,
  generateFailedRowsCSV,
  downloadCSV,
} from './csvImportService'

// Objection Logging (Sales Playbook)
export {
  logObjection,
  fetchObjectionLogs,
  getObjectionStats,
  deleteObjectionLog,
} from './objectionService'

// P&L Service (Financial Tracking)
export {
  fetchProjectPnL,
  aggregatePnL,
} from './pnlService'

// CLOSER Script System (Sales Playbook)
export {
  fetchCloserScript,
  saveCloserScript,
  generateDefaultScript,
  buildCloserStepPrompt,
} from './closerScriptService'
