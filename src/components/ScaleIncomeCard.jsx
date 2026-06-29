/**
 * ScaleIncomeCard — Read-only card on Details tab showing the creator's
 * 3-layer business model from creator_assessments.
 * Auto-detects which layer this experience maps to.
 * Toggle: "Will you pitch your next offer at this event?"
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { hapticLight } from '../lib/haptics'
import './ScaleIncomeCard.css'

const LAYER_META = {
  attraction: { label: 'Attraction', color: '#3b82f6', desc: 'Free or near-free' },
  core: { label: 'Core', color: '#5e17eb', desc: 'Main paid offer' },
  continuity: { label: 'Continuity', color: '#E9A23B', desc: 'Recurring revenue' },
}

export default function ScaleIncomeCard({ experienceId, userId, ticketPrice }) {
  const [model, setModel] = useState(null)
  const [pitchOfferType, setPitchOfferType] = useState(null)
  const [pitchOtherText, setPitchOtherText] = useState('')
  const [layerOverride, setLayerOverride] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase
        .from('creator_assessments')
        .select('attraction_detail, core_detail, continuity_detail')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      experienceId
        ? supabase.from('experiences').select('pitch_offer_type, pitch_next_offer, layer_override').eq('id', experienceId).single()
        : Promise.resolve({ data: null }),
    ]).then(([{ data: modelData }, { data: expData }]) => {
      if (modelData && (modelData.attraction_detail || modelData.core_detail || modelData.continuity_detail)) {
        setModel(modelData)
      }
      if (expData?.pitch_offer_type) {
        setPitchOfferType(expData.pitch_offer_type)
        if (expData.pitch_offer_type !== 'core' && expData.pitch_offer_type !== 'continuity') {
          setPitchOtherText(expData.pitch_offer_type === 'other' ? '' : expData.pitch_offer_type)
        }
      }
      if (expData?.layer_override) setLayerOverride(expData.layer_override)
      setLoading(false)
    })
  }, [userId, experienceId])

  const handlePitchSelect = async (type) => {
    hapticLight()
    const newType = pitchOfferType === type ? null : type
    setPitchOfferType(newType)
    if (newType !== 'other' && newType !== pitchOfferType) setPitchOtherText('')
    await supabase
      .from('experiences')
      .update({ pitch_offer_type: newType, pitch_next_offer: !!newType })
      .eq('id', experienceId)
  }

  const pitchSaveRef = useRef(null)
  const handlePitchOtherChange = (text) => {
    setPitchOtherText(text)
    const type = text.trim() || 'other'
    setPitchOfferType(type)
    if (pitchSaveRef.current) clearTimeout(pitchSaveRef.current)
    pitchSaveRef.current = setTimeout(() => {
      supabase.from('experiences').update({ pitch_offer_type: type, pitch_next_offer: true }).eq('id', experienceId)
    }, 600)
  }

  if (loading || !model) return null

  // Detect which layer this experience is based on override or price
  const detectedLayer = layerOverride
    || (!ticketPrice || ticketPrice === 0 ? 'attraction' : 'core')

  const handleLayerSelect = async (key) => {
    hapticLight()
    setLayerOverride(key)
    await supabase.from('experiences').update({ layer_override: key }).eq('id', experienceId)
  }

  const layers = [
    { key: 'attraction', detail: model.attraction_detail },
    { key: 'core', detail: model.core_detail },
    { key: 'continuity', detail: model.continuity_detail },
  ].filter(l => l.detail)

  // What's the "next" offer to pitch?
  const layerOrder = ['attraction', 'core', 'continuity']
  const currentIdx = layerOrder.indexOf(detectedLayer)
  const nextLayer = currentIdx < layerOrder.length - 1 ? layerOrder[currentIdx + 1] : null
  const nextDetail = nextLayer ? model[`${nextLayer}_detail`] : null

  return (
    <div className="sic-container">
      <div className="sic-header">
        <span className="sic-icon">📊</span>
        <div>
          <span className="sic-title">Your Business Model</span>
          <span className="sic-sub">From Scale Your Income</span>
        </div>
      </div>

      <div className="sic-layers">
        {layers.map(l => {
          const meta = LAYER_META[l.key]
          const isCurrent = l.key === detectedLayer
          return (
            <div key={l.key} className={`sic-layer ${isCurrent ? 'sic-current' : ''}`} onClick={() => handleLayerSelect(l.key)} style={{ cursor: 'pointer' }}>
              <div className="sic-layer-dot" style={{ background: meta.color }} />
              <div className="sic-layer-info">
                <span className="sic-layer-label">{meta.label}</span>
                <span className="sic-layer-detail">{l.detail}</span>
              </div>
              {isCurrent && <span className="sic-this-badge">This event</span>}
            </div>
          )
        })}
      </div>

      <div className="sic-pitch">
        <span className="sic-pitch-label">
          Will you pitch another offer at this event?
        </span>
        <div className="sic-pitch-toggle">
          {['core', 'continuity'].map(type => (
            <button
              key={type}
              className={`sic-toggle-btn ${pitchOfferType === type ? 'active' : ''}`}
              onClick={() => handlePitchSelect(type)}
            >
              {LAYER_META[type].label}
            </button>
          ))}
          <button
            className={`sic-toggle-btn ${pitchOfferType && pitchOfferType !== 'core' && pitchOfferType !== 'continuity' ? 'active' : ''}`}
            onClick={() => handlePitchSelect(pitchOfferType && pitchOfferType !== 'core' && pitchOfferType !== 'continuity' ? pitchOfferType : 'other')}
          >
            Other
          </button>
        </div>
        {pitchOfferType && pitchOfferType !== 'core' && pitchOfferType !== 'continuity' && (
          <input
            type="text"
            className="sic-pitch-other"
            value={pitchOtherText}
            onChange={(e) => handlePitchOtherChange(e.target.value)}
            placeholder="What will you pitch?"
            maxLength={80}
          />
        )}
      </div>
    </div>
  )
}
