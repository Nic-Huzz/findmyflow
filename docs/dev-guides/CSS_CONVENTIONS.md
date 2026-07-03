# CSS Naming Conventions

## The Rule: Always Prefix Component Classes

Every CSS class must be prefixed with a 2-4 letter component abbreviation.

```css
/* BAD - Generic names that leak */
.header { }
.button { }
.card { }
.modal { }
.content { }

/* GOOD - Prefixed and scoped */
.cg-header { }      /* Content Generator */
.vt-button { }      /* Voice Training */
.lsb-card { }       /* Lead Score Badge */
.sm-modal { }       /* Scripts Modal */
```

## Prefix Registry

| Prefix | Component | File |
|--------|-----------|------|
| `vt-` | Voice Training | VoiceTraining.css |
| `cg-` | Content Generator | ContentGenerator.css |
| `crm-` | CRM Dashboard | CRMDashboard.css |
| `lsb-` | Lead Score Badge | LeadScoreBadge.css |
| `lss-` | Lead Score Sliders | LeadScoreSliders.css |
| `sm-` | Scripts Modal | ScriptsModal.css |
| `su-` | Screenshot Upload | ScreenshotUpload.css |
| `gm-` | Graduation Modal | GraduationModal.css |
| `fi-` | Flow Insights | FlowInsights.css |
| `np-` | Notification Prompt | NotificationPrompt.css |
| `wdf-` | Wahoo Discovery Flow | WahooDiscoveryFlow.css |
| `wi-` | Wahoo Inspiration | WahooInspiration.css |
| `wr-` | Weekly Review | WeeklyReview.css |

## Rules

### 1. New Components
When creating a new component:
1. Pick a unique 2-4 letter prefix
2. Add it to the registry above
3. Prefix ALL classes in that component's CSS

```css
/* NewFeature.css */
.nf-container { }
.nf-header { }
.nf-content { }
.nf-button { }
.nf-button.primary { }  /* Modifiers are OK */
```

### 2. Nested/Child Classes
Even child elements get the prefix:

```css
/* BAD */
.vt-card .header { }
.vt-card .icon { }

/* GOOD */
.vt-card .vt-card-header { }
.vt-card .vt-card-icon { }
```

### 3. Keyframe Animations
Prefix animations too:

```css
/* BAD */
@keyframes fadeIn { }
@keyframes slideUp { }

/* GOOD */
@keyframes vt-fadeIn { }
@keyframes cg-slideUp { }
```

### 4. CSS Variables (Optional)
For component-specific variables:

```css
.vt-container {
  --vt-primary: #5e17eb;
  --vt-spacing: 16px;
}
```

## Quick Checklist Before PR

- [ ] All classes prefixed with component abbreviation
- [ ] Prefix added to registry if new component
- [ ] No generic names (header, button, card, modal, icon, text, content)
- [ ] Keyframe animations prefixed
- [ ] Child elements prefixed (not just parent)

## Why This Matters

Generic class names cause:
- Styles bleeding between components
- Hard-to-debug visual bugs
- Conflicts when components are used together
- Unpredictable behavior in modals/overlays

With prefixes:
- Styles are completely isolated
- Easy to find all styles for a component (search `vt-`)
- No conflicts even when nesting components
- Clear ownership of every style rule
