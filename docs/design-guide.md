# FindMyFlow & Retreats Design Guide

A comprehensive design system for building on-brand pages for findmyflow.nichuzz.com and retreats.nichuzz.com.

---

## Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Purple (Primary)** | `#5e17eb` | Primary brand, CTAs, headers, links |
| **Purple Light** | `#7c3aed` | Gradients, hover states |
| **Purple Dark** | `#4a0ea8` | Deep gradients |
| **Gold (Accent)** | `#ffdd27` | Highlights, badges, progress, secondary CTAs |
| **Gold Dark** | `#f59e0b` / `#d97706` | Gold gradients |
| **White** | `#ffffff` | Backgrounds, text on dark |
| **Warm Gray** | `#f8f9fa` | Section backgrounds |
| **Soft Gray** | `#e9ecef` | Borders, dividers |
| **Text Gray** | `#495057` | Body text |
| **Border Gray** | `#dee2e6` | Subtle borders |
| **Dark** | `#212529` | Headings, footer |

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif;
```

### Sizes
| Element | Size | Weight |
|---------|------|--------|
| Hero Title | 4rem (64px) | 800 |
| Section Title | 2.5rem (40px) | 800 |
| Card Title | 1.5rem (24px) | 700 |
| Body Large | 1.25rem (20px) | 400-500 |
| Body | 1rem (16px) | 400 |
| Small/Caption | 0.875rem (14px) | 500-600 |

### Line Heights
- Headings: 1.1-1.2
- Body text: 1.6-1.8

---

## Gradients

### Purple Gradient (Primary)
```css
background: linear-gradient(135deg, #5e17eb 0%, #7c3aed 100%);
```

### Deep Purple (Full-screen backgrounds)
```css
background: linear-gradient(135deg, #4a0ea8 0%, #5e17eb 50%, #7c3aed 100%);
```

### Gold Gradient (CTAs)
```css
background: linear-gradient(135deg, #ffdd27 0%, #ffc107 100%);
```

### Gold Text Gradient
```css
background: linear-gradient(135deg, #ffdd27, #f59e0b, #d97706);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

---

## Shadows

### Card Shadow
```css
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
```

### Card Shadow Hover
```css
box-shadow: 0 8px 24px rgba(94, 23, 235, 0.15);
```

### Button Shadow
```css
box-shadow: 0 4px 12px rgba(94, 23, 235, 0.3);
```

### Button Shadow Hover
```css
box-shadow: 0 6px 20px rgba(94, 23, 235, 0.4);
```

### Gold Button Shadow
```css
box-shadow: 0 8px 24px rgba(255, 221, 39, 0.4);
```

---

## Border Radius

| Element | Radius |
|---------|--------|
| Buttons | 12px - 16px |
| Cards | 16px - 24px |
| Inputs | 12px - 16px |
| Pills/Badges | 100px (full round) |
| Avatars | 50% |

---

## Buttons

### Primary (Purple)
```css
.btn-primary {
  background: linear-gradient(135deg, #5e17eb 0%, #7c3aed 100%);
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(94, 23, 235, 0.3);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(94, 23, 235, 0.4);
}
```

### Secondary (Gold - for main CTAs on landing pages)
```css
.btn-gold {
  background: linear-gradient(135deg, #ffdd27 0%, #ffc107 100%);
  color: #212529;
  padding: 1.25rem 3rem;
  border-radius: 16px;
  border: none;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(255, 221, 39, 0.4);
  transition: all 0.3s ease;
}

.btn-gold:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(255, 221, 39, 0.5);
}
```

### Ghost (on dark backgrounds)
```css
.btn-ghost {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 12px;
  padding: 1rem 2rem;
  transition: all 0.3s ease;
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(147, 51, 234, 0.5);
}
```

---

## Cards

```css
.card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid #e9ecef;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(94, 23, 235, 0.12);
  border-color: #5e17eb;
}
```

---

## Section Patterns

### Light Section
```css
.section-light {
  background: #f8f9fa;
  padding: 6rem 0;
}
```

### White Section
```css
.section-white {
  background: white;
  padding: 6rem 0;
}
```

### Purple Section (CTAs, Heroes)
```css
.section-purple {
  background: linear-gradient(135deg, #5e17eb 0%, #7c3aed 100%);
  color: white;
  padding: 6rem 0;
}
```

### Full-screen Flow (Assessment pages)
```css
.full-screen-flow {
  min-height: 100vh;
  background: linear-gradient(135deg, #4a0ea8 0%, #5e17eb 50%, #7c3aed 100%);
  color: white;
  padding: 80px 20px 20px;
}
```

---

## Badges & Tags

### Gold Badge
```css
.badge-gold {
  background: rgba(255, 221, 39, 0.2);
  color: #ffdd27;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border: 1px solid rgba(255, 221, 39, 0.4);
}
```

---

## Inputs

### On Dark Backgrounds
```css
.input-dark {
  width: 100%;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 16px;
  transition: all 0.2s ease;
}

.input-dark:focus {
  border-color: #5e17eb;
  background: rgba(255, 255, 255, 0.08);
}

.input-dark::placeholder {
  color: rgba(255, 255, 255, 0.4);
}
```

### On Light Backgrounds
```css
.input-light {
  width: 100%;
  padding: 16px 20px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  color: #495057;
  font-size: 16px;
  transition: all 0.2s ease;
}

.input-light:focus {
  border-color: #5e17eb;
  background: white;
  box-shadow: 0 0 0 4px rgba(94, 23, 235, 0.1);
}
```

---

## Animations

### Fade In Up
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease;
}
```

### Scale In
```css
@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Transitions
Always use: `transition: all 0.3s ease;`

### Hover Lifts
- Subtle: `transform: translateY(-2px)`
- Medium: `transform: translateY(-4px)`
- Strong: `transform: translateY(-6px)`

---

## Responsive Breakpoints

```css
/* Tablet */
@media (max-width: 1024px) { }

/* Mobile landscape */
@media (max-width: 768px) { }

/* Mobile portrait */
@media (max-width: 480px) { }
```

### Container
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

@media (max-width: 768px) {
  .container {
    padding: 0 1.5rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 1rem;
  }
}
```

---

## CSS Variables (Quick Copy)

```css
:root {
  /* Colors */
  --purple: #5e17eb;
  --purple-light: #7c3aed;
  --purple-dark: #4a0ea8;
  --gold: #ffdd27;
  --gold-dark: #f59e0b;
  --white: #ffffff;
  --warm-gray: #f8f9fa;
  --soft-gray: #e9ecef;
  --text-gray: #495057;
  --border-gray: #dee2e6;
  --dark: #212529;

  /* Shadows */
  --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-card-hover: 0 16px 40px rgba(94, 23, 235, 0.12);
  --shadow-button: 0 4px 12px rgba(94, 23, 235, 0.3);
  --shadow-button-hover: 0 6px 20px rgba(94, 23, 235, 0.4);
  --shadow-gold: 0 8px 24px rgba(255, 221, 39, 0.4);

  /* Border Radius */
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-xl: 24px;
  --radius-full: 100px;

  /* Spacing */
  --section-padding: 6rem;
  --section-padding-mobile: 4rem;
  --card-padding: 2rem;
}
```

---

## Component Examples

### Hero Section
```html
<section class="section-purple" style="min-height: 90vh; display: flex; align-items: center;">
  <div class="container" style="text-align: center;">
    <span class="badge-gold">Your Tagline</span>
    <h1 style="font-size: 4rem; font-weight: 800; margin: 1.5rem 0;">
      Main Headline Here
    </h1>
    <p style="font-size: 1.5rem; opacity: 0.95; margin-bottom: 2.5rem;">
      Supporting text that explains the value proposition
    </p>
    <button class="btn-gold">Get Started</button>
  </div>
</section>
```

### Feature Card Grid
```html
<section class="section-light">
  <div class="container">
    <h2 style="font-size: 2.5rem; font-weight: 800; text-align: center; color: #212529;">
      Section Title
    </h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 3rem;">
      <div class="card">
        <h3 style="font-size: 1.5rem; font-weight: 700; color: #212529;">Card Title</h3>
        <p style="color: #495057; line-height: 1.7;">Card description text goes here.</p>
      </div>
      <!-- More cards... -->
    </div>
  </div>
</section>
```

---

## Brand Voice Notes

- Clean, modern, approachable
- Professional but not corporate
- Empowering and supportive
- Focus on transformation and clarity
- Use of metaphors around "flow", "compass", "journey"
