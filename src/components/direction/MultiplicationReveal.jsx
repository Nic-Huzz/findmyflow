/**
 * MultiplicationReveal.jsx — Card 3: Your Direction (Skill × Problem)
 *
 * Progressive 4-beat reveal:
 * 1. "You're a natural [skill]"
 * 2. "for people who [problem]"
 * 3. "That points toward: [turnsInto]"
 * 4. "What keeps you fuelled: [dome branches]"
 *
 * TODO: Full implementation in Sprint 3
 */

export default function MultiplicationReveal({ userId, onComplete, onClose }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f0', padding: 20 }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'rgba(0,0,0,0.06)', borderRadius: '50%', width: 36, height: 36, fontSize: 20, cursor: 'pointer' }}>&times;</button>
      <div style={{ paddingTop: 60, textAlign: 'center', color: '#999' }}>
        <p>Multiplication Reveal coming in Sprint 3</p>
      </div>
    </div>
  )
}
