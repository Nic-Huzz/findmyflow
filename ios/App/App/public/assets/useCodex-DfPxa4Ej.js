import{r as u,s as p}from"./index-CZJs_D_4.js";const _={voiceArchives:{id:"voiceArchives",name:"Voice Archives",icon:"📜",description:"Deep profiles of each Protective Voice",order:1},flowScrolls:{id:"flowScrolls",name:"Flow Scrolls",icon:"⚡",description:"Core teachings of the Vibe Rise philosophy",order:2},founderJourney:{id:"founderJourney",name:"Founder's Journey",icon:"🏔️",description:"Huzz's stories from 5 years of transformation",order:3},ancientWisdom:{id:"ancientWisdom",name:"Ancient Wisdom",icon:"🌏",description:"Timeless traditions that validate your path",order:4}},e={VOICE_IDENTIFIED:"voice_identified",VOICE_FACED:"voice_faced",ONBOARDING_COMPLETE:"onboarding_complete",FLOW_FINDER_COMPLETE:"flow_finder_complete",COMPASS_CHECKIN:"compass_checkin",PLAYGROUND_COUNT:"playground_count",PLAYGROUND_LAYER:"playground_layer",STAGE_REACHED:"stage_reached",DAYS_ACTIVE:"days_active"};function I(n,r){const{unlockTrigger:t,unlockValue:c,altUnlockTrigger:o,altUnlockValue:a}=n;return F(t,c,r)?!0:o?F(o,a,r):!1}function W(n){return n?n.toLowerCase().replace(/\s+/g,"-"):""}function F(n,r,t){var c,o,a;switch(n){case e.VOICE_IDENTIFIED:if(r===!0)return!!t.protectiveVoice;const h=W(t.protectiveVoice),f=W(r);return console.log("[Codex] Voice check:",{userVoice:h,entryVoice:f,match:h===f}),h===f;case e.VOICE_FACED:return(((c=t.groanChallenges)==null?void 0:c.filter(g=>g.voice_targeted===r&&g.status==="completed"))||[]).length>=3;case e.ONBOARDING_COMPLETE:return t.onboardingComplete===!0;case e.FLOW_FINDER_COMPLETE:return t.flowFinderComplete===!0;case e.COMPASS_CHECKIN:return(t.compassCheckins||0)>=1;case e.PLAYGROUND_COUNT:return(((o=t.groanChallenges)==null?void 0:o.filter(g=>g.status==="completed"))||[]).length>=r;case e.PLAYGROUND_LAYER:return(((a=t.groanChallenges)==null?void 0:a.filter(g=>g.visibility_layer===r&&g.status==="completed"))||[]).length>=1;case e.STAGE_REACHED:return(t.currentStage||0)>=r;case e.DAYS_ACTIVE:return(t.daysActive||0)>=r;default:return!1}}function U(n,r,t,c=[]){return r.filter(o=>o.category===n).map(o=>({...o,isUnlocked:c.includes(o.id)||I(o,t)})).sort((o,a)=>(o.order||0)-(a.order||0))}function H(n,r,t,c=[]){const o=r.filter(h=>h.category===n),a=o.filter(h=>c.includes(h.id)||I(h,t)).length;return{unlocked:a,total:o.length,percentage:Math.round(a/o.length*100)}}const J=[{id:"voice_perfectionist",category:"voiceArchives",title:"The Perfectionist",icon:"🎭",order:1,unlockTrigger:e.VOICE_IDENTIFIED,unlockValue:"perfectionist",altUnlockTrigger:e.VOICE_FACED,altUnlockValue:"perfectionist",content:{origin:{title:"The Origin",body:`Before the Matrix taught you that mistakes were dangerous, you tried things freely.

Maybe it was a classroom where your wrong answer drew laughter. A parent whose love felt conditional on your grades. A moment where "good enough" was met with "you can do better." Or perhaps it was subtler—a pattern of praise only when things were perfect, silence when they weren't.

The Perfectionist emerged to protect you. If you never finish, you never fail. If you keep revising, no one can criticize the final version. If you're "still working on it," you're safe from judgment.

And it worked. You became known for quality. For attention to detail. For never shipping something embarrassing.

But protection became paralysis.`},lie:{title:"The Lie It Tells",quote:"You're not ready yet. One more revision. One more course. One more draft.",body:`The Perfectionist speaks in reasonable tones:

- *"Let's just polish this a bit more before anyone sees it."*
- *"You need more credentials first."*
- *"What if there's a typo? What if they find a flaw?"*
- *"This isn't your best work. You know you can do better."*

The cruelest part? It uses your own standards against you. It knows you care about quality, and it weaponizes that care into infinite delay.`},protection:{title:"How It Protected You",body:`The Perfectionist kept you safe by keeping you preparing. In environments where mistakes meant shame, endless preparation was a shield.

**It served you when:**
- Errors led to punishment or ridicule
- Your worth felt tied to your output quality
- "Good enough" was never actually good enough for the people around you
- Perfection was the only path to approval

*Thank the Perfectionist for its service. It protected you from shame when shame felt unbearable.*`},blocking:{title:"Why It's Blocking Your Flow Now",body:`Your unique gift requires shipping to create impact.

The people who need what only you can offer? They're waiting while you revise. The transformation you're meant to create? It can't happen if your work stays in drafts.

**The Perfectionist's cost:**
- Brilliant ideas die in "draft" folders
- You watch others succeed with work worse than yours—because they shipped
- Opportunities pass while you prepare for them
- You're exhausted from the labor of never being done

The tragedy: seeking perfection, you achieve nothing. The imperfect shipped thing would have helped people. The perfect unshipped thing helps no one.`},kryptonite:{title:"The Kryptonite",body:`**Shipping something imperfect. On purpose. In public.**

Not despite the flaws—*because* of them. The Perfectionist dissolves when you prove that imperfect work can still create value, still be received well, still matter.

**Playground challenges that weaken The Perfectionist:**
- Post something with a typo you don't fix
- Share work-in-progress before it's ready
- Launch with a minimum viable version
- Ask for feedback on a rough draft
- Set a timer and ship when it goes off, ready or not

Every imperfect thing you ship is evidence that done beats perfect.`},rewiring:{title:"The Rewiring",quote:"Done is better than perfect. Shipped is better than polished. Real is better than flawless.",body:`The wound of perfectionism becomes the gift of iteration. You know what it costs to wait for perfect—which makes you passionate about helping others ship.

**Affirmation:**
*"Thank you for protecting me from shame. I can handle imperfection now. My work doesn't need to be perfect to be valuable. I ship, I learn, I improve. 3% better each time is the path."*`},heroes:{title:"Heroes Who Faced The Perfectionist",body:`*"I spent two years 'perfecting' my course. When I finally launched, someone asked why I waited so long—the V1 was already better than most things out there. Two years of people who could have been helped, waiting."* — Marcus, The Translator

*"My Perfectionist convinced me I needed one more certification. Then one more. I had five certifications and zero clients. The day I posted 'I help people with X' without being 'ready' was the day my business started."* — Priya, The Bridge Builder`}}},{id:"voice_people_pleaser",category:"voiceArchives",title:"The People Pleaser",icon:"🪞",order:2,unlockTrigger:e.VOICE_IDENTIFIED,unlockValue:"people-pleaser",altUnlockTrigger:e.VOICE_FACED,altUnlockValue:"people-pleaser",content:{origin:{title:"The Origin",body:`Before the Matrix taught you that acceptance required agreement, you had opinions.

Maybe it was a family where peace was kept by compliance. A friendship where your real thoughts cost you belonging. A moment where being yourself led to being excluded. Or perhaps it was subtler—learning that the easiest version of you was the most loved version.

The People Pleaser emerged to protect you. If you agree with everyone, no one rejects you. If you adapt to each room, you always fit in. If you never have a controversial opinion, you're never alone.

And it worked. You became likeable. Easy to be around. Someone who "gets along with everyone."

But protection became erasure.`},lie:{title:"The Lie It Tells",quote:"They won't like the real you. Keep everyone happy. Don't rock the boat.",body:`The People Pleaser speaks in caring tones:

- *"Don't share that opinion—what if they disagree?"*
- *"Just go along with it. It's not worth the conflict."*
- *"They seem to like this version of you. Don't ruin it."*
- *"What if you disappoint them?"*

The cruelest part? It uses your empathy against you. It knows you care about others' feelings, and it weaponizes that care into self-abandonment.`},protection:{title:"How It Protected You",body:`The People Pleaser kept you safe by keeping you agreeable. In environments where authenticity meant rejection, adaptation was survival.

**It served you when:**
- Being yourself led to exclusion or conflict
- Belonging required conformity
- Your opinions weren't welcome or safe
- Love felt conditional on being "easy"

*Thank the People Pleaser for its service. It kept you connected when connection felt fragile.*`},blocking:{title:"Why It's Blocking Your Flow Now",body:`Your unique gift requires you to show up as YOU—not a mirror of what others want.

The people who need what only you can offer? They can't find you if you're shapeshifting. The authentic service you're meant to provide? It requires having a point of view.

**The People Pleaser's cost:**
- You build an audience that likes a version of you that doesn't exist
- You attract clients who want someone you're exhausted pretending to be
- You feel increasingly disconnected from your own preferences
- You say yes to everything and mean none of it

The tragedy: seeking universal approval, you lose yourself. The few who would have loved the real you never get to meet them.`},kryptonite:{title:"The Kryptonite",body:`**Showing up as yourself. Having an opinion. Saying no.**

Not to hurt anyone—but to honor yourself. The People Pleaser dissolves when you prove that authentic you is actually more loveable than performing you.

**Playground challenges that weaken The People Pleaser:**
- Share an unpopular opinion you actually hold
- Say no to something you don't want to do
- Disagree with someone (kindly) in public
- Post content that won't appeal to everyone
- Set a boundary and hold it

Every time you're yourself and still loved, the lie loses power.`},rewiring:{title:"The Rewiring",quote:"The right people will love the real me. The wrong people filtering out is a feature, not a bug.",body:`The wound of people-pleasing becomes the gift of authentic connection. You know what it costs to perform—which makes you passionate about creating spaces where others can be real.

**Affirmation:**
*"Thank you for protecting me from rejection. I can handle not being liked by everyone now. The people who matter will love the real me. My authenticity is the gift, not the risk."*`},heroes:{title:"Heroes Who Faced The People Pleaser",body:`*"I built a following by being what I thought they wanted. It worked—and I was miserable. The day I posted 'here's what I actually think' and lost 200 followers was the day I found my people. The ones who stayed are my actual community."* — Aisha, The Truth-Teller

*"My People Pleaser had me saying yes to every client request. I was exhausted and resentful. The first time I said 'that's not how I work,' I expected to be fired. Instead, they respected me more. Boundaries created trust."* — David, The Grounded Guardian`}}},{id:"voice_controller",category:"voiceArchives",title:"The Controller",icon:"🎮",order:3,unlockTrigger:e.VOICE_IDENTIFIED,unlockValue:"controller",altUnlockTrigger:e.VOICE_FACED,altUnlockValue:"controller",content:{origin:{title:"The Origin",body:`Before the Matrix taught you that uncertainty was dangerous and worth was earned, you embraced the unknown freely.

Maybe it was a childhood where things fell apart without warning. A home where love seemed proportional to achievement. A culture that celebrated "hustle" and shamed rest. Or perhaps it was subtler—an environment where the only safety was in what you could predict, control, and perform.

The Controller emerged to protect you. If you can see all the variables, nothing surprises you. If you're always achieving, you're always worthy. If you manage every outcome and control how people see you, you're never caught off guard and never "not enough."

And it worked. You became prepared, driven, accomplished. Someone who "thinks things through" and "gets things done."

But protection became prison—and exhaustion.`},lie:{title:"The Lie It Tells",quote:"Leaving it to chance isn't an option.",body:`The Controller speaks in logical and motivational tones:

- *"You need more information before you can decide."*
- *"You're falling behind. Everyone else is doing more."*
- *"There are too many unknowns. It's not responsible to proceed."*
- *"Rest is for people who've earned it. You haven't yet."*
- *"I can't let them see me struggle."*

The cruelest part? It uses your intelligence and drive against you. It knows you're capable of seeing risks and achieving goals, and it weaponizes both into relentless control and performance.`},protection:{title:"How It Protected You",body:`The Controller kept you safe by keeping you prepared and productive. In environments where chaos meant pain and worth was conditional, control and achievement were survival.

**It served you when:**
- Unexpected events led to suffering
- Your value felt tied to what you produced
- Chaos in your environment felt dangerous
- Achievement was the only reliable source of approval
- Rest was criticized or shamed

*Thank the Controller for its service. It gave you stability and worth when both felt fragile.*`},blocking:{title:"Why It's Blocking Your Flow Now",body:`Your unique gift requires surrendering to uncertainty and knowing you're already enough.

Flow, by definition, can't be controlled. The sustainable service you're building? It requires energy you're currently burning on managing every outcome and proving yourself.

**The Controller's cost:**
- You over-plan and under-act
- Burnout cycles from never stopping
- Inability to enjoy any win—there's always the next risk to manage
- Rest feels like laziness, spontaneity feels reckless
- Life feels like a series of risk assessments and performance reviews

The tragedy: seeking certainty and enoughness, you get stagnation and exhaustion. You were already enough before you achieved anything.`},kryptonite:{title:"The Kryptonite",body:`**Letting go. Resting without guilt. Trusting others to handle it.**

Not recklessly—but trustingly. The Controller dissolves when you prove that good things can happen without being engineered, and that you're worthy without performing.

**Playground challenges that weaken The Controller:**
- Start something without knowing all the steps
- Take a full day off and tell someone about it
- Let someone else lead while you follow
- Celebrate a small win instead of optimizing
- Do something spontaneous with no backup plan

Every time you surrender control and things work out—every moment you exist without producing and find you're still worthy—the lie weakens.`},rewiring:{title:"The Rewiring",quote:"I can handle whatever comes. My worth is not my work. Uncertainty is where possibility lives.",body:`The wound of chaos and conditional worth becomes the gift of adaptability and presence. You know what it costs to over-control and over-perform—which makes you passionate about helping others trust the process and know they're enough.

**Affirmation:**
*"Thank you for protecting me from chaos and rejection. I can handle uncertainty now. I am enough even when still. Flow requires surrender, and surrender is safe."*`},heroes:{title:"Heroes Who Faced The Controller",body:`*"I had a 47-page business plan. Every contingency mapped. Three years later, I still hadn't started. The day I launched with a one-page 'let's see what happens' approach, my actual business began."* — James, The Cosmic Connector

*"I hit every goal I set—and felt nothing. The day I took a week off with no 'productive' purpose was the hardest thing I'd ever done. Halfway through, I realized I'd been running from stillness my whole life."* — Chris, The Rhythm Architect`}}},{id:"voice_auto_pilot",category:"voiceArchives",title:"The Auto-Pilot",icon:"🛋️",order:4,unlockTrigger:e.VOICE_IDENTIFIED,unlockValue:"auto-pilot",altUnlockTrigger:e.VOICE_FACED,altUnlockValue:"auto-pilot",content:{origin:{title:"The Origin",body:`Before the Matrix wore you down, you wanted things.

Maybe it was years of sustained stress with no resolution. A career that looked successful but felt hollow. A relationship where you stopped asking for what you needed because it never came. Or perhaps it was subtler—a slow accumulation of small surrenders until "I'm fine" became your autopilot response to everything.

The Auto-Pilot emerged to protect you. If you stop feeling, you stop hurting. If you go through the motions, you don't have to face the gap between what you have and what you want. If you check out, the weight of it all becomes bearable.

And it worked. You survived. You kept going. You held it together.

But protection became numbness.`},lie:{title:"The Lie It Tells",quote:"I'm fine, just tired.",body:`The Auto-Pilot barely speaks. That's the point:

- *"It's not that bad. Other people have it worse."*
- *"I don't really want anything. I'm content."*
- *"I'm just tired. I'll feel different after some rest."*
- *"There's no point thinking about it. This is just how it is."*

The cruelest part? It feels like peace. It disguises collapse as contentment, numbness as acceptance, and checking out as "being chill." You don't even know you're in it until someone asks what you actually want and you draw a blank.`},protection:{title:"How It Protected You",body:`The Auto-Pilot kept you safe by keeping you numb. In environments where feeling things fully was too dangerous or exhausting, checking out was survival.

**It served you when:**
- Sustained overwhelm had no resolution
- Wanting things led to disappointment
- You were burning out but couldn't stop
- Feeling the full weight of your situation would have broken you

*Thank the Auto-Pilot for its service. It kept you going when going was all you could do.*`},blocking:{title:"Why It's Blocking Your Flow Now",body:`Your unique gift requires presence. Flow is the opposite of autopilot.

The creative breakthroughs, the genuine connections, the moments of alignment—they all require you to be HERE. Checked in. Feeling things. The service you're meant to provide? It needs the part of you that cares, not the part that's going through the motions.

**The Auto-Pilot's cost:**
- Days blur together with no memorable moments
- You scroll instead of create, numb instead of feel
- Opportunities pass unnoticed because you're not really looking
- Relationships stay surface-level because depth requires presence
- You say "I'm fine" so often you believe it

The tragedy: seeking relief from pain, you lose access to joy. You can't selectively numb. When you check out from the hard stuff, you check out from the good stuff too.`},kryptonite:{title:"The Kryptonite",body:`**Asking yourself "What do I actually want?" and sitting with the answer.**

Not doing anything about it yet. Just letting yourself want something. The Auto-Pilot dissolves when you prove that desire doesn't have to lead to disappointment.

**Playground challenges that weaken The Auto-Pilot:**
- Put your phone down for an hour and notice what you feel
- Write down three things you want (not need—want)
- Do something that requires your full attention
- Tell someone how you actually feel when they ask
- Try something new that has no practical purpose

Every moment of genuine presence is evidence that feeling things is safe.`},rewiring:{title:"The Rewiring",quote:"I am allowed to want things. Feeling is not dangerous. Presence is the antidote.",body:`The wound of overwhelm becomes the gift of compassion. You know what it's like to be so exhausted you check out—which makes you passionate about creating environments where people can come back to themselves gently.

**Affirmation:**
*"Thank you for protecting me from overwhelm. I can feel things now. My desires are valid. I don't have to go through the motions anymore. I choose to be here—present, imperfect, alive."*`},heroes:{title:"Heroes Who Faced The Auto-Pilot",body:`*"Someone asked me what I wanted for dinner and I couldn't answer. Not because I didn't care—because I'd stopped letting myself want anything. That tiny moment cracked something open. I started with dinner. Then bigger things."* — Kai, The Grounded Guardian

*"I spent five years 'fine.' Great job, nice apartment, solid routine. One morning I realized I couldn't remember the last time I felt excited about anything. The Auto-Pilot had kept me safe—and completely disconnected from my own life."* — Elena, The Mystic Messenger`}}},{id:"voice_ghost",category:"voiceArchives",title:"The Ghost",icon:"👻",order:5,unlockTrigger:e.VOICE_IDENTIFIED,unlockValue:"ghost",altUnlockTrigger:e.VOICE_FACED,altUnlockValue:"ghost",content:{origin:{title:"The Origin",body:`Before the Matrix taught you to hide, you were seen.

Maybe it was a classroom where your answer was mocked. A family dinner where your excitement was dismissed. A moment on stage where silence felt like rejection. Or perhaps it was subtler—a pattern of being overlooked until you learned that invisibility was safer than visibility.

The Ghost emerged to protect you. If they can't see you, they can't hurt you. If you stay in the shadows, you're safe from criticism. If you never claim the spotlight, you never have to fear its glare.

And it worked. You survived. You learned to contribute from the sidelines, to let others take credit, to keep your gifts private where they couldn't be judged.

But protection became prison.`},lie:{title:"The Lie It Tells",quote:"Visibility is dangerous. Stay small. Don't attract attention.",body:`The Ghost speaks in whispers:

- *"Don't post that—who do you think you are?"*
- *"Let someone else go first."*
- *"You're not ready to be seen yet."*
- *"What if they think you're showing off?"*

The cruelest part? It uses your humility against you. It knows you don't want to seem arrogant, and it weaponizes that awareness into silence.`},protection:{title:"How It Protected You",body:`The Ghost kept you safe by keeping you hidden. In environments where standing out meant standing alone, invisibility was survival.

**It served you when:**
- Being seen led to criticism or ridicule
- Your authentic expression wasn't welcomed
- Blending in was necessary for belonging
- Visibility felt genuinely unsafe

*Thank the Ghost for its service. It got you here.*`},blocking:{title:"Why It's Blocking Your Flow Now",body:`Your unique gift requires being seen to create impact.

The people who need what only you can offer? They can't find you if you're hiding. The service you're meant to provide? It requires stepping into visibility.

**The Ghost's cost:**
- Your work stays hidden while lesser work gets attention
- You wait for "permission" that never comes
- You undercharge (or don't charge) because pricing requires claiming value
- You help others shine while dimming your own light

The tragedy: seeking safety in invisibility, you achieve irrelevance. The hidden gift helps no one.`},kryptonite:{title:"The Kryptonite",body:`**Being seen anyway.**

Not perfectly. Not when you're "ready." Now. Imperfectly. Visibly.

Every time you post, publish, present, or claim space—and survive—the Ghost learns that visibility isn't death.

**Playground challenges that weaken The Ghost:**
- Share something you made (Screen)
- Speak up in a meeting (Live)
- Put a price on your work (Money)
- Share a struggle publicly (Vulnerable)
- Claim expertise in your area (Authority)

Every visibility action is evidence that being seen is safe.`},rewiring:{title:"The Rewiring",quote:"I am safe to be seen. My visibility serves others. The world needs what I'm hiding.",body:`The wound of invisibility becomes the gift of visibility. You know what it's like to be overlooked—which makes you passionate about helping others be seen.

**Affirmation:**
*"Thank you for protecting me from danger. I can handle being seen now. My visibility isn't arrogance—it's service. The people who need me can only find me if I'm findable."*`},heroes:{title:"Heroes Who Faced The Ghost",body:`*"I spent 15 years letting my coworkers present my ideas. When I finally started posting my own thoughts, I expected attacks. Instead, I found my people."* — Sarah, The Translator

*"The Ghost told me authority meant arrogance. Turns out, claiming my expertise was the most generous thing I could do for my clients. They needed someone confident in what they knew."* — Marcus, The Wise Sage`}}}],z=[{id:"scroll_four_directions",category:"flowScrolls",title:"The Four Directions",icon:"🧭",order:1,unlockTrigger:e.COMPASS_CHECKIN,unlockValue:1,content:{teaching:{title:"The Teaching",body:`Your energy speaks a language. The Flow Compass translates it.

Every moment, you exist at the intersection of two axes:
- **Ease ↔ Resistance**: Is the path feeling open or blocked?
- **Excited ↔ Tired**: Is your energy charged or depleted?

These create four directions, each with wisdom:

**North (Ease + Excited)** — You're in Flow. The work feels like play. Time distorts. This is alignment. *Action: Stay here as long as possible. This is where magic happens.*

**East (Resistance + Excited)** — You're at a growth edge. Something excites you but also scares you. This is expansion territory. *Action: Push through. This resistance is the good kind—the groan before play.*

**West (Ease + Tired)** — You're in recovery. Things feel gentle but you're depleted. This is restoration. *Action: Honor it. Rest now so you can flow later. This isn't laziness—it's refueling.*

**South (Resistance + Tired)** — You're depleted AND blocked. This is the danger zone. Pushing here causes damage. *Action: Stop. Full stop. Forcing through South creates burnout. Rest is mandatory, not optional.*

The compass doesn't judge. It observes. Your job is to listen.`},matters:{title:"Why This Matters",body:`Most people treat all resistance the same: something to push through. But resistance when you're excited (East) is completely different from resistance when you're tired (South).

One is a growth edge. The other is a warning.

The Four Directions give you language for what your body already knows. When you can name your state, you can respond appropriately instead of defaulting to "just push harder."

Flow isn't about eliminating resistance. It's about knowing which direction you're facing—and acting accordingly.`},practice:{title:"The Practice",body:`Check in regularly. Ask yourself:

1. **Ease or Resistance?** Is the current path feeling open or blocked?
2. **Excited or Tired?** Is my energy tank full or empty?
3. **What direction am I facing?** Name it: North, East, West, or South.
4. **What does this direction need?** Flow, push, rest, or stop?

The more you check in, the more fluent you become in your own energy language. Eventually, you'll sense your direction without thinking.

*"The wise person doesn't fight the current. They learn to read it."*`}}},{id:"scroll_flow_equation",category:"flowScrolls",title:"The Flow Equation",icon:"✨",order:2,unlockTrigger:e.FLOW_FINDER_COMPLETE,unlockValue:!0,content:{teaching:{title:"The Teaching",body:`Your Flow isn't random. It's mathematical.

**Flow = Skills × Problems × People**

- **Skills**: What comes naturally to you. Your innate gifts—clarifying, creating, connecting, building. These aren't learned; they're revealed.

- **Problems**: What lights you up to solve. The injustices that activate you, the challenges you can't help but address.

- **People**: Who you're meant to serve. The specific humans whose struggles resonate with your story, whose transformation you're uniquely equipped to enable.

When these three align, you experience Flow:
- Work feels like play
- Time distorts
- Energy is generated, not depleted
- Impact happens naturally

This isn't woo. It's alignment. When you're operating from your unique combination, you become irreplaceable. No one else has your exact Skills solving your exact Problems for your exact People.

This is your competitive advantage disguised as joy.`},matters:{title:"Why This Matters",body:`The Matrix taught you to separate these three:
- Pick skills that are "marketable," not natural
- Solve problems that pay well, not that light you up
- Serve whoever will pay, not who you're called to help

The result? You might succeed—but you'll be drained. Successful and exhausted. Accomplished and empty.

The Flow Equation reveals a different path: instead of forcing yourself into market demand, find where your natural genius intersects with real need. Instead of asking "what should I do?", ask "what am I already wired to do that creates value?"

Your Flow already exists. The Flow Finder just helped you see it.`},practice:{title:"The Practice",body:`Return to your Flow Equation when you feel lost:

1. **Skills check**: Am I using my natural gifts, or forcing skills that don't fit?
2. **Problems check**: Does this problem actually light me up, or am I solving it for the wrong reasons?
3. **People check**: Are these my people, or just available people?

When all three align, you'll feel it. That sense of "this is exactly what I should be doing"—that's the equation balancing.

When something feels off, one of the three is likely misaligned. Identify which one, and adjust.

*"Your Flow is unique because YOU are unique. No one else has your equation."*`}}},{id:"scroll_groan_decoded",category:"flowScrolls",title:"The Groan Decoded",icon:"😬",order:3,unlockTrigger:e.PLAYGROUND_COUNT,unlockValue:5,content:{teaching:{title:"The Teaching",body:`The Groan is not the enemy. It's the doorway.

When you approach something that's authentically YOU—something that would feel like play if you weren't terrified—you feel a specific resistance. That's the Groan.

It's the sound your Protective Voices make when you approach the thing they've been guarding you from: *being fully yourself in public.*

**Why the Groan matters:**

The things that make you groan are the things most aligned with your essence. The more authentic the activity, the more vulnerable it feels. The more vulnerable, the more your Protective Voices resist.

This creates a paradox: *the things that would feel most like play are the things that feel most scary.*

**The Groan Equation:**

Authenticity → Vulnerability → Potential Pain → Protective Voice Activation → The Groan

**The Groan Translation:**

When you feel the Groan, your essence is saying: *"This is me! This is play!"*
While your Protective Voices are saying: *"Danger! We've been hurt here before!"*

The Groan is the collision of desire and fear. It's not a stop sign. It's a "this matters" sign.`},matters:{title:"Why This Matters",body:`Most people misread the Groan. They feel the resistance and think: "I must not want this" or "This isn't for me."

Wrong.

The Groan indicates the opposite: this is SO for you that your protection systems are triggered. If it didn't matter, you wouldn't feel anything.

Understanding the Groan changes everything:
- Instead of avoiding what makes you uncomfortable, you investigate it
- Instead of trusting the fear, you question it
- Instead of staying small, you recognize the Groan as a map to expansion

Your Protective Voices aren't evil—they're outdated. They learned to fear visibility, judgment, and failure in contexts where those fears made sense. But you're not in those contexts anymore.

The Groan is your compass to growth. Follow it.`},practice:{title:"The Practice",body:`When you feel the Groan:

1. **Name it**: "I'm feeling the Groan right now."
2. **Locate it**: Where in your body is the resistance? Chest? Stomach? Throat?
3. **Identify the voice**: Which Protective Voice is activating? What's it telling you?
4. **Question the narrative**: Is this actually dangerous, or does it just feel that way because of old conditioning?
5. **Take one small step**: You don't have to do the whole scary thing. Just the next inch.

The Groan gets quieter each time you move through it. Not because you stop caring—but because you prove to your nervous system that the scary thing is actually safe.

*"The Groan is the sound of your comfort zone stretching. It means you're growing."*`}}},{id:"scroll_visibility_ladder",category:"flowScrolls",title:"The Visibility Ladder",icon:"🪜",order:4,unlockTrigger:e.PLAYGROUND_LAYER,unlockValue:"live",content:{teaching:{title:"The Teaching",body:`Visibility isn't binary. It's a ladder with five rungs.

Each rung represents a deeper level of owning your identity publicly:

**1. Screen** — Owning your identity behind a screen. Lowest risk—you can edit, delete, hide.
*"I post about this topic."*

**2. Live** — Owning your identity in person, in real-time. Can't take it back.
*"I talk about this in rooms."*

**3. Money** — Claiming your identity is worth paying for. "I'm good enough to charge."
*"People pay me to do this."*

**4. Vulnerable** — Owning your identity even when imperfect. Showing the struggle, not just the wins.
*"This is me, including the messy parts."*

**5. Authority** — Fully owning: "This is who I am." Complete identity ownership.
*"I am THE person who does this."*

Each rung feels scarier because each rung is a bigger claim. You're not just doing a thing—you're saying "this is me" at increasing volumes.`},matters:{title:"Why This Matters",body:`Your Protective Voices don't just fear visibility—they fear specific *levels* of visibility.

Someone might be fine posting (Screen) but terrified of going live (Live). Another might charge clients (Money) but never share their struggles (Vulnerable).

The ladder shows you exactly where your edges are. Where visibility stops feeling safe and starts triggering your protection systems.

The goal isn't to rush to the top. It's to:
1. Know where you currently are
2. Understand what's blocking the next rung
3. Take deliberate steps upward, at your own pace

Each rung you climb doesn't just increase your visibility—it increases your ownership of your identity. You're not just being seen more; you're claiming who you are more fully.`},practice:{title:"The Practice",body:`Assess your current position on the ladder:

1. **Which rung feels comfortable?** That's your baseline.
2. **Which rung feels possible but scary?** That's your growth edge.
3. **Which rung feels absolutely terrifying?** That's where your deepest Protective Voices live.

Then, work one rung at a time:
- If Screen feels scary, start there
- If Screen is easy but Live terrifies you, that's your next challenge
- Don't skip rungs—build evidence at each level

The goal: sustainable ascent. Not a sprint to Authority, but a steady climb where each rung becomes solid ground for the next.

*"The ladder isn't about being seen by more people. It's about being seen as more fully yourself."*`}}},{id:"scroll_energy_alchemy",category:"flowScrolls",title:"Energy Alchemy",icon:"⚗️",order:5,unlockTrigger:e.STAGE_REACHED,unlockValue:3,content:{teaching:{title:"The Teaching",body:`You don't manage time. You manage energy.

The most productive people don't work more hours. They align their energy with their activities. They know when to push (East), when to flow (North), when to rest (West), and when to stop (South).

**Energy Alchemy is the art of matching activity to state:**

- **High energy + High stakes**: Do the work that matters most when you're in North/East. This is when insight happens, when creative breakthroughs occur, when difficult conversations go well.

- **Low energy + Low stakes**: Save admin tasks, routine work, and easy decisions for when you're depleted. Don't waste your peak hours on email.

- **Tired**: Honor it before you hit South. Rest proactively, not reactively. The person who rests at 80% capacity maintains momentum. The person who waits until 10% crashes.

- **South state**: Stop. Completely. No exceptions. Working in South doesn't just produce bad work—it creates debt you'll pay later. Every hour forced in South costs multiple hours of recovery.

**The Alchemy:**

You're not trying to always be in North. You're trying to flow between states intentionally, extracting value from each phase of the cycle.`},matters:{title:"Why This Matters",body:`The Matrix taught you that energy is unlimited and willpower is the answer. "Just push through." "Sleep is for the weak." "Hustle harder."

This is a lie that creates burnout.

Energy is a renewable but limited resource. Like a battery, it depletes with use and recharges with rest. The quality of your work depends more on your energy state than your effort level.

Energy Alchemy means:
- Your best hours go to your most important work
- You don't fight your rhythms—you design around them
- Rest is scheduled, not accidental
- Burnout becomes preventable, not inevitable

You can't control how much time you have. You can control how you spend your energy.`},practice:{title:"The Practice",body:`Start noticing your patterns:

1. **Map your energy peaks**: When in the day/week are you most likely to be in North or East?
2. **Protect those windows**: Block them for your highest-leverage work.
3. **Front-load difficulty**: Do the scariest thing when you have the most energy.
4. **Schedule rest**: Don't leave it to chance. Put recovery in the calendar.
5. **Respect South**: When you hit South, stop. No negotiations.

The goal is to become fluent in your own energy language. To know, without checking, what state you're in and what it needs.

*"The alchemist doesn't create energy from nothing. They transform what's available into what's needed."*`}}},{id:"scroll_play_as_portal",category:"flowScrolls",title:"Play as Portal",icon:"🎮",order:6,unlockTrigger:e.PLAYGROUND_COUNT,unlockValue:10,content:{teaching:{title:"The Teaching",body:`Play is not the opposite of work. It's the highest form of it.

The Matrix taught you that play is frivolous—a reward you earn after "real" work is done. That serious people do serious things. That fun and productivity are opposites.

This is backwards.

**The truth about play:**

- Play is what happens when effort and joy merge
- Play is how children learn everything important
- Play is where creativity lives
- Play is the state where your best work emerges

When you're playing, you're not forcing anything. You're in flow. You're experimenting without fear. You're fully present because you're fully engaged.

**The Play Portal:**

Your essence knows what feels like play. Those activities—the ones that light you up, that you'd do for free, that make time disappear—those aren't distractions from your purpose.

*They ARE your purpose.*

The play you've been denying yourself? That's the portal to your Flow. The things you dismissed as "not serious enough"? Those are clues to your unique gift.`},matters:{title:"Why This Matters",body:`Most burnt-out professionals have something in common: they've systematically eliminated play from their lives.

They chose the "responsible" path over the joyful one. They picked careers for practicality, not passion. They scheduled play last—and it never made the list.

The result? They're successful and miserable. Accomplished and drained. They've built lives they don't want to live.

Play as Portal offers a different frame:
- What if the playful path was also the prosperous one?
- What if your joy was a compass, not a distraction?
- What if the thing you'd do for free was also the thing people would pay most for?

Your unique gift lives where play lives. The Playground isn't a detour from your hero's journey—it's the path itself.`},practice:{title:"The Practice",body:`Reconnect with play:

1. **List what felt like play as a child**. Before anyone told you to be serious, what did you gravitate toward?

2. **Notice what feels like play now**. What activities make you lose track of time? What would you do if no one was watching and no money was involved?

3. **Find the overlap**. Where do those playful activities intersect with your skills, the problems you want to solve, and the people you want to serve?

4. **Build from play**. Instead of asking "what should I do?", ask "what would be playful?" Then find a way to create value from that play.

The Playground challenges aren't separate from your business building. They're teaching you to reclaim the play you abandoned—and build something sustainable from it.

*"The master has failed more times than the beginner has tried. And the master was playing the whole time."*`}}},{id:"scroll_service_threshold",category:"flowScrolls",title:"The Service Threshold",icon:"🚪",order:7,unlockTrigger:e.STAGE_REACHED,unlockValue:6,content:{teaching:{title:"The Teaching",body:`There's a moment in every hero's journey where discovery ends and service begins.

You've found your Flow. You've faced your Protective Voices. You've built something real. Now comes the threshold: *using what you've learned to serve others.*

**This is not about "giving back":**

The Service Threshold isn't charity or obligation. It's the natural completion of the cycle. You received transformation; now you transmit it. Not because you should, but because that's what transformation wants to do—spread.

**The three shifts at the threshold:**

1. **From "what do I need?" to "what do they need?"** — Your focus moves from your own journey to enabling others' journeys.

2. **From practice to application** — You've been training. Now the training has a target: real humans with real problems you can solve.

3. **From receiving to giving** — You've been filled. Now you pour.

**The paradox of service:**

Service isn't sacrifice. When you serve from your Flow, you're not depleted—you're energized. You're not giving something up; you're expressing something that wants to be expressed. The service IS the gift to you.`},matters:{title:"Why This Matters",body:`Many people get stuck in perpetual preparation. They keep learning, keep growing, keep developing—but never actually serve.

This is The Perfectionist wearing a spiritual mask: "I'm not ready to help others yet. I need more healing. More training. More certification."

The Service Threshold says: enough. You have enough. You are enough. Someone out there needs exactly what you have right now—not what you'll have in five years.

Crossing the threshold changes everything:
- Your work gets real feedback, not theoretical scenarios
- Your growth accelerates because you're applying, not just learning
- Your purpose becomes tangible—you can see your impact
- Your income becomes possible—value creates exchange

Discovery without service is self-indulgence. Service without discovery is burnout. The hero's journey includes both.`},practice:{title:"The Practice",body:`Signs you're ready to cross the threshold:

1. **You've completed your Flow Finder** and know your unique combination
2. **You've faced your Protective Voices** in the Playground
3. **You have something to offer**—even if it feels small or imperfect
4. **Someone out there would benefit** from what you've learned

How to cross:

1. **Name your offer**: What specific transformation can you help with?
2. **Identify your first person**: Who specifically needs this? (Not "everyone"—someone.)
3. **Reach out**: Make contact. Offer help. Start a conversation.
4. **Deliver value**: Actually help them. Serve first, figure out sustainability second.
5. **Iterate**: Learn from the service. What worked? What didn't? Adjust.

The first service doesn't need to be perfect. It needs to be real. A real person, really helped, by the real you.

*"You don't wait until you're healed to help others. The helping IS the healing."*`}}},{id:"scroll_protective_bargain",category:"flowScrolls",title:"The Protective Bargain",icon:"🤝",order:8,unlockTrigger:e.VOICE_IDENTIFIED,unlockValue:!0,content:{teaching:{title:"The Teaching",body:`Your Protective Voices didn't appear to limit you. They appeared to save you.

Long before you could understand what was happening, your psyche made a bargain: "I will develop this protection pattern in exchange for survival."

**The five bargains:**

- **The Perfectionist's Bargain**: "I will never finish, in exchange for never failing publicly."
- **The People Pleaser's Bargain**: "I will abandon my needs, in exchange for never being rejected."
- **The Controller's Bargain**: "I will avoid all uncertainty, in exchange for never being blindsided."
- **The Performer's Bargain**: "I will never stop achieving, in exchange for never feeling worthless."
- **The Ghost's Bargain**: "I will stay invisible, in exchange for never being attacked."

**At the time, these bargains made sense.**

You were a child in an environment where failure, rejection, uncertainty, worthlessness, or visibility actually DID lead to pain. The bargain was adaptive. The Protective Voice was a solution.

But the environment changed. You grew up. You left. And the Protective Voice... didn't get the memo.`},matters:{title:"Why This Matters",body:`Understanding the bargain changes how you relate to your Protective Voice.

It's not a villain to defeat. It's a protector to retire.

**The difference:**

- If it's a villain, you fight it. (This creates internal war.)
- If it's a protector, you thank it. (This creates integration.)

Your Protective Voice has been working 24/7 for decades, trying to keep you safe from something that hurt you once. It doesn't know the danger has passed. It doesn't know you're strong enough now.

Your job isn't to kill the voice. It's to update its mission. To say: "Thank you for protecting me. I understand why you did it. But I'm safe now, and I need you to stand down."

This isn't weakness. It's evolution. The protection that saved child-you is limiting adult-you. Time to renegotiate.`},practice:{title:"The Practice",body:`Have the conversation with your Protective Voice:

1. **Acknowledge its origin**: "I know you developed to protect me from [specific pain]."

2. **Thank it for service**: "You kept me safe when I couldn't protect myself. Thank you."

3. **Update the situation**: "The environment has changed. I'm stronger now. That danger has passed."

4. **Request a new role**: "Instead of blocking me, can you watch and let me know if real danger appears? Your wisdom is welcome. Your control is not."

5. **Take action anyway**: "I'm going to do this now. You can come along, but you don't get to drive."

This isn't a one-time conversation. The Protective Voice has momentum. You'll need to renegotiate many times. But each time, it gets easier. Each time, the voice learns that safety is possible without complete control.

*"The goal isn't to silence the voice. It's to change your relationship with it—from prisoner and guard to adult collaborators."*`}}}],K=[{id:"founder_earthquake",category:"founderJourney",title:"The Earthquake",subtitle:"When everything I believed stopped being true",icon:"🌋",order:1,unlockTrigger:e.ONBOARDING_COMPLETE,unlockValue:!0,content:{moment:{title:"The Moment",body:`I had done everything right.

Final year of university, I'd landed what I thought was my dream job—an adventure capital firm that merged my two passions: education and business. This was the goal. This was what following the path was supposed to deliver.

When they offered me the full-time role after graduation, I said yes without hesitation. This was the moment I'd been working toward my whole life.

One month in, something was wrong.

I wasn't happy. I wasn't fulfilled. The joy I'd been promised—the joy that was supposed to come from following the rules, getting good grades, landing the good job—it wasn't there.

And then it hit me. Not like a realization. Like an earthquake.

**Every building of understanding I had about how the world worked—crumbled.**

I'd trusted the process. School → university → internships → good job → happiness. I'd done each step. And now, standing in the rubble of that broken promise, I had nothing but questions:

*Who am I?*
*What's my purpose?*
*What am I doing with my life?*
*Why is everyone walking this path if it doesn't lead where they said it would?*

That earthquake was the most disorienting experience of my life. And the most important one.`},lesson:{title:"The Lesson",body:`The earthquake wasn't punishment. It was initiation.

Looking back, I can see what I couldn't see then: the path I was on would never have led to fulfillment. It was optimized for safety, not alignment. For approval, not expression. For fitting in, not standing out.

The earthquake destroyed my trust in the prescribed path. That destruction was necessary. You can't build a new life on the foundation of beliefs that don't serve you.

**What I learned:**

- The traditional path isn't designed to make you happy. It's designed to make you predictable.
- The feeling that "something is wrong" isn't a flaw to fix. It's wisdom to follow.
- The buildings that fell were supposed to fall. They were blocking my view.

That month of confusion—of having no idea who I was or what I wanted—was the beginning of everything. The earthquake cleared the ground for what came next.`},forYou:{title:"For Your Journey",body:`If you've felt the earthquake—if everything you believed has started to shake—you're not broken. You're waking up.

The disorientation is real. The questions without answers are uncomfortable. The loss of your old story is a kind of grief.

But here's what I want you to know: **the earthquake is the beginning, not the end.**

On the other side of this destruction is a new foundation. One you build yourself, based on what's actually true for you—not what you were told should be true.

You're not in crisis. You're in transformation. The difference is perspective.

*"The earthquake doesn't destroy who you are. It destroys who you were pretending to be."*`}}},{id:"founder_knowledge_trap",category:"founderJourney",title:"The Knowledge Trap",subtitle:"42 courses and $30,000 later, still stuck",icon:"📚",order:2,unlockTrigger:e.FLOW_FINDER_COMPLETE,unlockValue:!0,content:{moment:{title:"The Moment",body:`After the earthquake, I did what I'd always done when facing a problem: I tried to learn my way out of it.

Course after course. Program after program. Each one promising the answer I was looking for.

*"This course will help you find your purpose."*
*"This program will show you how to build a business."*
*"This framework will change your life."*

I believed every single promise. I paid for every single solution.

**The final count: 42 learning experiences. $30,000 spent. Three years invested.**

And at the end of it all, I found myself in the exact same place I started.

Still confused. Still stuck. Still waiting for the knowledge that would finally click.

I had notebooks full of frameworks. Folders full of worksheets. A brain full of concepts. And nothing—*nothing*—in my external reality had changed.

That's when I realized: **the problem wasn't a lack of knowledge. It was a lack of action.**

All those courses taught me what to do. None of them helped me actually do it. I was using learning as a hiding place—a sophisticated form of procrastination that felt productive but produced nothing.`},lesson:{title:"The Lesson",body:`**Transformation doesn't happen from knowledge acquisition. It happens from taking action.**

I was trapped in what I now call the Knowledge Trap: the belief that if you just learn enough, you'll finally be ready. One more course. One more framework. One more certification. Then you can start.

The trap is this: there's always more to learn. The goal post always moves. Readiness never arrives.

**What I learned:**

- Knowledge without action is entertainment, not education.
- The feeling of "learning" can masquerade as progress while nothing actually changes.
- At some point, the answer isn't in another course—it's in the thing you already know you need to do but haven't done.
- Action reveals more than theory ever could. You learn by doing, not by preparing to do.

The moment I stopped learning *about* action and started *taking* action, everything shifted. Three years of courses hadn't moved me an inch. Three months of action moved me further than I'd ever been.`},forYou:{title:"For Your Journey",body:`If you're addicted to learning—if you have shelves of books and folders of courses but still feel stuck—you might be in the Knowledge Trap.

Ask yourself: **Am I learning to grow, or learning to hide?**

There's nothing wrong with education. The problem is using it as a shield against the scary thing you know you need to do.

You probably already know enough to take the next step. The knowledge isn't what's missing. The courage is.

Here's what finally worked for me: I stopped asking "what do I need to learn?" and started asking "what am I avoiding by learning?"

The answer to that question led to my next action. And action—not knowledge—is where transformation lives.

*"You don't need another course. You need to do the thing the last course told you to do."*`}}},{id:"founder_fear_challenge",category:"founderJourney",title:"The Fear Challenge",subtitle:"52 weeks of terrifying actions that changed everything",icon:"🎯",order:3,unlockTrigger:e.PLAYGROUND_COUNT,unlockValue:1,content:{moment:{title:"The Moment",body:`After realizing that knowledge wasn't the answer, I made myself a promise:

**Do one thing per week that absolutely terrifies you. For one year. No exceptions.**

I didn't have a plan. I didn't have a framework. I just knew that whatever I'd been doing wasn't working, and fear seemed to be the common thread holding me back.

The first few weeks were small things—speaking up in meetings, sharing opinions I'd normally swallow. Then they got bigger.

**Within 4 weeks:** I was working from Bali.

**Within 3 months:** I had quit my job.

**Within 5 months:** I was funding my life traveling Thailand and Bali, hosting silent discos on beaches.

I hadn't planned any of this. I had no strategy for location freedom or entrepreneurship. I was just following the fear—doing the thing that scared me, week after week, and watching what opened up.

That year of fear challenges compressed five years of growth into twelve months. Every terrifying action expanded what my nervous system felt safe doing. And as my comfort zone grew, my life grew with it.`},lesson:{title:"The Lesson",body:`**We don't rise to the level of our ambitions. We fall to the level of what we feel safe doing.**

This is the insight that changed everything.

I had big ambitions. I'd always had big ambitions. But my nervous system had a smaller map of what was safe. And no matter how ambitious my plans, my actions stayed within that map.

The fear challenges rewired the map. Every scary thing I did and survived taught my nervous system: *"This is safe too."* The map grew. My actions could finally match my ambitions.

**What I learned:**

- Courage isn't the absence of fear. It's action despite fear.
- Your comfort zone isn't a reflection of your capability. It's a reflection of your conditioning.
- The things that terrify you are often precisely the things that would transform your life.
- Fear is a compass. It points toward growth.

I didn't become less afraid. I became willing to be afraid and move anyway. That willingness changed everything.`},forYou:{title:"For Your Journey",body:`You don't need to do 52 weeks of fear challenges (though you could).

You just need to do *one*.

What's the thing you know you should do, that terrifies you, that you've been avoiding?

That's your first challenge. Not because you need to be reckless, but because that specific fear is blocking your specific growth.

Here's the secret: the anticipated fear is almost always worse than the actual experience. You imagine catastrophe; you get discomfort. The imagination is crueler than reality.

And here's the gift: every time you move through fear and survive, your nervous system updates its map. What was terrifying becomes tolerable. What was tolerable becomes comfortable. What was comfortable becomes boring—and you need a new edge to grow against.

That's the game. That's the Playground. That's how you expand into who you're meant to become.

*"The life you want is on the other side of the fear you're avoiding."*`}}},{id:"founder_identity_flip",category:"founderJourney",title:"The Identity Flip",subtitle:"When not doing the scary thing became scarier than doing it",icon:"🔄",order:4,unlockTrigger:e.PLAYGROUND_COUNT,unlockValue:10,content:{moment:{title:"The Moment",body:`Somewhere around week 15 of the fear challenge, something strange happened.

I was scheduled to perform a magic show at an open mic. I'd learned a few tricks specifically for this challenge. Standing backstage, I felt the familiar terror—hands shaking, heart racing, voice in my head screaming "don't do this."

But this time, there was another voice. Louder.

*"You're someone who does scary things. That's who you are now. If you don't go up there, you break that identity."*

And suddenly, the fear flipped.

**Not doing the scary thing felt scarier than doing it.**

The pain of breaking my streak—of losing my identity as "someone who shows up despite fear"—was worse than the pain of the fear itself.

I did the magic show. It was awkward and imperfect. But I walked off stage knowing something had fundamentally shifted. I wasn't just doing scary things anymore. I had *become* someone who does scary things. The action had become identity.`},lesson:{title:"The Lesson",body:`**Identity is the ultimate motivator.**

Before the flip, I was motivated by external goals: quit my job, travel, build freedom. These were nice, but they were distant. They didn't get me out of bed when fear was screaming.

After the flip, I was motivated by who I had become. Every scary thing wasn't just an action—it was evidence. Proof that I was the kind of person who does hard things. And not doing them threatened that proof.

**What I learned:**

- Action creates identity. Do the thing enough times and you become someone who does that thing.
- Identity creates action. Once you ARE someone who does that thing, not doing it feels wrong.
- The goal isn't just to complete challenges—it's to become someone who challenges themselves.
- The streak matters because breaking it breaks the story you're telling yourself about who you are.

This is the magic of the Playground. It's not just about facing fears—it's about building an identity as someone who faces fears. And that identity, once formed, makes the scary path feel like the only path.`},forYou:{title:"For Your Journey",body:`The Identity Flip doesn't happen immediately. You can't force it. But you can create conditions for it.

**How to accelerate the flip:**

1. **Track your actions visibly**. The streak isn't vanity—it's evidence. When you can see "I've done 10 scary things," you start to believe you're someone who does scary things.

2. **Claim the identity early**. Don't wait until you feel ready. Say "I'm someone who does scary things" before it feels fully true. The claim creates pressure to match.

3. **Make it costly to quit**. Tell people about your challenge. Public commitment raises the stakes of stopping.

4. **Notice the dissonance**. When you feel the flip starting—when NOT doing the scary thing feels worse—pay attention. That's the identity forming.

The goal isn't to be fearless. The goal is to become someone for whom action despite fear is simply "what I do." That identity, once established, carries you through challenges you can't yet imagine.

*"You don't decide to change. You decide to act, and the acting changes you."*`}}},{id:"founder_money_shift",category:"founderJourney",title:"The Money Shift",subtitle:"Learning to be paid for what I loved",icon:"💰",order:5,unlockTrigger:e.PLAYGROUND_LAYER,unlockValue:"money",content:{moment:{title:"The Moment",body:`I was hosting silent discos on beaches in Southeast Asia. People were dancing under the stars, headphones on, huge smiles on their faces. I was having the time of my life.

Afterwards, people would come up to me: *"That was amazing! How much do I owe you?"*

And every time, I'd say: *"Nothing. Don't worry about it."*

**I physically couldn't accept money.** Something in me believed that if I loved doing it, I shouldn't charge for it. That getting paid would somehow taint the joy. That I wasn't "professional" enough to warrant payment.

My friends finally confronted me: *"Nic, people are literally trying to give you money. Why are you rejecting it?"*

I didn't have a good answer. Just discomfort.

So I made it a groan challenge: **Accept payment for the next silent disco. No refusing.**

The next event, when someone offered money, I felt the familiar urge to wave it away. Instead, I said: *"Thank you."* And I took it.

Nothing bad happened. The joy didn't disappear. The magic didn't break. And suddenly I was being funded to do what I loved.`},lesson:{title:"The Lesson",body:`**You CAN be paid for having fun. Joy and income are not opposites.**

I'd absorbed a belief from somewhere: serious work deserves serious pay; fun work doesn't deserve anything. Real professionals don't enjoy their jobs. If it's play, it can't be valuable.

This is a lie that keeps people stuck in jobs they hate, believing that money requires misery.

**What I learned:**

- The things you would do for free are often exactly the things people will pay for.
- Your joy doesn't reduce the value you create—it often increases it.
- Rejecting payment isn't humility. It's a Protective Voice keeping you small.
- The Money layer of visibility isn't about greed. It's about claiming that your gifts have worth.

The shift wasn't about becoming money-focused. It was about releasing the false belief that separated joy from income. They can coexist. In fact, when they do, that's Flow.`},forYou:{title:"For Your Journey",body:`Do you have trouble charging for what you do? Do you discount your rates, give away your work, or feel uncomfortable when payment is offered?

That's The Ghost or The People Pleaser at the Money layer—telling you that visibility at that level is dangerous. That claiming your worth is arrogant. That money and meaning can't mix.

**Questions to ask yourself:**

- What would I do for free that others might pay for?
- What belief makes me uncomfortable accepting money for my gifts?
- Who told me that work should be separate from joy?

The Money shift isn't about becoming mercenary. It's about removing false limits. You deserve to be paid for the value you create, even when—*especially when*—creating that value feels like play.

The first time you accept money for something you love, it changes your entire relationship with work. Not because you become greedy, but because you realize: *this can be my life.*

*"The world pays for value, not for suffering. Your joy is a feature, not a bug."*`}}},{id:"founder_purgatory",category:"founderJourney",title:"The Purgatory",subtitle:"18 months of being neither old-me nor new-me",icon:"🌫️",order:6,unlockTrigger:e.DAYS_ACTIVE,unlockValue:14,content:{moment:{title:"The Moment",body:`There's a part of the journey no one warns you about.

After the earthquake, I spent 18 months in what I can only call **purgatory**: a liminal space where I was no longer the old me, but hadn't yet become the new me.

Around new people—in online courses, at events—I could show up as this emerging version of myself. They didn't know the old Nic. They only saw who I was becoming.

But around old friends and family? I became a disaster.

**I was a bad version of my new self AND a bad imposter of my old self.**

With people who knew the old me, I couldn't be fully authentic—it felt too vulnerable, too different from who they expected. But I also couldn't pretend to be the old me anymore. That person was gone.

So I'd show up as this awkward hybrid: half-authentic, half-performing. Satisfying no one, especially myself.

I started avoiding situations with old connections. It was easier to isolate than to navigate the dissonance. For 18 months, I felt profoundly alone—unable to go back, unable to fully step forward.`},lesson:{title:"The Lesson",body:`**Transformation has a messy middle. The purgatory is part of the path.**

I thought transformation would be clean: old-me would die, new-me would be born, and I'd continue seamlessly. That's not how it works.

The middle is uncomfortable. You lose your old identity before the new one is stable. People who loved the old you don't know how to relate to this stranger. You don't know how to relate to yourself.

**What I learned:**

- The purgatory isn't failure. It's transition.
- Not everyone from your old life will make it to your new life. That's okay.
- The discomfort of being half-formed is temporary. Keep going.
- New communities help. Find people who only know the becoming-you.
- The fear challenges shortened my purgatory. Action accelerates identity formation.

If I hadn't eventually pushed through—through the fear challenges, through the awkwardness—I might have stayed in purgatory forever. Some people do. They get stuck between who they were and who they could be, unable to commit to either.`},forYou:{title:"For Your Journey",body:`If you're in the purgatory right now—if you feel caught between versions of yourself, unable to go back but unsure how to go forward—know this:

**It's temporary. And it's necessary.**

You can't skip this phase. You can only move through it. And the way through is action, not contemplation.

**What helps in the purgatory:**

1. **Find new people** who only know the becoming-you. This group can hold your new identity while it stabilizes.

2. **Be patient with old relationships**. Some will evolve with you. Some won't. You can't force it.

3. **Don't isolate completely**. The temptation is to hide until you've "figured it out." This extends the purgatory.

4. **Take the scary actions**. Each one makes the new identity more real, more solid, more you.

The purgatory ends when your new identity becomes stable enough to withstand the confusion of others. When you can show up as the new you regardless of who's watching.

That stability comes from evidence. From actions that prove who you're becoming. The Playground is how you build that evidence.

*"You're not lost. You're between stories. Keep writing the new one."*`}}}],Q=[{id:"wisdom_ikigai",category:"ancientWisdom",title:"Ikigai: Reason for Being",subtitle:"The Japanese art of finding purpose",icon:"🇯🇵",order:1,unlockTrigger:e.FLOW_FINDER_COMPLETE,unlockValue:!0,content:{teaching:{title:"The Ancient Teaching",body:`In Okinawa, Japan—home to one of the world's highest concentrations of centenarians—there is no word for retirement.

Instead, they have **Ikigai** (生き甲斐): your "reason for getting up in the morning."

Ikigai isn't a destination you reach. It's a practice you live. The Okinawans don't find their Ikigai and then coast—they wake up every day in relationship with it.

Traditional Ikigai emerged from the intersection of four questions:
- What do you love?
- What are you good at?
- What does the world need?
- What can you be paid for?

Where all four overlap, you find your Ikigai—a sustainable purpose that nourishes you while serving others.

The Okinawans didn't have a word for retirement because their work and their meaning were never separated. They didn't work to stop working. They worked because the work itself was life.`},translation:{title:"The Vibe Rise Translation",body:`The Flow Equation is Ikigai with different labels:

| Ikigai | Vibe Rise |
|--------|------------|
| What you love | Problems that light you up |
| What you're good at | Skills that come naturally |
| What the world needs | People you're meant to serve |
| What you can be paid for | Sustainable service |

When the ancient Okinawans spoke of Ikigai, they were describing what we call **your Flow**—that intersection where your gifts meet genuine need, where effort feels like expression.

The Flow Finder helps you articulate what the Okinawans understood intuitively: you already have a reason for being. It's not something to invent—it's something to uncover.

Your Ikigai is your Flow. Your Flow is your Ikigai. Same truth, different vocabulary.`},invitation:{title:"The Invitation",body:`The Okinawans live their Ikigai daily, not as a grand mission but as small, consistent actions aligned with purpose.

**Embody this wisdom by:**

- Treating your Flow as a daily practice, not a distant goal
- Finding your reason for getting up each morning—even if it's small
- Not separating "work" from "life"—seeking integration instead
- Remembering that longevity and meaning are connected

The centenarians of Okinawa didn't find their Ikigai and stop. They found it and lived it, day after day, decade after decade.

Your Flow isn't something to achieve and move on from. It's something to practice for a lifetime.

*"The purpose of life is to discover your gift. The work of life is to develop it. The meaning of life is to give it away."* — David Viscott`}}},{id:"wisdom_svadharma",category:"ancientWisdom",title:"Svadharma: Your Sacred Duty",subtitle:"The Hindu concept of personal calling",icon:"🙏",order:2,unlockTrigger:e.STAGE_REACHED,unlockValue:4,content:{teaching:{title:"The Ancient Teaching",body:`In the Bhagavad Gita, one of humanity's oldest wisdom texts, Krishna tells Arjuna:

*"It is better to do your own dharma imperfectly than to do another's dharma perfectly."*

This is **Svadharma** (स्वधर्म)—your own sacred duty. "Sva" means self; "dharma" means path, purpose, or righteous way. Together: your unique path.

The ancient Hindus understood that each person has a particular role in the cosmic order—not assigned from outside, but emerging from within. Your Svadharma isn't what others tell you to do. It's what you were born to do.

The teaching warns against a common trap: living someone else's dharma because it looks safer, more respectable, or more successful. Even if you execute another's path perfectly, you'll feel hollow. Even if you stumble on your own path, you'll feel alive.

The worst fate, according to this tradition, isn't failure on your own path—it's success on the wrong one.`},translation:{title:"The Vibe Rise Translation",body:`Svadharma is what we call your **unique Flow**.

The Matrix told you to follow the prescribed path: school → job → retirement. That's someone else's dharma—a generic template that ignores your specific nature.

Your Flow—the intersection of your skills, the problems that call to you, and the people you're meant to serve—is your Svadharma. It's the path only you can walk.

**The parallel:**

| Svadharma Teaching | Vibe Rise Principle |
|-------------------|---------------------|
| Living another's dharma perfectly still fails | Success in the wrong career is still misalignment |
| Your dharma emerges from within | Your Flow is discovered, not assigned |
| Imperfect alignment beats perfect misalignment | Done on YOUR path beats perfect on someone else's |

When Krishna tells Arjuna to follow his own dharma, he's saying: trust your nature. Your gifts exist for a reason. The path that feels uniquely yours IS uniquely yours.

The Protective Voices are the forces that push you toward others' dharmas—toward the safe, the expected, the approved. Your Flow is your rebellion back toward truth.`},invitation:{title:"The Invitation",body:`The ancient sages knew what modern research confirms: meaning comes from alignment, not achievement.

**Embody this wisdom by:**

- Asking "is this MY path?" before "is this path successful?"
- Trusting the pull toward your unique work, even when it looks different from others'
- Releasing the need to execute someone else's dharma perfectly
- Accepting imperfection on your own path as superior to perfection on the wrong one

Your Svadharma is already within you. The Flow Finder didn't create it—it helped you see it. The Playground doesn't build your path—it clears the obstacles blocking your view.

You are not meant to live a generic life. You are meant to live YOUR life—the one encoded in your nature before anyone told you what you should be.

*"Your own path, though imperfect, leads to liberation. Another's path, though perfect, leads to fear."* — Bhagavad Gita 3:35`}}},{id:"wisdom_te",category:"ancientWisdom",title:"Te: Your Inherent Power",subtitle:"The Taoist concept of natural virtue",icon:"☯️",order:3,unlockTrigger:e.PLAYGROUND_COUNT,unlockValue:15,content:{teaching:{title:"The Ancient Teaching",body:`The Tao Te Ching, written over 2,500 years ago, speaks of **Te** (德)—often translated as virtue, power, or integrity.

Te isn't morality in the judgmental sense. It's closer to "inherent nature"—the natural power that emerges when something is fully itself.

Water has Te when it flows downhill naturally, finding the path of least resistance while still reaching the sea. A tree has Te when it grows according to its nature—not forcing itself to be a different kind of tree.

Humans have Te when we stop forcing and start flowing—when we act from our essential nature rather than imposed expectations.

The Taoists observed that most human suffering comes from fighting our Te: trying to be something we're not, forcing what should flow, controlling what should be released. The solution isn't more effort—it's less resistance.

*"The Tao does nothing, yet nothing is left undone."* This isn't passivity—it's alignment. When you act from your Te, effort becomes effortless.`},translation:{title:"The Vibe Rise Translation",body:`Te is what we mean when we say "in Flow."

Flow isn't about working harder. It's about aligning so completely with your nature that work stops feeling like work. That's Te in action.

**The parallel:**

| Taoist Te | Vibe Rise Concept |
|-----------|-------------------|
| Act from your inherent nature | Work from your unique Skills/Problems/People |
| Wu wei (effortless action) | The Flow state |
| Resistance creates suffering | The Groan as misdirected energy |
| Power comes from alignment, not force | Sustainable success from alignment, not hustle |

The Protective Voices are what Taoists would call "going against the Tao"—forcing, controlling, performing, hiding. They create resistance because they oppose your natural Te.

When you face your Protective Voices in the Playground, you're practicing a Taoist discipline: releasing what blocks your Te so your natural power can express itself.`},invitation:{title:"The Invitation",body:`The Taoists spent lifetimes cultivating what you can practice daily: alignment with your natural way.

**Embody this wisdom by:**

- Noticing where you're forcing vs. flowing
- Trusting that effort should feel like expression, not extraction
- Releasing the need to be different from what you naturally are
- Seeing resistance not as something to overcome, but as a signal of misalignment

Your Te—your inherent power—is already complete. You don't need to build it. You need to stop blocking it.

The Playground challenges aren't about becoming more powerful. They're about removing the obstacles that hide your existing power. Each Protective Voice released is more Te expressed.

The ancient Taoists called this "returning to the uncarved block"—getting back to who you were before the world told you who to be.

*"The soft overcomes the hard. The slow overcomes the fast. Let your workings remain a mystery. Just show people the results."* — Tao Te Ching`}}},{id:"wisdom_heros_journey",category:"ancientWisdom",title:"The Hero's Journey",subtitle:"The universal story you are living",icon:"⚔️",order:4,unlockTrigger:e.STAGE_REACHED,unlockValue:6,content:{teaching:{title:"The Ancient Teaching",body:`In 1949, mythologist Joseph Campbell published "The Hero with a Thousand Faces," revealing a pattern hidden in every culture's stories:

**The Monomyth**—a single story structure underneath all heroic narratives.

From Odysseus to Luke Skywalker, from Buddha to Bilbo Baggins, the same pattern appears:

1. **The Ordinary World** — Life before the call
2. **The Call to Adventure** — Something disrupts the ordinary
3. **Refusal of the Call** — Fear, doubt, hesitation
4. **Meeting the Mentor** — Guidance appears
5. **Crossing the Threshold** — Commitment to the journey
6. **Tests, Allies, Enemies** — The road of trials
7. **The Ordeal** — The central crisis
8. **Reward** — Seizing the treasure
9. **The Road Back** — Returning with the gift
10. **Resurrection** — Final transformation
11. **Return with the Elixir** — Sharing the gift with the world

Campbell's insight: this isn't just a storytelling formula. It's a map of psychological transformation. The hero's journey is the shape of human growth itself.`},translation:{title:"The Vibe Rise Translation",body:`You are living the Hero's Journey. Vibe Rise is your map.

| Hero's Journey Stage | Your Vibe Rise Experience |
|---------------------|---------------------------|
| Ordinary World | Life in the Matrix (before the earthquake) |
| Call to Adventure | The earthquake—sensing something is wrong |
| Refusal of the Call | Protective Voices activating: "Stay safe" |
| Meeting the Mentor | Finding Vibe Rise, Zarlo, community |
| Crossing the Threshold | Committing to the journey |
| Tests, Allies, Enemies | The Playground, facing fears, Movement Makers |
| The Ordeal | Your deepest Groan—the challenge that transforms |
| Reward | Your Flow discovered, your gift clarified |
| The Road Back | Building your offer, re-entering the world |
| Resurrection | First Service—proof of transformation |
| Return with the Elixir | Living your mission, serving your people |

You're not just doing personal development. You're living a mythic pattern as old as humanity itself.`},invitation:{title:"The Invitation",body:`The Hero's Journey isn't about becoming special. It's about becoming *yourself*—and bringing what you learn back to serve others.

**Embody this wisdom by:**

- Recognizing your earthquake as a "call to adventure," not a breakdown
- Understanding that refusal and doubt are part of the pattern—every hero resists at first
- Trusting that mentors and allies will appear (they already have)
- Knowing that the ordeal—the scariest challenge—is where transformation happens
- Remembering that the journey ends in service, not just self-improvement

Campbell's most famous line: *"The cave you fear to enter holds the treasure you seek."*

That cave is your deepest Groan. That treasure is your fullest expression. The journey through fear IS the hero's journey. You're already on it.

The elixir you'll return with isn't for you alone. It's the gift you'll give your people—the transformation you can offer because you transformed yourself.

*"We must be willing to get rid of the life we've planned, so as to have the life that is waiting for us."* — Joseph Campbell`}}}],k=[...J,...z,...K,...Q];function $(n){const[r,t]=u.useState(!0),[c,o]=u.useState(null),[a,h]=u.useState({protectiveVoice:null,flowFinderComplete:!1,onboardingComplete:!1,currentStage:0,groanChallenges:[],compassCheckins:0,daysActive:0}),f=u.useCallback(async()=>{var i,s,l,m,b,v,y;if(!n){t(!1);return}t(!0),o(null);try{const[w,R,V,N,q,j,E]=await Promise.all([p.from("lead_flow_profiles").select("protective_archetype").eq("user_id",n).order("created_at",{ascending:!1}).limit(1),p.from("flow_sessions").select("id").eq("user_id",n).eq("flow_type","mind_space").eq("status","completed").limit(1),p.from("user_stage_progress").select("persona").eq("user_id",n).maybeSingle(),p.from("user_projects").select("current_stage").eq("user_id",n).in("status",["active","completed"]),p.from("groan_challenges").select("id, status, visibility_layer, voice_targeted").eq("user_id",n),p.from("flow_entries").select("id",{count:"exact"}).eq("user_id",n).eq("entry_type","compass"),p.auth.getUser()]),P=((s=(i=w.data)==null?void 0:i[0])==null?void 0:s.protective_archetype)||null;console.log("[useCodex] Protective voice from DB:",P);const D=((l=R.data)==null?void 0:l.length)>0,M=!!((m=V.data)!=null&&m.onboarding_v2_completed),L=((b=N.data)==null?void 0:b.reduce((T,C)=>Math.max(T,C.current_stage||0),0))||0,B=q.data||[],G=j.count||0;let S=0;if((y=(v=E.data)==null?void 0:v.user)!=null&&y.created_at){const T=new Date(E.data.user.created_at);S=Math.floor((new Date-T)/(1e3*60*60*24))}h({protectiveVoice:P,flowFinderComplete:D,onboardingComplete:M,currentStage:L,groanChallenges:B,compassCheckins:G,daysActive:S})}catch(w){console.error("Error in useCodex:",w),o(w.message)}finally{t(!1)}},[n]);u.useEffect(()=>{f()},[f]);const d=u.useMemo(()=>k.map(i=>({...i,isUnlocked:I(i,a)})),[a]),Y=u.useMemo(()=>{const i={};return Object.keys(_).forEach(s=>{i[s]=H(s,k,a)}),i},[a]),A=u.useMemo(()=>{const i=d.filter(l=>l.isUnlocked).length,s=d.length;return{unlocked:i,total:s,percentage:s>0?Math.round(i/s*100):0}},[d]),g=u.useCallback(i=>U(i,k,a),[a]),x=u.useCallback(i=>d.find(l=>l.id===i)||null,[d]),O=u.useCallback(i=>{const s=d.find(y=>y.id===i);if(!s)return{prev:null,next:null};const l=d.filter(y=>y.category===s.category).sort((y,w)=>(y.order||0)-(w.order||0)),m=l.findIndex(y=>y.id===i),b=m>0?l[m-1]:null,v=m<l.length-1?l[m+1]:null;return{prev:b,next:v}},[d]);return{entries:d,categories:_,progress:Y,totalProgress:A,userData:a,loading:r,error:c,refresh:f,getEntriesByCategory:g,getEntryById:x,getAdjacentEntries:O}}export{$ as u};
