/**
 * Skeleton loaders for CRM pages
 */
import './Skeleton.css'

export function SkeletonCard({ hasStats = false }) {
  return (
    <div className="skeleton-card">
      <div className="skeleton-icon" />
      <div className="skeleton-title" />
      <div className="skeleton-text" />
      {hasStats && (
        <div className="skeleton-stats">
          <div className="skeleton-stat" />
          <div className="skeleton-stat" />
        </div>
      )}
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="skeleton-stat-card">
      <div className="skeleton-icon-sm" />
      <div className="skeleton-value" />
      <div className="skeleton-label" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="skeleton-dashboard">
      <div className="skeleton-header">
        <div className="skeleton-title-lg" />
        <div className="skeleton-subtitle" />
      </div>
      <div className="skeleton-stats-grid">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <div className="skeleton-section">
        <div className="skeleton-section-title" />
        <div className="skeleton-actions-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  )
}

export function TowerSkeleton() {
  return (
    <div className="skeleton-tower">
      <div className="skeleton-header">
        <div className="skeleton-breadcrumb" />
        <div className="skeleton-title-lg" />
        <div className="skeleton-subtitle" />
      </div>
      <div className="skeleton-tower-grid">
        <SkeletonCard hasStats />
        <SkeletonCard hasStats />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
