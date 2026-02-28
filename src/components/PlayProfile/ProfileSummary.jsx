function getStageStory(founder, stageId) {
  const stories = founder.stageStories || {}
  const stageKey = String(stageId)
  if (stories[stageKey] && stories[stageKey].length > 0) {
    return stories[stageKey][0]
  }
  if (stories['general'] && stories['general'].length > 0) {
    return stories['general'][0]
  }
  return null
}

function truncateAtSentence(text, maxLength) {
  if (text.length <= maxLength) return text
  const truncated = text.substring(0, maxLength)
  const lastPeriod = truncated.lastIndexOf('. ')
  const lastQuestion = truncated.lastIndexOf('? ')
  const lastExclaim = truncated.lastIndexOf('! ')
  const lastBoundary = Math.max(lastPeriod, lastQuestion, lastExclaim)
  if (lastBoundary > 120) {
    return text.substring(0, lastBoundary + 1).trim()
  }
  return truncated.replace(/\s+\S*$/, '').trim() + '...'
}

export default function ProfileSummary({ founder, stuckPoint, dnaCode, archetype, onSave, onRetake, isSaving, alreadySaved }) {
  const story = getStageStory(founder, stuckPoint.id)

  return (
    <div style={{ paddingTop: 16, paddingBottom: 40 }}>
      {/* Icon — only show if we have one (returning users may not) */}
      {stuckPoint.icon && (
        <div className="pp-scale-in" style={{ textAlign: 'center', fontSize: 48, marginBottom: 16 }}>
          {stuckPoint.icon}
        </div>
      )}

      {/* Headline */}
      <div className="pp-fade-in-up pp-stagger-2" style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1>{founder.name} faced this exact thing.</h1>
        <p className="pp-subtitle">
          Here&apos;s how they navigated {stuckPoint.name.toLowerCase()}.
        </p>
      </div>

      {/* Founder's story preview */}
      {story && (
        <div className="pp-glass-card pp-fade-in-up pp-stagger-3" style={{ padding: 20, marginBottom: 20, textAlign: 'left' }}>
          <div className="pp-story-label">{founder.name}&apos;s story</div>
          <div className="pp-story-title">{story.title}</div>
          <div className="pp-story-content">
            {truncateAtSentence(story.content, 300)}
          </div>
          {story.content.length > 300 && (
            <div className="pp-story-more">Full story coming soon...</div>
          )}
        </div>
      )}

      {/* Session summary */}
      <div className={`pp-glass-card pp-fade-in-up pp-stagger-${story ? '4' : '3'}`} style={{ padding: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="pp-summary-row">
            <span className="pp-summary-label">Matched founder</span>
            <span className="pp-summary-value" style={{ color: '#E9A23B' }}>{founder.name}</span>
          </div>
          <div className="pp-summary-row">
            <span className="pp-summary-label">Company</span>
            <span className="pp-summary-value">{founder.company}</span>
          </div>
          <div className="pp-summary-row">
            <span className="pp-summary-label">Archetype</span>
            <span className="pp-summary-value">{archetype}</span>
          </div>
          <div className="pp-summary-row">
            <span className="pp-summary-label">Stage</span>
            <span className="pp-summary-value">{stuckPoint.name}</span>
          </div>
          <div className="pp-summary-row">
            <span className="pp-summary-label">Your DNA</span>
            <span className="pp-summary-value">{dnaCode}</span>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className={`pp-fade-in-up pp-stagger-${story ? '5' : '4'}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {alreadySaved ? (
          <button className="pp-btn-gold" disabled style={{ opacity: 0.7 }}>
            Saved
          </button>
        ) : (
          <button className="pp-btn-gold" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save to Profile'}
          </button>
        )}
        <button className="pp-btn-ghost" onClick={onRetake}>
          Retake Quiz
        </button>
      </div>
    </div>
  )
}
