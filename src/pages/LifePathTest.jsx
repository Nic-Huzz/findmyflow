import React, { useState } from 'react'
import LifePathMap from '../components/LifePathMap/LifePathMap'

const SAMPLE_CAREERS = [
  { id: 'c1', label: 'Stay in corporate',    emoji: '💼', predictedState: 'shutdown', livedState: null, realistic: true },
  { id: 'c2', label: 'Freelance consulting',  emoji: '💻', predictedState: 'anxious',  livedState: null, realistic: true },
  { id: 'c3', label: 'Start a podcast',       emoji: '🎙️', predictedState: 'peace',    livedState: 'vibe', realistic: false },
  { id: 'c4', label: 'Write a book',          emoji: '📖', predictedState: 'peace',    livedState: null, realistic: false },
  { id: 'c5', label: 'Teach workshops',        emoji: '🎤', predictedState: 'vibe',     livedState: 'anxious', realistic: false },
  { id: 'c6', label: 'Run retreats',           emoji: '🏔️', predictedState: 'vibe',     livedState: 'vibe', realistic: false },
  { id: 'c7', label: 'Open a healing studio',  emoji: '🧘', predictedState: 'peace',    livedState: null, realistic: false },
  { id: 'c8', label: 'Move countries',         emoji: '🌴', predictedState: 'vibe',     livedState: null, realistic: false },
]

export default function LifePathTest() {
  const [safety, setSafety] = useState(0)
  const [walk, setWalk] = useState(0)
  const [theme, setTheme] = useState('dark')
  const [pulse, setPulse] = useState(false)

  const doPulse = () => {
    setPulse(true)
    setTimeout(() => setPulse(false), 700)
    setTimeout(() => setSafety(s => Math.min(s + 0.15, 1)), 300)
  }

  return (
    <div style={{
      background: theme === 'dark' ? '#0a0a14' : '#f5f5f0',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: 20,
      fontFamily: 'Inter, sans-serif',
      color: theme === 'dark' ? '#e0e0e0' : '#1a1a2e',
    }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontSize: 12 }}>
          Safety: {Math.round(safety * 100)}%
          <input type="range" min="0" max="100" value={Math.round(safety * 100)}
                 onChange={e => setSafety(parseInt(e.target.value) / 100)}
                 style={{ marginLeft: 8 }} />
        </label>
        <label style={{ fontSize: 12 }}>
          Walk: {Math.round(walk * 100)}%
          <input type="range" min="0" max="100" value={Math.round(walk * 100)}
                 onChange={e => setWalk(parseInt(e.target.value) / 100)}
                 style={{ marginLeft: 8 }} />
        </label>
        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                style={{ fontSize: 12, padding: '4px 12px', cursor: 'pointer' }}>
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
        <button onClick={doPulse}
                style={{ fontSize: 12, padding: '4px 12px', cursor: 'pointer', background: '#E9A23B', color: '#fff', border: 'none', borderRadius: 6 }}>
          Wahoo pulse
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <LifePathMap
          careers={SAMPLE_CAREERS}
          safety={safety}
          walkProgress={walk}
          theme={theme}
          pulseActive={pulse}
          showZoneLabels
        />
      </div>
    </div>
  )
}
