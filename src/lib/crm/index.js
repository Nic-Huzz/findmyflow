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
  STAGE_INFO,
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
