import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import UnstickFlow from './UnstickFlow'
import QuestPathMap from './level/QuestPathMap'
import JourneyTimeline from './journey/JourneyTimeline'
import JourneyOnboarding from './journey/JourneyOnboarding'
import JourneyZones from './journey/JourneyZones'
import JourneyCompleted from './journey/JourneyCompleted'
import { useFigurine } from '../hooks/useFigurine'
import './JourneyTab.css'

// Hero stage names (Campbell) + feeling targets
const HERO_STAGES = [
  { stage: 0, name: 'Not Started', feeling: '' },
  { stage: 1, name: 'Ordinary World', feeling: '' },
  { stage: 2, name: 'Call to Adventure', feeling: 'Something just shifted. I can\'t go back.' },
  { stage: 3, name: 'Refusal of the Call', feeling: 'I can see it but I can\'t reach it.' },
  { stage: 4, name: 'Meeting the Mentor', feeling: 'I feel so seen. I have words for this now.' },
  { stage: 5, name: 'Crossing the Threshold', feeling: 'I didn\'t know I could feel this alive.' },
  { stage: 6, name: 'Tests, Allies, Enemies', feeling: 'I\'m actually doing it. Every day.' },
  { stage: 7, name: 'Approach to the Inmost Cave', feeling: 'That\'s what\'s been stopping me.' },
  { stage: 8, name: 'The Ordeal', feeling: 'That hurt. But something released.' },
  { stage: 9, name: 'Reward', feeling: 'Of course. This was always my path.' },
  { stage: 10, name: 'The Road Back', feeling: 'I\'m doing the thing. For real.' },
]

export default function JourneyTab({ userId }) {
  const [heroStage, setHeroStage] = useState(0)
  const [voiceCounts, setVoiceCounts] = useState({})
  const [brief, setBrief] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showUnstickFlow, setShowUnstickFlow] = useState(false)
  const [lifePaths, setLifePaths] = useState([])
  const [questTasks, setQuestTasks] = useState({})
  const [trunkState, setTrunkState] = useState(null)
  const [safety, setSafety] = useState(0)
  const [careers, setCareers] = useState([])
  const [showFlowMap, setShowFlowMap] = useState(false)
  const [solidarityCount, setSolidarityCount] = useState(0)
  const [orphanedWahoos, setOrphanedWahoos] = useState([])
  const figurine = useFigurine()

  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase.from('user_stage_progress')
        .select('current_journey_level')
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
        .select('id, label, status, predicted_state, depth_level')
        .eq('user_id', userId)
        .eq('status', 'active')
        .neq('label', 'Healing Work')
        .order('created_at'),
    ]).then(async ([stageRes, hiVoiceRes, nsVoiceRes, briefRes, questsRes]) => {
      setHeroStage(stageRes.data?.current_journey_level || 0)

      const counts = {}
      const allVoices = [...(hiVoiceRes.data || []), ...(nsVoiceRes.data || [])]
      allVoices.forEach(row => {
        if (row.protective_voice)
          counts[row.protective_voice] = (counts[row.protective_voice] || 0) + 1
      })
      setVoiceCounts(counts)
      setBrief(briefRes.data?.brief || null)

      // Anonymous solidarity: how many others identified the same dominant voice this month?
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
      if (sorted.length > 0) {
        const dominantVoiceName = sorted[0][0]
        const { count: othersCount } = await supabase
          .from('nervous_system_checkins')
          .select('user_id', { count: 'exact', head: true })
          .eq('protective_voice', dominantVoiceName)
          .neq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
        setSolidarityCount(othersCount || 0)
      }

      const activeQuests = questsRes.data || []
      setLifePaths(activeQuests)

      // Fetch quest tasks for Flow Map
      if (activeQuests.length > 0) {
        const { data: allTasks } = await supabase
          .from('quest_tasks')
          .select('*')
          .in('quest_id', activeQuests.map(q => q.id))
          .order('sort_order')
        const taskMap = {}
        ;(allTasks || []).forEach(t => {
          if (!taskMap[t.quest_id]) taskMap[t.quest_id] = []
          taskMap[t.quest_id].push(t)
        })
        setQuestTasks(taskMap)
      }

      // Fetch trunk state from life_path_sessions (filtered by client_email)
      const { data: userData } = await supabase.auth.getUser()
      const email = userData?.user?.email
      if (email) {
        const { data: sessionData } = await supabase
          .from('life_path_sessions')
          .select('current_state, safety, careers')
          .eq('client_email', email)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (sessionData) {
          setTrunkState(sessionData.current_state)
          setSafety(sessionData.safety || 0)
          setCareers(sessionData.careers || [])
        }
      }

      // Orphaned wahoos: completed but not linked to any quest
      const completedRes = await supabase
        .from('groan_challenges')
        .select('id, title, challenge_text')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .limit(50)

      const linkedRes = await supabase
        .from('quest_tasks')
        .select('groan_challenge_id')
        .eq('user_id', userId)
        .not('groan_challenge_id', 'is', null)

      const linkedIds = new Set((linkedRes.data || []).map(t => t.groan_challenge_id))
      setOrphanedWahoos(
        (completedRes.data || []).filter(w => !linkedIds.has(w.id)).slice(0, 10)
      )

      setLoading(false)
    }).catch(err => {
      console.error('JourneyTab data load error:', err)
      setLoading(false)
    })
  }, [userId])

  if (loading) return <div className="jt-loading">Loading journey...</div>

  const stageInfo = HERO_STAGES[heroStage] || HERO_STAGES[0]
  const sorted = Object.entries(voiceCounts).sort((a, b) => b[1] - a[1])
  const dominant = sorted[0] // [name, count] or undefined

  const [showTimeline, setShowTimeline] = useState(false)

  return (
    <div className="jt-container">
      {/* Current Stage */}
      <div className="jt-stage-card">
        <div className="jt-stage-number">Stage {heroStage}</div>
        <h2 className="jt-stage-name">{stageInfo.name}</h2>
        {stageInfo.feeling && (
          <p className="jt-stage-feeling">"{stageInfo.feeling}"</p>
        )}
        {heroStage > 1 && (
          <button className="jt-stage-history-btn" onClick={() => setShowTimeline(!showTimeline)}>
            {showTimeline ? 'Hide journey' : 'Your Hero\'s Journey'}
          </button>
        )}
      </div>

      {/* Timeline dropdown */}
      {showTimeline && <JourneyTimeline userId={userId} heroStage={heroStage} />}

      {/* Figurine Presence */}
      {figurine.isUnlocked && (
        <div className="jt-section jt-figurine-presence">
          {figurine.avatarUrl && <img src={figurine.avatarUrl} alt="" className="jt-figurine-avatar" />}
          <div className="jt-figurine-info">
            <span className="jt-figurine-name">{figurine.profile?.custom_essence_name || figurine.profile?.essence_archetype || 'Your Mentor'}</span>
            <span className="jt-figurine-phase">{figurine.phaseName}</span>
          </div>
          {!figurine.isMirrorMode && figurine.canChat && (
            <button className="jt-figurine-chat-btn" onClick={() => {/* TODO: open figurine chat */}}>
              Talk to your mentor
            </button>
          )}
          {figurine.isMirrorMode && (
            <p className="jt-figurine-mirror-msg">Your mentor is still learning about you.</p>
          )}
        </div>
      )}

      {/* What's Next */}
      <div className="jt-next">
        {heroStage === 2 && (
          <a href="/life-paths" className="jt-next-card">
            <span className="jt-next-icon">🗺️</span>
            <div className="jt-next-body">
              <div className="jt-next-label">Next step</div>
              <div className="jt-next-text">Map your life paths to see what futures are possible</div>
            </div>
            <span className="jt-next-arrow">→</span>
          </a>
        )}
        {heroStage === 3 && (
          <a href="/essence-mirror" className="jt-next-card">
            <span className="jt-next-icon">🦸</span>
            <div className="jt-next-body">
              <div className="jt-next-label">Next step</div>
              <div className="jt-next-text">Discover your essence archetype and create your hero avatar</div>
            </div>
            <span className="jt-next-arrow">→</span>
          </a>
        )}
        {heroStage === 4 && (
          <div className="jt-next-card">
            <span className="jt-next-icon">🔥</span>
            <div className="jt-next-body">
              <div className="jt-next-label">Next step</div>
              <div className="jt-next-text">Do a courage challenge that makes you feel alive</div>
            </div>
          </div>
        )}
        {heroStage === 5 && (
          <div className="jt-next-card">
            <span className="jt-next-icon">💰</span>
            <div className="jt-next-body">
              <div className="jt-next-label">Next step</div>
              <div className="jt-next-text">Get a life path to Vibe Rise at Charging or Teaching depth</div>
            </div>
          </div>
        )}
        {heroStage === 6 && (
          <div className="jt-next-card">
            <span className="jt-next-icon">💚</span>
            <div className="jt-next-body">
              <div className="jt-next-label">Next step</div>
              <div className="jt-next-text">Keep exploring what blocks you. A pattern is emerging.</div>
              {dominant && <div className="jt-next-sub">{formatVoice(dominant[0])}: {dominant[1]} of 5</div>}
            </div>
          </div>
        )}
      </div>

      {/* Orphaned Wahoos — completed courage challenges not linked to a life path */}
      {orphanedWahoos.length > 0 && (
        <div className="jt-section jt-orphan-section">
          <h3 className="jt-section-title">Unlinked Courage Challenges</h3>
          <p className="jt-orphan-intro">
            You've done {orphanedWahoos.length} courage challenge{orphanedWahoos.length > 1 ? 's' : ''} not connected to a life path yet.
          </p>
          {orphanedWahoos.slice(0, 5).map(w => (
            <div key={w.id} className="jt-orphan-item">
              <span className="jt-orphan-icon">⚡</span>
              <span className="jt-orphan-text">{w.title || w.challenge_text}</span>
            </div>
          ))}
          {orphanedWahoos.length > 5 && (
            <div className="jt-orphan-more">+ {orphanedWahoos.length - 5} more</div>
          )}
          {lifePaths.length === 0 ? (
            <a href="/life-paths" className="jt-orphan-cta">Map Your Life Paths first →</a>
          ) : (
            <p className="jt-orphan-hint">Add quests on the Quests tab to link these.</p>
          )}
        </div>
      )}

      {/* Onboarding — only if items incomplete */}
      <JourneyOnboarding userId={userId} />

      {/* Voice Progress (Stage 5-6 only, leading to Stage 7) */}
      {heroStage >= 5 && heroStage < 7 && dominant && (
        <div className="jt-section">
          <h3 className="jt-section-title">Pattern Recognition</h3>
          <div className="jt-voice-dots">
            {[1, 2, 3, 4, 5].map(i => (
              <span key={i} className={`jt-dot ${i <= dominant[1] ? 'jt-dot-filled' : ''}`} />
            ))}
          </div>
          <p className="jt-voice-hint">
            {dominant[1] < 3 && `${dominant[1]} of 5 patterns identified`}
            {dominant[1] === 3 && `The ${formatVoice(dominant[0])} keeps showing up.`}
            {dominant[1] === 4 && `Four times. There's something underneath it.`}
            {dominant[1] >= 5 && `The ${formatVoice(dominant[0])}. Five times. You're ready.`}
          </p>
          {solidarityCount > 0 && (
            <p className="jt-solidarity">
              {solidarityCount} other {solidarityCount === 1 ? 'person' : 'people'} identified the same voice this month.
            </p>
          )}
        </div>
      )}

      {/* Life Paths Summary */}
      {lifePaths.length > 0 && (
        <div className="jt-section">
          <h3 className="jt-section-title">Your Life Paths</h3>
          <div className="jt-paths-list">
            {lifePaths.map(path => (
              <div key={path.id} className="jt-path-row">
                <span className="jt-path-dot" style={{
                  background: path.predicted_state === 'vibe' ? '#c084fc'
                    : path.predicted_state === 'peace' ? '#10b981'
                    : path.predicted_state === 'anxious' ? '#f59e0b'
                    : path.predicted_state === 'shutdown' ? '#ef4444'
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
          quests={lifePaths}
          questTasks={questTasks}
          trunkState={trunkState}
          safety={safety}
          careers={careers}
          userId={userId}
          onUpdate={() => {
            supabase.from('quests')
              .select('id, label, status, predicted_state, depth_level')
              .eq('user_id', userId).eq('status', 'active').neq('label', 'Healing Work')
              .order('created_at')
              .then(({ data }) => { if (data) setLifePaths(data) })
          }}
          onClose={() => setShowFlowMap(false)}
        />
      )}

      {/* Zone Assessments */}
      <JourneyZones userId={userId} />

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
