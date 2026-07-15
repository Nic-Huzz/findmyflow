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
import {
  PERSONA_DISPLAY,
  WEALTH_LADDER_DISPLAY,
  EMPHASIS_CONFIG
} from '../lib/onboardingV2'
import './LibraryOfAnswers.css'

// Money model tier display info
const TIER_DISPLAY = {
  attraction: { label: 'Attraction', icon: '🧲', color: '#10B981' },
  core: { label: 'Core', icon: '⭐', color: '#F59E0B' },
  upsell: { label: 'Upsell', icon: '📈', color: '#8B5CF6' },
  downsell: { label: 'Downsell', icon: '📉', color: '#6366F1' },
  continuity: { label: 'Continuity', icon: '🔄', color: '#EC4899' }
}

// Product type display info
const PRODUCT_TYPES = {
  custom_service: { label: '1:1 Service', icon: '👤' },
  packaged_service: { label: 'Package', icon: '📦' },
  live_group: { label: 'Live Group', icon: '🎯' },
  automated_group: { label: 'Course', icon: '📚' },
  custom_agency: { label: 'Agency', icon: '🏢' },
  managed_service: { label: 'Managed Service', icon: '⚙️' },
  digital_product: { label: 'Digital Product', icon: '💾' }
}

const SECTIONS = {
  FLOW_FINDER: 'flow_finder',
  BUSINESS: 'business',
  HEALING: 'healing'
}

// Stage configuration for Business tab dropdown
const BUSINESS_STAGES = [
  { id: 1, name: 'Validation', flows: ['persona_selection'] },
  { id: 2, name: 'Product Creation', flows: ['100m_offer', 'lead_magnet_selection', 'product_selection'] },
  { id: 3, name: 'Testing', flows: ['mvp_readiness', 'feedback_analysis'] },
  { id: 4, name: 'Money Models', flows: ['attraction_offer', 'upsell_offer', 'downsell_offer', 'continuity_offer'] },
  { id: 5, name: 'Offer Creation', flows: ['offer_builder_v2'] },
  { id: 6, name: 'Campaign', flows: ['leads_strategy'] },
  { id: 7, name: 'Launch', flows: [] },
  { id: 8, name: 'Tracking', flows: ['income_calculator', 'funnel_calculator'] }
]

function LibraryOfAnswers() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState(SECTIONS.FLOW_FINDER)
  const [selectedBusinessStage, setSelectedBusinessStage] = useState(4) // Default to Money Models
  const [loading, setLoading] = useState(true)
  const [expandedItem, setExpandedItem] = useState(null)
  const [showCoverageMatrix, setShowCoverageMatrix] = useState(false)
  const [showNicheSharpener, setShowNicheSharpener] = useState(false)

  // User profile data (for hero section)
  const [userProfile, setUserProfile] = useState(null)

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
  const [products, setProducts] = useState([])
  const [grandSlamOffer, setGrandSlamOffer] = useState(null)
  const [userOfferSelections, setUserOfferSelections] = useState({}) // User's chosen offer types from quests

  // Nervous System data
  const [nervousSystemData, setNervousSystemData] = useState(null)

  // Healing Compass data
  const [healingEntries, setHealingEntries] = useState([])

  // Let's Play data
  const [letsPlayCompletions, setLetsPlayCompletions] = useState([])

  // Essence Zones data
  const [essenceZoneChallenges, setEssenceZoneChallenges] = useState([])

  // Add hue values to segments for wheel rendering
  const skillsWithHue = useMemo(() =>
    SKILLS_SEGMENTS.map((s, i) => ({ ...s, hue: i * 36 })),
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
      // 0=storytelling, 1=teaching, 2=coaching, 3=performing, 4=creating, 5=building, 6=designing, 7=leading, 8=connecting, 9=speaking_up
      storytelling: [0], narrative: [0], memoir: [0], 'content writing': [0],
      teaching: [1], explaining: [1], clarifying: [1], translating: [1], simplifying: [1],
      coaching: [2], mentoring: [2], nurturing: [2], supporting: [2], 'holding space': [2],
      performing: [3], presenting: [3], speaking: [3], stage: [3], keynote: [3],
      creating: [4], creative: [4], art: [4], inventing: [4], ideation: [4],
      building: [5], making: [5], engineering: [5], coding: [5], developing: [5], prototype: [5],
      designing: [6], design: [6], ux: [6], visual: [6], aesthetic: [6],
      leading: [7], strategy: [7], strategizing: [7], planning: [7], vision: [7], organizing: [7], systems: [7], operations: [7],
      connecting: [8], networking: [8], collaboration: [8], facilitating: [8], community: [8],
      'speaking up': [9], advocacy: [9], activism: [9], courage: [9],
      // Absorbed old terms
      analyzing: [1], analysis: [1], data: [1], patterns: [1], research: [1],
      influencing: [3], sales: [3], persuading: [3], motivating: [3],
      synthesizing: [1], integrating: [1], wisdom: [1], 'big picture': [1],
      expressing: [0], writing: [0],
      // Compound terms
      'problem solving': [1, 7], 'problem-solving': [1, 7],
      'team building': [8, 2], leadership: [7, 3],
      communication: [0, 3], 'project management': [7, 5],
      innovation: [4, 5], entrepreneurship: [7, 5, 3],
      learning: [1, 4], experience: [6, 4], engagement: [8, 3],
      healing: [2, 9], growth: [2, 1],
      playful: [4, 8], interaction: [3, 8], performance: [3, 9],
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
      // 0=kids_deserved_better, 1=voice_taken, 2=pain_not_believed, 3=world_losing,
      // 4=life_not_yours, 5=feeling_stupid, 6=locked_out, 7=work_treated_nothing,
      // 8=left_behind, 9=forgot_what_for, 10=stopped_wondering, 11=work_hollows
      children: [0], kids: [0], parenting: [0], youth: [0], childhood: [0], student: [0], school: [0],
      silence: [1], voice: [1], suppressed: [1], censored: [1], erased: [1], gender: [1], identity: [1],
      pain: [2], illness: [2], chronic: [2], dying: [2], body: [2], health: [2], sleep: [2], disability: [2],
      climate: [3], environment: [3], sustainability: [3], planet: [3], nature: [3], species: [3],
      oppression: [4], control: [4], rights: [4], freedom: [4], justice: [4], discrimination: [4],
      jargon: [5], confusing: [5], complicated: [5], explain: [5], simplify: [5], literacy: [5],
      access: [6], cost: [6], affordable: [6], gatekeeping: [6], credentials: [6], poverty: [6], inequality: [6],
      art: [7], creativity: [7], dismissed: [7], stolen: [7], credit: [7], craft: [7],
      abandoned: [8], forgotten: [8], homeless: [8], displaced: [8], refugee: [8], community: [8], veteran: [8],
      meaning: [9], purpose: [9], lost: [9], existential: [9], spiritual: [9], stuck: [9],
      certainty: [10], dogma: [10], rigid: [10], questioning: [10], bias: [10],
      burnout: [11], exploit: [11], dignity: [11], toxic: [11], career: [11], job: [11],
      // Absorbed old terms
      anxiety: [9], stress: [11], mindset: [9], emotions: [9],
      relationship: [8], family: [0], love: [8],
      expression: [1, 7], belonging: [8], movement: [1],
      money: [11], business: [11], financial: [6],
      technology: [5], innovation: [5], education: [5, 6],
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

  // Fetch projects and user profile on mount
  useEffect(() => {
    if (user?.id) {
      fetchProjects()
      fetchUserProfile()
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

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_stage_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!error && data) {
        setUserProfile(data)
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchFlowFinderData(),
        fetchMoneyModelData(),
        fetchNervousSystemData(),
        fetchHealingCompassData(),
        fetchProducts(),
        fetchLetsPlayData(),
        fetchEssenceZones()
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

  const fetchEssenceZones = async () => {
    const { data, error } = await supabase
      .from('groan_challenges')
      .select('id, title, source_label, visibility_layer, status, completed_at, created_at')
      .eq('user_id', user.id)
      .eq('essence_zone', 'essence')
      .order('created_at', { ascending: false })

    if (error) console.warn('fetchEssenceZones error:', error)
    setEssenceZoneChallenges(data || [])
  }

  const fetchMoneyModelData = async () => {
    // Helper to build query - NOTE: offer assessment tables don't have project_id
    // so we fetch all user data regardless of project selection
    const buildOfferQuery = (table) => {
      return supabase
        .from(table)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    }

    // Helper for tables that DO have project_id
    const buildProjectQuery = (table) => {
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
    // Note: offer assessment tables don't have project_id - they're user-level
    const [offersRes, upsellsRes, downsellsRes, continuityRes, leadMagnetsRes, grandSlamRes, questSelectionsRes] = await Promise.all([
      buildOfferQuery('attraction_offer_assessments'),
      buildOfferQuery('upsell_assessments'),
      buildOfferQuery('downsell_assessments'),
      buildOfferQuery('continuity_assessments'),
      buildOfferQuery('lead_magnet_assessments'),
      supabase
        .from('grand_slam_offers')
        .select('chosen_product_id, chosen_product_name, chosen_product_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Fetch user's offer type selections from 7-day challenge quests
      supabase
        .from('quest_completions')
        .select('quest_id, reflection_text')
        .eq('user_id', user.id)
        .in('quest_id', [
          'milestone_decide_acquisition',
          'milestone_decide_upsell',
          'milestone_decide_downsell',
          'milestone_decide_continuity'
        ])
        .order('completed_at', { ascending: false })
    ])

    setOffers(offersRes.data || [])
    setUpsells(upsellsRes.data || [])
    setDownsells(downsellsRes.data || [])
    setContinuity(continuityRes.data || [])
    setLeadMagnets(leadMagnetsRes.data || [])
    setGrandSlamOffer(grandSlamRes.data || null)

    // Map quest selections to offer types
    // reflection_text contains the label (e.g., "Classic Upsell") from dropdown
    const selections = {}
    if (questSelectionsRes.data) {
      questSelectionsRes.data.forEach(q => {
        if (q.quest_id === 'milestone_decide_acquisition') {
          selections.attraction = q.reflection_text
        } else if (q.quest_id === 'milestone_decide_upsell') {
          selections.upsell = q.reflection_text
        } else if (q.quest_id === 'milestone_decide_downsell') {
          selections.downsell = q.reflection_text
        } else if (q.quest_id === 'milestone_decide_continuity') {
          selections.continuity = q.reflection_text
        }
      })
    }
    setUserOfferSelections(selections)
  }

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true })

      if (selectedProjectId !== 'all') {
        query = query.eq('project_id', selectedProjectId)
      }

      const { data, error } = await query

      if (!error) {
        setProducts(data || [])
      }
    } catch (err) {
      // Products table might not exist
      console.warn('Products fetch error:', err)
    }
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

  const fetchLetsPlayData = async () => {
    try {
      const { data, error } = await supabase
        .from('quest_completions')
        .select('id, reflection_text, created_at')
        .eq('user_id', user.id)
        .eq('quest_id', 'lets_play')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Error fetching Let\'s Play data:', error)
        return
      }

      // Parse structured data from reflection_text
      const parsed = (data || []).map(completion => {
        try {
          const reflection = typeof completion.reflection_text === 'string'
            ? JSON.parse(completion.reflection_text)
            : completion.reflection_text
          return {
            id: completion.id,
            createdAt: completion.created_at,
            ...reflection
          }
        } catch {
          return null
        }
      }).filter(Boolean)

      setLetsPlayCompletions(parsed)
    } catch (err) {
      console.warn('fetchLetsPlayData error:', err)
    }
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

  // Get display data for hero section
  const persona = userProfile?.persona
  const wealthLadder = userProfile?.wealth_ladder_rung
  const emphasis = userProfile?.guidance_emphasis

  const personaInfo = persona ? PERSONA_DISPLAY[persona] : null
  const ladderInfo = wealthLadder ? WEALTH_LADDER_DISPLAY[wealthLadder] : null
  const emphasisInfo = emphasis ? EMPHASIS_CONFIG[emphasis] : null

  // Format price for display
  const formatPrice = (price, priceType) => {
    if (!price) return 'Price TBD'
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price)

    if (priceType === 'subscription') return `${formatted}/mo`
    if (priceType === 'per_session') return `${formatted}/session`
    return formatted
  }

  // Get product type info
  const getProductTypeInfo = (productType) => {
    return PRODUCT_TYPES[productType] || { label: productType, icon: '📦' }
  }

  // Get tier info
  const getTierInfo = (tier) => {
    return TIER_DISPLAY[tier] || { label: tier, icon: '📦', color: '#6B7280' }
  }

  // Render Hero Section
  const renderHeroSection = () => {
    // Only show if we have some profile data
    if (!personaInfo && !ladderInfo && !emphasisInfo) return null

    return (
      <section className="library-hero-section">
        {personaInfo && (
          <div className="hero-persona-badge">
            <span className="hero-persona-icon">{personaInfo.icon}</span>
            <span className="hero-persona-name">{personaInfo.name}</span>
          </div>
        )}

        {ladderInfo && (
          <div className="hero-ladder-position">
            <span className="hero-ladder-icon">{ladderInfo.icon}</span>
            <div className="hero-ladder-info">
              <span className="hero-ladder-label">{ladderInfo.label}</span>
              <span className="hero-ladder-description">{ladderInfo.description}</span>
            </div>
          </div>
        )}

        {emphasisInfo && (
          <div className="hero-emphasis-badge">
            <span className="hero-emphasis-label">Focus: {emphasisInfo.label}</span>
          </div>
        )}
      </section>
    )
  }

  // Render Products Section (for Money Model tab)
  const renderProductsSection = () => {
    if (products.length === 0) return null

    // Group products by tier
    const productsByTier = products.reduce((acc, product) => {
      const tier = product.money_model_tier || 'other'
      if (!acc[tier]) acc[tier] = []
      acc[tier].push(product)
      return acc
    }, {})

    const tierOrder = ['attraction', 'core', 'upsell', 'downsell', 'continuity', 'other']

    return (
      <div className="subsection products-subsection">
        <h3>Product Suite</h3>
        <div className="products-ladder">
          {tierOrder.map(tier => {
            const tierProducts = productsByTier[tier]
            if (!tierProducts || tierProducts.length === 0) return null

            const tierInfo = getTierInfo(tier)

            return (
              <div key={tier} className="tier-group">
                <div
                  className="tier-header"
                  style={{ borderLeftColor: tierInfo.color }}
                >
                  <span className="tier-icon">{tierInfo.icon}</span>
                  <span className="tier-label">{tierInfo.label}</span>
                </div>
                <div className="tier-products">
                  {tierProducts.map(product => {
                    const typeInfo = getProductTypeInfo(product.product_type)
                    return (
                      <div key={product.id} className="product-card">
                        <div className="product-main">
                          <span className="product-type-icon">{typeInfo.icon}</span>
                          <div className="product-info">
                            <span className="product-name">{product.name}</span>
                            <span className="product-type">{typeInfo.label}</span>
                          </div>
                        </div>
                        <span className="product-price">
                          {formatPrice(product.price_amount, product.price_type)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Get taxonomy tags for a cluster - prefer saved taxonomy_keys, fallback to label matching
  const getTaxonomyTagsForCluster = (cluster) => {
    const clusterType = cluster.cluster_type

    // Choose the right segments and mapping function based on cluster type
    let segments, mapFunction
    if (clusterType === 'skills') {
      segments = SKILLS_SEGMENTS
      mapFunction = mapClusterToSegments
    } else if (clusterType === 'problems') {
      segments = PROBLEM_SEGMENTS
      mapFunction = mapProblemClusterToSegments
    } else if (clusterType === 'persona') {
      segments = PERSONA_SEGMENTS
      mapFunction = mapPersonaClusterToSegments
    } else {
      return []
    }

    // Prefer saved taxonomy_keys if available
    if (cluster.taxonomy_keys && cluster.taxonomy_keys.length > 0) {
      const validTags = cluster.taxonomy_keys
        .map(key => segments.find(s => s.id === key))
        .filter(Boolean)
      if (validTags.length > 0) return validTags
    }

    // Fallback: use label matching to get segment indices, then convert to tags
    const indices = mapFunction(cluster.cluster_label)
    return indices.map(idx => segments[idx]).filter(Boolean)
  }

  // Render cluster card (report-card style - always visible)
  const renderClusterCard = (cluster) => {
    const taxonomyTags = getTaxonomyTagsForCluster(cluster)

    return (
      <div key={cluster.id} className="cluster-card-v2">
        {cluster.insight && (
          <p className="cluster-insight-v2">{cluster.insight}</p>
        )}
        {/* Taxonomy Tags - show which wheel segments this cluster maps to */}
        {taxonomyTags.length > 0 && (
          <div className="cluster-taxonomy-tags">
            {taxonomyTags.map((tag, idx) => (
              <span
                key={idx}
                className="taxonomy-tag"
                style={{
                  background: tag.color ? `${tag.color}20` : 'rgba(255,255,255,0.1)',
                  color: tag.color || 'rgba(255,255,255,0.8)',
                }}
              >
                {tag.icon && <span className="taxonomy-icon">{tag.icon}</span>}
                {tag.displayName || tag.id}
              </span>
            ))}
          </div>
        )}
        <span className="cluster-ai-note">AI-analysed from your flow responses</span>
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

      {/* Essence Zones */}
      {essenceZoneChallenges.length > 0 && (
        <div className="subsection">
          <h3>Essence Zones</h3>
          <p className="essence-zones-description">
            Challenges where both fear and excitement are highest — what terrifies and excites you most. These point toward your true calling.
          </p>
          <ul className="essence-zones-list">
            {essenceZoneChallenges.map(challenge => (
              <li key={challenge.id}>{challenge.title}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Skills */}
      <div className="subsection">
        <h3>Skills: Your Art</h3>
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
                centerLabel="YOUR ART"
                interactive={false}
                showLitLabels
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
        <h3>Problems: Your Message</h3>
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
                centerLabel="YOUR MESSAGE"
                interactive={false}
                showLitLabels
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
        <h3>Personas: Your Audience</h3>
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
                centerLabel="YOUR AUDIENCE"
                interactive={false}
                showLitLabels
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

  // Route mapping for viewing results
  const OFFER_ROUTES = {
    attraction: '/attraction-offer',
    upsell: '/upsell-offer',
    downsell: '/downsell-offer',
    continuity: '/continuity-offer',
    lead_magnet: '/lead-magnet-selection'
  }

  // Render offer card (new style matching cluster cards)
  const renderOfferCard = (offer, type = 'attraction') => {
    const title = offer.offer_name || offer.recommended_offer_name || offer.lead_magnet_name || 'Untitled'
    const description = offer.dream_outcome || offer.description || ''
    const offerName = offer.recommended_offer_name // e.g., "Classic Upsell"
    const confidence = offer.confidence_score
    const resultsRoute = OFFER_ROUTES[type]
    const createdAt = offer.created_at

    // Check if user selected this offer type in the 7-day challenge
    // userSelection stores the label (e.g., "Classic Upsell") from reflection_text
    const userSelection = userOfferSelections[type]
    const isChosen = userSelection && offerName && userSelection === offerName

    // Build tags array - confidence, chosen (not date - that goes under title)
    const tags = []
    if (confidence) {
      const confidencePercent = Math.round(confidence * 100)
      tags.push({ label: `${confidencePercent}% match`, type: 'confidence' })
    }
    if (isChosen) {
      tags.push({ label: 'Chosen', type: 'chosen' })
    }

    return (
      <Link
        key={offer.id}
        to={`${resultsRoute}?results=true`}
        className="offer-card-v2 offer-card-link"
      >
        <div className="offer-card-content">
          <h4 className="offer-title">{title}</h4>
          {createdAt && (
            <span className="offer-date-subtitle">{formatDate(createdAt)}</span>
          )}
          {description && (
            <p className="offer-description">{description}</p>
          )}
          {tags.length > 0 && (
            <div className="offer-tags">
              {tags.map((tag, idx) => (
                <span key={idx} className={`offer-tag offer-tag-${tag.type}`}>
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="offer-view-icon">→</span>
      </Link>
    )
  }

  // Render stage-specific content for Business tab
  const renderStageContent = (stageId) => {
    switch (stageId) {
      case 1: // Validation
        return (
          <>
            {/* Let's Play Completions */}
            <div className="subsection">
              <h3>Let's Play Experiments</h3>
              {letsPlayCompletions.length === 0 ? (
                <p className="empty-text">
                  No Let's Play experiments yet.{' '}
                  <Link to="/lets-play">Start Your First Play</Link>
                </p>
              ) : (
                <div className="cards-grid">
                  {letsPlayCompletions.map(play => {
                    const outcomeIcons = {
                      loved_it: '⭐',
                      it_helped: '👍',
                      mixed: '🤷',
                      didnt_land: '😬',
                      not_needed: '❌'
                    }
                    const flowIcons = {
                      north: { icon: '🟢', label: 'Flow' },
                      east: { icon: '🔵', label: 'Redirect' },
                      south: { icon: '🔴', label: 'Rest' },
                      west: { icon: '🟡', label: 'Honour' }
                    }
                    const flowInfo = play.flow_direction ? flowIcons[play.flow_direction] : null

                    return (
                      <div key={play.id} className="cluster-card-v2">
                        <h4 className="cluster-title">
                          {play.skill_name} × {play.problem_name}
                        </h4>
                        <p className="cluster-insight-v2">
                          Helped {play.person_name}
                          {play.what_happened && `: ${play.what_happened.substring(0, 80)}${play.what_happened.length > 80 ? '...' : ''}`}
                        </p>
                        <div className="cluster-tags">
                          {play.outcome_rating && (
                            <span className="cluster-tag">
                              {outcomeIcons[play.outcome_rating] || '•'} {play.outcome_rating.replace(/_/g, ' ')}
                            </span>
                          )}
                          {flowInfo && (
                            <span className="cluster-tag">
                              {flowInfo.icon} {flowInfo.label}
                            </span>
                          )}
                          {play.phase === 'pending_review' && (
                            <span className="cluster-tag" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                              Pending Review
                            </span>
                          )}
                          <span className="cluster-tag-more">{formatDate(play.createdAt)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="subsection">
              <h3>Persona Selection</h3>
              <p className="empty-text">
                Persona validation data appears in Flow Finder → Personas.{' '}
                <Link to="/persona-selection">Complete Persona Selection</Link>
              </p>
            </div>
          </>
        )

      case 2: // Product Creation
        return (
          <>
            {renderProductsSection()}
            <div className="subsection">
              <h3>Lead Magnets</h3>
              {leadMagnets.length === 0 ? (
                <p className="empty-text">No lead magnets created yet. <Link to="/lead-magnet-selection">Create Lead Magnet</Link></p>
              ) : (
                <div className="cards-grid">
                  {leadMagnets.map(offer => renderOfferCard(offer, 'lead_magnet'))}
                </div>
              )}
            </div>
          </>
        )

      case 3: // Testing
        return (
          <div className="subsection">
            <h3>Testing & Feedback</h3>
            <p className="empty-text">
              MVP Readiness and Feedback Analysis flows.{' '}
              <Link to="/7-day-challenge">Complete in 7-Day Challenge</Link>
            </p>
          </div>
        )

      case 4: // Money Models
        return (
          <>
            {/* Attraction Offers */}
            <div className="subsection">
              <h3>Attraction Offers</h3>
              {offers.length === 0 ? (
                <p className="empty-text">No offers created yet. <Link to="/attraction-offer">Create Offer</Link></p>
              ) : (
                <div className="cards-grid">
                  {offers.map(offer => renderOfferCard(offer, 'attraction'))}
                </div>
              )}
            </div>

            {/* Upsells */}
            <div className="subsection">
              <h3>Upsells</h3>
              {upsells.length === 0 ? (
                <p className="empty-text">No upsells created yet. <Link to="/upsell-offer">Create Upsell</Link></p>
              ) : (
                <div className="cards-grid">
                  {upsells.map(offer => renderOfferCard(offer, 'upsell'))}
                </div>
              )}
            </div>

            {/* Downsells */}
            <div className="subsection">
              <h3>Downsells</h3>
              {downsells.length === 0 ? (
                <p className="empty-text">No downsells created yet. <Link to="/downsell-offer">Create Downsell</Link></p>
              ) : (
                <div className="cards-grid">
                  {downsells.map(offer => renderOfferCard(offer, 'downsell'))}
                </div>
              )}
            </div>

            {/* Continuity */}
            <div className="subsection">
              <h3>Continuity Offers</h3>
              {continuity.length === 0 ? (
                <p className="empty-text">No continuity offers created yet. <Link to="/continuity-offer">Create Continuity</Link></p>
              ) : (
                <div className="cards-grid">
                  {continuity.map(offer => renderOfferCard(offer, 'continuity'))}
                </div>
              )}
            </div>
          </>
        )

      case 5: // Offer Creation (Grand Slam)
        return (
          <div className="subsection">
            <h3>Grand Slam Offer</h3>
            {grandSlamOffer ? (
              <div className="offer-card-v2">
                <div className="offer-card-content">
                  <h4 className="offer-title">{grandSlamOffer.chosen_product_name || 'Your Grand Slam'}</h4>
                  <p className="offer-description">Your complete offer stack with bonuses, guarantee, and scarcity.</p>
                </div>
              </div>
            ) : (
              <p className="empty-text">No Grand Slam offer created yet. <Link to="/offer-builder">Build Your Offer</Link></p>
            )}
          </div>
        )

      case 6: // Campaign
        return (
          <div className="subsection">
            <h3>Leads Strategy</h3>
            <p className="empty-text">
              Campaign and lead generation strategy.{' '}
              <Link to="/leads-strategy">Create Leads Strategy</Link>
            </p>
          </div>
        )

      case 7: // Launch
        return (
          <div className="subsection">
            <h3>Launch</h3>
            <p className="empty-text">
              Launch stage focuses on milestones rather than flows.{' '}
              <Link to="/7-day-challenge">Track in 7-Day Challenge</Link>
            </p>
          </div>
        )

      case 8: // Tracking
        return (
          <div className="subsection">
            <h3>Funnel Metrics</h3>
            <p className="empty-text">
              Track your funnel performance.{' '}
              <Link to="/funnel-calculator">Open Funnel Calculator</Link>
            </p>
          </div>
        )

      default:
        return null
    }
  }

  // Render Business section with stage dropdown
  const renderBusiness = () => {
    const currentStage = BUSINESS_STAGES.find(s => s.id === selectedBusinessStage)

    return (
      <div className="library-section">
        {/* Stage Dropdown */}
        <div className="stage-selector">
          <label htmlFor="stage-select">Stage:</label>
          <select
            id="stage-select"
            value={selectedBusinessStage}
            onChange={(e) => setSelectedBusinessStage(Number(e.target.value))}
            className="stage-dropdown"
          >
            {BUSINESS_STAGES.map(stage => (
              <option key={stage.id} value={stage.id}>
                {stage.id}. {stage.name}
              </option>
            ))}
          </select>
        </div>

        {/* Project Filter */}
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

        {/* Stage-specific content */}
        {renderStageContent(selectedBusinessStage)}
      </div>
    )
  }

  // Render combined Healing section (Nervous System + Healing Compass)
  const renderHealing = () => {
    // Count safety contracts (limiting beliefs user said "yes" to)
    const safetyContractsCount = nervousSystemData?.safety_contracts?.length || 0

    return (
      <div className="library-section">
        {/* Nervous System Boundaries */}
        <div className="subsection">
          <h3>Nervous System Boundaries</h3>
          {!nervousSystemData ? (
            <p className="empty-text">
              No nervous system calibration data yet.{' '}
              <Link to="/nervous-system">Complete Nervous System Flow</Link>
            </p>
          ) : (
            <div className="cards-grid">
              <Link
                to="/nervous-system?results=true"
                className="offer-card-v2 offer-card-link"
              >
                <div className="offer-card-content">
                  <h4 className="offer-title">Your Safety Limits</h4>
                  <p className="offer-description">
                    {nervousSystemData.nervous_system_income_limit && (
                      <>Income edge: {nervousSystemData.nervous_system_income_limit}</>
                    )}
                    {nervousSystemData.nervous_system_income_limit && nervousSystemData.nervous_system_impact_limit && ' · '}
                    {nervousSystemData.nervous_system_impact_limit && (
                      <>Visibility edge: {nervousSystemData.nervous_system_impact_limit}</>
                    )}
                  </p>
                  {nervousSystemData.core_fear && (
                    <p className="offer-description" style={{ marginTop: '8px', fontStyle: 'italic' }}>
                      Core fear: {nervousSystemData.core_fear}
                    </p>
                  )}
                  <div className="offer-tags">
                    {nervousSystemData.archetype && (
                      <span className="offer-tag offer-tag-confidence">{nervousSystemData.archetype}</span>
                    )}
                    {safetyContractsCount > 0 && (
                      <span className="offer-tag offer-tag-warning">
                        {safetyContractsCount} limiting belief{safetyContractsCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="offer-tag offer-tag-date">{formatDate(nervousSystemData.created_at)}</span>
                  </div>
                </div>
                <span className="offer-view-icon">→</span>
              </Link>
            </div>
          )}
        </div>

        {/* Limiting Belief Rewire (flow_version = 2) */}
        {(() => {
          const rewireEntries = healingEntries.filter(e => e.flow_version === 2)
          return (
            <div className="subsection">
              <h3>Limiting Belief Rewire</h3>
              {rewireEntries.length === 0 ? (
                <p className="empty-text">
                  No limiting belief rewire entries yet.{' '}
                  <Link to="/limiting-belief-rewire">Start Rewiring</Link>
                </p>
              ) : (
                <div className="cards-grid">
                  {rewireEntries.map(entry => (
                    <Link
                      key={entry.id}
                      to="/limiting-belief-rewire?results=true"
                      className="offer-card-v2 offer-card-link"
                    >
                      <div className="offer-card-content">
                        <h4 className="offer-title">
                          {entry.selected_safety_contract || 'Safety Contract'}
                        </h4>
                        {entry.limiting_impact && (
                          <p className="offer-description">{entry.limiting_impact}</p>
                        )}
                        {entry.past_event_emotions && (
                          <p className="offer-description" style={{ marginTop: '8px', fontStyle: 'italic' }}>
                            Core emotion: {entry.past_event_emotions}
                          </p>
                        )}
                        <div className="offer-tags">
                          {entry.challenge_enrollment_consent && (
                            <span className="offer-tag offer-tag-confidence">
                              {entry.challenge_enrollment_consent === 'book_session' ? 'Session booked' : 'Enrolled'}
                            </span>
                          )}
                          <span className="offer-tag offer-tag-date">{formatDate(entry.created_at)}</span>
                        </div>
                      </div>
                      <span className="offer-view-icon">→</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {/* Healing Compass (flow_version != 2, i.e. V3 or older) */}
        {(() => {
          const compassEntries = healingEntries.filter(e => e.flow_version !== 2)
          return (
            <div className="subsection">
              <h3>Healing Compass</h3>
              {compassEntries.length === 0 ? (
                <p className="empty-text">
                  No healing compass entries yet.{' '}
                  <Link to="/healing-compass">Start Healing Journey</Link>
                </p>
              ) : (
                <div className="cards-grid">
                  {compassEntries.map(entry => (
                    <Link
                      key={entry.id}
                      to="/healing-compass?results=true"
                      className="offer-card-v2 offer-card-link"
                    >
                      <div className="offer-card-content">
                        <h4 className="offer-title">
                          {entry.primary_need || entry.selected_safety_contract || 'Healing Entry'}
                        </h4>
                        {entry.action_text && (
                          <p className="offer-description">{entry.action_text}</p>
                        )}
                        {entry.splinter_location && (
                          <p className="offer-description" style={{ marginTop: '8px', fontStyle: 'italic' }}>
                            Splinter: {entry.splinter_location}
                          </p>
                        )}
                        <div className="offer-tags">
                          <span className="offer-tag offer-tag-date">{formatDate(entry.created_at)}</span>
                        </div>
                      </div>
                      <span className="offer-view-icon">→</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })()}
      </div>
    )
  }

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
          className={`tab ${activeSection === SECTIONS.BUSINESS ? 'active' : ''}`}
          onClick={() => setActiveSection(SECTIONS.BUSINESS)}
        >
          Business
        </button>
        <button
          className={`tab ${activeSection === SECTIONS.HEALING ? 'active' : ''}`}
          onClick={() => setActiveSection(SECTIONS.HEALING)}
        >
          Healing
        </button>
      </div>

      {/* Content */}
      <div className="library-content">
        {activeSection === SECTIONS.FLOW_FINDER && renderFlowFinder()}
        {activeSection === SECTIONS.BUSINESS && renderBusiness()}
        {activeSection === SECTIONS.HEALING && renderHealing()}
      </div>
    </div>
  )
}

export default LibraryOfAnswers
