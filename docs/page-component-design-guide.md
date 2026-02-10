# FindMyFlow — Page & Component Design Guide v2

**For AI agents and developers building new pages/components in the app.**

This guide is structured so you can copy-paste starter templates, then consult decision trees and token tables for specific choices. The older `design-guide.md` covers marketing/landing pages — this covers the in-app experience.

---

## 1. STARTER TEMPLATES (Copy-Paste)

### 1A. New Page — JSX Skeleton

Copy this, then replace `new-page`, `NewPage`, and fill in sections:

```jsx
/**
 * NewPage.jsx — /route-name
 * [One-line description]
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'         // or '../../auth/AuthProvider' for nested
import { supabase } from '../lib/supabaseClient'       // or '../../lib/supabaseClient'
import { hapticLight } from '../lib/haptics'            // or '../../lib/haptics'
import './NewPage.css'

export default function NewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    loadData()
  }, [user?.id])

  async function loadData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('table_name')
        .select('*')
        .eq('user_id', user.id)
      if (data) {
        // setState(data)
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="new-page">
        <div className="np-loading">
          <div className="np-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // --- EMPTY STATE ---
  // if (data.length === 0) {
  //   return (
  //     <div className="new-page">
  //       <div className="np-empty">
  //         <span className="np-empty-icon">📭</span>
  //         <h3 className="np-empty-title">Nothing here yet</h3>
  //         <p className="np-empty-text">Description of what to do first</p>
  //         <button className="np-cta" onClick={() => {}}>
  //           Get Started <span>→</span>
  //         </button>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="new-page">
      {/* TOOLBAR (if sub-page with back nav) */}
      <div className="np-toolbar">
        <button className="np-back" onClick={() => navigate(-1)}>←</button>
        <h2 className="np-toolbar-title">Page Title</h2>
      </div>

      {/* HERO/STATS CARD (dark purple banner — see Decision Tree) */}
      <div className="np-hero">
        <span className="np-hero-label">Section Label</span>
        <h2 className="np-hero-title">Main Heading</h2>
        <p className="np-hero-sub">Supporting text</p>
        <button className="np-cta" onClick={() => {}}>
          Action <span>→</span>
        </button>
      </div>

      {/* CONTENT SECTION (white cards) */}
      <section className="np-section">
        {/* Cards, lists, accordions go here */}
      </section>
    </div>
  )
}
```

### 1B. New Page — CSS Skeleton

```css
/**
 * NewPage.css — /route-name
 * [One-line description]
 */

/* === ROOT === */
.new-page {
  --brand-purple: #5e17eb;
  --brand-gold: #E9A23B;
  --text-primary: #1a1a2e;
  --text-secondary: #6c757d;
  --text-muted: #adb5bd;
  --surface: #ffffff;

  min-height: 100vh;
  background: linear-gradient(
    180deg,
    rgba(94, 23, 235, 0.04) 0%,
    #fafafa 25%,
    #fafafa 75%,
    rgba(233, 162, 59, 0.04) 100%
  );
  padding: 24px 20px;
  padding-top: 80px;                                     /* space for fixed toolbar */
  padding-bottom: calc(120px + env(safe-area-inset-bottom, 0px));  /* space for bottom nav */
  color: var(--text-primary);
  overflow-x: hidden;
}

/* === LOADING STATE === */
.new-page .np-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
  color: var(--text-secondary);
}

.new-page .np-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e9ecef;
  border-top-color: var(--brand-purple);
  border-radius: 50%;
  animation: npSpin 0.8s linear infinite;
}

@keyframes npSpin {
  to { transform: rotate(360deg); }
}

/* === EMPTY STATE === */
.new-page .np-empty {
  text-align: center;
  padding: 60px 20px;
}

.new-page .np-empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 16px;
}

.new-page .np-empty-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 8px;
  letter-spacing: -0.3px;
}

.new-page .np-empty-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 24px;
  line-height: 1.5;
}

/* === TOOLBAR (fixed top bar) === */
.new-page .np-toolbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 56px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-bottom: 1px solid #dee2e6;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.new-page .np-back {
  position: absolute;
  left: 16px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--brand-purple);
  cursor: pointer;
  padding: 8px;
  margin: -8px;
  line-height: 1;
}

.new-page .np-toolbar-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.3px;
}

/* === DARK HERO CARD (quest-banner) === */
.new-page .np-hero {
  background: linear-gradient(135deg, var(--brand-purple) 0%, #7c3aed 50%, #4c1d95 100%);
  border-radius: 24px;
  padding: 28px 24px;
  margin-bottom: 16px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(94, 23, 235, 0.3);
}

.new-page .np-hero::before {
  content: '';
  position: absolute;
  top: -40px; right: -20px;
  width: 180px; height: 180px;
  background: radial-gradient(circle, rgba(233, 162, 59, 0.2) 0%, transparent 70%);
  animation: npGlow 4s ease-in-out infinite;
  pointer-events: none;
}

.new-page .np-hero::after {
  content: '';
  position: absolute;
  bottom: -60px; left: -30px;
  width: 140px; height: 140px;
  background: radial-gradient(circle, rgba(94, 23, 235, 0.25) 0%, transparent 70%);
  pointer-events: none;
}

@keyframes npGlow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

.new-page .np-hero-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: rgba(255, 255, 255, 0.6);
  display: block;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.new-page .np-hero-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.3px;
  margin: 0 0 6px;
  position: relative;
  z-index: 1;
}

.new-page .np-hero-sub {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.65);
  margin: 0 0 20px;
  position: relative;
  z-index: 1;
}

/* === GOLD CTA BUTTON === */
.new-page .np-cta {
  width: 100%;
  background: linear-gradient(135deg, var(--brand-gold), #f5c55a);
  color: #1a1a2e;
  border: none;
  padding: 16px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(233, 162, 59, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
  font-family: inherit;
  position: relative;
  z-index: 1;
}

.new-page .np-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(233, 162, 59, 0.4);
}

/* === WHITE CONTENT CARD === */
.new-page .np-card {
  background: var(--surface);
  border: 1px solid #e9ecef;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
  margin-bottom: 16px;
}

/* Optional: left accent bar */
.new-page .np-card.accented::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 5px;
  background: linear-gradient(180deg, var(--brand-purple), #10b981, var(--brand-gold));
  border-radius: 24px 0 0 24px;
  z-index: 2;
}

/* === SECTION HEADER (eyebrow) === */
.new-page .np-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.new-page .np-section-icon {
  width: 32px; height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--brand-purple), #7c3aed);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
}

.new-page .np-section-title {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--brand-purple);
}

/* === FORM FIELDS === */
.new-page .np-field {
  margin-bottom: 16px;
}

.new-page .np-field label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.new-page .np-field input,
.new-page .np-field select,
.new-page .np-field textarea {
  width: 100%;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 14px 16px;
  color: var(--text-primary);
  font-size: 16px;
  font-family: inherit;
  transition: all 0.2s;
}

.new-page .np-field input:focus,
.new-page .np-field select:focus,
.new-page .np-field textarea:focus {
  outline: none;
  border-color: var(--brand-purple);
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(94, 23, 235, 0.1);
}

.new-page .np-field input::placeholder {
  color: var(--text-muted);
}

.new-page .np-field textarea {
  resize: vertical;
  min-height: 80px;
}

/* === FILTER CHIPS === */
.new-page .np-filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 16px;
  -webkit-overflow-scrolling: touch;
}

.new-page .np-chip {
  flex-shrink: 0;
  padding: 8px 16px;
  background: var(--surface);
  border: 1px solid #e9ecef;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  font-family: inherit;
}

.new-page .np-chip.active {
  background: rgba(94, 23, 235, 0.06);
  border-color: rgba(94, 23, 235, 0.15);
  color: var(--brand-purple);
}

/* === MODAL (bottom sheet, default) === */
.new-page .np-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
}

/* Top-anchored variant */
.new-page .np-modal-overlay.modal-top {
  align-items: flex-start;
  padding-top: 0;
}

.new-page .np-modal {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  background: var(--surface);
  border-radius: 24px 24px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
}

.new-page .np-modal-overlay.modal-top .np-modal {
  border-radius: 0 0 24px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.new-page .np-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e9ecef;
}

.new-page .np-modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.new-page .np-modal-close {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: #f8f9fa;
  border: none;
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 20px;
  cursor: pointer;
}

.new-page .np-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.new-page .np-modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 24px;
  border-top: 1px solid #e9ecef;
}

/* === PURPLE SAVE BUTTON === */
.new-page .np-save {
  background: linear-gradient(135deg, var(--brand-purple), #7c3aed);
  border: none;
  color: #ffffff;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(94, 23, 235, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

.new-page .np-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(94, 23, 235, 0.4);
}

/* === CANCEL BUTTON === */
.new-page .np-cancel {
  background: #ffffff;
  border: 2px solid #e9ecef;
  color: var(--text-secondary);
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.new-page .np-cancel:hover {
  background: #f8f9fa;
  border-color: #dee2e6;
}

/* === DELETE BUTTON === */
.new-page .np-delete {
  background: #fef2f2;
  border: 2px solid #fecaca;
  color: #dc2626;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.new-page .np-delete:hover {
  background: #fee2e2;
  border-color: #f87171;
}

/* === RESPONSIVE === */
@media (min-width: 768px) {
  .new-page {
    max-width: 700px;
    margin: 0 auto;
  }

  .new-page .np-modal-overlay {
    align-items: center;
  }

  .new-page .np-modal {
    border-radius: 24px;
  }
}

@media (max-width: 480px) {
  .new-page {
    padding: 16px;
    padding-top: 72px;
  }

  .new-page .np-modal-actions {
    flex-direction: column;
  }

  .new-page .np-modal-actions button {
    width: 100%;
  }
}

/* === REDUCED MOTION === */
@media (prefers-reduced-motion: reduce) {
  .new-page .np-spinner { animation: none; }
  .new-page .np-hero::before { animation: none; }
  .new-page *,
  .new-page *::before,
  .new-page *::after {
    transition-duration: 0.01ms !important;
  }
}
```

---

## 2. DECISION TREES

### Which card type?

```
Is this the page's primary highlight / key numbers?
  YES → Dark hero card (quest-banner)
        → See: MePage.css:492-526, Sales.css:98-135
  NO →
    Does it contain a list of items or expandable content?
      YES → White card with left accent bar
            → See: MePage.css:239-256 (flow-journey)
      NO →
        Is it clickable / navigates somewhere?
          YES → White card with top accent bar + hover lift
                → See: MePage.css:644-669 (hero-profile-card)
          NO → Plain white card (no accent)
              → See: Sales.css:666-672 (lost-deals)
```

### Which button?

```
Is this THE primary action on the page?
  YES → Gold CTA (full-width, 800 weight)
        → See: MePage.css:611-635, Sales.css:206-229
  NO →
    Is this a form submit / save action?
      YES → Purple save button
            → See: Sales.css:949-965
      NO →
        Is this on a dark background?
          YES → Ghost button (frosted glass) or Gold CTA
          NO →
            Is this destructive (delete)?
              YES → Red delete button
                    → See: Sales.css:971-987
              NO → Cancel/close = bordered gray button
                   → See: Sales.css:932-947
```

### Which modal position?

```
Is this a quick-entry form (1-3 fields)?
  YES → Top-anchored modal (.modal-top)
        → See: Sales.css:720-723, Sales.jsx:612
  NO →
    Is this a detail view with scrollable content?
      YES → Bottom-sheet modal (default)
            → See: Sales.css:706-717, Sales.jsx:701
      NO → Bottom-sheet modal (default)
```

### Dark card or white card for stats?

```
Are these the page's headline numbers / KPIs?
  YES → Dark hero card with glow orbs
        Values that represent EARNED money → gold (#E9A23B)
        Values that represent POTENTIAL → white (rgba(255,255,255,0.9))
        → See: Sales.css:172-182
  NO →
    Are these secondary progress stats?
      YES → SVG stat rings inside a white card
            → See: MePage.jsx:29-51, MePage.css:415-431
      NO → Inline text in card body
```

---

## 3. CANONICAL FILE REFERENCES

Every pattern points to exact file:line. Open these when you need to see real working code.

### Page-Level Patterns

| Pattern | JSX Reference | CSS Reference |
|---------|--------------|---------------|
| **Gradient background wash** | — | `MePage.css:22-32`, `Sales.css:7-28` |
| **CSS variable declaration** | — | `MePage.css:3-21`, `Sales.css:8-14` |
| **Fixed toolbar** | `Sales.jsx:424-429` | `Sales.css:55-95` |
| **Loading spinner** | `Sales.jsx:410-417` | `Sales.css:31-52` |
| **Reduced motion block** | — | `Sales.css:1071-1101` |
| **Responsive breakpoints** | — | `Sales.css:1026-1068` |

### Card Patterns

| Pattern | JSX Reference | CSS Reference |
|---------|--------------|---------------|
| **Dark hero card (quest-banner)** | `MePage.jsx:528-563` | `MePage.css:492-526` |
| **Dark hero card (stats)** | `Sales.jsx:432-466` | `Sales.css:98-199` |
| **White card + left accent bar** | `MePage.jsx:390-391` | `MePage.css:239-256` |
| **White card + top accent bar** | `MePage.jsx:569` | `MePage.css:644-669` |
| **Accordion card** | `Sales.jsx:515-593` | `Sales.css:395-524` |
| **Deal/item card** | `Sales.jsx:545-582` | `Sales.css:538-598` |

### Button Patterns

| Pattern | JSX Reference | CSS Reference |
|---------|--------------|---------------|
| **Gold CTA** | `MePage.jsx:559-561` | `MePage.css:611-635` |
| **Gold CTA (in dark card)** | `Sales.jsx:446-448` | `Sales.css:206-229` |
| **Purple save button** | `Sales.jsx:766` | `Sales.css:949-965` |
| **Cancel button** | `Sales.jsx:769` | `Sales.css:932-947` |
| **Delete button** | `Sales.jsx:749` | `Sales.css:971-987` |
| **Text link button** | `MePage.jsx:518-520` | `MePage.css:462-468` |

### Interactive Patterns

| Pattern | JSX Reference | CSS Reference |
|---------|--------------|---------------|
| **Dropdown menu (add button)** | `Sales.jsx:445-464` | `Sales.css:231-288` |
| **Filter chips** | `Sales.jsx:469-493` | `Sales.css:358-393` |
| **Accordion expand/collapse** | `Sales.jsx:358-369, 515-593` | `Sales.css:395-516` |
| **Project selector dropdown** | `MePage.jsx:398-426` | `MePage.css:286-377` |
| **Bottom sheet modal** | `Sales.jsx:700-776` | `Sales.css:706-787` |
| **Top-anchored modal** | `Sales.jsx:611-697` | `Sales.css:720-742` |

### Form Patterns

| Pattern | JSX Reference | CSS Reference |
|---------|--------------|---------------|
| **Text input** | `Sales.jsx:621-626` | `Sales.css:814-838` |
| **Select dropdown** | `Sales.jsx:643-652` | `Sales.css:814-842` |
| **Textarea** | `Sales.jsx:679-684` | `Sales.css:844-847` |
| **Form field + label** | `Sales.jsx:619-627` | `Sales.css:789-801` |
| **Focus ring** | — | `Sales.css:827-834` |

### Typography Patterns

| Pattern | CSS Reference | Values |
|---------|--------------|--------|
| **Hero name (page title)** | `MePage.css:131-137` | `28px / 900 / -0.5px` |
| **Card title** | `MePage.css:706-710` | `18px / 800 / -0.3px` |
| **Section eyebrow** | `MePage.css:276-279` | `11px / 800 / uppercase / 1.5px` |
| **Dark card eyebrow** | `MePage.css:536-540` | `11px / 800 / uppercase / 1.5px / rgba(255,255,255,0.6)` |
| **Dark card title** | `MePage.css:555-561` | `22px / 800 / -0.3px / white` |
| **Stat value (ring)** | `MePage.css:423-427` | `13px / 800` |
| **Stat label** | `MePage.css:428-431` | `9px / 700 / uppercase / 0.5px / --text-muted` |
| **Badge text** | `MePage.css:154-163` | `13px / 700` |
| **Meta text** | `Sales.css:592-597` | `11px / 600 / --text-muted` |

---

## 4. TOKEN TABLES

### Colors

| Token | Value | Use |
|-------|-------|-----|
| `--brand-purple` | `#5e17eb` | Links, active states, purple buttons, toolbar accents |
| `--brand-gold` | `#E9A23B` | Gold CTAs, earned money, completed progress, fire |
| `--text-primary` | `#1a1a2e` | Headings, names, important text |
| `--text-secondary` | `#6c757d` | Body text, descriptions, subtitles |
| `--text-muted` | `#adb5bd` | Labels, meta, placeholders, chevrons |
| `--surface` | `#ffffff` | Card backgrounds |
| Green | `#10b981` | Earned revenue, success, completed, north/flow |
| Red | `#ef4444` | Delete, danger, south/rest |
| Blue | `#3b82f6` | East/redirect, info badges |
| Yellow | `#fbbf24` | West/honour, caution |
| Streak orange | `#E67E22` | Streak badges |

### Border Radius

| Context | Value |
|---------|-------|
| Top-level cards, accordions, modals | `24px` |
| Inner content blocks, narrative | `16px` |
| Buttons, inputs, dropdowns | `12–14px` |
| Dropdown items, section icons | `10px` |
| Meta tags | `5–6px` |
| Pills, badges, chips | `100px` |
| Avatars | `50%` |
| Progress bars | `3–5px` |

### Shadows

| Context | Value |
|---------|-------|
| Cards (resting) | `0 4px 24px rgba(0, 0, 0, 0.05)` |
| Cards (hover) | `0 8px 32px rgba(94, 23, 235, 0.1)` |
| Dark hero cards | `0 8px 32px rgba(94, 23, 235, 0.3)` |
| Purple buttons | `0 4px 16px rgba(94, 23, 235, 0.3)` |
| Gold buttons | `0 4px 16px rgba(233, 162, 59, 0.3)` |
| Gold buttons (hover) | `0 6px 24px rgba(233, 162, 59, 0.4)` |
| Dropdowns | `0 8px 32px rgba(0, 0, 0, 0.12)` |
| Toolbar | `0 2px 8px rgba(0, 0, 0, 0.04)` |

### Typography

| Role | Size | Weight | Letter-spacing | Extra |
|------|------|--------|----------------|-------|
| Page title | `28px` | `900` | `-0.5px` | — |
| Dark card title | `22px` | `800` | `-0.3px` | white |
| Modal title | `20px` | `800` | `-0.3px` | — |
| Card title / toolbar | `18px` | `800` | `-0.3px` | — |
| Gold CTA text | `16px` | `800` | — | dark text `#1a1a2e` |
| Body text / subtitle | `13–15px` | `400–600` | — | `line-height: 1.5` |
| Stat value (big) | `28px` | `800` | `-0.5px` | in dark hero |
| Stat value (ring) | `13px` | `800` | — | — |
| Badge text | `13px` | `700` | — | — |
| Section eyebrow | `11px` | `800` | `1.5px` | uppercase |
| Meta / stat label | `9–11px` | `600–700` | `0.5–1.5px` | uppercase, `--text-muted` |

### Spacing

| Context | Value |
|---------|-------|
| Page horizontal padding | `20px` (16px on small mobile) |
| Page top padding | `80px` (toolbar clearance) |
| Page bottom padding | `120px + safe-area` (bottom nav) |
| Section bottom gap | `16px` |
| Card inner padding | `24px` |
| Between elements in card | `12–16px` |
| Between accordion items | `10px` |
| Filter chip gap | `8px` |
| Hero card padding | `28px 24px` |

---

## 5. ANTI-PATTERNS (What NOT To Do)

### Wrong: Green gradient text on white card

```css
/* WRONG — This is what we replaced on the Sales page */
.stat-value {
  background: linear-gradient(135deg, #10b981, #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```
This looks generic and off-brand. Stats should live in a dark hero card with gold for earned values and white for potential values.

### Wrong: Flat white background

```css
/* WRONG */
.page-name {
  background: #ffffff;
}
```
Always use the gradient wash: `linear-gradient(180deg, rgba(94,23,235,0.04) 0%, #fafafa 25%, #fafafa 75%, rgba(233,162,59,0.04) 100%)`

### Wrong: Generic border-radius

```css
/* WRONG — inconsistent radius */
.card { border-radius: 8px; }
.other-card { border-radius: 16px; }
.button { border-radius: 20px; }
```
Follow the radius scale: cards=24px, buttons=12-14px, pills=100px. See token table above.

### Wrong: Light font weights for headings

```css
/* WRONG */
.title { font-weight: 600; }
.card-name { font-weight: 500; }
```
Headings are always `800` or `900`. This is what gives the app its bold, premium feel.

### Wrong: Unscoped selectors

```css
/* WRONG — will bleed into other pages */
.card { background: white; }
.button { color: purple; }
@keyframes fadeIn { }
```
Always scope: `.page-name .card { }`. Always prefix keyframes: `@keyframes pageNameFadeIn { }`.

### Wrong: Missing `font-family: inherit` on buttons

```css
/* WRONG — browser default font on buttons */
.my-button {
  background: purple;
  color: white;
}
```
Buttons inherit the browser's default font unless you set `font-family: inherit`.

### Wrong: Flat colors for dark cards

```css
/* WRONG — no depth */
.hero { background: #5e17eb; }
```
Dark cards use a 3-stop gradient with glow orbs:
`linear-gradient(135deg, #5e17eb 0%, #7c3aed 50%, #4c1d95 100%)` + `::before` and `::after` radial gradients.

### Wrong: Missing loading/empty/error states

```jsx
/* WRONG — jumps straight to content */
export default function MyPage() {
  const [data, setData] = useState([])
  return <div>{data.map(...)}</div>
}
```
Every page needs: loading spinner, empty state with CTA, and error handling. See starter template above.

### Wrong: Hard-coded padding-top without toolbar

```css
/* WRONG — content hidden behind toolbar */
.page { padding-top: 20px; }
```
If the page has a fixed toolbar, `padding-top` must be at least `72-80px`.

### Wrong: No `position: relative; z-index: 1` in dark cards

```jsx
/* WRONG — text hidden behind glow orbs */
<div className="hero-card">
  <h2>This text disappears behind ::before pseudo-element</h2>
</div>
```
All content inside dark hero cards needs `position: relative; z-index: 1` to render above the glow pseudo-elements.

---

## 6. SCOPING RULES (Quick Reference)

Full details in `docs/CSS_CONVENTIONS.md` and `docs/CSS-SCOPING-GUIDELINES.md`.

1. Root wrapper: `<div className="page-name">` in JSX, `.page-name { }` in CSS
2. All selectors scoped: `.page-name .child { }`, never `.child { }`
3. Keyframes prefixed: `@keyframes pageNameFadeIn { }`, never `@keyframes fadeIn { }`
4. Buttons always get `font-family: inherit`
5. No generic class names unscoped (`.card`, `.button`, `.header`, `.modal`, `.content`)

---

## 7. CHECKLISTS

### New Page

- [ ] Created `PageName.jsx` + `PageName.css`
- [ ] Root wrapper `<div className="page-name">` in JSX
- [ ] CSS variables declared at `.page-name` level
- [ ] Gradient background wash (not flat white)
- [ ] `min-height: 100vh` + correct padding (top for toolbar, bottom for nav)
- [ ] Loading state with spinner
- [ ] Empty state with icon + title + text + CTA
- [ ] All headings `font-weight: 800+`
- [ ] Section eyebrows: `11px / 800 / uppercase / 1.5px`
- [ ] All buttons have `font-family: inherit`
- [ ] All `@keyframes` prefixed with page name
- [ ] `@media (prefers-reduced-motion: reduce)` block
- [ ] All selectors scoped to root class
- [ ] Content in dark cards has `position: relative; z-index: 1`
- [ ] Responsive: `@media (min-width: 768px)` + `@media (max-width: 480px)` if needed

### New Component

- [ ] Pick unique 2-4 letter prefix, add to `docs/CSS_CONVENTIONS.md` registry
- [ ] All CSS uses prefix: `.xx-element { }`
- [ ] `@keyframes xxAnimation { }`
- [ ] Props for all dynamic data (no hardcoded text)
- [ ] Uses parent's CSS variables (`var(--brand-purple)`, etc.)
- [ ] Follows token tables (radius, shadows, typography)
- [ ] `font-family: inherit` on buttons
- [ ] Hover/active states on interactive elements
