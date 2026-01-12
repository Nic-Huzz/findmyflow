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

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import CoverageMatrix from '../components/CoverageMatrix'
import NicheSharpener from '../components/NicheSharpener'
import { GradientWheel } from '../components/CompetenceWheels'
import {
  SKILLS_SEGMENTS,
  PROFICIENCY_RINGS,
  PROBLEM_SEGMENTS,
  PROBLEMS_PROFICIENCY_RINGS,
  PERSONA_SEGMENTS,
  JOURNEY_STAGES
} from '../lib/wheelTaxonomy'
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
  const [showCoverageMatrix, setShowCoverageMatrix] = useState(false)
  const [showNicheSharpener, setShowNicheSharpener] = useState(false)

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

  // Add hue values to segments for wheel rendering
  const skillsWithHue = useMemo(() =>
    SKILLS_SEGMENTS.map((s, i) => ({ ...s, hue: i * 30 })),
    []
  )

  const problemsWithHue = useMemo(() =>
    PROBLEM_SEGMENTS.map((s, i) => ({ ...s, hue: i * 30 })),
    []
  )

  const personasWithHue = useMemo(() =>
    PERSONA_SEGMENTS.map((s, i) => ({ ...s, hue: i * 30 })),
    []
  )

  // Map cluster labels to wheel segment indices for Skills
  const mapClusterToSegments = (clusterLabel) => {
    const labelLower = clusterLabel.toLowerCase()
    const segmentMappings = {
      clarifying: [0], explaining: [0], teaching: [0], translating: [0],
      analyzing: [1], analysis: [1], data: [1], patterns: [1], research: [1],
      strategizing: [2], strategy: [2], planning: [2], vision: [2],
      organizing: [3], systems: [3], operations: [3], processes: [3],
      building: [4], making: [4], engineering: [4], coding: [4], developing: [4],
      designing: [5], design: [5], ux: [5], visual: [5], aesthetic: [5],
      creating: [6], creative: [6], art: [6], writing: [6], ideation: [6],
      expressing: [7], storytelling: [7], presenting: [7], speaking: [7],
      connecting: [8], networking: [8], collaboration: [8], facilitating: [8],
      influencing: [9], sales: [9], persuading: [9], motivating: [9],
      nurturing: [10], coaching: [10], mentoring: [10], supporting: [10],
      synthesizing: [11], integrating: [11], wisdom: [11], 'big picture': [11],
      'problem solving': [1, 2], 'problem-solving': [1, 2],
      'team building': [8, 10], leadership: [2, 9],
      communication: [0, 7], 'project management': [2, 3],
      innovation: [4, 6], entrepreneurship: [2, 4, 9],
      learning: [0, 6], experience: [5, 6], engagement: [8, 9],
      community: [8, 10], healing: [10, 11], growth: [10, 11],
      playful: [6, 8], interaction: [7, 8], performance: [7, 9],
    }
    const matchedSegments = new Set()
    Object.entries(segmentMappings).forEach(([keyword, indices]) => {
      if (labelLower.includes(keyword)) {
        indices.forEach(i => matchedSegments.add(i))
      }
    })
    return matchedSegments.size > 0 ? Array.from(matchedSegments) : [0]
  }

  // Map proficiency rating to ring index (0-2) for 3-ring wheel
  const getRingForProficiency = (rating) => {
    switch (rating) {
      case 'emerging': return 0
      case 'establishing': return 1
      case 'mastering': return 2
      default: return 1
    }
  }

  // Calculate lit cells from skills clusters using proficiency ratings
  const skillsLitCells = useMemo(() => {
    if (skillsClusters.length === 0) return new Set()
    const newLitCells = new Set()

    skillsClusters.forEach(cluster => {
      const segmentIndices = mapClusterToSegments(cluster.cluster_label)

      // Check if items have proficiency data (new format: [{text, rating}, ...])
      const items = cluster.items || []
      const hasRatings = items.length > 0 && typeof items[0] === 'object' && items[0].rating

      if (hasRatings) {
        // Calculate dominant proficiency for this cluster
        const proficiencyCounts = { emerging: 0, establishing: 0, mastering: 0 }
        items.forEach(item => {
          if (item.rating) proficiencyCounts[item.rating]++
        })

        let dominantProficiency = 'establishing'
        let maxCount = 0
        Object.entries(proficiencyCounts).forEach(([level, count]) => {
          if (count > maxCount) {
            maxCount = count
            dominantProficiency = level
          }
        })

        const ringIdx = getRingForProficiency(dominantProficiency)
        segmentIndices.forEach(segIdx => {
          newLitCells.add(`${segIdx}-${ringIdx}`)
        })
      } else {
        // Legacy format (string items) - default to middle ring
        segmentIndices.forEach(segIdx => {
          newLitCells.add(`${segIdx}-1`)
        })
      }
    })

    return newLitCells
  }, [skillsClusters])

  // Map cluster labels to wheel segment indices for Problems
  const mapProblemClusterToSegments = (clusterLabel) => {
    const labelLower = clusterLabel.toLowerCase()
    const segmentMappings = {
      // Physical vitality
      health: [0], fitness: [0], body: [0], energy: [0], sleep: [0], nutrition: [0],
      // Mental wellbeing
      anxiety: [1], stress: [1], mindset: [1], mental: [1], emotions: [1], burnout: [1],
      // Personal mastery
      skills: [2], productivity: [2], habits: [2], growth: [2], learning: [2],
      // Intimate bonds
      relationship: [3], family: [3], parenting: [3], love: [3], marriage: [3],
      // Service & care
      caregiving: [4], disability: [4], healthcare: [4], support: [4],
      // Creative expression
      art: [5], creativity: [5], voice: [5], expression: [5], identity: [5],
      // Local impact
      team: [6], organization: [6], community: [6], workplace: [6], culture: [6],
      // Cultural movements
      movement: [7], belonging: [7], trends: [7], social: [7],
      // Economic freedom
      money: [8], business: [8], career: [8], income: [8], financial: [8], freedom: [8],
      // Social justice
      inequality: [9], discrimination: [9], rights: [9], fairness: [9], advocacy: [9],
      // Planetary health
      climate: [10], environment: [10], sustainability: [10], planet: [10],
      // Human progress
      technology: [11], innovation: [11], future: [11], education: [11],
    }
    const matchedSegments = new Set()
    Object.entries(segmentMappings).forEach(([keyword, indices]) => {
      if (labelLower.includes(keyword)) {
        indices.forEach(i => matchedSegments.add(i))
      }
    })
    return matchedSegments.size > 0 ? Array.from(matchedSegments) : [0]
  }

  // Map problem proficiency rating to ring index (0-2) for 3-ring wheel
  const getRingForProblemProficiency = (rating) => {
    switch (rating) {
      case 'exploring': return 0
      case 'pursuing': return 1
      case 'proven': return 2
      default: return 1
    }
  }

  // Calculate lit cells from problems clusters using proficiency ratings
  const problemsLitCells = useMemo(() => {
    if (problemsClusters.length === 0) return new Set()
    const newLitCells = new Set()

    problemsClusters.forEach(cluster => {
      const segmentIndices = mapProblemClusterToSegments(cluster.cluster_label)

      // Check if items have proficiency data (new format: [{text, rating}, ...])
      const items = cluster.items || []
      const hasRatings = items.length > 0 && typeof items[0] === 'object' && items[0].rating

      if (hasRatings) {
        // Calculate dominant proficiency for this cluster
        const proficiencyCounts = { exploring: 0, pursuing: 0, proven: 0 }
        items.forEach(item => {
          if (item.rating) proficiencyCounts[item.rating]++
        })

        let dominantProficiency = 'pursuing'
        let maxCount = 0
        Object.entries(proficiencyCounts).forEach(([level, count]) => {
          if (count > maxCount) {
            maxCount = count
            dominantProficiency = level
          }
        })

        const ringIdx = getRingForProblemProficiency(dominantProficiency)
        segmentIndices.forEach(segIdx => {
          newLitCells.add(`${segIdx}-${ringIdx}`)
        })
      } else {
        // Legacy format (string items) - default to middle ring
        segmentIndices.forEach(segIdx => {
          newLitCells.add(`${segIdx}-1`)
        })
      }
    })

    return newLitCells
  }, [problemsClusters])

  // Map cluster labels to wheel segment indices for Personas
  const mapPersonaClusterToSegments = (clusterLabel) => {
    const labelLower = clusterLabel.toLowerCase()
    const segmentMappings = {
      // Seekers
      seeker: [0], lost: [0], direction: [0], purpose: [0], meaning: [0], clarity: [0],
      // Builders
      builder: [1], creating: [1], building: [1], entrepreneur: [1], starting: [1],
      // Healers
      healer: [2], healing: [2], trauma: [2], pain: [2], suffering: [2], recovery: [2],
      // Teachers
      teacher: [3], learning: [3], growing: [3], knowledge: [3], education: [3],
      // Connectors
      connector: [4], lonely: [4], isolated: [4], community: [4], belonging: [4],
      // Achievers
      achiever: [5], success: [5], winning: [5], status: [5], ambitious: [5],
      // Explorers
      explorer: [6], freedom: [6], adventure: [6], autonomy: [6], travel: [6],
      // Visionaries
      visionary: [7], future: [7], change: [7], innovation: [7], transformation: [7],
      // Protectors
      protector: [8], security: [8], safety: [8], stability: [8], risk: [8],
      // Creators
      creator: [9], expression: [9], art: [9], originality: [9], voice: [9],
      // Nurturers
      nurturer: [10], family: [10], caring: [10], devoted: [10], children: [10],
      // Challengers
      challenger: [11], injustice: [11], disruption: [11], truth: [11], advocacy: [11],
    }
    const matchedSegments = new Set()
    Object.entries(segmentMappings).forEach(([keyword, indices]) => {
      if (labelLower.includes(keyword)) {
        indices.forEach(i => matchedSegments.add(i))
      }
    })
    return matchedSegments.size > 0 ? Array.from(matchedSegments) : [0]
  }

  // Map journey stage to ring index (0-2) for 3-ring wheel
  const getRingForJourneyStage = (stage) => {
    switch (stage) {
      case 'awakening': return 0
      case 'struggling': return 1
      case 'ready': return 2
      default: return 1
    }
  }

  // Calculate lit cells from persona clusters using journey stages
  const personasLitCells = useMemo(() => {
    if (personaClusters.length === 0) return new Set()
    const newLitCells = new Set()

    personaClusters.forEach(cluster => {
      const segmentIndices = mapPersonaClusterToSegments(cluster.cluster_label)

      // Check if items have journey stage data (new format: [{text, journeyStage}, ...])
      const items = cluster.items || []
      const hasStage = items.length > 0 && typeof items[0] === 'object' && items[0].journeyStage

      if (hasStage) {
        // Use the cluster's journey stage (all items in a persona cluster have same stage)
        const journeyStage = items[0].journeyStage || 'struggling'
        const ringIdx = getRingForJourneyStage(journeyStage)
        segmentIndices.forEach(segIdx => {
          newLitCells.add(`${segIdx}-${ringIdx}`)
        })
      } else {
        // Legacy format (string items) - default to middle ring
        segmentIndices.forEach(segIdx => {
          newLitCells.add(`${segIdx}-1`)
        })
      }
    })

    return newLitCells
  }, [personaClusters])

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
      {/* AI Tools Section - ARCHIVED FOR REVIEW
      {skillsClusters.length > 0 && problemsClusters.length > 0 && (
        <div className="ai-tools-container">
          <div className="ai-tools-header">AI-Powered Insights</div>
          <div className="ai-tools-buttons">
            <button
              className={`matrix-toggle-btn ${showCoverageMatrix ? 'active' : ''}`}
              onClick={() => {
                setShowCoverageMatrix(!showCoverageMatrix)
                if (!showCoverageMatrix) setShowNicheSharpener(false)
              }}
            >
              {showCoverageMatrix ? 'Hide Coverage Matrix' : 'Coverage Matrix'}
            </button>
            <button
              className={`matrix-toggle-btn ${showNicheSharpener ? 'active' : ''}`}
              onClick={() => {
                setShowNicheSharpener(!showNicheSharpener)
                if (!showNicheSharpener) setShowCoverageMatrix(false)
              }}
            >
              {showNicheSharpener ? 'Hide Niche Sharpener' : 'AI Niche Sharpener'}
            </button>
          </div>
        </div>
      )}

      {showCoverageMatrix && (
        <CoverageMatrix
          skillsClusters={skillsClusters}
          problemsClusters={problemsClusters}
          personaClusters={personaClusters}
        />
      )}

      {showNicheSharpener && (
        <NicheSharpener
          embedded={true}
          onClose={() => setShowNicheSharpener(false)}
        />
      )}
      END ARCHIVED */}

      {/* Skills */}
      <div className="subsection">
        <h3>Skills</h3>
        {skillsClusters.length === 0 ? (
          <p className="empty-text">No skills discovered yet. <Link to="/nikigai/skills">Start Flow Finder</Link></p>
        ) : (
          <>
            <div className="skills-wheel-container">
              <GradientWheel
                segments={skillsWithHue}
                rings={PROFICIENCY_RINGS}
                litCells={skillsLitCells}
                size={260}
                centerLabel="SKILLS"
                interactive={false}
              />
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', background: 'transparent' }}></span>
                  Inner: Emerging
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.3)' }}></span>
                  Middle: Establishing
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }}></span>
                  Outer: Mastering
                </span>
              </div>
              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                {skillsLitCells.size} skill areas identified
              </div>
            </div>
            <div className="cards-grid">
              {skillsClusters.map(renderClusterCard)}
            </div>
          </>
        )}
      </div>

      {/* Problems */}
      <div className="subsection">
        <h3>Problems</h3>
        {problemsClusters.length === 0 ? (
          <p className="empty-text">No problems identified yet. <Link to="/nikigai/problems">Start Problems Flow</Link></p>
        ) : (
          <>
            <div className="skills-wheel-container">
              <GradientWheel
                segments={problemsWithHue}
                rings={PROBLEMS_PROFICIENCY_RINGS}
                litCells={problemsLitCells}
                size={260}
                centerLabel="PROBLEMS"
                interactive={false}
              />
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', background: 'transparent' }}></span>
                  Inner: Exploring
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.3)' }}></span>
                  Middle: Pursuing
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }}></span>
                  Outer: Proven
                </span>
              </div>
              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                {problemsLitCells.size} problem areas identified
              </div>
            </div>
            <div className="cards-grid">
              {problemsClusters.map(renderClusterCard)}
            </div>
          </>
        )}
      </div>

      {/* Personas */}
      <div className="subsection">
        <h3>Personas</h3>
        {personaClusters.length === 0 ? (
          <p className="empty-text">No personas created yet. <Link to="/nikigai/persona">Start Persona Flow</Link></p>
        ) : (
          <>
            <div className="skills-wheel-container">
              <GradientWheel
                segments={personasWithHue}
                rings={JOURNEY_STAGES}
                litCells={personasLitCells}
                size={260}
                centerLabel="PERSONAS"
                interactive={false}
              />
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', background: 'transparent' }}></span>
                  Inner: Awakening
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.3)' }}></span>
                  Middle: Struggling
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }}></span>
                  Outer: Ready
                </span>
              </div>
              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                {personasLitCells.size} persona areas identified
              </div>
            </div>
            <div className="cards-grid">
              {personaClusters.map(renderClusterCard)}
            </div>
          </>
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
      {/* Project Filter - Only for Money Model since it's project-specific */}
      {projects.length > 0 && (
        <div className="project-filter">
          <div className="project-filter-bubbles">
            <button
              className={`project-bubble ${selectedProjectId === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedProjectId('all')}
            >
              All Projects
            </button>
            {projects.map(project => (
              <button
                key={project.id}
                className={`project-bubble ${selectedProjectId === project.id ? 'active' : ''}`}
                onClick={() => setSelectedProjectId(project.id)}
              >
                {project.name}
              </button>
            ))}
          </div>
        </div>
      )}

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
