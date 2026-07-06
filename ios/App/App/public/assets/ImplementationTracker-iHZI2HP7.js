import{r as h,j as n,s as le,a as $e,u as Ie,b as Se}from"./index-CvWXwTVs.js";import{e as Ae,h as fe,t as Le,i as ge,I as Pe,j as ke,k as Me}from"./implementationService-Ck3yVoTe.js";import{P as ye}from"./ProjectSwitcher-C0kpHG4R.js";import{g as Re,a as qe}from"./businessProfile-C5jsrHGk.js";function H(e){var a,t,o,r,m,g,u,p,v,N,O;if(!(e!=null&&e.autonomous))return"";const s=[],i=e.autonomous;if(((a=i.revenue)!=null&&a.current||(t=i.revenue)!=null&&t.target)&&s.push(`BUSINESS CONTEXT:
- Current monthly revenue: ${(o=i.revenue)!=null&&o.current?`$${i.revenue.current.toLocaleString()}`:"not specified"}
- Revenue goal: ${(r=i.revenue)!=null&&r.target?`$${i.revenue.target.toLocaleString()}`:"not specified"}
- Business model: ${((m=i.revenue)==null?void 0:m.model)||"not specified"}`),(g=i.customers)!=null&&g.best&&s.push(`IDEAL CUSTOMER PROFILE:
- Description: ${i.customers.best.description||"not specified"}
- What made them buy: ${i.customers.best.buyingTrigger||"not specified"}
- Revenue share: ${i.customers.best.revenuePercent?`${i.customers.best.revenuePercent}%`:"not specified"}`),((v=(p=(u=i.customers)==null?void 0:u.worst)==null?void 0:p.objections)==null?void 0:v.length)>0&&s.push(`COMMON OBJECTIONS TO ADDRESS:
${i.customers.worst.objections.map((T,$)=>`${$+1}. "${T}"`).join(`
`)}`),((N=i.competitors)==null?void 0:N.length)>0||i.yourAdvantage){const T=((O=i.competitors)==null?void 0:O.slice(0,2).map($=>`- ${$.name}: ${$.positioning||"unknown positioning"}${$.pricing?` (~$${$.pricing})`:""}`))||[];s.push(`COMPETITIVE LANDSCAPE:
${T.length>0?T.join(`
`):"- No competitors specified"}
- YOUR KEY ADVANTAGE: ${i.yourAdvantage||"not specified"}`)}if(i.funnel){const T=[`FUNNEL PERFORMANCE (actual data):
- This month: ${i.funnel.leads} leads → ${i.funnel.sales} sales (${i.funnel.conversionRate}% conversion)
- Average deal size: ${i.funnel.avgDealSize?`$${i.funnel.avgDealSize.toLocaleString()}`:"not enough data"}`];i.funnel.weakPoint&&T.push(`- Weak point: ${i.funnel.weakPoint}`),i.funnel.recommendation&&T.push(`- AI recommendation: ${i.funnel.recommendation}`),s.push(T.join(`
`))}return s.length===0?"":`
// ENHANCED CONTEXT (from Tier 4 data)
${s.join(`

`)}
// END ENHANCED CONTEXT
`}const ce={task_id:"create_attraction_headline",display_name:"Create Lead Magnet Headline",category:"attraction",task_type:"headline",context_sources:["offers.attraction.recommendedName","offers.leadMagnet.type","offers.core.name","audience.problems","niche.definition"],context_display:e=>{var i,a,t,o,r,m;const s=[];return(i=e==null?void 0:e.offer)!=null&&i.recommendedName&&s.push({label:"Attraction Offer",value:e.offer.recommendedName}),(a=e==null?void 0:e.core)!=null&&a.name&&s.push({label:"Core Offer",value:e.core.name}),(t=e==null?void 0:e.niche)!=null&&t.definition&&s.push({label:"Target Audience",value:e.niche.definition}),((r=(o=e==null?void 0:e.audience)==null?void 0:o.problems)==null?void 0:r.length)>0&&s.push({label:"Main Problem",value:((m=e.audience.problems[0])==null?void 0:m.name)||e.audience.problems[0]}),s},clarifying_questions:[{id:"lead_magnet_type",question:"What type of lead magnet are you creating?",help:"Choose the format that best fits your content",required:!0,options:["PDF Guide/Checklist","Video Training","Quiz/Assessment","Template/Swipe File","Free Tool/Calculator"]},{id:"main_promise",question:"What specific result will they get from this free resource?",help:'Be specific. Example: "5 email templates that book calls" not "learn about email marketing"',required:!0,placeholder:"e.g., Double your response rate, Save 5 hours per week, Get your first 3 clients"}],generation_prompt:(e,s,i)=>{var a,t,o,r,m,g,u,p,v,N,O;return`
You are a direct-response copywriter trained in Alex Hormozi's $100M Offers methodology, specializing in lead magnets.

CONTEXT:
- Attraction offer type: ${((a=e==null?void 0:e.offer)==null?void 0:a.recommendedName)||"lead magnet"}
- Core offer (what they'll eventually buy): ${((t=e==null?void 0:e.core)==null?void 0:t.name)||"premium program"}
- Target audience: ${((o=e==null?void 0:e.niche)==null?void 0:o.definition)||"ideal customers"}
- Main problem they face: ${((g=(m=(r=e==null?void 0:e.audience)==null?void 0:r.problems)==null?void 0:m[0])==null?void 0:g.name)||((p=(u=e==null?void 0:e.audience)==null?void 0:u.problems)==null?void 0:p[0])||"their biggest challenge"}
- Lead magnet format: ${s.lead_magnet_type}
- Main promise: ${s.main_promise}
${H(e)}
HORMOZI LEAD MAGNET PRINCIPLES:
- Lead with the result, not the method
- Be specific about the outcome (numbers, timeframes)
- Make it feel like a "no-brainer" to grab
- The headline should make them think "I need this NOW"

${i?`VOICE PROFILE:
${i}
`:""}

Create 3 compelling lead magnet headlines that:
1. Lead with the specific result/transformation
2. Include specificity (numbers, timeframe, or method)
3. Create immediate desire to download/access
4. ${i?"Match the voice profile above":"Sound valuable and urgent"}
${(O=(N=(v=e==null?void 0:e.autonomous)==null?void 0:v.customers)==null?void 0:N.best)!=null&&O.buyingTrigger?`5. Tap into this buying trigger: "${e.autonomous.customers.best.buyingTrigger}"`:""}

Format your response EXACTLY like this:
HEADLINE 1: [headline text]
WHY IT WORKS: [1 sentence explanation]

HEADLINE 2: [headline text]
WHY IT WORKS: [1 sentence explanation]

HEADLINE 3: [headline text]
WHY IT WORKS: [1 sentence explanation]
`},success_tips:["Test your headline with 5 people - do they immediately understand the value?","The best lead magnet headlines promise a specific, quick win",'Avoid vague words like "secrets" or "ultimate guide"']},de={task_id:"write_welcome_email",display_name:"Write Welcome Email (Day 0)",category:"attraction",task_type:"email",context_sources:["offers.attraction.recommendedName","offers.core.name","niche.definition"],context_display:e=>{var i,a,t;const s=[];return(i=e==null?void 0:e.offer)!=null&&i.recommendedName&&s.push({label:"Attraction Offer",value:e.offer.recommendedName}),(a=e==null?void 0:e.core)!=null&&a.name&&s.push({label:"Core Offer",value:e.core.name}),(t=e==null?void 0:e.niche)!=null&&t.definition&&s.push({label:"Target Audience",value:e.niche.definition}),s},clarifying_questions:[{id:"lead_magnet_name",question:"What is the name of your lead magnet?",help:"The title they signed up for",required:!0,placeholder:"e.g., The 5-Day Client Acquisition Blueprint"},{id:"first_action",question:"What ONE action should they take first?",help:"The most important first step to get results",required:!0,placeholder:"e.g., Complete the assessment on page 2, Watch the first 10 minutes"}],generation_prompt:(e,s,i)=>{var a,t;return`
You are an email copywriter trained in Alex Hormozi's methodology.

CONTEXT:
- Lead magnet name: ${s.lead_magnet_name}
- First action to take: ${s.first_action}
- Core offer: ${((a=e==null?void 0:e.core)==null?void 0:a.name)||"premium program"}
- Target audience: ${((t=e==null?void 0:e.niche)==null?void 0:t.definition)||"new subscribers"}

EMAIL GOALS:
1. Deliver the lead magnet with excitement
2. Set expectations for what's coming
3. Get them to take the first action TODAY
4. Build relationship (not sell yet)

${i?`VOICE PROFILE:
${i}
`:""}

Write a welcome email in this format:

SUBJECT LINE: [compelling subject - focus on what they're getting]

---

[Email body - 150-200 words max]
- Welcome them
- Deliver the resource (link placeholder: [LEAD MAGNET LINK])
- Tell them the ONE thing to do first
- Build anticipation for next email

---

P.S. [Quick tip or excitement builder]

---

WHY THIS EMAIL WORKS:
[2-3 sentences explaining the psychology]
`},success_tips:["Send immediately after signup - speed matters","Focus on ONE action, not multiple steps","Keep it short - save the teaching for the lead magnet"]},Ne={task_id:"write_launch_email",display_name:"Write Value/Launch Email",category:"attraction",task_type:"email",context_sources:["offers.attraction.recommendedName","offers.core.name","offers.core.price","niche.definition"],context_display:e=>{var i,a,t;const s=[];return(i=e==null?void 0:e.offer)!=null&&i.recommendedName&&s.push({label:"Attraction Offer",value:e.offer.recommendedName}),(a=e==null?void 0:e.core)!=null&&a.name&&s.push({label:"Core Offer",value:`${e.core.name}${e.core.price?` ($${e.core.price})`:""}`}),(t=e==null?void 0:e.niche)!=null&&t.definition&&s.push({label:"Target Audience",value:e.niche.definition}),s},clarifying_questions:[{id:"transformation_story",question:"Describe a quick transformation story or case study",help:"A real result someone got. Even if it's your own experience.",required:!0,placeholder:"e.g., Sarah went from 0 to 5 clients in 30 days using this exact method"},{id:"offer_deadline",question:"Is there a deadline or special offer?",help:"Optional urgency element",required:!1,placeholder:"e.g., Founding member pricing ends Friday, Bonus expires in 48 hours"}],generation_prompt:(e,s,i)=>{var a,t,o;return`
You are an email copywriter trained in Alex Hormozi's methodology.

CONTEXT:
- Core offer: ${((a=e==null?void 0:e.core)==null?void 0:a.name)||"premium program"} at $${((t=e==null?void 0:e.core)==null?void 0:t.price)||"TBD"}
- Target audience: ${((o=e==null?void 0:e.niche)==null?void 0:o.definition)||"subscribers"}
- Transformation story: ${s.transformation_story}
- Deadline/urgency: ${s.offer_deadline||"none"}

EMAIL GOALS:
1. Share valuable insight or story
2. Transition naturally to the offer
3. Create desire without being pushy
4. Clear call-to-action

${i?`VOICE PROFILE:
${i}
`:""}

Write a value/launch email in this format:

SUBJECT LINE: [curiosity-driven subject related to the story]

---

[Email body - 200-300 words]
- Open with the transformation story
- Connect to what they're struggling with
- Bridge to how your offer helps
- Call-to-action

[CTA Button: e.g., "See How It Works →"]

---

P.S. [Urgency or social proof element]

---

WHY THIS EMAIL WORKS:
[2-3 sentences explaining the psychology]
`},success_tips:["Lead with story, not pitch","One clear CTA - don't give multiple options","P.S. lines have high readership - use them wisely"]},_e={task_id:"create_upsell_headline",display_name:"Create Upsell Headline",category:"upsell",task_type:"headline",context_sources:["offers.upsell.recommendedName","offers.upsell.goal","offers.core.name","offers.core.price","audience.personas","niche.definition"],context_display:e=>{var i,a,t,o,r,m,g;const s=[];return(a=(i=e==null?void 0:e.offers)==null?void 0:i.upsell)!=null&&a.recommendedName&&s.push({label:"Upsell Type",value:e.offers.upsell.recommendedName}),(o=(t=e==null?void 0:e.offers)==null?void 0:t.core)!=null&&o.name&&s.push({label:"Core Offer",value:`${e.offers.core.name}${e.offers.core.price?` ($${e.offers.core.price})`:""}`}),(m=(r=e==null?void 0:e.offers)==null?void 0:r.upsell)!=null&&m.goal&&s.push({label:"Goal",value:e.offers.upsell.goal.replace(/_/g," ")}),(g=e==null?void 0:e.niche)!=null&&g.definition&&s.push({label:"Target Audience",value:e.niche.definition}),s},clarifying_questions:[{id:"transformation",question:"What's the ONE big transformation this upsell delivers?",help:'Focus on the result, not features. Example: "Master outbound sales in 30 days"',required:!0,placeholder:"e.g., Double your close rate, Save 10 hours per week"},{id:"timeframe",question:"How quickly will they see results?",help:'Be specific if possible. Example: "30 days", "first week", "immediately"',required:!1,placeholder:"e.g., 30 days, first week, immediately"}],generation_prompt:(e,s,i)=>{var a,t,o,r,m,g,u,p,v,N;return`
You are a direct-response copywriter trained in Alex Hormozi's $100M Offers methodology.

CONTEXT:
- Business niche: ${((a=e==null?void 0:e.niche)==null?void 0:a.definition)||"not specified"}
- Core offer: ${((o=(t=e==null?void 0:e.offers)==null?void 0:t.core)==null?void 0:o.name)||"their main product"} at $${((m=(r=e==null?void 0:e.offers)==null?void 0:r.core)==null?void 0:m.price)||"TBD"}
- Upsell type: ${((u=(g=e==null?void 0:e.offers)==null?void 0:g.upsell)==null?void 0:u.recommendedName)||"premium upgrade"}
- Upsell goal: ${((N=(v=(p=e==null?void 0:e.offers)==null?void 0:p.upsell)==null?void 0:v.goal)==null?void 0:N.replace(/_/g," "))||"increase revenue"}
- Target transformation: ${s.transformation}
- Timeframe: ${s.timeframe||"not specified"}
${H(e)}
${i?`VOICE PROFILE:
${i}
`:""}

Create 3 compelling upsell headlines that:
1. Lead with the transformation, not features
2. Include specific timeframe or outcome if known
3. Create urgency without being pushy
4. ${i?"Match the voice profile above":"Sound professional and confident"}

Format your response EXACTLY like this:
HEADLINE 1: [headline text]
WHY IT WORKS: [1 sentence explanation]

HEADLINE 2: [headline text]
WHY IT WORKS: [1 sentence explanation]

HEADLINE 3: [headline text]
WHY IT WORKS: [1 sentence explanation]
`},success_tips:['Pick the headline that feels most "you"',"Test 2-3 versions if possible","The best headlines promise a specific transformation"]},Ee={task_id:"set_upsell_pricing",display_name:"Set Upsell Pricing Strategy",category:"upsell",task_type:"strategy",context_sources:["offers.upsell.recommendedName","offers.core.price","offers.upsell.avgOrderValue"],context_display:e=>{var i,a,t,o,r,m;const s=[];return(a=(i=e==null?void 0:e.offers)==null?void 0:i.upsell)!=null&&a.recommendedName&&s.push({label:"Upsell Type",value:e.offers.upsell.recommendedName}),(o=(t=e==null?void 0:e.offers)==null?void 0:t.core)!=null&&o.price&&s.push({label:"Core Offer Price",value:`$${e.offers.core.price}`}),(m=(r=e==null?void 0:e.offers)==null?void 0:r.upsell)!=null&&m.avgOrderValue&&s.push({label:"Avg Order Value Range",value:e.offers.upsell.avgOrderValue.replace(/_/g," ")}),s},clarifying_questions:[{id:"upsell_value",question:"What is the total value of your upsell package?",help:"Add up all the components - courses, templates, bonuses, support, etc.",required:!0,placeholder:"e.g., $2,997, $497"},{id:"price_sensitivity",question:"How price-sensitive is your audience?",help:"This affects whether to anchor high or lead with value",required:!0,options:["Very price-sensitive","Moderate","Value-focused (less price-sensitive)"]}],generation_prompt:(e,s,i)=>{var a,t,o,r;return`
You are a pricing strategist trained in Alex Hormozi's $100M Offers methodology.

CONTEXT:
- Core offer price: $${((t=(a=e==null?void 0:e.offers)==null?void 0:a.core)==null?void 0:t.price)||"unknown"}
- Upsell type: ${((r=(o=e==null?void 0:e.offers)==null?void 0:o.upsell)==null?void 0:r.recommendedName)||"premium upgrade"}
- Total upsell value: ${s.upsell_value}
- Price sensitivity: ${s.price_sensitivity}

HORMOZI PRICING PRINCIPLES:
- Price-to-value ratio should make the offer feel like a "no-brainer"
- Anchor with a higher number first (total value), then reveal price
- The gap between value and price is the "deal"
- For upsells, the sweet spot is often 30-50% of core offer price

${i?`VOICE PROFILE:
${i}
`:""}

Create 2 pricing strategy recommendations:

STRATEGY 1 (Conservative):
- Recommended price: $[price]
- Value-to-price ratio: [X]:1
- Positioning statement: "[1-2 sentence pitch]"
- Why this works: [explanation]

STRATEGY 2 (Aggressive):
- Recommended price: $[price]
- Value-to-price ratio: [X]:1
- Positioning statement: "[1-2 sentence pitch]"
- Why this works: [explanation]

ANCHORING SCRIPT:
"[A 2-3 sentence script for presenting the price with value anchoring]"
`},success_tips:["The value-to-price ratio should be at least 3:1 for upsells","Test the conservative price first, then optimize","Always present value before price"]},Te={task_id:"create_order_bump",display_name:"Create Order Bump Copy",category:"upsell",task_type:"pitch",context_sources:["offers.upsell.recommendedName","offers.core.name","offers.core.price","niche.definition"],context_display:e=>{var i,a,t;const s=[];return(i=e==null?void 0:e.offer)!=null&&i.recommendedName&&s.push({label:"Upsell Type",value:e.offer.recommendedName}),(a=e==null?void 0:e.core)!=null&&a.name&&s.push({label:"Core Offer",value:`${e.core.name}${e.core.price?` ($${e.core.price})`:""}`}),(t=e==null?void 0:e.niche)!=null&&t.definition&&s.push({label:"Target Audience",value:e.niche.definition}),s},clarifying_questions:[{id:"bump_product",question:"What is the order bump product?",help:"The small add-on offered at checkout (usually $17-$97)",required:!0,placeholder:"e.g., Quick-start templates, Implementation checklist, Bonus module"},{id:"bump_price",question:"What is the order bump price?",help:"Should be an impulse-buy price point",required:!0,placeholder:"e.g., $27, $47, $67"},{id:"main_benefit",question:"What's the #1 benefit of adding this?",help:"How does it make their main purchase better/faster/easier?",required:!0,placeholder:"e.g., Get results 2x faster, Skip the setup headaches, Done-for-you templates"}],generation_prompt:(e,s,i)=>{var a,t,o;return`
You are a conversion copywriter trained in Alex Hormozi's $100M Offers methodology, specializing in order bumps.

CONTEXT:
- Core offer: ${((a=e==null?void 0:e.core)==null?void 0:a.name)||"main product"} at $${((t=e==null?void 0:e.core)==null?void 0:t.price)||"TBD"}
- Order bump product: ${s.bump_product}
- Order bump price: ${s.bump_price}
- Main benefit: ${s.main_benefit}
- Target audience: ${((o=e==null?void 0:e.niche)==null?void 0:o.definition)||"customers"}

HORMOZI ORDER BUMP PRINCIPLES:
- Order bumps should feel like a "no-brainer" add-on
- Position as making the main purchase MORE valuable
- Price should feel insignificant compared to main purchase
- Focus on speed, ease, or completeness

${i?`VOICE PROFILE:
${i}
`:""}

Create order bump copy in this format:

CHECKBOX HEADLINE:
☐ Yes! Add [Product Name] for just ${s.bump_price}

SHORT DESCRIPTION (2-3 sentences):
[Compelling copy explaining why they need this]

BULLET POINTS (3-4 benefits):
• [Benefit 1]
• [Benefit 2]
• [Benefit 3]
• [Benefit 4 - optional]

URGENCY LINE:
[One line creating urgency or exclusivity]

---

WHY THIS ORDER BUMP CONVERTS:
[2-3 sentences explaining the psychology]
`},success_tips:["Order bumps convert best at 10-20% of main offer price","Position it as making the main purchase complete","Test different checkbox headlines - small changes matter"]},ve={task_id:"create_downsell_headline",display_name:"Create Downsell Headline",category:"downsell",task_type:"headline",context_sources:["offers.downsell.recommendedName","offers.downsell.mainObjection","offers.core.name","offers.core.price","offers.downsell.pricePoint"],context_display:e=>{var i,a,t,o,r,m,g,u;const s=[];return(a=(i=e==null?void 0:e.offers)==null?void 0:i.downsell)!=null&&a.recommendedName&&s.push({label:"Downsell Type",value:e.offers.downsell.recommendedName}),(o=(t=e==null?void 0:e.offers)==null?void 0:t.downsell)!=null&&o.mainObjection&&s.push({label:"Main Objection",value:e.offers.downsell.mainObjection.replace(/_/g," ")}),(m=(r=e==null?void 0:e.offers)==null?void 0:r.core)!=null&&m.name&&s.push({label:"Core Offer",value:e.offers.core.name}),(u=(g=e==null?void 0:e.offers)==null?void 0:g.downsell)!=null&&u.pricePoint&&s.push({label:"Price Range",value:e.offers.downsell.pricePoint.replace(/_/g," ")}),s},clarifying_questions:[{id:"what_they_still_get",question:"What will they STILL get with the downsell?",help:"Focus on the core value that remains. What problem does this still solve?",required:!0,placeholder:"e.g., Core training modules, Basic support, Essential templates"},{id:"objection_addressed",question:"How does this address their objection?",help:"Connect the downsell directly to why they said no",required:!0,placeholder:"e.g., Lower monthly payments, Try before full commitment"}],generation_prompt:(e,s,i)=>{var a,t,o,r,m,g,u;return`
You are a direct-response copywriter trained in Alex Hormozi's $100M Offers methodology, specializing in downsell offers.

CONTEXT:
- Core offer: ${((t=(a=e==null?void 0:e.offers)==null?void 0:a.core)==null?void 0:t.name)||"their main product"}
- Downsell type: ${((r=(o=e==null?void 0:e.offers)==null?void 0:o.downsell)==null?void 0:r.recommendedName)||"alternative offer"}
- Main objection: ${((u=(g=(m=e==null?void 0:e.offers)==null?void 0:m.downsell)==null?void 0:g.mainObjection)==null?void 0:u.replace(/_/g," "))||"price concern"}
- What they still get: ${s.what_they_still_get}
- How objection is addressed: ${s.objection_addressed}
${H(e)}
HORMOZI DOWNSELL PRINCIPLES:
- Downsells should feel like a genuine alternative, not a consolation prize
- Address the specific objection directly
- Maintain perceived value while lowering the barrier
- Never make the customer feel like they're getting "less" - reframe as "different fit"

${i?`VOICE PROFILE:
${i}
`:""}

Create 3 compelling downsell headlines that:
1. Acknowledge their hesitation without judgment
2. Present the alternative as a smart choice
3. Lead with what they GET, not what they miss
4. ${i?"Match the voice profile above":"Sound understanding and helpful"}

Format your response EXACTLY like this:
HEADLINE 1: [headline text]
WHY IT WORKS: [1 sentence explanation]

HEADLINE 2: [headline text]
WHY IT WORKS: [1 sentence explanation]

HEADLINE 3: [headline text]
WHY IT WORKS: [1 sentence explanation]
`},success_tips:['Never make downsells feel like "second best"',"The best downsell headlines validate their concern","Focus on fit, not price"]},Ce={task_id:"write_downsell_email",display_name:"Write Downsell Follow-up Email",category:"downsell",task_type:"email",context_sources:["offers.downsell.recommendedName","offers.downsell.mainObjection","offers.core.name","niche.definition"],context_display:e=>{var i,a,t,o,r;const s=[];return(a=(i=e==null?void 0:e.offers)==null?void 0:i.downsell)!=null&&a.recommendedName&&s.push({label:"Downsell Type",value:e.offers.downsell.recommendedName}),(o=(t=e==null?void 0:e.offers)==null?void 0:t.downsell)!=null&&o.mainObjection&&s.push({label:"Main Objection",value:e.offers.downsell.mainObjection.replace(/_/g," ")}),(r=e==null?void 0:e.niche)!=null&&r.definition&&s.push({label:"Target Audience",value:e.niche.definition}),s},clarifying_questions:[{id:"downsell_offer",question:"What is the downsell offer?",help:"Describe the alternative you're offering (payment plan, lite version, trial, etc.)",required:!0,placeholder:"e.g., 3-month payment plan at $299/mo, Starter package at $497"},{id:"deadline",question:"Is there a deadline or urgency element?",help:'Optional but helps conversion. Example: "available for 48 hours"',required:!1,placeholder:"e.g., 48 hours, end of week, limited spots"}],generation_prompt:(e,s,i)=>{var a,t,o,r,m,g,u,p,v,N;return`
You are an email copywriter trained in Alex Hormozi's $100M Offers methodology.

CONTEXT:
- Core offer: ${((t=(a=e==null?void 0:e.offers)==null?void 0:a.core)==null?void 0:t.name)||"their main product"}
- Main objection: ${((m=(r=(o=e==null?void 0:e.offers)==null?void 0:o.downsell)==null?void 0:r.mainObjection)==null?void 0:m.replace(/_/g," "))||"price concern"}
- Downsell offer: ${s.downsell_offer}
- Target audience: ${((g=e==null?void 0:e.niche)==null?void 0:g.definition)||"potential customers"}
- Deadline: ${s.deadline||"none specified"}
${H(e)}
EMAIL GOALS:
1. Acknowledge they didn't move forward (no guilt)
2. Introduce the alternative naturally
3. Address the specific objection${((N=(v=(p=(u=e==null?void 0:e.autonomous)==null?void 0:u.customers)==null?void 0:p.worst)==null?void 0:v.objections)==null?void 0:N.length)>0?" (reference their actual objections above)":""}
4. Clear call-to-action

${i?`VOICE PROFILE:
${i}
`:""}

Write a downsell follow-up email in this format:

SUBJECT LINE: [compelling subject line]

---

[Email body - 150-250 words]

[Clear CTA button text: e.g., "Get Started with [Offer Name]"]

---

P.S. [Optional urgency or reassurance line]

---

WHY THIS EMAIL WORKS:
[2-3 sentences explaining the psychology]
`},success_tips:['Send within 24-48 hours of the "no"',"Keep it short - under 250 words","One clear CTA only"]},me={task_id:"create_payment_plan_pitch",display_name:"Create Payment Plan Pitch",category:"downsell",task_type:"script",context_sources:["offers.downsell.recommendedName","offers.downsell.mainObjection","offers.core.name","offers.core.price","niche.definition"],context_display:e=>{var i,a,t;const s=[];return(i=e==null?void 0:e.offer)!=null&&i.mainObjection&&s.push({label:"Main Objection",value:e.offer.mainObjection.replace(/_/g," ")}),(a=e==null?void 0:e.core)!=null&&a.name&&s.push({label:"Core Offer",value:`${e.core.name}${e.core.price?` ($${e.core.price})`:""}`}),(t=e==null?void 0:e.niche)!=null&&t.definition&&s.push({label:"Target Audience",value:e.niche.definition}),s},clarifying_questions:[{id:"monthly_amount",question:"What is the monthly payment amount?",help:"The recurring amount for the payment plan",required:!0,placeholder:"e.g., $297/month, $197/month"},{id:"num_payments",question:"How many payments?",help:"Total number of monthly payments",required:!0,options:["3 payments","4 payments","6 payments","12 payments"]},{id:"payment_plan_bonus",question:"Is there a bonus for choosing pay-in-full vs payment plan?",help:"Optional: Some offer a bonus for paying in full",required:!1,placeholder:"e.g., Pay-in-full saves $200, Pay-in-full gets bonus module"}],generation_prompt:(e,s,i)=>{var a,t,o,r,m;return`
You are a sales strategist trained in Alex Hormozi's $100M Offers methodology, specializing in payment plans and objection handling.

CONTEXT:
- Core offer: ${((a=e==null?void 0:e.core)==null?void 0:a.name)||"program"} at $${((t=e==null?void 0:e.core)==null?void 0:t.price)||"full price"}
- Main objection: ${((r=(o=e==null?void 0:e.offer)==null?void 0:o.mainObjection)==null?void 0:r.replace(/_/g," "))||"price concern"}
- Monthly payment: ${s.monthly_amount}
- Number of payments: ${s.num_payments}
- Pay-in-full bonus: ${s.payment_plan_bonus||"none"}
- Target audience: ${((m=e==null?void 0:e.niche)==null?void 0:m.definition)||"prospects"}
${H(e)}
HORMOZI PAYMENT PLAN PRINCIPLES:
- Payment plans are about ACCESSIBILITY, not discounting value
- Frame it as "investment management" not "can't afford it"
- Make the monthly amount feel small compared to the result
- Never apologize for offering a payment plan

${i?`VOICE PROFILE:
${i}
`:""}

Create a payment plan pitch script (30-45 seconds when spoken):

---

TRANSITION LINE:
[1 sentence acknowledging their hesitation without judgment]

REFRAME:
[1-2 sentences reframing from "can't afford" to "smart investment management"]

PAYMENT PLAN PRESENTATION:
"Here's what I can do for you:
[Present the payment plan with monthly amount and total payments]"

VALUE COMPARISON:
[Compare monthly payment to something relatable - daily cost, coffee, etc.]

CALL TO ACTION:
[Clear next step to get started with payment plan]

---

OBJECTION HANDLER - "I'll think about it":
[2-3 sentence response]

OBJECTION HANDLER - "What if I can't make a payment?":
[2-3 sentence response addressing this concern]

---

WHY THIS PITCH WORKS:
[2-3 sentences explaining the psychology]
`},success_tips:["Never make them feel bad for needing a payment plan","Compare the monthly amount to daily costs they already accept","Have a clear policy for missed payments ready"]},je={task_id:"create_continuity_pitch",display_name:"Create Continuity Pitch",category:"continuity",task_type:"script",context_sources:["offers.continuity.recommendedName","offers.core.name","niche.definition"],context_display:e=>{var i,a,t,o,r;const s=[];return(a=(i=e==null?void 0:e.offers)==null?void 0:i.continuity)!=null&&a.recommendedName&&s.push({label:"Continuity Model",value:e.offers.continuity.recommendedName}),(o=(t=e==null?void 0:e.offers)==null?void 0:t.core)!=null&&o.name&&s.push({label:"Core Offer",value:e.offers.core.name}),(r=e==null?void 0:e.niche)!=null&&r.definition&&s.push({label:"Target Audience",value:e.niche.definition}),s},clarifying_questions:[{id:"recurring_benefit",question:"What ongoing value do members get each month?",help:"What makes it worth staying? New content, community, support, updates?",required:!0,placeholder:"e.g., Weekly live calls, new templates each month, private community"},{id:"monthly_price",question:"What is the monthly price?",help:"The recurring amount they'll pay",required:!0,placeholder:"e.g., $97/month, $47/month"}],generation_prompt:(e,s,i)=>{var a,t,o,r,m;return`
You are a sales strategist trained in Alex Hormozi's $100M Offers methodology, specializing in continuity programs.

CONTEXT:
- Continuity model: ${((t=(a=e==null?void 0:e.offers)==null?void 0:a.continuity)==null?void 0:t.recommendedName)||"membership/subscription"}
- Core offer: ${((r=(o=e==null?void 0:e.offers)==null?void 0:o.core)==null?void 0:r.name)||"their main product"}
- Ongoing value: ${s.recurring_benefit}
- Monthly price: ${s.monthly_price}
- Target audience: ${((m=e==null?void 0:e.niche)==null?void 0:m.definition)||"customers"}
${H(e)}
HORMOZI CONTINUITY PRINCIPLES:
- Continuity should feel like "insurance against going backwards"
- Monthly value should clearly exceed the price
- Create FOMO about missing out on ongoing updates
- Make cancellation feel like a step backward, not a release

${i?`VOICE PROFILE:
${i}
`:""}

Create a continuity pitch script (30-60 seconds when spoken):

---

OPENING HOOK:
[1-2 sentences that create curiosity about the ongoing value]

CORE PITCH:
[3-4 sentences explaining what they get and why it matters]

VALUE STACK:
"Each month you get:
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]"

PRICE REVEAL:
[1-2 sentences positioning the price as a no-brainer]

CALL TO ACTION:
[Clear next step]

---

OBJECTION HANDLER:
If they say "I'll just cancel later":
[1-2 sentence response]

WHY THIS PITCH WORKS:
[2-3 sentences explaining the psychology]
`},success_tips:["Present continuity at the moment of highest excitement (right after purchase)","Frame it as protection of their investment","Make the first month irresistible"]},pe={task_id:"write_membership_welcome",display_name:"Write Membership Welcome Email",category:"continuity",task_type:"email",context_sources:["offers.continuity.recommendedName","offers.core.name","niche.definition"],context_display:e=>{var i,a,t;const s=[];return(i=e==null?void 0:e.offer)!=null&&i.recommendedName&&s.push({label:"Continuity Model",value:e.offer.recommendedName}),(a=e==null?void 0:e.core)!=null&&a.name&&s.push({label:"Core Offer",value:e.core.name}),(t=e==null?void 0:e.niche)!=null&&t.definition&&s.push({label:"Members",value:e.niche.definition}),s},clarifying_questions:[{id:"membership_name",question:"What is the name of your membership/subscription?",help:"The official name members will see",required:!0,placeholder:"e.g., The Inner Circle, Growth Academy, VIP Membership"},{id:"first_win",question:"What quick win can they get in their first week?",help:"The fastest result to make them feel their investment was worth it",required:!0,placeholder:"e.g., Complete the 5-Day Quick Start, Post your first win in the community"},{id:"key_benefit",question:"What is the #1 ongoing benefit they get?",help:"The main reason to stay subscribed month after month",required:!0,placeholder:"e.g., Weekly live coaching calls, New templates every month, Direct access to me"}],generation_prompt:(e,s,i)=>{var a;return`
You are an email copywriter trained in Alex Hormozi's methodology, specializing in membership onboarding.

CONTEXT:
- Membership name: ${s.membership_name}
- First week quick win: ${s.first_win}
- Key ongoing benefit: ${s.key_benefit}
- Members are: ${((a=e==null?void 0:e.niche)==null?void 0:a.definition)||"new members"}

EMAIL GOALS:
1. Make them feel they made the RIGHT decision
2. Reduce buyer's remorse immediately
3. Get them engaged in the first 48 hours
4. Set expectations for ongoing value

${i?`VOICE PROFILE:
${i}
`:""}

Write a membership welcome email in this format:

SUBJECT LINE: [Welcome + excitement - make them feel special]

---

[Email body - 200-250 words]
- Celebrate their decision (they're now part of something special)
- Explain what to do FIRST (one clear action)
- Preview the ongoing value they'll receive
- Create excitement about what's coming

ACCESS DETAILS:
[Login link placeholder]
[Community link placeholder if applicable]

YOUR FIRST STEP:
[Clear, specific action to take today]

---

P.S. [Reminder of the ongoing value or community element]

---

WHY THIS EMAIL WORKS:
[2-3 sentences explaining the psychology]
`},success_tips:["Send within 5 minutes of signup - speed shows you care","One clear first action - don't overwhelm with options","Reference the community if you have one - belonging reduces churn"]},we={task_id:"write_retention_email",display_name:"Write Retention/Win-Back Email",category:"continuity",task_type:"email",context_sources:["offers.continuity.recommendedName","offers.core.name","niche.definition"],context_display:e=>{var i,a;const s=[];return(i=e==null?void 0:e.offer)!=null&&i.recommendedName&&s.push({label:"Continuity Model",value:e.offer.recommendedName}),(a=e==null?void 0:e.core)!=null&&a.name&&s.push({label:"Core Offer",value:e.core.name}),s},clarifying_questions:[{id:"membership_name",question:"What is the name of your membership/subscription?",help:"The official name",required:!0,placeholder:"e.g., The Inner Circle, Growth Academy"},{id:"recent_value",question:"What valuable thing did you add/do recently?",help:"Something specific that happened in the last 30 days",required:!0,placeholder:"e.g., New masterclass on X, Updated templates, Member success story"},{id:"upcoming_value",question:"What exciting thing is coming soon?",help:"Create FOMO about what they'd miss",required:!0,placeholder:"e.g., Live workshop next week, New module dropping, Special guest expert"}],generation_prompt:(e,s,i)=>{var a;return`
You are an email copywriter trained in Alex Hormozi's methodology, specializing in member retention.

CONTEXT:
- Membership name: ${s.membership_name}
- Recent value added: ${s.recent_value}
- Upcoming value: ${s.upcoming_value}
- Members are: ${((a=e==null?void 0:e.niche)==null?void 0:a.definition)||"members"}

EMAIL GOALS:
1. Re-engage inactive or at-risk members
2. Remind them of value they're already paying for
3. Create FOMO about upcoming content
4. Make staying feel like the obvious choice

${i?`VOICE PROFILE:
${i}
`:""}

Write a retention email in this format:

SUBJECT LINE: [Curiosity-driven, not desperate - focus on what they're missing]

---

[Email body - 150-200 words]
- Acknowledge they've been quiet (without guilt-tripping)
- Highlight specific recent value
- Preview exciting upcoming content
- Remind them WHY they joined
- Clear CTA to re-engage

[CTA: e.g., "Jump Back In →"]

---

P.S. [FOMO element about upcoming content or community wins]

---

WHY THIS EMAIL WORKS:
[2-3 sentences explaining the psychology]
`},success_tips:["Send before they cancel, not after - watch engagement metrics",'Be specific about value, not generic "we miss you"',"One re-engagement action, not multiple asks"]},be={create_attraction_headline:ce,write_welcome_email:de,write_launch_email:Ne,create_upsell_headline:_e,set_upsell_pricing:Ee,create_order_bump:Te,create_downsell_headline:ve,write_downsell_email:Ce,create_payment_plan_pitch:me,create_continuity_pitch:je,write_membership_welcome:pe,write_retention_email:we};function Oe(e,s){const i=e.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");if(be[i])return be[i];const a=e.toLowerCase();if(a.includes("headline")){if(s==="attraction")return ce;if(s==="upsell")return _e;if(s==="downsell")return ve}if(a.includes("welcome")&&a.includes("email")){if(s==="attraction")return de;if(s==="continuity")return pe}if((a.includes("launch")||a.includes("value"))&&s==="attraction")return Ne;if((a.includes("retention")||a.includes("win-back")||a.includes("winback"))&&s==="continuity")return we;if(a.includes("email")||a.includes("follow-up")){if(s==="attraction")return de;if(s==="downsell")return Ce;if(s==="continuity")return pe}if((a.includes("pricing")||a.includes("price"))&&s==="upsell")return Ee;if((a.includes("payment plan")||a.includes("payment-plan"))&&s==="downsell")return me;if((a.includes("order bump")||a.includes("bump"))&&s==="upsell")return Te;if(a.includes("pitch")||a.includes("script")){if(s==="continuity")return je;if(s==="downsell")return me}return(a.includes("lead magnet")||a.includes("freebie")||a.includes("opt-in"))&&s==="attraction"?ce:null}function He(e,s){return Oe(e,s)!==null}const E={LOADING:"loading",CONTEXT_CONFIRM:"context_confirm",QUESTIONS:"questions",GENERATING:"generating",RESULT:"result",GUIDANCE_ONLY:"guidance_only"};function We({isOpen:e,onClose:s,task:i,category:a,userId:t,onComplete:o}){var y,C;const[r,m]=h.useState(E.LOADING),[g,u]=h.useState(null),[p,v]=h.useState(null),[N,O]=h.useState({}),[T,$]=h.useState(null),[W,j]=h.useState(null),[D,I]=h.useState(null),[k,X]=h.useState(!1),[M,F]=h.useState(!1),[Y,R]=h.useState(!1),[U,G]=h.useState(0),[B,J]=h.useState(null),ne=()=>{var d;const c=localStorage.getItem("crm_current_project");if(c)try{return(d=JSON.parse(c))==null?void 0:d.id}catch{return null}return null},A=async(c,d={})=>{try{await le.from("coach_analytics").insert({user_id:t,project_id:ne(),event_type:c,category:a,task_title:i==null?void 0:i.task,template_id:p==null?void 0:p.task_id,template_type:p==null?void 0:p.task_type,...d})}catch(b){console.error("Analytics tracking error:",b)}};h.useEffect(()=>{e&&i&&t&&ie()},[e,i,t,a]),h.useEffect(()=>{e||(m(E.LOADING),u(null),v(null),O({}),$(null),j(null),X(!1),F(!1),R(!1),G(0),J(null))},[e]);async function ie(){m(E.LOADING),j(null),A("coach_opened");try{const[c,d]=await Promise.all([Re(t,a),qe(t)]);u(c),d!=null&&d.instructions&&I(d.instructions);const b=Oe(i.task,a);v(b),m(b?E.CONTEXT_CONFIRM:E.GUIDANCE_ONLY)}catch(c){console.error("Error loading context:",c),j("Failed to load your business context. Please try again."),m(E.GUIDANCE_ONLY)}}const se=()=>{var d;(((d=p==null?void 0:p.clarifying_questions)==null?void 0:d.filter(b=>b.required))||[]).length>0?m(E.QUESTIONS):q()},Q=(c,d)=>{O(b=>({...b,[c]:d}))},z=h.useCallback(()=>p!=null&&p.clarifying_questions?p.clarifying_questions.filter(d=>d.required).every(d=>{var b;return(b=N[d.id])==null?void 0:b.trim()}):!0,[p,N]),ae=()=>{z()&&q()};async function q(){m(E.GENERATING),j(null),J(Date.now()),A("generation_started",{model_used:"haiku"});try{const c=p.generation_prompt(g,N,D),{data:d,error:b}=await le.functions.invoke("implementation-coach",{body:{prompt:c,task_type:p.task_type,category:a,action:"generate"}});if(b)throw b;if(d!=null&&d.error)throw new Error(d.error);$(d.content),m(E.RESULT);const L=B?Date.now()-B:null;A("generation_completed",{model_used:"haiku",generation_time_ms:L})}catch(c){console.error("Error generating content:",c),j("Failed to generate content. Please try again."),m(E.QUESTIONS)}}const te=()=>{G(c=>c+1),A("content_regenerated",{regeneration_count:U+1}),q()},l=async()=>{if(T)try{await navigator.clipboard.writeText(T),R(!0),setTimeout(()=>R(!1),2e3),A("content_copied",{was_copied:!0})}catch(c){console.error("Failed to copy:",c)}},f=async()=>{var c;if(!(!T||M||k)){F(!0);try{let d=null;const b=localStorage.getItem("crm_current_project");if(b)try{d=(c=JSON.parse(b))==null?void 0:c.id}catch{}const{error:L}=await le.from("generated_assets").insert({user_id:t,project_id:d,asset_type:(p==null?void 0:p.task_type)||"content",category:a,task_title:(i==null?void 0:i.task)||"Unknown task",content:T,context_snapshot:g,answers_used:N});if(L)throw L;X(!0),A("content_saved",{was_saved:!0})}catch(d){console.error("Error saving asset:",d),j("Failed to save. Please try again.")}finally{F(!1)}}},_=()=>{A("task_completed",{was_saved:k,was_copied:Y,regeneration_count:U}),o==null||o(),s()};return e?n.jsxs(n.Fragment,{children:[n.jsx("div",{className:"coach-backdrop",onClick:s}),n.jsxs("div",{className:`coach-panel ${e?"open":""}`,children:[n.jsxs("div",{className:"coach-header",children:[n.jsxs("div",{className:"coach-header-content",children:[n.jsx("span",{className:"coach-icon",children:"🤖"}),n.jsxs("div",{className:"coach-header-text",children:[n.jsx("h2",{children:"Zarlo"}),n.jsx("p",{children:"Implementation Coach"})]})]}),n.jsx("button",{className:"coach-close",onClick:s,children:"✕"})]}),n.jsxs("div",{className:"coach-task-info",children:[n.jsx("span",{className:"task-badge",children:a}),n.jsx("h3",{children:i==null?void 0:i.task}),(i==null?void 0:i.description)&&n.jsx("p",{className:"task-desc",children:i.description})]}),n.jsxs("div",{className:"coach-content",children:[r===E.LOADING&&n.jsxs("div",{className:"coach-loading",children:[n.jsx("div",{className:"coach-spinner"}),n.jsx("p",{children:"Loading your business context..."})]}),r===E.GUIDANCE_ONLY&&n.jsxs("div",{className:"coach-guidance",children:[n.jsx("div",{className:"guidance-icon",children:"💡"}),n.jsx("h4",{children:"Task Guidance"}),(i==null?void 0:i.description)&&n.jsx("div",{className:"guidance-description",children:n.jsx("p",{children:i.description})}),(i==null?void 0:i.principle)&&n.jsxs("div",{className:"guidance-principle",children:[n.jsx("strong",{children:"Hormozi Principle:"}),n.jsxs("p",{children:['"',i.principle,'"']})]}),(i==null?void 0:i.examples)&&i.examples.length>0&&n.jsxs("div",{className:"guidance-tips",children:[n.jsx("h5",{children:"Examples:"}),n.jsx("ul",{children:i.examples.map((c,d)=>n.jsx("li",{children:c},d))})]}),(i==null?void 0:i.templates)&&i.templates.length>0&&n.jsxs("div",{className:"guidance-tips",children:[n.jsx("h5",{children:"Templates to use:"}),n.jsx("ul",{children:i.templates.map((c,d)=>n.jsx("li",{children:c},d))})]}),(i==null?void 0:i.script)&&n.jsxs("div",{className:"guidance-script",children:[n.jsx("h5",{children:"Suggested script:"}),n.jsxs("p",{className:"script-text",children:['"',i.script,'"']})]}),!(i!=null&&i.description)&&!(i!=null&&i.principle)&&!(i!=null&&i.examples)&&!(i!=null&&i.templates)&&!(i!=null&&i.script)&&n.jsxs("div",{className:"guidance-tips",children:[n.jsx("h5",{children:"Tips for this task:"}),n.jsxs("ul",{children:[n.jsx("li",{children:"Focus on the transformation, not the features"}),n.jsx("li",{children:"Keep it simple - one clear message"}),n.jsx("li",{children:"Test with a small audience first"})]})]}),n.jsx("div",{className:"guidance-actions",children:n.jsx("button",{className:"coach-btn primary",onClick:_,children:"Mark as Complete"})})]}),r===E.CONTEXT_CONFIRM&&p&&n.jsx("div",{className:"coach-context",children:((y=p.context_display(g))==null?void 0:y.length)>0?n.jsxs(n.Fragment,{children:[n.jsxs("div",{className:"context-header",children:[n.jsx("span",{className:"context-icon",children:"✓"}),n.jsx("h4",{children:"I already know about your business"})]}),n.jsx("div",{className:"context-items",children:p.context_display(g).map((c,d)=>n.jsxs("div",{className:"context-item",children:[n.jsxs("span",{className:"context-label",children:[c.label,":"]}),n.jsx("span",{className:"context-value",children:c.value})]},d))}),n.jsxs("div",{className:"context-actions",children:[n.jsx("button",{className:"coach-btn primary",onClick:se,children:"Yes, continue"}),n.jsx("button",{className:"coach-btn secondary",onClick:()=>m(E.QUESTIONS),children:"Let me update this"})]})]}):n.jsxs(n.Fragment,{children:[n.jsxs("div",{className:"context-header",children:[n.jsx("span",{className:"context-icon",children:"📝"}),n.jsx("h4",{children:"Let me learn about your business"})]}),n.jsxs("p",{className:"context-empty",children:["I'll ask a few quick questions to personalize your ",p.task_type||"content","."]}),n.jsx("div",{className:"context-actions",children:n.jsx("button",{className:"coach-btn primary",onClick:()=>m(E.QUESTIONS),children:"Let's go"})})]})}),r===E.QUESTIONS&&p&&n.jsxs("div",{className:"coach-questions",children:[n.jsx("h4",{children:"A few quick questions..."}),(C=p.clarifying_questions)==null?void 0:C.map(c=>n.jsxs("div",{className:"question-group",children:[n.jsxs("label",{className:"question-label",children:[c.question,c.required&&n.jsx("span",{className:"required",children:"*"})]}),c.help&&n.jsx("p",{className:"question-help",children:c.help}),c.options?n.jsx("div",{className:"question-options",children:c.options.map((d,b)=>n.jsx("button",{className:`option-btn ${N[c.id]===d?"selected":""}`,onClick:()=>Q(c.id,d),children:d},b))}):n.jsx("textarea",{className:"question-input",placeholder:c.placeholder||"",value:N[c.id]||"",onChange:d=>Q(c.id,d.target.value),rows:3})]},c.id)),W&&n.jsx("p",{className:"coach-error",children:W}),n.jsx("div",{className:"question-actions",children:n.jsx("button",{className:"coach-btn primary",onClick:ae,disabled:!z(),children:"Generate Content"})})]}),r===E.GENERATING&&n.jsxs("div",{className:"coach-generating",children:[n.jsxs("div",{className:"generating-animation",children:[n.jsx("span",{className:"generating-dot"}),n.jsx("span",{className:"generating-dot"}),n.jsx("span",{className:"generating-dot"})]}),n.jsxs("p",{children:["Creating your ",(p==null?void 0:p.task_type)||"content","..."]}),n.jsx("p",{className:"generating-tip",children:"This usually takes 5-10 seconds"})]}),r===E.RESULT&&n.jsxs("div",{className:"coach-result",children:[n.jsxs("div",{className:"result-header",children:[n.jsx("span",{className:"result-icon",children:"✨"}),n.jsx("h4",{children:"Here's what I created"})]}),n.jsx("div",{className:"result-content",children:n.jsx("pre",{children:T})}),n.jsxs("div",{className:"result-actions",children:[n.jsx("button",{className:"coach-btn icon",onClick:l,title:"Copy to clipboard",children:Y?"✓ Copied!":"📋 Copy"}),n.jsx("button",{className:`coach-btn icon ${k?"saved":""}`,onClick:f,disabled:M||k,children:M?"💾 Saving...":k?"✓ Saved!":"💾 Save"}),n.jsx("button",{className:"coach-btn icon",onClick:te,children:"🔄 Regenerate"})]}),(p==null?void 0:p.success_tips)&&n.jsxs("div",{className:"result-tips",children:[n.jsx("h5",{children:"Tips:"}),n.jsx("ul",{children:p.success_tips.map((c,d)=>n.jsx("li",{children:c},d))})]}),n.jsx("div",{className:"result-complete",children:n.jsx("button",{className:"coach-btn primary",onClick:_,children:"Mark Task Complete"})})]})]}),n.jsx("div",{className:"coach-footer",children:n.jsx("p",{children:"Powered by Hormozi's $100M methodology"})})]})]}):null}function Ge(){const{user:e}=$e(),s=Ie(),[i]=Se(),[a,t]=h.useState(!0),[o,r]=h.useState([]),[m,g]=h.useState(null),[u,p]=h.useState(null),[v,N]=h.useState({}),[O,T]=h.useState("all"),[$,W]=h.useState(!1),[j,D]=h.useState(null),[I,k]=h.useState(()=>{const l=localStorage.getItem("crm_current_project");return l?JSON.parse(l):null}),[X,M]=h.useState(!1),[F,Y]=h.useState(null),[R,U]=h.useState(null),[G,B]=h.useState(null);h.useEffect(()=>{const l=i.get("id");l&&g(l)},[i]),h.useEffect(()=>{I&&localStorage.setItem("crm_current_project",JSON.stringify(I))},[I]),h.useEffect(()=>{e!=null&&e.id&&J()},[e==null?void 0:e.id,I==null?void 0:I.id]),h.useEffect(()=>{m&&o.length>0?ne():p(null)},[m,o]);async function J(){t(!0);try{const{data:l,error:f}=await Ae(e.id,I==null?void 0:I.id);if(f)throw f;r(l||[])}catch(l){console.error("Error loading implementations:",l)}finally{t(!1)}}async function ne(){const l=o.find(f=>f.id===m);if(!l){p(null);return}try{const f=await fe(l);if(p(f),f.phaseProgress){const _=f.phaseProgress.findIndex(y=>!y.isComplete);_>=0&&N({[_]:!0})}}catch(f){console.error("Error loading implementation details:",f)}}const A=h.useCallback(async(l,f)=>{var _,y,C,c;if(!(!u||$)){W(!0);try{const{data:d,phaseCompleted:b,allCompleted:L,error:V}=await Le(u.id,e.id,l,f);if(V)throw V;const Z={...u,...d},S=await fe(Z);if(p(S),r(w=>w.map(P=>P.id===u.id?d:P)),L)D({type:"complete",name:(_=u.checklist)==null?void 0:_.name});else if(b){const w=(c=(C=(y=u.checklist)==null?void 0:y.implementation_checklist)==null?void 0:C[l])==null?void 0:c.phase;D({type:"phase",name:w})}}catch(d){console.error("Error toggling task:",d)}finally{W(!1)}}},[u,e==null?void 0:e.id,$]),ie=async l=>{if(confirm("Are you sure you want to delete this implementation? Progress will be lost."))try{const{error:f}=await Me(l,e.id);if(f)throw f;r(_=>_.filter(y=>y.id!==l)),m===l&&g(null)}catch(f){console.error("Error deleting implementation:",f)}},se=l=>{N(f=>({...f,[l]:!f[l]}))},Q=(l,f,_)=>{Y(l),U(f),B(_),M(!0)},z=()=>{M(!1),Y(null),U(null),B(null)},ae=async()=>{R!==null&&G!==null&&await A(R,G),z()},q=O==="all"?o:o.filter(l=>l.category===O),te=l=>{var f;return!l.total_tasks||l.total_tasks===0?0:Math.round((((f=l.completed_tasks)==null?void 0:f.length)||0)/l.total_tasks*100)};return h.useEffect(()=>{if(j){const l=setTimeout(()=>D(null),3e3);return()=>clearTimeout(l)}},[j]),a?n.jsxs("div",{className:"implementation-tracker",children:[n.jsxs("div",{className:"impl-toolbar",children:[n.jsx("button",{className:"impl-toolbar-back",onClick:()=>s("/crm/tools"),children:"←"}),n.jsx("h2",{className:"impl-toolbar-title",children:"Implementations"})]}),n.jsx("div",{className:"impl-project-bar",children:n.jsx(ye,{userId:e==null?void 0:e.id,currentProject:I,onProjectChange:k})}),n.jsxs("div",{className:"impl-loading",children:[n.jsx("div",{className:"impl-spinner"}),n.jsx("p",{children:"Loading implementations..."})]})]}):n.jsxs("div",{className:"implementation-tracker",children:[n.jsxs("div",{className:"impl-toolbar",children:[n.jsx("button",{className:"impl-toolbar-back",onClick:()=>s("/crm/tools"),children:"←"}),n.jsx("h2",{className:"impl-toolbar-title",children:"Implementations"})]}),n.jsx("div",{className:"impl-project-bar",children:n.jsx(ye,{userId:e==null?void 0:e.id,currentProject:I,onProjectChange:k})}),j&&n.jsx("div",{className:`celebration-overlay ${j.type}`,children:n.jsx("div",{className:"celebration-content",children:j.type==="complete"?n.jsxs(n.Fragment,{children:[n.jsx("span",{className:"celebration-icon",children:"🎉"}),n.jsx("h2",{children:"Implementation Complete!"}),n.jsxs("p",{children:["You've finished implementing ",j.name]})]}):n.jsxs(n.Fragment,{children:[n.jsx("span",{className:"celebration-icon",children:"✨"}),n.jsx("h2",{children:"Phase Complete!"}),n.jsxs("p",{children:["You've completed: ",j.name]})]})})}),n.jsxs("div",{className:"impl-filters",children:[n.jsxs("button",{className:`filter-chip ${O==="all"?"active":""}`,onClick:()=>T("all"),children:["All (",o.length,")"]}),Object.entries(ge).map(([l,f])=>{const _=o.filter(y=>y.category===l).length;return n.jsxs("button",{className:`filter-chip ${O===l?"active":""}`,onClick:()=>T(l),children:[f.icon," ",f.label," (",_,")"]},l)})]}),q.length===0&&n.jsxs("div",{className:"impl-empty",children:[n.jsx("span",{className:"empty-icon",children:"📋"}),n.jsx("h3",{children:"No implementations yet"}),n.jsx("p",{children:"Complete a Money Model flow to get your first implementation checklist"}),n.jsx("button",{className:"impl-cta-btn",onClick:()=>s("/money-model-guide"),children:"Explore Money Models"})]}),n.jsx("div",{className:"impl-list",children:q.map(l=>{var c,d,b,L,V,Z;const f=te(l),_=m===l.id,y=ge[l.category],C=Pe[l.status];return n.jsxs("div",{className:`impl-card ${_?"expanded":""}`,children:[n.jsxs("button",{className:"impl-card-header",onClick:()=>g(_?null:l.id),children:[n.jsx("div",{className:"impl-card-icon",children:(y==null?void 0:y.icon)||"📋"}),n.jsxs("div",{className:"impl-card-info",children:[n.jsx("div",{className:"impl-card-title",children:l.offer_type.replace(/_/g," ").replace(/\b\w/g,S=>S.toUpperCase())}),n.jsxs("div",{className:"impl-card-meta",children:[n.jsx("span",{className:"impl-category-badge",style:{backgroundColor:(y==null?void 0:y.color)+"20",color:y==null?void 0:y.color},children:y==null?void 0:y.label}),n.jsx("span",{className:"impl-status-badge",style:{backgroundColor:(C==null?void 0:C.color)+"20",color:C==null?void 0:C.color},children:C==null?void 0:C.label})]})]}),n.jsx("div",{className:"impl-card-progress",children:n.jsxs("div",{className:"progress-ring",children:[n.jsxs("svg",{viewBox:"0 0 36 36",children:[n.jsx("path",{className:"progress-ring-bg",d:`M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831`}),n.jsx("path",{className:"progress-ring-fill",strokeDasharray:`${f}, 100`,d:`M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831`})]}),n.jsxs("span",{className:"progress-text",children:[f,"%"]})]})}),n.jsx("span",{className:"impl-card-arrow",children:_?"▼":"▶"})]}),_&&u&&n.jsxs("div",{className:"impl-card-body",children:[n.jsxs("div",{className:"impl-progress-section",children:[n.jsx("div",{className:"progress-bar-container",children:n.jsx("div",{className:"progress-bar-fill",style:{width:`${((c=u.progress)==null?void 0:c.percentage)||0}%`}})}),n.jsxs("div",{className:"progress-stats",children:[n.jsxs("span",{children:[((d=u.progress)==null?void 0:d.completed)||0," of ",((b=u.progress)==null?void 0:b.total)||0," tasks"]}),l.started_at&&n.jsxs("span",{children:["Started ",new Date(l.started_at).toLocaleDateString()]})]})]}),((L=u.checklist)==null?void 0:L.target_metrics)&&n.jsxs("div",{className:"impl-metrics",children:[n.jsx("h4",{children:"Target Metrics"}),n.jsx("div",{className:"metrics-grid",children:Object.entries(u.checklist.target_metrics).map(([S,w])=>n.jsxs("div",{className:"metric-item",children:[n.jsx("span",{className:"metric-label",children:S.replace(/_/g," ").replace(/\b\w/g,P=>P.toUpperCase())}),n.jsx("span",{className:"metric-value",children:w})]},S))})]}),((V=u.checklist)==null?void 0:V.hormozi_principle)&&n.jsxs("div",{className:"impl-principle",children:[n.jsx("span",{className:"principle-icon",children:"💡"}),n.jsxs("p",{children:['"',u.checklist.hormozi_principle,'"']})]}),n.jsx("div",{className:"impl-phases",children:(Z=u.phaseProgress)==null?void 0:Z.map((S,w)=>{var ue,he;const P=(he=(ue=u.checklist)==null?void 0:ue.implementation_checklist)==null?void 0:he[w],oe=v[w];return n.jsxs("div",{className:`impl-phase ${S.isComplete?"complete":""}`,children:[n.jsxs("button",{className:`phase-header ${oe?"expanded":""}`,onClick:()=>se(w),children:[n.jsx("span",{className:`phase-status ${S.isComplete?"complete":""}`,children:S.isComplete?"✓":w+1}),n.jsx("span",{className:"phase-name",children:S.phase}),n.jsxs("span",{className:"phase-progress",children:[S.completed,"/",S.total]}),n.jsx("span",{className:"phase-arrow",children:oe?"▼":"▶"})]}),oe&&(P==null?void 0:P.tasks)&&n.jsx("div",{className:"phase-tasks",children:P.tasks.map((K,x)=>{const ee=ke(u.completed_tasks,w,x),re=He(K.task,u.category);return n.jsxs("div",{className:`task-item ${ee?"completed":""}`,children:[n.jsx("button",{className:`task-checkbox ${ee?"checked":""}`,onClick:()=>A(w,x),disabled:$,children:ee?"✓":""}),n.jsxs("div",{className:"task-content",children:[n.jsx("span",{className:"task-title",children:K.task}),K.description&&n.jsx("p",{className:"task-description",children:K.description})]}),!ee&&n.jsx("button",{className:`task-ai-btn ${re?"has-ai":""}`,onClick:()=>Q(K,w,x),title:re?"Get AI help with this task":"Get guidance for this task",children:re?"🤖":"💡"})]},x)})})]},w)})}),n.jsx("div",{className:"impl-actions",children:n.jsx("button",{className:"impl-action-btn danger",onClick:()=>ie(l.id),children:"Delete"})})]})]},l.id)})}),o.length>0&&n.jsx("div",{className:"impl-footer",children:n.jsx("button",{className:"impl-cta-btn secondary",onClick:()=>s("/money-model-guide"),children:"+ Start New Implementation"})}),n.jsx(We,{isOpen:X,onClose:z,task:F,category:u==null?void 0:u.category,userId:e==null?void 0:e.id,onComplete:ae})]})}export{Ge as default};
