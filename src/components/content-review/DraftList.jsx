import { useState, useMemo } from 'react'

const STATUS_DOT = {
  draft: '#6b7280',
  review: '#ffdd27',
  approved: '#22c55e',
  sent: '#3b82f6',
  archived: '#9ca3af',
}

export default function DraftList({ drafts, commentCounts, selectedId, onSelect }) {
  const [filter, setFilter] = useState('all')
  const [project, setProject] = useState('all')

  const projects = useMemo(() => {
    const set = new Set(drafts.map(d => d.project).filter(Boolean))
    return [...set].sort()
  }, [drafts])

  const filtered = drafts.filter(d => {
    if (project !== 'all' && d.project !== project) return false
    if (filter === 'all') return true
    if (filter === 'has_comments') return commentCounts[d.id]?.pending > 0
    return d.status === filter
  })

  const content = (
    <>
      <div className="cr-sidebar-filters">
        <select
          className="cr-filter-select"
          value={project}
          onChange={e => setProject(e.target.value)}
        >
          <option value="all">All projects</option>
          {projects.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          className="cr-filter-select"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="review">Needs review</option>
          <option value="has_comments">Has comments</option>
          <option value="approved">Approved</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="cr-draft-list">
        {filtered.map(d => {
          const counts = commentCounts[d.id] || { total: 0, pending: 0 }
          return (
            <button
              key={d.id}
              className={`cr-draft-item ${selectedId === d.id ? 'cr-draft-item--active' : ''}`}
              onClick={() => onSelect(d.id)}
            >
              <div className="cr-draft-item-row">
                <span
                  className="cr-status-dot"
                  style={{ background: STATUS_DOT[d.status] || '#6b7280' }}
                />
                <span className="cr-draft-title">{d.title}</span>
              </div>
              <div className="cr-draft-item-meta">
                {d.project && <span className="cr-draft-project">{d.project}</span>}
                {counts.pending > 0 && (
                  <span className="cr-draft-badge">{counts.pending}</span>
                )}
              </div>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <div className="cr-draft-empty">No drafts match filters</div>
        )}
      </div>
    </>
  )

  return <div className="cr-sidebar">{content}</div>
}
