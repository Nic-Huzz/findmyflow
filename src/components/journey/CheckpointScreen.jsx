import { useState, useEffect } from 'react'

const STAGE_EXPLAINERS = {
  0: {
    title: 'You just reconnected with the kid',
    body: 'Before school, before culture, before "grow up" — you were fully expressed. What you just described is who you were before anyone told you to stop. Next, we look at what happened.',
  },
  1: {
    title: 'You named what happened',
    body: 'Something between childhood and now installed a protective pattern. Your nervous system learned that being fully you wasn\'t safe. That pattern is still running. Next, let\'s see the impact.',
  },
  2: {
    title: 'You see the damage',
    body: 'The radar and aliveness scores show where suppression landed. Some channels got starved. Some dimensions contracted. This is the cost of the pattern. Next, let\'s find who you are underneath it.',
  },
  3: {
    title: 'You found your essence',
    body: 'Underneath the coping, the roles, the masks — there\'s still a version of you that knows exactly who they are. You just met them. Now it\'s time to challenge the pattern.',
  },
  4: {
    title: 'Your challenge is set',
    body: 'You\'ve chosen experiences that light you up, committed to quests, and seen your comfort zone shape. The breakthrough happens when you go do it. Not in this room. In real life.',
  },
}

/**
 * CheckpointScreen — Shown between journey stages.
 *
 * Workshop mode: "Waiting for Huzz..." with pulse animation.
 * Solo mode: Explainer text + "Continue" button.
 *
 * @param {boolean} isWorkshop - Workshop or solo mode
 * @param {number} completedStage - Index of the stage just completed (0-4)
 * @param {function} onContinue - Solo mode: called when user clicks continue
 * @param {boolean} unlocked - Workshop mode: true when facilitator has advanced
 */
export default function CheckpointScreen({ isWorkshop, completedStage, onContinue, unlocked }) {
  const [showUnlocked, setShowUnlocked] = useState(false)
  const explainer = STAGE_EXPLAINERS[completedStage] || {}

  // When unlocked changes to true (facilitator advanced), show transition
  useEffect(() => {
    if (unlocked && isWorkshop) {
      setShowUnlocked(true)
      const timer = setTimeout(() => {
        if (onContinue) onContinue()
      }, 1500) // brief moment to see "Let's go" before advancing
      return () => clearTimeout(timer)
    }
  }, [unlocked, isWorkshop, onContinue])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: 24, background: '#09090F', color: '#fff', textAlign: 'center',
    }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 12 }}>{explainer.title}</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 32 }}>{explainer.body}</p>

        {isWorkshop && !showUnlocked && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 12, height: 12, borderRadius: '50%', background: '#D946EF',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Waiting for Huzz to continue...</p>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }`}</style>
          </div>
        )}

        {isWorkshop && showUnlocked && (
          <p style={{ color: '#D946EF', fontSize: '1.2rem', fontWeight: 600 }}>Let&apos;s go!</p>
        )}

        {!isWorkshop && (
          <button
            onClick={onContinue}
            style={{
              padding: '14px 40px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #D946EF 0%, #FFB800 100%)',
              color: '#000', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}
