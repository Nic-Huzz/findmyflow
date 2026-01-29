// src/components/crm/ContentChecklist.jsx
// Weekly content checklist for the Marketing page

import { useState } from 'react'
import { PHASES } from '../../lib/crm/weeklyPlanningService'
import {
  getContentPlanProgress,
  markItemPublished,
  resetItemToPlanned
} from '../../lib/crm/contentPlanningService'
import './ContentChecklist.css'

export default function ContentChecklist({
  plan,
  onGenerateContent,
  onEditDraft,
  onRefresh,
  onCreatePlan
}) {
  const [expandedItem, setExpandedItem] = useState(null)

  if (!plan || !plan.items || plan.items.length === 0) {
    return (
      <div className="content-checklist empty-state">
        <div className="empty-icon">📝</div>
        <h3>No Content Plan Yet</h3>
        <p>Create a weekly content plan to get started</p>
        <button className="create-plan-btn" onClick={onCreatePlan}>
          + Create Content Plan
        </button>
      </div>
    )
  }

  const progress = getContentPlanProgress(plan)
  const items = plan.items

  // Group by status
  const plannedItems = items.filter(i => i.status === 'planned')
  const draftItems = items.filter(i => i.status === 'draft')
  const publishedItems = items.filter(i => i.status === 'published')

  const handleMarkComplete = async (itemId) => {
    await markItemPublished(itemId)
    onRefresh?.()
  }

  const handleRevertToPlanned = async (itemId) => {
    await resetItemToPlanned(itemId)
    onRefresh?.()
  }

  const toggleExpand = (itemId) => {
    setExpandedItem(expandedItem === itemId ? null : itemId)
  }

  return (
    <div className="content-checklist">
      {/* Progress Header */}
      <div className="checklist-progress">
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>
        <div className="progress-stats">
          <span className="stat">{progress.published}/{progress.total} complete</span>
          {progress.draft > 0 && (
            <span className="stat draft">{progress.draft} draft{progress.draft !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* To Create Section */}
      {plannedItems.length > 0 && (
        <div className="checklist-section">
          <h4 className="section-title">
            <span className="title-icon">📋</span>
            To Create ({plannedItems.length})
          </h4>
          <div className="items-list">
            {plannedItems.map(item => (
              <ContentChecklistItem
                key={item.id}
                item={item}
                status="planned"
                expanded={expandedItem === item.id}
                onToggle={() => toggleExpand(item.id)}
                onGenerate={() => onGenerateContent?.(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Drafts Section */}
      {draftItems.length > 0 && (
        <div className="checklist-section">
          <h4 className="section-title">
            <span className="title-icon">✏️</span>
            Drafts ({draftItems.length})
          </h4>
          <div className="items-list">
            {draftItems.map(item => (
              <ContentChecklistItem
                key={item.id}
                item={item}
                status="draft"
                expanded={expandedItem === item.id}
                onToggle={() => toggleExpand(item.id)}
                onEdit={() => onEditDraft?.(item)}
                onMarkComplete={() => handleMarkComplete(item.id)}
                onRevert={() => handleRevertToPlanned(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Section */}
      {publishedItems.length > 0 && (
        <div className="checklist-section completed-section">
          <h4 className="section-title">
            <span className="title-icon">✅</span>
            Published ({publishedItems.length})
          </h4>
          <div className="items-list">
            {publishedItems.map(item => (
              <ContentChecklistItem
                key={item.id}
                item={item}
                status="published"
                expanded={expandedItem === item.id}
                onToggle={() => toggleExpand(item.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Individual checklist item component
function ContentChecklistItem({
  item,
  status,
  expanded,
  onToggle,
  onGenerate,
  onEdit,
  onMarkComplete,
  onRevert
}) {
  const phase = PHASES[item.phase]

  return (
    <div
      className={`checklist-item ${status} ${expanded ? 'expanded' : ''}`}
      style={{ '--phase-color': phase?.color }}
    >
      <div className="item-main" onClick={onToggle}>
        <div className="item-status-indicator">
          {status === 'published' && <span className="check-icon">✓</span>}
          {status === 'draft' && <span className="draft-icon">✏️</span>}
          {status === 'planned' && <span className="planned-icon">○</span>}
        </div>
        <div className="item-info">
          <div className="item-header">
            <span className="item-icon">{item.icon}</span>
            <span className="item-label">{item.label}</span>
            {item.post_day && (
              <span className="item-day-badge">{item.post_day.substring(0, 3)}</span>
            )}
          </div>
          {item.context && (
            <p className="item-context">{item.context}</p>
          )}
        </div>
        <div className="item-phase-badge">
          {phase?.icon}
        </div>
      </div>

      {expanded && (
        <div className="item-expanded">
          {status === 'planned' && (
            <div className="item-actions">
              <button className="generate-btn" onClick={onGenerate}>
                ✨ Generate Content
              </button>
            </div>
          )}

          {status === 'draft' && (
            <>
              {item.generated_content && (
                <div className="draft-preview">
                  <p>{item.generated_content.substring(0, 150)}...</p>
                </div>
              )}
              <div className="item-actions">
                <button className="edit-btn" onClick={onEdit}>
                  ✏️ Edit Draft
                </button>
                <button className="complete-btn" onClick={onMarkComplete}>
                  ✓ Mark Published
                </button>
              </div>
              <button className="revert-link" onClick={onRevert}>
                ← Revert to planned
              </button>
            </>
          )}

          {status === 'published' && item.published_at && (
            <div className="published-info">
              <span>Published {new Date(item.published_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
