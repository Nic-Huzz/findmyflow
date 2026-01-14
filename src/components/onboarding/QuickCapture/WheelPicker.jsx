/**
 * WheelPicker.jsx
 *
 * Reusable wheel segment picker with ring follow-up questions
 *
 * Each wheel has a dimensional follow-up question:
 * - Skills: "How confident are you with this skill?" → Emerging/Establishing/Mastering
 * - Problems: "What's your experience with this?" → Exploring/Pursuing/Proven
 * - Personas: "Where are they in their journey?" → Awakening/Struggling/Ready
 *
 * Props:
 * - type: 'skills' | 'problems' | 'personas'
 * - max: Maximum number of selections (default: 3)
 * - selected: Array of { id, ring } objects
 * - onSelect: Callback when selection changes
 *
 * Created: Jan 2026
 */

import { useState, useMemo } from 'react'
import {
  SKILLS_SEGMENTS,
  PROBLEM_SEGMENTS,
  PERSONA_SEGMENTS,
  PROFICIENCY_RINGS,
  PROBLEMS_PROFICIENCY_RINGS,
  JOURNEY_STAGES
} from '../../../lib/wheelTaxonomy'
import './WheelPicker.css'

function WheelPicker({ type, max = 3, selected = [], onSelect }) {
  const [pendingSegment, setPendingSegment] = useState(null)
  const [showRingPicker, setShowRingPicker] = useState(false)

  // Get segments based on wheel type
  const segments = useMemo(() => {
    switch (type) {
      case 'skills': return SKILLS_SEGMENTS
      case 'problems': return PROBLEM_SEGMENTS
      case 'personas': return PERSONA_SEGMENTS
      default: return []
    }
  }, [type])

  // Get ring options based on wheel type
  const ringOptions = useMemo(() => {
    switch (type) {
      case 'skills': return PROFICIENCY_RINGS
      case 'problems': return PROBLEMS_PROFICIENCY_RINGS
      case 'personas': return JOURNEY_STAGES
      default: return []
    }
  }, [type])

  // Get follow-up question based on wheel type
  const ringQuestion = useMemo(() => {
    switch (type) {
      case 'skills': return 'How confident are you with this skill?'
      case 'problems': return "What's your experience with this problem space?"
      case 'personas': return 'Where are your ideal customers in their journey?'
      default: return 'Select a level'
    }
  }, [type])

  // Get wheel title
  const wheelTitle = useMemo(() => {
    switch (type) {
      case 'skills': return 'Skills In Your Offering'
      case 'problems': return 'Problems Your Offering Solves'
      case 'personas': return 'Who Your Offering Helps'
      default: return 'Select'
    }
  }, [type])

  // Get wheel subtitle
  const wheelSubtitle = useMemo(() => {
    switch (type) {
      case 'skills': return `Select up to ${max} skills you use in your current offering`
      case 'problems': return `Select up to ${max} problems your offering addresses`
      case 'personas': return `Select up to ${max} types of people your offering serves`
      default: return `Select up to ${max}`
    }
  }, [type, max])

  // Group segments by sphere for problems wheel
  const groupedSegments = useMemo(() => {
    if (type === 'problems') {
      const groups = {}
      segments.forEach(seg => {
        const sphere = seg.sphere || 'other'
        if (!groups[sphere]) groups[sphere] = []
        groups[sphere].push(seg)
      })
      return groups
    }
    return { all: segments }
  }, [type, segments])

  // Sphere labels for problems
  const sphereLabels = {
    self: 'Self',
    relational: 'Relational',
    community: 'Community',
    world: 'World'
  }

  // Handle segment click
  const handleSegmentClick = (segmentId) => {
    const existingIndex = selected.findIndex(s => s.id === segmentId)

    if (existingIndex !== -1) {
      // Deselect
      const newSelected = [...selected]
      newSelected.splice(existingIndex, 1)
      onSelect(newSelected)
    } else if (selected.length < max) {
      // Show ring picker for new selection
      setPendingSegment(segmentId)
      setShowRingPicker(true)
    }
  }

  // Handle ring selection
  const handleRingSelect = (ringId) => {
    onSelect([...selected, { id: pendingSegment, ring: ringId }])
    setPendingSegment(null)
    setShowRingPicker(false)
  }

  // Cancel ring picker
  const handleCancelRing = () => {
    setPendingSegment(null)
    setShowRingPicker(false)
  }

  // Get segment data
  const getSegment = (id) => segments.find(s => s.id === id)

  // Ring picker modal
  if (showRingPicker && pendingSegment) {
    const segment = getSegment(pendingSegment)
    return (
      <div className="wheel-picker">
        <div className="ring-picker-overlay" onClick={handleCancelRing}>
          <div className="ring-picker-modal" onClick={e => e.stopPropagation()}>
            <div className="ring-picker-header">
              <span className="segment-icon">{segment?.icon}</span>
              <h3>{segment?.displayName}</h3>
            </div>

            <p className="ring-question">{ringQuestion}</p>

            <div className="ring-options">
              {ringOptions.map(ring => (
                <button
                  key={ring.id}
                  className="ring-option"
                  style={{ '--ring-color': ring.color }}
                  onClick={() => handleRingSelect(ring.id)}
                >
                  <span className="ring-label">{ring.label}</span>
                  <span className="ring-description">{ring.description}</span>
                </button>
              ))}
            </div>

            <button className="cancel-button" onClick={handleCancelRing}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wheel-picker">
      <div className="wheel-header">
        <h3 className="wheel-title">{wheelTitle}</h3>
        <p className="wheel-subtitle">{wheelSubtitle}</p>
        <div className="selection-count">
          {selected.length} / {max} selected
        </div>
      </div>

      <div className="wheel-content">
        {Object.entries(groupedSegments).map(([group, items]) => (
          <div key={group} className="segment-group">
            {group !== 'all' && (
              <h4 className="group-label">{sphereLabels[group] || group}</h4>
            )}
            <div className="segment-grid">
              {items.map(segment => {
                const selectedItem = selected.find(s => s.id === segment.id)
                const isSelected = !!selectedItem
                const isDisabled = selected.length >= max && !isSelected

                return (
                  <button
                    key={segment.id}
                    className={`segment-button ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                    style={{
                      '--segment-color': segment.color,
                      borderColor: isSelected ? '#E9A23B' : undefined
                    }}
                    onClick={() => handleSegmentClick(segment.id)}
                    disabled={isDisabled}
                  >
                    <span className="segment-icon">{segment.icon}</span>
                    <span className="segment-name">{segment.displayName}</span>
                    {isSelected && selectedItem?.ring && (
                      <span
                        className="segment-ring-badge"
                        style={{
                          backgroundColor: ringOptions.find(r => r.id === selectedItem.ring)?.color
                        }}
                      >
                        {ringOptions.find(r => r.id === selectedItem.ring)?.label}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Items Summary */}
      {selected.length > 0 && (
        <div className="selected-summary">
          <h4>Selected:</h4>
          <div className="selected-chips">
            {selected.map(item => {
              const segment = getSegment(item.id)
              const ring = ringOptions.find(r => r.id === item.ring)
              return (
                <div
                  key={item.id}
                  className="selected-chip"
                  style={{ borderColor: '#E9A23B' }}
                >
                  <span className="chip-icon">{segment?.icon}</span>
                  <span className="chip-name">{segment?.displayName}</span>
                  {ring && (
                    <span
                      className="chip-ring"
                      style={{ backgroundColor: ring.color }}
                    >
                      {ring.label}
                    </span>
                  )}
                  <button
                    className="chip-remove"
                    onClick={() => handleSegmentClick(item.id)}
                  >
                    &times;
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default WheelPicker
