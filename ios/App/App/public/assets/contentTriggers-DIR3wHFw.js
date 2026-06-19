const s={low_lead_to_discovery:{id:"low_lead_to_discovery",name:"Low Lead Qualification",category:"funnel",description:"Lead-to-discovery rate below 30%",contentConfig:{type:"educational",platform:"linkedin",prefilledInstructions:`Create content that pre-qualifies leads by clearly communicating:
- Who this is for (and who it's NOT for)
- What problem you solve
- What makes someone a good fit
This helps filter out unqualified leads before they reach out.`,suggestedAngle:"qualification_content"},actionText:"Create Qualification Content"},low_discovery_to_proposal:{id:"low_discovery_to_proposal",name:"Discovery Not Converting",category:"funnel",description:"Discovery-to-proposal rate below 40%",contentConfig:{type:"social_proof",platform:"linkedin",prefilledInstructions:`Create trust-building content that establishes credibility:
- Share a client transformation story
- Highlight specific results and outcomes
- Address common concerns prospects have during discovery
This builds trust before the sales conversation.`,suggestedAngle:"trust_building"},actionText:"Create Trust Content"},low_proposal_to_close:{id:"low_proposal_to_close",name:"Proposals Not Closing",category:"funnel",description:"Proposal-to-close rate below target",contentConfig:{type:"pain_agitation",platform:"linkedin",prefilledInstructions:`Create objection-handling content that addresses why people don't buy:
- Surface the real cost of not solving this problem
- Address the most common objection: {topLossReason}
- Show what happens when people wait too long
This content does the heavy lifting before the proposal.`,suggestedAngle:"objection_handling"},actionText:"Create Objection Content"},price_objections:{id:"price_objections",name:"Price Objections Pattern",category:"pricing",description:"3+ deals lost to price concerns",contentConfig:{type:"transformation_story",platform:"linkedin",prefilledInstructions:`Create ROI-focused content that justifies your pricing:
- Show the transformation and results clients get
- Calculate the cost of NOT solving this problem
- Compare your price to the value delivered
- Include specific numbers: time saved, revenue gained, problems avoided
Make price feel like an investment, not a cost.`,suggestedAngle:"value_justification"},actionText:"Create Value Content",dynamicContext:e=>`
Recent data: ${e.count} deals lost to price objections.
Focus on demonstrating ROI that far exceeds your price point.`},timing_objections:{id:"timing_objections",name:"Timing Objections Pattern",category:"sales",description:'3+ deals lost to "not the right time"',contentConfig:{type:"pain_agitation",platform:"email",prefilledInstructions:`Create nurture content that stays top-of-mind:
- The cost of waiting / what gets worse over time
- Signs that indicate "now" is the right time
- Quick wins they can implement while they wait
- A compelling reason to stay connected
This keeps you top-of-mind until they're ready.`,suggestedAngle:"nurture_sequence"},actionText:"Create Nurture Content",dynamicContext:e=>`
Recent data: ${e.count} deals lost to timing.
Create content that keeps you top-of-mind and creates urgency.`},competitor_loss:{id:"competitor_loss",name:"Lost to Competitor",category:"marketing",description:"Multiple deals lost to same competitor",contentConfig:{type:"educational",platform:"linkedin",prefilledInstructions:`Create comparison/differentiation content:
- What makes your approach different from {competitor}
- Who is a better fit for you vs them (be respectful)
- Unique benefits only you provide
- Questions prospects should ask when evaluating options
Don't attack the competitor - elevate your unique value.`,suggestedAngle:"differentiation"},actionText:"Create Comparison Post",dynamicContext:e=>`
Competitor: ${e.competitor}
Deals lost: ${e.count}
Focus on what makes YOU different, not what's wrong with them.`},win_streak:{id:"win_streak",name:"Win Streak",category:"marketing",description:"3+ recent wins to celebrate",contentConfig:{type:"social_proof",platform:"linkedin",prefilledInstructions:`Create a case study or social proof post:
- Share a recent client win story
- Top win reason: {winReason}
- Include specific, measurable results
- The transformation journey (before → after)
- What made this client successful
Turn your wins into magnetic content.`,suggestedAngle:"case_study"},actionText:"Create Case Study",dynamicContext:e=>`
Recent wins: ${e.wins}
Top win reason: ${e.topWinReason||"value delivered"}
Use real results and transformations from these wins.`},testimonial_request:{id:"testimonial_request",name:"Request Testimonials",category:"marketing",description:"Recent wins ready for testimonial outreach",contentConfig:{type:"offer_teaser",platform:"email",prefilledInstructions:`Create a testimonial request email:
- Reference their specific results/wins
- Make it easy (offer to write a draft they can edit)
- Explain how it helps others like them find you
- Include 2-3 specific questions to guide their response
Keep it short, appreciative, and low-friction.`,suggestedAngle:"testimonial_outreach"},actionText:"Create Testimonial Request"},near_capacity:{id:"near_capacity",name:"Near Capacity",category:"capacity",description:"80%+ of client capacity filled",contentConfig:{type:"offer_teaser",platform:"instagram",prefilledInstructions:`Create scarcity/premium positioning content:
- You're nearly full ({current}/{max} spots)
- This is a good problem (high demand, quality work)
- Hint at limited availability without being pushy
- Position yourself as selective about who you work with
- Invite people to apply/enquire rather than "buy now"
Authentic scarcity builds desire.`,suggestedAngle:"scarcity_positioning"},actionText:"Create Scarcity Post",dynamicContext:e=>`
Current capacity: ${e.current}/${e.max} (${e.utilization}% full)
Use real numbers to create authentic scarcity.`},over_capacity:{id:"over_capacity",name:"Over Capacity",category:"capacity",description:"At or exceeding client capacity",contentConfig:{type:"offer_teaser",platform:"instagram",prefilledInstructions:`Create waitlist/exclusivity content:
- You're currently fully booked
- Opening a waitlist for the right people
- What makes someone a good fit
- The benefit of being on the waitlist (first access, special terms)
Turn overflow into anticipation.`,suggestedAngle:"waitlist_launch"},actionText:"Create Waitlist Post",dynamicContext:e=>`
You're at ${e.utilization}% capacity (${e.current}/${e.max}).
Position this as exclusive, not overwhelmed.`},setup_incomplete:{id:"setup_incomplete",name:"Complete Setup",category:"sales",description:"AI setup not complete",contentConfig:null,actionText:"Complete Setup",actionUrl:"/crm/setup"}};function p(e,t={}){const n=s[e];if(!n||!n.contentConfig)return null;const i={...n.contentConfig};let o=i.prefilledInstructions||"";return t.topLossReason&&(o=o.replace("{topLossReason}",t.topLossReason)),t.competitor&&(o=o.replace("{competitor}",t.competitor)),(t.winReason||t.topWinReason)&&(o=o.replace("{winReason}",t.winReason||t.topWinReason)),t.current&&t.max&&(o=o.replace("{current}",t.current),o=o.replace("{max}",t.max)),n.dynamicContext&&t&&(o+=`

`+n.dynamicContext(t)),i.prefilledInstructions=o,{triggerId:e,triggerName:n.name,...i}}function u(e,t={}){const n=p(e,t);if(!n){const o=s[e];return(o==null?void 0:o.actionUrl)||"/crm/marketing"}const i=new URLSearchParams({trigger:e,type:n.type,platform:n.platform});return n.prefilledInstructions&&i.set("instructions",btoa(encodeURIComponent(n.prefilledInstructions))),Object.keys(t).length>0&&i.set("context",btoa(JSON.stringify(t))),`/crm/content-create?${i.toString()}`}function d(e){const t=e.get("trigger"),n=e.get("type"),i=e.get("platform"),o=e.get("instructions"),a=e.get("context");let r="",c={};try{o&&(r=decodeURIComponent(atob(o))),a&&(c=JSON.parse(atob(a)))}catch(l){console.error("Error parsing trigger params:",l)}return{triggerId:t,type:n,platform:i,instructions:r,triggerContext:c,trigger:t?s[t]:null}}export{s as C,u as b,d as p};
