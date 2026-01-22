# FindMyFlow Brand Voice Guide

## The Voice: Playful Warmth

**"A supportive friend who celebrates your wins enthusiastically."**

The app speaks like a warm mentor who genuinely cares about your journey, uses casual language to feel approachable, and gets visibly excited when you make progress.

---

## Core Principles

### 1. Warm Foundation
The default state is supportive, understanding, and inviting. We acknowledge where users are and meet them there.

### 2. Playful Peaks
Energy spikes on achievements and completions. This is where we celebrate, use more emojis, and let the UI bounce with delight.

### 3. Grounded Support
When things go wrong, we stay calm, honest, and helpful. No forced positivity or deflection.

---

## Voice Characteristics

| Attribute | Description | Example |
|-----------|-------------|---------|
| **Perspective** | "We" (team/guide) - creates partnership | "We'll help you get there" |
| **Energy** | Warm baseline, spikes on wins | "Ready to make some magic happen?" |
| **Formality** | Conversational, not corporate | "Let's do this" not "Proceed to next step" |
| **Metaphors** | Flow, journey, awakening, portal, essence, magic | "Find your flow", "Your journey continues" |
| **Punctuation** | Exclamation marks for celebrations, periods elsewhere | "You did it!" vs "Something went wrong." |
| **Questions** | Inviting, not interrogating | "How's your flow right now?" |

---

## Tone by Context

### Onboarding & Welcome (Warm)
Inviting, reassuring, sets the stage for the journey ahead.

```
"Welcome, Nic!"
"Let's get you set up"
"Your answers will ensure we provide the best support for where you're at."
```

### Celebrations & Completions (Playful)
Energy peaks here. Short, punchy copy. Emojis welcome.

```
"You did it! That took courage"
"Your journey is mapped!"
"Quest completed! +50 points!"
```

### Encouragement & Motivation (Warm + Energy)
Supportive with forward momentum.

```
"Ready to make some magic happen?"
"Let's find your flow!"
"You now have everything you need to start your journey!"
```

### Errors & Setbacks (Grounded)
No emojis. Honest, helpful, focused on resolution.

```
"Something went wrong. We're sorry for the inconvenience."
"Failed to load. Please refresh."
```

### Loading & Processing (Neutral to Warm)
Brief, can add light personality.

```
"Loading..." or "Getting things ready..."
"Saving your progress..."
```

---

## Emoji Guidelines

| Context | Use Emojis? | Examples |
|---------|-------------|----------|
| **Section headers** | Yes - sets tone | "Ready to Find Your Flow?" |
| **Wayfinding/tabs** | Yes - visual anchors | Groans, Healing, Tracker |
| **Celebrations** | Yes - amplify delight | "Your journey is mapped!" |
| **Encouragement** | Yes - adds warmth | "Let's find your flow!" |
| **Errors/setbacks** | No - stay grounded | "Something went wrong." |
| **Form labels** | No - keep clean | "Email", "Password" |
| **Body copy** | Sparingly | Only for emphasis, typically at end of sentence |

### Emoji Palette
These emojis align with the brand:
- **Energy/Action**: fire, rocket, target, lightning
- **Achievement**: party, trophy, star, sparkles, muscle
- **Journey/Flow**: ocean wave, compass, sunrise
- **Emotion**: heart, purple heart, hugging face
- **Categories**: grimacing (Groans), purple heart (Healing), briefcase (Business)

---

## Copy Patterns

### The "Let's" Pattern
Creates partnership and shared momentum.
```
"Let's get you set up"
"Let's find your flow"
"Let's do this"
```

### The Acknowledgment Pattern
Validates where users are before moving forward.
```
"You know there's something more—you've felt it."
"That took courage"
"We're glad you're here"
```

### The Question Invite
Uses questions to engage, not demand.
```
"How's your flow right now?"
"Ready to begin?"
"Where are you on your journey?"
```

### The Narrative Arc (Onboarding)
Tells a story that resonates with the user's experience.
```
"You got the job. Made some money. Experienced the ladder.
But somewhere along the way, you realised: This isn't it.
You had your awakening... Now what?"
```

---

## Animation & Motion (Playful Warmth)

The visual motion reinforces the voice:

| State | Motion Style | CSS Easing |
|-------|--------------|------------|
| **Resting elements** | Gentle breathing, subtle pulse | `ease-in-out` |
| **Interactions** | Spring bounce, satisfying feedback | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| **Completions** | Pop, confetti, celebration | Spring with overshoot |
| **Errors** | Subtle shake or none | Standard ease |

### Key Animation Patterns
- **Badge/accent glow**: Subtle pulse every 3s
- **Gold text**: Gentle shimmer (4s loop)
- **Buttons**: Spring bounce on hover, scale down on press
- **Cards**: Lift with spring easing on hover
- **Icons**: Float/bob when parent is hovered
- **Toasts**: Slide in with spring

---

## Words to Use

| Instead of... | Use... |
|---------------|--------|
| Submit | Let's Go / Continue |
| Error | Something went wrong |
| Invalid | Please check |
| Required | Needed |
| Settings | Preferences |
| Tutorial | Quick tour |
| Features | What you can do |
| Logout | Sign out |

---

## Words to Avoid

- Corporate jargon: "leverage", "synergy", "optimize"
- Passive voice when active works: "was completed" → "you completed"
- Negative framing: "Don't forget" → "Remember"
- Pressure language: "You must", "Required immediately"
- Generic praise: "Great job!" (prefer specific acknowledgment)

---

## Brand Taglines & Phrases

These capture the Playful Warmth voice:

- "The anti-university for your career reinvention"
- "Turn what you know into work that lights you up"
- "Learning that feels like play, not homework"
- "Find your flow"
- "A supportive friend who celebrates your wins enthusiastically"

---

## Checklist for New Copy

When writing new copy, check:

- [ ] Does it sound like a supportive friend?
- [ ] Is the energy level right for the context? (warm baseline, playful for wins)
- [ ] Are emojis used appropriately? (celebrations yes, errors no)
- [ ] Does it use "we/your" language?
- [ ] Is it conversational, not corporate?
- [ ] Does it acknowledge before directing?
- [ ] For celebrations: Is it short, punchy, and delightful?
- [ ] For errors: Is it calm, honest, and helpful?

---

## Related Resources

- [Design Guide](./design-guide.md) - Colors, typography, components
- [CSS Scoping Guidelines](./CSS-SCOPING-GUIDELINES.md) - CSS conventions
- `/brand-tone-demo` route - Interactive comparison of brand tones
