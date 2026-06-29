/**
 * PositioningSummary.jsx — Positioning clarity card for the Identity tab
 *
 * Two inputs: Life Quake ("What moment brings someone to your door?")
 * and Transformation ("What do they want to feel after?").
 * AI synthesises these with existing data (essence, skills, problems, remarkable angle)
 * into a plain-English positioning statement.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './PositioningSummary.css'

export default function PositioningSummary({ userId, essenceName, skills, problems, remarkableAngle }) {
  const [lifeQuake, setLifeQuake] = useState('')
  const [transformation, setTransformation] = useState('')
  const [statement, setStatement] = useState('')
  const [editingStatement, setEditingStatement] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const saveTimerRef = useRef(null)
  const profileIdRef = useRef(null)

  // Load existing data
  useEffect(() => {
    if (!userId) return
    supabase
      .from('lead_flow_profiles')
      .select('id, life_quake, transformation, positioning_statement')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          profileIdRef.current = data.id
          if (data.life_quake) setLifeQuake(data.life_quake)
          if (data.transformation) setTransformation(data.transformation)
          if (data.positioning_statement) setStatement(data.positioning_statement)
        }
        setLoaded(true)
      })
  }, [userId])

  // Auto-save inputs with debounce
  const saveField = useCallback((field, value) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      if (profileIdRef.current) {
        await supabase
          .from('lead_flow_profiles')
          .update({ [field]: value || null })
          .eq('id', profileIdRef.current)
      } else {
        // No profile row exists — create one
        const { data } = await supabase
          .from('lead_flow_profiles')
          .insert({ user_id: userId, [field]: value || null })
          .select('id')
          .single()
        if (data) profileIdRef.current = data.id
      }
    }, 800)
  }, [userId])

  const handleLifeQuakeChange = (val) => {
    setLifeQuake(val)
    saveField('life_quake', val)
  }

  const handleTransformationChange = (val) => {
    setTransformation(val)
    saveField('transformation', val)
  }

  // Generate positioning statement via AI
  const generateStatement = async () => {
    if (!lifeQuake.trim() || !transformation.trim()) return
    hapticLight()
    setGenerating(true)

    try {
      const prompt = buildPrompt({
        essenceName,
        skills,
        problems,
        remarkableAngle,
        lifeQuake: lifeQuake.trim(),
        transformation: transformation.trim(),
      })

      const { data, error } = await supabase.functions.invoke('generate-positioning', {
        body: { prompt, user_id: userId },
      })

      if (error) throw error
      const result = data?.statement || ''
      setStatement(result)
      setEditingStatement(false)

      // Save to DB
      if (profileIdRef.current) {
        await supabase.from('lead_flow_profiles').update({ positioning_statement: result }).eq('id', profileIdRef.current)
      }

      hapticSuccess()
    } catch (err) {
      console.error('Positioning generation failed:', err)
      // Fallback: build a simple statement without AI
      const fallback = buildFallbackStatement({
        essenceName,
        lifeQuake: lifeQuake.trim(),
        transformation: transformation.trim(),
        skills,
        remarkableAngle,
      })
      setStatement(fallback)
      if (profileIdRef.current) {
        await supabase.from('lead_flow_profiles').update({ positioning_statement: fallback }).eq('id', profileIdRef.current)
      }
    } finally {
      setGenerating(false)
    }
  }

  const saveEditedStatement = async () => {
    setEditingStatement(false)
    hapticLight()
    if (profileIdRef.current) {
      await supabase.from('lead_flow_profiles').update({ positioning_statement: statement }).eq('id', profileIdRef.current)
    }
  }

  if (!loaded) return null

  const canGenerate = lifeQuake.trim().length > 5 && transformation.trim().length > 5
  const hasStatement = statement.trim().length > 0

  return (
    <div className="ps-card">
      <div className="ps-header">
        <span className="ps-icon">🎯</span>
        <div>
          <div className="ps-title">Your Positioning</div>
          <div className="ps-sub">Who you help and why they come to you</div>
        </div>
      </div>

      {/* Life Quake question */}
      <div className="ps-field">
        <label className="ps-label">What moment in life brings someone to your door?</label>
        <textarea
          className="ps-input"
          value={lifeQuake}
          onChange={e => handleLifeQuakeChange(e.target.value)}
          placeholder="e.g. They just burned out from corporate, they've tried therapy and it didn't work, they moved somewhere new and feel lost..."
          rows={2}
          maxLength={300}
        />
      </div>

      {/* Transformation question */}
      <div className="ps-field">
        <label className="ps-label">What do they want to feel after your experience?</label>
        <textarea
          className="ps-input"
          value={transformation}
          onChange={e => handleTransformationChange(e.target.value)}
          placeholder="e.g. Like they have permission to play again, connected to a tribe, clear on what to build next..."
          rows={2}
          maxLength={300}
        />
      </div>

      {/* Generate button */}
      {canGenerate && (
        <button
          className="ps-generate"
          onClick={generateStatement}
          disabled={generating}
        >
          {generating ? 'Writing...' : hasStatement ? 'Regenerate Statement' : 'Generate My Positioning'}
        </button>
      )}

      {/* Positioning statement output */}
      {hasStatement && (
        <div className="ps-statement-card">
          <div className="ps-statement-label">Your positioning statement</div>
          {editingStatement ? (
            <>
              <textarea
                className="ps-statement-edit"
                value={statement}
                onChange={e => setStatement(e.target.value)}
                rows={4}
              />
              <button className="ps-save-btn" onClick={saveEditedStatement}>Save</button>
            </>
          ) : (
            <>
              <p className="ps-statement-text">{statement}</p>
              <button className="ps-edit-btn" onClick={() => { hapticLight(); setEditingStatement(true) }}>
                Edit
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function buildPrompt({ essenceName, skills, problems, remarkableAngle, lifeQuake, transformation }) {
  const parts = []
  parts.push(`Write a positioning statement for an experience creator. 2-3 sentences maximum. Plain English, no jargon, no em dashes. First person ("I help...").`)
  parts.push(`\nTheir identity: ${essenceName || 'Experience Creator'}`)
  if (skills?.length) parts.push(`Their skills: ${skills.slice(0, 3).join(', ')}`)
  if (problems?.length) parts.push(`Problems they solve: ${problems.slice(0, 3).join(', ')}`)
  if (remarkableAngle?.combination_insight) parts.push(`What makes them different: ${remarkableAngle.combination_insight}`)
  if (remarkableAngle?.ai_remarkable_bio) parts.push(`Their remarkable bio: ${remarkableAngle.ai_remarkable_bio}`)
  parts.push(`\nWho comes to them: People who ${lifeQuake}`)
  parts.push(`What those people want: To ${transformation}`)
  parts.push(`\nWrite a crisp positioning statement that captures who they are, who they help, and why they're the right person. Make it feel human and specific, not generic.`)
  return parts.join('\n')
}

function buildFallbackStatement({ essenceName, lifeQuake, transformation, skills, remarkableAngle }) {
  const who = lifeQuake
  const what = transformation
  const skillStr = skills?.length ? skills[0] : ''
  const edge = remarkableAngle?.combination_insight || ''

  let s = `I help people who ${who} ${what ? `feel ${what}` : 'find their way back'}`
  if (skillStr) s += ` through ${skillStr.toLowerCase()}`
  s += '.'
  if (edge) s += ` ${edge}.`
  return s
}
