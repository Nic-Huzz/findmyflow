/**
 * IncomePrompt.jsx — Card 4: The First Dollar
 *
 * Celebration-framed income question.
 * "Your first dollar from doing what you love is a bigger deal than your first million."
 * Currency picker: USD, AUD, GBP, EUR, IDR.
 * After first report, income question moves to Weekly Review.
 *
 * TODO: Full implementation in Sprint 3
 */

export default function IncomePrompt({ userId, onComplete, onClose }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f0', padding: 20 }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'rgba(0,0,0,0.06)', borderRadius: '50%', width: 36, height: 36, fontSize: 20, cursor: 'pointer' }}>&times;</button>
      <div style={{ paddingTop: 60, textAlign: 'center', color: '#999' }}>
        <p>Income Prompt coming in Sprint 3</p>
      </div>
    </div>
  )
}
