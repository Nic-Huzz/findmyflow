import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './BusinessSetup.css'

// Money model tier options (same as QuickCapture ProductCard)
const TIER_OPTIONS = [
  { id: 'attraction', label: 'Attraction', description: 'Free or low-cost to attract leads', icon: '🧲' },
  { id: 'core', label: 'Core', description: 'Your main offering', icon: '⭐' },
  { id: 'upsell', label: 'Upsell', description: 'Higher-value add-on', icon: '📈' },
  { id: 'downsell', label: 'Downsell', description: 'Lower-cost alternative', icon: '📉' },
  { id: 'continuity', label: 'Continuity', description: 'Recurring subscription', icon: '🔄' }
]

function BusinessSetup({ userId, onSetupComplete, existingProject, userPersona }) {
  const [setupComplete, setSetupComplete] = useState(false)
  const [loading, setLoading] = useState(!!existingProject)
  const [existingProducts, setExistingProducts] = useState([])

  // Product form state
  const [products, setProducts] = useState([makeEmptyProduct()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Check existing products
  useEffect(() => {
    if (!existingProject || !userId) {
      setLoading(false)
      return
    }

    const persona = userPersona || 'vibe_seeker'

    // Vibe seekers don't need product identification
    if (persona === 'vibe_seeker') {
      setSetupComplete(true)
      setLoading(false)
      return
    }

    const checkProducts = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('id, name, money_model_tier')
          .eq('user_id', userId)
          .eq('project_id', existingProject.id)
          .eq('status', 'active')

        if (data && data.length > 0) {
          setExistingProducts(data)
          setSetupComplete(true)
        }
      } catch (err) {
        console.warn('Error checking products:', err)
      }
      setLoading(false)
    }

    checkProducts()
  }, [existingProject, userId, userPersona])

  const handleAddProduct = () => {
    hapticLight()
    setProducts(prev => [...prev, makeEmptyProduct()])
  }

  const handleRemoveProduct = (index) => {
    if (products.length <= 1) return
    setProducts(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateProduct = (index, field, value) => {
    setProducts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const handleSaveProducts = async () => {
    const validProducts = products.filter(p => p.name.trim())
    if (validProducts.length === 0) return

    setSaving(true)
    setError(null)

    try {
      const inserts = validProducts.map(p => ({
        user_id: userId,
        project_id: existingProject?.id || null,
        name: p.name.trim(),
        description: p.description.trim() || null,
        product_type: 'custom_service',
        money_model_tier: p.tier || null,
        status: 'active',
        source: 'business_setup',
        metadata: { captured_at: new Date().toISOString() }
      }))

      const { error: insertError } = await supabase
        .from('products')
        .insert(inserts)

      if (insertError) throw insertError

      hapticSuccess()
      setSetupComplete(true)
    } catch (err) {
      console.error('Error saving products:', err)
      setError('Failed to save products. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const hasValidProduct = products.some(p => p.name.trim())

  if (loading) {
    return (
      <div className="business-setup">
        <div className="bs-loading">
          <div className="bs-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Fully complete
  if (setupComplete && existingProject) {
    return (
      <div className="business-setup">
        <div className="bs-hero">
          <span className="bs-hero-label">Setup</span>
          <h2 className="bs-hero-title">Business Setup Complete</h2>
          <p className="bs-hero-sub">
            {existingProducts.length > 0
              ? `${existingProducts.length} product${existingProducts.length > 1 ? 's' : ''} identified`
              : 'Your project is ready'}
          </p>
        </div>
        <div className="bs-card">
          <p className="bs-card-text">Select a stage tab above to start working on your quests.</p>
        </div>
      </div>
    )
  }

  // Has project but products not yet identified
  if (existingProject && !setupComplete) {
    return (
      <div className="business-setup">
        <div className="bs-hero">
          <span className="bs-hero-label">Setup</span>
          <h2 className="bs-hero-title">Identify Your Products</h2>
          <p className="bs-hero-sub">
            {userPersona === 'movement_maker'
              ? 'Define the products in your suite to unlock the business stages.'
              : 'Tell us about your core product to unlock the business stages.'}
          </p>
        </div>

        <div className="bs-products">
          {products.map((product, index) => (
            <div key={index} className="bs-product-card">
              <div className="bs-product-header">
                <span className="bs-product-number">Product {index + 1}</span>
                {products.length > 1 && (
                  <button className="bs-product-remove" onClick={() => handleRemoveProduct(index)}>&times;</button>
                )}
              </div>

              <div className="bs-field">
                <label>Name your offering</label>
                <input
                  type="text"
                  placeholder="e.g. 1:1 Coaching, Online Course"
                  value={product.name}
                  onChange={(e) => handleUpdateProduct(index, 'name', e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="bs-field">
                <label>One-line description <span className="bs-optional">(optional)</span></label>
                <input
                  type="text"
                  placeholder="What does someone get?"
                  value={product.description}
                  onChange={(e) => handleUpdateProduct(index, 'description', e.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="bs-field">
                <label>Where does this fit in your suite?</label>
                <div className="bs-tier-grid">
                  {TIER_OPTIONS.map(tier => (
                    <button
                      key={tier.id}
                      type="button"
                      className={`bs-tier-btn ${product.tier === tier.id ? 'selected' : ''}`}
                      onClick={() => {
                        hapticLight()
                        handleUpdateProduct(index, 'tier', tier.id)
                      }}
                    >
                      <span className="bs-tier-icon">{tier.icon}</span>
                      <span className="bs-tier-label">{tier.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button className="bs-add-product" onClick={handleAddProduct}>
            + Add another product
          </button>
        </div>

        {error && <p className="bs-error">{error}</p>}

        <button
          className="bs-cta"
          onClick={handleSaveProducts}
          disabled={!hasValidProduct || saving}
        >
          {saving ? 'Saving...' : 'Save Products & Continue'}
        </button>
      </div>
    )
  }

  // No project yet — show creation form
  return (
    <div className="business-setup">
      <div className="bs-hero">
        <span className="bs-hero-label">Setup</span>
        <h2 className="bs-hero-title">Set Up Your Business</h2>
        <p className="bs-hero-sub">Create your project to unlock the business stages. Takes about 2 minutes.</p>
      </div>

      <div className="bs-card">
        <ProjectNameStep
          userId={userId}
          onComplete={(project) => {
            setSetupComplete(true)
            if (onSetupComplete) onSetupComplete(project)
          }}
        />
      </div>
    </div>
  )
}

function makeEmptyProduct() {
  return { name: '', description: '', tier: null }
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
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bs-form">
      <div className="bs-field">
        <label htmlFor="project-name">What's your business or project called?</label>
        <input
          id="project-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My Coaching Business, SaaS App"
          maxLength={100}
          required
        />
      </div>

      <div className="bs-field">
        <label htmlFor="project-desc">Brief description <span className="bs-optional">(optional)</span></label>
        <textarea
          id="project-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does your business do? Who does it serve?"
          rows={3}
          maxLength={500}
        />
      </div>

      {error && <p className="bs-error">{error}</p>}

      <button
        type="submit"
        className="bs-cta"
        disabled={!name.trim() || saving}
      >
        {saving ? 'Creating...' : 'Create Project & Start'}
      </button>
    </form>
  )
}

export default BusinessSetup
