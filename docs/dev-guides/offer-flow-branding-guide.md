# Offer Flow Branding & Design Guide

A comprehensive guide for creating new flows that match the UpsellFlow, DownsellFlow, and AttractionOfferFlow patterns.

---

## Quick Reference

| Element | Value |
|---------|-------|
| **Primary Color** | `#5e17eb` (Purple) |
| **Accent Color** | `#ffdd27` (Gold) |
| **Success Color** | `#10B981` (Green) |
| **Error Color** | `#ef4444` (Red) |
| **Background** | Purple gradient `135deg, #4a0ea8 → #5e17eb → #7c3aed` |
| **Font Weights** | 700 (headings), 600 (body), 500 (labels) |
| **Border Radius** | 16px (containers), 12px (buttons/inputs) |
| **Questions** | Always 10 |
| **Completion Time** | ~3 minutes |

---

## 1. Flow Architecture

### Stage Progression
```
WELCOME → Q1-Q10 → CALCULATING → REVEAL → SUCCESS
```

### Stage Groups (for progress bar)
```javascript
const STAGE_GROUPS = [
  { id: 'welcome', label: 'Welcome', stages: ['welcome'] },
  { id: 'business', label: 'Business', stages: ['q1', 'q2', 'q3'] },
  { id: 'operations', label: 'Operations', stages: ['q4', 'q5'] },
  { id: 'market', label: 'Market', stages: ['q6', 'q7'] },
  { id: 'goals', label: 'Goals', stages: ['q8', 'q9', 'q10'] },
  { id: 'results', label: 'Results', stages: ['calculating', 'reveal'] },
  { id: 'complete', label: 'Complete', stages: ['success'] }
]
```

---

## 2. Color System

### Primary Palette
```css
:root {
  --purple: #5e17eb;
  --purple-dark: #4a0ea8;
  --purple-light: #7c3aed;
  --gold: #ffdd27;
  --gold-dark: #f59e0b;
}
```

### UI Colors
```css
/* Backgrounds */
--bg-gradient: linear-gradient(135deg, #4a0ea8 0%, #5e17eb 50%, #7c3aed 100%);
--bg-frosted: rgba(255, 255, 255, 0.05);
--bg-hover: rgba(255, 255, 255, 0.1);

/* Text */
--text-primary: #ffffff;
--text-secondary: rgba(255, 255, 255, 0.85);
--text-muted: rgba(255, 255, 255, 0.6);

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.1);
--border-medium: rgba(255, 255, 255, 0.2);
--border-focus: rgba(147, 51, 234, 0.8);

/* Status */
--success: #10B981;
--success-dark: #059669;
--error: #ef4444;
--warning: #f59e0b;
```

### Gradient Text (Gold)
```css
.gradient-text {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 3. Typography

### Font Scale
| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Offer Name (Reveal) | 36px | 700 | 1.2 |
| Welcome Greeting | 32px | 700 | 1.2 |
| Question Text | 28px | 600 | 1.3 |
| Section Headings | 24px | 600 | 1.3 |
| Body Text | 16px | 500 | 1.5 |
| Option Labels | 16px | 600 | 1.4 |
| Small Labels | 14px | 500 | 1.4 |
| Tiny Text | 12px | 400 | 1.4 |

### Mobile Adjustments (< 480px)
- Welcome Greeting: 28px
- Question Text: 22px
- Offer Name: 28px

---

## 4. Component Patterns

### Container (Frosted Glass)
```css
.container {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
}
```

### Option Card
```css
.option-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.option-card.selected {
  background: rgba(147, 51, 234, 0.3);
  border-color: rgba(147, 51, 234, 0.6);
}
```

### Primary Button (Gold CTA)
```css
.primary-button {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #000;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  border: none;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
  transition: all 0.2s ease;
}

.primary-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(251, 191, 36, 0.4);
}
```

### Secondary Button
```css
.secondary-button {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 12px 24px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### Progress Bar
```css
.progress-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(74, 14, 168, 0.95);
  backdrop-filter: blur(10px);
  padding: 16px 20px;
}

.progress-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.progress-dot.completed {
  background: #10B981;
}

.progress-dot.active {
  background: #ffdd27;
  transform: scale(1.3);
}
```

### Confidence Bar
```css
.confidence-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #10B981, #34D399);
  border-radius: 6px;
  transition: width 1s ease-out;
}
```

### Badge (Pill)
```css
.badge {
  display: inline-block;
  background: linear-gradient(135deg, #10B981, #059669);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}
```

---

## 5. Animations

### Fade In (Default entrance)
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}
```

### Scale In (Success icon)
```css
@keyframes scaleIn {
  from { transform: scale(0); }
  to { transform: scale(1); }
}
```

### Typing Indicator
```css
@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.typing-dot {
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  animation: typing 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
```

---

## 6. Screen Templates

### Welcome Screen
```jsx
<div className="welcome-container">
  <h1 className="welcome-greeting">
    Welcome to the {FlowName}
  </h1>
  <p className="welcome-message">
    Answer 10 quick questions to discover your ideal strategy.
  </p>
  <p className="attribution-text">
    Based on Alex Hormozi's $100M Offers framework
  </p>
  <button className="primary-button" onClick={handleStart}>
    Let's Begin
  </button>
</div>
```

### Question Screen
```jsx
<div className="question-container">
  <span className="question-number">Question {n} of 10</span>
  <h2 className="question-text">{question.question}</h2>
  {question.subtext && (
    <p className="question-subtext">{question.subtext}</p>
  )}
  <div className="options-list">
    {question.options.map(option => (
      <button
        key={option.value}
        className="option-card"
        onClick={() => handleSelect(option)}
      >
        <span className="option-label">{option.label}</span>
        {option.description && (
          <span className="option-description">{option.description}</span>
        )}
      </button>
    ))}
  </div>
</div>
```

### Calculating Screen
```jsx
<div className="calculating-container">
  <h2 className="calculating-title">Analyzing Your Responses</h2>
  <div className="calculating-steps">
    <div className="step completed">Reviewing answers...</div>
    <div className="step active">Matching strategies...</div>
    <div className="step">Calculating fit scores...</div>
    <div className="step">Preparing recommendations...</div>
  </div>
  <div className="typing-indicator">
    <span className="typing-dot"></span>
    <span className="typing-dot"></span>
    <span className="typing-dot"></span>
  </div>
</div>
```

### Reveal Screen
```jsx
<div className="reveal-container">
  <span className="reveal-badge">Your Best Match</span>
  <h1 className="reveal-offer-name">{offer.name}</h1>
  <p className="reveal-tagline">{offer.tagline}</p>

  <div className="confidence-display">
    <div className="confidence-bar">
      <div className="confidence-fill" style={{width: `${confidence}%`}} />
    </div>
    <span className="confidence-label">{confidenceLabel} ({confidence}%)</span>
  </div>

  <div className="reveal-description">
    <p>{offer.description}</p>
  </div>

  <div className="funnel-preview">
    <h3>Implementation Steps</h3>
    <ol>
      {offer.funnel_template.offer_structure.map(step => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  </div>

  <div className="metrics-preview">
    <h3>Track These Metrics</h3>
    <div className="metrics-grid">
      {offer.metrics_to_track.map(metric => (
        <div className="metric-card" key={metric}>{metric}</div>
      ))}
    </div>
  </div>

  <button className="primary-button" onClick={handleSave}>
    Save My Results
  </button>
</div>
```

---

## 7. JSON File Structures

### Questions File (`{flow}-questions.json`)
```json
{
  "metadata": {
    "version": "1.0.0",
    "flow_name": "Your Flow Name",
    "total_questions": 10,
    "estimated_completion_time_minutes": 3,
    "description": "Brief description of what this flow determines"
  },
  "questions": [
    {
      "id": "q1_field_name",
      "question": "The main question text?",
      "subtext": "Optional helper text explaining the question",
      "options": [
        {
          "label": "Option Display Text",
          "value": "option_value_snake_case",
          "description": "Optional description of what this means"
        }
      ]
    }
  ]
}
```

### Offers File (`offers.json`)
```json
{
  "offers": [
    {
      "id": "offer_id_snake_case",
      "name": "Offer Display Name",
      "tagline": "One-line value proposition",
      "description": "Full paragraph explaining the strategy",
      "best_for": [
        "Ideal situation 1",
        "Ideal situation 2"
      ],
      "key_success_factors": [
        "Success factor 1",
        "Success factor 2"
      ],
      "when_it_fails": [
        "Failure scenario 1"
      ],
      "metrics_to_track": [
        "Conversion Rate",
        "Revenue Per Customer"
      ],
      "max_possible_score": 30,
      "scoring_weights": {
        "Q1_field_name": {
          "option_value_1": 3,
          "option_value_2": 2,
          "option_value_3": 1
        }
      },
      "hard_disqualifiers": [
        {
          "field": "field_name",
          "disallowed": ["value_that_disqualifies"],
          "reason": "Explanation shown to user"
        }
      ],
      "funnel_template": {
        "offer_structure": [
          "Step 1: Do this",
          "Step 2: Then this"
        ],
        "metrics": ["Metric 1", "Metric 2"]
      }
    }
  ]
}
```

---

## 8. Scoring System

### Weight Values
| Weight | Meaning |
|--------|---------|
| 4 | Perfect match |
| 3 | Strong match |
| 2 | Moderate match |
| 1 | Weak match |
| 0 | Neutral |
| -1 to -3 | Negative indicator |

### Confidence Calculation
```javascript
const confidence = (totalScore / offer.max_possible_score) * 100

// Confidence Labels
if (confidence >= 70) return "Excellent Fit"
if (confidence >= 55) return "Strong Fit"
return "Good Fit"
```

### Hard Disqualifiers
Immediately remove offer from recommendations:
```javascript
{
  "field": "business_model",
  "disallowed": ["saas_software", "agency_service"],
  "reason": "This strategy doesn't work for SaaS or agency models"
}
```

---

## 9. Database Schema

### Assessment Table
```sql
CREATE TABLE {flow_type}_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT,
  email TEXT,
  responses JSONB,
  recommended_offer_id TEXT,
  recommended_offer_name TEXT,
  confidence_score NUMERIC,
  total_score NUMERIC,
  all_offer_scores JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Flow Session Entry
```javascript
{
  user_id: user.id,
  flow_type: '{flow_name}_flow',
  flow_version: '{flow_name}-offer-v1',
  status: 'completed',
  last_step_id: 'complete'
}
```

---

## 10. File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component | `{FlowName}Flow.jsx` | `UpsellFlow.jsx` |
| CSS | `{FlowName}Flow.css` | `UpsellFlow.css` |
| Questions JSON | `{flow-name}-questions.json` | `upsell-questions.json` |
| Offers JSON | `/Money Model/{FlowName}/offers.json` | `/Money Model/Upsell/offers.json` |
| DB Table | `{flow_type}_assessments` | `upsell_assessments` |
| CSS Class Prefix | `.{flow-name}-flow` | `.upsell-flow` |

---

## 11. Mobile Responsiveness

### Breakpoints
- **Desktop**: > 768px
- **Tablet**: 481px - 768px
- **Mobile**: < 480px

### Key Adjustments at 480px
```css
@media (max-width: 480px) {
  .welcome-greeting { font-size: 28px; }
  .question-text { font-size: 22px; }
  .reveal-offer-name { font-size: 28px; }
  .metrics-grid { grid-template-columns: 1fr; }
  .option-card { padding: 14px 16px; }
}
```

### iOS Safe Area
```css
@supports (padding-top: env(safe-area-inset-top)) {
  .flow-container {
    padding-top: calc(80px + env(safe-area-inset-top));
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

---

## 12. Checklist for New Flows

### Files to Create
- [ ] `src/{FlowName}Flow.jsx`
- [ ] `src/{FlowName}Flow.css`
- [ ] `public/{flow-name}-questions.json`
- [ ] `public/Money Model/{FlowName}/offers.json`

### Database Setup
- [ ] Create `{flow_type}_assessments` table
- [ ] Add RLS policies for user access
- [ ] Update `flow_sessions` types if needed

### Route Setup
- [ ] Add route in `AppRouter.jsx`
- [ ] Wrap in `<AuthGate>` if protected

### Integration
- [ ] Import `completeFlowQuest` for points
- [ ] Update quest definitions if needed
- [ ] Test scoring algorithm
- [ ] Verify redirect after completion

---

## Example: Creating a "Pricing Strategy" Flow

1. **Create question file** (`public/pricing-questions.json`)
2. **Create offers file** (`public/Money Model/Pricing/offers.json`)
3. **Copy UpsellFlow.jsx** → **PricingFlow.jsx**
4. **Find/replace**: `upsell` → `pricing`, `Upsell` → `Pricing`
5. **Update CSS class names** in both files
6. **Create database table**
7. **Add route**: `<Route path="/pricing-strategy" element={...} />`
8. **Test the full flow**

---

*This guide ensures visual and functional consistency across all offer flows in FindMyFlow.*
