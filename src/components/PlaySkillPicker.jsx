/**
 * PlaySkillPicker.jsx
 *
 * Lightweight play-skill category picker for Level 0.
 * Shows 10 taxonomy categories as a tappable grid + "Add your own" input.
 * Users pick 2-4 categories that light them up, optionally add custom ones.
 * Saves to nikigai_clusters (same format as /get-started).
 *
 * CSS prefix: psp-
 * Created: 2026-05-09
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { SKILLS_SEGMENTS } from '../lib/wheelTaxonomy'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './PlaySkillPicker.css'

const MIN_CATEGORIES = 2
const MAX_CATEGORIES = 4

export default function PlaySkillPicker({ userId, onComplete, onClose }) {
  const [selected, setSelected] = useState([]) // array of category ids
  const [customItems, setCustomItems] = useState([]) // array of custom strings
  const [customInput, setCustomInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [existingSkills, setExistingSkills] = useState([])

  // Load any existing play-skills so we don't overwrite
  useEffect(() => {
    if (!userId) return
    supabase
      .from('nikigai_clusters')
      .select('id, cluster_label, items, step_id')
      .eq('user_id', userId)
      .eq('cluster_type', 'skills')
      .eq('step_id', 'get_started')
      .then(({ data }) => {
        if (data?.length > 0) {
          setExistingSkills(data)
          // Pre-select categories the user already has
          const existingCats = data
            .map(d => d.items?.[0]?.category)
            .filter(Boolean)
          setSelected([...new Set(existingCats)])
        }
      })
  }, [userId])

  const totalSelected = selected.length + customItems.length
  const canSave = totalSelected >= MIN_CATEGORIES

  function toggleCategory(catId) {
    hapticLight()
    setSelected(prev => {
      if (prev.includes(catId)) {
        return prev.filter(id => id !== catId)
      }
      if (prev.length + customItems.length >= MAX_CATEGORIES) return prev
      return [...prev, catId]
    })
  }

  function addCustom() {
    const trimmed = customInput.trim()
    if (!trimmed || customItems.includes(trimmed)) return
    if (totalSelected >= MAX_CATEGORIES) return
    hapticLight()
    setCustomItems(prev => [...prev, trimmed])
    setCustomInput('')
  }

  function removeCustom(item) {
    hapticLight()
    setCustomItems(prev => prev.filter(i => i !== item))
  }

  async function handleSave() {
    if (!canSave || saving || !userId) return
    setSaving(true)

    try {
      // Build cluster rows for taxonomy categories
      const taxonomyRows = selected.map(catId => {
        const seg = SKILLS_SEGMENTS.find(s => s.id === catId)
        return {
          user_id: userId,
          cluster_type: 'skills',
          cluster_label: seg?.displayName || catId,
          cluster_stage: 'final',
          step_id: 'get_started',
          items: [{
            text: seg?.displayName || catId,
            category: catId,
            isStarred: true,
          }],
        }
      })

      // Build cluster rows for custom items
      const customRows = customItems.map(item => ({
        user_id: userId,
        cluster_type: 'skills',
        cluster_label: item,
        cluster_stage: 'final',
        step_id: 'get_started',
        items: [{
          text: item,
          category: 'custom',
          isStarred: true,
        }],
      }))

      const allRows = [...taxonomyRows, ...customRows]

      // Delete existing get_started skills and re-insert
      const { error: deleteError } = await supabase
        .from('nikigai_clusters')
        .delete()
        .eq('user_id', userId)
        .eq('cluster_type', 'skills')
        .eq('step_id', 'get_started')

      if (deleteError) throw deleteError

      const { error } = await supabase
        .from('nikigai_clusters')
        .insert(allRows)

      if (error) throw error

      hapticSuccess()
      onComplete?.()
    } catch (err) {
      console.error('PlaySkillPicker save error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="psp-overlay" onClick={onClose}>
      <div className="psp-sheet" onClick={e => e.stopPropagation()}>
        <div className="psp-header">
          <h3 className="psp-title">What lights you up?</h3>
          <button className="psp-close" onClick={onClose}>&times;</button>
        </div>

        <div className="psp-body">
          <p className="psp-subtitle">
            Pick {MIN_CATEGORIES}-{MAX_CATEGORIES} that feel like you. These become your Wahoo channels.
          </p>

          <div className="psp-grid">
            {SKILLS_SEGMENTS.map(seg => {
              const isSelected = selected.includes(seg.id)
              const isDisabled = !isSelected && totalSelected >= MAX_CATEGORIES
              return (
                <button
                  key={seg.id}
                  className={`psp-card ${isSelected ? 'psp-card-selected' : ''} ${isDisabled ? 'psp-card-disabled' : ''}`}
                  onClick={() => !isDisabled && toggleCategory(seg.id)}
                  disabled={isDisabled}
                >
                  <span className="psp-card-icon">{seg.icon}</span>
                  <span className="psp-card-name">{seg.displayName}</span>
                  <span className="psp-card-tagline">{seg.tagline}</span>
                  {isSelected && <span className="psp-card-check">✓</span>}
                </button>
              )
            })}
          </div>

          {/* Custom items display */}
          {customItems.length > 0 && (
            <div className="psp-custom-list">
              {customItems.map(item => (
                <div key={item} className="psp-custom-chip">
                  <span>{item}</span>
                  <button className="psp-custom-remove" onClick={() => removeCustom(item)}>&times;</button>
                </div>
              ))}
            </div>
          )}

          {/* Add your own */}
          <div className="psp-custom-section">
            <label className="psp-custom-label">Something else lights you up?</label>
            <div className="psp-custom-row">
              <input
                type="text"
                className="psp-custom-input"
                placeholder="e.g. Silent Discos, Magic Tricks..."
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustom()}
                disabled={totalSelected >= MAX_CATEGORIES}
              />
              <button
                className="psp-custom-add"
                onClick={addCustom}
                disabled={!customInput.trim() || totalSelected >= MAX_CATEGORIES}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="psp-footer">
          <div className="psp-count">
            {totalSelected}/{MAX_CATEGORIES} selected
          </div>
          <button
            className="psp-save"
            disabled={!canSave || saving}
            onClick={handleSave}
          >
            {saving ? 'Saving...' : `Save My Play-Skills`}
          </button>
        </div>
      </div>
    </div>
  )
}
