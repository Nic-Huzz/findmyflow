/**
 * AutonomousSetup - Entry point for Tier 4 data collection
 *
 * Frames the data collection as "Setup Your Autonomous AI System"
 * Shows progress through the 3 micro-flows:
 * 1. Business Baseline (~2 min)
 * 2. Customer Segments (~3 min)
 * 3. Competitor Snapshot (~3 min)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import BottomToolbar from '../../components/BottomToolbar'
import './AutonomousSetup.css'

const FLOWS = [
  {
    id: 'business_baseline',
    title: 'Business Baseline',
    description: 'Revenue, margins & capacity',
    duration: '2 min',
    icon: '📊',
    path: '/crm/setup/business-baseline',
    dataUnlocked: ['Goal-based planning', 'Pricing recommendations', 'Capacity awareness'],
  },
  {
    id: 'customer_segments',
    title: 'Customer Segments',
    description: 'Your best & worst customers',
    duration: '3 min',
    icon: '👥',
    path: '/crm/setup/customer-segments',
    dataUnlocked: ['Targeted messaging', 'Segment-specific offers', 'Churn prediction'],
  },
  {
    id: 'competitor_snapshot',
    title: 'Competitor Snapshot',
    description: 'Who else they consider',
    duration: '3 min',
    icon: '🎯',
    path: '/crm/setup/competitor-snapshot',
    dataUnlocked: ['Competitive positioning', 'Pricing intelligence', 'Differentiation'],
  },
]

export default function AutonomousSetup({ userId }) {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadProgress()
    }
  }, [userId])

  async function loadProgress() {
    try {
      const { data, error } = await supabase
        .from('autonomous_setup_progress')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        throw error
      }

      setProgress(data || {
        business_baseline_completed: false,
        customer_segments_completed: false,
        competitor_snapshot_completed: false,
        data_readiness_percent: 70,
      })
    } catch (err) {
      console.error('Error loading progress:', err)
      setProgress({
        business_baseline_completed: false,
        customer_segments_completed: false,
        competitor_snapshot_completed: false,
        data_readiness_percent: 70,
      })
    } finally {
      setLoading(false)
    }
  }

  const getFlowStatus = (flowId) => {
    if (!progress) return 'locked'
    const fieldName = `${flowId}_completed`
    return progress[fieldName] ? 'completed' : 'available'
  }

  const completedCount = progress
    ? [
        progress.business_baseline_completed,
        progress.customer_segments_completed,
        progress.competitor_snapshot_completed,
      ].filter(Boolean).length
    : 0

  const dataReadiness = 70 + (completedCount * 6) // Each flow adds ~6%

  const handleStartFlow = (flow) => {
    navigate(flow.path)
  }

  if (loading) {
    return (
      <div className="autonomous-setup">
        <div className="setup-loading">
          <div className="spinner"></div>
          <p>Loading your progress...</p>
        </div>
        <BottomToolbar />
      </div>
    )
  }

  return (
    <div className="autonomous-setup">
      {/* Header */}
      <div className="setup-header">
        <button className="back-btn" onClick={() => navigate('/crm')}>
          ← Back
        </button>
        <div className="header-text">
          <h1>Setup Your Autonomous AI</h1>
          <p>Answer a few questions to unlock AI that runs your business</p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="setup-progress">
        <div className="progress-visual">
          <div className="progress-circle">
            <svg viewBox="0 0 100 100">
              <circle
                className="progress-bg"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              <circle
                className="progress-fill"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${dataReadiness * 2.83} 283`}
                transform="rotate(-90 50 50)"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#5e17eb" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="progress-text">
              <span className="progress-percent">{dataReadiness}%</span>
              <span className="progress-label">Ready</span>
            </div>
          </div>
        </div>

        <div className="progress-info">
          <h3>AI Data Readiness</h3>
          <p>
            {completedCount === 0 && 'Complete these flows to unlock full AI autonomy'}
            {completedCount === 1 && '1 of 3 flows complete - keep going!'}
            {completedCount === 2 && '2 of 3 flows complete - almost there!'}
            {completedCount === 3 && 'All flows complete! Your AI is ready.'}
          </p>
          <div className="time-estimate">
            <span className="time-icon">⏱️</span>
            <span>~{8 - (completedCount * 2.5)} minutes remaining</span>
          </div>
        </div>
      </div>

      {/* What Gets Unlocked */}
      <div className="unlock-preview">
        <h3>What you'll unlock:</h3>
        <div className="unlock-items">
          <div className={`unlock-item ${dataReadiness >= 76 ? 'active' : ''}`}>
            <span className="unlock-icon">🤖</span>
            <span>AI Offer Optimization</span>
          </div>
          <div className={`unlock-item ${dataReadiness >= 82 ? 'active' : ''}`}>
            <span className="unlock-icon">📈</span>
            <span>Smart Revenue Projections</span>
          </div>
          <div className={`unlock-item ${dataReadiness >= 88 ? 'active' : ''}`}>
            <span className="unlock-icon">⚡</span>
            <span>Full Autonomous Mode</span>
          </div>
        </div>
      </div>

      {/* Flow Cards */}
      <div className="setup-flows">
        {FLOWS.map((flow, index) => {
          const status = getFlowStatus(flow.id)
          const isNext = status === 'available' &&
            FLOWS.slice(0, index).every(f => getFlowStatus(f.id) === 'completed')

          return (
            <div
              key={flow.id}
              className={`flow-card ${status} ${isNext ? 'next' : ''}`}
              onClick={() => status !== 'locked' && handleStartFlow(flow)}
            >
              <div className="flow-card-header">
                <span className="flow-icon">{flow.icon}</span>
                <div className="flow-meta">
                  <span className="flow-number">Flow {index + 1}</span>
                  <span className="flow-duration">{flow.duration}</span>
                </div>
                {status === 'completed' && (
                  <span className="flow-check">✓</span>
                )}
              </div>

              <h3 className="flow-title">{flow.title}</h3>
              <p className="flow-description">{flow.description}</p>

              <div className="flow-unlocks">
                <span className="unlocks-label">Unlocks:</span>
                <ul>
                  {flow.dataUnlocked.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {status === 'available' && (
                <button className="flow-start-btn">
                  {isNext ? 'Start Now →' : 'Start'}
                </button>
              )}
              {status === 'completed' && (
                <button className="flow-edit-btn">
                  Edit Answers
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Completion CTA */}
      {completedCount === 3 && (
        <div className="setup-complete">
          <div className="complete-icon">🎉</div>
          <h3>Your AI is Fully Armed!</h3>
          <p>All data captured. Your autonomous system is ready to help you build and optimize your business.</p>
          <button
            className="complete-cta"
            onClick={() => navigate('/crm')}
          >
            Return to Dashboard
          </button>
        </div>
      )}

      <BottomToolbar />
    </div>
  )
}
