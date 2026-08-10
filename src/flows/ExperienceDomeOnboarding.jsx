import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PRIMALS, INDUSTRIES, industryNodes } from '../lib/ruleBreakTreeData'
import { isCoreNode, getExperienceLabel } from '../lib/experienceDomeConfig'
import { useAuth } from '../auth/AuthProvider'
import { useDomeData } from '../hooks/useDomeData'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './ExperienceDomeOnboarding.css'

const NS_STATES = ['vibe_rise', 'fun', 'growth_edge', 'pressure', 'bored']
const NS_LABELS = { vibe_rise: 'Love it', fun: "It's fun", growth_edge: 'Growth edge', pressure: 'Stresses me', bored: 'Bored by it' }
const NS_ICONS = { vibe_rise: '✦', fun: '○', growth_edge: '↗', pressure: '◇', bored: '—' }

// Build ordered primal data with their core nodes
function buildPrimalCards() {
  return PRIMALS.map(primal => {
    const nodes = industryNodes
      .filter(n => {
        if (!isCoreNode(n.id)) return false
        const ind = INDUSTRIES[n.branch]
        return ind && ind.primal === primal.id
      })
      .map(n => ({
        id: n.id,
        label: getExperienceLabel(n.id, n.label),
      }))

    return {
      id: primal.id,
      label: primal.label,
      color: primal.color,
      desc: primal.desc,
      nodes,
    }
  }).filter(p => p.nodes.length > 0)
}

export default function ExperienceDomeOnboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { bulkSetStates } = useDomeData(user?.id)
  const primalCards = useMemo(buildPrimalCards, [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [ratings, setRatings] = useState({})
  const [exiting, setExiting] = useState(false)
  const [expandedNode, setExpandedNode] = useState(null)

  const card = primalCards[currentIndex]
  const isLast = currentIndex === primalCards.length - 1
  const totalNodes = primalCards.reduce((sum, c) => sum + c.nodes.length, 0)
  const ratedCount = Object.keys(ratings).length

  // Count rated for current card
  const cardRated = card ? card.nodes.filter(n => ratings[n.id]).length : 0

  const handleToggle = useCallback((nodeId) => {
    hapticLight()
    // Auto-close any other open dropdown
    setExpandedNode(prev => prev === nodeId ? null : nodeId)
  }, [])

  const handlePickState = useCallback((nodeId, state) => {
    hapticLight()
    setRatings(prev => {
      if (!state) {
        const next = { ...prev }
        delete next[nodeId]
        return next
      }
      return { ...prev, [nodeId]: state }
    })
    setExpandedNode(null)
  }, [])

  const handleNext = useCallback(() => {
    if (exiting) return
    if (isLast) {
      hapticSuccess()
      bulkSetStates(ratings)
      navigate('/rule-break-tree?layer=dome')
      return
    }
    setExiting(true)
    setExpandedNode(null)
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setExiting(false)
    }, 250)
  }, [exiting, isLast, navigate])

  const handleBack = useCallback(() => {
    if (exiting) return
    if (currentIndex === 0) return
    setExiting(true)
    setExpandedNode(null)
    setTimeout(() => {
      setCurrentIndex(prev => prev - 1)
      setExiting(false)
    }, 250)
  }, [exiting, currentIndex])

  if (!card) return null

  return (
    <div className="dome-onboarding">
      {/* Progress bar */}
      <div className="dome-ob-progress">
        <div
          className="dome-ob-progress-fill"
          style={{ width: `${((currentIndex + 1) / primalCards.length) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="dome-ob-header">
        <span className="dome-ob-step">{currentIndex + 1} / {primalCards.length}</span>
        <span className="dome-ob-rated">{ratedCount} of {totalNodes} rated</span>
      </div>

      {/* Card */}
      <div className={`dome-ob-card ${exiting ? 'exiting' : ''}`}>
        {/* Primal title + progress */}
        <div className="dome-ob-primal-header">
          <div
            className="dome-ob-primal-dot"
            style={{ background: card.color }}
          />
          <h2 className="dome-ob-primal-name" style={{ color: card.color }}>
            {card.label}
          </h2>
          <span className="dome-ob-card-progress" style={{ color: card.color }}>
            {cardRated}/{card.nodes.length}
          </span>
        </div>
        <p className="dome-ob-primal-desc">{card.desc || ''}</p>

        {/* Experience pills */}
        <div className="dome-ob-nodes">
          {card.nodes.map(node => {
            const state = ratings[node.id]
            const isOpen = expandedNode === node.id
            return (
              <div key={node.id} className="dome-ob-node-wrap">
                <button
                  className={`dome-ob-node ${state || 'unrated'} ${isOpen ? 'expanded' : ''}`}
                  style={{
                    borderColor: state ? card.color : undefined,
                    background: state ? `${card.color}${state === 'vibe_rise' ? '30' : state === 'fun' ? '18' : '12'}` : undefined,
                  }}
                  onClick={() => handleToggle(node.id)}
                >
                  {state && (
                    <span className="dome-ob-node-icon" style={{ color: card.color }}>
                      {NS_ICONS[state]}
                    </span>
                  )}
                  <span className="dome-ob-node-label">{node.label}</span>
                  {state && (
                    <span className="dome-ob-node-state" style={{ color: card.color }}>
                      {NS_LABELS[state]}
                    </span>
                  )}
                </button>
                {isOpen && (
                  <div className="dome-ob-dropdown">
                    {NS_STATES.map(s => (
                      <button
                        key={s}
                        className={`dome-ob-dropdown-opt ${state === s ? 'active' : ''}`}
                        style={{ color: card.color }}
                        onClick={() => handlePickState(node.id, s)}
                      >
                        <span className="dome-ob-dropdown-icon">{NS_ICONS[s]}</span>
                        {NS_LABELS[s]}
                      </button>
                    ))}
                    {state && (
                      <button
                        className="dome-ob-dropdown-opt clear"
                        onClick={() => handlePickState(node.id, null)}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="dome-ob-legend">
          <span>Tap to rate:</span>
          <span className="dome-ob-legend-item">✦ Love it</span>
          <span className="dome-ob-legend-item">○ It's fun</span>
          <span className="dome-ob-legend-item">↗ Growth edge</span>
          <span className="dome-ob-legend-item">◇ Stresses me</span>
          <span className="dome-ob-legend-item">— Bored</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="dome-ob-nav">
        {currentIndex > 0 ? (
          <button className="dome-ob-back" onClick={handleBack}>Back</button>
        ) : (
          <div />
        )}
        <button
          className="dome-ob-next"
          style={{ background: card.color }}
          onClick={handleNext}
        >
          {isLast ? 'See my dome' : 'Next'}
        </button>
      </div>
    </div>
  )
}
