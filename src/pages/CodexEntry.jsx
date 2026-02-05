import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useCodex } from '../hooks/useCodex'
import './Codex.css'

/**
 * Parse markdown-like content into JSX
 * Handles: **bold**, *italic*, - lists, and paragraphs
 */
function parseContent(text) {
  if (!text) return null

  // Split into paragraphs
  const paragraphs = text.split('\n\n')

  return paragraphs.map((paragraph, pIdx) => {
    // Check if it's a list
    const lines = paragraph.split('\n')
    const isListParagraph = lines.every(
      line => line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim() === ''
    )

    if (isListParagraph) {
      const listItems = lines
        .filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '))
        .map(line => line.trim().replace(/^[-*]\s*/, ''))

      if (listItems.length > 0) {
        return (
          <ul key={pIdx}>
            {listItems.map((item, idx) => (
              <li key={idx}>{parseInline(item)}</li>
            ))}
          </ul>
        )
      }
    }

    // Regular paragraph
    return <p key={pIdx}>{parseInline(paragraph.replace(/\n/g, ' '))}</p>
  })
}

/**
 * Parse inline markdown: **bold**, *italic*
 */
function parseInline(text) {
  if (!text) return null

  const parts = []
  let key = 0

  // Pattern to match **bold** or *italic*
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[2]) {
      // **bold**
      parts.push(<strong key={key++}>{match[2]}</strong>)
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={key++}>{match[3]}</em>)
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

/**
 * ContentSection - Renders a single content section with title and body
 */
function ContentSection({ title, body, quote }) {
  return (
    <div className="content-section">
      {title && <h3 className="section-title">{title}</h3>}
      {quote && <blockquote className="section-quote">{quote}</blockquote>}
      {body && <div className="section-body">{parseContent(body)}</div>}
    </div>
  )
}

/**
 * CodexEntry - Full page view for reading an unlocked entry
 */
function CodexEntry() {
  const navigate = useNavigate()
  const { entryId } = useParams()
  const { user } = useAuth()
  const { getEntryById, getAdjacentEntries, loading, error, categories } = useCodex(user?.id)

  // Get entry data
  const entry = getEntryById(entryId)
  const { prev, next } = getAdjacentEntries(entryId)

  // Get category info
  const category = entry ? categories[entry.category] : null

  // Build content sections based on entry type
  const contentSections = useMemo(() => {
    if (!entry || !entry.content) return []

    const sections = []
    const content = entry.content

    // Voice Archives structure
    if (content.origin) {
      sections.push({ key: 'origin', ...content.origin })
    }
    if (content.lie) {
      sections.push({ key: 'lie', title: content.lie.title, quote: content.lie.quote, body: content.lie.body })
    }
    if (content.protection) {
      sections.push({ key: 'protection', ...content.protection })
    }
    if (content.blocking) {
      sections.push({ key: 'blocking', ...content.blocking })
    }
    if (content.kryptonite) {
      sections.push({ key: 'kryptonite', ...content.kryptonite })
    }
    if (content.rewiring) {
      sections.push({ key: 'rewiring', title: content.rewiring.title, quote: content.rewiring.quote, body: content.rewiring.body })
    }
    if (content.heroes) {
      sections.push({ key: 'heroes', ...content.heroes })
    }

    // Flow Scrolls structure
    if (content.teaching) {
      sections.push({ key: 'teaching', ...content.teaching })
    }
    if (content.matters) {
      sections.push({ key: 'matters', ...content.matters })
    }
    if (content.practice) {
      sections.push({ key: 'practice', ...content.practice })
    }

    // Founder Journey structure
    if (content.moment) {
      sections.push({ key: 'moment', ...content.moment })
    }
    if (content.lesson) {
      sections.push({ key: 'lesson', ...content.lesson })
    }
    if (content.forYou) {
      sections.push({ key: 'forYou', ...content.forYou })
    }

    // Ancient Wisdom structure
    if (content.translation) {
      sections.push({ key: 'translation', ...content.translation })
    }
    if (content.invitation) {
      sections.push({ key: 'invitation', ...content.invitation })
    }

    return sections
  }, [entry])

  if (loading) {
    return (
      <div className="codex-entry-page">
        <div className="codex-loading">
          <div className="codex-loading-spinner" />
          <p>Loading entry...</p>
        </div>
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="codex-entry-page">
        <div className="codex-error">
          <p>Entry not found.</p>
          <button onClick={() => navigate('/guidebook')}>Back to Guidebook</button>
        </div>
      </div>
    )
  }

  // Check if entry is locked
  if (!entry.isUnlocked) {
    return (
      <div className="codex-entry-page">
        <div className="entry-header">
          <button className="back-button" onClick={() => navigate('/guidebook')}>
            ←
          </button>
        </div>
        <div className="entry-locked">
          <span className="locked-icon">🔒</span>
          <h2 className="locked-title">{entry.title}</h2>
          <p className="locked-text">
            This entry is locked. Continue your journey to unlock it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="codex-entry-page">
      {/* Header */}
      <div className="entry-header">
        <button className="back-button" onClick={() => navigate('/guidebook')}>
          ←
        </button>
        <div className="entry-meta">
          {category && (
            <span className="entry-category-badge">
              {category.icon} {category.name}
            </span>
          )}
          <h1 className="entry-title">{entry.title}</h1>
          {entry.subtitle && <p className="entry-subtitle">{entry.subtitle}</p>}
        </div>
        <div className="entry-icon">{entry.icon}</div>
      </div>

      {/* Content Sections */}
      <div className="entry-content">
        {contentSections.map(section => (
          <ContentSection
            key={section.key}
            title={section.title}
            body={section.body}
            quote={section.quote}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="entry-navigation">
        <button
          className="nav-button prev"
          onClick={() => prev?.isUnlocked && navigate(`/guidebook/${prev.id}`)}
          disabled={!prev || !prev.isUnlocked}
        >
          <span className="nav-arrow">←</span>
          <span className="nav-text">
            <span className="nav-label">Previous</span>
            <span className="nav-title">{prev?.title || 'None'}</span>
          </span>
        </button>
        <button
          className="nav-button next"
          onClick={() => next?.isUnlocked && navigate(`/guidebook/${next.id}`)}
          disabled={!next || !next.isUnlocked}
        >
          <span className="nav-text">
            <span className="nav-label">Next</span>
            <span className="nav-title">{next?.title || 'None'}</span>
          </span>
          <span className="nav-arrow">→</span>
        </button>
      </div>
    </div>
  )
}

export default CodexEntry
