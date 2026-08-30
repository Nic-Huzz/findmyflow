import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import PublicEmailGate from '../components/PublicEmailGate'
import './AlivenessQuiz.css'

/**
 * AlivenessQuiz — Free lead magnet at /try/aliveness
 * "Which of the 4 channels of aliveness have been shut off?"
 *
 * Flow: Hook → Choice → Connection → Mastery → Meaning → Email Gate → Results
 */

const CHANNELS = [
  {
    id: 'choice',
    name: 'Choice',
    emoji: '🔓',
    category: 'Survive',
    question: 'Right now, how much of your life feels chosen by you?',
    options: [
      { id: 3, label: 'Almost everything I do, I chose' },
      { id: 2, label: 'Most things, but some feel forced' },
      { id: 1, label: 'A lot of my day feels like obligation' },
      { id: 0, label: 'I feel trapped in my own life' },
    ],
    lowTitle: 'Your freedom got taken',
    lowDesc: 'Somewhere along the way, your life started being designed by other people. Obligations, expectations, "shoulds." The vessel can\'t fill when you\'re not the one choosing what goes in.',
    tryThis: 'Do one thing today purely because YOU want to. Not because you should. Not because someone expects it. Something small that has no purpose other than: you chose it.',
    highDesc: 'You feel like the author of your own life. This channel is open and feeding you.',
    painQ: 'If nothing changes and you still feel trapped in 3 years, what does your life look like?',
    pleasureQ: 'Think of a time you felt completely free to choose. What were you doing?',
  },
  {
    id: 'connection',
    name: 'Connection',
    emoji: '🤝',
    category: 'Survive',
    question: 'When was the last time you felt genuinely seen by someone?',
    options: [
      { id: 3, label: 'This week, it happens often' },
      { id: 2, label: 'Recently, but it\'s rare' },
      { id: 1, label: 'I honestly can\'t remember' },
      { id: 0, label: 'I feel invisible most of the time' },
    ],
    lowTitle: 'You\'re surrounded but alone',
    lowDesc: 'You might have people around you, but being around people and being seen by them are different things. The vessel needs witnesses. Aliveness shared is aliveness doubled.',
    tryThis: 'Tell one person something real about how you\'re feeling. Not a performance. Not "I\'m fine." Something true. Connection starts with one honest sentence.',
    highDesc: 'You feel seen and held by people who matter to you. This channel is alive.',
    painQ: 'If you keep feeling invisible for another 3 years, what gets worse?',
    pleasureQ: 'Think of the last time someone truly saw you. Who was it, and what did it feel like?',
  },
  {
    id: 'mastery',
    name: 'Mastery',
    emoji: '📈',
    category: 'Thrive',
    question: 'Are you growing in something that matters to you?',
    options: [
      { id: 3, label: 'Yes, I\'m being stretched in ways I enjoy' },
      { id: 2, label: 'Somewhat, but I feel stuck in some areas' },
      { id: 1, label: 'Not really, I feel stagnant' },
      { id: 0, label: 'I\'m either bored or overwhelmed, never in between' },
    ],
    lowTitle: 'You stopped growing',
    lowDesc: 'Humans need to feel themselves getting better at something. Not for a promotion. Not for a credential. For the feeling of expansion itself. Without growth, even a comfortable life starts to feel like a cage.',
    tryThis: 'Pick one thing you used to be curious about and spend 20 minutes with it. Not to master it. Just to feel yourself learning again.',
    highDesc: 'You\'re stretching into new territory and it feels good. This channel is firing.',
    painQ: 'If you stay stagnant for 3 more years, what happens to the person you could have become?',
    pleasureQ: 'When was the last time you felt yourself getting better at something? What was it?',
  },
  {
    id: 'meaning',
    name: 'Meaning',
    emoji: '✨',
    category: 'Thrive',
    question: 'Does what you do feel like it matters beyond just you?',
    options: [
      { id: 3, label: 'Yes, I can feel my impact on others' },
      { id: 2, label: 'Sometimes, but it comes and goes' },
      { id: 1, label: 'I want it to, but I don\'t feel it yet' },
      { id: 0, label: 'Nothing I do seems to make a difference' },
    ],
    lowTitle: 'The "what\'s the point?" feeling',
    lowDesc: 'This isn\'t depression. It\'s a signal. Your vessel is telling you it needs to pour into something bigger than yourself. Meaning isn\'t something you find. It\'s something that emerges when you act on what you care about.',
    tryThis: 'Help one person with something you\'re good at. Not for money. Not for content. Just because you can. Notice how it feels.',
    highDesc: 'What you do ripples outward. You can feel it. This channel is wide open.',
    painQ: 'If "what\'s the point?" is still your daily feeling in 3 years, what does that cost you?',
    pleasureQ: 'Think of a time something you did genuinely mattered to someone else. What happened?',
  },
]

const STAGE_ORDER = ['hook', ...CHANNELS.map(c => c.id), 'email_gate', 'calculating', 'results', 'leverage']
const STORAGE_KEY = 'aliveness_quiz_progress'

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

function saveProgress(stage, answers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ stage, answers }))
  } catch {}
}

function clearProgress() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

function formatList(names) {
  if (names.length <= 2) return names.join(' and ')
  return names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1]
}

function getVerdict(scores) {
  const low = CHANNELS.filter(c => (scores[c.id] ?? -1) <= 1)

  if (low.length === 0) return {
    headline: 'Your vessel is full',
    summary: 'All four channels are open. You\'re not just surviving, you\'re in Vibe Rise. The goal now is to protect this. Know what feeds each channel so you can spot it early when one starts to close.',
    state: 'vibe_rise',
  }
  if (low.length === 1) return {
    headline: `One channel is starved: ${low[0].name}`,
    summary: `Three channels are alive, but ${low[0].name.toLowerCase()} has been shut off. This is where the heaviness lives. The good news: you only need to reopen one thing.`,
    state: 'fun',
  }
  if (low.length <= 3) return {
    headline: `${low.length} channels have closed`,
    summary: `${formatList(low.map(c => c.name))} have been turned down. This is why it feels heavy. You don't need more motivation. You need to reopen what closed.`,
    state: 'stressed',
  }
  return {
    headline: 'Every channel has been shut down',
    summary: 'Your vessel is running empty. This isn\'t a character flaw. It\'s what happens when life installs obligations in place of aliveness for too long. The path back starts with one channel, any channel.',
    state: 'bored',
  }
}

export default function AlivenessQuiz() {
  const saved = useRef(loadProgress())
  const [stage, setStage] = useState(() => saved.current?.stage || 'hook')
  const [answers, setAnswers] = useState(() => saved.current?.answers || {})
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [leverageAnswers, setLeverageAnswers] = useState({})
  const [utmParams, setUtmParams] = useState({})
  const [calcStep, setCalcStep] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => {
    if (['calculating', 'results', 'leverage'].includes(stage)) return
    saveProgress(stage, answers)
  }, [stage, answers])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setUtmParams({
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      referrer: document.referrer || null,
    })
  }, [])

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTo?.({ top: 0, behavior: 'smooth' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [stage])

  // Calculating animation
  useEffect(() => {
    if (stage !== 'calculating') return
    const labels = ['Reading your responses...', 'Mapping your four channels...', 'Finding what closed...', 'Building your diagnosis...']
    let i = 0
    const interval = setInterval(() => {
      i++
      if (i < labels.length) setCalcStep(i)
      else { clearInterval(interval); setStage('results') }
    }, 600)
    return () => clearInterval(interval)
  }, [stage])

  const currentChannel = CHANNELS.find(c => c.id === stage)
  const currentChannelIndex = CHANNELS.findIndex(c => c.id === stage)

  const goNext = () => {
    const idx = STAGE_ORDER.indexOf(stage)
    if (idx < STAGE_ORDER.length - 1) setStage(STAGE_ORDER[idx + 1])
  }

  const goBack = () => {
    const idx = STAGE_ORDER.indexOf(stage)
    if (idx > 0) setStage(STAGE_ORDER[idx - 1])
  }

  const handleSelect = (channelId, score) => {
    setAnswers(prev => ({ ...prev, [channelId]: score }))
    setTimeout(() => {
      const idx = STAGE_ORDER.indexOf(channelId)
      if (idx < STAGE_ORDER.length - 1) setStage(STAGE_ORDER[idx + 1])
    }, 150)
  }

  const submittedRef = useRef(false)

  const handleEmailSubmit = async (submittedEmail, submittedName) => {
    if (submittedRef.current) return
    submittedRef.current = true

    setEmail(submittedEmail)
    setName(submittedName)
    setCalcStep(0)
    setStage('calculating')

    const verdictState = Object.keys(answers).length === 4
      ? getVerdict(answers).state
      : 'incomplete'

    try {
      await supabase.from('public_leads').upsert({
        email: submittedEmail,
        name: submittedName || null,
        source_flow: 'aliveness_quiz',
        flow_results: {
          choice: answers.choice,
          connection: answers.connection,
          mastery: answers.mastery,
          meaning: answers.meaning,
          verdict: verdictState,
          ...utmParams,
        },
      }, { onConflict: 'email', ignoreDuplicates: false })

      clearProgress()

      supabase.functions.invoke('notify-lead-capture', {
        body: {
          email: submittedEmail,
          name: submittedName,
          source: 'Aliveness Quiz',
          meta: {
            scores: answers,
            verdict: verdictState,
          },
        },
      }).catch(() => {})
    } catch (err) {
      console.error('Error saving quiz data:', err)
    }
  }

  const saveLeverage = async () => {
    if (!email || !Object.keys(leverageAnswers).length) return
    try {
      const { data } = await supabase
        .from('public_leads')
        .select('flow_results')
        .eq('email', email)
        .single()

      if (data) {
        await supabase.from('public_leads').update({
          flow_results: { ...data.flow_results, leverage: leverageAnswers },
        }).eq('email', email)
      }
    } catch (err) {
      console.error('Error saving leverage:', err)
    }
  }

  const handleRetake = () => {
    clearProgress()
    submittedRef.current = false
    setAnswers({})
    setEmail('')
    setName('')
    setStage('hook')
  }

  const verdict = Object.keys(answers).length === 4 ? getVerdict(answers) : null

  // ── Progress dots ──
  const renderDots = () => {
    if (currentChannelIndex < 0) return null
    return (
      <div className="aq-progress-dots">
        {CHANNELS.map((c, i) => (
          <div key={c.id} className={`aq-dot ${i < currentChannelIndex ? 'completed' : i === currentChannelIndex ? 'active' : ''}`}>
            <span className="aq-dot-label">{c.emoji}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="aliveness-quiz flow-base" ref={containerRef}>

      {/* HOOK */}
      {stage === 'hook' && (
        <div className="aq-inner">
          <div className="aq-hook">
            <div className="aq-hook-label">THE ALIVENESS CHECK</div>
            <h1 className="aq-hook-title">Something feels off,<br />but you can't name it.</h1>
            <div className="aq-hook-lines">
              <p>You're not lazy. You're not broken.</p>
              <p>One of the four things that makes life feel alive has been quietly shut off.</p>
              <p><strong>This takes 60 seconds to find out which one.</strong></p>
            </div>
            <button className="primary-button glow-button" onClick={goNext}>
              Find out what's missing
            </button>
          </div>
        </div>
      )}

      {/* CHANNEL QUESTIONS */}
      {currentChannel && (
        <div className="aq-inner" key={currentChannel.id}>
          {renderDots()}
          <div className="aq-question-container">
            <div className="aq-category-badge">{currentChannel.category}</div>
            <div className="aq-channel-label">{currentChannel.emoji} {currentChannel.name}</div>
            <h2 className="aq-question-text">{currentChannel.question}</h2>
            <div className="aq-options">
              {currentChannel.options.map(opt => (
                <button
                  key={opt.id}
                  className={`option-card ${answers[currentChannel.id] === opt.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(currentChannel.id, opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {currentChannelIndex > 0 && (
              <button className="go-back-link" onClick={goBack}>&larr; Go Back</button>
            )}
          </div>
        </div>
      )}

      {/* EMAIL GATE */}
      {stage === 'email_gate' && (
        <div className="aq-inner">
          <PublicEmailGate
            flowType="aliveness_quiz"
            onEmailSubmit={handleEmailSubmit}
            title="Your diagnosis is ready."
            subtitle="We found which channels of aliveness have been shut off in your life. Enter your details to see your full report."
          />
          <button className="go-back-link" onClick={goBack}>&larr; Go Back</button>
        </div>
      )}

      {/* CALCULATING */}
      {stage === 'calculating' && (
        <div className="aq-inner">
          <div className="aq-calculating">
            <div className="typing-indicator"><span /><span /><span /></div>
            <div className="aq-calc-steps">
              {['Reading your responses...', 'Mapping your four channels...', 'Finding what closed...', 'Building your diagnosis...'].map((text, i) => (
                <div key={i} className={`calc-step ${calcStep >= i ? (calcStep > i ? 'done' : 'active') : ''}`}>
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {stage === 'results' && verdict && (
        <div className="aq-inner">
          <div className="aq-results">

            {/* Verdict header */}
            <div className="aq-verdict-header">
              <div className="aq-results-label">YOUR ALIVENESS DIAGNOSIS</div>
              <h1 className="aq-verdict-title">{verdict.headline}</h1>
              <p className="aq-verdict-summary">{verdict.summary}</p>
            </div>

            {/* Channel bars */}
            <div className="aq-channel-bars">
              {CHANNELS.map((ch, i) => {
                const score = answers[ch.id]
                const isLow = score <= 1
                return (
                  <div key={ch.id} className={`aq-bar-row reveal-${i}`}>
                    <div className="aq-bar-header">
                      <span className="aq-bar-emoji">{ch.emoji}</span>
                      <span className="aq-bar-name">{ch.name}</span>
                      <span className={`aq-bar-tag ${isLow ? 'low' : 'high'}`}>
                        {isLow ? 'Starved' : 'Alive'}
                      </span>
                    </div>
                    <div className="aq-bar-track">
                      <div className={`aq-bar-fill ${isLow ? 'low' : 'high'}`} style={{ width: `${(score / 3) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Low channel cards */}
            {CHANNELS.filter(ch => answers[ch.id] <= 1).map((ch, i) => (
              <div key={ch.id} className={`aq-result-card reveal-${i + 1}`}>
                <div className="aq-card-emoji">{ch.emoji}</div>
                <div className="aq-card-category">{ch.category}</div>
                <h3 className="aq-card-title">{ch.lowTitle}</h3>
                <p className="aq-card-desc">{ch.lowDesc}</p>
                <div className="aq-card-try">
                  <div className="aq-try-label">One thing to try</div>
                  <p className="aq-try-text">{ch.tryThis}</p>
                </div>
              </div>
            ))}

            {/* High channel summary */}
            {CHANNELS.filter(ch => answers[ch.id] >= 2).length > 0 && (
              <div className="aq-high-channels">
                <div className="aq-high-label">CHANNELS THAT ARE ALIVE</div>
                {CHANNELS.filter(ch => answers[ch.id] >= 2).map(ch => (
                  <div key={ch.id} className="aq-high-row">
                    <span>{ch.emoji} <strong>{ch.name}</strong></span>
                    <span className="aq-high-desc">{ch.highDesc}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Bridge to leverage */}
            <div className="aq-cta-section">
              <p className="aq-cta-line">Knowing what's closed is step one.<br /><strong>Feeling why it must change is what moves you.</strong></p>
              {CHANNELS.filter(ch => answers[ch.id] <= 1).length > 0 ? (
                <button className="primary-button glow-button" onClick={() => setStage('leverage')}>
                  Make it real
                </button>
              ) : (
                <a href="/get-started" className="primary-button glow-button">Keep the vessel full</a>
              )}
              <button className="go-back-link" onClick={handleRetake}>Retake quiz</button>
            </div>
          </div>
        </div>
      )}

      {/* LEVERAGE — Process of Consequence */}
      {stage === 'leverage' && verdict && (
        <div className="aq-inner">
          <div className="aq-results">
            <div className="aq-verdict-header">
              <div className="aq-results-label">PROCESS OF CONSEQUENCE</div>
              <h1 className="aq-verdict-title">Make it a must, not a should</h1>
              <p className="aq-verdict-summary">Understanding doesn't create change. Feeling the consequences does. Take a moment with each question below.</p>
            </div>

            {CHANNELS.filter(ch => (answers[ch.id] ?? -1) <= 1).map((ch, i) => (
              <div key={ch.id} className={`aq-leverage-card reveal-${i + 1}`}>
                <div className="aq-card-emoji">{ch.emoji}</div>
                <h3 className="aq-leverage-channel">{ch.name}</h3>

                <div className="aq-leverage-block pain">
                  <div className="aq-leverage-label">THE COST OF STAYING</div>
                  <p className="aq-leverage-prompt">{ch.painQ}</p>
                  <textarea
                    className="aq-leverage-input"
                    placeholder="Write what comes to mind..."
                    value={leverageAnswers[`${ch.id}_pain`] || ''}
                    onChange={(e) => setLeverageAnswers(prev => ({
                      ...prev, [`${ch.id}_pain`]: e.target.value
                    }))}
                    rows={3}
                  />
                </div>

                <div className="aq-leverage-block pleasure">
                  <div className="aq-leverage-label">WHAT BECOMES POSSIBLE</div>
                  <p className="aq-leverage-prompt">{ch.pleasureQ}</p>
                  <textarea
                    className="aq-leverage-input"
                    placeholder="Write what comes to mind..."
                    value={leverageAnswers[`${ch.id}_pleasure`] || ''}
                    onChange={(e) => setLeverageAnswers(prev => ({
                      ...prev, [`${ch.id}_pleasure`]: e.target.value
                    }))}
                    rows={3}
                  />
                </div>
              </div>
            ))}

            <div className="aq-cta-section">
              <p className="aq-cta-line">The vessel doesn't fill with motivation.<br />It fills when you reopen what closed.</p>
              <button className="primary-button glow-button" onClick={async () => {
                await saveLeverage()
                window.location.href = '/get-started'
              }}>Start reopening</button>
              <button className="go-back-link" onClick={() => setStage('results')}>&larr; Back to results</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
