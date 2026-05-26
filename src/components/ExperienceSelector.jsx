/**
 * ExperienceSelector — Dropdown to tag something to a specific experience
 *
 * Loads upcoming + recent experiences for the current user.
 * Used in: Contacts form, Content Generator, Deal creation.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'

export default function ExperienceSelector({ value, onChange, placeholder = 'Link to experience (optional)', style }) {
  const { user } = useAuth()
  const [experiences, setExperiences] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('experiences')
      .select('id, name, status, experience_date')
      .eq('user_id', user.id)
      .in('status', ['upcoming', 'completed'])
      .order('experience_date', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setExperiences(data)
        setLoading(false)
      })
  }, [user?.id])

  if (loading || experiences.length === 0) return null

  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value || null)}
      style={{
        width: '100%',
        padding: '8px 10px',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)',
        color: value ? '#fff' : 'rgba(255,255,255,0.4)',
        fontSize: 13,
        cursor: 'pointer',
        ...style,
      }}
    >
      <option value="">{placeholder}</option>
      {experiences.map(exp => (
        <option key={exp.id} value={exp.id}>
          {exp.name}
          {exp.experience_date ? ` · ${new Date(exp.experience_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
        </option>
      ))}
    </select>
  )
}
