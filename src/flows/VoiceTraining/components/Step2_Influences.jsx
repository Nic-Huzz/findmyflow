/**
 * Step 2: Your Influences
 * Up to 3 voice influence cards with AI snippet generation.
 * New component for Voice Smart Bridge.
 */
import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

function InfluenceCard({ influence, index, onUpdate, onRemove }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGenerateSnippets = async () => {
    if (!influence.name.trim() || !influence.description.trim()) return
    setLoading(true)
    setError(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-influence-snippets', {
        body: { name: influence.name, description: influence.description }
      })

      if (fnError) throw fnError

      onUpdate(index, {
        ...influence,
        snippets: data?.snippets || [],
        confirmed: false
      })
    } catch (err) {
      console.error('Snippet generation error:', err)
      setError('Could not generate snippets. You can skip this and continue.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    onUpdate(index, { ...influence, confirmed: true })
  }

  const handleReject = () => {
    // Clear snippets so user can edit description and regenerate
    onUpdate(index, { ...influence, snippets: [], confirmed: false })
  }

  const hasSnippets = influence.snippets?.length > 0

  return (
    <div className="vt-influence-card">
      <div className="vt-influence-header">
        <span className="vt-influence-num">Influence {index + 1}</span>
        {onRemove && (
          <button className="vt-sample-remove" onClick={() => onRemove(index)}>×</button>
        )}
      </div>

      <input
        className="vt-influence-name"
        type="text"
        value={influence.name}
        onChange={(e) => onUpdate(index, { ...influence, name: e.target.value, snippets: [], confirmed: false })}
        placeholder="Writer, creator, or brand name..."
        maxLength={100}
      />

      <textarea
        className="vt-influence-desc"
        value={influence.description}
        onChange={(e) => onUpdate(index, { ...influence, description: e.target.value, snippets: [], confirmed: false })}
        placeholder="What do you like about their style? (e.g., 'Direct, no-BS business advice with humor')"
        maxLength={300}
        rows={2}
      />

      {/* Generate snippets button */}
      {!hasSnippets && !influence.confirmed && (
        <button
          className="vt-secondary-btn"
          onClick={handleGenerateSnippets}
          disabled={loading || !influence.name.trim() || !influence.description.trim()}
          style={{ marginTop: 8 }}
        >
          {loading ? 'Generating...' : 'Preview this style'}
        </button>
      )}

      {error && <p className="vt-influence-error">{error}</p>}

      {/* Snippet preview */}
      {hasSnippets && !influence.confirmed && (
        <div className="vt-influence-snippets">
          <p className="vt-influence-snippets-label">Here&apos;s what that style sounds like:</p>
          {influence.snippets.map((snippet, i) => (
            <div key={i} className="vt-influence-snippet">
              {snippet}
            </div>
          ))}
          <div className="vt-influence-snippet-actions">
            <button className="vt-continue-btn" onClick={handleConfirm} style={{ flex: 1 }}>
              That&apos;s the vibe
            </button>
            <button className="vt-secondary-btn" onClick={handleReject} style={{ flex: 1 }}>
              Not quite
            </button>
          </div>
        </div>
      )}

      {/* Confirmed badge */}
      {influence.confirmed && (
        <div className="vt-influence-confirmed">
          Confirmed
        </div>
      )}
    </div>
  )
}

export default function Step2_Influences({ influences, onChangeInfluences, onContinue }) {
  const [cards, setCards] = useState(
    influences.length > 0 ? influences : [{ name: '', description: '', snippets: [], confirmed: false }]
  )

  const handleUpdate = (index, updated) => {
    const newCards = [...cards]
    newCards[index] = updated
    setCards(newCards)
    onChangeInfluences(newCards.filter(c => c.name.trim()))
  }

  const handleAdd = () => {
    if (cards.length < 3) {
      setCards([...cards, { name: '', description: '', snippets: [], confirmed: false }])
    }
  }

  const handleRemove = (index) => {
    if (cards.length > 1) {
      const updated = cards.filter((_, i) => i !== index)
      setCards(updated)
      onChangeInfluences(updated.filter(c => c.name.trim()))
    }
  }

  return (
    <div className="vt-step">
      <div className="vt-step-header">
        <h2>Who inspires your voice?</h2>
        <p>
          Name 1-3 writers, creators, or brands whose style you admire.
          We&apos;ll blend their energy with your own writing to dial in your voice.
        </p>
      </div>

      <div className="vt-influences-list">
        {cards.map((influence, index) => (
          <InfluenceCard
            key={index}
            influence={influence}
            index={index}
            onUpdate={handleUpdate}
            onRemove={cards.length > 1 ? handleRemove : null}
          />
        ))}

        {cards.length < 3 && (
          <button className="vt-add-sample-btn" onClick={handleAdd}>
            <span>+</span> Add another influence
          </button>
        )}
      </div>

      <button className="vt-continue-btn" onClick={onContinue}>
        {cards.some(c => c.name.trim()) ? 'Continue →' : 'Skip — let my writing speak for itself →'}
      </button>
    </div>
  )
}
