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
  { id: 'bored', label: 'Bored', icon: '—', color: '#6b7280' },
]

const INTRO_LINES = [
  { type: 'heading', text: 'Life is the most magical game in the world.' },
  { type: 'body', text: 'The purpose? Have experiences you love.' },
  { type: 'body', text: "We believe there's a life path uniquely yours." },
  { type: 'accent', text: 'This app turns finding that path into a game.' },
]

// Branch order: common/relatable first, niche last
const BRANCH_ORDER = [
  'movement', 'play', 'bonds', 'story', 'nourishment', 'status',
  'healing', 'tools', 'shelter', 'fire', 'sleep', 'threat',
]

// ─── Experience descriptions (subtext) ───

const EXPERIENCE_DESC = {
  'sub-ordeal-2015': 'Multi-day outdoor challenges, survival experiences',
  'comms-2020': 'Catching up with friends and family over video call',
  'intimacy-2012': 'Tinder, Hinge, Bumble, meeting people online',
  'sub-communal-2017': 'Co-working spaces, living abroad with a community',
  'sub-digital-2015': 'Online communities, group chats, forums',
  'sub-coaching-1937': 'Small group of peers meeting regularly to grow',
  'car-1886': 'Road trips, scenic drives, cross-country adventures',
  'sub-endurance-1962': 'Jogging, running, marathon training',
  'sub-strength-2000': 'CrossFit, functional fitness, group training',
  'sub-flexibility-1893': 'Yoga classes, stretching, mind-body flow',
  'sub-temperature-2018': 'Ice baths, cold plunges, Wim Hof method',
  'sub-outdoor-1907': 'Camping, hiking, scouting, bushcraft',
  'sub-dance-1975': 'Ecstatic dance, 5Rhythms, free movement',
  'food-2002': 'Organic groceries, farmers markets, health-conscious eating',
  'sub-ancestral-2002': 'Paleo, primal eating, ancestral health',
  'sub-ferment-2010': 'Kombucha, kefir, fermented foods',
  'sub-fasting-2012': 'Intermittent fasting, time-restricted eating',
  'sub-regen-1971': 'Farm-to-table restaurants, slow food',
  'sub-regen-1994': 'Hosting dinner parties, cooking for friends',
  'ai-2022': 'ChatGPT, Claude, AI assistants, prompt engineering',
  'fashion-2021': 'Building a personal brand, online presence',
  'sub-fashion-2007': 'Ethical fashion, conscious clothing choices',
  'sub-digital-2010b': 'Curating your Instagram, visual identity',
  'sub-counter-2011': 'Minimalism, decluttering, KonMari method',
  'property-2008': 'Boutique hotels, Airbnb gems, unique stays',
  'sub-alt-2011': 'Van life, mobile living, nomad culture',
  'sub-proptech-2020': 'Remote work, home office setup',
  'sub-sacred-2010': 'Boutique gyms, SoulCycle, wellness studios',
  'media-2018': 'TikTok, Instagram Reels, short-form video',
  'sub-oral-1860': 'Stand-up comedy, open mic nights',
  'sub-oral-2015': 'Live music, concerts, music festivals',
  'sub-written-1719': 'Getting lost in a great novel',
  'sub-written-1999': 'Journaling, personal writing, creative writing',
  'sub-audio-2005': 'Podcasts, audiobooks, audio learning',
  'sub-video-2005': 'Making and publishing your own videos',
  'play-1972': 'Console games, PC gaming, mobile games',
  'sub-board-1995': 'Board game nights, Catan, strategy games',
  'sub-sport-1871': 'Team sports, pickup games, leagues',
  'sub-sport-1936': 'Watching live sport, stadium energy',
  'sub-chance-2003': 'Poker nights, card games, friendly competition',
  'sub-toy-1932': 'LEGO, model kits, hands-on building',
  'sub-combustion-1400': 'Campfire stories, fire pit gatherings',
  'sub-combustion-2019': 'Fire dancing, fire spinning, burn events',
  'sub-solar-2016': 'Solar energy, off-grid living, sustainability',
  'sub-breathwork-2015': 'Holotropic breathwork, pranayama, Wim Hof breathing',
  'sub-psychedelic-2018': 'Plant medicine ceremonies, psychedelic therapy',
  'sub-somatic-2010': 'Somatic experiencing, body-based healing',
  'sub-meditation-1950': 'Meditation retreats, Vipassana, silent sits',
  'sub-bodywork-1960': 'Massage therapy, acupuncture, bodywork',
  'sub-sleep-2017': 'Sleep optimization, tracking, wind-down rituals',
  'sub-nap-2019': 'Power naps, rest as practice',
  'sub-martial-1900': 'Self-defense, martial arts, combat sports',
  'sub-extreme-2012': 'Extreme sports, high-adrenaline activities',
  'sub-flexibility-1893': 'Yoga classes, stretching, mind-body flow',
}

// ─── Data helpers ───

function buildBranches() {
  const branchMap = {}
  PRIMALS.forEach(primal => {
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

    if (nodes.length > 0) {
      branchMap[primal.id] = {
        id: primal.id,
        label: primal.label,
        color: primal.color,
        nodes: nodes.sort((a, b) => a.label.localeCompare(b.label)),
      }
    }
  })

  // Order by BRANCH_ORDER (common first, niche last)
  return BRANCH_ORDER
    .filter(id => branchMap[id])
    .map(id => branchMap[id])
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
      text: `${vibeRisePrimals[0][1].label} lights you up. Start here.`,
    })
  }

  const mismatches = ranked.filter(([, s]) => s.ticked >= 2 && s.vibe_rise === 0 && s.fun > 0)
  if (mismatches.length > 0) {
    const m = mismatches[0][1]
    insights.push({
      type: 'surprise',
      color: m.color,
      text: `You do a lot of ${m.label}, but it doesn't hit Vibe Rise. Fun, not fulfilling. Worth noticing.`,
    })
  }

  const growthEdges = ranked.filter(([, s]) => s.pressure > 0)
  if (growthEdges.length > 0) {
    const g = growthEdges[0][1]
    insights.push({
      type: 'growth edge',
      color: g.color,
      text: `${g.label} pushes you. You've experienced it but it's stressful. Your next growth edge lives here.`,
    })
  }

  const unexplored = Object.entries(primalStats).filter(([, s]) => s.ticked === 0)
  if (unexplored.length > 0) {
    insights.push({
      type: 'unexplored',
      color: '#9ca3af',
      text: `${unexplored.length} branch${unexplored.length > 1 ? 'es' : ''} you haven't touched yet: ${unexplored.map(([, s]) => s.label).join(', ')}.`,
    })
  }

  // Recommended next experience
  let recommended = null
  for (const b of branches) {
    const unticked = b.nodes.find(n => !ratings[n.id])
    if (unticked) {
      const branch = primalStats[b.id]
      if (branch && branch.vibe_rise > 0) {
        recommended = { ...unticked, branch: branch.label, branchColor: b.color }
        break
      }
    }
  }
  if (!recommended) {
    for (const b of branches) {
      const unticked = b.nodes.find(n => !ratings[n.id])
      if (unticked) {
        recommended = { ...unticked, branch: b.label, branchColor: b.color }
        break
      }
    }
  }

  return { insights, recommended, unexploredCount: unexplored.length }
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
            <div key={i} className={`exp-game-intro-line ${line.type === 'accent' ? 'accent' : ''}`}>
              {line.type === 'heading' ? <h1>{line.text}</h1> : <p>{line.text}</p>}
            </div>
          )
        })}
      </div>
      {!allRevealed && <div className="exp-game-intro-tap">tap to continue</div>}
      {allRevealed && (
        <div className="exp-game-intro-cta">
          <button onClick={(e) => { e.stopPropagation(); onStart() }}>Start playing →</button>
        </div>
      )}
    </div>
  )
}

// ─── Branch Screen (tick + rate merged) ───

function BranchScreen({ branches, checked, ratings, onToggle, onRate, onFinish }) {
  const [branchIdx, setBranchIdx] = useState(0)
  const [step, setStep] = useState('tick') // 'tick' | 'rate' | 'dome'
  const [animating, setAnimating] = useState(false)
  const [justEntered, setJustEntered] = useState(true)
  const listRef = useRef(null)
  const timerRef = useRef(null)

  const branch = branches[branchIdx]
  const isLast = branchIdx === branches.length - 1
  const totalChecked = Object.keys(checked).length
  const totalRated = Object.keys(ratings).length
  const totalNodes = branches.reduce((sum, b) => sum + b.nodes.length, 0)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0
    setJustEntered(true)
    const t = setTimeout(() => setJustEntered(false), 350)
    return () => clearTimeout(t)
  }, [branchIdx, step])

  const branchCheckedNodes = branch ? branch.nodes.filter(n => checked[n.id]) : []
  const branchRated = branchCheckedNodes.filter(n => ratings[n.id]).length

  const goNext = useCallback(() => {
    if (animating) return
    hapticLight()

    if (step === 'tick') {
      // If they ticked items, go to rate. If not, skip to dome/next branch.
      if (branchCheckedNodes.length > 0) {
        setStep('rate')
      } else {
        // No items ticked, skip rating, show dome briefly then advance
        setStep('dome')
      }
      return
    }

    if (step === 'rate') {
      // Show dome after rating
      setStep('dome')
      return
    }

    if (step === 'dome') {
      if (isLast) {
        hapticSuccess()
        onFinish()
        return
      }
      setAnimating(true)
      timerRef.current = setTimeout(() => {
        setBranchIdx(prev => prev + 1)
        setStep('tick')
        setAnimating(false)
      }, 250)
    }
  }, [animating, step, branchCheckedNodes.length, isLast, onFinish])

  const goBack = useCallback(() => {
    if (animating) return
    if (step === 'rate') { setStep('tick'); return }
    if (step === 'dome') { setStep(branchCheckedNodes.length > 0 ? 'rate' : 'tick'); return }
    if (branchIdx === 0) return
    setAnimating(true)
    timerRef.current = setTimeout(() => {
      setBranchIdx(prev => prev - 1)
      setStep('tick')
      setAnimating(false)
    }, 250)
  }, [animating, step, branchIdx, branchCheckedNodes.length])

  if (!branch) return null

  const progress = totalNodes > 0 ? ((branchIdx + (step === 'dome' ? 1 : step === 'rate' ? 0.5 : 0)) / branches.length) * 100 : 0

  // Dome view between branches
  if (step === 'dome') {
    const domeSize = Math.min(window.innerWidth - 40, 340)
    return (
      <DomeRadar
        checked={checked}
        ratings={ratings}
        size={domeSize}
        showLabels
        onClose={goNext}
      />
    )
  }

  return (
    <div className="exp-game-tick">
      <div className="exp-game-tick-progress">
        <div className="exp-game-tick-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="exp-game-tick-top">
        <span className="exp-game-total">
          {step === 'tick' ? `${totalChecked} experienced` : `${totalRated} rated`}
        </span>
        {step === 'rate' && (
          <DomeRadar checked={checked} ratings={ratings} size={70} showLabels={false} />
        )}
      </div>

      <div className="exp-game-tick-header">
        <span className="exp-game-tick-branch" style={{ color: '#5e17eb' }}>
          {branch.label}
        </span>
        <span className="exp-game-tick-count">
          {step === 'tick'
            ? `${branchCheckedNodes.length}/${branch.nodes.length}`
            : `${branchRated}/${branchCheckedNodes.length}`
          }
        </span>
      </div>

      <p className="exp-game-tick-prompt">
        {step === 'tick' ? 'Which of these have you experienced?' : 'How did each one feel?'}
      </p>

      <div ref={listRef} className={`exp-game-tick-list ${justEntered ? 'entering' : ''}`}>
        {step === 'tick' ? (
          // Tick mode — checkboxes
          branch.nodes.map(node => {
            const isChecked = !!checked[node.id]
            return (
              <button
                key={node.id}
                className={`exp-game-tick-item ${isChecked ? 'checked' : ''}`}
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
          })
        ) : (
          // Rate mode — name on own line, labeled NS buttons below
          branchCheckedNodes.map(node => {
            const currentState = ratings[node.id]
            return (
              <div key={node.id} className="exp-game-rate-card">
                <span className="exp-game-rate-name">{node.label}</span>
                <div className="exp-game-rate-options">
                  {NS_STATES.map(ns => (
                    <button
                      key={ns.id}
                      className={`exp-game-rate-btn ${currentState === ns.id ? 'active' : ''}`}
                      style={{
                        '--ns-color': ns.color,
                        borderColor: currentState === ns.id ? ns.color : 'rgba(0,0,0,0.08)',
                        background: currentState === ns.id ? ns.color : 'transparent',
                        color: currentState === ns.id ? '#fff' : ns.color,
                      }}
                      onClick={() => { hapticLight(); onRate(node.id, ns.id) }}
                    >
                      <span className="exp-game-rate-icon">{ns.icon}</span>
                      <span className="exp-game-rate-label">{ns.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="exp-game-tick-nav">
        {(branchIdx > 0 || step !== 'tick') && (
          <button className="back-btn" onClick={goBack}>←</button>
        )}
        <button
          className={`next-btn ${isLast && step === 'rate' ? 'finish' : ''}`}
          onClick={goNext}
        >
          {step === 'tick' && branchCheckedNodes.length === 0 ? 'Skip →' :
           step === 'tick' ? 'Rate these →' :
           isLast ? 'See my results →' : 'Next →'}
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
          <span className="exp-game-stat-label">unexplored</span>
        </div>
      </div>

      <div className="exp-game-insight-lines">
        {insights.map((insight, i) => {
          if (i >= revealed) return null
          return (
            <div key={i} className="exp-game-insight-line" style={{ borderLeftColor: insight.color }}>
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
              Ready to go deeper on a life path? →
            </button>
          )}

          <p className="exp-game-cta-footer">
            {56 - totalRated} experiences left to discover
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
    try {
      const saved = localStorage.getItem(CHECKED_KEY)
      if (saved && Object.keys(JSON.parse(saved)).length > 0) return 'play'
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
      try { localStorage.setItem(CHECKED_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const handleRate = useCallback((nodeId, nsState) => {
    setRatings(prev => {
      const next = { ...prev, [nodeId]: nsState }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const handleFinish = useCallback(() => {
    if (user?.id) {
      bulkSetStates(ratings)
      try {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(CHECKED_KEY)
      } catch {}
    }
    setPhase('insight')
  }, [user, ratings, bulkSetStates])

  const handleExplore = useCallback(() => {
    navigate('/7-day-challenge?tab=discover')
  }, [navigate])

  const handleBridge = useCallback(() => {
    navigate('/life-paths')
  }, [navigate])

  if (phase === 'intro') {
    return (
      <div className="exp-game">
        <IntroScreen onStart={() => setPhase('play')} />
      </div>
    )
  }

  if (phase === 'play') {
    return (
      <div className="exp-game">
        <BranchScreen
          branches={branches}
          checked={checked}
          ratings={ratings}
          onToggle={handleToggle}
          onRate={handleRate}
          onFinish={handleFinish}
        />
      </div>
    )
  }

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
