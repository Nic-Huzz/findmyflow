import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import UnstickFlow from './UnstickFlow'
import QuestPathMap from './level/QuestPathMap'
import JourneyTimeline from './journey/JourneyTimeline'
import JourneyOnboarding from './journey/JourneyOnboarding'
import JourneyCompleted from './journey/JourneyCompleted'
import OrphanWahooLinker from './journey/OrphanWahooLinker'
import SkillsDisplay from './journey/SkillsDisplay'
import './JourneyTab.css'

// Hero stage names (Campbell) + movie references
const HERO_STAGES = [
  // Stages 0-1 are pre-app. New users start seeing Stage 2 (signing up = answering the call)
  { stage: 0, name: 'Call to Adventure', references: [
    'Ariel seeing the surface world for the first time.',
    'Peter Parker getting bitten by the spider.',
    'Neo seeing the Matrix for the first time.',
  ]},
  { stage: 1, name: 'Call to Adventure', references: [
    'Ariel seeing the surface world for the first time.',
    'Peter Parker getting bitten by the spider.',
    'Neo seeing the Matrix for the first time.',
  ]},
  { stage: 2, name: 'Call to Adventure', references: [
    'Ariel seeing the surface world for the first time.',
    'Peter Parker getting bitten by the spider.',
    'Neo seeing the Matrix for the first time.',
  ]},
  { stage: 3, name: 'Refusal of the Call', references: [
    'Simba running away to the jungle.',
    'Miles Morales saying "I can\'t do this."',
    'Frodo saying "I wish the ring had never come to me."',
  ]},
  { stage: 4, name: 'Meeting the Mentor', references: [
    'Aladdin meeting the Genie.',
    'Tony Stark building the first suit in the cave.',
    'Luke meeting Yoda on Dagobah.',
  ]},
  { stage: 5, name: 'Crossing the Threshold', references: [
    'Jasmine and Aladdin on the magic carpet for the first time.',
    'Spider-Man\'s first swing through New York.',
    'Neo dodging bullets for the first time.',
  ]},
  { stage: 6, name: 'Tests, Allies, Enemies', references: [
    'Mulan training with the army.',
    'The Avengers learning to fight together.',
    'Rocky running up the stairs.',
  ]},
  { stage: 7, name: 'Approach to the Inmost Cave', references: [
    'Simba returning to the Pride Lands to face Scar.',
    'Doctor Strange facing Dormammu.',
    'Luke entering the cave on Dagobah.',
  ]},
  { stage: 8, name: 'The Ordeal', references: [
    'Mufasa\'s death breaking Simba open.',
    'Tony Stark snapping the Infinity Gauntlet.',
    'Neo dying and coming back as The One.',
  ]},
  { stage: 9, name: 'Reward', references: [
    'Simba taking his place on Pride Rock.',
    'Thor finally becoming worthy.',
    'Frodo holding the ring at Mount Doom.',
  ]},
  { stage: 10, name: 'The Road Back', references: [
    'Woody choosing to leave Andy.',
    'Spider-Man returning to Queens.',
    'Bilbo writing his book.',
  ]},
]

export default function JourneyTab({ userId, onUnlockTab }) {
  const navigate = useNavigate()
  const [heroStage, setHeroStage] = useState(0)
  const [voiceCounts, setVoiceCounts] = useState({})
  const [brief, setBrief] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showUnstickFlow, setShowUnstickFlow] = useState(false)
  const [lifePaths, setLifePaths] = useState([])
  const [allQuests, setAllQuests] = useState([])
  const [questTasks, setQuestTasks] = useState({})
  const [trunkState, setTrunkState] = useState(null)
  const [safety, setSafety] = useState(0)
  const [careers, setCareers] = useState([])
  const [showFlowMap, setShowFlowMap] = useState(false)
  const [solidarityCount, setSolidarityCount] = useState(0)
  const [orphanedWahoos, setOrphanedWahoos] = useState([])
  const [showTimeline, setShowTimeline] = useState(false)
  const [showOrphanLinker, setShowOrphanLinker] = useState(false)
  const [userEmail, setUserEmail] = useState(null)

  // Lightweight figurine display data (replaces heavy useFigurine hook)
  const [figurineDisplay, setFigurineDisplay] = useState(null)
  const [clarityPct, setClarityPct] = useState(null)

  useEffect(() => {
    if (!userId) return
    let active = true

    // ─── Batch 1: all independent queries in parallel ───
    Promise.all([
      supabase.from('user_stage_progress')
        .select('current_journey_level, essence_mirror_completed, hero_avatar_url')
        .eq('user_id', userId).maybeSingle(),
      supabase.from('healing_intentions')
        .select('protective_voice')
        .eq('user_id', userId)
        .not('protective_voice', 'is', null),
      supabase.from('nervous_system_checkins')
        .select('protective_voice')
        .eq('user_id', userId)
        .not('protective_voice', 'is', null),
      supabase.from('zarlo_briefs')
        .select('brief')
        .eq('user_id', userId).maybeSingle(),
      supabase.from('quests')
        .select('id, label, status, predicted_state, depth_level, close_reason')
        .eq('user_id', userId)
        .neq('label', 'Healing Work')
        .order('created_at'),
      supabase.auth.getUser(),
      supabase.from('groan_challenges')
        .select('id, title, challenge_text')
        .eq('user_id', userId)
        .eq('status', 'completed'),
      supabase.from('quest_tasks')
        .select('groan_challenge_id')
        .eq('user_id', userId)
        .not('groan_challenge_id', 'is', null),
      // Lightweight figurine display data (no RPCs, no memories)
      supabase.from('lead_flow_profiles')
        .select('essence_archetype, custom_essence_name')
        .eq('user_id', userId).maybeSingle(),
      supabase.from('nervous_system_checkins')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('checkin_type', 'daily'),
      supabase.from('quest_completions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('quest_category', 'Groans'),
      supabase.from('nikigai_clusters')
        .select('resonance_state, resonance_rating')
        .eq('user_id', userId)
        .in('cluster_type', ['skills', 'problems', 'persona'])
        .is('step_id', null)
        .eq('cluster_stage', 'final')
        .eq('is_removed', false),
    ]).then(([stageRes, hiVoiceRes, nsVoiceRes, briefRes, questsRes, authRes, completedRes, linkedRes, profileRes, checkinCountRes, wahooCountRes, clarityRes]) => {
      if (!active) return

      const stage = stageRes.data?.current_journey_level || 0
      setHeroStage(stage)
      setBrief(briefRes.data?.brief || null)

      // Compute figurine display (lightweight, no useFigurine hook)
      const isUnlocked = stage >= 4 && stageRes.data?.essence_mirror_completed
      const checkinCount = checkinCountRes.count || 0
      const wahooCount = wahooCountRes.count || 0
      const isMirrorMode = wahooCount < 3 || checkinCount < 7
      if (isUnlocked && profileRes.data) {
        setFigurineDisplay({
          avatarUrl: stageRes.data?.hero_avatar_url || null,
          name: profileRes.data.custom_essence_name || profileRes.data.essence_archetype || 'Your Mentor',
          phaseName: 'Your Essence Voice Mentor',
          isMirrorMode,
          canChat: !isMirrorMode,
        })
      }

      // Clarity score from cluster resonance ratings
      // Clarity: % of clusters rated vibe_rise or fun
      const allClusters = clarityRes.data || []
      const ratedClusters = allClusters.filter(c => {
        const state = c.resonance_state || (c.resonance_rating >= 4 ? 'vibe_rise' : c.resonance_rating >= 3 ? 'fun' : null)
        return state === 'vibe_rise' || state === 'fun'
      })
      if (allClusters.length > 0) {
        setClarityPct(Math.round((ratedClusters.length / allClusters.length) * 100))
      }

      const email = authRes.data?.user?.email
      setUserEmail(email || null)

      // Voice counts
      const counts = {}
      const allVoices = [...(hiVoiceRes.data || []), ...(nsVoiceRes.data || [])]
      allVoices.forEach(row => {
        if (row.protective_voice)
          counts[row.protective_voice] = (counts[row.protective_voice] || 0) + 1
      })
      setVoiceCounts(counts)

      const allQuestsData = questsRes.data || []
      setAllQuests(allQuestsData)
      const activeQuests = allQuestsData.filter(q => q.status === 'active')
      setLifePaths(activeQuests)

      // Orphaned wahoos (no further queries needed)
      const linkedIds = new Set((linkedRes.data || []).map(t => t.groan_challenge_id))
      setOrphanedWahoos(
        (completedRes.data || []).filter(w => !linkedIds.has(w.id))
      )

      // ─── Batch 2: queries that depend on batch 1 results, all parallel ───
      const batch2 = []

      // Solidarity count (needs dominant voice)
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
      if (sorted.length > 0) {
        batch2.push(
          supabase
            .from('nervous_system_checkins')
            .select('user_id', { count: 'exact', head: true })
            .eq('protective_voice', sorted[0][0])
            .neq('user_id', userId)
            .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
            .then(({ count }) => { if (active) setSolidarityCount(count || 0) })
        )
      }

      // Quest tasks for Flow Map (needs all quest IDs, not just active)
      if (allQuestsData.length > 0) {
        batch2.push(
          supabase
            .from('quest_tasks')
            .select('*')
            .in('quest_id', allQuestsData.map(q => q.id))
            .order('sort_order')
            .then(async ({ data: allTasks }) => {
              if (!active || !allTasks) return

              // Fetch depth_level from groan_challenges for tasks with a groan link
              const groanIds = allTasks.filter(t => t.groan_challenge_id).map(t => t.groan_challenge_id)
              let depthMap = {}
              if (groanIds.length > 0) {
                const { data: depths } = await supabase
                  .from('groan_challenges')
                  .select('id, depth_level')
                  .in('id', groanIds)
                depths?.forEach(d => { depthMap[d.id] = d.depth_level })
              }

              const taskMap = {}
              allTasks.forEach(t => {
                const task = { ...t, depth_level: depthMap[t.groan_challenge_id] || null }
                if (!taskMap[task.quest_id]) taskMap[task.quest_id] = []
                taskMap[task.quest_id].push(task)
              })
              setQuestTasks(taskMap)
            })
        )
      }

      // Life path sessions (needs email)
      if (email) {
        batch2.push(
          supabase
            .from('life_path_sessions')
            .select('current_state, safety, careers')
            .eq('client_email', email)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(({ data: sessionData }) => {
              if (!active || !sessionData) return
              setTrunkState(sessionData.current_state)
              setSafety(sessionData.safety || 0)
              setCareers(sessionData.careers || [])
            })
        )
      }

      return Promise.all(batch2)
    }).then(() => {
      if (active) setLoading(false)
    }).catch(err => {
      console.error('JourneyTab data load error:', err)
      if (active) setLoading(false)
    })

    return () => { active = false }
  }, [userId])

  if (loading) return <div className="jt-loading">Loading journey...</div>

  const stageInfo = HERO_STAGES[heroStage] || HERO_STAGES[0]
  const sorted = Object.entries(voiceCounts).sort((a, b) => b[1] - a[1])
  const dominant = sorted[0] // [name, count] or undefined

  return (
    <div className="jt-container">
      {/* Current Stage — unified card with next step + progress */}
      <div className="jt-stage-card">
        <div className="jt-stage-number">Stage {Math.max(heroStage, 2)}</div>
        <h2 className="jt-stage-name">{stageInfo.name}</h2>
        {stageInfo.references?.length > 0 && (
          <div className="jt-stage-refs">
            <p className="jt-stage-ref-label">Think:</p>
            {stageInfo.references.map((ref, i) => (
              <p key={i} className="jt-stage-ref">{ref}</p>
            ))}
          </div>
        )}

        {/* Next step — clear action + where to go */}
        <div className="jt-stage-next">
          {heroStage <= 2 && (
            <div className="jt-next-inline">
              <span className="jt-next-label">Next step</span>
              <span className="jt-next-text">Complete the Getting Started steps below to begin your journey.</span>
              <span className="jt-next-arrow">↓</span>
            </div>
          )}
          {heroStage === 3 && (
            <a href="/essence-mirror" className="jt-next-inline">
              <span className="jt-next-label">Next step</span>
              <span className="jt-next-text">Create your hero avatar. Go to the Essence Mirror.</span>
              <span className="jt-next-arrow">→</span>
            </a>
          )}
          {heroStage === 4 && (
            <div className="jt-next-inline">
              <span className="jt-next-label">Next step</span>
              <span className="jt-next-text">Complete a courage challenge. Any feeling counts.</span>
            </div>
          )}
          {heroStage === 5 && (
            <div className="jt-next-inline">
              <span className="jt-next-label">Next step</span>
              <span className="jt-next-text">Focus your courage challenges on one life path. Go deeper.</span>
            </div>
          )}
          {heroStage === 6 && (
            <div className="jt-next-inline">
              <span className="jt-next-label">Next step</span>
              <span className="jt-next-text">
                After a courage challenge, tap "Explore what makes this scary?" to start a healing flow.
              </span>
              {dominant && (
                <div className="jt-voice-progress">
                  <div className="jt-voice-progress-header">
                    <span className="jt-voice-progress-name">{formatVoice(dominant[0])}</span>
                    <span className="jt-voice-progress-count">{dominant[1]}/5</span>
                  </div>
                  <div className="jt-voice-bar">
                    <div className="jt-voice-bar-fill" style={{ width: `${(dominant[1] / 5) * 100}%` }} />
                  </div>
                  <span className="jt-voice-progress-hint">
                    {dominant[1] < 5
                      ? 'Your most common protective voice. Keep exploring it.'
                      : 'Pattern clear. You\'re ready for the next stage.'}
                  </span>
                </div>
              )}
              {solidarityCount > 0 && (
                <span className="jt-solidarity">
                  {solidarityCount} other{solidarityCount > 1 ? 's' : ''} named this voice too.
                </span>
              )}
            </div>
          )}
          {heroStage === 7 && (
            <div className="jt-next-inline">
              <span className="jt-next-label">Next step</span>
              <span className="jt-next-text">The root is close. This part needs a human, not an app.</span>
              <a href="https://calendly.com/nichuzz/vibe-rise" target="_blank" rel="noopener noreferrer" className="jt-next-cta-btn">
                Book a session with Huzz
              </a>
            </div>
          )}
          {heroStage === 8 && (
            <div className="jt-next-inline">
              <span className="jt-next-label">Next step</span>
              <span className="jt-next-text">You've been through the fire. Check in when you're ready.</span>
            </div>
          )}
          {heroStage === 9 && (
            <div className="jt-next-inline">
              <span className="jt-next-label">Next step</span>
              <span className="jt-next-text">Your life paths are connecting. Watch for where they overlap.</span>
            </div>
          )}
          {heroStage >= 10 && (
            <div className="jt-next-inline">
              <span className="jt-next-label">Next step</span>
              <span className="jt-next-text">Your flow statement is forming. Keep going.</span>
            </div>
          )}
        </div>

        <button className="jt-stage-history-btn" onClick={() => setShowTimeline(!showTimeline)}>
          Your Hero's Journey {showTimeline ? '▴' : '▾'}
        </button>
      </div>

      {/* Timeline dropdown */}
      {showTimeline && <JourneyTimeline userId={userId} heroStage={heroStage} userEmail={userEmail} />}

      {/* Figurine Presence (lightweight display, no heavy hook) */}
      {figurineDisplay && (
        <div className="jt-section jt-figurine-presence">
          {figurineDisplay.avatarUrl && <img src={figurineDisplay.avatarUrl} alt="" className="jt-figurine-avatar" />}
          <div className="jt-figurine-info">
            <span className="jt-figurine-name">{figurineDisplay.name}</span>
            <span className="jt-figurine-phase">{figurineDisplay.phaseName}</span>
          </div>
          {figurineDisplay.canChat && (
            <button className="jt-figurine-chat-btn" onClick={() => {/* TODO: open figurine chat */}}>
              Talk to your mentor
            </button>
          )}
          {figurineDisplay.isMirrorMode && (
            <p className="jt-figurine-mirror-msg">Your mentor is still learning about you.</p>
          )}
        </div>
      )}

      {/* Orphaned Wahoos — prompt to link */}
      {orphanedWahoos.length > 0 && !showOrphanLinker && (
        <div className="jt-section jt-orphan-section">
          <h3 className="jt-section-title">Connect your wins to a life path</h3>
          <p className="jt-orphan-intro">
            You've done {orphanedWahoos.length} courage challenge{orphanedWahoos.length > 1 ? 's' : ''} not connected to a life path yet.
          </p>
          {lifePaths.length === 0 ? (
            <a href="/life-paths" className="jt-orphan-cta">Map Your Life Paths first →</a>
          ) : (
            <button className="jt-orphan-cta" onClick={() => setShowOrphanLinker(true)}>
              Link them now →
            </button>
          )}
        </div>
      )}

      {/* Orphan Linker Popup */}
      {showOrphanLinker && (
        <OrphanWahooLinker
          wahoos={orphanedWahoos}
          userId={userId}
          onLinked={() => {
            setShowOrphanLinker(false)
            setOrphanedWahoos([])
            supabase.from('quests')
              .select('id, label, status, predicted_state, depth_level')
              .eq('user_id', userId).eq('status', 'active').neq('label', 'Healing Work')
              .order('created_at')
              .then(({ data }) => { if (data) setLifePaths(data) })
          }}
          onClose={() => setShowOrphanLinker(false)}
        />
      )}

      {/* Onboarding — only if items incomplete */}
      <JourneyOnboarding userId={userId} onUnlockTab={onUnlockTab} />

      {/* Clarity number removed — zone matrix on Quests tab is the visualization */}

      {/* Guidance nudge — clarity-based */}
      {clarityPct != null && clarityPct < 60 && (
        <div className="jt-nudge">
          💡 Your Clarity is still building. Try exploring a new curiosity or completing your Life Map to sharpen it.
        </div>
      )}

      {/* Life Paths Summary */}
      {lifePaths.length > 0 && (
        <div className="jt-section">
          <h3 className="jt-section-title">Your Life Paths</h3>
          <div className="jt-paths-list">
            {[...lifePaths].sort((a, b) => {
              const order = { vibe: 0, peace: 1, anxious: 2, shutdown: 3 }
              return (order[a.predicted_state] ?? 4) - (order[b.predicted_state] ?? 4)
            }).map(path => (
              <div key={path.id} className={`jt-path-row jt-path-state-${path.predicted_state || 'none'}`}>
                <span className="jt-path-dot" style={{
                  background: path.predicted_state === 'vibe' ? '#E9A23B'
                    : path.predicted_state === 'peace' ? '#10b981'
                    : path.predicted_state === 'anxious' ? '#ef4444'
                    : path.predicted_state === 'shutdown' ? '#6b7280'
                    : '#d1d5db'
                }} />
                <span className="jt-path-name">{path.label}</span>
                {path.depth_level && (
                  <span className="jt-path-depth">
                    {path.depth_level === 'education' ? 'L0'
                      : path.depth_level === 'testing' ? 'L1'
                      : path.depth_level === 'practising' ? 'L2'
                      : path.depth_level === 'charging' ? 'L3'
                      : path.depth_level === 'teaching' ? 'L4'
                      : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
          <button className="jt-flowmap-btn" onClick={() => setShowFlowMap(true)}>
            View Flow Map
          </button>
        </div>
      )}

      {/* Flow Map overlay */}
      {showFlowMap && (
        <QuestPathMap
          quests={allQuests}
          questTasks={questTasks}
          trunkState={trunkState}
          safety={safety}
          careers={careers}
          userId={userId}
          onUpdate={() => {
            supabase.from('quests')
              .select('id, label, status, predicted_state, depth_level, close_reason')
              .eq('user_id', userId).neq('label', 'Healing Work')
              .order('created_at')
              .then(({ data }) => {
                if (!data) return
                setAllQuests(data)
                setLifePaths(data.filter(q => q.status === 'active'))
              })
          }}
          onClose={() => setShowFlowMap(false)}
        />
      )}

      {/* Mirror link — hidden until /mirror page is finalized */}

      {/* Self-Knowledge Skills */}
      <SkillsDisplay userId={userId} />

      {/* Zone Assessments — archived, re-enable when redesigned */}

      {/* Completed exercises + closed quests */}
      <JourneyCompleted userId={userId} />

      {/* Stuck Detection (from Zarlo Brief) */}
      {brief?.thresholds?.stage_stuck_days > 0 && (
        <div className="jt-section jt-stuck-section">
          <span className="jt-stuck-icon">🧭</span>
          <p className="jt-stuck-message">
            {getStuckMessage(heroStage, brief.thresholds.stage_stuck_days)}
          </p>
          {brief.thresholds.stage_stuck_days > 7 && (
            <button className="jt-stuck-cta" onClick={() => setShowUnstickFlow(true)}>
              Let's work through it
            </button>
          )}
        </div>
      )}

      {/* Approaching Thresholds (from Zarlo Brief) */}
      {brief?.thresholds?.streak_milestone_approaching && (
        <div className="jt-section">
          <p className="jt-threshold-hint">
            Streak milestone approaching: {brief.thresholds.streak_milestone_approaching.replace('_', '-')}
          </p>
        </div>
      )}

      {showUnstickFlow && (
        <UnstickFlow
          userId={userId}
          heroStage={heroStage}
          onClose={() => setShowUnstickFlow(false)}
          onWahooCreated={() => {
            setShowUnstickFlow(false)
            // Refresh data so voice dots / stage update
            window.location.reload() // Simple V1. Replace with state refresh in V2.
          }}
        />
      )}
    </div>
  )
}

function getStuckMessage(stage, days) {
  if (days <= 7) return "You've been here a while. That's not wrong. The journey has its own pace."
  if (stage <= 3) return "There's a step you haven't taken yet. It's simpler than you think."
  if (stage === 4) return "You've done wahoos but none have hit Vibe Rise yet. Let's figure out what lights you up."
  if (stage === 5) return "You hit Vibe Rise once. What stopped you from going back?"
  if (stage === 6) return "Your courage is growing but the pattern underneath hasn't surfaced. Let's dig."
  if (stage === 7) return "You've seen the root. The next step isn't in the app. What's holding you back from booking?"
  return "There's something you haven't tried yet."
}

function formatVoice(name) {
  return name?.charAt(0).toUpperCase() + name?.slice(1).replace(/_/g, ' ')
}
