/**
 * CRM Sales - Pipeline Manager
 * Kanban-style deal pipeline with drag-drop stages
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  DEAL_STAGES,
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
} from '../../lib/crm'
import { LeadScoreSliders, LeadScoreBadge, ScriptsModal, ScreenshotUpload } from '../../components/crm'
import './CRMSales.css'

export default function CRMSales() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dealsByStage, setDealsByStage] = useState({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [leadScores, setLeadScores] = useState(null)
  const [showUnscoredPrompt, setShowUnscoredPrompt] = useState(false)
  const [unscoredDeals, setUnscoredDeals] = useState([])
  const [showScriptsModal, setShowScriptsModal] = useState(false)
  const [showScreenshotUpload, setShowScreenshotUpload] = useState(false)
  const [userProducts, setUserProducts] = useState(PRODUCTS)
  const [hasCustomProducts, setHasCustomProducts] = useState(false)
  const [newDeal, setNewDeal] = useState({
    contact_name: '',
    contact_email: '',
    product_type: 'Core Offer',
    value: 497,
    source: 'Manual',
    notes: '',
  })

  useEffect(() => {
    if (user?.id) {
      loadDeals()
      loadUserProducts()
    }
  }, [user?.id])

  async function loadDeals() {
    setLoading(true)
    try {
      const result = await fetchDealsByStage(user.id)
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
    }
  }

  async function handleMoveStage(deal, newStatus) {
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
    }
    setSelectedDeal(null)
  }

  async function handleDeleteDeal(deal) {
    if (!confirm('Delete this deal?')) return

    const result = await deleteDeal(deal.id, user.id)
    if (!result.error) {
      setDealsByStage(prev => ({
        ...prev,
        [deal.status]: (prev[deal.status] || []).filter(d => d.id !== deal.id),
      }))
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
    }

    setShowScreenshotUpload(false)
  }

  const activeStages = DEAL_STAGES.filter(s => s !== 'lost')

  if (loading) {
    return (
      <div className="crm-sales">
        <div className="crm-loading">
          <div className="crm-spinner"></div>
          <p>Loading pipeline...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="crm-sales">
      <header className="sales-header">
        <button className="back-btn" onClick={() => navigate('/crm')}>
          ← Back
        </button>
        <div className="header-content">
          <h1>Sales Pipeline</h1>
          <div className="header-stats">
            <span className="stat-item">
              💰 ${stats.currentRevenue.toLocaleString()} this month
            </span>
            <span className="stat-item">
              📊 ${stats.pipelineValue.toLocaleString()} in pipeline
            </span>
          </div>
        </div>
        <button className="screenshot-btn" onClick={() => setShowScreenshotUpload(true)}>
          📸 From Screenshot
        </button>
        <button className="add-btn" onClick={() => setShowAddModal(true)}>
          + Add Deal
        </button>
      </header>

      {/* Pipeline Columns */}
      <div className="pipeline-grid">
        {activeStages.map(stage => (
          <div key={stage} className={`pipeline-column stage-${stage}`}>
            <div className="column-header">
              <span className="column-title">{STAGE_INFO[stage].label}</span>
              <span className="column-count">{(dealsByStage[stage] || []).length}</span>
            </div>
            <div className="column-deals">
              {(dealsByStage[stage] || []).map(deal => (
                <div
                  key={deal.id}
                  className="deal-card"
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
                  <div className="deal-meta">
                    <span className="deal-probability">{deal.probability}%</span>
                    <span className="deal-source">{deal.source}</span>
                  </div>
                </div>
              ))}
              {(dealsByStage[stage] || []).length === 0 && (
                <div className="empty-column">
                  <p>No deals</p>
                </div>
              )}
            </div>
          </div>
        ))}
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
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="deal-modal" onClick={e => e.stopPropagation()}>
            <h3>Add New Deal</h3>
            <form onSubmit={handleCreateDeal}>
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
                  {hasCustomProducts && <span className="custom-products-badge">From Offer Builder</span>}
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
            </div>
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
                📜 Scripts
              </button>
              <button className="save-btn" onClick={handleSaveLeadScores}>
                Save Scores
              </button>
              <button className="cancel-btn" onClick={() => setSelectedDeal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unscored Deals Prompt */}
      {showUnscoredPrompt && (
        <div className="modal-overlay" onClick={dismissUnscoredPrompt}>
          <div className="deal-modal unscored-modal" onClick={e => e.stopPropagation()}>
            <div className="unscored-icon">📊</div>
            <h3>Score Your Leads</h3>
            <p>
              You have <strong>{unscoredDeals.length}</strong> deal{unscoredDeals.length !== 1 ? 's' : ''} without
              lead scores. Scoring helps you prioritize the hottest leads.
            </p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={dismissUnscoredPrompt}>
                Skip for now
              </button>
              <button className="save-btn" onClick={startScoringDeals}>
                Start Scoring
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scripts Modal */}
      {showScriptsModal && selectedDeal && (
        <ScriptsModal
          deal={selectedDeal}
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
    </div>
  )
}
