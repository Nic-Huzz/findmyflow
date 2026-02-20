/**
 * CRM Sales - Pipeline Manager
 * Kanban-style deal pipeline with drag-drop stages
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { hapticLight } from '../../lib/haptics'
import {
  DEAL_STAGES,
  ACTIVE_STAGES,
  STAGE_INFO,
  PRODUCTS,
  fetchDealsByStage,
  createDeal,
  updateDeal,
  updateDealStage,
  deleteDeal,
  calculateRevenueStats,
  getTransitionPoints,
  addPoints,
  fetchUserProducts,
  saveDealOutcome,
  updateCurrentMonthActuals,
  scheduleMeeting,
  syncCRMToFunnel,
} from '../../lib/crm'
import { LeadScoreSliders, LeadScoreBadge, ScriptsModal, ScreenshotUpload, DealOutcomeModal, PlaybookDrawer, PullToRefresh } from '../../components/crm'
import './Sales.css'

export default function Sales() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dealsByStage, setDealsByStage] = useState({})
  const [projects, setProjects] = useState([])
  const [filterProject, setFilterProject] = useState('all')
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [leadScores, setLeadScores] = useState(null)
  const [showUnscoredPrompt, setShowUnscoredPrompt] = useState(false)
  const [unscoredDeals, setUnscoredDeals] = useState([])
  const [showScriptsModal, setShowScriptsModal] = useState(false)
  const [showScreenshotUpload, setShowScreenshotUpload] = useState(false)
  const [showOutcomeModal, setShowOutcomeModal] = useState(null) // 'won' or 'lost'
  const [pendingOutcomeDeal, setPendingOutcomeDeal] = useState(null)
  const [userProducts, setUserProducts] = useState(PRODUCTS)
  const [hasCustomProducts, setHasCustomProducts] = useState(false)
  const [playbookDeal, setPlaybookDeal] = useState(null)
  const [expandedStages, setExpandedStages] = useState(new Set())
  const [newDeal, setNewDeal] = useState({
    contact_name: '',
    contact_email: '',
    product_type: 'Core Offer',
    value: 497,
    source: 'Manual',
    notes: '',
  })

  // Hide bottom toolbar when any modal is open
  useEffect(() => {
    const anyModalOpen = showAddModal || !!selectedDeal || showScriptsModal || showScreenshotUpload || !!showOutcomeModal || !!playbookDeal
    if (anyModalOpen) {
      document.body.classList.add('modal-active')
    } else {
      document.body.classList.remove('modal-active')
    }
    return () => document.body.classList.remove('modal-active')
  }, [showAddModal, selectedDeal, showUnscoredPrompt, showScriptsModal, showScreenshotUpload, showOutcomeModal, playbookDeal])

  useEffect(() => {
    if (user?.id) {
      loadDeals()
      loadUserProducts()
    }
  }, [user?.id])

  async function loadDeals() {
    setLoading(true)
    try {
      const [result, projectsRes] = await Promise.all([
        fetchDealsByStage(user.id),
        supabase
          .from('user_projects')
          .select('id, name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      if (projectsRes.data) setProjects(projectsRes.data)

      if (result.data) {
        setDealsByStage(result.data)

        // Check for unscored deals (no pain_score)
        const allDeals = Object.values(result.data).flat()
        const unscored = allDeals.filter(d =>
          d.pain_score === null && !['won', 'lost'].includes(d.status)
        )
        if (unscored.length > 0 && !localStorage.getItem('crm_scoring_dismissed')) {
          setUnscoredDeals(unscored)
          setShowUnscoredPrompt(true)
        }
      }
    } catch (err) {
      console.error('Error loading deals:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadUserProducts() {
    const { products, isCustom } = await fetchUserProducts(user.id)
    setUserProducts(products)
    setHasCustomProducts(isCustom)

    // Update default product in newDeal to first available product
    const firstProduct = Object.keys(products)[0]
    if (firstProduct) {
      setNewDeal(prev => ({
        ...prev,
        product_type: firstProduct,
        value: products[firstProduct]
      }))
    }
  }

  const allDeals = useMemo(() => {
    return Object.values(dealsByStage).flat()
  }, [dealsByStage])

  const stats = useMemo(() => {
    return calculateRevenueStats(allDeals)
  }, [allDeals])

  async function handleCreateDeal(e) {
    e.preventDefault()
    const result = await createDeal(user.id, newDeal)
    if (result.data) {
      setDealsByStage(prev => ({
        ...prev,
        lead: [result.data, ...(prev.lead || [])],
      }))
      setShowAddModal(false)
      setNewDeal({
        contact_name: '',
        contact_email: '',
        product_type: 'Core Offer',
        value: 497,
        source: 'Manual',
        notes: '',
      })

      // Sync to funnel_metrics
      syncCRMToFunnel(user.id).catch(err => {
        console.error('Error syncing CRM to funnel metrics:', err)
      })
    }
  }

  async function handleMoveStage(deal, newStatus) {
    // Intercept won/lost to capture outcome data
    if (newStatus === 'won' || newStatus === 'lost') {
      setPendingOutcomeDeal({ deal, newStatus })
      setShowOutcomeModal(newStatus)
      return
    }

    await executeMoveStage(deal, newStatus)
  }

  async function executeMoveStage(deal, newStatus, outcomeData = null) {
    const oldStatus = deal.status
    const result = await updateDealStage(deal.id, user.id, newStatus)

    if (result.data) {
      // Update local state
      setDealsByStage(prev => {
        const updated = { ...prev }
        updated[oldStatus] = (updated[oldStatus] || []).filter(d => d.id !== deal.id)
        updated[newStatus] = [result.data, ...(updated[newStatus] || [])]
        return updated
      })

      // Award points for stage progression
      const points = getTransitionPoints(oldStatus, newStatus)
      if (points > 0) {
        await addPoints(user.id, points)
      }

      // Save outcome data if provided (for won/lost)
      if (outcomeData && (newStatus === 'won' || newStatus === 'lost')) {
        await saveDealOutcome(user.id, deal.id, outcomeData)

        // Update deal with value and offer category data (for wins)
        if (newStatus === 'won') {
          const dealUpdates = {}
          if (outcomeData.final_value && outcomeData.final_value !== deal.value) {
            dealUpdates.value = outcomeData.final_value
          }
          if (outcomeData.offer_category) {
            dealUpdates.offer_category = outcomeData.offer_category
            dealUpdates.offer_type = outcomeData.offer_type || null
          }
          if (outcomeData.is_continuity) {
            dealUpdates.is_continuity = true
            dealUpdates.continuity_status = 'active'
            dealUpdates.continuity_start_date = new Date().toISOString()
            dealUpdates.monthly_value = parseFloat(outcomeData.monthly_value) || null
          }
          if (Object.keys(dealUpdates).length > 0) {
            await updateDeal(deal.id, user.id, dealUpdates)
          }
        }
      }

      // Auto-update funnel actuals when deals move stages
      updateCurrentMonthActuals(user.id).catch(err => {
        console.error('Error updating funnel actuals:', err)
      })

      // Sync to funnel_metrics for weekly tracking
      syncCRMToFunnel(user.id).catch(err => {
        console.error('Error syncing CRM to funnel metrics:', err)
      })
    }
    setSelectedDeal(null)
  }

  async function handleOutcomeSave(outcomeData) {
    if (pendingOutcomeDeal) {
      await executeMoveStage(pendingOutcomeDeal.deal, pendingOutcomeDeal.newStatus, outcomeData)
    }
    setShowOutcomeModal(null)
    setPendingOutcomeDeal(null)
  }

  function handleOutcomeCancel() {
    // Move without capturing outcome data
    if (pendingOutcomeDeal) {
      executeMoveStage(pendingOutcomeDeal.deal, pendingOutcomeDeal.newStatus)
    }
    setShowOutcomeModal(null)
    setPendingOutcomeDeal(null)
  }

  async function handleDeleteDeal(deal) {
    if (!confirm('Delete this deal?')) return

    const result = await deleteDeal(deal.id, user.id)
    if (!result.error) {
      setDealsByStage(prev => ({
        ...prev,
        [deal.status]: (prev[deal.status] || []).filter(d => d.id !== deal.id),
      }))

      // Sync to funnel_metrics
      syncCRMToFunnel(user.id).catch(err => {
        console.error('Error syncing CRM to funnel metrics:', err)
      })
    }
    setSelectedDeal(null)
  }

  function handleProductChange(type) {
    setNewDeal(prev => ({
      ...prev,
      product_type: type,
      value: userProducts[type] || 497,
    }))
  }

  function handleSelectDeal(deal) {
    setSelectedDeal(deal)
    setLeadScores({
      pain_score: deal.pain_score || 5,
      pain_notes: deal.pain_notes || '',
      trust_score: deal.trust_score || 5,
      trust_notes: deal.trust_notes || '',
      urgency_score: deal.urgency_score || 5,
      urgency_notes: deal.urgency_notes || '',
      fit_score: deal.fit_score || 5,
      fit_notes: deal.fit_notes || '',
    })
  }

  async function handleSaveLeadScores() {
    if (!selectedDeal || !leadScores) return

    const result = await updateDeal(selectedDeal.id, user.id, leadScores)
    if (result.data) {
      // Update local state
      setDealsByStage(prev => {
        const updated = { ...prev }
        const stage = selectedDeal.status
        updated[stage] = (updated[stage] || []).map(d =>
          d.id === selectedDeal.id ? { ...d, ...leadScores, ...result.data } : d
        )
        return updated
      })
      setSelectedDeal(null)
    }
  }

  function dismissUnscoredPrompt() {
    localStorage.setItem('crm_scoring_dismissed', 'true')
    setShowUnscoredPrompt(false)
  }

  function startScoringDeals() {
    setShowUnscoredPrompt(false)
    if (unscoredDeals.length > 0) {
      handleSelectDeal(unscoredDeals[0])
    }
  }

  async function handleScreenshotDeal(dealData, _screenshotFile) {
    // Create the deal with extracted data
    const result = await createDeal(user.id, {
      contact_name: dealData.contact_name,
      contact_email: dealData.contact_email,
      product_type: dealData.product_type,
      value: dealData.value,
      status: dealData.status,
      source: dealData.source,
      notes: dealData.notes,
    })

    if (result.data) {
      // Add lead scores if present
      if (dealData.pain_score) {
        await updateDeal(result.data.id, user.id, {
          pain_score: dealData.pain_score,
          trust_score: dealData.trust_score,
          urgency_score: dealData.urgency_score,
          fit_score: dealData.fit_score,
        })
      }

      // Update local state
      setDealsByStage(prev => ({
        ...prev,
        [dealData.status]: [result.data, ...(prev[dealData.status] || [])],
      }))

      // Sync to funnel_metrics
      syncCRMToFunnel(user.id).catch(err => {
        console.error('Error syncing CRM to funnel metrics:', err)
      })
    }

    setShowScreenshotUpload(false)
  }

  function toggleStage(stage) {
    setExpandedStages(prev => {
      const next = new Set(prev)
      if (next.has(stage)) {
        next.delete(stage)
      } else {
        next.add(stage)
      }
      return next
    })
    hapticLight()
  }

  function handleScreenshotCapture() {
    setShowAddMenu(false)
    hapticLight()
    setShowScreenshotUpload(true)
  }

  function handleManualAdd() {
    setShowAddMenu(false)
    hapticLight()
    setShowAddModal(true)
  }

  // Projects that have deals
  const projectsWithDeals = useMemo(() => {
    const projectIds = new Set()
    Object.values(dealsByStage).flat().forEach(deal => {
      if (deal.project_id) projectIds.add(deal.project_id)
    })
    return projects.filter(p => projectIds.has(p.id))
  }, [dealsByStage, projects])

  // Filter deals by project
  const filteredDealsByStage = useMemo(() => {
    if (filterProject === 'all') return dealsByStage
    const filtered = {}
    for (const [stage, deals] of Object.entries(dealsByStage)) {
      if (filterProject === 'no-project') {
        filtered[stage] = deals.filter(d => !d.project_id)
      } else {
        filtered[stage] = deals.filter(d => d.project_id === filterProject)
      }
    }
    return filtered
  }, [dealsByStage, filterProject])

  // Active stages for pipeline view (excludes lost, includes post-sale stages)
  const activeStages = [...ACTIVE_STAGES, 'won', 'delivering', 'completed']

  if (loading) {
    return (
      <div className="crm-sales">
        <div className="sales-toolbar">
          <button className="back-btn" onClick={() => navigate('/crm/nurture')}>←</button>
          <h2 className="toolbar-title">Sales Pipeline</h2>
        </div>
        <div className="crm-loading">
          <div className="crm-spinner"></div>
          <p>Loading your deals...</p>
        </div>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={loadDeals}>
    <div className="crm-sales">
      {/* Top Toolbar */}
      <div className="sales-toolbar">
        <button className="back-btn" onClick={() => navigate('/crm/nurture')}>
          ←
        </button>
        <h2 className="toolbar-title">Sales Pipeline</h2>
      </div>

      {/* Stats + Actions Card */}
      <div className="sales-stats-card">
        <div className="stats-row">
          <div className="stat-cell">
            <span className="stat-label">This Month</span>
            <span className="stat-value stat-earned">${stats.currentRevenue.toLocaleString()}</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-cell">
            <span className="stat-label">In Pipeline</span>
            <span className="stat-value stat-pipeline">${stats.pipelineValue.toLocaleString()}</span>
          </div>
        </div>
        <div className="actions-row">
          <div className="add-btn-wrapper">
            <button className="add-btn" onClick={() => { setShowAddMenu(!showAddMenu); hapticLight() }}>
              + Add Deal
            </button>
            {showAddMenu && (
              <>
                <div className="add-menu-backdrop" onClick={() => setShowAddMenu(false)} />
                <div className="add-menu">
                  <button className="add-menu-item" onClick={handleManualAdd}>
                    <span className="add-menu-icon">✏️</span>
                    <span>Manual Entry</span>
                  </button>
                  <button className="add-menu-item" onClick={handleScreenshotCapture}>
                    <span className="add-menu-icon">📸</span>
                    <span>Screenshot Analysis</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Action Links */}
      <div className="pipeline-action-links">
        <button className="pipeline-action-btn" onClick={() => navigate('/crm/warm-outreach')}>
          🤝 Outreach
        </button>
        <button className="pipeline-action-btn" onClick={() => navigate('/crm/ascension')}>
          🚀 Upsell
        </button>
      </div>

      {/* Project Filters */}
      {projectsWithDeals.length > 0 && (
        <div className="pipeline-filters">
          <button
            className={`filter-chip ${filterProject === 'all' ? 'active' : ''}`}
            onClick={() => setFilterProject('all')}
          >
            All Projects
          </button>
          {projectsWithDeals.map(project => (
            <button
              key={project.id}
              className={`filter-chip ${filterProject === project.id ? 'active' : ''}`}
              onClick={() => setFilterProject(project.id)}
            >
              {project.name}
            </button>
          ))}
          <button
            className={`filter-chip ${filterProject === 'no-project' ? 'active' : ''}`}
            onClick={() => setFilterProject('no-project')}
          >
            No Project
          </button>
        </div>
      )}

      {/* Unscored Deals Banner */}
      {showUnscoredPrompt && (
        <div className="unscored-banner" onClick={startScoringDeals}>
          <div className="unscored-banner-left">
            <span className="unscored-banner-icon">📊</span>
            <div>
              <strong>{unscoredDeals.length} unscored deal{unscoredDeals.length !== 1 ? 's' : ''}</strong>
              <span className="unscored-banner-sub">Score leads to find hot opportunities</span>
            </div>
          </div>
          <button
            className="unscored-banner-dismiss"
            onClick={(e) => { e.stopPropagation(); dismissUnscoredPrompt() }}
          >
            ×
          </button>
        </div>
      )}

      {/* Pipeline Columns (Accordion) */}
      <div className="pipeline-accordion">
        {activeStages.map(stage => {
          const stageDeals = filteredDealsByStage[stage] || []
          const isExpanded = expandedStages.has(stage)
          const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0)

          return (
            <div key={stage} className={`accordion-stage stage-${stage} ${isExpanded ? 'expanded' : ''}`}>
              <button
                className="accordion-header"
                onClick={() => toggleStage(stage)}
                style={{ '--stage-color': STAGE_INFO[stage].color }}
              >
                <div className="accordion-header-left">
                  <span className="accordion-color-dot" style={{ background: STAGE_INFO[stage].color }} />
                  <span className="accordion-title">{STAGE_INFO[stage].label}</span>
                  <span className="accordion-count" style={{ background: STAGE_INFO[stage].color }}>
                    {stageDeals.length}
                  </span>
                </div>
                <div className="accordion-header-right">
                  {stageValue > 0 && (
                    <span className="accordion-value">${stageValue.toLocaleString()}</span>
                  )}
                  <span className={`accordion-chevron ${isExpanded ? 'open' : ''}`}>›</span>
                </div>
              </button>

              {isExpanded && (
                <div className="accordion-body">
                  {stageDeals.map((deal, idx) => {
                    const daysSinceUpdate = Math.floor((Date.now() - new Date(deal.updated_at)) / (1000 * 60 * 60 * 24))
                    const isStale = daysSinceUpdate >= 7 && !['won', 'lost'].includes(deal.status)
                    const isVeryStale = daysSinceUpdate >= 14 && !['won', 'lost'].includes(deal.status)

                    return (
                      <div
                        key={deal.id}
                        className={`deal-card ${isVeryStale ? 'deal-very-stale' : isStale ? 'deal-stale' : ''}`}
                        style={{ animationDelay: `${Math.min(idx * 0.04, 0.4)}s` }}
                        onClick={() => handleSelectDeal(deal)}
                      >
                        <div className="deal-header">
                          <div className="deal-name">{deal.contact_name}</div>
                          <LeadScoreBadge
                            totalScore={deal.lead_total_score}
                            temperature={deal.lead_temperature}
                            compact
                          />
                        </div>
                        <div className="deal-product">{deal.product_type}</div>
                        <div className="deal-value">${deal.value.toLocaleString()}</div>
                        {deal.status === 'booked' && deal.meeting_scheduled_at && (
                          <div className="deal-meeting">
                            📅 {new Date(deal.meeting_scheduled_at).toLocaleDateString()}
                          </div>
                        )}
                        {isStale && (
                          <div className={`deal-stale-badge ${isVeryStale ? 'very-stale' : ''}`}>
                            ⚠️ {daysSinceUpdate}d ago
                          </div>
                        )}
                        <div className="deal-meta">
                          <span className="deal-probability">{deal.probability}%</span>
                          <span className="deal-source">{deal.source}</span>
                        </div>
                      </div>
                    )
                  })}
                  {stageDeals.length === 0 && (
                    <div className="empty-column">
                      <p>No deals yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Lost Deals (Collapsed) */}
      {(dealsByStage.lost || []).length > 0 && (
        <div className="lost-deals">
          <h3>Lost Deals ({dealsByStage.lost.length})</h3>
          <div className="lost-list">
            {dealsByStage.lost.slice(0, 5).map(deal => (
              <span key={deal.id} className="lost-item">
                {deal.contact_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add Deal Modal */}
      {showAddModal && (
        <div className="modal-overlay modal-top" onClick={() => setShowAddModal(false)}>
          <div className="deal-modal deal-modal-top" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Deal</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateDeal} className="modal-body">
              <div className="form-field">
                <label>Contact Name *</label>
                <input
                  type="text"
                  required
                  value={newDeal.contact_name}
                  onChange={e => setNewDeal(prev => ({ ...prev, contact_name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input
                  type="email"
                  value={newDeal.contact_email}
                  onChange={e => setNewDeal(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
              <div className="form-field">
                <label>
                  Product
                  {hasCustomProducts && <span className="custom-products-badge">From Product Builder</span>}
                </label>
                <select
                  value={newDeal.product_type}
                  onChange={e => handleProductChange(e.target.value)}
                >
                  {Object.entries(userProducts).map(([name, price]) => (
                    <option key={name} value={name}>
                      {name} (${price.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Deal Value ($)</label>
                <input
                  type="number"
                  min="0"
                  value={newDeal.value}
                  onChange={e => setNewDeal(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="form-field">
                <label>Source</label>
                <select
                  value={newDeal.source}
                  onChange={e => setNewDeal(prev => ({ ...prev, source: e.target.value }))}
                >
                  <option value="Manual">Manual Entry</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Referral">Referral</option>
                  <option value="Website">Website</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-field">
                <label>Notes</label>
                <textarea
                  value={newDeal.notes}
                  onChange={e => setNewDeal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional context..."
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Add Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deal Detail Modal */}
      {selectedDeal && (
        <div className="modal-overlay" onClick={() => setSelectedDeal(null)}>
          <div className="deal-modal detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedDeal.contact_name}</h3>
              <LeadScoreBadge
                totalScore={leadScores ? (leadScores.pain_score + leadScores.trust_score + leadScores.urgency_score + leadScores.fit_score) : selectedDeal.lead_total_score}
                temperature={null}
              />
              <button className="modal-close-btn" onClick={() => setSelectedDeal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="deal-details">
                <p><strong>Product:</strong> {selectedDeal.product_type}</p>
                <p><strong>Value:</strong> ${selectedDeal.value.toLocaleString()}</p>
                <p><strong>Stage:</strong> {STAGE_INFO[selectedDeal.status].label}</p>
                <p><strong>Probability:</strong> {selectedDeal.probability}%</p>
                <p><strong>Source:</strong> {selectedDeal.source}</p>
                {selectedDeal.contact_email && (
                  <p><strong>Email:</strong> {selectedDeal.contact_email}</p>
                )}
                {selectedDeal.notes && (
                  <p><strong>Notes:</strong> {selectedDeal.notes}</p>
                )}
              </div>

              {/* Lead Scoring Section */}
              <LeadScoreSliders
                scores={leadScores}
                onChange={setLeadScores}
                showNotes={true}
              />

              <div className="stage-actions">
                <span className="stage-label">Move to:</span>
                <div className="stage-buttons">
                  {DEAL_STAGES.filter(s => s !== selectedDeal.status).map(stage => (
                    <button
                      key={stage}
                      className={`stage-btn stage-${stage}`}
                      onClick={() => handleMoveStage(selectedDeal, stage)}
                    >
                      {STAGE_INFO[stage].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button className="delete-btn" onClick={() => handleDeleteDeal(selectedDeal)}>
                  Delete
                </button>
                <button className="scripts-btn" onClick={() => setShowScriptsModal(true)}>
                  Scripts
                </button>
                {['booked', 'showed', 'pitched', 'follow_up'].includes(selectedDeal.status) && (
                  <button
                    className="playbook-btn"
                    onClick={() => {
                      setPlaybookDeal(selectedDeal)
                      setSelectedDeal(null)
                    }}
                  >
                    {['booked', 'showed'].includes(selectedDeal.status) ? 'Prep' : 'Objection?'}
                  </button>
                )}
                <button className="save-btn" onClick={handleSaveLeadScores}>
                  Save Scores
                </button>
                <button className="cancel-btn" onClick={() => setSelectedDeal(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unscored Deals Prompt removed - replaced by inline banner above */}

      {/* Scripts Modal */}
      {showScriptsModal && selectedDeal && (
        <ScriptsModal
          deal={{ ...selectedDeal, ...leadScores }}
          userId={user.id}
          onClose={() => setShowScriptsModal(false)}
          onScriptUsed={() => {}}
        />
      )}

      {/* Screenshot Upload Modal */}
      {showScreenshotUpload && (
        <ScreenshotUpload
          onDealExtracted={handleScreenshotDeal}
          onClose={() => setShowScreenshotUpload(false)}
          existingDeals={allDeals}
        />
      )}

      {/* Deal Outcome Modal */}
      {showOutcomeModal && pendingOutcomeDeal && (
        <DealOutcomeModal
          deal={pendingOutcomeDeal.deal}
          outcome={showOutcomeModal}
          onSave={handleOutcomeSave}
          onCancel={handleOutcomeCancel}
        />
      )}

      {/* Sales Playbook Drawer */}
      {playbookDeal && (
        <PlaybookDrawer
          deal={playbookDeal}
          userId={user.id}
          onClose={() => setPlaybookDeal(null)}
          onObjectionLogged={() => {}}
        />
      )}
    </div>
    </PullToRefresh>
  )
}
