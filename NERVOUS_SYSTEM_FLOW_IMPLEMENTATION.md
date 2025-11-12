# Nervous System Safety Boundaries Flow - Implementation Guide

## 🎉 What Was Built (UPDATED: Safety Contract Approach + AI)

I've created a complete **Nervous System Safety Boundaries** chat flow using the **safety contract approach** - testing fears directly instead of empowering beliefs, which produces more accurate sway test results.

**NEW: AI-powered pattern mirroring** for deeply personalized reflections (with fallback to conditional logic).

---

## 📁 Files Created

### 1. **Flow Definition**
- **File:** `/public/nervous-system-safety-flow.json`
- **Contains:** 17-step flow covering all 6 stages
- **Structure:** Follows the same JSON format as healing compass and lead magnet flows

### 2. **Safety Contract Library** ⭐ NEW APPROACH
- **File:** `/src/data/nervousSystemBeliefs.js`
- **Contains:**
  - 80 safety contract statements (fear tests) organized by 8 wound types
  - Conditional logic system (`selectSafetyContracts()` function)
  - Smart selection based on user context
- **Wound Types:**
  - Visibility Wound (10 contracts) - "If I'm visible, I'll be judged"
  - Belonging Wound (10 contracts) - "If I succeed, I'll lose connection"
  - Stability/Control Wound (10 contracts) - "If I expand, I'll lose control"
  - Worthiness Wound (10 contracts) - "If I receive abundance, I'll owe something"
  - Safety Wound (10 contracts) - "If I step into power, I'll be unsafe"
  - Impact/Responsibility Wound (10 contracts) - "If I impact many, I'll let them down"
  - Abundance/Money Wound (10 contracts) - "If I have money, I'll lose who I am"
  - Perfection/Failure Wound (10 contracts) - "If I'm not perfect, I'm worthless"

**Why this works better:** Testing the actual fear produces more accurate sway results than testing positive beliefs. The subconscious responds more honestly to "If I'm visible, I'll be judged" than "It's safe to be visible."

### 3. **Template Functions** ⭐ UPDATED
- **File:** `/src/lib/templates/nervousSystemTemplates.js`
- **Contains:**
  - `generateBeliefTests()` - Dynamically selects 5-7 personalized safety contracts
  - `mirrorPattern()` - **AI-powered** personalized reflection (with fallback)
  - `generateFallbackMirror()` - Conditional logic backup if AI unavailable
  - Helper functions for pattern/fear/archetype identification

### 4. **AI Helper** ⭐ NEW
- **File:** `/src/lib/aiHelper.js`
- **Contains:**
  - `generateAIPatternMirror()` - OpenAI API integration for pattern recognition
  - Deeply personalized, accurate reflections based on all user data
  - Fallback to conditional logic if API key not configured
  - Uses GPT-4o for best results

### 5. **Updated PromptResolver**
- **File:** `/src/lib/promptResolver.js` (updated)
- **Added support for new macros:**
  - `{{GENERATE_BELIEF_TESTS}}` - Triggers safety contract selection
  - `{{MIRROR_PATTERN}}` - Triggers AI-powered pattern reflection

### 6. **Environment Configuration** ⭐ NEW
- **File:** `.env.example` (updated)
- **Added:** `VITE_OPENAI_API_KEY` configuration
- Optional - flow works without it using fallback logic

---

## 🔄 Flow Structure

### **Stage 1: Introduction (Steps 1-2)**
- Introduces the Sway Test concept
- Explains the science (conscious vs. subconscious processing)
- Calibration instructions with video link

### **Stage 2: Calibration (Step 2)**
- User calibrates their YES and NO sway responses
- Waits for confirmation before proceeding

### **Stage 3: Vision Clarification (Steps 3-6)**
Four questions to establish baseline:
1. Impact goal (100k+, 10k+, 1k+ people)
2. Income goal ($1M+, $500k+, $100k+)
3. Positive change they create (open text)
4. Current struggle area (open text)

### **Stage 4: Triage - Map Safety Edges (Steps 7-12)**
Five statements to sway test:
1. "I feel safe being seen by [X] people"
2. "I feel safe earning over $[X]/year"
3. "I believe I am safe to pursue this ambition"
4. "What I'm struggling with, I am also subconsciously self-sabotaging"
5. "Part of me feels unsafe with the vision of my ambitions"

### **Stage 5: Safety Contract Testing (Steps 13-14)** ⭐ UPDATED
- Dynamically generates 5-7 personalized **fear contracts** (not empowering beliefs)
- Examples: "If I'm visible, I'll be judged", "If I succeed, I'll lose connection"
- Based on conditional logic from triage results
- User tests each and shares reflections
- **Why contracts work better:** Direct fear testing produces more accurate sway results

### **Stage 6: Mirror Back Pattern (Steps 15-17)** ⭐ AI-POWERED
- **Uses OpenAI API** to generate deeply personalized reflection
- Reflects safety zones vs. contraction zones
- Names the protective pattern
- Identifies underlying fear
- Suggests belief archetype (e.g., "The Invisible Achiever", "The Selfless Healer")
- Explains what needs to be rewired
- Asks for consent to shift
- **Falls back to conditional logic** if API key not configured

---

## 🧠 Conditional Logic - How Safety Contract Selection Works

The `selectSafetyContracts()` function uses **8 rules** to choose the most relevant fear contracts:

### Rule 1: Visibility Contraction
If user tested NO to "safe being seen":
- "If I'm fully visible, I'll be judged"
- "If I show up authentically, I'll be rejected"

### Rule 2: Money/Abundance Contraction
If user tested NO to "safe earning":
- "If I have money, I'll lose who I am"
- If high income goal ($1M+, $500k+): "If I receive abundance, I'll owe something I can't repay"

### Rule 3: General Safety Contraction
If user tested NO to "safe pursuing" OR YES to "feels unsafe":
- "If I pursue this ambition, I'll sacrifice my peace"

### Rule 4: Self-Sabotage Pattern (Stability Wound)
If user tested YES to "self-sabotaging":
- "If I expand, I'll lose control"

### Rule 5: High Impact = Responsibility Wound
If impact goal is 100k+ people:
- "If I impact many people, I'll be responsible for their outcomes"

### Rule 6: Struggle Area Keywords (NLP)
Scans user's struggle text for keywords:
- **"visible", "seen", "show up", "market", "post", "social media"** → Visibility wound contracts
- **"money", "pricing", "charge", "income", "earn"** → Abundance wound contracts
- **"pressure", "burnout", "exhaust", "overwhelm", "stress"** → Stability wound contracts
- **"belong", "relation", "connection", "isolat", "alone", "people"** → Belonging wound contracts
- **"control", "trust", "uncertain", "chaos"** → Stability wound contracts
- **"perfect", "fail", "mistake", "good enough", "inadequate"** → Perfection wound contracts
- **"lead", "responsib", "depend", "let people down"** → Impact wound contracts

### Rule 7: Fill to Minimum 5 Contracts
If fewer than 5 contracts selected, add universal contracts:
- "If I succeed, I'll be exposed as a fraud"
- "If I outgrow my current life, I'll be alone"
- "If I step into my power, I'll be unsafe"
- "If I grow too fast, I'll lose myself"
- "If I fail, I'll prove I was never good enough"

### Rule 8: Cap at 7 Maximum
Never show more than 7 contracts to avoid overwhelm.

---

## 🎨 Pattern Recognition - Archetypes Identified

Based on responses, the flow can identify these archetypes:

| Archetype | Trigger Conditions |
|-----------|-------------------|
| **The Good Soldier** | Self-sabotage + pressure/prove in struggle |
| **The Selfless Healer** | Money block + helping/healing in struggle |
| **The Hidden Perfectionist** | Visibility block + perfectionism in struggle |
| **The Invisible Achiever** | Visibility block + judgment/criticism in struggle |
| **The Strategic Controller** | Trust/control keywords in struggle |

If no specific archetype matches, the mirror reflects the general protective pattern without naming an archetype.

---

## 🤖 AI Setup (Optional but Recommended)

The flow works without AI using conditional logic fallback, but AI provides significantly more accurate pattern reflections.

### Setup OpenAI API:

1. **Get API Key:**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Copy it

2. **Add to `.env.local`:**
   ```bash
   VITE_OPENAI_API_KEY=sk-proj-...your-key-here
   ```

3. **Test it:**
   - Run the flow
   - If API key is valid, you'll get AI-powered reflections
   - If not configured, fallback logic activates automatically

**Cost:** ~$0.01-0.02 per user (GPT-4o pricing)

---

## 🔌 Integration Steps

To add this flow to your app, follow these steps:

### 1. **Create a New Route**

In `/src/AppRouter.jsx`, add a route:

```jsx
import NervousSystemFlow from './NervousSystemFlow';

// Add to your routes:
<Route path="/nervous-system" element={<NervousSystemFlow />} />
```

### 2. **Create the Flow Component**

Create `/src/NervousSystemFlow.jsx` (similar to `HealingCompass.jsx`):

```jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { resolvePrompt } from './lib/promptResolver';
import flowData from '../public/nervous-system-safety-flow.json';
import './HealingCompass.css'; // Reuse existing styles

function NervousSystemFlow() {
  const [steps, setSteps] = useState(flowData.steps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [context, setContext] = useState({});
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');

  // Load user_name from profile if authenticated
  useEffect(() => {
    async function loadUserName() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data: profile } = await supabase
          .from('lead_flow_profiles')
          .select('user_name')
          .eq('email', user.email)
          .single();

        if (profile?.user_name) {
          setContext(prev => ({ ...prev, user_name: profile.user_name }));
        }
      }
    }
    loadUserName();
  }, []);

  // Render first message
  useEffect(() => {
    if (steps.length > 0 && context.user_name) {
      const firstStep = steps[0];
      const resolvedPrompt = resolvePrompt(firstStep, context);
      setMessages([{ role: 'assistant', content: resolvedPrompt, step: firstStep }]);
    }
  }, [context.user_name]);

  const handleUserResponse = (value) => {
    const currentStep = steps[currentStepIndex];

    // Store response in context
    const newContext = {
      ...context,
      [currentStep.tag_as]: value,
      [currentStep.store_as]: true
    };
    setContext(newContext);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: value }]);

    // Move to next step
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      const nextStep = steps[nextIndex];
      const resolvedPrompt = resolvePrompt(nextStep, newContext);
      setMessages(prev => [...prev, { role: 'assistant', content: resolvedPrompt, step: nextStep }]);
      setCurrentStepIndex(nextIndex);
    } else {
      // Flow complete - save to database
      saveToDatabase(newContext);
    }

    setUserInput('');
  };

  const saveToDatabase = async (finalContext) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('nervous_system_responses').insert({
      user_id: user.id,
      user_name: finalContext.user_name,
      impact_goal: finalContext.impact_goal,
      income_goal: finalContext.income_goal,
      positive_change: finalContext.positive_change,
      struggle_area: finalContext.struggle_area,
      triage_results: {
        safe_being_seen: finalContext.triage_safe_being_seen,
        safe_earning: finalContext.triage_safe_earning,
        safe_pursuing: finalContext.triage_safe_pursuing,
        self_sabotage: finalContext.triage_self_sabotage,
        feels_unsafe: finalContext.triage_feels_unsafe
      },
      belief_test_results: finalContext.belief_test_results,
      shift_consent: finalContext.shift_consent,
      context: finalContext
    });
  };

  const renderInput = () => {
    const currentStep = steps[currentStepIndex];

    if (currentStep?.options) {
      // Render buttons
      return (
        <div className="button-group">
          {currentStep.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleUserResponse(option.value)}
              className="flow-button"
            >
              {option.label}
            </button>
          ))}
        </div>
      );
    }

    // Render text input
    return (
      <div className="input-group">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleUserResponse(userInput)}
          placeholder="Type your answer..."
        />
        <button onClick={() => handleUserResponse(userInput)}>Send</button>
      </div>
    );
  };

  return (
    <div className="healing-compass-container">
      <div className="messages-container">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
      </div>
      {renderInput()}
    </div>
  );
}

export default NervousSystemFlow;
```

### 3. **Create Database Table**

Run this SQL in Supabase:

```sql
CREATE TABLE nervous_system_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  impact_goal TEXT,
  income_goal TEXT,
  positive_change TEXT,
  struggle_area TEXT,
  triage_results JSONB,
  belief_test_results JSONB,
  shift_consent TEXT,
  context JSONB
);

-- Enable RLS
ALTER TABLE nervous_system_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own responses"
  ON nervous_system_responses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert own responses"
  ON nervous_system_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 4. **Add Navigation Link**

Add a link to the new flow in your navigation/profile page:

```jsx
<Link to="/nervous-system">Map Your Safety Boundaries</Link>
```

---

## 🧪 Testing Checklist

- [ ] Flow loads and displays Stage 1 intro
- [ ] Calibration step accepts user confirmation
- [ ] Vision questions (1-4) collect responses
- [ ] Triage tests (1-5) display user's specific goals
- [ ] Belief tests generate dynamically (5-7 statements)
- [ ] Pattern mirror reflects accurate safety zones
- [ ] Pattern mirror identifies correct fears/patterns
- [ ] Final consent saves to database
- [ ] All context variables resolve correctly

---

## 📊 Example User Journey

**User Context:**
- Impact: 100,000+ people
- Income: $1,000,000+
- Struggle: "I'm scared to show up on social media"
- Triage: NO to visibility, NO to income, YES to self-sabotage

**Generated Beliefs (7):**
1. "It's safe for me to be seen in my full power." *(visibility)*
2. "Being visible doesn't mean I'll be rejected." *(visibility)*
3. "I'm safe to impact many people." *(impact)*
4. "Having money makes me more of who I am, not less." *(abundance)*
5. "I can be wealthy and still be deeply connected." *(abundance)*
6. "What I bring is already enough." *(worthiness - high income)*
7. "It's safe to take action toward my vision." *(self-sabotage)*

**Pattern Mirror:**
- **Safety zones:** (none identified)
- **Contraction zones:** Visibility at 100k+ scale, receiving $1M+/year
- **Pattern:** System learned visibility = unsafe, rooted in early criticism
- **Fear:** Judgment, rejection, not being accepted
- **Archetype:** The Invisible Achiever
- **Needs rewiring:** Association between visibility and danger

---

## 🎯 Next Steps

1. **Test the flow** - Run through it manually to ensure all steps work
2. **Refine belief selection** - Adjust conditional logic based on real user data
3. **Add archetype descriptions** - Create detailed profiles for each archetype
4. **Create follow-up flow** - Build the "shift" process for users who opt in
5. **Analytics** - Track which beliefs most commonly test as "NO"

---

## 💡 Pro Tips

### Customization Ideas:
- Add more belief statements to the library over time
- Create sub-flows for specific archetypes
- Build a dashboard showing user's safety map visually
- Send personalized email sequences based on archetype
- Create archetype-specific resources/programs

### Performance:
- The belief selection logic runs client-side (no API calls needed)
- Pattern mirroring is instant (no delays)
- All conditional logic is deterministic and testable

### Expansion:
- This system can be adapted for other areas:
  - Relationship safety boundaries
  - Health/body safety boundaries
  - Creative expression boundaries

---

## 📚 Technical Details

### Belief Library Stats:
- **Total beliefs:** 72
- **Themes:** 10
- **Average per theme:** 7-8 beliefs
- **Selection logic:** 7 conditional rules
- **Output range:** 5-7 beliefs per user

### Flow Stats:
- **Total steps:** 17
- **User inputs:** 12
- **Multiple choice:** 8 steps
- **Open text:** 4 steps
- **Dynamic content:** 2 macros

---

**Questions or issues?** Check the existing `HealingCompass.jsx` component for reference patterns, or review the flow JSON structure in the other flow files.

---

*Built with 🧠 somatic intelligence and ⚡ conditional logic*
