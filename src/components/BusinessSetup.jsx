import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './BusinessSetup.css'

function BusinessSetup({ userId, onSetupComplete, existingProject }) {
  const [setupComplete, setSetupComplete] = useState(!!existingProject)

  // If user already has a project, show completed state
  if (setupComplete || existingProject) {
    return (
      <div className="business-setup">
        <div className="business-setup-complete">
          <div className="setup-complete-icon">✅</div>
          <h3>Business Setup Complete</h3>
          <p>Your business project is ready. Select a stage tab above to start working on your quests.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="business-setup">
      <div className="business-setup-welcome">
        <div className="setup-welcome-icon">⚙️</div>
        <h2>Set Up Your Business Project</h2>
        <p>Before you can access the business stages, let's set up your project. This takes about 2 minutes.</p>
      </div>

      <div className="business-setup-steps">
        <div className="setup-step">
          <h3>1. Name Your Project</h3>
          <ProjectNameStep
            userId={userId}
            onComplete={(project) => {
              setSetupComplete(true)
              if (onSetupComplete) onSetupComplete(project)
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Simple project creation step
function ProjectNameStep({ userId, onComplete }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || saving) return

    setSaving(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('user_projects')
        .insert({
          user_id: userId,
          name: name.trim(),
          description: description.trim() || null,
          source_flow: 'business_setup',
          status: 'active',
          current_stage: 1,
          total_points: 0,
          is_primary: true
        })
        .select()
        .single()

      if (insertError) throw insertError

      onComplete(data)
    } catch (err) {
      console.error('Error creating project:', err)
      setError('Failed to create project. Please try again.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="setup-form">
      <div className="setup-field">
        <label htmlFor="project-name">What's your business or project called?</label>
        <input
          id="project-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My Coaching Business, SaaS App, etc."
          maxLength={100}
          required
        />
      </div>

      <div className="setup-field">
        <label htmlFor="project-desc">Brief description (optional)</label>
        <textarea
          id="project-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does your business do? Who does it serve?"
          rows={3}
          maxLength={500}
        />
      </div>

      {error && <p className="setup-error">{error}</p>}

      <button
        type="submit"
        className="setup-submit-button"
        disabled={!name.trim() || saving}
      >
        {saving ? 'Creating...' : 'Create Project & Start'}
      </button>
    </form>
  )
}

export default BusinessSetup
