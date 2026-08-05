function $(p,i=""){var s,l,c,m,d,h,f,g,u,O;const{persona:n,offer:e,validation:a,voice:o,launch:r}=p,t=[];if(t.push(`Create high-converting landing page copy for a lead magnet opt-in page.

GOAL: Get visitors to enter their email in exchange for the lead magnet.`),(n!=null&&n.ideal_customer||e!=null&&e.niche_definition)&&t.push(`
TARGET AUDIENCE:
- Ideal Customer: ${(n==null?void 0:n.ideal_customer)||(e==null?void 0:e.niche_definition)||"Not specified"}
- Core Problem: ${(n==null?void 0:n.core_problem)||(e==null?void 0:e.problem_area)||"Not specified"}
${n!=null&&n.unique_approach?`- What makes this unique: ${n.unique_approach}`:""}`),(e!=null&&e.leadMagnet||((s=e==null?void 0:e.lead_magnet_ideas)==null?void 0:s.length)>0)&&t.push(`
LEAD MAGNET:
- Type: ${((l=e.leadMagnet)==null?void 0:l.type)||"Free resource"}
- Idea: ${((c=e.leadMagnet)==null?void 0:c.idea)||((m=e.lead_magnet_ideas)==null?void 0:m[0])||"Not specified"}`),((d=a==null?void 0:a.painPoints)==null?void 0:d.length)>0||((h=a==null?void 0:a.pain_points)==null?void 0:h.length)>0){const y=a.painPoints||a.pain_points||[];t.push(`
PAIN POINTS TO ADDRESS (from real customer research):
${y.slice(0,5).map(T=>`- "${T}"`).join(`
`)}`)}if(((f=a==null?void 0:a.dreamOutcomes)==null?void 0:f.length)>0||((g=a==null?void 0:a.desired_outcomes)==null?void 0:g.length)>0){const y=a.dreamOutcomes||a.desired_outcomes||[];t.push(`
DESIRED OUTCOMES (what they want):
${y.slice(0,5).map(T=>`- ${T}`).join(`
`)}`)}return(o!=null&&o.voice_summary||((u=o==null?void 0:o.signature_phrases)==null?void 0:u.length)>0)&&t.push(`
VOICE & TONE:
${o.voice_summary?`- Style: ${o.voice_summary}`:""}
${((O=o.signature_phrases)==null?void 0:O.length)>0?`- Signature phrases to incorporate: ${o.signature_phrases.slice(0,3).join(", ")}`:""}`),i&&t.push(`
ADDITIONAL CONTEXT:
${i}`),t.push(`
OUTPUT FORMAT:
Please create:
1. Headline (attention-grabbing, benefit-focused)
2. Subheadline (expands on the headline)
3. 3-5 bullet points (what they'll learn/get)
4. Call-to-action button text
5. Optional: Social proof element or urgency statement

Keep the copy conversational and focused on transformation, not features.`),t.join(`
`)}function E(p,i=""){var l,c,m,d,h,f,g;const{persona:n,offer:e,validation:a,voice:o,proof:r,launch:t}=p,s=[];if(s.push(`Create a high-converting sales page for my core offer.

GOAL: Convert warm leads into paying customers.`),e&&s.push(`
THE OFFER:
- Name: ${e.name||e.offer_name||"Core Offer"}
- Dream Outcome: ${e.dreamOutcome||e.dream_outcome||"Not specified"}
- Price: ${e.price||e.core_offer_price?`$${e.price||e.core_offer_price}`:"Not specified"}
${((l=e.bonuses)==null?void 0:l.length)>0?`- Bonuses included: ${e.bonuses.map(u=>u.name||u).join(", ")}`:""}
${(c=e.guarantee)!=null&&c.type?`- Guarantee: ${e.guarantee.type}${e.guarantee.details?` - ${e.guarantee.details}`:""}`:""}
${((d=(m=e.scarcity)==null?void 0:m.types)==null?void 0:d.length)>0?`- Urgency/Scarcity: ${e.scarcity.types.join(", ")}`:""}`),(n!=null&&n.ideal_customer||e!=null&&e.niche_definition)&&s.push(`
TARGET AUDIENCE:
- Who: ${(n==null?void 0:n.ideal_customer)||(e==null?void 0:e.niche_definition)||"Not specified"}
- Core Problem: ${(n==null?void 0:n.core_problem)||(e==null?void 0:e.problem_area)||"Not specified"}`),((h=a==null?void 0:a.painPoints)==null?void 0:h.length)>0||((f=a==null?void 0:a.pain_points)==null?void 0:f.length)>0){const u=a.painPoints||a.pain_points||[];s.push(`
PAIN POINTS (use their exact language):
${u.slice(0,7).map(O=>`- "${O}"`).join(`
`)}`)}if(((g=a==null?void 0:a.objections)==null?void 0:g.length)>0&&s.push(`
COMMON OBJECTIONS TO ADDRESS:
${a.objections.slice(0,5).map(u=>`- ${u}`).join(`
`)}`),r!=null&&r.stack||t!=null&&t.proof){const u=(r==null?void 0:r.stack)||(t==null?void 0:t.proof);s.push(`
PROOF ELEMENTS TO INCLUDE:
${u.testimonials?`- Testimonials: ${u.testimonials}`:""}
${u.caseStudies?`- Case studies: ${u.caseStudies}`:""}
${u.credentials?`- Credentials: ${u.credentials}`:""}
${u.mediaFeatures?`- Media features: ${u.mediaFeatures}`:""}`)}return(o!=null&&o.voice_summary||o!=null&&o.contrarian_takes)&&s.push(`
VOICE & POSITIONING:
${o.voice_summary?`- Tone: ${o.voice_summary}`:""}
${o.contrarian_takes?`- Unique angle: ${o.contrarian_takes}`:""}`),i&&s.push(`
ADDITIONAL CONTEXT:
${i}`),s.push(`
OUTPUT FORMAT:
Please create a complete sales page with:
1. Attention-grabbing headline
2. Opening hook (address the pain)
3. Story/journey section
4. Problem agitation
5. Solution introduction
6. Offer breakdown with features & benefits
7. Bonuses section (if applicable)
8. Social proof section
9. Objection handling
10. Guarantee section
11. Price presentation
12. Urgency/scarcity (if applicable)
13. Final CTA

Use emotional storytelling and focus on transformation over features.`),s.join(`
`)}function A(p,i=""){var s,l;const{persona:n,offer:e,validation:a,voice:o,proof:r}=p,t=[];if(t.push(`Create a 5-email nurture sequence to build trust and warm up leads.

GOAL: Build relationship, deliver value, position for future sale.
SEQUENCE LENGTH: 5 emails over 2 weeks`),n!=null&&n.ideal_customer&&t.push(`
AUDIENCE:
- Who: ${n.ideal_customer}
- Their main struggle: ${n.core_problem||"Finding the right solution"}`),e!=null&&e.leadMagnet&&t.push(`
ENTRY POINT:
They just downloaded: ${e.leadMagnet.idea||e.leadMagnet.type||"a free resource"}`),((s=a==null?void 0:a.painPoints)==null?void 0:s.length)>0||((l=a==null?void 0:a.pain_points)==null?void 0:l.length)>0){const c=a.painPoints||a.pain_points||[];t.push(`
PAIN POINTS TO REFERENCE:
${c.slice(0,5).map(m=>`- "${m}"`).join(`
`)}`)}return o!=null&&o.voice_summary&&t.push(`
VOICE:
Write in this tone: ${o.voice_summary}`),i&&t.push(`
ADDITIONAL CONTEXT:
${i}`),t.push(`
EMAIL STRUCTURE:
1. **Welcome Email** (Day 0): Deliver the lead magnet, set expectations, quick win
2. **Value Email #1** (Day 2): Share a key insight or story that addresses their pain
3. **Value Email #2** (Day 5): Teach something actionable, build credibility
4. **Connection Email** (Day 8): Personal story, build relatability
5. **Bridge Email** (Day 12): Soft mention of offer, invite to next step

OUTPUT FORMAT:
For each email, provide:
- Subject line (+ 2 alternatives)
- Preview text
- Full email body (200-400 words each)
- Call-to-action

Make emails conversational, valuable, and focused on building trust.`),t.join(`
`)}function N(p,i=""){var l,c,m,d,h,f;const{persona:n,offer:e,validation:a,voice:o,proof:r,launch:t}=p,s=[];return s.push(`Create a 7-email launch sequence to sell my offer.

GOAL: Convert warm leads into buyers during a launch window.
SEQUENCE: 7 emails over 5-7 days`),e&&s.push(`
THE OFFER:
- Name: ${e.name||e.offer_name||"Core Offer"}
- Outcome: ${e.dreamOutcome||e.dream_outcome||"Not specified"}
- Price: ${e.price||e.core_offer_price?`$${e.price||e.core_offer_price}`:"To be announced"}
${((l=e.bonuses)==null?void 0:l.length)>0?`- Bonuses: ${e.bonuses.map(g=>g.name||g).join(", ")}`:""}
${(c=e.guarantee)!=null&&c.type?`- Guarantee: ${e.guarantee.type}`:""}`),(((d=(m=e==null?void 0:e.scarcity)==null?void 0:m.types)==null?void 0:d.length)>0||t!=null&&t.approach)&&s.push(`
URGENCY ELEMENTS:
${(h=e==null?void 0:e.scarcity)!=null&&h.types?`- Scarcity: ${e.scarcity.types.join(", ")}`:""}
${t!=null&&t.approach?`- Launch approach: ${t.approach}`:""}`),((f=a==null?void 0:a.objections)==null?void 0:f.length)>0&&s.push(`
OBJECTIONS TO OVERCOME:
${a.objections.slice(0,5).map(g=>`- ${g}`).join(`
`)}`),(r!=null&&r.stack||t!=null&&t.proof)&&s.push(`
PROOF TO INCLUDE:
- Use testimonials and case studies throughout the sequence`),i&&s.push(`
ADDITIONAL CONTEXT:
${i}`),s.push(`
EMAIL STRUCTURE:
1. **Announcement** (Day 1): Build excitement, share what's coming
2. **Cart Open** (Day 1): The offer is live, full details, primary CTA
3. **Story/Why** (Day 2): Personal story, why you created this
4. **Social Proof** (Day 3): Testimonials, case studies, results
5. **Objection Buster** (Day 4): Address the #1 objection directly
6. **Last Chance** (Day 5): 24-hour warning, urgency
7. **Final Hours** (Day 5/6): Last call, doors closing

OUTPUT FORMAT:
For each email:
- Subject line (+ 2 alternatives)
- Preview text
- Full email body (250-500 words)
- PS line
- Call-to-action

Make emails urgent but genuine. Focus on transformation and FOMO.`),s.join(`
`)}function _(p,i=""){var t;const{persona:n,offer:e,voice:a,validation:o}=p,r=[];return r.push(`Create cold outreach scripts for reaching new prospects.

GOAL: Start conversations that lead to discovery calls or lead magnet downloads.
PLATFORM: ${i!=null&&i.includes("LinkedIn")?"LinkedIn":i!=null&&i.includes("Instagram")?"Instagram":"Multi-platform (LinkedIn, Instagram, Email)"}`),n!=null&&n.ideal_customer&&r.push(`
WHO I'M REACHING OUT TO:
- Profile: ${n.ideal_customer}
- Their likely problem: ${n.core_problem||"Not specified"}`),(e!=null&&e.dreamOutcome||e!=null&&e.dream_outcome)&&r.push(`
WHAT I HELP WITH:
- Outcome I provide: ${e.dreamOutcome||e.dream_outcome}
${(t=e==null?void 0:e.leadMagnet)!=null&&t.idea?`- Free resource to offer: ${e.leadMagnet.idea}`:""}`),a!=null&&a.voice_summary&&r.push(`
MY TONE:
${a.voice_summary}`),i&&r.push(`
ADDITIONAL CONTEXT:
${i}`),r.push(`
RULES (non-negotiable):
- Every email MUST be under 100 words
- NO links, NO open tracking, NO images
- End with founder name + "Founder" title (nothing else)
- Write like a human, not a marketer

STRUCTURE (every email follows this):
1. REASON — I saw [something specific about their business]. Shows you did homework.
2. VALUE PROP — One sentence on what you offer and why it fits them.
3. ASK — A soft, low-commitment ask. Never "book a call."

OUTPUT FORMAT:
Create 3 versions of a 2-email cold outreach sequence:

**Email 1 (Cold)**
- Subject line (short, no clickbait)
- Body: Reason → Value prop → Ask
- Sign off: [Name] / Founder

**Email 2 (Follow-up, Day 3)**
- Subject line (reply to Email 1)
- Body: Deliver on the ask from Email 1 (e.g., attach pricing sheet) + one qualification question (e.g., "Are you considering buying in the next 6 months?")
- Sign off: [Name] / Founder

Keep it conversational, specific, and under 100 words per email. The ask in Email 1 should be something easy to say yes to (e.g., "Can I send you the pricing sheet to open when the time is right?").`),r.join(`
`)}function S(p,i={},n=""){var m;const{persona:e,offer:a,voice:o}=p,{name:r,lastInteraction:t,status:s,notes:l}=i,c=[];return c.push(`Create a warm follow-up message for an engaged lead.

GOAL: Re-engage and move them toward the next step.`),c.push(`
CONTACT DETAILS:
- Name: ${r||"[Contact Name]"}
- Last interaction: ${t||"Recently engaged with content"}
- Status: ${s||"Interested but not yet converted"}
${l?`- Notes: ${l}`:""}`),(a!=null&&a.dreamOutcome||a!=null&&a.dream_outcome)&&c.push(`
WHAT I'M OFFERING:
- Outcome: ${a.dreamOutcome||a.dream_outcome}
- Next step: ${(m=a.leadMagnet)!=null&&m.idea?`Free resource: ${a.leadMagnet.idea}`:"Discovery call or consultation"}`),o!=null&&o.voice_summary&&c.push(`
TONE:
${o.voice_summary}`),n&&c.push(`
ADDITIONAL CONTEXT:
${n}`),c.push(`
OUTPUT FORMAT:
Create 2 follow-up messages:

**MESSAGE 1: Check-in Style**
- Friendly opener
- Reference previous interaction
- Provide value or insight
- Soft next step

**MESSAGE 2: Direct Value Offer**
- Quick re-introduction
- Specific value proposition
- Clear CTA

Keep messages personal and helpful, not pushy. 75-150 words each.`),c.join(`
`)}function D(p,i="facebook",n=""){var l,c,m;const{persona:e,offer:a,validation:o,voice:r}=p,t=[],s={facebook:"Facebook/Instagram Feed Ads",story:"Instagram/Facebook Story Ads",google:"Google Search Ads",youtube:"YouTube Video Ads"};if(t.push(`Create ad copy for ${s[i]||"social media ads"}.

GOAL: Drive traffic to ${a!=null&&a.leadMagnet?"lead magnet landing page":"sales page"}.`),e!=null&&e.ideal_customer&&t.push(`
TARGET AUDIENCE:
- Who: ${e.ideal_customer}
- Problem: ${e.core_problem||"Not specified"}`),a&&t.push(`
WHAT WE'RE PROMOTING:
${(l=a.leadMagnet)!=null&&l.idea?`- Lead Magnet: ${a.leadMagnet.idea}`:""}
${a.dreamOutcome||a.dream_outcome?`- Outcome: ${a.dreamOutcome||a.dream_outcome}`:""}`),((c=o==null?void 0:o.painPoints)==null?void 0:c.length)>0||((m=o==null?void 0:o.pain_points)==null?void 0:m.length)>0){const d=o.painPoints||o.pain_points||[];t.push(`
PAIN POINTS FOR HOOKS:
${d.slice(0,5).map(h=>`- "${h}"`).join(`
`)}`)}return r!=null&&r.voice_summary&&t.push(`
BRAND VOICE:
${r.voice_summary}`),n&&t.push(`
ADDITIONAL CONTEXT:
${n}`),i==="facebook"||i==="story"?t.push(`
OUTPUT FORMAT:
Create 5 ad variations:

For each ad, provide:
- Hook (first line - must stop the scroll)
- Body copy (2-3 short paragraphs)
- Call-to-action

Variation types:
1. Pain-focused (address their struggle)
2. Outcome-focused (paint the dream)
3. Curiosity-based (open loop)
4. Social proof angle (results/testimonials)
5. Contrarian/unexpected angle

Keep copy punchy and conversational. Use line breaks for readability.`):i==="google"&&t.push(`
OUTPUT FORMAT:
Create 5 Google Search Ad groups:

For each ad:
- Headline 1 (30 chars max)
- Headline 2 (30 chars max)
- Headline 3 (30 chars max)
- Description 1 (90 chars max)
- Description 2 (90 chars max)

Include relevant keywords naturally. Focus on search intent.`),t.join(`
`)}const P={landingPage:{id:"landingPage",name:"Landing Page Copy",description:"Lead magnet opt-in pages",icon:"🌐",generator:$,requiredData:["persona","offer"],recommendedData:["validation","voice"]},salesPage:{id:"salesPage",name:"Sales Page Copy",description:"Core offer sales pages",icon:"💰",generator:E,requiredData:["offer"],recommendedData:["persona","validation","voice","proof"]},nurtureSequence:{id:"nurtureSequence",name:"Nurture Sequence",description:"5-email trust-building sequence",icon:"📧",generator:A,requiredData:["persona"],recommendedData:["offer","validation","voice"]},launchSequence:{id:"launchSequence",name:"Launch Sequence",description:"7-email sales sequence",icon:"🚀",generator:N,requiredData:["offer"],recommendedData:["persona","validation","voice","proof","launch"]},coldOutreach:{id:"coldOutreach",name:"Cold Outreach",description:"DM and email scripts",icon:"📤",generator:_,requiredData:["persona"],recommendedData:["offer","voice"]},warmFollowUp:{id:"warmFollowUp",name:"Warm Follow-up",description:"Follow-up messages for engaged leads",icon:"🤝",generator:S,requiredData:[],recommendedData:["offer","voice"]},adCopy:{id:"adCopy",name:"Ad Copy",description:"Social media ad variations",icon:"📣",generator:D,requiredData:["persona"],recommendedData:["offer","validation","voice"]}};function b(p,i){const n=P[p];if(!n)return{ready:!1,missing:[],recommended:[]};const e=n.requiredData.filter(o=>!i[o]),a=n.recommendedData.filter(o=>!i[o]);return{ready:e.length===0,missing:e,recommended:a,completeness:Math.round((n.requiredData.length-e.length+(n.recommendedData.length-a.length)*.5)/(n.requiredData.length+n.recommendedData.length*.5)*100)}}export{P,b as c};
