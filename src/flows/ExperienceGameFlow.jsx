import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PRIMALS, INDUSTRIES, industryNodes } from '../lib/ruleBreakTreeData'
import { isCoreNode, getExperienceLabel } from '../lib/experienceDomeConfig'
import { useAuth } from '../auth/AuthProvider'
import { useDomeData } from '../hooks/useDomeData'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import DomeRadar from '../components/DomeRadar'
import './ExperienceGameFlow.css'

// ─── Constants ───

const NS_STATES = [
  { id: 'vibe_rise', label: 'Vibe Rise', icon: '✦', color: '#E9A23B' },
  { id: 'fun', label: 'Fun', icon: '○', color: '#10b981' },
  { id: 'pressure', label: 'Stressful', icon: '◇', color: '#ef4444' },
  { id: 'bored', label: 'Uninterested', icon: '—', color: '#6b7280' },
]

const INTRO_LINES = [
  { type: 'heading', text: 'Life is the most magical game in the world.' },
  { type: 'body', text: 'The purpose? Have experiences you love.' },
  { type: 'body', text: "We believe there's a life path uniquely yours." },
  { type: 'accent', text: 'This app turns finding that path into a game.' },
]

// ─── Experience descriptions (subtext) ───

const EXPERIENCE_DESC = {
  'sub-ordeal-2015': 'Multi-day outdoor challenges, survival experiences',
  'fashion-2021': 'Curating your look, style as self-expression',
  'defense-1688': 'Protecting what matters, planning for the unexpected',
  // sub-ritual-2018 removed (cacao+breathwork redundant with Healing)
  'sub-traditional-2023': 'Ancient plant medicine, heart-opening ritual',
  'sub-combustion-1400': 'Backyard fires, beach bonfires, gathering around flames',
  'sub-light-2020': 'Candlelit evenings, creating cozy atmosphere',
  'sub-mental-1964': 'Talk therapy, reframing thought patterns',
  'sub-temperature-2018': 'Ice baths, cold showers, Wim Hof method',
  'sub-strength-2000': 'High-intensity group training, functional movement',
  'intimacy-2012': 'Tinder, Hinge, Bumble, meeting people online',
  'sub-communal-2017': 'Co-working spaces, living abroad with a community',
  'sub-digital-2015': 'Online communities, group chats, forums',
  'car-1886': 'Solo or group road trips, driving for the experience',
  'food-2002': 'Choosing whole foods, visiting farmers markets',
  'sub-dance-1975': 'Free-form dancing, movement without choreography',
  'sub-board-1995': 'Strategy board games, game nights with friends',
  'sub-regen-1971': 'Locally sourced meals, knowing where food comes from',
  'sub-regen-1994': 'Cooking a meal for friends, hosting a dinner party',
  'sub-ritual-fire-2015b': 'Ceremonial fire circles, fire walking, rituals',
  // sub-ritual-fire-2000 removed (merged into sub-combustion-1400)
  // sub-light-1400 removed (ambient, not an active experience)
  'sub-states-1954': 'Floating in saltwater, deep sensory stillness',
  'sub-digital-2010b': 'Crafting your online presence, sharing your life',
  'sub-rest-1999': 'Deliberate rest, napping as a practice',
  'sub-fasting-2012': 'Time-restricted eating, fasting protocols',
  'sub-endurance-1962': 'Running for fitness or meditation, parkrun',
  'sub-ferment-2010': 'Brewing kombucha, fermented foods, gut health',
  'sub-toy-1932': 'Building with your hands, construction play',
  'sub-audio-2005': 'Audio learning, conversations, interviews',
  'sub-dream-1975': 'Conscious dreaming, dream journaling',
  'sub-safety-1400b': 'Combat training, discipline, self-defense',
  'sub-coaching-1937': 'Small group of peers meeting regularly to grow',
  'sub-mindbody-1979': 'Seated meditation, mindfulness apps, retreats',
  'sub-counter-2011': 'Owning less, decluttering, intentional living',
  'sub-ancestral-2002': 'Eating like our ancestors, whole food nutrition',
  'play-1972': 'Console, PC, or mobile gaming',
  'sub-chance-2003': 'Card games, risk-taking, reading people',
  'sub-somatic-1400': 'Breathing techniques, breath as medicine',
  'sub-surveillance-2018': 'Encrypted messaging, VPNs, digital privacy',
  'sub-sport-1871': 'Football, basketball, cricket, rugby, team competition',
  'sub-sport-1936': 'Stadium events, game day, sports bars',
  'sub-psychedelic-2016': 'Guided psychedelic experiences, plant medicine',
  'sub-written-1719': 'Books, long-form reading, getting lost in a story',
  'sub-written-1999': 'Morning pages, diary, reflective writing, blogging',
  'sub-outdoor-1907': 'Camping, hiking, being in nature overnight',
  'media-2018': 'Creating or consuming short videos, Reels',
  'sleep-2009': 'Oura, Whoop, Apple Watch sleep data',
  'sub-fashion-2007': 'Ethical brands, thrift shopping, conscious style',
  'sub-energy-2015': 'Crystal bowls, gong baths, vibrational healing',
  'sub-oral-1860': 'Live comedy, performing or watching stand-up',
  'sub-oral-2015': 'Gigs, festivals, live performances, mosh pits',
  'property-2008': 'Airbnbs, treehouses, glamping, unusual places to stay',
  'tech-2007': 'Your phone as a daily tool and companion',
  'ai-2022': 'AI assistants, prompt engineering, co-creating with AI',
  'tech-2004': 'Facebook, X, LinkedIn, online social life',
  'sub-alt-2011': 'Living in a van, nomadic lifestyle, tiny homes',
  'comms-2020': 'Catching up with friends and family over video call',
  'sub-sacred-2010': 'Boutique fitness studios, curated wellness spaces',
  'sub-proptech-2020': 'Remote work, home office, flexible work setup',
  'sub-flexibility-1893': 'Yoga classes, stretching, mind-body flow',
  'sub-video-2005': 'Making and publishing your own videos',
}

// ─── Data helpers ───

function buildBranches() {
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
        desc: EXPERIENCE_DESC[n.id] || '',
      }))

    return {
      id: primal.id,
      label: primal.label,
      color: primal.color,
      nodes: nodes.sort((a, b) => a.label.localeCompare(b.label)),
    }
  }).filter(p => p.nodes.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label))
}

function generateInsights(branches, ratings) {
  const primalStats = {}
  branches.forEach(b => {
    const stats = { vibe_rise: 0, fun: 0, pressure: 0, bored: 0, total: 0, ticked: 0 }
    b.nodes.forEach(n => {
      stats.total++
      const r = ratings[n.id]
      if (r) { stats[r]++; stats.ticked++ }
    })
    primalStats[b.id] = { ...stats, label: b.label, color: b.color }
  })

  const insights = []
  const ranked = Object.entries(primalStats)
    .filter(([, s]) => s.ticked > 0)
    .sort((a, b) => b[1].vibe_rise - a[1].vibe_rise)

  // 1. Signature — top primals by vibe_rise
  const vibeRisePrimals = ranked.filter(([, s]) => s.vibe_rise > 0)
  if (vibeRisePrimals.length >= 2) {
    const top = vibeRisePrimals.slice(0, 3).map(([, s]) => s.label)
    insights.push({
      type: 'signature',
      color: vibeRisePrimals[0][1].color,
      text: `${top.join(' and ')} ${top.length > 2 ? 'are' : 'is'} your signature. The experiences you love most live here.`,
    })
  } else if (vibeRisePrimals.length === 1) {
    insights.push({
      type: 'signature',
      color: vibeRisePrimals[0][1].color,
      text: `${vibeRisePrimals[0][1].label} is where you come alive. Every Vibe Rise experience is in this branch.`,
    })
  }

  // 2. Surprise — high tick count but low vibe_rise (they do it but don't love it)
  const mismatches = ranked.filter(([, s]) => s.ticked >= 2 && s.vibe_rise === 0 && s.fun > 0)
  if (mismatches.length > 0) {
    const m = mismatches[0][1]
    insights.push({
      type: 'surprise',
      color: m.color,
      text: `You've experienced ${m.label} but it didn't hit Vibe Rise. It recharges you without lighting you up. That's worth noticing.`,
    })
  }

  // 3. Growth edge — primals with pressure-rated items
  const growthEdges = ranked.filter(([, s]) => s.pressure > 0)
  if (growthEdges.length > 0) {
    const g = growthEdges[0][1]
    insights.push({
      type: 'growth',
      color: g.color,
      text: `${g.label} pushes you. You've experienced it but it's stressful. Your next growth edge lives here.`,
    })
  }

  // 4. Unexplored — primals with 0 ticked items
  const unexplored = Object.entries(primalStats).filter(([, s]) => s.ticked === 0)
  if (unexplored.length > 0) {
    const names = unexplored.slice(0, 3).map(([, s]) => s.label)
    insights.push({
      type: 'blind',
      color: '#999',
      text: `You haven't explored ${names.join(' or ')} yet. ${unexplored.length} branch${unexplored.length > 1 ? 'es' : ''} waiting to be discovered.`,
    })
  }

  // 5. Recommended next experience
  let recommended = null
  // Prefer: unticked node in a branch they have vibe_rise items in
  for (const [branchId, stats] of ranked) {
    if (stats.vibe_rise > 0) {
      const branch = branches.find(b => b.id === branchId)
      if (branch) {
        const unticked = branch.nodes.find(n => !ratings[n.id])
        if (unticked) {
          recommended = { ...unticked, branch: branch.label, branchColor: branch.color }
          break
        }
      }
    }
  }
  // Fallback: first unticked from any branch
  if (!recommended) {
    for (const b of branches) {
      const unticked = b.nodes.find(n => !ratings[n.id])
      if (unticked) {
        recommended = { ...unticked, branch: b.label, branchColor: b.color }
        break
      }
    }
  }

  return { insights, recommended, primalStats, unexploredCount: unexplored.length }
}

// ─── Intro Screen ───

function IntroScreen({ onStart }) {
  const [revealed, setRevealed] = useState(1)
  const allRevealed = revealed >= INTRO_LINES.length

  const handleTap = useCallback(() => {
    if (allRevealed) return
    hapticLight()
    setRevealed(prev => prev + 1)
  }, [allRevealed])

  return (
    <div className="exp-game-intro" onClick={handleTap}>
      <div className="exp-game-intro-lines">
        {INTRO_LINES.map((line, i) => {
          if (i >= revealed) return null
          return (
            <div
              key={i}
              className={`exp-game-intro-line ${line.type === 'accent' ? 'accent' : ''}`}
            >
              {line.type === 'heading' ? (
                <h1>{line.text}</h1>
              ) : (
                <p>{line.text}</p>
              )}
            </div>
          )
        })}
      </div>

      {!allRevealed && (
        <div className="exp-game-intro-tap">tap to continue</div>
      )}

      {allRevealed && (
        <div className="exp-game-intro-cta">
          <button onClick={(e) => { e.stopPropagation(); onStart() }}>Start playing →</button>
        </div>
      )}
    </div>
  )
}

// ─── Tick Screen ───

function TickScreen({ branches, checked, onToggle, onFinish }) {
  const [branchIdx, setBranchIdx] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [justEntered, setJustEntered] = useState(true)
  const [showDome, setShowDome] = useState(false)
  const listRef = useRef(null)
  const timerRef = useRef(null)

  const branch = branches[branchIdx]
  const isLast = branchIdx === branches.length - 1
  const totalChecked = Object.keys(checked).length

  useEffect(() => () => clearTimeout(timerRef.current), [])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0
    setJustEntered(true)
    const t = setTimeout(() => setJustEntered(false), 350)
    return () => clearTimeout(t)
  }, [branchIdx])

  const goNext = useCallback(() => {
    if (animating || showDome) return
    if (isLast) {
      hapticSuccess()
      // Show dome one last time before finishing
      setShowDome(true)
      return
    }
    // Show dome popup between branches
    hapticLight()
    setShowDome(true)
  }, [animating, isLast, showDome])

  const handleDomeContinue = useCallback(() => {
    setShowDome(false)
    if (isLast) {
      onFinish()
      return
    }
    setAnimating(true)
    timerRef.current = setTimeout(() => {
      setBranchIdx(prev => prev + 1)
      setAnimating(false)
    }, 250)
  }, [isLast, onFinish])

  const goBack = useCallback(() => {
    if (animating || branchIdx === 0 || showDome) return
    setAnimating(true)
    timerRef.current = setTimeout(() => {
      setBranchIdx(prev => prev - 1)
      setAnimating(false)
    }, 250)
  }, [animating, branchIdx, showDome])

  if (!branch) return null

  const branchChecked = branch.nodes.filter(n => checked[n.id]).length
  const totalNodes = branches.reduce((sum, b) => sum + b.nodes.length, 0)
  const progress = totalNodes > 0 ? (totalChecked / totalNodes) * 100 : 0

  // Dome popup overlay
  if (showDome) {
    const domeSize = Math.min(window.innerWidth - 40, 340)
    return (
      <DomeRadar
        checked={checked}
        size={domeSize}
        showLabels
        onClose={handleDomeContinue}
      />
    )
  }

  return (
    <div className="exp-game-tick">
      <div className="exp-game-tick-progress">
        <div className="exp-game-tick-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="exp-game-tick-top">
        <span className="exp-game-total">{totalChecked} experienced</span>
      </div>

      <div className="exp-game-tick-header">
        <span className="exp-game-tick-branch" style={{ color: branch.color }}>
          {branch.label}
        </span>
        <span className="exp-game-tick-count">
          {branchChecked}/{branch.nodes.length}
        </span>
      </div>

      <p className="exp-game-tick-prompt">Which of these have you experienced?</p>

      <div ref={listRef} className={`exp-game-tick-list ${justEntered ? 'entering' : ''}`}>
        {branch.nodes.map(node => {
          const isChecked = !!checked[node.id]
          return (
            <button
              key={node.id}
              className={`exp-game-tick-item ${isChecked ? 'checked' : ''}`}
              style={{ '--branch-color': branch.color }}
              onClick={() => onToggle(node.id)}
              role="checkbox"
              aria-checked={isChecked}
              aria-label={node.label}
            >
              <div className="exp-game-tick-check" aria-hidden="true">
                {isChecked ? '✓' : ''}
              </div>
              <div className="exp-game-tick-text">
                <span className="exp-game-tick-label">{node.label}</span>
                {node.desc && <span className="exp-game-tick-desc">{node.desc}</span>}
              </div>
            </button>
          )
        })}
      </div>

      <div className="exp-game-tick-nav">
        {branchIdx > 0 && (
          <button className="back-btn" onClick={goBack}>←</button>
        )}
        <button
          className={`next-btn ${isLast ? 'finish' : ''}`}
          onClick={goNext}
        >
          {isLast ? 'See my results →' : 'Next →'}
        </button>
      </div>
    </div>
  )
}

// ─── Sort Screen ───

function SortScreen({ branches, checked, ratings, onRate, onFinish }) {
  const [branchIdx, setBranchIdx] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [justEntered, setJustEntered] = useState(true)
  const listRef = useRef(null)
  const timerRef = useRef(null)

  // Filter to branches with ticked items
  const activeBranches = useMemo(() =>
    branches.filter(b => b.nodes.some(n => checked[n.id])),
    [branches, checked]
  )

  const branch = activeBranches[branchIdx]
  const isLast = branchIdx === activeBranches.length - 1
  const totalRated = Object.keys(ratings).length
  const totalTicked = Object.keys(checked).length

  useEffect(() => () => clearTimeout(timerRef.current), [])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0
    setJustEntered(true)
    const t = setTimeout(() => setJustEntered(false), 350)
    return () => clearTimeout(t)
  }, [branchIdx])

  const goNext = useCallback(() => {
    if (animating) return
    if (isLast) {
      hapticSuccess()
      onFinish()
      return
    }
    setAnimating(true)
    timerRef.current = setTimeout(() => {
      setBranchIdx(prev => prev + 1)
      setAnimating(false)
    }, 200)
  }, [animating, isLast, onFinish])

  const goBack = useCallback(() => {
    if (animating || branchIdx === 0) return
    setAnimating(true)
    timerRef.current = setTimeout(() => {
      setBranchIdx(prev => prev - 1)
      setAnimating(false)
    }, 200)
  }, [animating, branchIdx])

  if (!branch) {
    onFinish()
    return null
  }

  const checkedNodes = branch.nodes.filter(n => checked[n.id])
  const branchRated = checkedNodes.filter(n => ratings[n.id]).length
  const progress = totalTicked > 0 ? (totalRated / totalTicked) * 100 : 0

  return (
    <div className="exp-game-tick">
      <div className="exp-game-tick-progress">
        <div className="exp-game-tick-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="exp-game-tick-top">
        <div className="exp-game-total">{totalRated} of {totalTicked} rated</div>
        <DomeRadar checked={checked} ratings={ratings} size={70} showLabels={false} />
      </div>

      <div className="exp-game-tick-header">
        <span className="exp-game-tick-branch" style={{ color: branch.color }}>
          {branch.label}
        </span>
        <span className="exp-game-tick-count">
          {branchRated}/{checkedNodes.length}
        </span>
      </div>

      <p className="exp-game-tick-prompt">How did each one feel?</p>

      <div ref={listRef} className={`exp-game-tick-list ${justEntered ? 'entering' : ''}`}>
        {checkedNodes.map(node => {
          const currentState = ratings[node.id]
          return (
            <div key={node.id} className="exp-game-sort-item">
              <span className="exp-game-sort-label">{node.label}</span>
              <div className="exp-game-sort-buttons">
                {NS_STATES.map(ns => (
                  <button
                    key={ns.id}
                    className={`exp-game-sort-btn ${currentState === ns.id ? 'active' : ''}`}
                    style={{
                      '--ns-color': ns.color,
                      background: currentState === ns.id ? ns.color : undefined,
                      color: currentState === ns.id ? '#fff' : ns.color,
                      borderColor: currentState === ns.id ? ns.color : '#e0e0e0',
                    }}
                    onClick={() => { hapticLight(); onRate(node.id, ns.id) }}
                    title={ns.label}
                  >
                    {ns.icon}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="exp-game-tick-nav">
        {branchIdx > 0 && (
          <button className="back-btn" onClick={goBack}>←</button>
        )}
        <button
          className={`next-btn ${isLast ? 'finish' : ''}`}
          onClick={goNext}
        >
          {isLast ? 'See my insights →' : 'Next →'}
        </button>
      </div>
    </div>
  )
}

// ─── Insight Screen ───

function InsightScreen({ branches, checked, ratings, onExplore, onBridge }) {
  const [revealed, setRevealed] = useState(1)
  const { insights, recommended, unexploredCount } = useMemo(
    () => generateInsights(branches, ratings),
    [branches, ratings]
  )

  const allRevealed = revealed >= insights.length
  const totalRated = Object.keys(ratings).length
  const vibeCount = Object.values(ratings).filter(r => r === 'vibe_rise').length

  const handleTap = useCallback(() => {
    if (allRevealed) return
    hapticLight()
    setRevealed(prev => prev + 1)
  }, [allRevealed])

  return (
    <div className="exp-game-insight" onClick={allRevealed ? undefined : handleTap}>
      <div className="exp-game-insight-radar">
        <DomeRadar checked={checked} ratings={ratings} size={240} showLabels />
      </div>

      <div className="exp-game-insight-stats">
        <div className="exp-game-stat">
          <span className="exp-game-stat-num">{totalRated}</span>
          <span className="exp-game-stat-label">experienced</span>
        </div>
        <div className="exp-game-stat">
          <span className="exp-game-stat-num" style={{ color: '#E9A23B' }}>{vibeCount}</span>
          <span className="exp-game-stat-label">Vibe Rise</span>
        </div>
        <div className="exp-game-stat">
          <span className="exp-game-stat-num">{unexploredCount}</span>
          <span className="exp-game-stat-label">unexplored branches</span>
        </div>
      </div>

      <div className="exp-game-insight-lines">
        {insights.map((insight, i) => {
          if (i >= revealed) return null
          return (
            <div
              key={i}
              className="exp-game-insight-line"
              style={{ borderLeftColor: insight.color }}
            >
              <span className="exp-game-insight-type">{insight.type}</span>
              <p>{insight.text}</p>
            </div>
          )
        })}
      </div>

      {!allRevealed && insights.length > 1 && (
        <div className="exp-game-intro-tap">tap to reveal more</div>
      )}

      {allRevealed && (
        <div className="exp-game-insight-ctas">
          {recommended && (
            <div className="exp-game-rec">
              <span className="exp-game-rec-label">Your next experience</span>
              <span className="exp-game-rec-name" style={{ color: recommended.branchColor }}>
                {recommended.label}
              </span>
              <span className="exp-game-rec-branch">{recommended.branch}</span>
            </div>
          )}

          <button className="exp-game-cta-primary" onClick={onExplore}>
            Explore your next experience →
          </button>

          {vibeCount >= 3 && (
            <button className="exp-game-cta-secondary" onClick={onBridge}>
              Ready to build your life around this? →
            </button>
          )}

          <p className="exp-game-cta-footer">
            {58 - totalRated} experiences left to discover
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main Flow ───

const STORAGE_KEY = 'exp-game-pending'
const CHECKED_KEY = 'exp-game-checked'

export default function ExperienceGameFlow() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { bulkSetStates } = useDomeData(user?.id)
  const branches = useMemo(buildBranches, [])
  const [phase, setPhase] = useState(() => {
    // Resume from where they left off
    try {
      const saved = localStorage.getItem(CHECKED_KEY)
      if (saved && Object.keys(JSON.parse(saved)).length > 0) return 'tick'
    } catch {}
    return 'intro'
  })
  const [checked, setChecked] = useState(() => {
    try {
      const saved = localStorage.getItem(CHECKED_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })
  const [ratings, setRatings] = useState(() => {
    try {
      const pending = localStorage.getItem(STORAGE_KEY)
      return pending ? JSON.parse(pending) : {}
    } catch { return {} }
  })

  const handleToggle = useCallback((nodeId) => {
    hapticLight()
    setChecked(prev => {
      const next = { ...prev }
      if (next[nodeId]) {
        delete next[nodeId]
      } else {
        next[nodeId] = true
      }
      // Persist ticks to localStorage
      try { localStorage.setItem(CHECKED_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const handleRate = useCallback((nodeId, nsState) => {
    setRatings(prev => {
      const next = { ...prev, [nodeId]: nsState }
      // Persist ratings to localStorage
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const handleFinishTick = useCallback(() => {
    const hasAny = Object.keys(checked).length > 0
    setPhase(hasAny ? 'sort' : 'insight')
  }, [checked])

  const handleFinishSort = useCallback(() => {
    if (user?.id) {
      bulkSetStates(ratings)
      // Clear localStorage since data is now in Supabase
      try {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(CHECKED_KEY)
      } catch {}
    }
    // If not authed, localStorage already has the data from handleRate
    setPhase('insight')
  }, [user, ratings, bulkSetStates])

  const handleExplore = useCallback(() => {
    // Stay in Phase 1 — go back to dome or show recommended detail
    navigate('/rule-break-tree?layer=dome')
  }, [navigate])

  const handleBridge = useCallback(() => {
    // Bridge to Phase 2
    navigate('/get-started')
  }, [navigate])

  if (phase === 'intro') {
    return (
      <div className="exp-game">
        <IntroScreen onStart={() => setPhase('tick')} />
      </div>
    )
  }

  if (phase === 'tick') {
    return (
      <div className="exp-game">
        <TickScreen
          branches={branches}
          checked={checked}
          onToggle={handleToggle}
          onFinish={handleFinishTick}
        />
      </div>
    )
  }

  if (phase === 'sort') {
    return (
      <div className="exp-game">
        <SortScreen
          branches={branches}
          checked={checked}
          ratings={ratings}
          onRate={handleRate}
          onFinish={handleFinishSort}
        />
      </div>
    )
  }

  // Insight phase
  return (
    <div className="exp-game">
      <InsightScreen
        branches={branches}
        checked={checked}
        ratings={ratings}
        onExplore={handleExplore}
        onBridge={handleBridge}
      />
    </div>
  )
}
