/**
 * Zarlo Page Content
 *
 * All page-specific content for Zarlo's contextual awareness.
 * Tone: Hybrid — Playful surface, direct truth underneath.
 */

export const PAGE_CONTENT = {
  // ============================================
  // CORE DISCOVERY FLOWS
  // ============================================

  '/nervous-system': {
    pageId: 'nervous_system_map',
    pageName: 'Nervous System Map',
    whatIsThis: `This is where we catch your nervous system in the act. Through some surprisingly simple body-based tests (you'll literally sway), we find the invisible line where your system says "nope, too scary" — even when your brain says "let's go."`,
    whyMatters: `Here's the sneaky truth: you don't rise to the level of your ambitions — you fall to what your nervous system thinks is safe. It's like having an overprotective bodyguard who won't let you into the VIP section of your own life.\n\nThis flow shows you exactly where that bouncer is standing. Once you see the line, you can start moving it.`,
    contextualPrompts: [
      { id: 'sway_test', label: 'How does the sway test work?' },
      { id: 'safety_contract', label: "What's a safety contract?" }
    ],
    faq: {
      sway_test: `Okay, this might sound a little woo-woo, but stick with me — it's actually based on muscle testing that kinesiologists have used for decades.\n\nHere's the deal: your conscious mind only runs about 5% of the show. The other 95%? Your subconscious, running on autopilot. The sway test is a way to ask your body directly what it believes is true or safe.\n\nStand up, close your eyes, and say "Show me a YES." Notice which way you lean. Then say "Show me a NO." You'll feel the difference. Your body doesn't lie the way your brain does.`,
      safety_contract: `Think of it like a deal your younger self made without telling you. Something happened — maybe you got rejected, laughed at, or hurt when you put yourself out there — and your nervous system said "okay, never doing THAT again."\n\nNow it runs in the background like invisible software:\n• "If I'm too successful, people will leave me"\n• "If I'm visible, I'll be attacked"\n• "If I charge real money, people will think I'm greedy"\n\nThese aren't logical. They're survival code. And they've been quietly vetoing your dreams ever since. Time to renegotiate.`
    }
  },

  '/shadow-work': {
    pageId: 'shadow_work',
    pageName: 'Shadow Work Workshop',
    whatIsThis: `This is where you explore the parts of yourself you've suppressed — traits you're ashamed of and authentic parts you've hidden to stay safe. You'll identify your shadows, trace them to root emotions, map the protective archetypes you use as armour, and trace the whole pattern back to its origin.`,
    whyMatters: `Shadows aren't flaws — they're authentic parts of you that were made to feel unacceptable. By bringing them into the light, you stop them from running the show unconsciously.\n\nThis is deep work. It connects your protective archetypes (from the Nervous System Map) to specific traits and experiences. Once you see the full pattern, healing becomes possible.`,
    contextualPrompts: [
      { id: 'what_shadow', label: 'What is a shadow?' },
      { id: 'how_often', label: 'How often can I do this?' },
      { id: 'connection', label: 'How does this connect to the NS Map?' }
    ],
    faq: {
      what_shadow: `A shadow is any part of yourself you suppress. We suppress for two reasons:\n\n1. **Society told us it's wrong** — "Don't be too loud," "Don't be too emotional," "That's not professional."\n2. **We got hurt** — You expressed something authentic, got rejected or teased, and your nervous system said "never again."\n\nShadows aren't bad. They're just hidden. And hidden things have power over you — until you bring them into the light.`,
      how_often: `Once per calendar week (Monday to Sunday). Each session builds on previous ones — you'll explore different shadows each time, building a growing inventory of self-knowledge.\n\nThe goal isn't to "finish" shadow work. It's to keep peeling back layers as you grow.`,
      connection: `The Nervous System Map shows you your protective archetypes — Ghost, Performer, Controller, Perfectionist, People Pleaser. Shadow Work goes deeper:\n\n• **NS Map** = "I become the Ghost when I feel unsafe"\n• **Shadow Work** = "I become the Ghost specifically to hide my creativity, because I was teased for it in school, and the root emotion is shame"\n\nSame archetypes, much deeper understanding of WHY they show up.`
    }
  },

  '/healing-compass': {
    pageId: 'healing_compass',
    pageName: 'Healing Compass',
    whatIsThis: `This is where we trace a limiting belief back to its origin — the moment your nervous system first decided "this isn't safe." We're looking for the emotional splinter that's been stuck in there, quietly running the show.`,
    whyMatters: `The Nervous System Map shows you WHAT beliefs are holding you back. The Healing Compass shows you WHERE they came from.\n\nHere's the thing: you can't think your way out of a body-based response. That belief isn't in your head — it's in your nervous system. To change it, we have to go back to where it started and finally let that part of you heal.`,
    contextualPrompts: [
      { id: 'ns_first', label: 'Do I need to have done the NS Map first?' },
      { id: 'emotionally_heavy', label: 'Is this going to be emotionally heavy?' }
    ],
    faq: {
      ns_first: `Yep! The Healing Compass works with the safety contracts you identified in the NS Map. We need to know which beliefs are active before we can trace them back to their origin.\n\nThink of it like this: NS Map = diagnosis. Healing Compass = treatment. Gotta know what we're treating first.`,
      emotionally_heavy: `It can bring stuff up, yeah. That's actually part of the process — we're giving your nervous system permission to finally process what it couldn't process at the time.\n\nFind a quiet, private space. Give yourself 15-20 minutes. And be gentle with yourself. This is deep work, not a productivity hack.\n\nIf it feels like too much, you can pause anytime. There's also the option to do this with 1:1 support if you want someone to guide you through.`
    }
  },

  '/nikigai/skills': {
    pageId: 'flow_finder_skills',
    pageName: 'Flow Finder: Skills',
    whatIsThis: `An AI-guided conversation to uncover what you're naturally good at — the stuff that comes so easily to you that you probably don't even think it's special. (Spoiler: it is.)`,
    whyMatters: `When you work in your natural flow, everything gets easier. Your nervous system relaxes because you're not forcing yourself to be someone you're not.\n\nThe goal here is to find what you're already wired for — so you can build something that feels like an extension of you, not a constant uphill battle.`,
    contextualPrompts: [
      { id: 'how_long', label: 'How long does this take?' },
      { id: 'no_skills', label: "What if I don't think I have special skills?" }
    ],
    faq: {
      how_long: `About 10-15 minutes. It's a conversation with Claude (AI), not a boring form. The more you share, the better the insights — so don't hold back.\n\nYou can also redo this anytime. What you discover about yourself tends to deepen over time.`,
      no_skills: `Ha! That's actually a sign you're close to your zone of genius. The things that come naturally to you feel "easy" — so you assume everyone can do them.\n\nThey can't.\n\nHere's a clue: What do people always ask you for help with? What do you do effortlessly that others struggle with? What would you do for fun even if no one paid you?\n\nThe AI will help draw this out. Trust the process.`
    }
  },

  '/nikigai/problems': {
    pageId: 'flow_finder_problems',
    pageName: 'Flow Finder: Problems',
    whatIsThis: `A conversation to identify the problems you actually give a damn about — not just problems that exist, but ones that light you up when you talk about solving them.`,
    whyMatters: `Caring creates energy. Energy creates sustainability. If you're solving a problem you don't actually care about, you'll burn out — even if the business is "successful."\n\nThis makes sure you're building toward something that matters to YOU, not just something that looks good on paper.`,
    contextualPrompts: [
      { id: 'too_many', label: 'What if I care about too many problems?' },
      { id: 'connect_skills', label: 'Should this connect to my skills?' }
    ],
    faq: {
      too_many: `Classic multi-passionate human! That's actually a good problem to have.\n\nThe goal isn't to pick one forever — it's to notice where your energy naturally flows. During the conversation, we'll explore which problems give you energy vs. which ones feel like obligations.\n\nYou might care about climate change, but does talking about it light you up? Or does it feel heavy and exhausting? We're looking for problems where caring feels like fuel, not burden.`,
      connect_skills: `Eventually, yes — that's where the magic happens. But don't force it during this flow.\n\nFirst, discover what genuinely calls to you. Later, in the Integration flow, we'll find where your skills and problems overlap. Sometimes the connection is obvious; sometimes it's surprising.\n\nTrust the process. It comes together.`
    }
  },

  '/nikigai/persona': {
    pageId: 'flow_finder_persona',
    pageName: 'Flow Finder: Persona',
    whatIsThis: `A conversation to get crystal clear on WHO you're meant to serve. Not "everyone." Not a vague "target market." Real humans with specific struggles, desires, and situations.`,
    whyMatters: `"Everyone" is terrifying. Your nervous system can't relax when you're trying to please the entire internet.\n\nBut "people like Sarah, who are 18 months into their corporate burnout and desperately want out" — that's specific enough to actually approach. Clarity on WHO reduces the overwhelm of visibility.`,
    contextualPrompts: [
      { id: 'just_one', label: 'Do I have to pick just one type of person?' },
      { id: 'past_self', label: 'What if I want to help people like my past self?' }
    ],
    faq: {
      just_one: `For now, yes. I know, I know — you want to help everyone. But specificity is power.\n\nStart with ONE persona you deeply understand (often a version of yourself). Build something real for them. You can expand later once you have momentum.\n\nTrying to serve five different personas from the start dilutes your message and makes everything ten times harder.`,
      past_self: `That's often the most powerful place to start! You understand their pain intimately. You know what they're searching for at 2am because you were searching for it too.\n\nThe only danger is assuming everyone's journey is identical to yours. Use your past self as a starting point, then stay curious about how others' experiences might differ.`
    }
  },

  '/nikigai/integration': {
    pageId: 'flow_finder_integration',
    pageName: 'Flow Finder: Integration',
    whatIsThis: `This is where everything comes together. Your skills, the problems you care about, and the people you want to serve — synthesized into clear "opportunity clusters." These are potential directions that actually align with who you are.`,
    whyMatters: `Most people try to find their path through thinking alone. They make spreadsheets. They journal. They overthink.\n\nBut when your work aligns with your natural skills, genuine interests, and people you understand — it stops feeling like work. Your nervous system says "yes" instead of constantly pumping the brakes.`,
    contextualPrompts: [
      { id: 'what_clusters', label: 'What do I do with the clusters?' },
      { id: 'change_later', label: 'Can I change this later?' }
    ],
    faq: {
      what_clusters: `Look for the one that creates the strongest "yes" in your body — not just your head. Which one excites you? Which one feels like relief?\n\nYou don't have to commit to anything permanently. Just pick one to explore further. The 7-Day Challenge will help you test it in the real world.\n\nAction creates clarity. Thinking in circles doesn't.`,
      change_later: `Absolutely. These clusters aren't tattoos — they're starting points.\n\nMany people's final direction looks different from their first cluster. That's not failure; that's the process working. You learn by doing, not by planning.\n\nShip, learn, adjust. Repeat forever.`
    }
  },

  // ============================================
  // ONBOARDING V2 (HomeFirstTime)
  // ============================================

  'onboarding_welcome': {
    pageId: 'onboarding_welcome',
    pageName: 'Welcome',
    whatIsThis: `This is your first step into Vibe Rise! We're about to ask you four quick questions to find where your flow is getting stuck. No wrong answers — just honest ones.`,
    whyMatters: `Everyone's journey is different. Someone still exploring needs different guidance than someone who's already running a business.\n\nThese questions help us meet you where you are — not where we assume you are.`,
    contextualPrompts: [
      { id: 'what_is_fmf', label: 'What is Vibe Rise?' },
      { id: 'what_is_flow', label: 'What do you mean by "Vibe Rise"?' },
      { id: 'why_questions', label: 'Why do you need to ask me questions?' },
      { id: 'what_happens', label: 'What happens after I answer?' }
    ],
    faq: {
      what_is_fmf: `Vibe Rise is where people who want to create a positive impact figure out what they're meant to build — and actually follow through on it.\n\nImagine if a university, HubSpot, a marketing agency, and an AI business coach had a baby... and that baby also understood what's causing you to feel stuck.\n\nThat's us. Strategy + healing + accountability + tools. All in one place.`,
      what_is_flow: `Ever since Huzz (the creator) quit his job two and a half years ago, he developed an unwavering belief in 'Flow'.\n\nThe idea that there's a **unique path that only YOU could walk** — due to your combination of skills, experiences, and circumstances.\n\nWhen you find your flow — aligning what gives you flow *internally* with what's flowing *externally* — life becomes crazy and magical.\n\nThis app is designed to help you find that flow.`,
      why_questions: `Because one-size-fits-all doesn't work.\n\nSomeone still exploring needs different support than someone who's already visible but can't charge.\n\nThese four questions check where your flow is blocked — identity, nervous system, visibility, or value — so we can focus your journey on the right thing first.`,
      what_happens: `After you answer, we'll show you your "persona" — basically which stage of the journey you're on.\n\nThen, depending on your answers, you'll either:\n• Start discovering what you're meant to build (Flow Finder)\n• Or capture what you're already working on (Quick Capture)\n\nEither way, you'll be set up and ready to go in about 5 minutes.`
    }
  },

  'onboarding_q1': {
    pageId: 'onboarding_q1',
    pageName: 'Journey Stage',
    whatIsThis: `This question helps us understand your current work situation. Are you employed? Self-employed? Building something on the side? Each path has different challenges and opportunities.`,
    whyMatters: `Your employment status shapes everything:\n\n• **Still employed?** You need strategies that work around a job\n• **Recently quit?** Time pressure is real — we'll focus on momentum\n• **Already running something?** Let's optimise what you've got\n\nNo judgment here. Every path is valid.`,
    contextualPrompts: [
      { id: 'what_is_fmf', label: 'What is Vibe Rise?' },
      { id: 'what_is_flow', label: 'What do you mean by "Vibe Rise"?' },
      { id: 'which_pick', label: "I'm between options — which should I pick?" },
      { id: 'why_matters', label: 'Why does this matter?' }
    ],
    faq: {
      what_is_fmf: `Vibe Rise is where people who want to create a positive impact figure out what they're meant to build — and actually follow through on it.\n\nImagine if a university, HubSpot, a marketing agency, and an AI business coach had a baby... and that baby also understood what's causing you to feel stuck.\n\nThat's us. Strategy + healing + accountability + tools. All in one place.`,
      what_is_flow: `Ever since Huzz (the creator) quit his job two and a half years ago, he developed an unwavering belief in 'Flow'.\n\nThe idea that there's a **unique path that only YOU could walk** — due to your combination of skills, experiences, and circumstances.\n\nWhen you find your flow — aligning what gives you flow *internally* with what's flowing *externally* — life becomes crazy and magical.\n\nThis app is designed to help you find that flow.`,
      which_pick: `Pick the one that feels most true RIGHT NOW.\n\nIf you're employed but have a side project, pick the "building something on the side" option.\n\nIf you're between jobs and not sure what's next, pick whatever reflects your current reality.\n\nYou can always adjust later. This isn't a permanent label — it's just where you're starting from.`,
      why_matters: `It changes the advice we give you.\n\nSomeone with a full-time job needs evening/weekend-friendly strategies. Someone who just quit needs faster paths to income. Someone established needs optimization, not basics.\n\nWe don't want to waste your time with stuff that doesn't apply to your situation.`
    }
  },

  'onboarding_q2': {
    pageId: 'onboarding_q2',
    pageName: 'Business Ladder',
    whatIsThis: `This is about what you've created so far — not what you dream of creating. Have you built anything? Sold anything? Or are you still in discovery mode?\n\nWe call this the "Business Ladder" — where you currently stand in building income from your own work.`,
    whyMatters: `The Business Ladder has four rungs:\n\n• **Still discovering** — No concrete offer yet (that's okay!)\n• **Trading time** — You have a service, working with clients directly\n• **Productised service** — Systematised your service, less 1:1 time\n• **Products** — Digital products, courses, things that sell while you sleep\n\nEach rung has different challenges. We'll tailor your experience accordingly.`,
    contextualPrompts: [
      { id: 'what_is_fmf', label: 'What is Vibe Rise?' },
      { id: 'what_is_flow', label: 'What do you mean by "Vibe Rise"?' },
      { id: 'not_sure_rung', label: "I'm not sure which rung I'm on" },
      { id: 'want_higher', label: 'I want to be higher on the ladder' }
    ],
    faq: {
      what_is_fmf: `Vibe Rise is where people who want to create a positive impact figure out what they're meant to build — and actually follow through on it.\n\nImagine if a university, HubSpot, a marketing agency, and an AI business coach had a baby... and that baby also understood what's causing you to feel stuck.\n\nThat's us. Strategy + healing + accountability + tools. All in one place.`,
      what_is_flow: `Ever since Huzz (the creator) quit his job two and a half years ago, he developed an unwavering belief in 'Flow'.\n\nThe idea that there's a **unique path that only YOU could walk** — due to your combination of skills, experiences, and circumstances.\n\nWhen you find your flow — aligning what gives you flow *internally* with what's flowing *externally* — life becomes crazy and magical.\n\nThis app is designed to help you find that flow.`,
      not_sure_rung: `Here's a quick test:\n\n**Do you have paying customers?**\n• No → You're "Still discovering"\n• Yes → Keep going...\n\n**How do you deliver value?**\n• 1:1 calls, custom work, your time = each sale → "Trading time"\n• Some systems, but still mostly you involved → "Productised service"\n• Products that sell without you there → "Products"\n\nPick what's most true today. Don't pick where you want to be — pick where you ARE.`,
      want_higher: `That's exactly why you're here!\n\nBut here's the thing: you can't skip rungs. Each one builds skills and insights you need for the next.\n\nPeople who try to jump straight to "passive income products" without going through the earlier stages usually fail. They don't understand their customers well enough yet.\n\nWe'll help you climb — but we'll make sure you're building on solid ground.`
    }
  },

  'onboarding_q3': {
    pageId: 'onboarding_q3',
    pageName: 'Primary Goal',
    whatIsThis: `This is about what you want to focus on RIGHT NOW. Not your life mission — just your next chapter. What's the thing that would make the biggest difference?`,
    whyMatters: `We can't help you with everything at once. Focus creates progress.\n\nSome options might be greyed out based on your previous answers — that's intentional. Certain goals only make sense at certain stages.\n\nPick the one that resonates most. You can always shift focus later.`,
    contextualPrompts: [
      { id: 'what_is_fmf', label: 'What is Vibe Rise?' },
      { id: 'what_is_flow', label: 'What do you mean by "Vibe Rise"?' },
      { id: 'greyed_out', label: 'Why are some options greyed out?' },
      { id: 'want_all', label: 'I want to do all of these!' }
    ],
    faq: {
      what_is_fmf: `Vibe Rise is where people who want to create a positive impact figure out what they're meant to build — and actually follow through on it.\n\nImagine if a university, HubSpot, a marketing agency, and an AI business coach had a baby... and that baby also understood what's causing you to feel stuck.\n\nThat's us. Strategy + healing + accountability + tools. All in one place.`,
      what_is_flow: `Ever since Huzz (the creator) quit his job two and a half years ago, he developed an unwavering belief in 'Flow'.\n\nThe idea that there's a **unique path that only YOU could walk** — due to your combination of skills, experiences, and circumstances.\n\nWhen you find your flow — aligning what gives you flow *internally* with what's flowing *externally* — life becomes crazy and magical.\n\nThis app is designed to help you find that flow.`,
      greyed_out: `Some goals don't make sense for where you are on the Business Ladder.\n\nFor example, you can't "scale your business" if you don't have a business yet. You can't "optimise your funnel" if you don't have customers.\n\nThe greyed-out options will unlock as you progress. Think of them as future levels in a game — they're coming, just not yet.`,
      want_all: `Ha! Classic ambitious human. I respect it.\n\nBut here's the truth: trying to do everything at once is a recipe for doing nothing well.\n\nPick ONE focus for now. We'll help you make real progress on that thing. Then you can shift to the next priority.\n\nFocused action beats scattered intention every single time.`
    }
  },

  'onboarding_persona_reveal': {
    pageId: 'onboarding_persona_reveal',
    pageName: 'Your Persona',
    whatIsThis: `Based on your answers, we've identified your "persona" — which stage of the journey you're on. This helps us personalise everything that comes next.`,
    whyMatters: `Your persona isn't a personality test. It's a practical label that shapes:\n\n• Which quests and challenges you see\n• What advice is most relevant\n• How we talk to you about progress\n\nIt's based on where you ARE, not who you are as a person. As you grow, your persona can change too.`,
    contextualPrompts: [
      { id: 'what_is_fmf', label: 'What is Vibe Rise?' },
      { id: 'what_is_flow', label: 'What do you mean by "Vibe Rise"?' },
      { id: 'what_personas', label: 'What are the different personas?' },
      { id: 'change_later', label: 'Can this change later?' }
    ],
    faq: {
      what_is_fmf: `Vibe Rise is where people who want to create a positive impact figure out what they're meant to build — and actually follow through on it.\n\nImagine if a university, HubSpot, a marketing agency, and an AI business coach had a baby... and that baby also understood what's causing you to feel stuck.\n\nThat's us. Strategy + healing + accountability + tools. All in one place.`,
      what_is_flow: `Ever since Huzz (the creator) quit his job two and a half years ago, he developed an unwavering belief in 'Flow'.\n\nThe idea that there's a **unique path that only YOU could walk** — due to your combination of skills, experiences, and circumstances.\n\nWhen you find your flow — aligning what gives you flow *internally* with what's flowing *externally* — life becomes crazy and magical.\n\nThis app is designed to help you find that flow.`,
      what_personas: `There are three main personas:\n\n**Flow Seeker** — Still discovering what you want to build. Focus: exploration, self-discovery, finding your direction.\n\n**Flow Finder** — You know what you're building, now making it real. Focus: creation, validation, first customers.\n\n**Movement Maker** — You've got something working, time to grow. Focus: scaling, systems, bigger impact.\n\nEach one has different challenges and different wins. None is "better" — they're just different chapters.`,
      change_later: `Absolutely. Your persona is based on where you are TODAY.\n\nAs you make progress — get your first customers, build your first product, scale your systems — you'll naturally move through the personas.\n\nThink of it like levels in a game. You don't stay at Level 1 forever. You level up by doing the work.`
    }
  },

  // ============================================
  // TENSION LAYER ONBOARDING (HomeFirstTime v3)
  // ============================================

  'onboarding_tension_q1': {
    pageId: 'onboarding_tension_q1',
    pageName: 'Discover — The Spring',
    whatIsThis: `This question checks whether you've found your "spring" — the source of your river. Do you know what your thing is? What you're building? What direction you're heading?`,
    whyMatters: `You can't have a river without a source. If you don't know your direction yet, that's completely normal — but it's the first thing to address.\n\nMany people try to build visibility or charge money before they even know what they're offering. That's like trying to fill a bucket from a dry well.`,
    contextualPrompts: [
      { id: 'what_is_fmf', label: 'What is Vibe Rise?' },
      { id: 'what_is_river', label: 'What\'s this "river" about?' },
      { id: 'why_questions', label: 'Why these questions?' },
      { id: 'honest_answer', label: 'What if I pick the "wrong" one?' }
    ],
    faq: {
      what_is_fmf: `Vibe Rise helps people discover what they're meant to build — and actually follow through. Strategy + healing + accountability + tools, all in one place.`,
      what_is_river: `"Vibe Rise" isn't just a name — it's the whole framework.\n\nImagine your personal growth as a river system. The Spring is where the water emerges (your identity/direction). The Riverbed holds it (your nervous system). The Current carries it forward (your visibility). The Ocean is where it meets the world (your value/pricing).\n\nThese four questions check which part of your river is blocked. That's where we focus first.`,
      why_questions: `These four questions identify where your flow is stuck. Instead of guessing what you need, we pinpoint the exact blockage — then focus your journey there.\n\nMost people are stuck at one specific layer. Fix that, and everything downstream starts moving.`,
      honest_answer: `There's no wrong answer. Pick whichever feels most true RIGHT NOW.\n\nThis isn't a test — it's a mirror. We're not judging your score, we're using it to give you the right starting point.`
    }
  },

  'onboarding_tension_q2': {
    pageId: 'onboarding_tension_q2',
    pageName: 'Regulate — The Riverbed',
    whatIsThis: `This question checks your "riverbed" — your nervous system's capacity to hold your ambition. When you think about going all-in, does your body cooperate or shut down?`,
    whyMatters: `Here's the sneaky truth: you don't rise to the level of your ambitions — you fall to what your nervous system thinks is safe.\n\nSomeone can know exactly what to do but freeze when it's time to do it. That's not laziness — it's a nervous system that hasn't learned that growth is safe yet.\n\nIf this is where you're stuck, healing and rewiring work comes before business strategy.`,
    contextualPrompts: [
      { id: 'nervous_system', label: 'What does "nervous system" mean here?' },
      { id: 'body_response', label: 'Why does my body react like that?' },
      { id: 'can_fix', label: 'Can this actually change?' }
    ],
    faq: {
      nervous_system: `Your nervous system runs the show behind the scenes. It decides what feels safe and what triggers fight/flight/freeze.\n\nWhen you get anxious about posting online, pitching your work, or raising prices — that's your nervous system pulling the emergency brake. Not because you're weak, but because it's trying to protect you from a perceived threat.`,
      body_response: `Your body holds memories of every time visibility, exposure, or "putting yourself out there" led to pain.\n\nMaybe you were mocked for sharing an idea. Maybe a parent's criticism made you associate being seen with danger. Your body remembers even if your conscious mind has moved on.\n\nThe tightness, panic, or shutdown is your body trying to protect you from repeating that pain.`,
      can_fix: `Absolutely. Your nervous system isn't fixed — it's plastic. It can learn new patterns.\n\nVibe Rise has specific healing and rewiring quests designed to gradually teach your system that growth is safe. Small exposures, processed well, over time. It's like strength training for your capacity to handle discomfort.`
    }
  },

  'onboarding_tension_q3': {
    pageId: 'onboarding_tension_q3',
    pageName: 'Reveal — The Current',
    whatIsThis: `This question checks your "current" — whether your river is flowing in the open or running underground. Are people seeing your work? Do they know what you're building?`,
    whyMatters: `A river running underground might be powerful — but nobody benefits from it.\n\nMany talented people have incredible skills and ideas but hide them. They work in private, never ship, never post, never put themselves out there.\n\nVisibility isn't about ego. It's about letting your work reach the people who need it. If you're hidden, your impact is zero — regardless of how good you are.`,
    contextualPrompts: [
      { id: 'visibility_layers', label: 'What are the visibility layers?' },
      { id: 'scared_visible', label: "I'm scared to be visible" },
      { id: 'groan_matrix', label: 'What is the Groan Matrix?' }
    ],
    faq: {
      visibility_layers: `We break visibility into 5 layers, each scarier than the last:\n\n1. **Screen** — Posting, commenting, writing online\n2. **Live** — Video calls, live streams, speaking on camera\n3. **Money** — Asking for payment, sales conversations\n4. **Vulnerable** — Sharing personal stories, showing imperfection\n5. **Authority** — Teaching, leading, claiming expertise publicly\n\nMost people have a "visibility edge" — a specific layer where they freeze up. Finding yours is the first step to expanding it.`,
      scared_visible: `That's incredibly common. Being visible means being vulnerable — and your nervous system may read vulnerability as danger.\n\nThe good news: visibility is a skill, not a personality trait. It can be trained gradually, starting small.\n\nThat's exactly what the Play-List challenges do — graduated courage challenges that expand your comfort zone one step at a time.`,
      groan_matrix: `The Groan Matrix is a 2D grid of courage challenges: your skills × the 5 visibility layers.\n\nEach cell represents a specific challenge, like "teach your skill X on a live stream" or "post about your experience with problem Y."\n\nThe challenges are designed to feel scary enough to grow you but safe enough not to break you. That sweet spot is where transformation happens.`
    }
  },

  'onboarding_tension_q4': {
    pageId: 'onboarding_tension_q4',
    pageName: 'Value — The Ocean',
    whatIsThis: `This question checks your "ocean" — whether your river reaches the world. Can you own the value of what you do and be paid for it?`,
    whyMatters: `This is where many people's rivers stop. They've found their source, built capacity, even become visible — but they can't own the price.\n\nUndercharging, over-delivering for free, feeling guilty about money — these are all signs that the Value layer needs work.\n\nYou can't sustain a mission on generosity alone. Owning your value isn't selfish — it's what makes your work sustainable.`,
    contextualPrompts: [
      { id: 'charging_guilt', label: 'Why do I feel guilty about charging?' },
      { id: 'how_price', label: 'How do I know what to charge?' },
      { id: 'value_work', label: 'How does the app help with this?' }
    ],
    faq: {
      charging_guilt: `Charging guilt usually comes from one of these beliefs:\n\n• "Good people don't charge for helping others"\n• "My work isn't valuable enough yet"\n• "If I charge, people will judge me"\n• "I should give freely because I care"\n\nThese beliefs feel noble but they're actually self-sabotage. Charging appropriately lets you do MORE good, not less — because you can sustain the work.`,
      how_price: `Pricing isn't about your self-worth — it's about the transformation you deliver.\n\nVibe Rise has money model flows that help you calculate and structure pricing based on the value you create for others, not how you feel about yourself.\n\nShort version: if your work saves someone time, money, pain, or confusion — that has measurable value. Price based on that, not on your imposter syndrome.`,
      value_work: `The app has several features for this layer:\n\n• **Money Model Flows** — Calculate and structure your pricing\n• **Offer Builder** — Package your work into clear offerings\n• **Funnel Calculator** — Track your revenue pipeline\n\nBut honestly, if Value is your priority layer, the real work often starts with the beliefs underneath. That's why we might recommend healing quests alongside business strategy.`
    }
  },

  'onboarding_priority_reveal': {
    pageId: 'onboarding_priority_reveal',
    pageName: 'Your Priority Layer',
    whatIsThis: `Based on your answers, we've identified which part of your "river" needs attention first. This is your Priority Layer — the blockage that, once cleared, lets everything downstream flow.`,
    whyMatters: `Most people try to work on everything at once. They want to find their thing, heal their nervous system, get visible, AND charge properly — all simultaneously.\n\nThat's like trying to fix a river at every point at once. It doesn't work.\n\nYour priority layer is the FIRST blockage. Clear that, and the water naturally flows to the next section. Focus beats scatter every time.`,
    contextualPrompts: [
      { id: 'why_this_layer', label: 'Why is this my priority?' },
      { id: 'disagree', label: "I think a different layer is more important" },
      { id: 'what_next', label: 'What happens next?' }
    ],
    faq: {
      why_this_layer: `Your priority layer is the lowest point in your river where you scored 0 or 1 — meaning it's significantly unresolved.\n\nWe start low because each layer builds on the one below it. You can't sustain visibility without a regulated nervous system. You can't own your value without being visible first.\n\nIt's not that the other layers don't matter — they do. But this one comes first.`,
      disagree: `That's totally fair. The assessment is a starting point, not a verdict.\n\nAs you use the app, you can always shift your focus. The 7-Day Challenge has quests across all layers — you're not locked into just one.\n\nBut try trusting the assessment for now. Sometimes the thing we resist looking at is exactly the thing that needs attention.`,
      what_next: `Next up: Mind Space — a quick 2-minute flow that helps you discover your unique skills, problems, and who you're meant to help.\n\nAfter that, you'll land on your profile page where you can start your 7-Day Challenge with quests tailored to your priority layer.\n\nThe whole setup takes about 5 minutes.`
    }
  },

  // ============================================
  // MIND SPACE — POST-EXTRACTION AMBITION FLOW
  // ============================================

  'mindspace_ambition': {
    pageId: 'mindspace_ambition',
    pageName: 'Your Ambition',
    whatIsThis: `Now that Mind Space has extracted your skills, problems, and people — this question asks what you want to DO with those discoveries. Are you looking for a career that fits, building your own thing, or still exploring?`,
    whyMatters: `Your ambition shapes the entire experience from here. Job seekers get alignment tools. Builders get business stages. Explorers get freedom to discover without pressure.\n\nThere's no wrong answer — and you can always change direction later.`,
    contextualPrompts: [
      { id: 'which_choose', label: "I'm not sure which to pick" },
      { id: 'change_later', label: 'Can I change this later?' }
    ],
    faq: {
      which_choose: `If you're genuinely torn, pick "I'm still exploring." It keeps all doors open while you continue discovering.\n\nIf you have even a slight lean toward building something — a side project, freelancing, a business — go with "Build something of my own." You'll get more relevant tools.\n\nThe choice isn't permanent.`,
      change_later: `Yes! This isn't a permanent commitment. As you use the app and complete quests, your path will naturally evolve. Think of this as a starting point, not a destination.`
    }
  },

  'mindspace_existing_biz': {
    pageId: 'mindspace_existing_biz',
    pageName: 'Existing Business',
    whatIsThis: `You chose "Build something of my own" — now we're asking if you already have something in motion, or if you're starting fresh. This determines whether we connect your Mind Space discoveries to an existing business or help you build from scratch.`,
    whyMatters: `Existing businesses get to align their current work with their natural strengths. Fresh starters get a clean foundation built on who they actually are, not who they think they should be.\n\nEither way, you're in the right place.`,
    contextualPrompts: [
      { id: 'side_project', label: 'Does a side project count?' },
    ],
    faq: {
      side_project: `If you're actively working on it and it has a name — yes, count it. We'll help you connect it with your Mind Space discoveries.\n\nIf it's more of a vague idea you haven't started yet, "Starting fresh" might serve you better. You can always add business details later.`
    }
  },

  'mindspace_alignment_sliders': {
    pageId: 'mindspace_alignment_sliders',
    pageName: 'Alignment Check',
    whatIsThis: `These sliders let you identify which of your extracted skills, problems, and people align with your current situation — whether that's your current job, existing business, or areas of interest.\n\nEach slider starts on "No alignment" and you slide right to select items that DO align.`,
    whyMatters: `Knowing what's aligned vs. what's underutilized is powerful. The gap between what you naturally do and what you're currently doing reveals where your growth opportunity lives.\n\nAreas with no alignment aren't wasted — they might be the foundation for your next chapter.`,
    contextualPrompts: [
      { id: 'leave_no_alignment', label: 'Is it OK to leave everything on No alignment?' },
    ],
    faq: {
      leave_no_alignment: `Absolutely. "No alignment" is valid and useful information. It tells us your current situation doesn't overlap with your natural strengths — which means there's a big opportunity for change.\n\nDon't force alignment where it doesn't exist. Honest answers lead to better recommendations.`
    }
  },

  'mindspace_stage': {
    pageId: 'mindspace_stage',
    pageName: 'Business Stage',
    whatIsThis: `You have an existing business — now tell us where you are with it. This unlocks stage-specific quests and tools in the 7-Day Challenge.\n\nPick whichever stage feels most accurate right now.`,
    whyMatters: `Each business stage has different challenges. Someone with paying customers needs different guidance than someone with just an idea.\n\nYour stage determines which quests appear in the Business tab and which tools we recommend.`,
    contextualPrompts: [
      { id: 'not_sure_stage', label: "I'm not sure which stage I'm at" },
    ],
    faq: {
      not_sure_stage: `Think about it this way:\n\n- Do you have paying customers? If yes, Stage 4+\n- Have you built something people can use? If yes, Stage 3\n- Have you tested the idea with real people? If yes, Stage 2\n- Still at the idea stage? Stage 1\n\nWhen in doubt, pick the earlier stage. It's better to be pleasantly surprised than overwhelmed.`
    }
  },

  // ============================================
  // 7-DAY CHALLENGE
  // ============================================

  '/7-day-challenge': {
    pageId: 'challenge_overview',
    pageName: '7-Day Challenge',
    whatIsThis: `A gamified 7-day experience with daily quests designed to expand your comfort zone. Think of it as a gym membership for your nervous system — small, consistent reps that add up to real change.`,
    whyMatters: `Your nervous system learns through experience, not information. You can read about comfort zones all day — but reading doesn't expand them. Doing uncomfortable things does.\n\nThis challenge gives you structured, bite-sized ways to teach your system that growth is safe. And hey, you get points. Everyone loves points.`,
    contextualPrompts: [
      { id: 'which_quest', label: 'Which quest should I start with?' },
      { id: 'different_tabs', label: 'What are the different tabs?' }
    ],
    faq: {
      which_quest: `If you're brand new, just pick one that calls to you. Seriously — don't overthink it. The most important thing is completing something, not picking the "perfect" thing.\n\nIf you've been here a while, check your summary to see which categories you've been avoiding. That avoidance? Probably where your growth edge is hiding.`,
      different_tabs: `**Business** — Stage-based quests to build your business. Each stage has Tasks and Voices sub-tabs. The Groans stage contains visibility challenges that push you past your comfort zone.\n\n**Healing** — Daily and weekly practices for emotional processing. Reconnect practices (meditation, breathwork, prayer) and Release practices for stuck emotions.\n\n**Tracker** — Log your daily energy (North/East/South/West) to spot patterns over time.\n\n**Bonus** — Extra activities and feedback opportunities.`
    }
  },

  // Tab-specific content (same route, different context)
  'challenge_groans': {
    pageId: 'groans_stage',
    pageName: 'Groans Stage',
    whatIsThis: `Groans are the things that make you go "ughhhh" — stuff you KNOW you can do, but your body is absolutely not thrilled about. Posting that thing. Sending that message. Raising your prices. You know the ones.`,
    whyMatters: `Here's the magic: every time you groan AND do it anyway, your nervous system learns something new. "Oh wait... we didn't die? Interesting."\n\nThat's literally how we expand. Groan by groan, your comfort zone gets bigger. It's like strength training for your visibility muscles.`,
    contextualPrompts: [
      { id: 'rrr_difference', label: "What's the difference between Recognise, Rewire, and Reconnect?" },
      { id: 'too_big', label: 'What if the groan feels too big?' }
    ],
    faq: {
      rrr_difference: `**Recognise** — Notice your patterns. What protective voice showed up? What fear was underneath? This is awareness mode.\n\n**Rewire** — Take action to create new patterns. Challenge the belief. Do the scary thing your protective voice said not to do.\n\n**Reconnect** — Come back to your body and essence. Breathwork, movement, grounding. This is integration.\n\nIdeally, you cycle through all three: notice the pattern, challenge it, reconnect to yourself. Rinse and repeat.`,
      too_big: `Then it's too big! We're not looking for panic attacks here. We want the "groan zone" — that sweet spot where it's uncomfortable but you're not literally running away.\n\nGood groan: "Ugh, I really don't want to do this... but fine."\nToo big: "I think I'm going to throw up and also move to another country."\n\nIf it's too much, shrink it. Post to 1,000 people? Try 100. Still scary? Try stories. Find the version that makes you groan but not spiral.`
    }
  },

  'challenge_healing': {
    pageId: 'healing_tab',
    pageName: 'Healing',
    whatIsThis: `Release practices for processing stuck emotions that keep your nervous system on high alert. Includes daily micro-releases (90 seconds!), emotion processing, and deeper weekly practices when you're ready.`,
    whyMatters: `Trapped emotions = trapped potential. If your body is holding anger, grief, or shame from the past, your nervous system is using energy to keep that stuff down — energy that could be going toward creating.\n\nReleasing isn't just "woo-woo self-care." It's making space for what you actually want to build.`,
    contextualPrompts: [
      { id: 'release_recognise', label: "What's the difference between Release and Recognise?" },
      { id: 'deep_release', label: 'Do I have to do the deep release every week?' }
    ],
    faq: {
      release_recognise: `**Recognise** (in the Groans stage under Business) is noticing patterns — observing what protective voice showed up, what fear was triggered. It's cognitive.\n\n**Release** (in Healing) is moving energy through your body — breathwork, shaking, crying, movement. It's somatic.\n\nYou can recognise a pattern without releasing the emotion. And you can release emotion without fully understanding where it came from. Both are valuable. They work together.`,
      deep_release: `Nope, totally optional. The Big Release (45+ minutes of intensive practice) is powerful stuff, but it's not required.\n\nIf you're drawn to it, try it. If it feels like too much right now, stick with the daily 90-second releases. They add up more than you'd think.\n\nListen to your body. Some weeks want intensity. Others want gentleness. Both are valid.`
    }
  },

  'challenge_flow_finder': {
    pageId: 'flow_finder_tab',
    pageName: 'Flow Finder',
    whatIsThis: `Quick access to the discovery flows — Skills, Problems, Persona, and Integration. These AI-guided conversations help you understand who you are and what you're actually meant to build.`,
    whyMatters: `You can't build with confidence if you don't know what you're building toward. These flows give you clarity — and clarity is basically anxiety medication for your nervous system.\n\nWhen you know your direction, the "what should I do?" spiral quiets down.`,
    contextualPrompts: [
      { id: 'order', label: 'What order should I do these in?' },
      { id: 'redo', label: 'I already did these — should I redo them?' }
    ],
    faq: {
      order: `Skills → Problems → Persona → Integration\n\nEach builds on the previous. Integration brings everything together, so save it for last.\n\nThat said, if one feels more urgent, follow your gut. You can always circle back.`,
      redo: `Maybe! Your understanding of yourself deepens over time. What you discovered in month 1 might look different from month 3.\n\nCheck your Library of Answers to see what you captured. If it still feels accurate, you're good. If something feels off or incomplete, a fresh conversation can reveal new layers.`
    }
  },

  'challenge_tracker': {
    pageId: 'tracker_tab',
    pageName: 'Tracker',
    whatIsThis: `Log your daily energy using the Flow Compass — a simple N/E/S/W system that tracks how you're feeling. Over time, patterns emerge that help you understand your rhythms.`,
    whyMatters: `Your nervous system speaks through your body. Tracking helps you notice: When do you flow? When do you drain? What correlates with good days vs. hard days?\n\nThis data becomes the foundation for working WITH your system instead of constantly fighting against it.`,
    contextualPrompts: [
      { id: 'directions', label: 'What do the directions mean?' },
      { id: 'how_often', label: 'How often should I log?' }
    ],
    faq: {
      directions: `**North (Green)** — Flow state. Excited + Ease. Everything clicks. This is the zone.\n\n**East (Blue)** — Growth edge. Excited + Resistance. It's hard but you feel alive. You're stretching.\n\n**South (Red)** — Drain. Tired + Resistance. Hard and exhausting. Time to rest or reassess.\n\n**West (Yellow)** — Coasting. Tired + Ease. Things are smooth but energy is low. Might need more challenge, or might need more rest.`,
      how_often: `Once a day is ideal — takes like 30 seconds. Just a quick "how am I feeling right now?"\n\nThe value comes from consistency. A week of data is interesting. A month is revealing. Three months shows you patterns you'd never see otherwise.\n\nDon't stress about perfection. Miss a day? Just log the next one.`
    }
  },

  // ============================================
  // MONEY MODEL FLOWS
  // ============================================

  '/attraction-offer': {
    pageId: 'attraction_offer',
    pageName: 'Attraction Offer',
    whatIsThis: `Build your core offer using the $100M Offers framework. This is your main thing — what people actually pay you for. We'll define the outcome, the pain points, your unique mechanism, and how to price it so it's a no-brainer.`,
    whyMatters: `A clear, compelling offer makes selling feel way less gross. When you KNOW what you're offering creates real value, asking for money becomes an act of service, not self-promotion.\n\nNo more "I hate selling." Just "here's how I can help you."`,
    contextualPrompts: [
      { id: '100m_framework', label: "What's the $100M Offers framework?" },
      { id: 'already_have', label: 'What if I already have an offer?' }
    ],
    faq: {
      '100m_framework': `It's Alex Hormozi's framework for creating offers people genuinely can't refuse. The core idea: instead of competing on price, you create so much value that price becomes almost irrelevant.\n\nWe'll help you nail:\n• The dream outcome (what they really, really want)\n• The pain points (what's in their way)\n• Your unique mechanism (how YOU deliver results)\n• Time to result (how fast they'll see change)\n• Pricing and guarantee (so it feels risk-free)`,
      already_have: `Perfect — we'll sharpen it. Most offers are too vague or too focused on features instead of outcomes.\n\nGoing through this helps you articulate WHY your offer is valuable in a way that actually resonates. Even if you don't change the offer itself, you'll have much better language for it.`
    }
  },

  '/upsell-offer': {
    pageId: 'upsell_offer',
    pageName: 'Upsell Strategy',
    whatIsThis: `Design what you offer AFTER someone buys your main thing. What's the natural next step? How do you deepen the relationship and create even more value for people who want to go further?`,
    whyMatters: `Upsells aren't about squeezing more money out of people — they're about serving the people who WANT more. If someone gets great results from your core offer, they'll often ask "what's next?"\n\nHaving something to offer them isn't pushy. It's helpful.`,
    contextualPrompts: [
      { id: 'upsell_downsell', label: "What's the difference between upsell and downsell?" },
      { id: 'need_now', label: 'Do I need an upsell right away?' }
    ],
    faq: {
      upsell_downsell: `**Upsell** — More expensive, more comprehensive. For people who want to go all-in. "Want the VIP version with 1:1 support?"\n\n**Downsell** — Less expensive, more accessible. For people who can't afford the main thing yet but still want help. "Not ready for the full program? Start with this mini version."\n\nBoth serve different segments of your audience. Neither is better — they're just different entry points.`,
      need_now: `Nope. Start with your core offer. Get people results. Learn what they want next.\n\nYour best upsell ideas will come from actual customers asking "What's next?" or "Do you have something for [specific problem]?"\n\nThis flow helps you brainstorm, but don't stress about having everything figured out on day one.`
    }
  },

  '/downsell-offer': {
    pageId: 'downsell_offer',
    pageName: 'Downsell Strategy',
    whatIsThis: `Design an accessible entry point for people who can't afford (or aren't ready for) your main offer. This is your "gateway" — something valuable at a lower price that lets people experience you.`,
    whyMatters: `Not everyone is ready to buy your main thing. A downsell lets you serve them anyway AND build trust for when they ARE ready.\n\nIt also creates a customer relationship even with people who can't pay full price right now. Some of those people will become your biggest fans later.`,
    contextualPrompts: [
      { id: 'low_ticket_work', label: "Isn't low-ticket a lot of work for little return?" },
      { id: 'good_downsell', label: 'What makes a good downsell?' }
    ],
    faq: {
      low_ticket_work: `It can be, if you build it wrong. The key is creating something that requires minimal ongoing effort — a course, a template pack, a recorded workshop. Build once, sell forever.\n\nThink of it as a trust-builder, not a profit center. The real value is that they experience you, see results, and become warm leads for your core offer.`,
      good_downsell: `A good downsell solves ONE specific problem completely. Not a watered-down version of your main thing — a focused solution to a focused problem.\n\nExample: If your core offer is "Complete Business Launch Program," your downsell might be "The 30-Minute Clarity Session Recording" or "Offer Creation Template Pack."\n\nSpecific and complete beats vague and partial every time.`
    }
  },

  '/continuity-offer': {
    pageId: 'continuity_offer',
    pageName: 'Continuity Strategy',
    whatIsThis: `Design your recurring revenue — something people pay for monthly or annually. Could be a membership, ongoing coaching, software access, or community.`,
    whyMatters: `One-time sales = hamster wheel. You have to keep finding new customers every month just to stay afloat.\n\nContinuity = stability. Recurring revenue you can count on. Even a small amount ($1-2K/month) dramatically changes how your nervous system feels about money. You're not starting from zero every time.`,
    contextualPrompts: [
      { id: 'need_recurring', label: 'Do I need recurring revenue to have a real business?' },
      { id: 'not_subscription', label: "What if my thing doesn't seem like a subscription?" }
    ],
    faq: {
      need_recurring: `No — plenty of successful businesses run on one-time sales. But continuity does create a different kind of stability.\n\nWhen you know $2K is coming in every month regardless of new sales, you can breathe easier. You can take creative risks. You're not in desperation mode.\n\nIt's not required. But it's really, really nice.`,
      not_subscription: `Get creative! Almost anything can have a continuity element:\n\n• **Community access** — monthly membership\n• **Ongoing support** — monthly retainer\n• **Fresh content** — new resources each month\n• **Accountability** — regular check-ins\n• **Tools** — software or template access\n\nWhat would your customers want ongoing help with? Start there.`
    }
  },

  '/leads-strategy': {
    pageId: 'leads_strategy',
    pageName: 'Leads Strategy',
    whatIsThis: `Figure out how you'll attract people into your world. Where will they come from? What will draw them in? This is your lead generation strategy — the top of your funnel.`,
    whyMatters: `No leads = no business. But trying to be everywhere at once = burnout.\n\nA clear lead strategy helps you show up consistently in places where YOUR people already hang out. Instead of random acts of marketing, you have a plan.`,
    contextualPrompts: [
      { id: 'where_leads', label: 'Where should I be generating leads?' },
      { id: 'how_many_sources', label: 'How many lead sources do I need?' }
    ],
    faq: {
      where_leads: `Wherever your ideal customers already spend their time. Not where you think you "should" be — where THEY actually are.\n\nIf your people are on LinkedIn, be on LinkedIn. If they're in Facebook groups, go there. If they listen to podcasts, pitch yourself as a guest.\n\nAlso: pick a platform you'll actually enjoy using. Consistency beats strategy. A mediocre plan you stick with beats a perfect plan you abandon.`,
      how_many_sources: `Start with ONE. Just one. Master it. Then maybe add another.\n\nMost people spread themselves across 5 platforms and suck at all of them. One focused channel done well beats five channels done half-assed.\n\nOnce your first source is generating consistent leads (give it 3-6 months), consider adding a second.`
    }
  },

  '/lead-magnet': {
    pageId: 'lead_magnet',
    pageName: 'Lead Magnet',
    whatIsThis: `Create your free offer — the thing you give away in exchange for someone's email address. Could be a PDF, video, quiz, template, or mini-course.`,
    whyMatters: `A lead magnet lets people experience your value before they pay. It builds trust, shows your expertise, and gives them a taste of what working with you is like.\n\nIt's also how you build an email list — still one of the most valuable assets you can own.`,
    contextualPrompts: [
      { id: 'good_magnet', label: 'What makes a good lead magnet?' },
      { id: 'perfect', label: 'Does it have to be perfect?' }
    ],
    faq: {
      good_magnet: `It solves a small but urgent problem. Not "Ultimate Guide to Everything" — more like "5 Scripts for Cold Outreach" or "The 10-Minute Morning Routine."\n\nGood lead magnets are:\n• **Specific** (not vague and broad)\n• **Quick to consume** (value in under 10 minutes)\n• **A taste of your paid stuff** (so they want more)\n• **Easy for you to create** (don't overcomplicate)\n\nThe best ones are often something you already have — a process you use, notes you've compiled, a template you've made.`,
      perfect: `God, no. Done beats perfect. Every time.\n\nA "pretty good" lead magnet that's actually live will outperform a "perfect" one that's stuck in your head forever. You can always improve it based on feedback.\n\nShip something simple. See if people want it. Make it better later.`
    }
  },

  // ============================================
  // SUPPORT PAGES
  // ============================================

  '/library': {
    pageId: 'library_of_answers',
    pageName: 'Library of Answers',
    whatIsThis: `Your personal archive of everything you've discovered — skills, problems, personas, clusters, insights from all your flows. It's like a second brain, but specifically for self-knowledge.`,
    whyMatters: `Insights fade. You have a breakthrough, and two weeks later you can barely remember it. This library makes sure everything you've learned about yourself is captured and organized.\n\nWhen you need to remember your core skills or ideal persona, it's all right here.`,
    contextualPrompts: [
      { id: 'organized', label: 'How is this organized?' },
      { id: 'edit', label: 'Can I edit my answers?' }
    ],
    faq: {
      organized: `By flow type:\n• **Flow Finder** — Your skills, problems, personas, and opportunity clusters\n• **Nervous System** — Your edges and safety contracts\n• **Healing** — Your selected contracts and healing work\n• **Money Models** — Your offers and strategy\n\nEach section shows your most recent responses plus any AI-generated insights.`,
      edit: `You can redo any flow, which creates new responses. The library keeps your history, so you can see how your thinking has evolved over time.\n\nIf something feels outdated, usually the best move is to redo the flow with fresh eyes rather than editing old answers. You might discover something new.`
    }
  },

  '/business': {
    pageId: 'business_page',
    pageName: 'Business',
    whatIsThis: `Your business stage journey — from Setup through Growth. Each stage has quests that build your business step by step. This is where the real work happens.`,
    whyMatters: `Building a business isn't random hustle. It's a sequence — validate first, then build, then sell, then scale.\n\nThis page shows you exactly where you are, what's next, and how far you've come. Each quest completed is one more piece of the puzzle clicking into place.`,
    contextualPrompts: [
      { id: 'current_stage', label: 'What should I focus on in this stage?' },
      { id: 'next_quest', label: 'Help me understand my next quest' },
      { id: 'graduation', label: 'How do I graduate to the next stage?' }
    ],
    faq: {
      current_stage: `Focus on completing the quests for your current stage in order. Explainer quests give you the knowledge foundation. Action quests put that knowledge into practice.\n\nDon't skip ahead — each stage builds on the previous one. The sequence matters.`,
      next_quest: `Your "Up Next" quest is the first incomplete quest in your current stage. Start there.\n\nIf it's an Explainer, it'll walk you through key concepts. If it's an action quest, you'll be building something real for your business.\n\nStuck? Ask me about the specific quest and I'll help you think through it.`,
      graduation: `Complete all the required quests in your current stage. When you've done enough, you'll be invited to graduate to the next stage.\n\nThe progress ring shows your completion percentage. Once you hit 100%, graduation is unlocked.`
    }
  },

  '/flow-compass': {
    pageId: 'flow_compass_page',
    pageName: 'Flow Compass',
    whatIsThis: `A visual map of your energy over time. See your N/E/S/W logs plotted on a timeline, with patterns highlighted. This is where tracking becomes actual insight.`,
    whyMatters: `One data point is just a moment. Many data points reveal patterns.\n\nThis page shows you: When do you consistently flow? When do you consistently drain? What circumstances correlate with each? Understanding your patterns lets you design life around them instead of fighting against them.`,
    contextualPrompts: [
      { id: 'patterns', label: 'What patterns should I look for?' },
      { id: 'use_info', label: 'How do I use this information?' }
    ],
    faq: {
      patterns: `• **Weekly rhythms** — Are certain days consistently better or worse?\n• **Activity correlations** — What were you doing on North days? South days?\n• **Streaks** — How long do you sustain flow before dipping?\n• **Recovery time** — After a South day, how long until you're back to North?\n\nLook for patterns to replicate (what creates flow) AND patterns to interrupt (what creates drain).`,
      use_info: `Design your week around your patterns:\n\n• **Schedule important work on your typical North days**\n• **Batch admin tasks on West days** (low energy, low resistance)\n• **Protect rest when you notice South patterns emerging**\n• **Lean into East moments** — that's growth happening\n\nYou're not trying to be in North 24/7. You're trying to work with your natural rhythms instead of against them.`
    }
  },

  '/me': {
    pageId: 'profile_page',
    pageName: 'Profile',
    whatIsThis: `Your home base — see your points, streak, stage progress, and quick access to key flows. This is mission control for your Vibe Rise journey.`,
    whyMatters: `Progress visibility creates motivation. Seeing your streak, your points, and how far you've come reminds your nervous system that you're capable of growth.\n\nIt's evidence against the "I always quit" narrative. Look — you're still here.`,
    contextualPrompts: [
      { id: 'stages', label: 'What do the stages mean?' },
      { id: 'level_up', label: 'How do I level up?' }
    ],
    faq: {
      stages: `Your project moves through 6 stages:\n\n1. **Validation** — Test if your idea has legs with real humans\n2. **Product Creation** — Build your core offer and lead magnet\n3. **Testing** — Get feedback, iterate, improve\n4. **Money Models** — Add upsells, downsells, continuity\n5. **Campaign Creation** — Build your lead generation engine\n6. **Launch** — Put it all together and go live\n\nEach stage has specific quests and milestones. You're not just wandering — you're on a path.`,
      level_up: `Complete the milestones for your current stage. Each one has requirements — certain quests, flows, or actions.\n\nCheck your stage tracker to see what's left. When all milestones are complete, you'll be invited to "graduate" to the next stage.\n\nDon't rush. Each stage builds a foundation for the next. Skipping ahead just means cracks in the foundation later.`
    }
  },

  '/weekly-planning': {
    pageId: 'weekly_planning',
    pageName: 'Weekly Planning',
    whatIsThis: `This is where you pick your battles for the week. One groan to face. One intention to hold. Specific things you're actually going to do (not just vaguely hope to do).`,
    whyMatters: `Left to its own devices, your brain will choose comfort over growth every single time. It's not lazy — it's just really, really good at keeping you safe.\n\nWeekly planning is how we outsmart it. You decide what matters while you're motivated, so future-you has a plan when motivation disappears (which it will).\n\nPlus, I'll check in to see if you did it. Gentle accountability.`,
    contextualPrompts: [
      { id: 'pick_groan', label: 'How do I pick my weekly groan?' },
      { id: 'incomplete', label: "What if I don't complete my plan?" }
    ],
    faq: {
      pick_groan: `Look for something in your "groan zone" — uncomfortable but doable. Ask yourself:\n\n• What have I been avoiding?\n• What would feel like a stretch but not a spiral?\n• What would my future self thank me for doing?\n\nIf it doesn't make you slightly uncomfortable, it's probably not a groan. If it makes you want to fake your own death, it's too big.`,
      incomplete: `Then we learn something! This isn't a pass/fail test — it's a calibration exercise.\n\nWhen you come back, I'll ask what happened. Too ambitious? Life exploded? Resistance pulled a coup?\n\nEvery incomplete plan is data about where your real edge is. We're not aiming for perfect. We're aiming for the right-sized challenges for YOUR nervous system.`
    }
  },

  // ============================================
  // BUSINESS STRATEGY FLOWS
  // ============================================

  '/validation-flows': {
    pageId: 'validation_flows_manager',
    pageName: 'Validation Surveys',
    whatIsThis: `Create and manage customer surveys to get real data from real humans. Two main flavors: validation surveys (understand pain points, psychographics, demographics before building) and feedback surveys (improve what you've already created).`,
    whyMatters: `Assumptions are business killers. Your nervous system LOVES staying in your head where it's safe — but building in a vacuum is the riskiest thing you can do.\n\nThese surveys get you out of theory and into reality. Real data from real people who might actually pay you.`,
    contextualPrompts: [
      { id: 'validation_feedback', label: "What's the difference between validation and feedback surveys?" },
      { id: 'how_many_responses', label: 'How many responses do I need?' }
    ],
    faq: {
      validation_feedback: `**Validation surveys** — Before you build. Testing if the problem is real, if people care enough to pay, if your assumptions about your audience are even close.\n\n**Feedback surveys** — After you build. Learning what's working, what's not, and what people want next.\n\nLaunching soon? Validation. Already have customers? Feedback.`,
      how_many_responses: `Quality beats quantity. 10 thoughtful responses beat 100 one-word answers.\n\nFor validation: 15-20 responses usually reveal clear patterns. If you keep hearing the same pain points, you're onto something.\n\nFor feedback: Even 5 detailed responses can show you what to improve. Look for themes, not individual opinions.`
    }
  },

  '/offer-builder': {
    pageId: 'offer_builder',
    pageName: 'Product Builder',
    whatIsThis: `Discover what solutions you could actually create for your audience. This flow helps you brainstorm, evaluate, and pick the right product or service based on your skills, the problems you solve, and what people actually need.`,
    whyMatters: `Most people build what THEY want instead of what their audience needs. Then they wonder why no one buys.\n\nThis bridges the gap. By grounding your offer in real problems and your natural strengths, you create something easier to sell AND easier to deliver.`,
    contextualPrompts: [
      { id: 'vs_attraction', label: 'How is this different from Attraction Offer?' },
      { id: 'too_many_ideas', label: 'What if I have too many ideas?' }
    ],
    faq: {
      vs_attraction: `**Product Builder** — WHAT to create. Brainstorm options, evaluate them, pick the best fit.\n\n**Attraction Offer** — HOW to position it. Take your chosen solution and craft it into an irresistible offer using the $100M framework.\n\nThink of Product Builder as choosing what dish to cook. Attraction Offer is making it look and smell amazing so people actually want to eat it.`,
      too_many_ideas: `Classic creative human problem! Use these filters:\n\n1. Which uses your natural skills? (Check your Flow Finder data)\n2. Which solves a problem you genuinely care about? (Not just profitable — energizing)\n3. Which serves people you actually want to work with?\n4. Which could you create a simple version of in 2 weeks?\n\nStart with the smallest viable version of your best idea. Expand later.`
    }
  },

  '/funnel-builder': {
    pageId: 'funnel_builder',
    pageName: 'Funnel Builder',
    whatIsThis: `Map your complete customer acquisition journey — how strangers become leads, leads become customers, and customers become raving fans. The full path from "never heard of you" to "telling everyone about you."`,
    whyMatters: `Random marketing = random results. A clear funnel shows you exactly where to focus.\n\nInstead of "I need more customers" (vague, overwhelming), you can identify "I need more people going from lead magnet download to booking a call" (specific, actionable).\n\nClarity creates calm. Your nervous system relaxes when it knows the path.`,
    contextualPrompts: [
      { id: 'funnel_stages', label: 'What are the stages of a funnel?' },
      { id: 'complicated', label: 'Do I need a complicated funnel?' }
    ],
    faq: {
      funnel_stages: `The basic flow:\n\n1. **Awareness** — They discover you exist (content, ads, referrals)\n2. **Interest** — They want to learn more (lead magnet, email list)\n3. **Consideration** — They're evaluating if you're right for them (nurture emails, free content)\n4. **Decision** — They decide to buy (sales page, call, checkout)\n5. **Retention** — They come back for more (upsells, community, continuity)\n\nYou don't need all stages perfect on day one. Start with: How do they find me? → How do they buy?`,
      complicated: `Nope. Simple beats complicated, especially at the start.\n\nMinimum viable funnel:\n• One place you show up consistently\n• One lead magnet that captures emails\n• One offer you can sell\n\nThat's it. Add complexity later when you actually need it. Most people overcomplicate way too early.`
    }
  },

  // ============================================
  // CREATOR PORTAL
  // ============================================

  '/create': {
    pageId: 'creator_portal',
    pageName: 'Scale Portal',
    whatIsThis: `Your Scale portal. Where you turn your rule break into packed experiences that change people's lives and pay your bills.`,
    whyMatters: `Most creators stall after finding their thing. They know what they're good at but can't fill a room. This portal gives you the pipeline: find your rule break, design the experience, fill the seats, track what works, improve 3% each time.`,
    contextualPrompts: [
      { id: 'next_step', label: "What should I do next?" },
      { id: 'fill_room', label: "How do I fill my next event?" },
      { id: 'positioning', label: "Help me explain what I do" }
    ],
    faq: {
      next_step: `Look at your launch pad (top of each tab). The first incomplete item is your next step. If everything's done, your next move is to create your next experience and run it.`,
      fill_room: `Three things fill rooms: (1) a clear rule break people can repeat to friends, (2) at least 5 pieces of content about it in the 2 weeks before, (3) personal invites to people who already trust you. Your pipeline walks you through all three.`,
      positioning: `Your positioning lives on the Identity tab. Fill in "what moment brings someone to your door" and "what do they want to feel after" then hit Generate. Pick the one that feels most like you. That's your sentence.`
    }
  },

  // ============================================
  // DEFAULT / FALLBACK
  // ============================================

  default: {
    pageId: 'default',
    pageName: 'Vibe Rise',
    whatIsThis: `You're exploring Vibe Rise — a system designed to help you build something that aligns with who you actually are, not who you think you should be.`,
    whyMatters: `Every piece of Vibe Rise is designed to help you work WITH your nervous system instead of fighting against it. If you're unsure why you're here or what to do next, I've got you.`,
    contextualPrompts: [
      { id: 'what_is', label: 'What is this?' },
      { id: 'why_matters', label: 'Why does this matter?' },
      { id: 'something_else', label: 'I want to do something else' }
    ],
    faq: {
      what_is: `You're in Vibe Rise — where people who want to create a positive impact figure out what they're meant to build and actually follow through on it.`,
      why_matters: `Here's the sneaky truth: you don't rise to the level of your ambitions — you fall to what your nervous system thinks is safe. Everything here is designed to help you find that line and expand it.`,
      something_else: `No problem! What do you want to focus on?\n\n• Understand why you're stuck → Nervous System Map\n• Figure out what to build → Flow Finder\n• Push your comfort zone → 7-Day Challenge\n• Heal and process → Healing tab\n• Work on your offer → Money Model flows\n• See your progress → Library of Answers`
    }
  }
}

// ============================================
// ROUTING RESPONSES (for "I want to do something else")
// ============================================

export const ROUTING_OPTIONS = [
  { id: 'stuck', label: 'Understand why I\'m stuck', icon: '🔍', route: '/nervous-system' },
  { id: 'build', label: 'Figure out what to build', icon: '🎯', route: '/nikigai/skills' },
  { id: 'push', label: 'Push my comfort zone', icon: '💪', route: '/7-day-challenge' },
  { id: 'heal', label: 'Heal and process emotions', icon: '🧘', route: '/7-day-challenge?tab=courage' },
  { id: 'offer', label: 'Work on my offer/business', icon: '💰', route: '/attraction-offer' },
  { id: 'progress', label: 'See my progress', icon: '📊', route: '/library' }
]

// ============================================
// SOUTH MODE OVERRIDES
// ============================================

export const SOUTH_MODE = {
  greeting: `Hey, looks like your tank is empty lately. That's okay — rest is part of the work. What feels manageable today?`,
  additionalPrompt: { id: 'rest', label: 'I need to rest, not push' },
  restResponse: `Heard. Your nervous system is telling you something. Today isn't about groans — maybe try a gentle Release practice or just log how you're feeling.\n\nThere's no medal for pushing through exhaustion. Sometimes the most powerful thing you can do is absolutely nothing.\n\nBe gentle with yourself. The work will still be here when you're ready.`
}

// ============================================
// PUBLIC LEAD MAGNET FLOWS (Sales Rep Mode)
// ============================================

export const PUBLIC_FLOW_CONTENT = {
  // Money Model flows (all share similar context)
  '/try/offer/attraction': {
    pageId: 'public_attraction_offer',
    pageName: 'Attraction Offer Assessment',
    whatIsThis: `You're taking a free assessment based on Alex Hormozi's $100M Offers framework. In a few minutes, you'll know exactly what type of offer fits your skills and audience — and how to position it so people actually want to buy.`,
    whyMatters: `Most people guess at their offer and hope it works. This assessment cuts through the guesswork and shows you the strategic path forward.\n\nAnd here's the thing most business tools won't tell you: knowing WHAT to build is only half the battle. The other half? Actually doing it without your brain sabotaging you every step of the way.`,
    contextualPrompts: [
      { id: 'what_is_fmf', label: 'What is Vibe Rise?' },
      { id: 'what_is_flow', label: 'What do you mean by "Vibe Rise"?' },
      { id: 'how_different', label: 'How is this different?' },
      { id: 'what_next', label: 'What happens after this?' }
    ],
    faq: {
      what_is_fmf: `Vibe Rise is where people who want to create a positive impact figure out what they're meant to build — and actually follow through on it.\n\nImagine if a university, HubSpot, a marketing agency, and an AI business coach had a baby... and that baby also understood what's causing you to feel stuck.\n\nThat's us. Strategy + healing + accountability + tools. All in one place.`,
      what_is_flow: `Ever since Huzz (the creator) quit his job two and a half years ago, he developed an unwavering belief in 'Flow'.\n\nThe idea that there's a **unique path that only YOU could walk** — due to your combination of skills, experiences, and circumstances.\n\nWhen you find your flow — aligning what gives you flow *internally* with what's flowing *externally* — life becomes crazy and magical.\n\nThis app is designed to help you find that flow. It has everything Huzz wishes he had on his journey from the beginning.\n\nSo you can go from idea to monetising your mission as fast as possible.`,
      how_different: `Here's what nobody else is doing:\n\n**Most business tools assume you'll just... execute.** They give you the strategy and expect you to follow through. But you've probably noticed — knowing what to do and DOING it are very different things.\n\nVibe Rise treats the root cause: the fear, perfectionism, and imposter syndrome that keep you stuck. We work WITH your nervous system instead of pretending it doesn't exist.\n\nPlus we've got the tactical stuff too — CRM, content generation, marketing strategy, gamified accountability. It's the whole stack.`,
      what_next: `After you finish this assessment, you'll see your results and have a chance to explore the full Vibe Rise experience.\n\nInside, you'd get:\n• AI-guided discovery of your skills, ideal customers, and what to build\n• Nervous system work to clear the invisible blocks\n• A gamified 7-day challenge to expand your comfort zone\n• CRM to manage your customer relationships\n• Content and marketing strategy tools\n\nBasically everything you need to go from "I have an idea" to "I have paying customers" — without the usual self-sabotage along the way.`
    }
  },

  '/try/offer/upsell': {
    pageId: 'public_upsell_offer',
    pageName: 'Upsell Strategy Assessment',
    whatIsThis: `You're figuring out your upsell strategy — what to offer people AFTER they buy your main thing. This isn't about squeezing more money out of people. It's about serving the ones who want to go deeper.`,
    whyMatters: `The best upsells feel like a gift, not a pitch. When someone gets great results from you, they naturally ask "what's next?" Having an answer ready isn't pushy — it's helpful.\n\nThis assessment helps you design that next step strategically.`,
    contextualPrompts: [
      { id: 'what_is_fmf', label: 'What is Vibe Rise?' },
      { id: 'what_is_flow', label: 'What do you mean by "Vibe Rise"?' },
      { id: 'how_different', label: 'How is this different?' },
      { id: 'what_next', label: 'What happens after this?' }
    ],
    faq: {} // Will inherit from shared
  },

  '/try/offer/downsell': {
    pageId: 'public_downsell_offer',
    pageName: 'Downsell Strategy Assessment',
    whatIsThis: `You're designing an accessible entry point — something valuable for people who aren't ready for your main offer yet. Think of it as a trust-builder that lets people experience your magic at a lower commitment.`,
    whyMatters: `Not everyone is ready to buy your main thing. A good downsell serves them anyway AND builds the relationship for when they ARE ready.\n\nSome of your biggest fans will start as downsell customers.`,
    contextualPrompts: [
      { id: 'what_is_fmf', label: 'What is Vibe Rise?' },
      { id: 'what_is_flow', label: 'What do you mean by "Vibe Rise"?' },
      { id: 'how_different', label: 'How is this different?' },
      { id: 'what_next', label: 'What happens after this?' }
    ],
    faq: {}
  },

  '/try/offer/continuity': {
    pageId: 'public_continuity_offer',
    pageName: 'Continuity Strategy Assessment',
    whatIsThis: `You're exploring recurring revenue models — memberships, subscriptions, ongoing support. The stuff that lets you stop starting from zero every month.`,
    whyMatters: `One-time sales = hamster wheel. Continuity = stability.\n\nEven a small amount of recurring revenue ($1-2K/month) completely changes how your nervous system feels about money. You can breathe. You can take creative risks. You're not in desperation mode.`,
    contextualPrompts: [
      { id: 'what_is_fmf', label: 'What is Vibe Rise?' },
      { id: 'what_is_flow', label: 'What do you mean by "Vibe Rise"?' },
      { id: 'how_different', label: 'How is this different?' },
      { id: 'what_next', label: 'What happens after this?' }
    ],
    faq: {}
  },

  '/try/offer/leads': {
    pageId: 'public_leads_strategy',
    pageName: 'Lead Strategy Assessment',
    whatIsThis: `You're mapping out how you'll attract people into your world. Where will they come from? What will draw them in? This is the top of your funnel — the foundation of everything else.`,
    whyMatters: `No leads = no business. But trying to be everywhere at once = burnout.\n\nA clear strategy helps you show up consistently where YOUR people actually hang out. No more random acts of marketing.`,
    contextualPrompts: [
      { id: 'what_is_fmf', label: 'What is Vibe Rise?' },
      { id: 'what_is_flow', label: 'What do you mean by "Vibe Rise"?' },
      { id: 'how_different', label: 'How is this different?' },
      { id: 'what_next', label: 'What happens after this?' }
    ],
    faq: {}
  },

  '/try/offer/lead-magnet': {
    pageId: 'public_lead_magnet',
    pageName: 'Lead Magnet Assessment',
    whatIsThis: `You're figuring out what free thing to offer in exchange for someone's email. Could be a PDF, video, quiz, template, or mini-course. Something that gives people a taste of your value.`,
    whyMatters: `A lead magnet lets people experience you before they pay. It builds trust, shows your expertise, and starts the relationship.\n\nPlus, email lists are still one of the most valuable assets you can own. Social platforms come and go — your list is yours.`,
    contextualPrompts: [
      { id: 'what_is_fmf', label: 'What is Vibe Rise?' },
      { id: 'what_is_flow', label: 'What do you mean by "Vibe Rise"?' },
      { id: 'how_different', label: 'How is this different?' },
      { id: 'what_next', label: 'What happens after this?' }
    ],
    faq: {}
  },

  '/try/nervous-system': {
    pageId: 'public_nervous_system',
    pageName: 'Nervous System Assessment',
    whatIsThis: `You're about to discover the invisible line where your nervous system says "nope, too scary" — even when your brain says "let's go."\n\nThrough some simple questions (and maybe a body-based test), we'll find the beliefs that are quietly running the show behind the scenes.`,
    whyMatters: `Here's the sneaky truth nobody talks about:\n\n**You don't rise to the level of your ambitions. You fall to what your nervous system thinks is safe.**\n\nIt's like having an overprotective bodyguard who won't let you into the VIP section of your own life. This assessment shows you exactly where that bouncer is standing.\n\nOnce you see the line, you can start moving it.`,
    contextualPrompts: [
      { id: 'what_is_fmf', label: 'What is Vibe Rise?' },
      { id: 'what_is_flow', label: 'What do you mean by "Vibe Rise"?' },
      { id: 'how_different', label: 'How is this different?' },
      { id: 'why_ns', label: 'Why does nervous system stuff matter for business?' },
      { id: 'what_next', label: 'What happens after this?' }
    ],
    faq: {
      what_is_fmf: `Vibe Rise is where people who want to create a positive impact figure out what they're meant to build — and actually follow through on it.\n\nImagine if a university, HubSpot, a marketing agency, and an AI business coach had a baby... and that baby also understood what's causing you to feel stuck.\n\nThat's us. Strategy + healing + accountability + tools. All in one place.`,
      what_is_flow: `Ever since Huzz (the creator) quit his job two and a half years ago, he developed an unwavering belief in 'Flow'.\n\nThe idea that there's a **unique path that only YOU could walk** — due to your combination of skills, experiences, and circumstances.\n\nWhen you find your flow — aligning what gives you flow *internally* with what's flowing *externally* — life becomes crazy and magical.\n\nThis app is designed to help you find that flow. It has everything Huzz wishes he had on his journey from the beginning.\n\nSo you can go from idea to monetising your mission as fast as possible.`,
      how_different: `Here's what nobody else is doing:\n\n**Most business tools assume you'll just... execute.** They give you the strategy and expect you to follow through. But you've probably noticed — knowing what to do and DOING it are very different things.\n\nVibe Rise treats the root cause: the fear, perfectionism, and imposter syndrome that keep you stuck. We work WITH your nervous system instead of pretending it doesn't exist.\n\nPlus we've got the tactical stuff too — CRM, content generation, marketing strategy, gamified accountability. It's the whole stack.`,
      why_ns: `Ever wonder why you KNOW what to do but can't make yourself do it?\n\nThat's not a discipline problem. It's a nervous system problem.\n\nYour body learned somewhere along the way that being visible, charging money, or putting yourself out there = danger. Maybe you got rejected. Maybe you were laughed at. Maybe success meant losing people you loved.\n\nNow that belief runs in the background like invisible software, quietly vetoing your dreams.\n\n**Most business programs ignore this entirely.** They give you more strategy, more tactics, more "just do it" energy. And you keep not doing it.\n\nWe fix the root cause first. Then the tactics actually work.`,
      what_next: `After you finish this assessment, you'll see what beliefs might be holding you back — and have a chance to explore the full Vibe Rise experience.\n\nInside, you'd get:\n• Deep nervous system work to clear those invisible blocks\n• AI-guided discovery of your skills, ideal customers, and what to build\n• A gamified 7-day challenge to expand your comfort zone\n• Healing practices to process stuck emotions\n• CRM, content tools, marketing strategy — the whole tactical stack\n\nIt's everything you need to build something meaningful without your brain sabotaging you along the way.`
    }
  }
}

// Shared FAQ responses for public flows (to avoid repetition)
const SHARED_PUBLIC_FAQ = {
  what_is_fmf: PUBLIC_FLOW_CONTENT['/try/nervous-system'].faq.what_is_fmf,
  what_is_flow: PUBLIC_FLOW_CONTENT['/try/offer/attraction'].faq.what_is_flow,
  how_different: PUBLIC_FLOW_CONTENT['/try/nervous-system'].faq.how_different,
  what_next: PUBLIC_FLOW_CONTENT['/try/offer/attraction'].faq.what_next
}

// Apply shared FAQs to flows that don't have custom ones
Object.keys(PUBLIC_FLOW_CONTENT).forEach(route => {
  if (route.startsWith('/try/offer/')) {
    PUBLIC_FLOW_CONTENT[route].faq = {
      ...SHARED_PUBLIC_FAQ,
      ...PUBLIC_FLOW_CONTENT[route].faq
    }
  }
})

// ============================================
// PUBLIC VALIDATION FLOW (Survey Mode)
// ============================================

export const PUBLIC_VALIDATION_CONTENT = {
  pageId: 'public_validation',
  pageName: 'Survey',
  whatIsThis: `Hey! You're filling out a survey for someone who's building something to help people like you. Your honest answers will directly shape what they create.`,
  whyMatters: `This isn't a corporate market research thing. A real human is on the other end, trying to understand your world so they can actually help. Your input matters more than you'd think.`,
  contextualPrompts: [
    { id: 'what_is_this', label: 'What is this survey for?' },
    { id: 'what_is_fmf', label: 'What is Vibe Rise?' },
    { id: 'use_for_business', label: 'Can I use this for my business?' }
  ],
  faq: {
    what_is_this: `Someone's building something to help people like you — and they want to get it right.\n\nInstead of guessing what you need, they're asking. Wild concept, right?\n\nYour answers go directly into shaping what gets built. No fluff. Just real input from real humans.`,
    what_is_fmf: `Vibe Rise is where people who want to create a positive impact figure out what they're meant to build and actually follow through on it.\n\nThe person who sent you this survey is using Vibe Rise to create something meaningful. They're not just chasing money — they're trying to solve a real problem for people like you.\n\nSound interesting? You might be a good fit too.`,
    use_for_business: `Absolutely. If you've got something you want to build — or you're stuck on something you've already started — Vibe Rise might be exactly what you need.\n\nHere's what makes it different: most people don't fail because they lack skills or strategy. They fail because their nervous system quietly sabotages them every time they try to grow.\n\nWe fix that part.`
  },
  completionCTA: {
    title: 'Thanks for sharing your thoughts!',
    subtitle: 'The person who sent this is building something for people like you. Keep an eye out — you might be first in line.',
    ctaText: 'Curious about what they\'re using?',
    ctaDescription: 'Vibe Rise helps people discover what they\'re meant to build and actually make it happen — by working WITH their nervous system instead of fighting against it.',
    ctaButton: 'Check out Vibe Rise →',
    ctaLink: '/'
  }
}

/**
 * Get content for a specific route
 */
export function getPageContent(route) {
  // Exact match first
  if (PAGE_CONTENT[route]) {
    return PAGE_CONTENT[route]
  }

  // Check for public lead magnet flows
  if (route.startsWith('/try/')) {
    // Handle /try/offer/:flowType routes
    if (route.startsWith('/try/offer/')) {
      const flowType = route.split('/')[3]
      const publicRoute = `/try/offer/${flowType}`
      return PUBLIC_FLOW_CONTENT[publicRoute] || PUBLIC_FLOW_CONTENT['/try/offer/attraction']
    }
    // Handle /try/nervous-system
    if (route === '/try/nervous-system') {
      return PUBLIC_FLOW_CONTENT['/try/nervous-system']
    }
    // Fallback for other /try routes
    return PUBLIC_FLOW_CONTENT['/try/offer/attraction']
  }

  // Check for dynamic routes
  if (route.startsWith('/nikigai/')) {
    const subRoute = route.split('/')[2]
    return PAGE_CONTENT[`/nikigai/${subRoute}`] || PAGE_CONTENT.default
  }

  if (route.startsWith('/v/')) {
    return PUBLIC_VALIDATION_CONTENT
  }

  // Fallback
  return PAGE_CONTENT.default
}

/**
 * Check if a route is a public (non-authenticated) flow
 */
export function isPublicRoute(route) {
  return route.startsWith('/try/') || route.startsWith('/v/')
}

/**
 * Get tab-specific content for Challenge page
 */
export function getChallengeTabContent(tab) {
  const tabMap = {
    groans: 'challenge_groans',
    healing: 'challenge_healing',
    'flow-finder': 'challenge_flow_finder',
    tracker: 'challenge_tracker'
  }

  return PAGE_CONTENT[tabMap[tab]] || PAGE_CONTENT['/7-day-challenge']
}

/**
 * Get screen-specific content for Onboarding V2 (HomeFirstTime)
 * @param {string} screen - One of: 'welcome', 'q1', 'q2', 'q3', 'persona_reveal'
 */
export function getOnboardingContent(screen) {
  const screenMap = {
    welcome: 'onboarding_welcome',
    archetype_reveal: 'onboarding_welcome',
    // Tension layer questions (v3)
    tension_q1: 'onboarding_tension_q1',
    tension_q2: 'onboarding_tension_q2',
    tension_q3: 'onboarding_tension_q3',
    tension_q4: 'onboarding_tension_q4',
    priority_reveal: 'onboarding_priority_reveal',
    // Legacy mappings (v2 — now in BusinessSetup)
    persona_q1: 'onboarding_q1',
    persona_q2: 'onboarding_q2',
    persona_q3: 'onboarding_q3',
    persona_reveal: 'onboarding_persona_reveal',
    q1: 'onboarding_q1',
    q2: 'onboarding_q2',
    q3: 'onboarding_q3'
  }

  return PAGE_CONTENT[screenMap[screen]] || PAGE_CONTENT['onboarding_welcome']
}

/**
 * Build Zarlo Brief injection text for the system prompt.
 * Returns empty string if no Brief is available.
 * @param {object} userContext - Context object from getUserContext (contains zarloBrief)
 * @returns {string} System prompt injection text
 */
export function getZarloBriefPromptInjection(userContext) {
  if (!userContext?.zarloBrief) return ''

  return `\n\nZARLO BRIEF (pre-computed daily summary of this user's full journey):\n${JSON.stringify(userContext.zarloBrief, null, 2)}\n\nUse this data to notice patterns, name contradictions, and signal approaching thresholds. Be warm but direct. Never shame. Name what you see.`
}
