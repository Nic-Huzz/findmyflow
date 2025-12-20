/**
 * LibraryOfAnswers.jsx
 *
 * Displays all user's flow responses organized by flow type.
 * Shows clusters, key outcomes, and archived discoveries.
 * Supports filtering by project.
 *
 * Sections:
 * 1. Flow Finder (Skills, Problems, Personas, Key Outcomes)
 * 2. Money Model (Offers, Upsells, Downsells, etc.)
 * 3. Nervous System (Calibration responses)
 * 4. Healing Compass entries
 *
 * Created: Dec 2024
 * Part of project-based refactor (see docs/2024-12-20-major-refactor-plan.md)
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import './LibraryOfAnswers.css'

const SECTIONS = {
  FLOW_FINDER: 'flow_finder',
  MONEY_MODEL: 'money_model',
  NERVOUS_SYSTEM: 'nervous_system',
  HEALING_COMPASS: 'healing_compass'
}

function LibraryOfAnswers() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState(SECTIONS.FLOW_FINDER)
  const [loading, setLoading] = useState(true)
  const [expandedItem, setExpandedItem] = useState(null)

  // Project filter
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('all')

  // Flow Finder data
  const [skillsClusters, setSkillsClusters] = useState([])
  const [problemsClusters, setProblemsClusters] = useState([])
  const [personaClusters, setPersonaClusters] = useState([])
  const [keyOutcomes, setKeyOutcomes] = useState([])

  // Money Model data
  const [offers, setOffers] = useState([])
  const [upsells, setUpsells] = useState([])
  const [downsells, setDownsells] = useState([])
  const [continuity, setContinuity] = useState([])
  const [leadMagnets, setLeadMagnets] = useState([])

  // Nervous System data
  const [nervousSystemData, setNervousSystemData] = useState(null)

  // Healing Compass data
  const [healingEntries, setHealingEntries] = useState([])

  // Fetch projects on mount
  useEffect(() => {
    if (user?.id) {
      fetchProjects()
    }
  }, [user])

  // Fetch data when user or project filter changes
  useEffect(() => {
    if (user?.id) {
      fetchAllData()
    }
  }, [user, selectedProjectId])

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('user_projects')
      .select('id, name, is_primary')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true })

    setProjects(data || [])
  }

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchFlowFinderData(),
        fetchMoneyModelData(),
        fetchNervousSystemData(),
        fetchHealingCompassData()
      ])
    } catch (err) {
      console.error('Error fetching library data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchFlowFinderData = async () => {
    // Build base query for clusters
    let clustersQuery = supabase
      .from('nikigai_clusters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply project filter if selected
    if (selectedProjectId !== 'all') {
      clustersQuery = clustersQuery.eq('project_id', selectedProjectId)
    }

    const { data: clusters } = await clustersQuery

    if (clusters) {
      setSkillsClusters(clusters.filter(c => c.cluster_type === 'skills'))
      setProblemsClusters(clusters.filter(c => c.cluster_type === 'problems'))
      setPersonaClusters(clusters.filter(c => c.cluster_type === 'persona'))
    }

    // Build base query for key outcomes
    let outcomesQuery = supabase
      .from('nikigai_key_outcomes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply project filter if selected
    if (selectedProjectId !== 'all') {
      outcomesQuery = outcomesQuery.eq('project_id', selectedProjectId)
    }

    const { data: outcomes } = await outcomesQuery

    if (outcomes) {
      setKeyOutcomes(outcomes)
    }
  }

  const fetchMoneyModelData = async () => {
    // Helper to build query with optional project filter
    const buildQuery = (table) => {
      let query = supabase
        .from(table)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (selectedProjectId !== 'all') {
        query = query.eq('project_id', selectedProjectId)
      }
      return query
    }

    // Fetch all offer assessments in parallel
    const [offersRes, upsellsRes, downsellsRes, continuityRes, leadMagnetsRes] = await Promise.all([
      buildQuery('attraction_offer_assessments'),
      buildQuery('upsell_assessments'),
      buildQuery('downsell_assessments'),
      buildQuery('continuity_assessments'),
      buildQuery('lead_magnet_assessments')
    ])

    setOffers(offersRes.data || [])
    setUpsells(upsellsRes.data || [])
    setDownsells(downsellsRes.data || [])
    setContinuity(continuityRes.data || [])
    setLeadMagnets(leadMagnetsRes.data || [])
  }

  const fetchNervousSystemData = async () => {
    const { data } = await supabase
      .from('nervous_system_responses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    setNervousSystemData(data)
  }

  const fetchHealingCompassData = async () => {
    const { data } = await supabase
      .from('healing_compass_responses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setHealingEntries(data || [])
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const toggleExpand = (id) => {
    setExpandedItem(expandedItem === id ? null : id)
  }

  // Render cluster card
  const renderClusterCard = (cluster) => {
    const isExpanded = expandedItem === cluster.id

    return (
      <div key={cluster.id} className={`library-card ${isExpanded ? 'expanded' : ''}`}>
        <div className="card-header" onClick={() => toggleExpand(cluster.id)}>
          <h4>{cluster.cluster_label}</h4>
          <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
        </div>
        {isExpanded && (
          <div className="card-content">
            <p className="cluster-insight">{cluster.insight || 'No insight generated yet'}</p>
            {cluster.items && cluster.items.length > 0 && (
              <div className="cluster-items">
                <strong>Items:</strong>
                <ul>
                  {cluster.items.map((item, idx) => (
                    <li key={idx}>{typeof item === 'string' ? item : item.text || item.label}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="card-date">{formatDate(cluster.created_at)}</div>
          </div>
        )}
      </div>
    )
  }

  // Render Flow Finder section
  const renderFlowFinder = () => (
    <div className="library-section">
      {/* Skills */}
      <div className="subsection">
        <h3>Skills</h3>
        {skillsClusters.length === 0 ? (
          <p className="empty-text">No skills discovered yet. <Link to="/nikigai/skills">Start Flow Finder</Link></p>
        ) : (
          <div className="cards-grid">
            {skillsClusters.map(renderClusterCard)}
          </div>
        )}
      </div>

      {/* Problems */}
      <div className="subsection">
        <h3>Problems</h3>
        {problemsClusters.length === 0 ? (
          <p className="empty-text">No problems identified yet.</p>
        ) : (
          <div className="cards-grid">
            {problemsClusters.map(renderClusterCard)}
          </div>
        )}
      </div>

      {/* Personas */}
      <div className="subsection">
        <h3>Personas</h3>
        {personaClusters.length === 0 ? (
          <p className="empty-text">No personas created yet.</p>
        ) : (
          <div className="cards-grid">
            {personaClusters.map(renderClusterCard)}
          </div>
        )}
      </div>

      {/* Key Outcomes */}
      <div className="subsection">
        <h3>Selected Opportunities</h3>
        {keyOutcomes.length === 0 ? (
          <p className="empty-text">No opportunities selected yet.</p>
        ) : (
          <div className="cards-grid">
            {keyOutcomes.map(outcome => (
              <div key={outcome.id} className="library-card outcome-card">
                <div className="card-header">
                  <h4>
                    {outcome.selected_opportunity?.skill?.label || 'Opportunity'} →{' '}
                    {outcome.selected_opportunity?.persona?.label || 'Audience'}
                  </h4>
                </div>
                <div className="card-content">
                  <p>{outcome.selected_opportunity?.problem?.label || ''}</p>
                  <div className="card-date">{formatDate(outcome.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // Render Money Model section
  const renderMoneyModel = () => (
    <div className="library-section">
      {/* Offers */}
      <div className="subsection">
        <h3>Attraction Offers</h3>
        {offers.length === 0 ? (
          <p className="empty-text">No offers created yet. <Link to="/attraction-offer">Create Offer</Link></p>
        ) : (
          <div className="cards-grid">
            {offers.map(offer => (
              <div key={offer.id} className="library-card">
                <div className="card-header">
                  <h4>{offer.offer_name || 'Untitled Offer'}</h4>
                </div>
                <div className="card-content">
                  <p>{offer.dream_outcome || offer.description}</p>
                  <div className="card-date">{formatDate(offer.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upsells */}
      <div className="subsection">
        <h3>Upsells</h3>
        {upsells.length === 0 ? (
          <p className="empty-text">No upsells created yet.</p>
        ) : (
          <div className="cards-grid">
            {upsells.map(item => (
              <div key={item.id} className="library-card">
                <div className="card-header">
                  <h4>{item.offer_name || 'Upsell Offer'}</h4>
                </div>
                <div className="card-content">
                  <p>{item.description}</p>
                  <div className="card-date">{formatDate(item.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Downsells */}
      <div className="subsection">
        <h3>Downsells</h3>
        {downsells.length === 0 ? (
          <p className="empty-text">No downsells created yet.</p>
        ) : (
          <div className="cards-grid">
            {downsells.map(item => (
              <div key={item.id} className="library-card">
                <div className="card-header">
                  <h4>{item.offer_name || 'Downsell Offer'}</h4>
                </div>
                <div className="card-content">
                  <p>{item.description}</p>
                  <div className="card-date">{formatDate(item.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Continuity */}
      <div className="subsection">
        <h3>Continuity Offers</h3>
        {continuity.length === 0 ? (
          <p className="empty-text">No continuity offers created yet.</p>
        ) : (
          <div className="cards-grid">
            {continuity.map(item => (
              <div key={item.id} className="library-card">
                <div className="card-header">
                  <h4>{item.offer_name || 'Continuity Offer'}</h4>
                </div>
                <div className="card-content">
                  <p>{item.description}</p>
                  <div className="card-date">{formatDate(item.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lead Magnets */}
      <div className="subsection">
        <h3>Lead Magnets</h3>
        {leadMagnets.length === 0 ? (
          <p className="empty-text">No lead magnets created yet.</p>
        ) : (
          <div className="cards-grid">
            {leadMagnets.map(item => (
              <div key={item.id} className="library-card">
                <div className="card-header">
                  <h4>{item.lead_magnet_name || 'Lead Magnet'}</h4>
                </div>
                <div className="card-content">
                  <p>{item.description}</p>
                  <div className="card-date">{formatDate(item.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // Render Nervous System section
  const renderNervousSystem = () => (
    <div className="library-section">
      {!nervousSystemData ? (
        <div className="empty-section">
          <p>No nervous system calibration data yet.</p>
          <Link to="/nervous-system" className="action-link">Complete Nervous System Flow</Link>
        </div>
      ) : (
        <div className="cards-grid">
          <div className="library-card full-width">
            <div className="card-header">
              <h4>Your Nervous System Calibration</h4>
            </div>
            <div className="card-content">
              {nervousSystemData.money_limit && (
                <div className="data-row">
                  <strong>Money Limit:</strong> ${nervousSystemData.money_limit}
                </div>
              )}
              {nervousSystemData.visibility_limit && (
                <div className="data-row">
                  <strong>Visibility Limit:</strong> {nervousSystemData.visibility_limit}
                </div>
              )}
              {nervousSystemData.archetype && (
                <div className="data-row">
                  <strong>Archetype:</strong> {nervousSystemData.archetype}
                </div>
              )}
              <div className="card-date">{formatDate(nervousSystemData.created_at)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Render Healing Compass section
  const renderHealingCompass = () => (
    <div className="library-section">
      {healingEntries.length === 0 ? (
        <div className="empty-section">
          <p>No healing compass entries yet.</p>
          <Link to="/healing-compass" className="action-link">Start Healing Journey</Link>
        </div>
      ) : (
        <div className="cards-grid">
          {healingEntries.map(entry => (
            <div key={entry.id} className="library-card">
              <div className="card-header">
                <h4>{entry.title || 'Healing Entry'}</h4>
              </div>
              <div className="card-content">
                <p>{entry.content || entry.reflection}</p>
                <div className="card-date">{formatDate(entry.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="library-of-answers">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading your library...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="library-of-answers">
      <header className="library-header">
        <Link to="/me" className="back-link">← Back</Link>
        <h1>Library of Answers</h1>
        <p>All your discoveries in one place</p>

        {/* Project Filter */}
        {projects.length > 0 && (
          <div className="project-filter">
            <label htmlFor="project-select">Filter by project:</label>
            <select
              id="project-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="project-select"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} {project.is_primary ? '(Primary)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Section Tabs */}
      <div className="section-tabs">
        <button
          className={`tab ${activeSection === SECTIONS.FLOW_FINDER ? 'active' : ''}`}
          onClick={() => setActiveSection(SECTIONS.FLOW_FINDER)}
        >
          Flow Finder
        </button>
        <button
          className={`tab ${activeSection === SECTIONS.MONEY_MODEL ? 'active' : ''}`}
          onClick={() => setActiveSection(SECTIONS.MONEY_MODEL)}
        >
          Money Model
        </button>
        <button
          className={`tab ${activeSection === SECTIONS.NERVOUS_SYSTEM ? 'active' : ''}`}
          onClick={() => setActiveSection(SECTIONS.NERVOUS_SYSTEM)}
        >
          Nervous System
        </button>
        <button
          className={`tab ${activeSection === SECTIONS.HEALING_COMPASS ? 'active' : ''}`}
          onClick={() => setActiveSection(SECTIONS.HEALING_COMPASS)}
        >
          Healing
        </button>
      </div>

      {/* Content */}
      <div className="library-content">
        {activeSection === SECTIONS.FLOW_FINDER && renderFlowFinder()}
        {activeSection === SECTIONS.MONEY_MODEL && renderMoneyModel()}
        {activeSection === SECTIONS.NERVOUS_SYSTEM && renderNervousSystem()}
        {activeSection === SECTIONS.HEALING_COMPASS && renderHealingCompass()}
      </div>
    </div>
  )
}

export default LibraryOfAnswers
