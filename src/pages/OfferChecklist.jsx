/**
 * OfferChecklist.jsx - Implementation checklist for each offer type
 *
 * Routes: /offer-checklist/:category (attraction, upsell, downsell, continuity)
 *
 * Features:
 * - Shows checklist items based on selected offer type
 * - Persists progress to database
 * - Manual "Complete Quest" button when all items checked
 * - POST-ACTION reflection on completion
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { createRelationship, RELATIONSHIP_TYPES } from '../lib/productRelationships'
import { getUserProducts } from '../lib/productsService'
import CompassCheck from '../components/CompassCheck'
import { createCompassEntry } from '../lib/compassEntryHelper'
import './OfferChecklist.css'

// Checklist data for each offer type
const OFFER_CHECKLISTS = {
  attraction: {
    win_your_money_back: {
      name: 'Win Your Money Back',
      icon: '🎰',
      items: [
        { id: 'guarantee_terms', label: 'Guarantee Terms', description: 'Specific conditions customer must meet for refund' },
        { id: 'landing_page', label: 'Landing/Sales Page', description: 'Page explaining the offer and guarantee' },
        { id: 'checkout_flow', label: 'Checkout Flow', description: 'Payment page with guarantee terms visible' },
        { id: 'results_tracking', label: 'Results Tracking', description: 'How you\'ll verify they met the conditions' },
        { id: 'refund_process', label: 'Refund Process', description: 'How refunds will be processed' }
      ]
    },
    giveaway: {
      name: 'Giveaway',
      icon: '🎁',
      items: [
        { id: 'prize_defined', label: 'Prize Defined', description: 'What they win and its value' },
        { id: 'entry_mechanism', label: 'Entry Mechanism', description: 'Form, social share, email signup, etc.' },
        { id: 'landing_page', label: 'Landing Page', description: 'Giveaway promotion page' },
        { id: 'terms_conditions', label: 'Terms & Conditions', description: 'Rules, eligibility, selection process' },
        { id: 'winner_announcement', label: 'Winner Announcement', description: 'How/when winner is selected and notified' },
        { id: 'participant_followup', label: 'Participant Follow-up', description: 'Email sequence for non-winners' }
      ]
    },
    decoy_offer: {
      name: 'Decoy Offer',
      icon: '🎯',
      items: [
        { id: 'decoy_defined', label: 'Decoy Offer Defined', description: 'The option you want them to reject' },
        { id: 'target_defined', label: 'Target Offer Defined', description: 'The option you want them to choose' },
        { id: 'comparison_presentation', label: 'Comparison Presentation', description: 'Side-by-side showing target is better value' },
        { id: 'checkout_flow', label: 'Checkout Flow', description: 'Payment flow for the target offer' }
      ]
    },
    buy_x_get_y: {
      name: 'Buy X Get Y Free',
      icon: '🛒',
      items: [
        { id: 'bundle_defined', label: 'Bundle Defined', description: 'What\'s X (paid) and what\'s Y (free)' },
        { id: 'landing_page', label: 'Landing/Sales Page', description: 'Page showing the bundle value' },
        { id: 'checkout_flow', label: 'Checkout Flow', description: 'Payment with bundle applied' },
        { id: 'delivery_mechanism', label: 'Delivery Mechanism', description: 'How the free item gets delivered' }
      ]
    },
    pay_less_now: {
      name: 'Pay Less Now, More Later',
      icon: '⏳',
      items: [
        { id: 'payment_structure', label: 'Payment Structure', description: 'Initial amount vs. later amounts' },
        { id: 'landing_page', label: 'Landing/Sales Page', description: 'Page explaining the payment option' },
        { id: 'checkout_flow', label: 'Checkout Flow', description: 'Payment plan selection at checkout' },
        { id: 'payment_reminders', label: 'Payment Reminders', description: 'Automated sequence for upcoming payments' },
        { id: 'failed_payment_process', label: 'Failed Payment Process', description: 'What happens if a payment fails' }
      ]
    },
    free_trial: {
      name: 'Free Trial',
      icon: '🆓',
      items: [
        { id: 'trial_access', label: 'Trial Access', description: 'What they get during trial period' },
        { id: 'trial_duration', label: 'Trial Duration', description: 'How long the trial lasts' },
        { id: 'signup_flow', label: 'Sign-up Flow', description: 'How they start the trial' },
        { id: 'conversion_sequence', label: 'Conversion Sequence', description: 'Emails/nudges to convert to paid' },
        { id: 'payment_capture', label: 'Payment Capture', description: 'How payment is collected post-trial' }
      ]
    }
  },
  upsell: {
    classic_upsell: {
      name: 'Classic Upsell',
      icon: '⬆️',
      items: [
        { id: 'upsell_offer_defined', label: 'Upsell Offer Defined', description: 'The higher-tier product/service' },
        { id: 'value_proposition', label: 'Value Proposition', description: 'Why upgrading is worth it' },
        { id: 'upsell_page', label: 'Upsell Page', description: 'Page shown after initial purchase' },
        { id: 'checkout_integration', label: 'Checkout Integration', description: 'One-click add to order' },
        { id: 'delivery_process', label: 'Delivery Process', description: 'How the upsell is fulfilled' }
      ]
    },
    menu_upsell: {
      name: 'Menu Upsell',
      icon: '📋',
      items: [
        { id: 'options_defined', label: 'Options Defined', description: 'Multiple upgrade options at different price points' },
        { id: 'comparison_display', label: 'Comparison Display', description: 'Clear presentation of each option' },
        { id: 'upsell_page', label: 'Upsell Page', description: 'Menu-style selection page' },
        { id: 'checkout_integration', label: 'Checkout Integration', description: 'Easy selection and payment' }
      ]
    },
    anchor_upsell: {
      name: 'Anchor Upsell',
      icon: '⚓',
      items: [
        { id: 'anchor_offer', label: 'Anchor Offer', description: 'Premium option that makes others look reasonable' },
        { id: 'target_offer', label: 'Target Offer', description: 'The option you want them to choose' },
        { id: 'pricing_display', label: 'Pricing Display', description: 'Side-by-side with anchor visible' },
        { id: 'checkout_flow', label: 'Checkout Flow', description: 'Payment for selected option' }
      ]
    },
    rollover_upsell: {
      name: 'Rollover Upsell',
      icon: '🔄',
      items: [
        { id: 'rollover_defined', label: 'Rollover Defined', description: 'What unused value carries forward' },
        { id: 'terms_explained', label: 'Terms Explained', description: 'How rollover works and limitations' },
        { id: 'tracking_system', label: 'Tracking System', description: 'How unused value is tracked' },
        { id: 'upsell_trigger', label: 'Upsell Trigger', description: 'When/how to present the rollover benefit' }
      ]
    },
    pick_your_price: {
      name: 'Pick Your Price',
      icon: '💰',
      items: [
        { id: 'price_tiers', label: 'Price Tiers', description: 'Multiple price points defined' },
        { id: 'value_per_tier', label: 'Value Per Tier', description: 'What they get at each price' },
        { id: 'selection_page', label: 'Selection Page', description: 'Clear presentation of options' },
        { id: 'checkout_flow', label: 'Checkout Flow', description: 'Payment at selected price' }
      ]
    },
    prepay_time: {
      name: 'Prepay Time',
      icon: '⏰',
      items: [
        { id: 'prepay_options', label: 'Prepay Options', description: 'Time periods available (3mo, 6mo, annual)' },
        { id: 'discount_structure', label: 'Discount Structure', description: 'Savings for each prepay period' },
        { id: 'comparison_page', label: 'Comparison Page', description: 'Monthly vs. prepay side-by-side' },
        { id: 'checkout_flow', label: 'Checkout Flow', description: 'Payment for selected period' }
      ]
    }
  },
  downsell: {
    payment_plan: {
      name: 'Payment Plan',
      icon: '💳',
      items: [
        { id: 'plan_structure', label: 'Plan Structure', description: 'Number of payments and amounts' },
        { id: 'downsell_trigger', label: 'Downsell Trigger', description: 'When to offer (cart abandon, checkout decline)' },
        { id: 'downsell_page', label: 'Downsell Page', description: 'Page presenting the payment plan' },
        { id: 'payment_processing', label: 'Payment Processing', description: 'Recurring payment setup' },
        { id: 'reminder_sequence', label: 'Reminder Sequence', description: 'Emails for upcoming/failed payments' }
      ]
    },
    trial_with_penalty: {
      name: 'Trial With Penalty',
      icon: '⚠️',
      items: [
        { id: 'trial_terms', label: 'Trial Terms', description: 'What they get and for how long' },
        { id: 'penalty_defined', label: 'Penalty Defined', description: 'What happens if they cancel/fail' },
        { id: 'downsell_page', label: 'Downsell Page', description: 'Page presenting the trial option' },
        { id: 'conversion_sequence', label: 'Conversion Sequence', description: 'Emails during trial period' },
        { id: 'penalty_process', label: 'Penalty Process', description: 'How penalty is applied' }
      ]
    },
    feature_downsell: {
      name: 'Feature Downsell',
      icon: '🎚️',
      items: [
        { id: 'lite_version', label: 'Lite Version Defined', description: 'What\'s included in the reduced offer' },
        { id: 'feature_comparison', label: 'Feature Comparison', description: 'Full vs. lite side-by-side' },
        { id: 'downsell_page', label: 'Downsell Page', description: 'Page presenting the lite option' },
        { id: 'checkout_flow', label: 'Checkout Flow', description: 'Payment for lite version' },
        { id: 'upgrade_path', label: 'Upgrade Path', description: 'How they can upgrade later' }
      ]
    }
  },
  continuity: {
    downsell_the_upsell: {
      name: 'Downsell the Upsell',
      icon: '⬇️',
      items: [
        { id: 'continuity_offer', label: 'Continuity Offer Defined', description: 'The recurring subscription offer' },
        { id: 'downsell_trigger', label: 'Downsell Trigger', description: 'When upsell is declined, offer continuity' },
        { id: 'value_proposition', label: 'Value Proposition', description: 'Why continuity is worth it' },
        { id: 'downsell_page', label: 'Downsell Page', description: 'Page presenting the continuity option' },
        { id: 'subscription_setup', label: 'Subscription Setup', description: 'Recurring payment processing' }
      ]
    },
    continuity_bonus: {
      name: 'Continuity Bonus',
      icon: '🎁',
      items: [
        { id: 'bonus_defined', label: 'Bonus Defined', description: 'What they get for staying subscribed' },
        { id: 'milestone_rewards', label: 'Milestone Rewards', description: 'Bonuses at 3mo, 6mo, 12mo, etc.' },
        { id: 'communication_plan', label: 'Communication Plan', description: 'How you remind them of bonuses' },
        { id: 'delivery_process', label: 'Delivery Process', description: 'How bonuses are delivered' }
      ]
    },
    rollover_continuity: {
      name: 'Rollover Continuity',
      icon: '🔄',
      items: [
        { id: 'rollover_terms', label: 'Rollover Terms', description: 'What unused value carries forward' },
        { id: 'tracking_system', label: 'Tracking System', description: 'How rollover is tracked' },
        { id: 'communication_plan', label: 'Communication Plan', description: 'Reminders of accumulated value' },
        { id: 'redemption_process', label: 'Redemption Process', description: 'How they use rollover value' }
      ]
    },
    lifetime_discount: {
      name: 'Lifetime Discount',
      icon: '💎',
      items: [
        { id: 'discount_structure', label: 'Discount Structure', description: 'Locked-in rate vs. regular rate' },
        { id: 'urgency_trigger', label: 'Urgency Trigger', description: 'Limited time to lock in rate' },
        { id: 'offer_page', label: 'Offer Page', description: 'Page presenting the lifetime deal' },
        { id: 'subscription_setup', label: 'Subscription Setup', description: 'Recurring payment at locked rate' },
        { id: 'terms_conditions', label: 'Terms & Conditions', description: 'What maintains the locked rate' }
      ]
    }
  }
}

// Category labels
const CATEGORY_LABELS = {
  attraction: 'Attraction Offer',
  upsell: 'Upsell Offer',
  downsell: 'Downsell Offer',
  continuity: 'Continuity Offer'
}

// POST-ACTION feeling options
const FEELING_OPTIONS = [
  { id: 'easier_than_expected', emoji: '😌', label: 'Easier than expected' },
  { id: 'as_expected', emoji: '😐', label: 'As expected' },
  { id: 'harder_than_expected', emoji: '😰', label: 'Harder than expected' },
  { id: 'didnt_finish', emoji: '❌', label: 'Didn\'t finish' }
]

function OfferChecklist() {
  const { category } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const projectId = searchParams.get('projectId')

  const [selectedOfferType, setSelectedOfferType] = useState(null)
  const [checkedItems, setCheckedItems] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // Product linking state (for upsell cross-tagging)
  const [coreProduct, setCoreProduct] = useState(null)
  const [linkableProducts, setLinkableProducts] = useState([])
  const [selectedUpsellProduct, setSelectedUpsellProduct] = useState(null)

  // POST-ACTION state
  const [showPostAction, setShowPostAction] = useState(false)
  const [postFeeling, setPostFeeling] = useState(null)
  const [threePercent, setThreePercent] = useState('')
  const [compassStep, setCompassStep] = useState(false)

  // Hide bottom toolbar on mount, show on unmount
  useEffect(() => {
    document.body.classList.add('hide-toolbar')
    return () => {
      document.body.classList.remove('hide-toolbar')
    }
  }, [])

  // Load existing progress
  useEffect(() => {
    loadProgress()
  }, [user, category])

  // Load product data for cross-tagging (upsell category only)
  useEffect(() => {
    if (user?.id && category === 'upsell') {
      loadProductData()
    }
  }, [user, projectId, category])

  const loadProductData = async () => {
    if (!user?.id) return

    try {
      let coreProductId = null

      // Get the core product for this project (if projectId provided)
      if (projectId) {
        const { data: projectProduct } = await supabase
          .from('products')
          .select('*')
          .eq('project_id', projectId)
          .eq('status', 'active')
          .single()

        if (projectProduct) {
          setCoreProduct(projectProduct)
          coreProductId = projectProduct.id
        }
      }

      // Get all other products user owns (excluding core product)
      const { success, products } = await getUserProducts(user.id, { status: 'active' })
      if (success && products) {
        // Filter out the core product if we have one
        const filteredProducts = coreProductId
          ? products.filter(p => p.id !== coreProductId)
          : products
        setLinkableProducts(filteredProducts)
      }
    } catch (err) {
      console.error('Error loading product data:', err)
    }
  }

  const loadProgress = async () => {
    if (!user?.id || !category) return

    setIsLoading(true)
    try {
      // First, get the user's selected offer type from their decision milestone
      const milestoneMap = {
        attraction: 'decide_acquisition',
        upsell: 'decide_upsell',
        downsell: 'decide_downsell',
        continuity: 'decide_continuity'
      }

      const { data: decisionData } = await supabase
        .from('quest_completions')
        .select('evidence')
        .eq('user_id', user.id)
        .eq('milestone_type', milestoneMap[category])
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      if (decisionData?.evidence?.selected_value) {
        setSelectedOfferType(decisionData.evidence.selected_value)
      }

      // Load checklist progress
      const { data: progressData } = await supabase
        .from('offer_checklist_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', category)
        .single()

      if (progressData) {
        setCheckedItems(progressData.checked_items || {})
        if (progressData.offer_type) {
          setSelectedOfferType(progressData.offer_type)
        }
      }
    } catch (err) {
      console.error('Error loading progress:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const saveProgress = async (newCheckedItems) => {
    if (!user?.id || !category) return

    try {
      const { error } = await supabase
        .from('offer_checklist_progress')
        .upsert({
          user_id: user.id,
          category: category,
          offer_type: selectedOfferType,
          checked_items: newCheckedItems,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,category'
        })

      if (error) throw error
    } catch (err) {
      console.error('Error saving progress:', err)
    }
  }

  const handleItemToggle = (itemId) => {
    const newCheckedItems = {
      ...checkedItems,
      [itemId]: !checkedItems[itemId]
    }
    setCheckedItems(newCheckedItems)
    saveProgress(newCheckedItems)
  }

  const handleOfferTypeSelect = (type) => {
    setSelectedOfferType(type)
    setCheckedItems({})
    saveProgress({})
  }

  const handleCompleteQuest = () => {
    setShowPostAction(true)
  }

  const handleContinueToCompass = () => {
    setCompassStep(true)
  }

  const handleFinalComplete = async (compass) => {
    if (!postFeeling) return

    setIsSaving(true)
    try {
      // Create product relationship for upsell (if core product and upsell product selected, not skipped)
      if (category === 'upsell' && coreProduct?.id && selectedUpsellProduct && selectedUpsellProduct !== 'skip') {
        const relationResult = await createRelationship(
          coreProduct.id,
          selectedUpsellProduct,
          RELATIONSHIP_TYPES.UPSELL,
          'offer_checklist'
        )
        if (!relationResult.success) {
          console.warn('Failed to create product relationship:', relationResult.error)
        }
      }

      // Save POST-ACTION data
      await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: `offer_checklist_${category}`,
        flow_version: 'v1',
        status: 'completed',
        last_step_id: 'post_action_complete',
        step_data: {
          category,
          offer_type: selectedOfferType,
          post_feeling: postFeeling,
          three_percent_reflection: threePercent.trim() || null,
          compass_direction: compass?.direction || null,
          items_completed: Object.keys(checkedItems).filter(k => checkedItems[k]).length,
          linked_upsell_product_id: category === 'upsell' && selectedUpsellProduct !== 'skip' ? selectedUpsellProduct : null,
          core_product_id: coreProduct?.id || null,
          timestamp: new Date().toISOString()
        }
      })

      // Mark the milestone as complete
      const milestoneMap = {
        attraction: 'create_attraction_offer',
        upsell: 'create_upsell_offer',
        downsell: 'create_downsell_offer',
        continuity: 'create_continuity_offer'
      }

      await supabase.from('quest_completions').insert({
        user_id: user.id,
        quest_id: `milestone_create_${category}`,
        quest_category: 'Business',
        quest_type: 'milestone',
        challenge_instance_id: null,
        challenge_day: 0,
        points_earned: 15,
        project_id: projectId || null,
        evidence: {
          offer_type: selectedOfferType,
          items_completed: Object.keys(checkedItems).filter(k => checkedItems[k]),
          post_feeling: postFeeling,
          three_percent: threePercent.trim() || null,
          linked_upsell_product_id: category === 'upsell' && selectedUpsellProduct !== 'skip' ? selectedUpsellProduct : null
        }
      })
      await supabase.rpc('increment_scores', { p_user_id: user.id, p_project_id: projectId || null, p_category: 'business', p_points: 15, p_week_start: new Date().toISOString().slice(0, 10) }).catch(() => {})

      // Create compass entry in flow_entries
      if (compass) {
        await createCompassEntry({
          userId: user.id,
          projectId: projectId || null,
          internalState: compass.internalState,
          externalState: compass.externalState,
          activityDescription: `${CATEGORY_LABELS[category]} Offer Created`,
          reasoning: threePercent.trim() || 'Offer creation reflection'
        })
      }

      setShowPostAction(false)
      setCompassStep(false)
      navigate('/7-day-challenge?tab=business')
    } catch (err) {
      console.error('Error completing quest:', err)
      setError('Failed to complete quest. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Get current checklist
  const categoryChecklists = OFFER_CHECKLISTS[category] || {}
  const currentChecklist = selectedOfferType ? categoryChecklists[selectedOfferType] : null
  const completedCount = currentChecklist
    ? currentChecklist.items.filter(item => checkedItems[item.id]).length
    : 0
  const totalCount = currentChecklist?.items.length || 0
  const checklistComplete = totalCount > 0 && completedCount === totalCount

  // For upsell with linkable products, require product selection (or skip)
  const productLinkingRequired = category === 'upsell' && linkableProducts.length > 0
  const productLinkingComplete = !productLinkingRequired || selectedUpsellProduct !== null
  const allComplete = checklistComplete && productLinkingComplete

  if (isLoading) {
    return (
      <div className="offer-checklist-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="offer-checklist-page">
      <div className="container">
        {/* Header */}
        <div className="checklist-header">
          <h1 className="page-title">Create Your {CATEGORY_LABELS[category]}</h1>
          <p className="page-subtitle">
            Complete each step to build your {category} offer
          </p>
        </div>

        {/* Offer Type Selection (if not selected) */}
        {!selectedOfferType && (
          <div className="offer-type-selection">
            <h2 className="section-title">Which type are you creating?</h2>
            <div className="offer-type-grid">
              {Object.entries(categoryChecklists).map(([key, offer]) => (
                <button
                  key={key}
                  className="offer-type-card"
                  onClick={() => handleOfferTypeSelect(key)}
                >
                  <span className="offer-type-icon">{offer.icon}</span>
                  <span className="offer-type-name">{offer.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Checklist */}
        {selectedOfferType && currentChecklist && (
          <div className="checklist-content">
            {/* Offer Type Header */}
            <div className="offer-header">
              <div className="offer-info">
                <span className="offer-icon">{currentChecklist.icon}</span>
                <h2 className="offer-name">{currentChecklist.name}</h2>
              </div>
              <button
                className="change-type-btn"
                onClick={() => {
                  setSelectedOfferType(null)
                  setCheckedItems({})
                }}
              >
                Change Type
              </button>
            </div>

            {/* Progress Bar */}
            <div className="progress-section">
              <div className="progress-text">
                <span className="progress-count">{completedCount}/{totalCount}</span>
                <span className="progress-label">completed</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Checklist Items */}
            <div className="checklist-items">
              {currentChecklist.items.map((item, index) => (
                <div
                  key={item.id}
                  className={`checklist-item ${checkedItems[item.id] ? 'completed' : ''}`}
                  onClick={() => handleItemToggle(item.id)}
                >
                  <div className="item-checkbox">
                    {checkedItems[item.id] ? (
                      <span className="checkbox-checked">✓</span>
                    ) : (
                      <span className="checkbox-unchecked">{index + 1}</span>
                    )}
                  </div>
                  <div className="item-content">
                    <h3 className="item-label">{item.label}</h3>
                    <p className="item-description">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Product Linking Section (Upsell only) */}
            {category === 'upsell' && linkableProducts.length > 0 && (
              <div className="product-linking-section">
                <div className="linking-header">
                  <h3 className="linking-title">Link Your Upsell Product</h3>
                  <p className="linking-description">
                    {coreProduct ? (
                      <>Which of your existing products is the upsell for <strong>{coreProduct.name}</strong>?</>
                    ) : (
                      'Which of your existing products is this upsell?'
                    )}
                  </p>
                </div>
                <div className="product-options">
                  {linkableProducts.map(product => (
                    <button
                      key={product.id}
                      className={`product-option ${selectedUpsellProduct === product.id ? 'selected' : ''}`}
                      onClick={() => setSelectedUpsellProduct(
                        selectedUpsellProduct === product.id ? null : product.id
                      )}
                    >
                      <span className="product-name">{product.name}</span>
                      {product.price_amount && (
                        <span className="product-price">${product.price_amount}</span>
                      )}
                      {selectedUpsellProduct === product.id && (
                        <span className="selected-check">✓</span>
                      )}
                    </button>
                  ))}
                  <button
                    className={`product-option skip-option ${selectedUpsellProduct === 'skip' ? 'selected' : ''}`}
                    onClick={() => setSelectedUpsellProduct(
                      selectedUpsellProduct === 'skip' ? null : 'skip'
                    )}
                  >
                    <span className="product-name">Skip - I'll add this later</span>
                    {selectedUpsellProduct === 'skip' && (
                      <span className="selected-check">✓</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Complete Quest Button */}
            {allComplete && (
              <div className="complete-section">
                <button
                  className="complete-quest-btn"
                  onClick={handleCompleteQuest}
                >
                  Complete Quest & Earn Points →
                </button>
              </div>
            )}

            {error && <p className="error-message">{error}</p>}

            {/* Save Progress Button - shown when not all complete */}
            {!allComplete && completedCount > 0 && (
              <div className="save-section">
                <button
                  className="save-progress-btn"
                  onClick={() => {
                    saveProgress(checkedItems)
                    navigate('/7-day-challenge?tab=business')
                  }}
                >
                  Save Progress & Exit
                </button>
              </div>
            )}
          </div>
        )}

        {/* Back link at bottom */}
        <span
          className="go-back-link"
          onClick={() => navigate('/7-day-challenge?tab=business')}
        >
          ← Back to Challenge
        </span>
      </div>

      {/* POST-ACTION Modal */}
      {showPostAction && createPortal(
        <div className="post-action-overlay" onClick={() => setShowPostAction(false)}>
          <div className="post-action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="post-action-header">
              <div className="post-action-icon">✅</div>
              <h3 className="post-action-title">{CATEGORY_LABELS[category]} Created!</h3>
              <p className="post-action-subtitle">
                You completed all {totalCount} implementation steps.
              </p>
            </div>

            <div className="post-action-divider"></div>

            {/* Feeling Question */}
            <div className="post-action-section">
              <h4 className="post-action-question">How was the creation process overall?</h4>
              <div className="post-action-feelings">
                {FEELING_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    className={`post-action-feeling ${postFeeling === option.id ? 'selected' : ''}`}
                    onClick={() => setPostFeeling(option.id)}
                  >
                    <span className="feeling-emoji">{option.emoji}</span>
                    <span className="feeling-label">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="post-action-divider"></div>

            {/* 3% Reflection */}
            <div className="post-action-section">
              <h4 className="post-action-question">
                What would make your {category} offer 3% better next time?
              </h4>
              <textarea
                className="post-action-textarea"
                placeholder="e.g., Start with the checkout flow first..."
                value={threePercent}
                onChange={(e) => setThreePercent(e.target.value)}
                rows={3}
              />
              <p className="post-action-hint">Optional — your insights compound over time</p>
            </div>

            {/* Compass Check or Complete Button */}
            {compassStep ? (
              <div className="post-action-section">
                <CompassCheck
                  onComplete={(data) => handleFinalComplete(data)}
                  onSkip={() => handleFinalComplete(null)}
                />
              </div>
            ) : (
              <button
                className="post-action-complete-btn"
                onClick={handleContinueToCompass}
                disabled={!postFeeling || isSaving}
              >
                {isSaving ? 'Saving...' : 'Continue →'}
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default OfferChecklist
