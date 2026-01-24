/**
 * Coming Soon - Reusable placeholder page
 * Clean, modern design matching the CRM page styling
 *
 * Usage:
 * <ComingSoon
 *   title="Feature Name"
 *   description="Brief description of the feature"
 *   icon="🚀"
 *   backPath="/crm"
 *   breadcrumb={[{ label: 'Home', path: '/crm' }, { label: 'Feature Name' }]}
 *   features={['Feature 1', 'Feature 2', 'Feature 3']}
 * />
 */
import { useNavigate } from 'react-router-dom'
import './ComingSoon.css'

export default function ComingSoon({
  title = 'Coming Soon',
  description = 'This feature is under development',
  icon = '🚀',
  backPath = '/crm',
  backLabel = 'Back',
  breadcrumb = [],
  features = [],
  notifyOption = true
}) {
  const navigate = useNavigate()

  return (
    <div className="coming-soon-container">
      {/* Top Toolbar */}
      <div className="coming-soon-toolbar">
        <button className="cs-back-btn" onClick={() => navigate(backPath)}>
          ←
        </button>
        <h2 className="cs-toolbar-title">{title}</h2>
      </div>

      {/* Header with Breadcrumb */}
      <header className="coming-soon-header">
        {breadcrumb.length > 0 && (
          <div className="cs-breadcrumb">
            {breadcrumb.map((item, index) => (
              <span key={index}>
                {item.path ? (
                  <button onClick={() => navigate(item.path)}>{item.label}</button>
                ) : (
                  <span>{item.label}</span>
                )}
                {index < breadcrumb.length - 1 && <span className="cs-separator">→</span>}
              </span>
            ))}
          </div>
        )}
        <h1 className="cs-title">{icon} {title}</h1>
        <p className="cs-subtitle">{description}</p>
      </header>

      {/* Main Card */}
      <div className="coming-soon-card">
        <div className="cs-icon-container">
          <span className="cs-icon">{icon}</span>
          <div className="cs-icon-ring"></div>
        </div>

        <h2 className="cs-headline">Under Construction</h2>
        <p className="cs-message">
          We're building something great! This feature will be available soon.
        </p>

        {/* Feature Preview */}
        {features.length > 0 && (
          <div className="cs-features">
            <h3>What's Coming</h3>
            <ul className="cs-feature-list">
              {features.map((feature, index) => (
                <li key={index}>
                  <span className="cs-check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Notify Option */}
        {notifyOption && (
          <div className="cs-notify">
            <p className="cs-notify-text">Want to be notified when this is ready?</p>
            <button className="cs-notify-btn" onClick={() => navigate('/settings/notifications')}>
              🔔 Set Up Notifications
            </button>
          </div>
        )}
      </div>

      {/* Back Button Card */}
      <div className="coming-soon-actions">
        <button className="cs-action-btn" onClick={() => navigate(backPath)}>
          ← {backLabel}
        </button>
        <button className="cs-action-btn cs-action-primary" onClick={() => navigate('/crm')}>
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
