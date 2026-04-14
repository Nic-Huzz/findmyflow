/**
 * PeopleMatching.jsx — /people
 * People who built what you're dreaming of.
 * Shows 5 career model matches based on user's skill + problem categories.
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { findCareerMatches } from '../lib/wheelAlignment'
import { findSkillSegment, findProblemSegment, resolveSkillId, resolveProblemId } from '../lib/wheelTaxonomy'
import { hapticLight } from '../lib/haptics'
import './PeopleMatching.css'

const SAVED_KEY = 'findmyflow_saved_people'

function getSavedPeople() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]')
  } catch { return [] }
}

function setSavedPeople(names) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(names))
}

export default function PeopleMatching() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [userSkillIds, setUserSkillIds] = useState([])
  const [userProblemIds, setUserProblemIds] = useState([])
  const [expandedCard, setExpandedCard] = useState(null)
  const [saved, setSaved] = useState(getSavedPeople)

  useEffect(() => {
    if (!user?.id) return
    loadUserData()
  }, [user?.id])

  async function loadUserData() {
    setLoading(true)
    try {
      // Load user's skill picks
      const { data: skillClusters } = await supabase
        .from('nikigai_clusters')
        .select('items, cluster_label')
        .eq('user_id', user.id)
        .eq('cluster_type', 'skills')
        .in('step_id', ['curiosity_compass_wheel', 'get_started', 'curiosity_compass'])

      const skillIds = new Set()
      if (skillClusters) {
        for (const cluster of skillClusters) {
          const items = cluster.items || []
          for (const item of items) {
            if (item.category) {
              skillIds.add(resolveSkillId(item.category) || item.category)
            }
          }
          // Also check taxonomy_keys if present
          if (cluster.taxonomy_keys) {
            for (const key of cluster.taxonomy_keys) {
              skillIds.add(resolveSkillId(key) || key)
            }
          }
        }
      }
      setUserSkillIds([...skillIds])

      // Load user's problem picks
      const { data: problemClusters } = await supabase
        .from('nikigai_clusters')
        .select('items, cluster_label')
        .eq('user_id', user.id)
        .eq('cluster_type', 'problems')

      const problemIds = new Set()
      if (problemClusters) {
        for (const cluster of problemClusters) {
          const items = cluster.items || []
          for (const item of items) {
            if (item.category) {
              problemIds.add(resolveProblemId(item.category) || item.category)
            }
          }
          if (cluster.taxonomy_keys) {
            for (const key of cluster.taxonomy_keys) {
              problemIds.add(resolveProblemId(key) || key)
            }
          }
        }
      }
      setUserProblemIds([...problemIds])
    } catch (err) {
      console.error('Error loading user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const matches = useMemo(() => {
    return findCareerMatches(userSkillIds, userProblemIds, 5)
  }, [userSkillIds, userProblemIds])

  const savedMatches = useMemo(() => {
    if (saved.length === 0) return []
    const allMatches = findCareerMatches(userSkillIds, userProblemIds, 50)
    return allMatches.filter(m => saved.includes(m.name))
  }, [userSkillIds, userProblemIds, saved])

  function toggleSave(name, e) {
    e.stopPropagation()
    hapticLight()
    const next = saved.includes(name)
      ? saved.filter(n => n !== name)
      : [...saved, name]
    setSaved(next)
    setSavedPeople(next)
  }

  function toggleExpand(name) {
    hapticLight()
    setExpandedCard(expandedCard === name ? null : name)
  }

  function renderCard(profile) {
    const cm = profile.careerModel || {}
    const isExpanded = expandedCard === profile.name
    const isSaved = saved.includes(profile.name)

    // Get matching categories
    const matchingSkills = (profile.primarySkills || [])
      .filter(s => userSkillIds.includes(s))
      .map(s => findSkillSegment(s)?.displayName)
      .filter(Boolean)

    const matchingProblem = userProblemIds.includes(profile.primaryProblem)
      ? findProblemSegment(profile.primaryProblem)?.displayName
      : null

    return (
      <div
        key={profile.name}
        className="pm-card"
        onClick={() => toggleExpand(profile.name)}
      >
        <div className="pm-card-header">
          <div>
            <h3 className="pm-card-name">{profile.name}</h3>
            <p className="pm-card-domain">{profile.domain || cm.type}</p>
          </div>
          <button
            className={`pm-save-btn ${isSaved ? 'saved' : ''}`}
            onClick={(e) => toggleSave(profile.name, e)}
          >
            {isSaved ? '★' : '☆'}
          </button>
        </div>

        {profile.oneLiner && (
          <p className="pm-card-oneliner">{profile.oneLiner}</p>
        )}

        <div className="pm-card-tags">
          {matchingSkills.map(s => (
            <span key={s} className="pm-tag">{s}</span>
          ))}
          {matchingProblem && (
            <span className="pm-tag problem">{matchingProblem}</span>
          )}
        </div>

        {cm.trajectory && (
          <p className="pm-card-trajectory">{cm.trajectory}</p>
        )}

        {isExpanded && (
          <div className="pm-expanded">
            {cm.keyDecision && (
              <div className="pm-expanded-row">
                <p className="pm-expanded-label">Key decision</p>
                <p className="pm-expanded-text">{cm.keyDecision}</p>
              </div>
            )}

            {cm.scaleModel && (
              <div className="pm-expanded-row">
                <p className="pm-expanded-label">How they grew</p>
                <p className="pm-expanded-text">{cm.scaleModel}</p>
              </div>
            )}

            {cm.revenueStreams && cm.revenueStreams.length > 0 && (
              <div className="pm-expanded-row">
                <p className="pm-expanded-label">Revenue streams</p>
                <p className="pm-expanded-text">{cm.revenueStreams.join(', ')}</p>
              </div>
            )}

            {cm.lessonsForUser && (
              <div className="pm-lesson">
                <p className="pm-lesson-text">{cm.lessonsForUser}</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="people-matching">
        <div className="pm-loading">
          <div className="pm-spinner" />
          <p>Finding your people...</p>
        </div>
      </div>
    )
  }

  // --- EMPTY STATE ---
  if (userSkillIds.length === 0 && userProblemIds.length === 0) {
    return (
      <div className="people-matching">
        <div className="pm-toolbar">
          <button className="pm-back" onClick={() => navigate(-1)}>←</button>
          <h2 className="pm-toolbar-title">Your People</h2>
        </div>
        <div className="pm-empty">
          <span className="pm-empty-icon">🧭</span>
          <h3 className="pm-empty-title">Discover your people</h3>
          <p className="pm-empty-text">
            Complete the skills and problems flows first, then we can show you
            people who built careers from the same combination.
          </p>
          <button className="pm-cta" onClick={() => navigate('/curiosity-compass')}>
            Start discovering
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="people-matching">
      <div className="pm-toolbar">
        <button className="pm-back" onClick={() => navigate(-1)}>←</button>
        <h2 className="pm-toolbar-title">Your People</h2>
      </div>

      <div className="pm-hero">
        <span className="pm-hero-label">People matching</span>
        <h2 className="pm-hero-title">People who built what you're dreaming of</h2>
        <p className="pm-hero-sub">
          Based on your skills and the problems you care about. Tap any card to see their full career path.
        </p>
      </div>

      {matches.length > 0 ? (
        <>
          {matches.map(renderCard)}

          {savedMatches.length > 0 && (
            <>
              <h3 className="pm-section-title">Saved</h3>
              {savedMatches
                .filter(m => !matches.find(top => top.name === m.name))
                .map(renderCard)}
            </>
          )}
        </>
      ) : (
        <div className="pm-empty">
          <span className="pm-empty-icon">🔍</span>
          <h3 className="pm-empty-title">No matches yet</h3>
          <p className="pm-empty-text">
            Complete more flows to refine your matches.
          </p>
        </div>
      )}
    </div>
  )
}
