const stuckPoints = [
  {
    id: 0,
    name: "Flow Finder",
    description: "I have too many ideas and can't pick one",
    icon: "\ud83c\udfaf",
    followUpQuestions: [
      {
        question: "What's actually happening?",
        options: [
          "I keep jumping between ideas and never commit \u2014 everything feels exciting for a week",
          "I have one idea but a voice in my head keeps saying \"what if there's something better?\"",
          "I genuinely don't know which idea could work \u2014 they all seem equal",
          "Everyone around me has opinions and I've lost track of what I actually want",
        ],
      },
      {
        question: "When you imagine picking just ONE \u2014 what comes up?",
        options: [
          "Relief, honestly \u2014 but then immediate panic that I picked wrong",
          "I start poking holes in it before I've even started",
          "I get excited but then a new idea shows up and I'm back to square one",
          "Nothing \u2014 I've been stuck so long I can't feel the signal anymore",
        ],
      },
      {
        question: "What do you need from your founder right now?",
        options: [
          "How they decided \u2014 what made them finally say \"this one\"",
          "Permission to pick something imperfect and run with it",
          "A framework that cuts through the noise \u2014 not more options",
          "Their story of what they said NO to, and how it felt",
        ],
      },
    ],
  },
  {
    id: 1,
    name: "Validation",
    description: "How do I ensure I create something people want?",
    icon: "\u2705",
    followUpQuestions: [
      {
        question: "What's actually happening?",
        options: [
          "I think people want this but I have zero proof \u2014 just a gut feeling",
          "People say \"great idea!\" but nobody's actually reaching for their wallet",
          "I'm terrified to ask in case the answer is \"no one cares\"",
          "I don't even know who my ideal customer is yet \u2014 it's a blur",
        ],
      },
      {
        question: "What's your pattern when it comes to checking if people want something?",
        options: [
          "I skip validation and just build \u2014 asking feels vulnerable",
          "I ask safe people (friends, family) who'll say nice things",
          "I overthink who to ask and how to ask until I never ask at all",
          "I've tested but the signals are confusing \u2014 some love it, some don't get it",
        ],
      },
      {
        question: "What do you need from your founder right now?",
        options: [
          "How they found their first believers before anything was built",
          "A scrappy way to test demand this week \u2014 not a 6-month research project",
          "The courage to put it in front of strangers and handle the truth",
          "How they read the signal through the noise \u2014 what counts as real validation",
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Product Creation",
    description: "I don't know how to turn my idea into something real",
    icon: "\ud83d\udee0\ufe0f",
    followUpQuestions: [
      {
        question: "What's actually happening?",
        options: [
          "The gap between my vision and what I can actually build feels massive",
          "I've started three times and scrapped it each time \u2014 nothing feels right",
          "I keep adding things because it doesn't feel \"enough\" to show anyone",
          "I'm paralysed by the first step \u2014 I literally don't know where to begin",
        ],
      },
      {
        question: "When you sit down to build, what happens?",
        options: [
          "I tinker on details that don't matter because the big decisions feel too scary",
          "I get overwhelmed by how much there is to do and shut down",
          "I build something, hate it, and start over from scratch",
          "I research how OTHER people built theirs instead of building mine",
        ],
      },
      {
        question: "What do you need from your founder right now?",
        options: [
          "What their first version actually looked like \u2014 the ugly, embarrassing truth",
          "How they decided what to cut so they could actually ship",
          "How they built something real with no money, no team, no experience",
          "The moment they stopped planning and started making \u2014 what flipped the switch",
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Testing",
    description: "How do I ensure what I create works and people want it?",
    icon: "\ud83e\uddea",
    followUpQuestions: [
      {
        question: "What's actually happening?",
        options: [
          "I built it but I'm avoiding showing it to anyone \u2014 it's not \"ready\"",
          "People have tried it and the response is... lukewarm",
          "I'm getting feedback but it's all over the place \u2014 I don't know what to fix first",
          "Users try it once and don't come back \u2014 something's off but I can't see what",
        ],
      },
      {
        question: "How do you handle criticism of your work?",
        options: [
          "I take it personally \u2014 even constructive feedback stings",
          "I dismiss it too quickly \u2014 \"they don't get the vision\"",
          "I try to fix everything everyone says and lose the original idea",
          "I actually want honest feedback but people keep being polite instead of real",
        ],
      },
      {
        question: "What do you need from your founder right now?",
        options: [
          "How they knew what feedback to listen to and what to ignore",
          "Their story of showing something unfinished and what happened next",
          "How many times they iterated before it actually clicked",
          "What signal told them \"this works\" \u2014 the specific moment they knew",
        ],
      },
    ],
  },
  {
    id: 4,
    name: "Money Models",
    description: "How do I turn this into a profitable business?",
    icon: "\ud83d\udcb0",
    followUpQuestions: [
      {
        question: "What's actually happening?",
        options: [
          "People love what I do but I can't figure out how to make money from it",
          "I'm charging something but it feels random \u2014 I have no idea if it's right",
          "I keep giving it away for free because asking for money feels uncomfortable",
          "I'm making money but it's not enough to sustain this \u2014 something's broken",
        ],
      },
      {
        question: "What's your relationship with charging for your work?",
        options: [
          "I undercharge because I'm scared people will say no at a higher price",
          "I avoid the money conversation entirely \u2014 I just want to do the work",
          "I've tried different prices but nothing feels like it \"fits\"",
          "I charge confidently for some things but not for THIS \u2014 it feels different",
        ],
      },
      {
        question: "What do you need from your founder right now?",
        options: [
          "How they found the business model that actually worked for their thing",
          "The moment they stopped undercharging and what changed when they did",
          "How they turned something people liked into something people paid for",
          "A way of thinking about money that doesn't make me feel like a sellout",
        ],
      },
    ],
  },
  {
    id: 5,
    name: "Grand Slam Offer",
    description: "I can't make my offer feel irresistible",
    icon: "\ud83d\udca5",
    followUpQuestions: [
      {
        question: "What's actually happening?",
        options: [
          "I know what I'm selling but when I describe it, people's eyes glaze over",
          "My offer looks exactly like everyone else's \u2014 nothing makes it stand out",
          "People understand it but they're not excited \u2014 there's no \"I NEED this\" energy",
          "I've got great stuff but I don't know how to package it into one compelling thing",
        ],
      },
      {
        question: "When you look at your offer, what bugs you about it?",
        options: [
          "It's a list of features but there's no story \u2014 no emotion behind it",
          "I'm trying to be everything to everyone and it's diluting the whole thing",
          "I know it's good but I can't articulate WHY it's worth the price",
          "It feels safe \u2014 like I'm holding back from making a bold promise",
        ],
      },
      {
        question: "What do you need from your founder right now?",
        options: [
          "How they turned something ordinary into something people couldn't say no to",
          "The one bold move that made their offer different from everyone else's",
          "How they communicated value so clearly that price became irrelevant",
          "What they promised, guaranteed, or stacked that made people feel stupid saying no",
        ],
      },
    ],
  },
  {
    id: 6,
    name: "Campaign",
    description: "I don't know how to get in front of the right people",
    icon: "\ud83d\udce3",
    followUpQuestions: [
      {
        question: "What's actually happening?",
        options: [
          "I have no idea where my ideal customers actually spend their time",
          "I'm putting stuff out there but it's attracting the wrong people \u2014 or nobody",
          "I know who I want to reach but I feel invisible to them",
          "I've tried marketing but it feels fake \u2014 like I'm performing, not connecting",
        ],
      },
      {
        question: "What's your instinct when it comes to getting attention?",
        options: [
          "I'd rather the work speak for itself \u2014 self-promotion makes me cringe",
          "I'm willing to hustle but I don't know which channel to bet on",
          "I've seen others blow up and I can't figure out what they're doing differently",
          "I start marketing campaigns but give up before they have time to work",
        ],
      },
      {
        question: "What do you need from your founder right now?",
        options: [
          "How they got their first 100 customers with zero budget",
          "The one channel or tactic that actually broke through for them",
          "How they made marketing feel authentic instead of performative",
          "A repeatable system \u2014 not a viral moment, but something I can do every week",
        ],
      },
    ],
  },
  {
    id: 7,
    name: "Launch & Tracking",
    description: "How did they finally find success?",
    icon: "\ud83d\ude80",
    followUpQuestions: [
      {
        question: "What kind of breakthrough story do you need right now?",
        options: [
          "How someone kept going when everything said quit \u2014 and then it clicked",
          "How someone found the ONE move that changed everything overnight",
          "How someone went from years of invisible grinding to suddenly undeniable",
          "How someone turned a pile of failures into their winning formula",
        ],
      },
      {
        question: "Where are you in your journey right now?",
        options: [
          "I've launched but it's slow and quiet \u2014 I'm questioning everything",
          "I'm about to go live and the fear is paralysing",
          "I've been at this a while and honestly, I'm running out of steam",
          "Things are moving but I can't tell if I'm winning or slowly failing",
        ],
      },
      {
        question: "What do you need from your founder right now?",
        options: [
          "Proof that the messy middle is normal \u2014 and it does get better",
          "The specific turning point I can learn from \u2014 what actually shifted",
          "Energy to keep going when nobody's clapping yet",
          "Clarity on what \"making it\" actually looks like \u2014 so I stop chasing ghosts",
        ],
      },
    ],
  },
]

export default stuckPoints
