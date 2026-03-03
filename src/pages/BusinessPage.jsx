import { useState } from 'react'
import useBusinessPageData from '../hooks/useBusinessPageData'
import { useSubscription } from '../hooks/useSubscription'
import { isPaidQuest } from '../lib/subscriptionService'
import ChallengeProjectSelector from '../components/ChallengeProjectSelector'
import BusinessSetup from '../components/BusinessSetup'
import './BusinessPage.css'

const STAGE_DOTS = [
  { id: 0.9, label: 'Setup' },
  { id: 1, label: 'Validate' },
  { id: 2, label: 'Product' },
  { id: 3, label: 'Test' },
  { id: 4, label: 'Offer' },
  { id: 5, label: 'Campaign' },
  { id: 6, label: 'Launch' },
  { id: 7, label: 'Growth' },
]

export default function BusinessPage() {
  const {
    loading, user, projects, selectedProject, selectProject,
    showProjectSelector, setShowProjectSelector,
    activeStageTab, setActiveStageTab,
    stageQuests, isQuestCompleted, stageCompletedCount,
    stageProgressPct, nextQuest, completedStages,
    currentStageConfig, stageProgress, refreshData
  } = useBusinessPageData()

  const { hasSubscription } = useSubscription()

  if (loading) {
    return (
      <div className="business-page">
        <div className="bp-loading">
          <div className="bp-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Project selector overlay
  if (showProjectSelector) {
    return (
      <div className="business-page">
        <ChallengeProjectSelector
          onSelect={(project) => selectProject(project)}
          currentProjectId={selectedProject?.id}
        />
      </div>
    )
  }

  const stageName = currentStageConfig?.name || `Stage ${activeStageTab}`
  const stageDesc = currentStageConfig?.description || ''
  const ringR = 30
  const ringCircumference = 2 * Math.PI * ringR
  const ringOffset = ringCircumference * (1 - stageProgressPct / 100)

  return (
    <div className="business-page">

      {/* 1 — HERO */}
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <div className="hero-project">
              {selectedProject?.name || 'No Project Yet'}
            </div>
            <h1 className="hero-title">
              {activeStageTab === 0.9 ? 'Setup' : `Stage ${activeStageTab}: ${stageName}`}
            </h1>
            <p className="hero-desc">{stageDesc}</p>
            {projects.length > 0 && (
              <button
                className="hero-switch"
                onClick={() => setShowProjectSelector(true)}
              >
                Switch Project ▾
              </button>
            )}
          </div>
          <div className="ring-wrap">
            <svg viewBox="0 0 68 68">
              <circle className="ring-bg" cx="34" cy="34" r={ringR} />
              <circle
                className="ring-val"
                cx="34" cy="34" r={ringR}
                style={{
                  strokeDasharray: ringCircumference,
                  strokeDashoffset: ringOffset
                }}
              />
            </svg>
            <span className="ring-label">{stageProgressPct}%</span>
          </div>
        </div>
      </div>

      {/* 2 — STAGE DOTS */}
      <div className="card stage-card">
        <div className="dots">
          {STAGE_DOTS.map(dot => {
            const isDone = completedStages.includes(dot.id)
            const isCurrent = activeStageTab === dot.id
            const dotClass = isDone ? 'done' : isCurrent ? 'current' : 'locked'
            const itemClass = isDone ? 'done' : isCurrent ? 'current' : ''

            return (
              <div
                key={dot.id}
                className={`dot-item ${itemClass}`}
                onClick={() => setActiveStageTab(dot.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className={`dot-circle ${dotClass}`}>
                  {isDone ? '✓' : dot.id === 0.9 ? 'S' : dot.id}
                </div>
                <span className="dot-label">{dot.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3 — STAGE 0.9: BUSINESS SETUP */}
      {activeStageTab === 0.9 && (
        <div className="card">
          <BusinessSetup
            userId={user?.id}
            existingProject={selectedProject}
            userPersona={stageProgress?.persona}
            onSetupComplete={(project) => {
              selectProject(project)
              refreshData()
            }}
          />
        </div>
      )}

      {/* 4 — UP NEXT CARD (stages 1-7 only, when there's an incomplete quest) */}
      {activeStageTab !== 0.9 && nextQuest && (
        <div className="card next-card">
          <span className="next-eyebrow">Up Next</span>
          <div className="next-name">
            {nextQuest.isExplainer ? '📝' : '🎯'} {nextQuest.name}
          </div>
          <div className="next-meta">
            {nextQuest.isExplainer ? 'Explainer' : nextQuest.type || 'Quest'}
            {' • '}
            {isPaidQuest(nextQuest) ? (hasSubscription ? 'Included' : 'Paid') : 'Free'}
          </div>
          {nextQuest.inputType === 'flow' ? (
            <a
              href={selectedProject?.id
                ? `${nextQuest.flow_route}?projectId=${selectedProject.id}`
                : nextQuest.flow_route}
              className="gold-btn"
            >
              Start Quest →
            </a>
          ) : (
            <button className="gold-btn" disabled>
              Start Quest →
            </button>
          )}
        </div>
      )}

      {/* 5 — QUEST LIST (stages 1-7) */}
      {activeStageTab !== 0.9 && stageQuests.length > 0 && (
        <div className="card">
          <div className="quest-title">
            Stage {activeStageTab} Quests
          </div>
          {stageQuests.map(quest => {
            const completed = isQuestCompleted(quest.id)
            const paid = isPaidQuest(quest) && !hasSubscription

            return (
              <div key={quest.id} className={`q-row ${completed ? 'done' : ''}`}>
                <div className={`q-icon ${completed ? 'done' : 'todo'}`}>
                  {completed ? '✅' : quest.isExplainer ? '📝' : '🎯'}
                </div>
                <div className="q-info">
                  <div className="q-name">{quest.name}</div>
                  <div className="q-sub">
                    {isPaidQuest(quest) ? 'Paid' : 'Free'}
                    {' • '}
                    {completed ? 'Completed' : quest.isExplainer ? 'Explainer' : `Stage ${activeStageTab}`}
                  </div>
                </div>
                {completed ? (
                  <button className="q-btn done-btn">Done</button>
                ) : quest.inputType === 'flow' ? (
                  <a
                    href={selectedProject?.id
                      ? `${quest.flow_route}?projectId=${selectedProject.id}`
                      : quest.flow_route}
                    className="q-btn start-btn"
                    style={{ textDecoration: 'none', textAlign: 'center' }}
                  >
                    {paid ? '🔒' : 'Start'}
                  </a>
                ) : (
                  <button className="q-btn start-btn" disabled={paid}>
                    {paid ? '🔒' : 'Start'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state — stage has no quests */}
      {activeStageTab !== 0.9 && stageQuests.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: '14px', color: '#9a9daa' }}>
            No quests for this stage yet.
          </p>
        </div>
      )}

    </div>
  )
}
