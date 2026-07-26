const SLIDES = [
  // ============================================================
  // INTRO SLIDES
  // ============================================================
  { type: 'title', section: 'intro' },
  {
    type: 'prologue',
    section: 'intro',
    text: "This book isn't designed to remove the crack. It's designed for once you experience it. To minimise how long you suffer. What took me five years to figure out can become five months with this book as your guide.",
    note: "Author's note / first page before any chapters. The contract with the reader."
  },
  { type: 'instructions', section: 'intro' },
  { type: 'framework', section: 'intro' },
  { type: 'mechanism', section: 'intro' },

  // ============================================================
  // SECTION 1: THE CRACK
  // ============================================================
  {
    type: 'section',
    section: 'crack',
    name: 'The Crack',
    question: '"What happened to me, and what did it install?"',
    chapters: 'Chapters 1-22 \u00b7 The Installation Map'
  },

  // ------ Chapter 1 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '01',
    title: 'The Promise',
    epigraph: 'Current culture: identify with the external, driven to attain the external, ownership society, pain of work.',
    epigraphDate: '2022-09-26',
    description: 'Everyone gets the same pitch. Work hard at school. Get into university. Get the job. Get the salary. Get the house. Then you\'ll be happy.\n\nI followed it perfectly.',
    screenshotLine: null,
    imageConcept: 'A golden road stretching forward, perfectly paved, lined with milestones',
    branch: 'Culture installs fear',
    branchColor: '#fb923c',
    confidence: 90,
    rawEntries: [
      { date: '2022-09-26', text: 'Culture defines the experience we have and the things we identify with. Current culture: identify with the external, driven to attain the external, ownership society, pain of work.' },
      { date: '2022-09-26', text: 'Thesis to save the world: need to change culture from current capitalistic orientation. Self-knowledge plays a role through person by person creating and changing their beliefs.' },
      { date: '2022-11-01', text: 'I realise now my crisis was triggered by recognising this is what capitalism built to. My struggle since has been trying to rationalise and fit in to make it work.' },
      { date: '2026-02-12', text: 'All we are is a human having an experience, it\'s no surprise things like a job title don\'t make us happy. Focus on things that improve the lived experiences we\'re having.' },
      { date: '2026-06-23', text: 'Everything that makes you fulfilled in life is free: relationships, creation, sex are experiences you can create with no money. Money allows you to remove discomfort or create more pleasure. Dopamine diet: money allows more fast food dopamine.' },
      { date: '2026-07-12', text: 'Hero Stage 1: The Matrix. The Misguided Zone — high action, low self-knowledge. Building the wrong life faster. The promise isn\'t just wrong. It\'s the misguided zone. You\'re sprinting, in the wrong direction, and the speed feels like progress.' }
    ],
    connects: [
      { ch: 'Ch 2', num: '02', text: 'The promise breaks in The Earthquake' },
      { ch: 'Ch 11', num: '11', text: 'School is the delivery mechanism of the promise' },
      { ch: 'Ch 25', num: '25', text: 'Head Full of Dreams is where the promise leaves you' }
    ],
    beats: {
      scene: 'I never questioned it. Not once. Because everyone in my life, my parents, my parents\' friends, my friends, were all living that way. The golden road wasn\'t sold to me. It was the water I swam in. School, uni, job, salary, house. Nobody questioned it because nobody could see it. You don\'t question water when you\'re a fish.ouse. I believed every word.',
      tension: 'The promise is universal, unquestioned, and wrong. Nobody asks whether the destination actually contains what it claims.',
      turn: 'The pitch isn\'t a lie. It\'s a map to someone else\'s destination. You can follow it perfectly and arrive somewhere you never wanted to be.',
      land: 'Where had I gone so wrong?',
      fiveC: {
        context: 'Every kid gets the same cultural script: work hard, get happy.',
        catalyst: 'I believed it completely and executed flawlessly.',
        complication: 'The script never mentioned that the destination might be empty.',
        change: 'The map was real. The destination was someone else\'s.',
        consequence: 'A perfectly executed life plan leading to nothing.'
      }
    }
  },

  // ------ Chapter 2 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '02',
    title: 'The Earthquake',
    epigraph: 'My search for purpose was a search to end my suffering.',
    epigraphDate: '2022-09-26',
    description: 'One month into my dream job, I felt nothing. Not tired. Not stressed. Nothing. The happiness they promised wasn\'t late. It was never coming.\n\nIt was like an earthquake hit every building of understanding I had and made them crumble.',
    screenshotLine: 'The happiness they promised wasn\'t late. It was never coming.',
    imageConcept: 'Buildings crumbling, golden road cracking open',
    branch: 'Culture installs fear',
    branchColor: '#fb923c',
    confidence: 90,
    rawEntries: [
      { date: '2022-09-26', text: 'My search for purpose was a search to end my suffering.', protoIp: 'The Crack' },
      { date: '2022-09-26', text: 'Lost passion for Rudder because I thought it was the answer for people like me only to find it didn\'t solve anything. Dark night of the soul my instincts came to being a Buddhist monk.' },
      { date: '2022-09-26', text: 'Every stage of your dream, you only ever feel the same emotions.' },
      { date: '2022-10-22', text: 'Thesis: we are only ever our present experience. Our memories are a story we tell ourselves. Hedonic adaption ensures the outer never changes the inner.' },
      { date: '2026-07-15', text: 'DRAFT NOTE — Write from 23yo Nic: The weird thing was I didn\'t know what was missing. I just knew something was. What was missing was a feeling of aliveness. I\'d seen that feeling as a necessary sacrifice for 15 years (school, uni, internships) because it was going to get me to a promised place. But then I arrived at the promised place and still didn\'t feel it. The problem now: I wasn\'t sacrificing for anything. This was supposed to be it. Looking back it seems silly to think anything was ever going to change. Reminds me of Michael Neill\'s equation from The Inside-Out Revolution: Struggle + Stress + Sacrifice = Success = Happiness. Simplify it: Unhappiness = Success = Happiness. Which leaves you with: Unhappiness = Happiness. I ran that equation for 15 years. Why would I find happiness in a system built on unhappiness?' }
    ],
    connects: [
      { ch: 'Ch 1', num: '01', text: 'The promise that set up the earthquake' },
      { ch: 'Ch 3', num: '03', text: 'The questions that detonate after' },
      { ch: 'Ch 5', num: '05', text: 'Before the crack, there was a kid' }
    ],
    beats: {
      scene: 'One month into the dream job. Sitting at a desk in a VC office in Sydney. Everything I was told to want. And I felt nothing.',
      tension: 'The happiness they promised wasn\'t delayed. It was never part of the package. The entire structure I built my life on had no foundation.',
      turn: 'The earthquake isn\'t the crisis. The earthquake is the honesty. The buildings that crumbled were never yours.',
      land: 'The happiness they promised wasn\'t late. It was never coming.',
      fiveC: {
        context: 'Dream job achieved. Every milestone hit.',
        catalyst: 'One month in: nothing. Not tired, not stressed. Nothing.',
        complication: 'If achieving everything doesn\'t produce the feeling, the entire premise is wrong.',
        change: 'The buildings crumble. Every structure of understanding collapses.',
        consequence: 'The crack opens. There\'s no going back to before you saw it.'
      }
    }
  },

  // ------ Chapter 3 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '03',
    title: 'The Questions',
    epigraph: 'Spent all my time cramming every minute of every day to achieve an ROI. This is the one time of life that you have to explore.',
    epigraphDate: '2022-09-26',
    description: 'Who am I? What\'s my purpose? What am I doing with my life? And why is everyone else still walking this path like it works?\n\nThese questions don\'t arrive politely. They detonate.',
    screenshotLine: null,
    imageConcept: 'Person standing in rubble, looking at their hands',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 70,
    rawEntries: [
      { date: '2022-09-26', text: 'Spent all my time cramming every minute of every day to achieve an ROI. This is the one time of life that you have to explore.' },
      { date: '2022-10-12', text: 'So much of my life is driven by ego.' },
      { date: '2022-11-01', text: 'Doesnt make sense to chase anything that satisfies my ego. No desire. It doesn\'t change anything internally.' }
    ],
    connects: [
      { ch: 'Ch 2', num: '02', text: 'The earthquake triggers the questions' },
      { ch: 'Ch 4', num: '04', text: 'You don\'t choose when they arrive' },
      { ch: 'Ch 20', num: '20', text: 'The questions eventually condense into one sentence' }
    ],
    beats: {
      scene: 'Walking through Sydney after quitting. Everyone in suits, rushing. The same path I just stepped off. And nobody is questioning it.',
      tension: 'These questions don\'t have answers on Google. They require you to dismantle everything you thought you knew about yourself.',
      turn: 'The questions aren\'t a sign something is wrong. They\'re a sign something is finally working. Your real self is waking up.',
      land: 'These questions don\'t arrive politely. They detonate.',
      fiveC: {
        context: 'The crack has opened. The old story no longer holds.',
        catalyst: 'Identity-level questions arrive: Who am I? What\'s my purpose?',
        complication: 'Everyone else is still walking the path like it works.',
        change: 'The questions aren\'t a sign something is wrong. Something is finally working.',
        consequence: 'The questions won\'t stop. Once you see it, you can\'t unsee it.'
      }
    }
  },

  // ------ Chapter 4 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '04',
    title: 'You Don\'t Choose the Crack',
    epigraph: 'I realise now my crisis was triggered by recognising this is what capitalism built to. My struggle since has been trying to rationalise and fit in to make it work. Recognise now I need to break free.',
    epigraphDate: '2022-11-01',
    description: 'Nobody signs up for this. You don\'t decide to have an existential crisis on a Tuesday. The crack happens when the gap between who you\'re pretending to be and who you actually are gets too wide for your nervous system to hold.',
    screenshotLine: null,
    imageConcept: 'A mask with a crack running down the middle',
    branch: 'Body keeps the score',
    branchColor: '#ef4444',
    confidence: 85,
    rawEntries: [
      { date: '2022-11-01', text: 'I realise now my crisis was triggered by recognising this is what capitalism built to. My struggle since has been trying to rationalise and fit in to make it work. Recognise now I need to break free.' },
      { date: '2022-11-05', text: 'I can see how Nomads travel as a form of escape. The constant change keeps them stimulated without addressing what makes them fear from being stationary.' },
      { date: '2024-08-17', text: 'Number 1 source of all fears: Our worth is dependent on our actions.' }
    ],
    connects: [
      { ch: 'Ch 3', num: '03', text: 'The questions that follow the crack' },
      { ch: 'Ch 14', num: '14', text: 'The nervous system responses to the gap' },
      { ch: 'Ch 25', num: '25', text: 'Head Full of Dreams is the aftermath' }
    ],
    beats: {
      scene: 'One month into my first full-time week at my dream job. A hollow fear crept in. The Monday-to-Friday office grind stretching out ahead of me forever. "Is this it?" Two weeks later, Covid lockdowns hit. The earthquake wasn\'t the virus. The virus just removed every distraction that was holding the cracks together.en who I was performing as and who I actually was became physically unbearable.',
      tension: 'Your nervous system can hold the contradiction for years. Decades. Until it can\'t. The crack isn\'t a choice. It\'s a threshold.',
      turn: 'The crack doesn\'t mean you\'re broken. It means the mask finally failed. And the mask failing is the beginning.',
      land: 'The crack happens when the gap between who you\'re pretending to be and who you actually are gets too wide for your nervous system to hold.',
      fiveC: {
        context: 'You\'ve been performing a version of yourself for years.',
        catalyst: 'The gap between mask and essence becomes too wide.',
        complication: 'Your nervous system can no longer sustain the contradiction.',
        change: 'The mask cracks. Not by choice.',
        consequence: 'You can\'t go back to pretending. The body won\'t let you.'
      }
    }
  },

  // ------ Chapter 5 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '05',
    title: 'Before the Crack',
    epigraph: 'Kid software = love, joy, carefree. Conditioning removes it.',
    epigraphDate: '2025-03-17',
    description: 'Rewind. Before the earthquake, before the questions, before any of this. There was a kid.\n\nThat kid had an essence. Something that lit them up before anyone told them to stop.',
    screenshotLine: null,
    imageConcept: 'A child playing freely, glowing with light',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 95,
    rawEntries: [
      { date: '2025-03-17', text: 'Kid software = love, joy, carefree. Conditioning removes it.', protoIp: 'Protective Archetypes' },
      { date: '2023-06-01', text: 'Children are the way they are because they don\'t fear consequences. Over-coming fear is the secret to being more child-like.' },
      { date: '2025-01-02', text: 'I believe somewhere along the way we got the growing up process wrong. To grow up is to grow into ourselves. It saddens me that we failed to create the environment to cultivate this growth.' }
    ],
    connects: [
      { ch: 'Ch 6', num: '06', text: 'Defining essence' },
      { ch: 'Ch 8', num: '08', text: 'Something happened to that kid' },
      { ch: 'Ch 33', num: '33', text: 'The kid knew what skills mattered' }
    ],
    beats: {
      scene: 'Seven years old. Building cubby houses in the backyard. Designing treasure hunts with rules I invented. Making up games nobody asked for. Junior footy on Saturdays, showered in accolades because I hit my growth spurt early. And a boy who wore every colour of the rainbow in fluoro. That kid didn\'t know any of this would be taken from him.',
      tension: 'That kid didn\'t need a purpose workshop. They already knew who they were. Something between then and now made them forget.',
      turn: 'The kid isn\'t gone. They\'re buried. And buried things can be found.',
      land: 'That kid had an essence. Something that lit them up before anyone told them to stop.',
      fiveC: {
        context: 'Before the crack, before the performance, there was a child.',
        catalyst: 'That child had something: a natural energy, a way of being.',
        complication: 'Somewhere between then and now, it got edited out.',
        change: 'The kid isn\'t gone. They\'re buried. And buried things can be found.',
        consequence: 'The crack is the first signal that the kid is still in there, asking to come back.'
      }
    }
  },

  // ------ Chapter 6 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '06',
    title: 'Essence',
    epigraph: 'Our essence is love. However this essence becomes blocked by fear.',
    epigraphDate: '2024-09-16',
    description: 'Your essence is who you were before the world edited you. Not a skill. Not a job title. The energy underneath. The thing that made you come alive before you learned that coming alive wasn\'t safe.',
    screenshotLine: 'Your essence is who you were before the world edited you.',
    imageConcept: 'A light source inside a glass jar, warm and bright',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 95,
    rawEntries: [
      { date: '2024-09-16', text: 'Our essence is love. However this essence becomes blocked by fear. Three reasons: 1) Survival. 2) Protection: we experience trauma that leads us to adopt behaviours to protect ourselves. 3) Conditioning. Return to love is the ultimate role of "healing."', protoIp: 'The Water Model' },
      { date: '2024-09-07', text: 'What makes us unique? The combination of things that we love. There\'s no one on earth with your combination.' },
      { date: '2023-09-15', text: 'Art is the natural expression of the spirit. It\'s opportunity to share a piece of itself.' },
      { date: '2026-07-10', text: 'Your art is like journaling. Journaling frees up one of the 6 spots in your conscious mind, allowing the next layer of the thought to come through. Creation is excavation. Understanding deepens by resolution increasing, not by seeing more. You don\'t need to see MORE. You need to see the same thing in higher resolution. Creation is the tool that increases resolution.', protoIp: 'Creation is excavation' },
      { date: '2026-07-15', text: 'Instagram insight: "Depression = suppressed expression." Once I heard this it broke my heart to see all the uniforms life gives us. From primary school into the workplace. The shirt rip is about reconnecting to the essence underneath these uniforms.' }
    ],
    connects: [
      { ch: 'Ch 5', num: '05', text: 'The kid who had this essence' },
      { ch: 'Ch 7', num: '07', text: 'Essence has a direction' },
      { ch: 'Ch 21', num: '21', text: 'The essence is still there' },
      { ch: 'Ch 39', num: '39', text: 'What the essence voice sounds like' }
    ],
    beats: {
      scene: 'A holotropic breathwork session in Bali. Four years of buried grief from a breakup erupted. And underneath the tears, underneath the grief, underneath everything I\'d been performing, something was still there. Warm. Playful. The same kid who wore the rainbow. Still glowing.here. Warm. Familiar. Mine.',
      tension: 'We\'ve been told essence is something you discover. It\'s not. It\'s something you uncover. It was always there. We just piled things on top of it.',
      turn: 'Essence isn\'t a skill. It isn\'t a job title. It\'s the energy you were born with. The thing that made you come alive before you learned that coming alive wasn\'t safe.',
      land: 'Your essence is who you were before the world edited you.',
      fiveC: {
        context: 'Everyone was born with a core energy, a way of being.',
        catalyst: 'Life, culture, and wounding events buried it.',
        complication: 'Most people think they need to find themselves. They actually need to unbury themselves.',
        change: 'The realisation: essence isn\'t gone. It\'s underneath.',
        consequence: 'The journey isn\'t discovery. It\'s excavation.'
      }
    }
  },

  // ------ Chapter 7 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '07',
    title: 'Direction',
    epigraph: 'I believe we all have a purpose, a mission, a change to create in this life. The problem is school and university teaches us the knowledge to work but never teaches us the self-knowledge that empowers us to identify what that purpose, mission, change is.',
    epigraphDate: '2024-08-18',
    description: 'You also had a direction. Not a career plan. A gravity. The problems that made you angry. The people you wanted to protect. The things your hands wanted to build.\n\nEssence is WHO you are. Direction is WHERE you\'d naturally go.',
    screenshotLine: null,
    imageConcept: 'A compass with a glowing needle, pointing toward something warm',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 90,
    rawEntries: [
      { date: '2024-08-18', text: 'I believe we all have a purpose, a mission, a change to create in this life. The problem is school and university teaches us the knowledge to work but never teaches us the self-knowledge that empowers us to identify what that purpose, mission, change is.' },
      { date: '2022-10-21', text: 'My role: taking life\'s wisdom and communicating them in digestible ways. Helping people upgrade their mental model.' },
      { date: '2024-09-16', text: 'Purpose is to be. Fulfilment is satisfying any motivations that supports that being. Mission is service of others. Meaning is what comes from fulfilling it.' },
      { date: '2026-07-10', text: 'Purpose emerges FROM experiences, not before them. You don\'t find purpose and then act. You act (have experiences) and purpose reveals itself through the ones that light you up most. Direction isn\'t a career plan. It\'s the EXPERIENCES you\'re drawn to. Curiosities point toward those experiences. The cone of safety determines which ones you actually pursue.' }
    ],
    connects: [
      { ch: 'Ch 6', num: '06', text: 'Essence is who, direction is where' },
      { ch: 'Ch 34', num: '34', text: 'Problems that break your heart reveal direction' },
      { ch: 'Ch 37', num: '37', text: 'The intersection of skills, problems, people' },
      { ch: 'Ch 78', num: '78', text: 'The path reveals itself through action, not planning' }
    ],
    beats: {
      scene: 'Lockdown. Fortnightly Zoom calls with Errol, a gentleman in his 70s with white wispy hair who my manager\'s dad connected me with. He asked me to write my first personal mission. What came out: "Empower Aspirational Changemakers to find their Zest." Zest was Dad\'s word for me. The direction had been there all along. I just hadn\'t had anyone ask. To change the system that failed them.',
      tension: 'Direction isn\'t a career path. It\'s a gravitational pull toward certain problems, certain people, certain fights. School never taught you to feel it.',
      turn: 'You don\'t need a five-year plan. You need to notice what already pulls you. The anger, the empathy, the things your hands reach for without being told.',
      land: 'Essence is WHO you are. Direction is WHERE you\'d naturally go.',
      fiveC: {
        context: 'Everyone has a natural direction, a gravity toward certain problems and people.',
        catalyst: 'School trained us to follow career paths, not gravitational pulls.',
        complication: 'When direction gets hijacked, you build someone else\'s dream.',
        change: 'Direction was always there. You just need to notice what already pulls you.',
        consequence: 'Rediscovering direction means listening to what already pulls you.'
      }
    }
  },

  // ------ Chapter 8 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '08',
    title: 'Then Something Happened',
    epigraph: 'Every time we suppress painful emotions, they don\'t disappear. Our body stores them and they become triggers.',
    epigraphDate: '2023-08-02',
    description: 'You didn\'t wake up today and decide to have a protective voice and a limiting belief. Something happened between the time you were born and today that created them.',
    screenshotLine: 'You didn\'t wake up today and decide to have a protective voice and a limiting belief.',
    imageConcept: 'A shadow falling across the child from Chapter 5',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 50,
    rawEntries: [
      { date: '2023-08-02', text: 'School micro-traumas from being authentic due to bantering prevents us from ever growing into our authentic selves. Every urge we have to express also triggers a trauma inside us.', protoIp: 'Protective Archetypes' },
      { date: '2024-08-17', text: 'Number 1 source of all fears: Our worth is dependent on our actions. Accept fear, 9 seconds, then move through.' },
      { date: '2023-04-19', text: 'Dive into finding self-love + enoughness through the lens of somatic awareness. Ego is one source of enoughness. Inner child trauma is another source. Trauma experiences create negative patterns.' }
    ],
    connects: [
      { ch: 'Ch 5', num: '05', text: 'The kid before the event' },
      { ch: 'Ch 9', num: '09', text: 'Stage one: how you arrive' },
      { ch: 'Ch 13', num: '13', text: 'The full installation summary' },
      { ch: 'Ch 19', num: '19', text: 'Software, not identity' }
    ],
    beats: {
      scene: 'Three splinters. Nine years old: primary school formed a boy dancing group. All my friends got chosen. I didn\'t. Bye bye love of dancing. Thirteen: wore every colour of the rainbow in fluoro. Teenage boys laughed. Comment by comment, emotional splinter by emotional splinter, that rainbow disappeared. Then the CEO of my dream internship: "too playful to be a serious employee." Three events. Thirteen years apart. Same message: who you are is not welcome here.rent. Each one so small you barely noticed. Each one so powerful it rewired you.',
      tension: 'Nobody installs a protective voice on purpose. It accumulates. Event by event. Micro-trauma by micro-trauma. Until one day you wake up and the voice is louder than your own.',
      turn: 'The protective voice wasn\'t malicious. It was adaptive. Something happened, and your system did the best it could to keep you safe. The tragedy is that it never stopped.',
      land: 'You didn\'t wake up today and decide to have a protective voice and a limiting belief.',
      fiveC: {
        context: 'Between being born and today, events happened.',
        catalyst: 'Those events installed protective responses.',
        complication: 'The installation was so gradual you never noticed.',
        change: 'The protective voice was adaptive, not malicious. It kept you safe.',
        consequence: 'By adulthood, the installed voice runs the show.'
      }
    }
  },

  // ------ Chapter 9 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '09',
    title: 'You Arrive',
    epigraph: 'Why does vulnerability create connection? If connection = how safe you feel + how much you feel seen.',
    epigraphDate: '2024-10-01',
    description: 'Stage one: infancy. You arrived needing two things. To be seen. To be safe.\n\nIf you got both, you could explore. If you got seen but never settled, your nervous system learned: the world is chaos, stay alert. If you were safe but never seen, it learned: I\'m invisible, don\'t bother.',
    screenshotLine: null,
    imageConcept: 'Three infants. One in a storm, one in a warm home, one alone in a quiet room',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 95,
    rawEntries: [
      { date: '2024-10-01', text: 'Why does vulnerability create connection? If connection = how safe you feel + how much you feel seen. 1) being vulnerable = feeling seen. 2) listening = feeling safe.', protoIp: 'Safety x Expression' },
      { date: '2023-05-15', text: 'The reason when someone feels shit all we need to do is hold space and not "fix" the problem is because the body heals itself.' },
      { date: '2025-02-02', text: 'Conditioning is being given values and boundaries to those values. We have natural instincts that create desires (safety, connection, status). Conditioning determines how we pursue / fulfil those desires.' }
    ],
    connects: [
      { ch: 'Ch 10', num: '10', text: 'Stage two: what you learn works' },
      { ch: 'Ch 14', num: '14', text: 'The four nervous system responses' },
      { ch: 'Ch 62', num: '62', text: 'You fall to the level of what feels safe' }
    ],
    beats: {
      scene: 'I was showered in accolades as a kid. Growth spurt meant I was good at footy early. The world saw me and said: "You\'re special." But the seeing was conditional. It was for what I did, not who I was. Safe? Yes. Seen? Only the performing version. The playful, rainbow-wearing version was never the one getting the trophies.n? Are they safe?',
      tension: 'You didn\'t get to choose your first programming. Your nervous system was writing code before you could speak. Seen but unsafe? Alert forever. Safe but unseen? Invisible forever.',
      turn: 'This isn\'t blame. Your parents did the best they could with their own installation. But understanding stage one explains why your body reacts the way it does today.',
      land: 'You arrived needing two things. To be seen. To be safe.',
      fiveC: {
        context: 'Stage one: infancy. The first installation window.',
        catalyst: 'Two needs: to be seen and to be safe.',
        complication: 'Most people got one without the other.',
        change: 'Understanding stage one explains why your body reacts the way it does today.',
        consequence: 'The nervous system wrote its first rules before you could talk.'
      }
    }
  },

  // ------ Chapter 10 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '10',
    title: 'You Learn What Works',
    epigraph: 'We\'re conditioned our whole childhood to accept not loving what we do in name of a greater goal.',
    epigraphDate: '2023-09-26',
    description: 'Stage two: childhood. You expressed yourself. The world responded.\n\nIf the response was love, you kept going. If your full expression cost you connection, you learned: being myself is dangerous. Edit. Perform. Adapt.',
    screenshotLine: null,
    imageConcept: 'A child reaching out, one hand receiving warmth, the other being pushed away',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 90,
    rawEntries: [
      { date: '2023-09-26', text: 'We\'re conditioned our whole childhood to accept not loving what we do in name of a greater goal.' },
      { date: '2022-10-12', text: 'Everything we do is to feel an emotion. Emotion is based off story we tell ourselves. e.g. we like hobbies our dad does because it makes us feel accepted.' },
      { date: '2023-09-28', text: 'We hide the parts we love the most because we love them so much we don\'t want them to be hurt.' }
    ],
    connects: [
      { ch: 'Ch 9', num: '09', text: 'Stage one: arriving with needs' },
      { ch: 'Ch 11', num: '11', text: 'Stage three: school reinforces it' },
      { ch: 'Ch 15', num: '15', text: 'The protector\'s job emerges here' }
    ],
    beats: {
      scene: 'Redlands cricket. Won best player in the comp. Walked home buzzing. Didn\'t tell my friends. Not because I forgot. Because I didn\'t want to come across as arrogant. In that moment I learnt to dim my brilliance to be accepted. A trophy that taught me the opposite of what trophies are supposed to teach.Keep going. Indifference? Try harder. Criticism? Stop showing people.',
      tension: 'A child doesn\'t know they\'re being programmed. They just know what gets love and what costs love. And they adjust.',
      turn: 'The adaptation wasn\'t weakness. It was intelligence. Your system found the fastest route to belonging. The cost was authenticity.',
      land: 'If your full expression cost you connection, you learned: being myself is dangerous.',
      fiveC: {
        context: 'Stage two: childhood. The expression window.',
        catalyst: 'You expressed yourself and the world responded.',
        complication: 'Some expressions got love. Some got rejection.',
        change: 'You learned to edit yourself. Perform. Adapt.',
        consequence: 'By the end of childhood, you knew which parts of you were safe to show.'
      }
    }
  },

  // ------ Chapter 11 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '11',
    title: 'School Installs the Operating System',
    epigraph: 'School micro-traumas from being authentic due to bantering prevents us from ever growing into our authentic selves.',
    epigraphDate: '2023-08-02',
    description: 'Stage three: adolescence. Sit down. Be quiet. Memorize. Perform. Get graded.\n\nSome kids rebel. Their essence survives but at social cost. Most kids comply. They get praised. And lose themselves so gradually they don\'t notice.',
    screenshotLine: 'Stealing money isn\'t the biggest crime. The biggest crime is stealing curiosity.',
    imageConcept: 'Rows of identical desks. One desk is empty, the chair pushed back.',
    branch: 'School broke the software',
    branchColor: '#94a3b8',
    confidence: 95,
    rawEntries: [
      { date: '2023-08-02', text: 'School micro-traumas from being authentic due to bantering prevents us from ever growing into our authentic selves. Every urge we have to express also triggers a trauma inside us. We become paralysed and conform to the cultural norms of our groups.', protoIp: 'Protective Archetypes' },
      { date: '2022-11-06', text: 'Schools are so crippling because they teach us we\'re all the same. In reality we span a diverse spectrum.' },
      { date: '2025-04-22', text: 'My problem with school is what it does to our programming.' },
      { date: '2026-06-25', text: 'In 1638, the bottleneck was access to information. Harvard dragged knowledge across an ocean. The bottleneck flipped. What\'s scarce now isn\'t information, it\'s embodiment. Integration. Knowing something in your nervous system, not just your head. We\'re still running scarcity-of-information software in an abundance-of-information world. The next leap is experiential.', protoIp: 'Information → Embodiment bottleneck' }
    ],
    connects: [
      { ch: 'Ch 10', num: '10', text: 'Stage two: what you learned in childhood' },
      { ch: 'Ch 12', num: '12', text: 'Stage four: friends finish the job' },
      { ch: 'Ch 1', num: '01', text: 'School delivers the promise' }
    ],
    beats: {
      scene: 'Thirteen. Rainbow fluoro clothes. Teenage boys laughed, teased, called names. "Gay rainbow." Comment by comment, the rainbow disappeared. Thirteen years of no rainbow, no playfulness, no dancing. Basically all the things that light me up and make me, me. Why else could I and every third bloke in Sydney be found wearing blue chinos and Ralph Lauren every weekend?. The kid learns: expression has a cost.',
      tension: 'School doesn\'t just teach subjects. It teaches a way of being. Sit still. Don\'t stand out. Perform on command. Get graded. The kids who comply get rewarded. The kids who resist get punished.',
      turn: 'The ones who comply aren\'t winning. They\'re losing themselves so slowly they don\'t notice until the crack hits twenty years later.',
      land: 'Most kids comply. They get praised. And lose themselves so gradually they don\'t notice.',
      fiveC: {
        context: 'Stage three: adolescence. The conformity machine.',
        catalyst: 'School rewards compliance and punishes authentic expression.',
        complication: 'Micro-traumas from bantering and social punishment install fear of being yourself.',
        change: 'Most kids comply. Some rebel at social cost.',
        consequence: 'By graduation, the operating system is installed. Perform, comply, achieve.'
      }
    }
  },

  // ------ Chapter 12 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '12',
    title: 'Your Friends Decide the Rest',
    epigraph: 'By being highly agreeable you have no identity because you\'re always fitting in to the environment.',
    epigraphDate: '2022-11-01',
    description: 'Stage four: your friend group. The final installation.\n\nIf your group accepted who you really were, you kept your shape. If belonging required you to change, you changed. The Chameleon joins the group and disappears into it. The Withdrawn keeps their shape and loses the group.',
    screenshotLine: null,
    imageConcept: 'A group of silhouettes, one glowing faintly different from the rest',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 55,
    rawEntries: [
      { date: '2022-11-01', text: 'By being highly agreeable you have no identity because you\'re always fitting in to the environment.' },
      { date: '2022-11-14', text: 'Leaving the city you came from breaks you free of the roles and moulds you find yourself in. You are more free to trust and follow your intuition.' },
      { date: '2024-02-24', text: 'Our environment has the ultimate power over our thoughts/conditioning/behaviour. It\'s only me being outside of Sydney, in an environment that celebrates different things, that I observed my own changes.' }
    ],
    connects: [
      { ch: 'Ch 11', num: '11', text: 'School sets up the social dynamics' },
      { ch: 'Ch 13', num: '13', text: 'The complete installation' },
      { ch: 'Ch 17', num: '17', text: 'The Ghost response to not belonging' }
    ],
    beats: {
      scene: 'Fifteen. A new friend group. They liked footy, not the weird games I invented. So I stopped inventing games. They partied hard, so I partied harder. The social butterfly who flourished in groups learned that belonging meant becoming whoever the group needed. The Jackass era began: Venice bridge jumps at 4am in underwear, Dad asking "what\'s coming first, maturity or a body bag?"oud. By the end of the year, I couldn\'t tell where I ended and the group began.',
      tension: 'Friend groups are the final installation stage because they come with the highest stakes: belong or be alone. Most teenagers choose belonging. And belonging requires editing.',
      turn: 'The tragedy isn\'t that you changed. It\'s that the change felt like survival. And your system still thinks it is.',
      land: 'If belonging required you to change, you changed.',
      fiveC: {
        context: 'Stage four: the friend group. The final installation window.',
        catalyst: 'Belonging requires you to match the group.',
        complication: 'Matching the group means editing yourself.',
        change: 'The Chameleon disappears into the group. The Withdrawn keeps their shape and loses the group.',
        consequence: 'By adulthood, the installation is complete.'
      }
    }
  },

  // ------ Chapter 13 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '13',
    title: 'The Installation',
    epigraph: 'All our wounds and programming can be simplified to making us feel safe + affiliation + status.',
    epigraphDate: '2025-06-03',
    description: 'By the time you\'re done, three things have happened:\n1. Your essence got buried.\n2. Your direction got hijacked.\n3. A protective voice got installed to make sure neither ever surfaces.',
    screenshotLine: null,
    imageConcept: 'The Installation Map: three boxes, Essence > Wound > Protection, with arrows showing "installed" and "obscures"',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 50,
    rawEntries: [
      { date: '2025-06-03', text: 'All our wounds and programming can be simplified to making us feel safe + affiliation + status.' },
      { date: '2024-09-16', text: 'Our essence is love. However this essence becomes blocked by fear. Three reasons: 1) Survival. 2) Protection. 3) Conditioning.' },
      { date: '2024-01-31', text: 'Teenage years we don\'t feel safe being our authentic vulnerable self, so we never find self-worth there. End up finding it in culture\'s definition of success.' }
    ],
    connects: [
      { ch: 'Ch 6', num: '06', text: 'Essence: what got buried' },
      { ch: 'Ch 8', num: '08', text: 'The event that triggered it' },
      { ch: 'Ch 14', num: '14', text: 'The four responses to the installation' },
      { ch: 'Ch 19', num: '19', text: 'It\'s software, not identity' }
    ],
    beats: {
      scene: 'Drawing the Installation Map for the first time. Three boxes on a napkin. Essence. Wound. Protection. And suddenly twenty-six years of confusion fit on one page.',
      tension: 'This isn\'t theory. This is what happened to you. Your essence was buried. Your direction was hijacked. A voice was installed. And that voice has been running your life.',
      turn: 'The installation map isn\'t a diagnosis. It\'s a liberation. Once you see it, the voice loses its invisibility. And invisible things have all the power.',
      land: 'A protective voice got installed to make sure your essence never surfaces.',
      fiveC: {
        context: 'Four stages of installation: infancy, childhood, school, friends.',
        catalyst: 'Each stage buried essence deeper and installed protection stronger.',
        complication: 'By adulthood, the protective voice runs the show and you don\'t even know it.',
        change: 'Seeing the installation map for the first time.',
        consequence: 'Three boxes explain your entire life. Essence. Wound. Protection.'
      }
    }
  },

  // ------ Chapter 14 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '14',
    title: 'The Four Responses',
    epigraph: 'We\'re emotional beings that think. Not thinking beings with emotions. Why when we\'re heartbroken we can\'t talk ourselves out of the pain.',
    epigraphDate: '2023-06-05',
    description: 'Your nervous system only had two options: activate or shut down. And within each, two directions: toward or away.\n\nThe Controller fights. The Ghost flees. The Perfectionist freezes. The Auto-Pilot shuts down.\n\nFour responses. One job: keep the wound buried.',
    screenshotLine: null,
    imageConcept: 'The nervous system 2x2. Energised (Y) x Safety (X). Four archetypes in their quadrants. Ventral diagonal glowing.',
    branch: 'Body keeps the score',
    branchColor: '#ef4444',
    confidence: 95,
    rawEntries: [
      { date: '2023-06-05', text: 'Humans are constant waves of emotions. Holding space for someone else is literally simply helping them regulate their own emotions. We\'re emotional beings that think. Not thinking beings with emotions.' },
      { date: '2023-08-21', text: 'Performance improvement evolution: moving away from mindset into the body. Rather than giving yourself a statement, removing the trauma that causes you to need the statement.' },
      { date: '2022-10-12', text: 'Emotions are your body\'s communication mechanism. Cycle of suffering: can\'t escape it but we try to.' }
    ],
    connects: [
      { ch: 'Ch 15', num: '15', text: 'The protector\'s singular job' },
      { ch: 'Ch 16', num: '16', text: 'The Controller in detail' },
      { ch: 'Ch 17', num: '17', text: 'The Ghost in detail' },
      { ch: 'Ch 18', num: '18', text: 'The Perfectionist in detail' }
    ],
    beats: {
      scene: 'Learning polyvagal theory in a workshop in Ubud. The facilitator draws a 2x2 grid. I see myself in every quadrant at different times. The body only has four moves.',
      tension: 'We think our responses are choices. They\'re not. They\'re the body\'s four emergency protocols. Activate or shut down. Toward or away. The wound picks the move.',
      turn: 'Once you see the four responses as a system, not personality, you stop identifying with them. "I am a Controller" becomes "my system runs the Controller program when triggered."',
      land: 'Four responses. One job: keep the wound buried.',
      fiveC: {
        context: 'The nervous system has limited response options.',
        catalyst: 'Two axes: activated/shutdown, toward/away.',
        complication: 'Each person develops a default: Controller, Ghost, Perfectionist, or Auto-Pilot.',
        change: 'Seeing responses as programs, not personality.',
        consequence: 'You can begin to notice which program is running.'
      }
    }
  },

  // ------ Chapter 15 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '15',
    title: 'The Protector\'s Job',
    epigraph: 'To conform is to feel safe. And we\'re conditioned to conform due to the traumas of our teenage years.',
    epigraphDate: '2023-08-02',
    description: 'The protective voice has exactly one job: make sure the wound never gets triggered again. It will sacrifice your dreams, your relationships, your aliveness, your income, your joy. Anything. As long as the wound stays buried.\n\nIt\'s not your enemy. It\'s your bodyguard who doesn\'t know the war is over.',
    screenshotLine: 'It\'s not your enemy. It\'s your bodyguard who doesn\'t know the war is over.',
    imageConcept: 'A bodyguard standing in front of a person trying to walk through an open door',
    branch: 'Body keeps the score',
    branchColor: '#ef4444',
    confidence: 90,
    rawEntries: [
      { date: '2023-08-02', text: 'Every time we suppress these painful emotions, they don\'t disappear. Our body stores them and they become triggers. To conform is to feel safe. And we\'re conditioned to conform due to the traumas of our teenage years.' },
      { date: '2024-04-29', text: 'The black nut/rock inside is part of me that doesn\'t feel safe to be myself. Fear of hurting others is also a fear of stepping into my power. Scared to be great.' },
      { date: '2025-06-01', text: 'Point of healing is to feel safe to respond from higher levels.' }
    ],
    connects: [
      { ch: 'Ch 14', num: '14', text: 'The four forms the protector takes' },
      { ch: 'Ch 16', num: '16', text: 'The Controller: the protector in fight mode' },
      { ch: 'Ch 19', num: '19', text: 'The protector is software, not identity' },
      { ch: 'Ch 40', num: '40', text: 'What the protective voice sounds like' }
    ],
    beats: {
      scene: 'Dream internship. Nailed it. The CEO pulls me aside: "You\'re too playful to be a serious employee." I always saw my playfulness as my superpower. In that moment, it became the thing to hide. The protector installed a new rule: playfulness is a liability. Be serious. Perform. For the next five years at Investible, I did exactly that.e door. Not to hurt you. To protect you.',
      tension: 'The protective voice will sacrifice everything. Dreams, relationships, income, joy. It doesn\'t care about your quality of life. It only cares about one thing: keeping the wound buried.',
      turn: 'The protector isn\'t your enemy. It was installed to keep you safe. The tragedy is that it never received the memo that the war is over.',
      land: 'It\'s not your enemy. It\'s your bodyguard who doesn\'t know the war is over.',
      fiveC: {
        context: 'The protective voice was installed by events. Its job is singular.',
        catalyst: 'Any action that risks triggering the wound gets blocked.',
        complication: 'The protector sacrifices dreams, relationships, and joy to do its job.',
        change: 'Reframing: it\'s not an enemy. It\'s a bodyguard.',
        consequence: 'The bodyguard needs to be retired, not fought.'
      }
    }
  },

  // ------ Chapter 16 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '16',
    title: 'The Controller',
    epigraph: 'I\'ve observed that I\'ve left one matrix for another and that once I climb to the top of this mountain I\'ll once again feel the same.',
    epigraphDate: '2023-08-14',
    description: 'I know this one. My protective voice was the Controller. I worked harder, achieved more, managed everything. Not because it lit me up. Because stopping felt like dying.\n\nThe Controller doesn\'t build YOUR dream. It builds the most impressive thing it can find. To prove you\'re enough. Performing is just controlling what people think of you.',
    screenshotLine: null,
    imageConcept: 'A trophy shelf, full. Person in front of it, empty.',
    branch: 'Body keeps the score',
    branchColor: '#ef4444',
    confidence: 90,
    rawEntries: [
      { date: '2023-08-14', text: 'I\'ve observed that I\'ve left one matrix for another and that once I climb to the top of this mountain I\'ll once again feel the same.' },
      { date: '2022-10-12', text: 'So much of my life is driven by ego.' },
      { date: '2024-03-10', text: 'Design my days based on energy available, not time available. Rest is part of my job. When I show up as Zestful Nic I attract opportunities. Redefine "hardwork" to following the flow.' }
    ],
    connects: [
      { ch: 'Ch 15', num: '15', text: 'The protector\'s job: keep the wound buried' },
      { ch: 'Ch 17', num: '17', text: 'The Ghost: the opposite response' },
      { ch: 'Ch 27', num: '27', text: 'Hubris: the Controller on the Belief Graph' },
      { ch: 'Ch 41', num: '41', text: 'The Controller controlling healing' }
    ],
    beats: {
      scene: 'Five years at Investible. VC firm in Sydney. Good job, good money, good ladder. I knew for three years it wasn\'t my calling. But stopping felt like dying. So I worked harder, took on every project, managed everything. The trophy shelf was full. School awards, uni awards, work awards. Standing in front of it at 25, feeling absolutely nothing.y nothing.',
      tension: 'The Controller\'s trick is that it looks like success. From the outside, you\'re killing it. From the inside, you\'re running. Not toward something. Away from the wound.',
      turn: 'Performing is just controlling what people think of you. The Controller doesn\'t build your dream. It builds the most impressive thing it can find to prove you\'re enough.',
      land: 'I worked harder, achieved more, managed everything. Not because it lit me up. Because stopping felt like dying.',
      fiveC: {
        context: 'The Controller is the fight response: activated, toward.',
        catalyst: 'My system chose control. Work harder. Achieve more. Manage everything.',
        complication: 'Stopping felt like dying because stopping meant facing the wound.',
        change: 'Seeing the trophies as receipts from the protector, not evidence of a life.',
        consequence: 'The Controller was never building my dream. It was proving I was enough.'
      }
    }
  },

  // ------ Chapter 17 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '17',
    title: 'The Ghost',
    epigraph: 'We hide the parts we love the most because we love them so much we don\'t want them to be hurt.',
    epigraphDate: '2023-09-28',
    description: 'The Ghost doesn\'t fight. It flees. Withdraws, avoids, disappears. There\'s energy in the disappearing. The Ghost isn\'t frozen. It\'s running. It just looks passive from the outside because the direction is away.\n\nDisappearing is the safest possible strategy. You can\'t be rejected if you\'re not there.',
    screenshotLine: null,
    imageConcept: 'An empty stage, spotlight on. One figure leaving through the back door.',
    branch: 'Body keeps the score',
    branchColor: '#ef4444',
    confidence: 90,
    rawEntries: [
      { date: '2023-09-28', text: 'We hide the parts we love the most because we love them so much we don\'t want them to be hurt.' },
      { date: '2022-11-05', text: 'I can see how Nomads travel as a form of escape. The constant change keeps them stimulated without addressing what makes them fear from being stationary.' },
      { date: '2024-10-07', text: 'I realise hanging out with friends feels uncomfortable for me. One of the reasons I avoid. Work is a place I find safety.' }
    ],
    connects: [
      { ch: 'Ch 16', num: '16', text: 'The Controller: the opposite response' },
      { ch: 'Ch 18', num: '18', text: 'The Perfectionist: stuck between fight and flight' },
      { ch: 'Ch 42', num: '42', text: 'The Ghost fleeing into self-knowledge' },
      { ch: 'Ch 67', num: '67', text: 'The Ghost disappears from live settings' }
    ],
    beats: {
      scene: 'Post-Covid. The social butterfly who once flourished in large groups started leaving engagement parties early. Six weeks went by without seeing my best friends. I didn\'t reach out. Not because I was busy. Because I didn\'t have the energy to perform. The Ghost doesn\'t fight. It just stops showing up. And hopes nobody notices.sed the email. The Ghost in action.',
      tension: 'The Ghost isn\'t lazy. It\'s strategic. Disappearing is the safest move in a world where showing up risks rejection. You can\'t be hurt if you\'re not there.',
      turn: 'But you also can\'t be seen. The Ghost\'s strategy is airtight protection with one fatal cost: invisibility.',
      land: 'You can\'t be rejected if you\'re not there.',
      fiveC: {
        context: 'The Ghost is the flight response: activated, away.',
        catalyst: 'When expression risks rejection, the Ghost withdraws.',
        complication: 'It looks passive but there\'s energy in the fleeing. The Ghost is running, not frozen.',
        change: 'The Ghost\'s strategy is airtight protection with one fatal cost: invisibility.',
        consequence: 'Perfect protection, but at the cost of ever being seen.'
      }
    }
  },

  // ------ Chapter 18 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '18',
    title: 'The Perfectionist',
    epigraph: 'Anxiety being driven by a desire to control an outcome. The key to the transformation is "trusting yourself."',
    epigraphDate: '2023-07-31',
    description: 'The Perfectionist is the gas and brake pressed at the same time. High standards are the gas. Paralysis is the brake. They WANT to move. They can\'t.\n\n"I just want to get it right." But "right" never arrives. The bar moves every time you approach it. It\'s not about quality. It\'s about never having to face the possibility that your best wasn\'t good enough.',
    screenshotLine: null,
    imageConcept: 'A person at a starting line, muscles tense, feet locked to the ground.',
    branch: 'Body keeps the score',
    branchColor: '#ef4444',
    confidence: 90,
    rawEntries: [
      { date: '2023-07-31', text: 'Anxiety being driven by a desire to control an outcome. The key to the transformation is "trusting yourself."' },
      { date: '2024-01-01', text: 'Theme: Learning self-trust. Biggest key to embracing uncertainty. Without it we expect the worst = fear.' },
      { date: '2023-04-20', text: 'I realise only since I\'ve started Sprouter have I entered Chapter 3. Before that I didn\'t have unconditional self-worth which is why I was scared to post.' },
      { date: '2024-03-20', text: 'Rebelled against sadness because subconsciously tied sadness to being a bad boy = guilty. Love felt conditional. When perfect, people happy = love. If make mistakes, people unhappy = not loved.' }
    ],
    connects: [
      { ch: 'Ch 16', num: '16', text: 'The Controller: activating toward' },
      { ch: 'Ch 17', num: '17', text: 'The Ghost: activating away' },
      { ch: 'Ch 18b', num: '18b', text: 'The Auto-Pilot: full shutdown' },
      { ch: 'Ch 25', num: '25', text: 'Head Full of Dreams: where perfectionism leads' }
    ],
    beats: {
      scene: 'Three months working on a landing page. Changing fonts. Adjusting copy. Redesigning the header. The page never went live. It was never meant to. It was a perfectionism loop.',
      tension: 'The Perfectionist\'s secret: the bar isn\'t about quality. It\'s about avoiding the moment of truth. If it\'s never finished, it can never be judged.',
      turn: 'Gas and brake at the same time. The want is real. The paralysis is real. Neither is the problem. The problem is the belief underneath: my best might not be good enough.',
      land: '"Right" never arrives. The bar moves every time you approach it.',
      fiveC: {
        context: 'The Perfectionist is the freeze response: shutdown, toward.',
        catalyst: 'High standards create the drive. Fear of judgment creates the brake.',
        complication: 'Gas and brake pressed simultaneously. Endless preparation, zero output.',
        change: 'The real fear underneath: my best might not be good enough.',
        consequence: 'Perfectionism isn\'t about quality. It\'s about never having to face that your best might not be enough.'
      }
    }
  },

  // ------ Chapter 18b ------
  {
    type: 'chapter',
    section: 'crack',
    number: '18b',
    title: 'The Auto-Pilot',
    epigraph: 'Needing to feel the lows, to feel the highs, less about contrast and more about numbing yourself. If you\'ve numbed yourself from the lows, you\'re likely numbing yourself from the highs as well.',
    epigraphDate: '2025-01-01',
    description: 'The Auto-Pilot is the one nobody notices. Not fighting. Not fleeing. Not even stuck. Just... going through the motions.\n\nGoes to work. Pays bills. Smiles at dinner. Nobody home.\n\nThis is where most people are when The Crack happens. They\'re not in crisis. They\'re in absence. And they\'ve been calling it "fine" for years.',
    screenshotLine: null,
    imageConcept: 'A person at a dinner table, smiling. Eyes completely empty. Everyone else animated.',
    branch: 'Body keeps the score',
    branchColor: '#ef4444',
    confidence: 90,
    rawEntries: [
      { date: '2025-01-01', text: 'Needing to feel the lows, to feel the highs, less about contrast and more about numbing yourself. If you\'ve numbed yourself from the lows, you\'re likely numbing yourself from the highs as well.', protoIp: 'Dorsal vs Vibe Rise' },
      { date: '2025-01-13', text: 'Regi-beta paradox: stuck / comfortable numb in the middle. Things aren\'t too bad but they aren\'t that good, but because they aren\'t that bad you don\'t have the motivation to make them better. Paradox that summarises western culture.' },
      { date: '2022-11-08', text: 'People suffered for lifetimes working on cotton farms. Humans last longer than you expect in poor situations. Believe a lot of the workforce finds themselves in a similar place.' }
    ],
    connects: [
      { ch: 'Ch 18', num: '18', text: 'The Perfectionist: still has energy' },
      { ch: 'Ch 4', num: '04', text: 'The crack breaks through auto-pilot' },
      { ch: 'Ch 2', num: '02', text: 'The earthquake wakes you from absence' }
    ],
    beats: {
      scene: 'Lockdown. First time I couldn\'t go out on weekends and get my hit of social approval. Forced to confront that sitting at a pub on Saturday nights wasn\'t actually fun. Going six weeks without seeing my best friends and not even noticing. Everyone laughing at a dinner party post-lockdown. Smiling at the right moments. Nodding. But inside: flatline. Nobody home.e right moments. Nodding. But inside: flatline. Not sad. Not happy. Just... operating.',
      tension: 'The Auto-Pilot is the most dangerous response because nobody notices it. Not even you. You can be absent from your own life for decades and call it "fine."',
      turn: 'Most people aren\'t in crisis when the crack hits. They\'re in absence. And the cruelest part of absence is that it feels like nothing at all.',
      land: 'They\'re not in crisis. They\'re in absence. And they\'ve been calling it "fine" for years.',
      fiveC: {
        context: 'The Auto-Pilot is the collapse response: shutdown, away.',
        catalyst: 'The system shuts down completely. Goes through motions.',
        complication: 'Nobody notices. Not friends, not family, not even you.',
        change: 'Not in crisis. In absence. Calling it "fine" for years.',
        consequence: 'You can live an entire life on auto-pilot and only discover it at the crack.'
      }
    }
  },

  // ------ Chapter 19 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '19',
    title: 'Software, Not Identity',
    epigraph: 'Unconditional self-worth = accepting every part of you = releasing all standards / expectations. What creates standards? Conditioning.',
    epigraphDate: '2024-04-29',
    description: 'Here\'s the thing nobody tells you: the protective voice is not who you are. It\'s software that was installed by an event.\n\nYou didn\'t choose the Performer. An experience taught your nervous system that performing was the price of love. The Performer is the receipt, not the purchase.',
    screenshotLine: 'The protective voice is not who you are. It\'s software installed by an event.',
    imageConcept: 'A computer screen showing code running. Behind it, a child\'s drawing barely visible.',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 60,
    rawEntries: [
      { date: '2024-04-29', text: 'Self-worth thoughts: Unconditional self-worth = accepting every part of you = releasing all standards / expectations. What creates standards? Conditioning. By being hurt (protection).' },
      { date: '2023-11-18', text: 'Intellectual understanding doesn\'t connect to an emotional pattern.' },
      { date: '2023-08-21', text: 'Performance improvement evolution: moving away from mindset into the body. Rather than giving yourself a statement, removing the trauma that causes you to need the statement.' },
      { date: '2026-07-12', text: 'Hero Stage 7: Pattern Revealed. Surface patterns (Ghost, Perfectionist, People Pleaser, Controller) all trace back to ONE root belief, usually "I\'m not good enough." The software isn\'t random. It\'s all connected to a single file that was installed early and deep.' },
      { date: '2025-09-10', text: 'The specific software files (encoded beliefs): Success = status (salary, title, followers). Happiness = future (keep pushing, one day you\'ll be happy). Worth = outcomes (how good you perform). Emotions = unsafe (expressing negative emotions is frowned upon). Vulnerability = painful (hide under masks). Safety = sameness (safer to fit in than stand out). These aren\'t your beliefs. They were installed. It\'s not about rebellion. It\'s about remembrance.' }
    ],
    connects: [
      { ch: 'Ch 13', num: '13', text: 'The installation that created the software' },
      { ch: 'Ch 15', num: '15', text: 'The protector\'s job' },
      { ch: 'Ch 20', num: '20', text: 'Naming the software in one sentence' },
      { ch: 'Ch 46', num: '46', text: 'Rewiring the software' }
    ],
    beats: {
      scene: 'Journaling in Canggu. Writing "I am a Performer." And then stopping. Crossing it out. Writing: "My system runs a Performer program. I am not the program."',
      tension: 'We identify with our protective voice so deeply that we think it IS us. "I\'m just a perfectionist." "That\'s just how I am." No. That\'s how you were installed.',
      turn: 'The moment you see the protective voice as software, not identity, everything changes. Software can be updated. Identity feels permanent.',
      land: 'The protective voice is not who you are. It\'s software installed by an event.',
      fiveC: {
        context: 'We identify with our protective patterns as if they\'re personality.',
        catalyst: 'The reframe: it\'s software installed by an event, not who you are.',
        complication: 'The installation happened so early and so deeply that it feels like identity.',
        change: 'Seeing the Performer as a receipt, not a purchase.',
        consequence: 'Software can be updated. Identity feels permanent. This distinction changes everything.'
      }
    }
  },

  // ------ Chapter 20 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '20',
    title: 'The One Sentence',
    epigraph: 'It feels like my intuition has always been guiding me to my truth. I\'ve never known what connected all the parts. But I\'ve just trusted.',
    epigraphDate: '2025-03-09',
    description: 'Part 1 is complete when you can say one sentence:\n\n"I am [Essence]. [What happened] happened. That installed [Protective Voice] to keep me safe. Now [Protective Voice] is running my life instead of [Essence]."\n\nMine: "I am a Playful Creator. The world told me play wasn\'t serious. That installed the Performer. Now the Performer runs my life instead of the Creator."',
    screenshotLine: null,
    imageConcept: 'A person writing one sentence on a blank wall. The wall was previously covered in noise.',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 80,
    rawEntries: [
      { date: '2025-03-09', text: 'It feels like my intuition has always been guiding me to my truth. I\'ve never known what connected all the parts. But I\'ve just trusted. But now with Vibe Rise it feels like everything is now interconnected.' },
      { date: '2024-09-16', text: 'Purpose is to be. Fulfilment is satisfying any motivations that supports that being. Mission is service of others.' },
      { date: '2023-04-03', text: 'If all we are is experience. And that the past is simply stories. Then there\'s no inherent sense of self. Only the stories we tell ourselves. Change the story. Change yourself.' }
    ],
    connects: [
      { ch: 'Ch 6', num: '06', text: 'Essence: the first word in the sentence' },
      { ch: 'Ch 13', num: '13', text: 'The installation: the middle of the sentence' },
      { ch: 'Ch 19', num: '19', text: 'Software, not identity' },
      { ch: 'Ch 79', num: '79', text: 'The sentence revisited at the end' }
    ],
    beats: {
      scene: 'Poland. Staying at Tamara\'s. Sitting with a pen and a blank page. Writing the sentence for the first time. "I am a Playful Creator. The world told me play wasn\'t serious. That installed the Performer. Now the Performer runs my life instead of the Creator." Twenty-six years in one line.',
      tension: 'One sentence shouldn\'t be able to contain an entire life. But this one does. And writing it is terrifying because it means you can no longer pretend you don\'t know.',
      turn: 'The sentence isn\'t the end of Part 1. It\'s the beginning of awareness. You now have words for what was previously just a feeling.',
      land: '"I am a Playful Creator. The world told me play wasn\'t serious. That installed the Performer. Now the Performer runs my life instead of the Creator."',
      fiveC: {
        context: 'Part 1 needs a single output. A sentence that captures the full installation.',
        catalyst: 'The template: I am [Essence]. [Event] installed [Protection]. Now [Protection] runs my life.',
        complication: 'Writing it is terrifying because it makes the invisible permanent.',
        change: 'Twenty-six years of confusion condensed into one line.',
        consequence: 'You can\'t un-know this sentence once you\'ve written it.'
      }
    }
  },

  // ------ Chapter 21 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '21',
    title: 'The Essence Is Still There',
    epigraph: 'Return to love is the ultimate role of "healing." If our essence is love and all we have is life, ultimate goal is to love life.',
    epigraphDate: '2024-09-16',
    description: 'The good news: your essence was never destroyed. It was buried. Buried things can be excavated. Broken things can\'t.\n\nEverything that lit you up as a kid is still underneath the installation. We just need to dig.',
    screenshotLine: 'Buried things can be excavated. Broken things can\'t.',
    imageConcept: 'The glass jar from Chapter 6, now buried under layers of earth. Still glowing.',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 95,
    rawEntries: [
      { date: '2024-09-16', text: 'Return to love is the ultimate role of "healing." If our essence is love and all we have is life, ultimate goal is to love life. Seek moments you love. Stack enough moments you love together and you live a life you love.' },
      { date: '2024-12-07', text: 'How I feel myself softening and opening up. Opening myself up to romantic love. Opening myself up to dreaming again. Opening myself up to expressing. Opening myself up to feeling good.' },
      { date: '2025-03-17', text: 'To reach higher states of consciousness we need to re-embody states of the child.' }
    ],
    connects: [
      { ch: 'Ch 6', num: '06', text: 'The original definition of essence' },
      { ch: 'Ch 47', num: '47', text: 'Reclaiming the kid' },
      { ch: 'Ch 75', num: '75', text: 'Making essence louder than protection' }
    ],
    beats: {
      scene: 'A Buddhist monastery in Thailand. Hiking up alone. Sitting on a rock. Journaling: "I feel like I\'m a playful person but there\'s been no space for me to play. I feel trapped and rigid in my body. As if my spirit is trying to break free but I\'ve reined it in and put it in a cage." The kid from Chapter 5 wasn\'t dead. He was caged. And he was writing me letters.re. Still warm. Still mine.',
      tension: 'The fear is that the crack destroyed you. That you\'re too far gone. That the kid from Chapter 5 is dead.',
      turn: 'Buried is not broken. Everything that lit you up is still underneath. It\'s been waiting.',
      land: 'Buried things can be excavated. Broken things can\'t.',
      fiveC: {
        context: 'After seeing the installation, the fear is: am I too far gone?',
        catalyst: 'The discovery: your essence was buried, not destroyed.',
        complication: 'The installation is thick. Years of conditioning, performance, and protection.',
        change: 'Buried can be excavated. Broken can\'t.',
        consequence: 'This is the good news that makes the rest of the journey possible.'
      }
    }
  },

  // ------ Chapter 22 ------
  {
    type: 'chapter',
    section: 'crack',
    number: '22',
    title: 'What Comes Next Is Worse',
    epigraph: 'I believe the stories we default to end up defining our character. Playing the victim = being at the mercy of circumstances.',
    epigraphDate: '2023-05-18',
    description: 'You\'ve named the crack. You\'ve seen the installation. You now know more about yourself than you did yesterday.\n\nAnd what comes next is the worst part of the whole journey.\n\nYou\'re about to know everything and be able to do nothing.',
    screenshotLine: null,
    imageConcept: 'A person standing at the edge of a cliff, looking down at a vast ocean of clarity. Feet frozen.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 85,
    rawEntries: [
      { date: '2023-05-18', text: 'I believe the stories we default to end up defining our character. Playing the victim = being at the mercy of circumstances. Accepting the challenge = seeing each circumstance as an opportunity.' },
      { date: '2023-12-11', text: 'Can your body build safety in an experience before it has the experience?' },
      { date: '2024-03-24', text: 'How to truly detach from future expectations, not simply tell yourself a story as a coping mechanism?' }
    ],
    connects: [
      { ch: 'Ch 23', num: '23', text: 'The flood begins' },
      { ch: 'Ch 25', num: '25', text: 'Head Full of Dreams: the paralysis zone' },
      { ch: 'Ch 51', num: '51', text: 'The gap between knowing and doing' }
    ],
    beats: {
      scene: 'Errol asked me to set goals. Fortnightly Zoom, lockdown, the gentleman with white wispy hair. I was shocked to find I couldn\'t. Not one. I\'d never extrapolated my life forward and consciously set a direction. "The truth hurt: I never actually set goals before, I just warped myself as I moved between circumstances." I could see the installation now. I could name the voices. And I couldn\'t move. ever. And you\'re standing at the edge, unable to move.',
      tension: 'This is the cruelest part of the journey. Knowing doesn\'t produce doing. The nervous system doesn\'t care about your insights. It cares about what feels safe.',
      turn: 'What comes next is worse than not knowing. It\'s knowing everything and being unable to act on any of it. Welcome to the flood.',
      land: 'You\'re about to know everything and be able to do nothing.',
      fiveC: {
        context: 'Part 1 is complete. The installation is named.',
        catalyst: 'Self-knowledge is high. Action is zero.',
        complication: 'The nervous system doesn\'t care about insights. It cares about safety.',
        change: 'Knowing everything and being able to do nothing.',
        consequence: 'The worst part of the journey begins: Head Full of Dreams.'
      }
    }
  },

  // ============================================================
  // SECTION 2: THE FLOOD
  // ============================================================
  {
    type: 'section',
    section: 'flood',
    name: 'The Flood',
    question: '"Are the beliefs running my life real or installed?"',
    chapters: 'Chapters 23-50 \u00b7 The Belief Graph'
  },

  // ------ Chapter 22b: The Mentor (Errol) ------
  {
    type: 'chapter',
    section: 'crack',
    number: '22b',
    title: 'The Mentor',
    epigraph: 'I was shocked to find I struggled to set goals for myself. I\'d never extrapolated my life forward and consciously set a direction. The truth hurt: I never actually set goals before, I just warped myself as I moved between circumstances.',
    epigraphDate: '2021-11-25',
    description: 'I met Errol at a rural bootcamp. A gentleman in his 70s with white wispy hair. Fortnightly Zoom calls. Self-reflection exercises. Chip away at the personas like a sculptor with a block of marble.\n\nHe helped me find my purpose. "Empower Aspirational Changemakers to find their Zest." Dad\'s word for me.\n\nI had clarity. A mission. A north star.\n\nThree years later I was in the exact same place.',
    screenshotLine: null,
    imageConcept: 'A sculptor chipping at a block of marble. A clear figure emerging inside. But the sculptor\'s feet are in concrete.',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 90,
    rawEntries: [
      { date: '2021-11-25', text: 'Met Errol at a rural bootcamp. Fortnightly Zoom calls during lockdown. Self-reflection exercises. Chip away at personas like a sculptor with a block of marble. First personal mission: "Empower Aspirational Changemakers to find their Zest." Dad\'s word.' },
      { date: '2022-09-26', text: 'My search for purpose was a search to end my suffering.', protoIp: 'The Crack' },
      { date: '2026-07-16', text: 'Errol is both the mentor AND the proof that clarity alone doesn\'t work. He gave me purpose. Real clarity. Real mission. And I was still stuck for 3 more years. That\'s not Errol\'s failure. That\'s the thesis: clarity without safety = Head Full of Dreams. Self-help gives you the clarity. Nobody gives you the safety.' }
    ],
    connects: [
      { ch: 'Ch 7', num: '07', text: 'Direction: where Errol\'s mission came from' },
      { ch: 'Ch 22', num: '22', text: 'What comes next: the cliffhanger before this' },
      { ch: 'Ch 24', num: '24', text: 'The Knowledge Trap: $30K more clarity, same paralysis' },
      { ch: 'Ch 25', num: '25', text: 'Head Full of Dreams: where clarity without safety leads' }
    ],
    beats: {
      scene: 'Lockdown. Fortnightly Zoom with Errol. White wispy hair. The gentleman who saw through every mask. He asked me to set goals and I couldn\'t. "I never actually set goals before. I just warped myself as I moved between circumstances." He helped me chip away until a mission emerged: "Empower Aspirational Changemakers to find their Zest."',
      tension: 'I had clarity. A purpose. A north star. For the first time in my life I could describe what I wanted to build. Errol gave me the gift of seeing myself. And three years later, I was in the exact same place. Same chair. Same paralysis. New vocabulary for the same stuck.',
      turn: 'Clarity was never the bottleneck. I could describe my essence in detail. Name my wound. Articulate my mission. And my body wouldn\'t move. The mentor gave me the map. Nobody gave me the safety to walk it.',
      land: 'I had the answer. I just couldn\'t move toward it.',
      fiveC: {
        context: 'Lockdown. A mentor appears. Fortnightly coaching.',
        catalyst: 'Purpose found. Mission articulated. Clarity gained.',
        complication: 'Three years later: same clarity, same paralysis.',
        change: 'The realisation that clarity was never the bottleneck.',
        consequence: 'The door to Part 2: if clarity doesn\'t work, what does?'
      }
    }
  },

  // ------ Chapter 23 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '23',
    title: 'The Flood',
    epigraph: 'Love to learn because of my desire to grow since I\'m not enough. Once I feel enough, won\'t stop loving learning but will connect with it from a place of pure joy, rather than a place of anxiety.',
    epigraphDate: '2023-02-25',
    description: 'The crack opened. Now everything pours in. Skills you forgot you had. Problems that break your heart. People whose struggle you understand because you lived it.\n\nYou see who you are for the first time. And you can\'t move.',
    screenshotLine: null,
    imageConcept: 'A person sitting in a room filling with water. Calm. Not drowning. Just unable to stand.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 85,
    rawEntries: [
      { date: '2023-02-25', text: 'Love to learn because of my desire to grow since I\'m not enough. Once I feel enough, won\'t stop loving learning but will connect with it from a place of pure joy, rather than a place of anxiety.' },
      { date: '2023-02-19', text: 'Enlightenment = master of unattachment. The reason reference points cause suffering is because we identify with what we\'re seeing.' },
      { date: '2022-11-01', text: 'I found myself spraying energy in every direction trying to find happiness. I realised I needed to direct it inward.' }
    ],
    connects: [
      { ch: 'Ch 22', num: '22', text: 'What comes next is worse' },
      { ch: 'Ch 24', num: '24', text: 'The knowledge trap' },
      { ch: 'Ch 25', num: '25', text: 'Head Full of Dreams' }
    ],
    beats: {
      scene: 'Three months after quitting. Everything is arriving. Skills I\'d forgotten. Problems I cared about. People I wanted to help. The clarity was blinding. And I couldn\'t move an inch.',
      tension: 'The flood isn\'t the problem. The paralysis is. You can see who you are for the first time, and your nervous system won\'t let you act on any of it.',
      turn: 'The flood is not a breakdown. It\'s a breakthrough that your body can\'t catch up to yet. The knowing arrived. The safety hasn\'t.',
      land: 'You see who you are for the first time. And you can\'t move.',
      fiveC: {
        context: 'The crack opened. Self-knowledge floods in.',
        catalyst: 'Skills, problems, people, direction, all become visible at once.',
        complication: 'Your nervous system hasn\'t caught up. You can see but can\'t move.',
        change: 'A breakthrough the body can\'t catch up to yet. The knowing arrived. The safety hasn\'t.',
        consequence: 'Welcome to the paralysis of clarity.'
      }
    }
  },

  // ------ Chapter 24 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '24',
    title: 'The Knowledge Trap',
    epigraph: 'Intellectual understanding doesn\'t connect to an emotional pattern.',
    epigraphDate: '2023-11-18',
    description: 'I spent $30,000 on 52 courses in three years. Every one gave me more clarity. None gave me momentum.\n\nI could describe my essence in detail. I could name my wound. I had frameworks for my frameworks. And I was in the exact same place.',
    screenshotLine: 'Every course gave me more clarity. None gave me momentum.',
    imageConcept: 'A shelf collapsing under the weight of books, certificates, and notes. Person sitting in front of it.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 85,
    rawEntries: [
      { date: '2023-11-18', text: 'Intellectual understanding doesn\'t connect to an emotional pattern.' },
      { date: '2022-10-21', text: 'What do I want to build? Self-knowledge movement with a lens of the ego?' },
      { date: '2024-06-21', text: 'Difference between me and most: I have ambitions to change a system.' },
      { date: '2026-07-10', text: 'Self-help says it\'s a clarity problem. "Find your passion. Discover your purpose. Take this test. Read this book." The assumption: you don\'t know what you want, so you can\'t act. But you already know. You\'ve known for years. $30K on 52 courses didn\'t produce action. One scary thing a week did. The bottleneck was never clarity. It was safety.' }
    ],
    connects: [
      { ch: 'Ch 23', num: '23', text: 'The flood that feeds the trap' },
      { ch: 'Ch 25', num: '25', text: 'Head Full of Dreams: the destination of the trap' },
      { ch: 'Ch 43', num: '43', text: 'The healing trap: another version' },
      { ch: 'Ch 53', num: '53', text: 'One scary thing a week: what actually worked' }
    ],
    beats: {
      scene: '$30,000. Fifty-two courses. Three years. Sitting on my bed in Bali surrounded by notebooks, certificates, and frameworks. More clarity than ever. Same life.',
      tension: 'The knowledge trap is the most expensive form of hiding. You feel like you\'re making progress because you\'re learning. But learning without action is consumption, not transformation.',
      turn: 'Every course raised my self-knowledge. None of them changed what my nervous system felt safe doing. Knowledge without safety is just Head Full of Dreams with a receipt.',
      land: 'Every course gave me more clarity. None gave me momentum.',
      fiveC: {
        context: '$30K on 52 courses in three years.',
        catalyst: 'Each course added clarity.',
        complication: 'None added momentum. Same place, more vocabulary.',
        change: 'Knowledge without safety is just Head Full of Dreams with a receipt.',
        consequence: 'Frameworks for frameworks. Knowledge without action. The most expensive hiding strategy.'
      }
    }
  },

  // ------ Chapter 25 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '25',
    title: 'Head Full of Dreams',
    epigraph: 'You don\'t rise to the level of your ambitions, you fall to the level of your habits + safety. Missing half the equation.',
    epigraphDate: '2025-05-18',
    description: 'There\'s a zone on the map where self-knowledge is high and action is zero. I call it Head Full of Dreams.\n\nYou can see what you want. You can describe it perfectly. You have the vocabulary, the vision, the map. And your body won\'t move.\n\nThis is not laziness. This is your nervous system doing exactly what it was installed to do.',
    screenshotLine: 'Head Full of Dreams',
    imageConcept: 'A thought bubble above someone\'s head, vivid and detailed. Their feet are in concrete.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 95,
    rawEntries: [
      { date: '2025-05-18', text: 'Hustle culture obsesses over habits. But if you don\'t rise to the level of your ambitions, you fall to the level of your habits + safety. It\'s missing half the equation. Arguably the most important half.', protoIp: 'Safety x Expression equation' },
      { date: '2025-01-09', text: 'Limiting belief = fear. Why is it a limiting belief? We don\'t feel safe.' },
      { date: '2024-12-23', text: 'Self-development levels: Level 1: learning the tools. Level 2: deploying the tools. Level 3: not becoming dis-regulated no matter the environment.', protoIp: 'The 7-stage Vibe Rise Journey' },
      { date: '2026-06-28', text: 'The average person cycles through contemplation 3-7 times before reaching action. That\'s not failure. That\'s the nervous system testing whether the identity shift is survivable. Each cycle is a reconnaissance mission.', protoIp: 'Identity Bridge — contemplation cycling' },
      { date: '2026-06-28', text: 'Each person has a thermostat setting for how much success, aliveness, and visibility they\'ll allow themselves. When identity expansion approaches that limit, the system generates self-sabotage to return to the familiar zone. Head Full of Dreams IS the thermostat doing its job.' },
      { date: '2026-07-05', text: 'You already know the life you want. Your body won\'t let you go get it. Every convenience made life easier AND made your nervous system weaker. The range of lives that feel possible got smaller, not bigger.' }
    ],
    connects: [
      { ch: 'Ch 24', num: '24', text: 'The knowledge trap leads here' },
      { ch: 'Ch 26', num: '26', text: 'The Belief Graph maps this zone' },
      { ch: 'Ch 51', num: '51', text: 'The gap between knowing and doing' },
      { ch: 'Ch 62', num: '62', text: 'You fall to the level of what feels safe' }
    ],
    beats: {
      scene: 'Sitting in a cafe in Ubud. Vision board on my laptop. Business plan drafted. Ideal clients described. Skills mapped. Direction clear. And my body is in concrete.',
      tension: 'Head Full of Dreams is the cruelest zone. You have everything except the ability to move. And the world tells you the problem is motivation, or discipline, or another course.',
      turn: 'This is not laziness. This is your nervous system doing exactly what it was installed to do: keep you safe by keeping you still.',
      land: 'You can see what you want. You can describe it perfectly. And your body won\'t move.',
      fiveC: {
        context: 'Self-knowledge is high. Action is zero.',
        catalyst: 'You can describe your essence, your direction, your wound, all of it.',
        complication: 'Your body won\'t move. Not because of laziness. Because of installation.',
        change: 'Naming the zone: Head Full of Dreams.',
        consequence: 'The name itself is a gift. Now you have vocabulary for what you\'re experiencing.'
      }
    }
  },

  // ------ Chapter 26 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '26',
    title: 'The Belief Graph',
    epigraph: 'What belief are you building your suffering on? Seeing my quarter-life crisis as a belief breaking event that changed my thoughts + habits and changed my life.',
    epigraphDate: '2025-02-20',
    description: 'There\'s a way to see this. Two axes. What you believe about yourself. And what the evidence actually shows.',
    screenshotLine: null,
    imageConcept: 'The Belief Graph. Clean. Full page. Belief (Y) x Capability (X). Three zones: Hubris, Empowering Belief, Limiting Belief.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 80,
    rawEntries: [
      { date: '2025-02-20', text: 'What belief are you building your suffering on? Seeing my quarter-life crisis as a belief breaking event that changed my thoughts + habits and changed my life.' },
      { date: '2024-08-17', text: 'Body is a vessel of beliefs. Beliefs create filter for reality. Can\'t see your own beliefs. Helpful for people to observe them for you.' },
      { date: '2025-01-09', text: 'Limiting belief = fear. Why is it a limiting belief? We don\'t feel safe.' }
    ],
    connects: [
      { ch: 'Ch 27', num: '27', text: 'Hubris: top-left of the graph' },
      { ch: 'Ch 28', num: '28', text: 'Limiting Belief: bottom-right' },
      { ch: 'Ch 29', num: '29', text: 'The Diagonal: belief proportional to capability' },
      { ch: 'Ch 50', num: '50', text: 'Bottom Right: where Huzz sat' }
    ],
    beats: {
      scene: 'Drawing the Belief Graph on a napkin. Two axes. Belief on Y. Capability on X. And suddenly I can see where everyone is stuck.',
      tension: 'Most people don\'t know why they\'re stuck. The Belief Graph makes it visual. You can point to the exact gap between what you believe about yourself and what\'s actually true.',
      turn: 'The graph isn\'t a judgment. It\'s a diagnostic. Once you know where you sit, you know what to work on.',
      land: 'Two axes. What you believe about yourself. And what the evidence actually shows.',
      fiveC: {
        context: 'Part 2 needs its own model. The Belief Graph.',
        catalyst: 'Two axes: belief vs capability.',
        complication: 'Most people live in limiting belief: more capable than they believe.',
        change: 'The graph isn\'t a judgment. It\'s a diagnostic.',
        consequence: 'The graph makes the invisible visible.'
      }
    }
  },

  // ------ Chapter 27 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '27',
    editorNote: 'EDITOR Q: Do Hubris/Limiting/Diagonal need 3 separate chapters or one with examples?',
    title: 'Hubris',
    epigraph: 'Doesnt make sense to chase anything that satisfies my ego. No desire. It doesn\'t change anything internally.',
    epigraphDate: '2022-11-01',
    description: 'Top-left of the graph. Belief exceeds capability. The Performer who takes on everything. The Controller who thinks they can manage it all.\n\nThis was me in year two of the VC job. Working harder than anyone. Believing I could outrun the emptiness if I just achieved more.\n\nHubris isn\'t confidence. It\'s the Performer\'s anaesthetic.',
    screenshotLine: null,
    imageConcept: 'A person sprinting on a treadmill, sweating, going nowhere. Speedometer maxed out.',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 60,
    rawEntries: [
      { date: '2022-11-01', text: 'Doesnt make sense to chase anything that satisfies my ego. No desire. It doesn\'t change anything internally. All my previous attempts at being happy were based on fighting with the ego.' },
      { date: '2022-09-26', text: 'I\'ve been seeking to be special, for which I define as differentiated from others. But inherently this is external. We are all special because we\'re all unique.' },
      { date: '2022-10-12', text: 'You tell yourself "I\'m enough" to settle the ego. Ego is where discontent comes from.' }
    ],
    connects: [
      { ch: 'Ch 26', num: '26', text: 'Hubris on the Belief Graph' },
      { ch: 'Ch 16', num: '16', text: 'The Controller: the response that creates hubris' },
      { ch: 'Ch 28', num: '28', text: 'Limiting Belief: the opposite quadrant' },
      { ch: 'Ch 1', num: '01', text: 'The promise that hubris chases' }
    ],
    beats: {
      scene: 'Year two of the VC job. Working twelve-hour days. Taking on every project. Believing I could outrun the feeling if I just moved faster.',
      tension: 'Hubris looks like confidence from the outside. From the inside, it\'s anaesthesia. You can\'t feel the wound if you never stop.',
      turn: 'The treadmill has no finish line. Hubris isn\'t about getting somewhere. It\'s about not having to stop and face what\'s underneath.',
      land: 'Hubris isn\'t confidence. It\'s the Performer\'s anaesthetic.',
      fiveC: {
        context: 'Top-left of the Belief Graph. Belief exceeds capability.',
        catalyst: 'The Controller drives achievement beyond what\'s real.',
        complication: 'It looks like success. It feels like running from something.',
        change: 'The treadmill has no finish line. Hubris is about not stopping.',
        consequence: 'Hubris is the Performer\'s way of numbing the wound through activity.'
      }
    }
  },

  // ------ Chapter 28 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '28',
    editorNote: 'EDITOR Q: Do Hubris/Limiting/Diagonal need 3 separate chapters or one with examples?',
    title: 'Limiting Belief',
    epigraph: 'Fear of not being good enough comes from a lack of trust in performance.',
    epigraphDate: '2024-01-01',
    description: 'Bottom-right of the graph. Capability exceeds belief. This is where most people reading this book live.\n\nYou\'re more capable than you believe. The beliefs holding you back are installed, not earned. "I\'m not ready" was installed when you were twelve. "Who am I to do this" was installed when someone laughed at your first attempt.\n\nYou don\'t need more capability. You need your belief to catch up to your reality.',
    screenshotLine: null,
    imageConcept: 'A person standing at the edge of a pool. The water is shallow. They think it\'s deep.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 85,
    rawEntries: [
      { date: '2024-01-01', text: 'Theme: Learning self-trust. Biggest key to embracing uncertainty. Without it we expect the worst = fear. Fear of not being good enough comes from a lack of trust in performance.' },
      { date: '2024-08-07', text: 'To get paid you need to be remarkable. We\'re all unique so we\'re all remarkable. Never taught who we are so don\'t know our remarkableness.' },
      { date: '2024-01-27', text: 'Fear of non-authentic act can be rationalised away. Fear of authentic act can\'t. You think I\'m silly, I think I\'m beautiful.' },
      { date: '2026-07-15', text: 'Instagram reframe: Rather than call them "limiting beliefs" I prefer to call them "safety stories." You didn\'t wake up today and decide to believe in a limiting belief. Something happened that caused it. A moment of shame, pain or fear. Your body adopted that belief to keep you safe. It\'s not a belief problem. It\'s a safety story your NS wrote to protect you.' }
    ],
    connects: [
      { ch: 'Ch 26', num: '26', text: 'Bottom-right of the Belief Graph' },
      { ch: 'Ch 30', num: '30', text: 'Most beliefs have never been tested' },
      { ch: 'Ch 50', num: '50', text: 'Where Huzz sat: extreme bottom-right' }
    ],
    beats: {
      scene: 'A client who could run workshops in her sleep. Published author. Keynote speaker. Sitting across from me saying "but who am I to charge for this?"',
      tension: 'Limiting beliefs aren\'t earned through evidence. They\'re installed through events. And they persist because nobody ever tests them.',
      turn: 'You don\'t need more capability. You already have it. You need your belief to catch up to your reality.',
      land: '"I\'m not ready" was installed when you were twelve.',
      fiveC: {
        context: 'Bottom-right of the Belief Graph. Most readers live here.',
        catalyst: 'Capability exceeds belief. You\'re more capable than you know.',
        complication: 'The beliefs holding you back were installed, not earned.',
        change: 'You don\'t need more capability. You need your belief to catch up to reality.',
        consequence: 'The fix isn\'t more capability. It\'s updating the belief.'
      }
    }
  },

  // ------ Chapter 29 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '29',
    editorNote: 'EDITOR Q: Do Hubris/Limiting/Diagonal need 3 separate chapters or one with examples?',
    title: 'The Diagonal',
    epigraph: 'Self-actualisation keeps moving with your growth.',
    epigraphDate: '2024-06-23',
    description: 'Belief proportional to capability. Grounded confidence. Not arrogant, not crippled. You know what you can do. You know what you can\'t. And you\'re growing.\n\nThe diagonal moves. As your capability increases through action, your belief should increase through evidence. Not hope. Not affirmation. Evidence.',
    screenshotLine: null,
    imageConcept: 'A person walking steadily along a path. Not sprinting. Not frozen. Each step slightly more assured than the last.',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 50,
    rawEntries: [
      { date: '2024-06-23', text: 'Self-actualisation keeps moving with your growth.' },
      { date: '2024-07-06', text: 'Our being is in a state of constant movement. Either atrophy or growth. I realise I\'m highly driven for that movement to be growth.' },
      { date: '2025-03-09', text: 'Make decisions based on future self. Decisions grounded in values / methodology / habits.' }
    ],
    connects: [
      { ch: 'Ch 26', num: '26', text: 'The diagonal on the Belief Graph' },
      { ch: 'Ch 74', num: '74', text: 'The diagonal revisited as destination' },
      { ch: 'Ch 76', num: '76', text: 'Not hustle: what the diagonal is not' }
    ],
    beats: {
      scene: 'Six months after the first scary thing. Looking at the Belief Graph and noticing I\'d moved. Not dramatically. Just slightly up the diagonal. Belief catching up to capability through evidence.',
      tension: 'The diagonal isn\'t a destination you arrive at. It\'s a moving line. As you grow, it grows. The goal isn\'t to reach it. The goal is to stay on it.',
      turn: 'Grounded confidence doesn\'t come from affirmations. It comes from evidence. You did the scary thing. You survived. Your belief updates.',
      land: 'Not arrogant, not crippled. Growing through evidence.',
      fiveC: {
        context: 'The diagonal on the Belief Graph: belief proportional to capability.',
        catalyst: 'Evidence, not hope, moves you toward the diagonal.',
        complication: 'The line keeps moving as you grow.',
        change: 'Grounded confidence comes from evidence, not affirmations.',
        consequence: 'Grounded confidence that grows through action, not affirmation.'
      }
    }
  },

  // ------ Chapter 30 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '30',
    title: 'Never Been Tested',
    epigraph: 'Limiting belief = fear. Why is it a limiting belief? We don\'t feel safe.',
    epigraphDate: '2025-01-09',
    description: 'Here\'s the thing about limiting beliefs: most of them have never been tested.\n\n"People will judge me." Have you checked? "I\'m not good enough." Compared to what? "Nobody will pay for this." Have you asked?\n\nBelieved for twenty years. Tested zero times. That\'s not conviction. That\'s software.',
    screenshotLine: 'Believed for twenty years. Tested zero times. That\'s not conviction. That\'s software.',
    imageConcept: 'A wall covered in sticky notes. Each one says a fear. At the bottom, in small text: "Times tested: 0"',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 90,
    rawEntries: [
      { date: '2025-01-09', text: 'Limiting belief = fear. Why is it a limiting belief? We don\'t feel safe.' },
      { date: '2024-08-17', text: 'Number 1 source of all fears: Our worth is dependent on our actions.' },
      { date: '2023-12-11', text: 'Can your body build safety in an experience before it has the experience?' }
    ],
    connects: [
      { ch: 'Ch 28', num: '28', text: 'Limiting beliefs defined' },
      { ch: 'Ch 31', num: '31', text: 'One test changes everything' },
      { ch: 'Ch 52', num: '52', text: 'What actually closes the gap' }
    ],
    beats: {
      scene: 'Making a list of every belief holding me back. "People will judge me." "I\'m not an expert." "Nobody will pay." Then adding a column: "Times tested." Every row: zero.',
      tension: 'Twenty years of belief. Zero data points. We build entire lives around assumptions we\'ve never once checked.',
      turn: 'That\'s not conviction. That\'s software. Running programs with no evidence. A belief that has never been tested is just a fear wearing a suit.',
      land: 'Believed for twenty years. Tested zero times. That\'s not conviction. That\'s software.',
      fiveC: {
        context: 'Limiting beliefs feel like facts.',
        catalyst: 'When you check, most have never been tested.',
        complication: 'The nervous system treats untested beliefs as absolute truth.',
        change: 'A belief that has never been tested is just a fear wearing a suit.',
        consequence: 'The wall of fears looks solid. But none of them have evidence.'
      }
    }
  },

  // ------ Chapter 31 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '31',
    title: 'One Test Changes Everything',
    epigraph: 'I realise only since I\'ve started Sprouter have I entered Chapter 3. Before that I didn\'t have unconditional self-worth which is why I was scared to post.',
    epigraphDate: '2023-04-20',
    description: 'You don\'t need to dismantle the belief. You need to test it once.\n\nPost your face online. Quote your real price. Share the unfinished thing. One data point is worth more than twenty years of assumption.\n\nMost beliefs dissolve on first contact with evidence.',
    screenshotLine: null,
    imageConcept: 'A single sticky note falling off the wall from Chapter 30. Behind it, clean wall.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 85,
    rawEntries: [
      { date: '2023-04-20', text: 'I realise only since I\'ve started Sprouter have I entered Chapter 3. Before that I didn\'t have unconditional self-worth which is why I was scared to post.' },
      { date: '2024-01-27', text: 'Fear of non-authentic act can be rationalised away. Fear of authentic act can\'t. You think I\'m silly, I think I\'m beautiful.' },
      { date: '2022-11-05', text: 'People are drawn to you when you\'re free of your fears.' }
    ],
    connects: [
      { ch: 'Ch 30', num: '30', text: 'Never been tested' },
      { ch: 'Ch 53', num: '53', text: 'One scary thing a week' },
      { ch: 'Ch 72', num: '72', text: 'Capturing the proof' }
    ],
    beats: {
      scene: 'Messaged Hugh Van Cuylenburg on Instagram. Founder of the Resilience Project. Thanked him for his work. Inner voice: "YOU IDIOT! You just wasted 5 seconds of his life. He\'s going to hate you forever." Meditated for 20 minutes to calm my brain. Checked my phone. Two one-minute audio replies. He was 15 minutes late to a meeting because my keynote was so good. I couldn\'t wipe the smile off my face.obody would see it. Woke up to DMs from people saying "I needed this." One data point. Twenty years of fear, gone.',
      tension: 'We think we need to process the belief, journal about it, understand it, therapy it. We don\'t. We need to test it.',
      turn: 'One data point is worth more than twenty years of assumption. The belief that felt like a mountain dissolves on first contact with reality.',
      land: 'Most beliefs dissolve on first contact with evidence.',
      fiveC: {
        context: 'Limiting beliefs feel permanent.',
        catalyst: 'One test: post, share, ask, try.',
        complication: 'The nervous system screams that the test will destroy you.',
        change: 'It doesn\'t. The belief falls off the wall.',
        consequence: 'Evidence is the only medicine for installed beliefs.'
      }
    }
  },

  // ------ Chapter 32 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '32',
    editorNote: 'EDITOR Q: Is skills/kid/problems/wound/people/intersection the order YOU discovered them?',
    title: 'Your Skills Are Not on Your CV',
    epigraph: 'What makes us unique? The combination of things that we love. There\'s no one on earth with your combination.',
    epigraphDate: '2024-09-07',
    description: 'The first thing the flood reveals: what you\'re actually good at.\n\nNot the skills on your resume. Those were trained. The skills that feel like play. The ones where time disappears. Where you look up and three hours have passed.\n\nTen of them. You only need to name three.',
    screenshotLine: null,
    imageConcept: 'A CV being crumpled. Behind it, a child building something with their hands.',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 90,
    rawEntries: [
      { date: '2024-09-07', text: 'What makes us unique? The combination of things that we love. There\'s no one on earth with your combination.' },
      { date: '2024-08-08', text: 'Career Clarity Game: gamify identifying this remarkableness. How to monetise it.' },
      { date: '2024-08-07', text: 'To get paid you need to be remarkable. We\'re all unique so we\'re all remarkable. Never taught who we are so don\'t know our remarkableness.' },
      { date: '2026-07-10', text: 'Your skills aren\'t what you were trained in. They\'re what you\'re CURIOUS about. Look at your bookshelf, your podcast queue, your YouTube history. That\'s your content consumption telling you what your essence is drawn to. The things you read about at midnight when nobody is watching are closer to your real skills than anything on your CV.' }
    ],
    connects: [
      { ch: 'Ch 33', num: '33', text: 'The kid knew: childhood skills' },
      { ch: 'Ch 34', num: '34', text: 'Problems that break your heart' },
      { ch: 'Ch 37', num: '37', text: 'The intersection of skills, problems, people' }
    ],
    beats: {
      scene: 'Looking at my CV: project management, financial modelling, stakeholder relations. Then looking at what actually lights me up: designing experiences, building games, explaining complex things simply. Two completely different people.',
      tension: 'Your CV is a record of what you were trained to do. Your real skills are the ones that feel like play. The gap between those two lists is the gap between your mask and your face.',
      turn: 'Time disappearing is the signal. Three hours gone and you didn\'t notice. That\'s not a hobby. That\'s a skill your essence is trying to show you.',
      land: 'Not the skills on your resume. The ones where time disappears.',
      fiveC: {
        context: 'The flood reveals real skills, not trained ones.',
        catalyst: 'The skills that feel like play are the real ones.',
        complication: 'They\'re not on your CV because they were never rewarded.',
        change: 'Time disappearing is the signal. That\'s not a hobby. That\'s essence.',
        consequence: 'Name three. That\'s all you need.'
      }
    }
  },

  // ------ Chapter 33 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '33',
    editorNote: 'EDITOR Q: Is skills/kid/problems/wound/people/intersection the order YOU discovered them?',
    title: 'The Kid Knew',
    epigraph: 'I believe somewhere along the way we got the growing up process wrong. To grow up is to grow into ourselves.',
    epigraphDate: '2025-01-02',
    description: 'Go back to age seven. What did you do when nobody was watching?\n\nThe skills you had as a child are the same skills you need now. They just got buried by thirty years of "that\'s not a real job" and "grow up."',
    screenshotLine: null,
    imageConcept: 'Split frame. Left: a child building a fort. Right: the same person at a desk, the fort barely visible through the window.',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 95,
    rawEntries: [
      { date: '2025-01-02', text: 'I believe somewhere along the way we got the growing up process wrong. To grow up is to grow into ourselves. It saddens me that we failed to create the environment to cultivate this growth.' },
      { date: '2023-06-01', text: 'Children are the way they are because they don\'t fear consequences. Over-coming fear is the secret to being more child-like.' },
      { date: '2024-06-28', text: 'Game shop owner image: always knew I loved games. How it manifested is crazy.' }
    ],
    connects: [
      { ch: 'Ch 5', num: '05', text: 'The kid before the crack' },
      { ch: 'Ch 32', num: '32', text: 'Your real skills' },
      { ch: 'Ch 47', num: '47', text: 'Reclaiming the kid' }
    ],
    beats: {
      scene: 'Age seven. Building elaborate games with rules I\'d invented. Designing treasure hunts for my friends. Nobody taught me that. Nobody rewarded me for it. I just did it because it was who I was.',
      tension: 'Those childhood skills didn\'t disappear. They got labelled "not a real job" and buried under thirty years of conditioning.',
      turn: 'The kid already knew what skills mattered. We just spent the next twenty years teaching them to forget.',
      land: 'The skills you had as a child are the same skills you need now.',
      fiveC: {
        context: 'Before conditioning, the kid had clear skills.',
        catalyst: 'Age seven: what did you do when nobody was watching?',
        complication: '"That\'s not a real job." "Grow up." Thirty years of burial.',
        change: 'The kid already knew. We spent twenty years teaching them to forget.',
        consequence: 'The answer to "what should I do?" was there all along.'
      }
    }
  },

  // ------ Chapter 34 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '34',
    editorNote: 'EDITOR Q: Is skills/kid/problems/wound/people/intersection the order YOU discovered them?',
    title: 'Problems That Break Your Heart',
    epigraph: 'I believe we are the masters of our own destiny. The problem is our faulty wiring, cultural conditioning and misguided limiting beliefs stop us from taking action.',
    epigraphDate: '2024-08-18',
    description: 'The second thing the flood reveals: what problems you actually care about.\n\nNot what the market needs. Not what\'s trending. The problems that make you angry. The injustices you can\'t scroll past. The suffering that feels personal because you lived some version of it.\n\nTwelve categories. You only need one.',
    screenshotLine: null,
    imageConcept: 'A person looking at a newspaper. One headline is circled, over and over.',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 90,
    rawEntries: [
      { date: '2024-08-18', text: 'I believe we all have a purpose, a mission, a change to create in this life. The problem is school and university teaches us the knowledge to work but never teaches us the self-knowledge that empowers us to identify what that purpose, mission, change is.' },
      { date: '2024-12-09', text: 'Mission: making people safe to be themselves, living a life they love. Safety = overcoming trauma. Life they love = overcoming limiting beliefs.' },
      { date: '2022-10-21', text: 'My role: taking life\'s wisdom and communicating them in digestible ways. Helping people upgrade their mental model.' }
    ],
    connects: [
      { ch: 'Ch 32', num: '32', text: 'Skills: the first flood reveal' },
      { ch: 'Ch 35', num: '35', text: 'Your wound is your credential' },
      { ch: 'Ch 36', num: '36', text: 'Your people: the third flood reveal' }
    ],
    beats: {
      scene: 'Scrolling Instagram. Past a hundred posts without stopping. Then one: a kid leaving school, head down, spark gone. I couldn\'t scroll past. I stared at it for five minutes. That\'s direction.',
      tension: 'The market tells you to find trending problems. Your heart tells you there\'s one problem that feels personal. They\'re different. And your heart is right.',
      turn: 'The problems you care about aren\'t random. They\'re connected to your wound. You care because you lived some version of it.',
      land: 'The suffering that feels personal because you lived some version of it.',
      fiveC: {
        context: 'The flood reveals problems you care about.',
        catalyst: 'Not what\'s trending. What breaks your heart.',
        complication: 'Culture says follow the market. The flood says follow the anger.',
        change: 'The problems you care about are connected to your wound. You care because you lived it.',
        consequence: 'Twelve categories of problems. You only need one. The one that feels personal.'
      }
    }
  },

  // ------ Chapter 35 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '35',
    editorNote: 'EDITOR Q: Is skills/kid/problems/wound/people/intersection the order YOU discovered them?',
    title: 'Your Wound Is Your Credential',
    epigraph: 'Journey is the most important piece. We choose that journey. Most important journey? Returning to love.',
    epigraphDate: '2024-11-08',
    description: 'The problem that breaks your heart is almost always connected to your wound. You care about it because you lived it. That\'s not a coincidence. That\'s direction.\n\nThe worst thing that happened to you is your qualification for the work you\'re meant to do.',
    screenshotLine: 'Your wound is your credential.',
    imageConcept: 'A scar that has healed into the shape of a compass.',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 55,
    rawEntries: [
      { date: '2024-11-08', text: 'Journey is the most important piece. We choose that journey. Most important journey? Returning to love.' },
      { date: '2024-05-11', text: 'Do I judge others who are "former versions of myself" harshly because I didn\'t fully love that version of myself? Is it showing my lack of unconditional love for myself?' },
      { date: '2025-04-13', text: 'Art = message. Our lives = message. Our lives = art. How? Creation. We come from a creator. We are creations. Our being is art / to create.' }
    ],
    connects: [
      { ch: 'Ch 34', num: '34', text: 'Problems that break your heart' },
      { ch: 'Ch 36', num: '36', text: 'Your people: the ones who share your wound' },
      { ch: 'Ch 7', num: '07', text: 'Direction: where you\'d naturally go' }
    ],
    beats: {
      scene: 'ManCave rejection. Applied for a vulnerability workshop role for teenage boys. Everyone said I was perfect. Group interview: I overcompensated, first to speak every time, denying airspace. Rejection email. Shame spiral. Three months later my uncle asks: "Why don\'t you go into schools?" I threw my head back and groaned. Called my old school Redlands. Resounding yes. The wound became the credential.ths ago. The school kid who lost their spark. The corporate worker who felt nothing. The person stuck in Head Full of Dreams.',
      tension: 'The wound feels like disqualification. "Who am I to help? I\'m still broken." But the wound is the qualification. You understand the problem because you ARE the problem, healed.',
      turn: 'Your scar IS your compass. The worst thing that happened to you points directly at the work you\'re meant to do.',
      land: 'The worst thing that happened to you is your qualification for the work you\'re meant to do.',
      fiveC: {
        context: 'The problem that breaks your heart is connected to your wound.',
        catalyst: 'You care because you lived it.',
        complication: 'The wound feels like disqualification, not credential.',
        change: 'The reframe: your scar is your compass.',
        consequence: 'Your wound points directly at your work.'
      }
    }
  },

  // ------ Chapter 36 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '36',
    editorNote: 'EDITOR Q: Is skills/kid/problems/wound/people/intersection the order YOU discovered them?',
    title: 'Your People',
    epigraph: 'Do they tell their friends? Marker for quality.',
    epigraphDate: '2024-09-04',
    description: 'The third thing: who you serve. Not a "target market." The people whose struggle you understand because it\'s your struggle, twelve months behind you.\n\nYou don\'t find your people by researching demographics. You find them by looking at who you were before you healed.',
    screenshotLine: null,
    imageConcept: 'A person looking in a mirror. The reflection is slightly younger, slightly more stuck.',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 85,
    rawEntries: [
      { date: '2024-09-04', text: 'Do they tell their friends? Marker for quality.' },
      { date: '2023-10-25', text: 'Community is a great lead magnet because it creates trust and attention.' },
      { date: '2024-11-01', text: 'Growth model: Give it away for free until you have a tribe of people who are regular. Begin charging.' }
    ],
    connects: [
      { ch: 'Ch 34', num: '34', text: 'Problems: what your people struggle with' },
      { ch: 'Ch 35', num: '35', text: 'Your wound connects you to your people' },
      { ch: 'Ch 37', num: '37', text: 'The intersection: skills x problems x people' }
    ],
    beats: {
      scene: 'Describing my "target market" for the first time. Not in demographics. In felt experience. "Burnt-out professionals who followed the golden road and arrived nowhere. Who have the clarity but can\'t move." That\'s not a market. That\'s me, twelve months ago.',
      tension: 'Marketing says research your audience. The flood says your audience is you, before you healed. The empathy isn\'t manufactured. It\'s biographical.',
      turn: 'Your people are your past selves. The ones still stuck where you were. You don\'t need to research them. You remember being them.',
      land: 'You find your people by looking at who you were before you healed.',
      fiveC: {
        context: 'The third flood reveal: who you serve.',
        catalyst: 'Not demographics. Former versions of yourself.',
        complication: 'Culture says "target market." The flood says "mirror."',
        change: 'Your people are your past selves, still stuck where you were.',
        consequence: 'Your people are you, twelve months behind.'
      }
    }
  },

  // ------ Chapter 37 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '37',
    editorNote: 'EDITOR Q: Is skills/kid/problems/wound/people/intersection the order YOU discovered them?',
    title: 'The Intersection',
    epigraph: 'Criteria for a job: personal connection, critical thinking, create change I believe in, craft I can refine.',
    epigraphDate: '2022-10-12',
    description: 'Your skills, your problems, your people. Where those three overlap is your direction.\n\nNot a business plan. A felt sense. "I use THIS skill to help THESE people with THIS problem." That sentence is worth more than every course I ever bought.',
    screenshotLine: null,
    imageConcept: 'Three circles overlapping. The center glows.',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 85,
    rawEntries: [
      { date: '2022-10-12', text: 'Combining 3 skills: experience design, facilitating. Criteria for a job: personal connection, critical thinking, create change I believe in, craft I can refine.' },
      { date: '2024-08-08', text: 'Career Clarity Game: gamify identifying this remarkableness. How to monetise it.' },
      { date: '2022-10-21', text: 'What do I want to build? Self-knowledge movement with a lens of the ego?' },
      { date: '2026-07-09', text: 'The most remarkable creators didn\'t specialise. They pursued multiple genuine curiosities until those curiosities collided into something nobody else could create. Your intersection might not be ONE thing. It might be the MERGE of multiple curiosities. The wider your cone of safety, the more branches you can hold, the more unique your convergence.' },
      { date: '2026-07-10', text: 'Purpose emerges FROM experiences, not before them. You don\'t find your intersection by thinking. You find it by DOING. Have enough experiences that light you up and the intersection reveals itself. The intersection isn\'t a destination you plan for. It\'s a convergence that emerges from action.' },
      { date: '2026-07-10', text: 'Education says "specialise, pick one lane." But your weird combination of curiosities IS your competitive advantage. The rule break lives at the merge point. You can\'t get there by staying in one lane.' },
      { date: '2026-07-12', text: 'Hero Stage 9: Flow Statement. Post-ordeal, the fog clears. Curiosities that were blocked merge. "The path only I can walk is ___." The intersection isn\'t crafted. It\'s RECOGNISED. It emerges after the healing, not before. The Flow Statement is the reward for surviving the ordeal.' }
    ],
    connects: [
      { ch: 'Ch 32', num: '32', text: 'Skills: the first circle' },
      { ch: 'Ch 34', num: '34', text: 'Problems: the second circle' },
      { ch: 'Ch 36', num: '36', text: 'People: the third circle' },
      { ch: 'Ch 7', num: '07', text: 'Direction: purpose emerges from experiences' },
      { ch: 'Ch 77', num: '77', text: 'Silent discos: proof of polymath convergence' },
      { ch: 'Ch 78', num: '78', text: 'The path reveals itself through action' }
    ],
    beats: {
      scene: 'Drawing three circles on a whiteboard. Skills. Problems. People. The centre where they overlap started glowing. Not metaphorically. It was the first time my direction felt clear.',
      tension: 'You can have skills without direction. Problems without skills. People without purpose. The intersection is where all three align. And most people never find it because nobody taught them to look.',
      turn: '"I use experience design to help burnt-out professionals rediscover who they were before the installation." One sentence. Worth more than $30,000 in courses.',
      land: 'That sentence is worth more than every course I ever bought.',
      fiveC: {
        context: 'Three flood reveals: skills, problems, people.',
        catalyst: 'Where they overlap is direction.',
        complication: 'Most people have never mapped all three at once.',
        change: 'The intersection sentence: I use THIS to help THESE with THIS.',
        consequence: 'Direction isn\'t a business plan. It\'s a felt sense captured in one line.'
      }
    }
  },

  // ------ Chapter 38 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '38',
    editorNote: 'EDITOR Q: Merge these 3 (Essence vs Protective + sounds-like) into 1 chapter?',
    title: 'Essence vs. Protective',
    epigraph: 'Use conscious mind to observe patterns and trauma wounds / responses.',
    epigraphDate: '2025-02-22',
    description: 'The flood shows you two voices. Your essence: who you actually are. Your protective voice: who you became to survive.\n\nLearning to tell the difference is the entire game. Everything else is just tools.',
    screenshotLine: null,
    imageConcept: 'Two paths diverging. One is warm and lit. One is safe and grey.',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 85,
    rawEntries: [
      { date: '2025-02-22', text: 'Use conscious mind to observe patterns and trauma wounds / responses.' },
      { date: '2024-09-16', text: 'Our essence is love. However this essence becomes blocked by fear.' },
      { date: '2023-02-14', text: 'What does living authentically mean? I believe it means living in connection to our desires. What stops us? 1) Fear. 2) Trauma (kinks in our nervous system).' }
    ],
    connects: [
      { ch: 'Ch 39', num: '39', text: 'What the essence voice sounds like' },
      { ch: 'Ch 40', num: '40', text: 'What the protective voice sounds like' },
      { ch: 'Ch 54', num: '54', text: 'The Essence Test: the diagnostic tool' }
    ],
    beats: {
      scene: 'Nick\'s Instagram Live. I agreed to help, assuming only his followers would see. Every one of my 1,200 followers got notified. High school acquaintances. Sporting peers. People who only knew Jackass Nic. I never had an issue with judgement of "crazy Nic" because that was a mask. Any judgement could be rationalised away. But now I was being myself. If you ridicule THAT person, it\'s a condemnation of my soul. other says: "Not yet. It\'s not ready. What if they judge you?" Both feel like me. Only one is.',
      tension: 'The protective voice is convincing because it\'s been practicing for twenty years. It sounds reasonable. It sounds cautious. It sounds like wisdom. It\'s not.',
      turn: 'Learning to tell the difference between essence and protection is the entire game. Every tool, framework, and model in this book exists to sharpen that one distinction.',
      land: 'Learning to tell the difference is the entire game.',
      fiveC: {
        context: 'Two voices: essence and protection.',
        catalyst: 'The flood makes both audible for the first time.',
        complication: 'The protective voice has been practicing for decades. It\'s convincing.',
        change: 'One distinction sharpens everything: which voice is actually mine?',
        consequence: 'The entire game is one distinction: which voice is mine?'
      }
    }
  },

  // ------ Chapter 39 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '39',
    editorNote: 'EDITOR Q: Merge these 3 (Essence vs Protective + sounds-like) into 1 chapter?',
    title: 'The Essence Voice Sounds Like',
    epigraph: 'I never understand quotes like "do what sets your heart on fire" until I came across disco\'s.',
    epigraphDate: '2025-01-18',
    description: '"This scares me AND excites me."\n"I\'d do this even if nobody paid me."\n"I\'ve always wanted to try this."\n"This feels like who I was before."',
    screenshotLine: null,
    imageConcept: 'A warm glow. No scene. Just light.',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 90,
    rawEntries: [
      { date: '2025-01-18', text: 'I never understand quotes like "do what sets your heart on fire" until I came across disco\'s.' },
      { date: '2025-01-01', text: 'Be more passionate. You know what\'s cool? Passion.' },
      { date: '2024-06-24', text: 'Secret is aligning what makes you enter flow state with the external environment that is flowing.' }
    ],
    connects: [
      { ch: 'Ch 38', num: '38', text: 'Telling the two voices apart' },
      { ch: 'Ch 40', num: '40', text: 'The protective voice: the opposite' },
      { ch: 'Ch 55', num: '55', text: 'Essence Zone: high fear AND high excitement' }
    ],
    beats: {
      scene: 'The moment I first felt it: running a silent disco on a beach in Bali. Terrified. Exhilarated. Both at the same time. That\'s the essence voice.',
      tension: 'The essence voice is quiet. It\'s been suppressed for so long that most people can\'t hear it anymore. They mistake the protective voice for their own.',
      turn: 'The signal is unmistakable once you know it: scared AND excited. Not comfortable. Not terrifying. Both, simultaneously.',
      land: '"This scares me AND excites me." That\'s the essence voice.',
      fiveC: {
        context: 'The essence voice has specific signatures.',
        catalyst: 'Four phrases that mark essence: scared + excited, unpaid interest, childhood echoes.',
        complication: 'The voice is quiet because it\'s been suppressed for years.',
        change: 'The signal is unmistakable: scared AND excited. Both, simultaneously.',
        consequence: 'Once you learn the sound, you can start following it.'
      }
    }
  },

  // ------ Chapter 40 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '40',
    editorNote: 'EDITOR Q: Merge these 3 (Essence vs Protective + sounds-like) into 1 chapter?',
    title: 'The Protective Voice Sounds Like',
    epigraph: 'Observing: part of me feels unworthy of being in happy relationship. Feels guilty, like I don\'t deserve it.',
    epigraphDate: '2024-10-07',
    description: '"You\'re not ready yet."\n"Who are you to do this?"\n"What if they judge you?"\n"Let\'s just do a bit more research first."\n"Maybe next week."',
    screenshotLine: null,
    imageConcept: 'A grey fog. No scene. Just stillness.',
    branch: 'Body keeps the score',
    branchColor: '#ef4444',
    confidence: 85,
    rawEntries: [
      { date: '2024-10-07', text: 'Observing: part of me feels unworthy of being in happy relationship. Feels guilty, like I don\'t deserve it. I realise hanging out with friends feels uncomfortable for me. One of the reasons I avoid.' },
      { date: '2024-04-29', text: 'The black nut/rock inside is part of me that doesn\'t feel safe to be myself. Fear of hurting others is also a fear of stepping into my power. Scared to be great.' },
      { date: '2024-07-27', text: 'Fear of upsetting others is anchored in me not trusting myself to speak up if I\'m upset.' }
    ],
    connects: [
      { ch: 'Ch 38', num: '38', text: 'Telling the two voices apart' },
      { ch: 'Ch 39', num: '39', text: 'The essence voice: the opposite' },
      { ch: 'Ch 56', num: '56', text: 'Protective Voice quadrant on the Essence Test' }
    ],
    beats: {
      scene: 'Week 1 of the challenge. Recording an Instagram story talking to the camera. Dating back to being called a "gay rainbow" I realised I was so scared of judgement, so scared to be seen as my vulnerable, authentic self, that even uploading an Instagram story terrified me. The voice: "Who are you to do this? You\'re the party guy. Nobody wants to hear you be serious. this? What if they judge you? Maybe next week." It sounds so reasonable. So wise. So responsible.',
      tension: 'The protective voice is the greatest impersonator. It wears the mask of wisdom, caution, and responsibility. But its only job is to keep you from being seen.',
      turn: '"Maybe next week" is the protective voice\'s favourite sentence. Because next week never comes.',
      land: '"Let\'s just do a bit more research first." The protective voice disguised as wisdom.',
      fiveC: {
        context: 'The protective voice has specific patterns.',
        catalyst: 'Five phrases: not ready, who are you, judgment, research, next week.',
        complication: 'Each one sounds reasonable. That\'s what makes them dangerous.',
        change: '"Maybe next week" is its favourite. Because next week never comes.',
        consequence: 'Once you recognise the phrases, the voice loses its disguise.'
      }
    }
  },

  // ------ Chapter 41 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '41',
    editorNote: 'EDITOR Q: Did Controller-performing-healing, Ghost-consuming, Healing-trap happen in this order?',
    title: 'The Controller Says "More"',
    epigraph: 'I found myself spraying energy in every direction trying to find happiness. I realised I needed to direct it inward.',
    epigraphDate: '2022-11-01',
    description: 'The Controller\'s version of the flood: turn self-knowledge into another achievement. Do the healing perfectly. Complete every assessment. Optimise the self-knowledge process.\n\nStill controlling. Just controlling healing now.',
    screenshotLine: 'Still performing. Just performing healing now.',
    imageConcept: 'A gold star sticker on a therapy journal',
    branch: 'Body keeps the score',
    branchColor: '#ef4444',
    confidence: 85,
    rawEntries: [
      { date: '2022-11-01', text: 'I found myself spraying energy in every direction trying to find happiness. I realised I needed to direct it inward. How? Through the breath.' },
      { date: '2023-08-14', text: 'I\'ve observed that I\'ve left one matrix for another and that once I climb to the top of this mountain I\'ll once again feel the same.' },
      { date: '2025-05-31', text: 'In the past I think I\'ve created products to receive affiliation rather than cash. Need to shift.' }
    ],
    connects: [
      { ch: 'Ch 16', num: '16', text: 'The Controller archetype' },
      { ch: 'Ch 42', num: '42', text: 'The Ghost\'s version' },
      { ch: 'Ch 43', num: '43', text: 'The healing trap' }
    ],
    beats: {
      scene: 'My healing spreadsheet. Yes, I had a spreadsheet. Tracking meditations completed, breathwork sessions done, journals filled. Optimising inner work like a KPI dashboard.',
      tension: 'The Controller doesn\'t stop controlling just because the subject changed from work to healing. It just finds a new thing to optimise.',
      turn: 'Still performing. Just performing healing now. The protector shape-shifts to survive in any context.',
      land: 'Still controlling. Just controlling healing now.',
      fiveC: {
        context: 'The Controller enters the flood.',
        catalyst: 'It turns self-knowledge into another achievement.',
        complication: 'The healing looks real. The pattern is the same.',
        change: 'The protector shape-shifts. Still performing. Just performing healing now.',
        consequence: 'The protector adapts. You can control healing just as easily as you controlled work.'
      }
    }
  },

  // ------ Chapter 42 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '42',
    editorNote: 'EDITOR Q: Did Controller-performing-healing, Ghost-consuming, Healing-trap happen in this order?',
    title: 'The Ghost Says "Not Yet"',
    epigraph: 'How to safeguard my emotions from my empathic nature.',
    epigraphDate: '2022-11-17',
    description: 'The Ghost\'s version: consume everything, share nothing. Read every book. Complete every quiz. Build the most detailed internal map of yourself that nobody will ever see.\n\nStill fleeing. Just fleeing into self-knowledge now.',
    screenshotLine: null,
    imageConcept: 'A beautiful map locked in a drawer',
    branch: 'Body keeps the score',
    branchColor: '#ef4444',
    confidence: 85,
    rawEntries: [
      { date: '2022-11-17', text: 'How to safeguard my emotions from my empathic nature.' },
      { date: '2022-11-05', text: 'I can see how Nomads travel as a form of escape. The constant change keeps them stimulated without addressing what makes them fear from being stationary.' },
      { date: '2023-05-29', text: 'Best thing to learn is to not consume.' }
    ],
    connects: [
      { ch: 'Ch 17', num: '17', text: 'The Ghost archetype' },
      { ch: 'Ch 41', num: '41', text: 'The Controller\'s version' },
      { ch: 'Ch 24', num: '24', text: 'The knowledge trap' }
    ],
    beats: {
      scene: 'Fourteen books on my bedside table. All read. All highlighted. All absorbed. Not a single idea shared with anyone. The most well-read invisible person in Bali.',
      tension: 'The Ghost\'s version of the flood is the quietest trap. It looks like dedication. It looks like depth. But consumption without output is just another form of hiding.',
      turn: 'Still fleeing. The direction just changed from the world to the self. Knowledge without sharing is a beautiful prison.',
      land: 'Still fleeing. Just fleeing into self-knowledge now.',
      fiveC: {
        context: 'The Ghost enters the flood.',
        catalyst: 'Consume everything. Share nothing.',
        complication: 'It feels like depth. It\'s actually withdrawal.',
        change: 'Still fleeing. The direction just changed from the world to the self.',
        consequence: 'A beautiful internal map that nobody will ever see.'
      }
    }
  },

  // ------ Chapter 43 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '43',
    editorNote: 'EDITOR Q: Did Controller-performing-healing, Ghost-consuming, Healing-trap happen in this order?',
    title: 'The Healing Trap',
    epigraph: 'Point of healing is to feel safe to respond from higher levels.',
    epigraphDate: '2025-06-01',
    description: 'The flood can become a lifestyle. Therapy every week. Breathwork on Tuesday. Journaling every morning. Plant medicine twice a year.\n\nHealing is not the destination. Healing is the road. If you\'re still on it after three years with no change in your external life, you\'re not healing. You\'re hiding.',
    screenshotLine: 'You\'re not healing. You\'re hiding.',
    imageConcept: 'A person sitting cross-legged in a beautiful room, eyes closed. Calendar on the wall shows years passing.',
    branch: 'Healing = return to flow',
    branchColor: '#4ade80',
    confidence: 90,
    rawEntries: [
      { date: '2025-06-01', text: 'Point of healing is to feel safe to respond from higher levels.' },
      { date: '2025-05-23', text: 'If healing is about the response to situations, meditation is so effective because it helps create space between stimulus and response.' },
      { date: '2023-08-14', text: 'I\'ve observed that I\'ve left one matrix for another and that once I climb to the top of this mountain I\'ll once again feel the same.' },
      { date: '2026-06-28', text: 'The snapback: someone does the new behaviour for weeks or months, then reverts completely. Why? They\'re doing Phase 3 actions from a Phase 2 story. "I\'m TRYING to be healthy" keeps the old identity as primary. The trying IS the tell. As long as the new behaviour is framed as effort rather than expression, the snapback is inevitable.' },
      { date: '2026-07-25', text: 'The Healing Trap IS Enemy 2 in action. Enemy 1 (self-help) says "you need clarity." You defeat it by gaining clarity. Then Enemy 2 arrives disguised as the solution: "now heal." But healing without action is the same trap wearing different clothes. You cannot meditate your way out of a life that\'s incompatible with aliveness.' }
    ],
    connects: [
      { ch: 'Ch 41', num: '41', text: 'The Controller performing healing' },
      { ch: 'Ch 44', num: '44', text: 'Recognise: the first real healing step' },
      { ch: 'Ch 48', num: '48', text: 'The River: where healing gets blocked' },
      { ch: 'Ch 24', num: '24', text: 'The Knowledge Trap: Enemy 1 in action' }
    ],
    beats: {
      scene: 'Spiff said something that stopped me. "Healing is the most amazing thing, it turns us into these beautiful butterflies. But the process can be such a fucking drag. If we\'re turning into these beautiful things, shouldn\'t we enjoy the process?" I looked at my life: therapy weekly, breathwork Tuesdays, journaling daily, plant medicine twice a year. My inner world was pristine. My outer world hadn\'t moved an inch. I was performing healing.icine ceremonies in the jungle. My inner world was pristine. My outer world hadn\'t moved an inch.',
      tension: 'The healing industry has a dirty secret: it can become the destination. The work never ends because ending means you have to act.',
      turn: 'Healing is a road, not a postcode. If your external life hasn\'t changed in three years of healing, the healing has become another hiding strategy.',
      land: 'You\'re not healing. You\'re hiding.',
      fiveC: {
        context: 'Healing becomes a lifestyle.',
        catalyst: 'Therapy, breathwork, journaling, plant medicine. Every modality, every week.',
        complication: 'Three years later. Inner world pristine. Outer world unchanged.',
        change: 'The realisation: healing without action is just comfortable hiding.',
        consequence: 'The road must lead somewhere. If it doesn\'t, you\'re walking in circles.'
      }
    }
  },

  // ------ Chapter 44 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '44',
    editorNote: 'EDITOR Q: 4 methodology chapters in a row. Which R has the weakest personal story?',
    title: 'Recognise',
    epigraph: 'Emotional triggers = trauma or values.',
    epigraphDate: '2023-10-25',
    description: 'The first step of any healing work: see the pattern. Name the protective voice. Notice when it shows up. Track the trigger, the fear, the body sensation.\n\nYou can\'t change what you can\'t see.',
    screenshotLine: null,
    imageConcept: 'Footprints in sand. Someone has stopped walking and turned around to look at their own trail.',
    branch: 'Healing = return to flow',
    branchColor: '#4ade80',
    confidence: 95,
    rawEntries: [
      { date: '2023-10-25', text: 'Emotional triggers = trauma or values.' },
      { date: '2024-05-14', text: 'Is a trigger something you haven\'t felt safe to process?' },
      { date: '2025-02-22', text: 'Use conscious mind to observe patterns and trauma wounds / responses.' }
    ],
    connects: [
      { ch: 'Ch 45', num: '45', text: 'Reconnect: the second step (activate it in the body)' },
      { ch: 'Ch 14', num: '14', text: 'The four responses to recognise' },
      { ch: 'Ch 19', num: '19', text: 'Software, not identity' }
    ],
    beats: {
      scene: 'Journaling after a trigger. Instead of suppressing it, tracking it. What happened. What I felt. Where I felt it in my body. What the voice said. The pattern became visible.',
      tension: 'Most people suppress, distract, or rationalise when triggered. The first real healing step is to just watch. See the pattern without trying to fix it.',
      turn: 'You can\'t change what you can\'t see. And most of what runs your life has been invisible until now.',
      land: 'You can\'t change what you can\'t see.',
      fiveC: {
        context: 'Healing step one: recognition.',
        catalyst: 'See the pattern. Name the voice. Track the trigger.',
        complication: 'We\'ve been suppressing so long that watching feels foreign.',
        change: 'Seeing the pattern for the first time. It loses its invisibility.',
        consequence: 'Once you see the pattern, it loses its invisibility.'
      }
    }
  },

  // ------ Chapter 45 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '45',
    editorNote: 'EDITOR Q: 4 methodology chapters in a row. Which R has the weakest personal story?',
    title: 'Reconnect',
    epigraph: 'Notes from slowing down: feel like every action has intention. Feels like I can move energy. I feel the impact of every movement. Feel nausea as my body releases.',
    epigraphDate: '2024-04-19',
    description: 'The second step: activate it in the body. Open the file in edit mode.\n\nYou\'ve named the pattern. Now feel it. Not think about it. Not analyse it. Feel it. Where does it live? What does it weigh? What temperature is it?\n\nYou can\'t rewrite a file that isn\'t open. Memory reconsolidation requires the encoding to be LIVE before the mismatch can rewrite it.',
    screenshotLine: 'You can\'t rewrite a file that isn\'t open.',
    imageConcept: 'A person with their hand on their chest, eyes closed. Something glowing beneath the hand, activated.',
    branch: 'Healing = return to flow',
    branchColor: '#4ade80',
    confidence: 90,
    rawEntries: [
      { date: '2023-06-05', text: 'Humans are constant wave of emotions. Self-knowledge is simply understanding the different containers where the troughs and dips of emotions emerge. We\'re emotional beings that think. Not thinking beings with emotions.' },
      { date: '2024-04-19', text: 'Notes from slowing down: feel like every action has intention. Feels like I can move energy. I feel the impact of every movement. Feel nausea as my body releases. Slow down to turn default mode network off, make conscious.' },
      { date: '2024-04-29', text: 'The black nut/rock inside is part of me that doesn\'t feel safe to be myself. Fear of hurting others is also a fear of stepping into my power.' },
      { date: '2026-07-09', text: 'Reconnect moved to step 2 (updated Jul 2026). The old order had people trying to release energy from an encoding they hadn\'t fully activated. Memory reconsolidation requires the encoding to be LIVE before the mismatch can rewrite it. Reconnect = activation = opening the file in edit mode.' }
    ],
    connects: [
      { ch: 'Ch 44', num: '44', text: 'Recognise: the first step (see the pattern)' },
      { ch: 'Ch 46', num: '46', text: 'Release: the third step (let it discharge)' },
      { ch: 'Ch 6', num: '06', text: 'Essence: what you\'re reconnecting TO' }
    ],
    beats: {
      scene: 'Holotropic breathwork. Four years of buried grief from a 2018 breakup erupted. I\'d visualised putting the emotion into a black box at the Opera House. The breathwork reopened it. "My mind became a dictator over my emotions." Four years numb to love with family, with my next partner. The facilitator said: "You\'ve named it. Now find it. Where does it live?"es it live in your body? Put your hand there. Don\'t fix it. Just be with it." My hand goes to my chest. Something heavy. Something old. Something that\'s been waiting.',
      tension: 'Intellectual understanding doesn\'t connect to an emotional pattern. You can name your wound perfectly and still not feel it. Reconnect closes that gap. It opens the file in edit mode.',
      turn: 'You can\'t rewrite a file that isn\'t open. The encoding has to be LIVE, in the body, felt, before anything can change. This is why talking about it never worked.',
      land: 'You can\'t rewrite a file that isn\'t open.',
      fiveC: {
        context: 'Healing step two: reconnect.',
        catalyst: 'Feel it in the body. Not think about it. Feel it.',
        complication: 'We\'ve spent years understanding the wound intellectually without ever activating it somatically.',
        change: 'The encoding goes live. The file opens in edit mode.',
        consequence: 'Now the body can process what the mind already knows.'
      }
    }
  },

  // ------ Chapter 46 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '46',
    editorNote: 'EDITOR Q: 4 methodology chapters in a row. Which R has the weakest personal story?',
    title: 'Release',
    epigraph: 'Emotions are your body\'s communication mechanism.',
    epigraphDate: '2022-10-12',
    description: 'The third step: let the body discharge what it\'s been holding.\n\nAn emotion takes 90 seconds to pass through your nervous system. Most people interrupt it at second 4 with a thought, a distraction, a scroll. Let the 90 seconds finish.\n\nThe file is open. Now let the frozen energy complete what it couldn\'t finish. Trembling, breath, tears, movement.',
    screenshotLine: null,
    imageConcept: 'A wave. Not crashing. Just passing through.',
    branch: 'Healing = return to flow',
    branchColor: '#4ade80',
    confidence: 90,
    rawEntries: [
      { date: '2022-10-12', text: 'Emotions are your body\'s communication mechanism. Cycle of suffering: can\'t escape it but we try to. Stories you tell yourself add to the suffering.' },
      { date: '2023-05-15', text: 'The reason when someone feels shit all we need to do is hold space and not "fix" the problem is because the body heals itself. It doesn\'t need outside intervention.' },
      { date: '2024-04-19', text: 'Notes from slowing down: feel like every action has intention. Feel nausea as my body releases. Slow down to turn default mode network off, make conscious.' },
      { date: '2025-05-23', text: 'If healing is about the response to situations, meditation is so effective because it helps create space between stimulus and response.' }
    ],
    connects: [
      { ch: 'Ch 45', num: '45', text: 'Reconnect: the file is now open' },
      { ch: 'Ch 47', num: '47', text: 'Rewire: the fourth step (rewrite the file)' },
      { ch: 'Ch 48', num: '48', text: 'The River: where release gets blocked' }
    ],
    beats: {
      scene: 'Same session. The black box from the Opera House was open. Four years of grief flooding in. The facilitator: "Don\'t think about it. The file is open. Just let it move." Ninety seconds of trembling. The 2018 breakup completing itself in my body, four years after my mind had "dealt with it."pen. Just let it move." Ninety seconds of trembling, tears, breath. Then: peace. The body did what no amount of thinking could.',
      tension: 'We interrupt emotions at second four because the body\'s communication feels dangerous. We scroll, think, distract. The emotion doesn\'t disappear. It stores. Now that the encoding is live (Reconnect), the stored energy can finally complete its journey.',
      turn: 'Ninety seconds. That\'s all an emotion needs to pass through your nervous system. If you let it. Most people have never let it.',
      land: 'An emotion takes 90 seconds to pass through your nervous system. Let the 90 seconds finish.',
      fiveC: {
        context: 'Healing step three: release.',
        catalyst: 'The encoding is live (from Reconnect). Now let the frozen energy discharge.',
        complication: 'We\'ve been interrupting emotions our entire lives. Trembling, tears, breath feel dangerous.',
        change: 'The body completes what it couldn\'t finish when the wound first happened.',
        consequence: 'Ninety seconds of feeling. Then peace.'
      }
    }
  },

  // ------ Chapter 47 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '47',
    editorNote: 'EDITOR Q: 4 methodology chapters in a row. Which R has the weakest personal story?',
    title: 'Rewire',
    epigraph: 'Crossing the chasm: this is what coaching is? Creating new beliefs and helping cross the chasm? The egoic mind is completely conditioned by the past.',
    epigraphDate: '2022-10-24',
    description: 'The fourth step: the mismatch.\n\nThe file is open (Reconnect). The energy has discharged (Release). Now the body encounters something that contradicts its prediction while the prediction is live. The brain detects "these can\'t both be true" and rewrites the file.\n\n"I\'m not ready" becomes "I\'ll never feel ready, and that\'s fine."\n\nNot affirmations. Lived rewrites. You have to do the thing to rewrite the belief about the thing. Edit window: about 5 hours.',
    screenshotLine: null,
    imageConcept: 'A sentence being crossed out. A new one written underneath in different handwriting. Bolder.',
    branch: 'Healing = return to flow',
    branchColor: '#4ade80',
    confidence: 90,
    rawEntries: [
      { date: '2022-10-24', text: 'Crossing the chasm: this is what coaching is? Creating new beliefs and helping cross the chasm? The egoic mind is completely conditioned by the past. Crossing the chasm is creating a new ego structure to identify with.' },
      { date: '2023-04-03', text: 'If all we are is experience. And the past is simply stories. Then there\'s no inherent sense of self. Only the stories we tell ourselves. Change the story. Change yourself.' },
      { date: '2023-08-21', text: 'Rather than giving yourself a statement, removing the trauma that causes you to need the statement.' },
      { date: '2023-11-18', text: 'Intellectual understanding doesn\'t connect to an emotional pattern.' },
      { date: '2026-07-09', text: 'Rewire = juxtaposition/mismatch. Body encounters something contradicting its prediction while the prediction is live. Brain detects "these can\'t both be true" and rewrites the file. Edit window ~5 hours. This is memory reconsolidation (Ecker, van der Kolk, Levine).' },
      { date: '2026-07-10', text: 'Creation is excavation. Journaling frees up conscious mind, allowing the next layer to come through. The Vibe Rise app has been the same: creating something allows the next layer to emerge. You don\'t figure it out then create. You create to figure it out. Creation IS the mismatch mechanism — you produce something and the body encounters a reality it didn\'t predict.' }
    ],
    connects: [
      { ch: 'Ch 46', num: '46', text: 'Release: energy discharged, file still open' },
      { ch: 'Ch 31', num: '31', text: 'One test changes the belief (the mismatch)' },
      { ch: 'Ch 5', num: '05', text: 'The kid before the crack (what you\'re rewiring TOWARD)' },
      { ch: 'Ch 53', num: '53', text: 'One scary thing a week (lived rewrites in action)' }
    ],
    beats: {
      scene: 'After a breathwork release, the facilitator says: "Now do the thing you were told you couldn\'t." I stand up. I share something real with the group. The file is still open. The body predicted rejection. It received connection. Mismatch. Rewrite.',
      tension: 'Affirmations don\'t work because the body doesn\'t believe what the mouth says. The body needs to predict one thing and experience another. That\'s the mismatch. That\'s what rewrites the file.',
      turn: 'You have to do the thing to rewrite the belief about the thing. The file has to be open. The energy has to have moved. Then the mismatch lands. Edit window: about 5 hours.',
      land: 'Not affirmations. Lived rewrites.',
      fiveC: {
        context: 'Healing step four: rewire.',
        catalyst: 'The file is open (Reconnect) and discharged (Release). Now create the mismatch.',
        complication: 'The body predicted danger. It experienced safety. "These can\'t both be true."',
        change: 'The brain rewrites the file. The old belief updates. Memory reconsolidation.',
        consequence: 'The belief changes. Not through words. Through evidence the body can\'t deny.'
      }
    }
  },

  // ------ Chapter 48 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '48',
    title: 'The River',
    epigraph: 'Healing: river that flows. Trauma creates the flow to stop or rampage. Being whole = flowing without restraint.',
    epigraphDate: '2025-04-12',
    description: 'Think of your growth as a river. Four points where it can get blocked:\n\nThe spring (do you know how you want to show up?). The riverbed (does your body feel safe enough to be seen?). The current (can you take action?). The ocean (can you receive what comes back?).\n\nFind the first blockage. That\'s where you start.',
    screenshotLine: null,
    imageConcept: 'A river with four markers. One section is dammed.',
    branch: 'Healing = return to flow',
    branchColor: '#4ade80',
    confidence: 95,
    rawEntries: [
      { date: '2025-04-12', text: 'Analogy for healing: river that flows. Trauma creates the flow to stop (suppression) or rampage (triggers). Being whole (fully healed) = being able to flow without restraint.', protoIp: 'The Water Model' },
      { date: '2024-07-27', text: 'Self-Work: feeling at peace in service. Jittering when receiving. Self worth related. Feeling worthy in service, unworthy when receiving.' },
      { date: '2023-09-03', text: 'If life flows (provides resistance and ease) then the universe has influence over the order. What is it to completely flow? Destiny?' }
    ],
    connects: [
      { ch: 'Ch 44', num: '44', text: 'Recognise: first healing step' },
      { ch: 'Ch 49', num: '49', text: 'The equation: working both sides' },
      { ch: 'Ch 74', num: '74', text: 'The diagonal: the river flowing' }
    ],
    beats: {
      scene: 'Drawing the river model. Spring, riverbed, current, ocean. My blockage was at the ocean: I could create, I could show up, I could act. But I couldn\'t receive. Compliments bounced off. Money felt wrong. Success felt undeserved.',
      tension: 'Most people try to fix the wrong blockage. They work on clarity when the issue is safety. Or action when the issue is receiving.',
      turn: 'Find the first blockage. That\'s where you start. Not the most dramatic. Not the most interesting. The first one. The river can\'t flow downstream of a dam.',
      land: 'Find the first blockage. That\'s where you start.',
      fiveC: {
        context: 'Growth as a river with four potential blockage points.',
        catalyst: 'Spring (clarity), Riverbed (safety), Current (action), Ocean (receiving).',
        complication: 'Most people work on the wrong blockage.',
        change: 'Find the first dam. The river can\'t flow downstream of a blockage.',
        consequence: 'Find the first dam. That\'s where the river needs help.'
      }
    }
  },

  // ------ Chapter 49 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '49',
    title: 'The Equation Works Both Ways',
    epigraph: 'If your ambitions feel safe and those ambitions are what you love then you actually don\'t need habits because you\'ll make time to do the things you love.',
    epigraphDate: '2025-05-18',
    description: 'Increase your essence clarity: do the mirror work. Increase your direction clarity: name your skills, problems, people.\n\nDecrease your wound load: do the 4 R\'s. Decrease your protective strength: do the scary thing.\n\nThe equation doesn\'t care which side you work on. It only cares that the ratio improves.',
    screenshotLine: null,
    imageConcept: 'A seesaw. Essence side slowly rising.',
    branch: 'Healing = return to flow',
    branchColor: '#4ade80',
    confidence: 85,
    rawEntries: [
      { date: '2025-05-18', text: 'If your ambitions feel safe and those ambitions are what you love then you actually don\'t need habits because you\'ll make time to do the things you love. Also habits feel forced. Feeling safe and allowing your love to guide is flow.' },
      { date: '2024-08-17', text: 'To overcome fear need to bring the darkness into the light. The darkness is the limiting belief or trauma. Once you do that it becomes a behavioural thing.' },
      { date: '2025-03-19', text: 'Manifestation = aligning frequency. Align frequency = habits + safety + visualise.' }
    ],
    connects: [
      { ch: 'Ch 48', num: '48', text: 'The River: where to start' },
      { ch: 'Ch 44', num: '44', text: 'Recognise: working the healing side' },
      { ch: 'Ch 53', num: '53', text: 'One scary thing: working the action side' }
    ],
    beats: {
      scene: 'Realising I\'d been working only one side. All mirror work. All healing. All self-knowledge. The equation has two sides. You can increase the numerator OR decrease the denominator.',
      tension: 'Most people get stuck because they only work one side. Healers heal forever. Hustlers hustle forever. The equation needs both.',
      turn: 'The equation doesn\'t care which side you work on. It only cares that the ratio improves. Do the mirror work AND the scary thing.',
      land: 'The equation doesn\'t care which side you work on. It only cares that the ratio improves.',
      fiveC: {
        context: 'The alignment equation has two sides.',
        catalyst: 'Increase essence + direction. Decrease wound + protection.',
        complication: 'Most people only work one side.',
        change: 'Do the mirror work AND the scary thing. The ratio shifts either way.',
        consequence: 'Work both. The ratio improves regardless of which side moves.'
      }
    }
  },

  // ------ Chapter 50 ------
  {
    type: 'chapter',
    section: 'flood',
    number: '50',
    title: 'Bottom Right',
    epigraph: 'I felt bad when I got told no, not because I got rejected but because I felt I caused them negative emotions.',
    epigraphDate: '2024-07-27',
    description: 'At the peak of the flood, I could have plotted myself on the Belief Graph. High capability (I had skills, ideas, clarity). Rock-bottom belief ("but who am I to do this?").\n\nI was as far bottom-right as you can get. Maximum capability. Minimum belief. The most qualified person in the room who was convinced he had no right to be there.',
    screenshotLine: null,
    imageConcept: 'The Belief Graph with a single dot in the extreme bottom-right corner. Far from the diagonal.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 85,
    rawEntries: [
      { date: '2024-07-27', text: 'I felt bad when I got told no, not because I got rejected but because I felt I caused them negative emotions. I\'m so sensitive to negative and positive emotions, I need to change my relationship with them.' },
      { date: '2024-08-12', text: 'Nervous system observations: there\'s a level of money it can handle. I\'m observing my inability to handle the headset cost. There\'s a level of attractiveness in a woman it can handle.' },
      { date: '2024-07-27', text: 'Self-Work: feeling at peace in service. Jittering when receiving. Self worth related. Feeling worthy in service, unworthy when receiving.' }
    ],
    connects: [
      { ch: 'Ch 26', num: '26', text: 'The Belief Graph' },
      { ch: 'Ch 28', num: '28', text: 'Limiting Belief quadrant' },
      { ch: 'Ch 51', num: '51', text: 'The Gap: what bottom-right feels like' },
      { ch: 'Ch 29', num: '29', text: 'The diagonal: where to go from here' }
    ],
    beats: {
      scene: '2021. Eighteen months into lockdown. Stuck at home in Sydney. I could describe my essence. Name my wound. Map my skills, problems, people. Frameworks for my frameworks. $30K deep in courses. And I was in the exact same room, in the exact same life, with the exact same paralysis. Maximum capability. Minimum belief. Bottom right of the graph.oblems, people. And I was paralysed. Maximum capability. Minimum belief. The most qualified person who was convinced he had no right to be there.',
      tension: 'Bottom-right is the most painful place on the graph because you can SEE everything you\'re capable of. And you can\'t reach it.',
      turn: 'This is where Part 2 ends. Extreme bottom-right. The most capable, least believing version of yourself. The only direction from here is up and to the left: toward the diagonal.',
      land: 'Maximum capability. Minimum belief. The most qualified person in the room who was convinced he had no right to be there.',
      fiveC: {
        context: 'Peak of the flood. All the knowledge. None of the belief.',
        catalyst: 'Plotting myself on the Belief Graph: extreme bottom-right.',
        complication: 'You can see everything you\'re capable of and can\'t reach any of it.',
        change: 'Part 2 ends here. The only direction from bottom-right is the diagonal.',
        consequence: 'The only direction from bottom-right is the diagonal. And the diagonal requires action.'
      }
    }
  },

  // ============================================================
  // SECTION 3: THE DIAGONAL
  // ============================================================
  {
    type: 'section',
    section: 'diagonal',
    name: 'The Diagonal',
    question: '"Is this action coming from my essence or my protection?"',
    chapters: 'Chapters 51-80 \u00b7 The Essence Test'
  },

  // ------ Chapter 51 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '51',
    title: 'The Gap',
    epigraph: 'Can your body build safety in an experience before it has the experience?',
    epigraphDate: '2023-12-11',
    description: 'You know who you are. You know what you\'d build. You know what\'s in the way. You have the vocabulary, the map, the equation.\n\nAnd you\'re still sitting in Head Full of Dreams. The gap between knowing and doing isn\'t motivation. It isn\'t discipline. It isn\'t another course.',
    screenshotLine: null,
    imageConcept: 'Two cliffs. A person on one side, everything they want on the other. The gap is narrow but the drop is infinite.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 90,
    rawEntries: [
      { date: '2023-12-11', text: 'Can your body build safety in an experience before it has the experience?' },
      { date: '2025-01-09', text: 'Limiting belief = fear. Why is it a limiting belief? We don\'t feel safe.' },
      { date: '2024-03-24', text: 'How to truly detach from future expectations, not simply tell yourself a story as a coping mechanism?' }
    ],
    connects: [
      { ch: 'Ch 25', num: '25', text: 'Head Full of Dreams: where the gap lives' },
      { ch: 'Ch 50', num: '50', text: 'Bottom Right: where the gap is widest' },
      { ch: 'Ch 52', num: '52', text: 'What actually closes it' }
    ],
    beats: {
      scene: 'Working for myself. Living in Bali. The life I wanted was right there. I could see it clearly. But the gap between knowing and doing was still open. Everything on the other side: freedom, creation, experiences, purpose. Everything on this side: safety, familiarity, the patterns I knew. And I couldn\'t move my feet.',
      tension: 'The gap isn\'t knowledge, motivation, or discipline. It\'s safety. Your nervous system hasn\'t experienced the other side as survivable yet.',
      turn: 'The gap closes when you jump, not when you understand why you should jump.',
      land: 'The gap between knowing and doing isn\'t motivation. It isn\'t discipline. It isn\'t another course.',
      fiveC: {
        context: 'You have everything: vocabulary, map, equation.',
        catalyst: 'Still sitting in Head Full of Dreams.',
        complication: 'The gap isn\'t about knowledge. It\'s about nervous system safety.',
        change: 'The gap closes when you jump, not when you understand why you should.',
        consequence: 'Part 3 begins: the doing.'
      }
    }
  },

  // ------ Chapter 52 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '52',
    title: 'What Actually Closes the Gap',
    epigraph: 'Performance improvement evolution: moving away from mindset into the body.',
    epigraphDate: '2023-08-21',
    description: 'The gap closes when your nervous system learns that the thing it\'s protecting you from is survivable.\n\nNot when you understand it. Not when you journal about it. When you survive it.',
    screenshotLine: null,
    imageConcept: 'A person mid-jump between the two cliffs. Not graceful. Just committed.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 90,
    rawEntries: [
      { date: '2023-08-21', text: 'Performance improvement evolution: moving away from mindset into the body. Rather than giving yourself a statement, removing the trauma that causes you to need the statement. I believe the next frontier is treating our central nervous system.' },
      { date: '2024-08-17', text: 'To overcome fear need to bring the darkness into the light. The darkness is the limiting belief or trauma. Once you do that it becomes a behavioural thing.' },
      { date: '2025-05-18', text: 'If you don\'t rise to the level of your ambitions, you fall to the level of your habits + safety.' },
      { date: '2026-06-28', text: 'The nervous system doesn\'t distinguish between a leopard and an identity challenge. Both trigger sympathetic activation. Both produce avoidance. The person isn\'t lazy or lacking willpower. Their NS is doing exactly what it was designed to do: protect the current identity because changing it feels like dying.' }
    ],
    connects: [
      { ch: 'Ch 51', num: '51', text: 'The gap defined' },
      { ch: 'Ch 53', num: '53', text: 'One scary thing a week: the method' },
      { ch: 'Ch 63', num: '63', text: 'Expanding the dome' }
    ],
    beats: {
      scene: 'Mid-jump. Not graceful. Not prepared. Not confident. Just committed. The gap closed the moment I left the ledge, not when I landed.',
      tension: 'We think the gap closes with understanding. It doesn\'t. It closes with survival. Your nervous system needs to experience the thing and live to tell about it.',
      turn: 'Not when you understand it. Not when you journal about it. When you survive it.',
      land: 'The gap closes when your nervous system learns that the thing it\'s protecting you from is survivable.',
      fiveC: {
        context: 'The gap is a nervous system problem, not a knowledge problem.',
        catalyst: 'The only thing that closes it: surviving the thing.',
        complication: 'Everything else, journals, courses, therapy, is preparation, not closure.',
        change: 'Not when you understand it. Not when you journal about it. When you survive it.',
        consequence: 'Jump. Not gracefully. Just committed.'
      }
    }
  },

  // ------ Chapter 53 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '53',
    title: 'One Scary Thing a Week',
    epigraph: 'Make people high on life. How? By raising their frequency. How? Experiences that put them in that state + rewire their subconscious.',
    epigraphDate: '2025-02-20',
    description: 'I started with two friends. We made a pact: one thing per week that terrifies you. Not "a bit uncomfortable." Terrifies.\n\nThe first month was the hardest. By week five I was living in Bali. By month three I had quit my job. By month six I was funding my life hosting silent discos on beaches.',
    screenshotLine: 'By week five I was living in Bali. By month three I had quit my job. By month six I was funding my life hosting silent discos on beaches.',
    imageConcept: 'A calendar with one box highlighted per week. Each box has a different colour, getting brighter.',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 60,
    rawEntries: [
      { date: '2025-02-20', text: 'Mission: Make people high on life. How? By raising their frequency. How? By reconnecting them to their child-like frequency. How? Experiences that put them in that state + rewire their subconscious.' },
      { date: '2025-01-18', text: 'I never understand quotes like "do what sets your heart on fire" until I came across disco\'s.' },
      { date: '2024-01-27', text: 'Fear of non-authentic act can be rationalised away. Fear of authentic act can\'t.' },
      { date: '2026-06-28', text: 'Every action is a vote for the type of person you want to become. But the first vote is the hardest to cast. Because casting it requires crossing an identity boundary that the nervous system reads as threat. Until you build enough safety to tolerate the risk, the vote stays uncast. That first scary thing IS the first vote.' },
      { date: '2026-07-10', text: 'The learning/life loop: Curate curiosities → train state to take action → have experience → report on state triggered → proceed or kill. This is the Curiosity → Safety → Experience chain as a repeatable cycle. Each loop expands the cone and deepens the resolution.', protoIp: 'Curiosity-Safety-Experience loop' },
      { date: '2026-07-12', text: 'Hero Stage 5: First Vibe Rise. The point of no return. Not just "I did it" but "I felt ALIVE doing it." The body knows now, not just the mind. You can\'t pretend you don\'t know what alive feels like after this. There\'s no going back.' }
    ],
    connects: [
      { ch: 'Ch 52', num: '52', text: 'What actually closes the gap' },
      { ch: 'Ch 59', num: '59', text: 'The magic show: one of the scary things' },
      { ch: 'Ch 61', num: '61', text: 'The Identity Flip: when the votes reach majority' },
      { ch: 'Ch 77', num: '77', text: 'Silent discos: where the scary things led' }
    ],
    beats: {
      scene: 'Three of us. A group chat. One rule: one thing per week that terrifies you. Week one: post a video of my face. Week two: go to an event alone. Week five: book a flight to Bali. It escalated fast.',
      tension: 'The pact was simple but brutal. Not "a bit uncomfortable." Terrifies. The difference matters. Discomfort confirms what you already know. Terror rewrites what you believe.',
      turn: 'Five weeks to Bali. Three months to quitting. Six months to silent discos on beaches. The timeline of a nervous system that learned the scary thing was survivable.',
      land: 'By week five I was living in Bali. By month three I had quit my job.',
      fiveC: {
        context: 'A pact with two friends: one terrifying thing per week.',
        catalyst: 'Not uncomfortable. Terrifying.',
        complication: 'The first month is the hardest. The nervous system screams.',
        change: 'Week five: Bali. Month three: quit. Month six: silent discos.',
        consequence: 'A timeline that proves the method works.'
      }
    }
  },

  // ------ Chapter 54 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '54',
    title: 'The Essence Test',
    epigraph: 'Fear of non-authentic act can be rationalised away. Fear of authentic act can\'t. You think I\'m silly, I think I\'m beautiful.',
    epigraphDate: '2024-01-27',
    description: 'Before any action, ask two questions:\nHow scared am I? (1-10)\nHow excited am I? (1-10)\n\nPlot yourself.',
    screenshotLine: null,
    imageConcept: 'The 2x2 matrix. Fear x Excitement. Four quadrants labelled.',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 85,
    rawEntries: [
      { date: '2024-01-27', text: 'Fear of non-authentic act can be rationalised away. Fear of authentic act can\'t. You think I\'m silly, I think I\'m beautiful.' },
      { date: '2024-09-16', text: 'Our essence is love. However this essence becomes blocked by fear.' },
      { date: '2023-02-14', text: 'What does living authentically mean? I believe it means living in connection to our desires. What stops us? 1) Fear. 2) Trauma.' }
    ],
    connects: [
      { ch: 'Ch 55', num: '55', text: 'Essence Zone: high fear + high excitement' },
      { ch: 'Ch 56', num: '56', text: 'Protective Voice: high fear, low excitement' },
      { ch: 'Ch 57', num: '57', text: 'Comfort Zone: low fear, high excitement' },
      { ch: 'Ch 58', num: '58', text: 'Not Aligned: low fear, low excitement' }
    ],
    beats: {
      scene: 'Before every decision now, I pause. Two numbers. Scared: how much? Excited: how much? Plot them on the grid. The answer is always in the quadrant.',
      tension: 'We make decisions based on logic, obligation, or fear. The Essence Test bypasses all of that and goes straight to the body.',
      turn: 'Two questions. Two numbers. One grid. The simplest diagnostic for whether an action comes from essence or protection.',
      land: 'How scared am I? How excited am I? Plot yourself.',
      fiveC: {
        context: 'Part 3\'s signature model: the Essence Test.',
        catalyst: 'Two questions: fear (1-10) and excitement (1-10).',
        complication: 'Most people don\'t know the difference between essence and protection.',
        change: 'Plot yourself. The quadrant tells you which voice is driving.',
        consequence: 'The simplest decision-making tool you\'ll ever use.'
      }
    }
  },

  // ------ Chapter 55 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '55',
    title: 'Essence Zone',
    epigraph: 'Seek moments you love. Stack enough moments you love together and you live a life you love.',
    epigraphDate: '2024-09-16',
    description: 'High fear AND high excitement. This is who you actually are.\n\nThe fear isn\'t about the action. The fear is about being seen as your real self. The excitement is your essence recognising itself.\n\nWhen both are high, move.',
    screenshotLine: null,
    imageConcept: 'Top-right quadrant glowing. The word "MOVE" underneath.',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 90,
    rawEntries: [
      { date: '2024-09-16', text: 'Seek moments you love. Stack enough moments you love together and you live a life you love.' },
      { date: '2025-01-01', text: 'Be more passionate. You know what\'s cool? Passion.' },
      { date: '2024-06-24', text: 'Secret is aligning what makes you enter flow state with the external environment that is flowing.' }
    ],
    connects: [
      { ch: 'Ch 54', num: '54', text: 'The Essence Test' },
      { ch: 'Ch 64', num: '64', text: 'The Groan: the feeling of essence zone' },
      { ch: 'Ch 59', num: '59', text: 'The Magic Show: essence zone in action' }
    ],
    beats: {
      scene: 'Standing in front of a hundred people about to do something I\'d never done. Scared: 9. Excited: 9. Both at maximum. Every cell saying "this is you."',
      tension: 'The fear in the essence zone isn\'t about danger. It\'s about being seen as your real self. What if they see me and I\'m not enough?',
      turn: 'The excitement is your essence recognising itself. The fear is your protection doing its job. When both are high, the essence is louder. Move.',
      land: 'When both are high, move.',
      fiveC: {
        context: 'Top-right quadrant: high fear + high excitement.',
        catalyst: 'This is who you actually are.',
        complication: 'The fear is about being seen as your real self.',
        change: 'The excitement is your essence recognising itself.',
        consequence: 'When both are high, that\'s the signal. Move.'
      }
    }
  },

  // ------ Chapter 56 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '56',
    title: 'Protective Voice',
    epigraph: 'Fear of hurting others is also a fear of stepping into my power. Scared to be great.',
    epigraphDate: '2024-04-29',
    description: 'High fear, low excitement. The wound is driving.\n\nThis action protects you from pain, not toward joy. The Performer taking on another project. The People Pleaser saying yes to someone else\'s priority.\n\nWhen fear is high and excitement is low, stop. Name the voice. Ask what it\'s guarding.',
    screenshotLine: null,
    imageConcept: 'Top-left quadrant in grey. The word "STOP" underneath.',
    branch: 'Body keeps the score',
    branchColor: '#ef4444',
    confidence: 85,
    rawEntries: [
      { date: '2024-04-29', text: 'The black nut/rock inside is part of me that doesn\'t feel safe to be myself. Fear of hurting others is also a fear of stepping into my power. Scared to be great.' },
      { date: '2024-07-27', text: 'I felt bad when I got told no, not because I got rejected but because I felt I caused them negative emotions.' },
      { date: '2024-03-20', text: 'Boundaries = what you value. Some "boundaries" protect traumas.' }
    ],
    connects: [
      { ch: 'Ch 54', num: '54', text: 'The Essence Test' },
      { ch: 'Ch 40', num: '40', text: 'What the protective voice sounds like' },
      { ch: 'Ch 15', num: '15', text: 'The protector\'s job' }
    ],
    beats: {
      scene: 'Saying yes to a project I didn\'t care about. High fear of disappointing them. Zero excitement about the work. The Performer taking on another commitment to avoid rejection.',
      tension: 'High fear, low excitement means the wound is driving. You\'re not moving toward something. You\'re running from something.',
      turn: 'When fear is high and excitement is low: stop. Name the voice. Ask what it\'s guarding. The action isn\'t yours.',
      land: 'When fear is high and excitement is low, stop. Name the voice.',
      fiveC: {
        context: 'Top-left quadrant: high fear, low excitement.',
        catalyst: 'The wound is driving. Pain avoidance, not joy pursuit.',
        complication: 'It looks like productivity. It\'s actually protection.',
        change: 'Stop. Name the voice. The action isn\'t yours.',
        consequence: 'Stop. Name the voice. This action isn\'t from essence.'
      }
    }
  },

  // ------ Chapter 57 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '57',
    editorNote: 'EDITOR Q: Merge Comfort Zone + Not Aligned into one "other two quadrants" chapter?',
    title: 'Comfort Zone',
    epigraph: 'My worst days are the days I don\'t move. Any day with even boring movement is better than a day sitting all day.',
    epigraphDate: '2025-05-30',
    description: 'Low fear, high excitement. Safe and fun. Good for momentum, bad for growth.\n\nUse it for recovery. Don\'t mistake it for progress.',
    screenshotLine: null,
    imageConcept: 'Bottom-right quadrant in soft green. The word "REST" underneath.',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 50,
    rawEntries: [
      { date: '2025-05-30', text: 'My worst days are the days I don\'t move. Any day with even boring movement is better than a day sitting all day.' },
      { date: '2024-03-10', text: 'Design my days based on energy available, not time available. Rest is part of my job.' },
      { date: '2025-03-13', text: 'Loving and fun experiences with friends is the point of life.' }
    ],
    connects: [
      { ch: 'Ch 54', num: '54', text: 'The Essence Test' },
      { ch: 'Ch 55', num: '55', text: 'Essence Zone: where growth happens' },
      { ch: 'Ch 58', num: '58', text: 'Not Aligned: where nothing happens' }
    ],
    beats: {
      scene: 'Venice. 4am. Jumping off the tallest bridge in underwear and a poncho. Dad: "What\'s coming first, maturity or a body bag?" High excitement. Low fear. Because it was the MASK. The Jackass era was all comfort zone dressed as courage. My drunk tomfoolery was my armour. The most reckless version of me was actually the safest, because none of it was real.owing, but recovering. And that\'s OK, today.',
      tension: 'The comfort zone isn\'t the enemy. It\'s where you recover. The danger is mistaking it for the destination.',
      turn: 'Good for momentum. Bad for growth. Rest here, but don\'t live here.',
      land: 'Use it for recovery. Don\'t mistake it for progress.',
      fiveC: {
        context: 'Bottom-right quadrant: low fear, high excitement.',
        catalyst: 'Safe and fun. The activities you enjoy without risk.',
        complication: 'Easy to stay here forever because it feels good.',
        change: 'Good for momentum. Bad for growth. Rest here, don\'t live here.',
        consequence: 'Recovery zone, not growth zone. Rest here. Don\'t live here.'
      }
    }
  },

  // ------ Chapter 58 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '58',
    editorNote: 'EDITOR Q: Merge Comfort Zone + Not Aligned into one "other two quadrants" chapter?',
    title: 'Not Aligned',
    epigraph: 'We seek happiness in material things because we don\'t have the availability to find them in experiences.',
    epigraphDate: '2025-06-05',
    description: 'Low fear, low excitement. This isn\'t your fight.\n\nYou\'re doing it out of obligation, habit, or someone else\'s expectation. Drop it. Find the thing that scares AND excites you.',
    screenshotLine: null,
    imageConcept: 'Bottom-left quadrant faded. The word "DROP" underneath.',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 80,
    rawEntries: [
      { date: '2025-06-05', text: 'We seek happiness in material things because we don\'t have the availability to find them in experiences in traditional 9-5.' },
      { date: '2025-05-10', text: 'We need to understand the trade we\'re making with work. Where we get lost is by working more for more money, but end up sacrificing the things that make us happy.' },
      { date: '2024-12-17', text: 'Experiences make you happy. Not goods.' }
    ],
    connects: [
      { ch: 'Ch 54', num: '54', text: 'The Essence Test' },
      { ch: 'Ch 55', num: '55', text: 'Essence Zone: where to aim instead' },
      { ch: 'Ch 1', num: '01', text: 'The Promise: what put you in this quadrant' }
    ],
    beats: {
      scene: 'Sitting in a meeting about something I didn\'t care about. Low fear (nothing at stake). Low excitement (nothing alive). Why was I there? Obligation. Habit. Someone else\'s priority.',
      tension: 'This quadrant is where most of modern life happens. Not scary. Not exciting. Just... there. Obligation dressed as responsibility.',
      turn: 'Drop it. If nothing in you is scared or excited, it\'s not your fight. Find the thing that produces both.',
      land: 'You\'re doing it out of obligation, habit, or someone else\'s expectation. Drop it.',
      fiveC: {
        context: 'Bottom-left quadrant: low fear, low excitement.',
        catalyst: 'This isn\'t your fight.',
        complication: 'But it feels like responsibility, so you stay.',
        change: 'If nothing in you is scared or excited, it\'s not your fight.',
        consequence: 'Drop it. Find the thing that scares AND excites you.'
      }
    }
  },

  // ------ Chapter 59 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '59',
    title: 'The Magic Show',
    epigraph: 'It\'s easy to come from a place of warmth when you\'re comfortable. It\'s doing it when you\'re vulnerable that\'s the real challenge.',
    epigraphDate: '2022-11-05',
    description: 'One of my early scary things: perform a magic show. Not for a career. Not for content. Because the idea of standing in front of people and being deliberately vulnerable made me want to throw up AND laugh at the same time.\n\nThat\'s the signal.',
    screenshotLine: null,
    imageConcept: 'A person pulling a card from a hat, visibly nervous, audience leaning in.',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 55,
    rawEntries: [
      { date: '2022-11-05', text: 'It\'s easy to come from a place of warmth when you\'re comfortable. It\'s doing it when you\'re vulnerable that\'s the real challenge.' },
      { date: '2024-01-27', text: 'Fear of non-authentic act can be rationalised away. Fear of authentic act can\'t.' },
      { date: '2025-01-18', text: 'I never understand quotes like "do what sets your heart on fire" until I came across disco\'s.' }
    ],
    connects: [
      { ch: 'Ch 53', num: '53', text: 'One scary thing a week: the pact' },
      { ch: 'Ch 55', num: '55', text: 'Essence Zone: both numbers high' },
      { ch: 'Ch 60', num: '60', text: 'The Stand-Up Set: another scary thing' }
    ],
    beats: {
      scene: 'A magic show. In front of strangers. I\'d learned three tricks from YouTube. My hands were shaking. And I was grinning like an idiot.',
      tension: 'Not for a career. Not for content. For the groan. The thing that makes you want to throw up AND laugh at the same time.',
      turn: 'That\'s the signal. When your body is at war with itself, scared and excited simultaneously, you\'ve found essence.',
      land: 'The idea of being deliberately vulnerable made me want to throw up AND laugh at the same time. That\'s the signal.',
      fiveC: {
        context: 'One of the early scary things from the pact.',
        catalyst: 'Perform a magic show. Not for a career. For the groan.',
        complication: 'Hands shaking. Stomach churning. Grinning.',
        change: 'Survived it. The nervous system updated.',
        consequence: 'The signal is unmistakable: throw up AND laugh.'
      }
    }
  },

  // ------ Chapter 60 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '60',
    title: 'The Stand-Up Set',
    epigraph: 'Art is the natural expression of the spirit. It\'s opportunity to share a piece of itself.',
    epigraphDate: '2023-09-15',
    description: 'Another one: five minutes of stand-up comedy. I\'m not a comedian. That\'s the point. The fear wasn\'t about being funny. It was about being seen trying something I might fail at publicly.\n\nScary: 9. Excited: 8. Essence zone.',
    screenshotLine: null,
    imageConcept: 'A person on a tiny stage, one spotlight, holding a microphone like it might bite them.',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 55,
    rawEntries: [
      { date: '2023-09-15', text: 'Art is the natural expression of the spirit. It\'s opportunity to share a piece of itself. Art is communication.' },
      { date: '2022-11-06', text: 'Fear is what holds me back from expressing more love with my family.' },
      { date: '2025-04-27', text: 'It\'s not coming to peace with having no ambition. It\'s coming to peace with what the underlying meaning of that ambition was.' }
    ],
    connects: [
      { ch: 'Ch 59', num: '59', text: 'The Magic Show: another scary thing' },
      { ch: 'Ch 55', num: '55', text: 'Essence Zone: the quadrant' },
      { ch: 'Ch 61', num: '61', text: 'The Identity Flip that followed' }
    ],
    beats: {
      scene: 'Open mic night. Canggu. Five minutes. A set I\'d written on my phone in a cafe two hours before. Scared: 9. Excited: 8. Essence zone.',
      tension: 'The fear wasn\'t about being funny. It was about being seen trying something I might fail at. Publicly. With no protective voice to hide behind.',
      turn: 'I\'m not a comedian. That\'s the point. The scary thing isn\'t about becoming something. It\'s about being seen as something. Raw. Unpolished. Real.',
      land: 'Scary: 9. Excited: 8. Essence zone.',
      fiveC: {
        context: 'Another scary thing from the pact.',
        catalyst: 'Five minutes of stand-up comedy. Not a comedian.',
        complication: 'The fear: being seen trying something I might fail at publicly.',
        change: 'Survived. The nervous system updated again.',
        consequence: 'Each survival expands the dome a little further.'
      }
    }
  },

  // ------ Chapter 61 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '61',
    title: 'The Identity Flip',
    epigraph: 'I realise now my crisis was triggered by recognising this is what capitalism built to. Recognise now I need to break free.',
    epigraphDate: '2022-11-01',
    description: 'Something shifted around week six. I stopped identifying as "someone who\'s scared of these things" and started identifying as "someone who does scary things."\n\nAfter the flip, NOT doing the scary thing felt worse than doing it. The pain of betraying my new identity was greater than the pain of the fear.',
    screenshotLine: 'The pain of betraying my new identity was greater than the pain of the fear.',
    imageConcept: 'A switch being flipped. One side says "AFRAID." The other says "ALIVE."',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 50,
    rawEntries: [
      { date: '2022-11-01', text: 'I realise now my crisis was triggered by recognising this is what capitalism built to. My struggle since has been trying to rationalise and fit in to make it work. Recognise now I need to break free.' },
      { date: '2025-03-09', text: 'Make decisions based on future self. Decisions grounded in values / methodology / habits.' },
      { date: '2024-11-08', text: 'Journey is the most important piece. We choose that journey.' },
      { date: '2026-06-28', text: 'Each person has a thermostat for how much success, aliveness, and visibility they\'ll allow themselves. The identity flip is when the thermostat resets. NOT doing the scary thing now exceeds the thermostat limit. The new identity becomes the baseline the NS protects.' },
      { date: '2026-06-28', text: 'You don\'t need a unanimous vote. You need a majority. Enough scary things, enough Wahoos, enough evidence that the new identity is real, and the vote count tips. The flip isn\'t a decision. It\'s the moment the majority arrives.' }
    ],
    connects: [
      { ch: 'Ch 53', num: '53', text: 'One scary thing a week: casting votes' },
      { ch: 'Ch 60', num: '60', text: 'The stand-up set: just before the flip' },
      { ch: 'Ch 62', num: '62', text: 'You don\'t rise to ambitions' },
      { ch: 'Ch 79', num: '79', text: 'The one sentence revisited' }
    ],
    beats: {
      scene: 'I told myself I\'d do 5 magic tricks at the open mic. I did 4. Walked off feeling like I\'d failed. But the next week, I sang on Instagram. Without fear. Without planning. Without the voice. The flip had happened and I didn\'t even notice until it was already done. The pain of NOT doing the scary thing was now worse than doing it.d, I felt something new: the dread of NOT doing it. The identity had flipped.',
      tension: 'Identity is the most powerful force in human behaviour. You will always act in alignment with who you believe you are.',
      turn: 'After the flip, not doing the scary thing felt worse than doing it. The pain of betraying my new identity was greater than the pain of the fear.',
      land: 'The pain of betraying my new identity was greater than the pain of the fear.',
      fiveC: {
        context: 'Six weeks of scary things.',
        catalyst: 'The identity shifts: from "afraid" to "alive."',
        complication: 'Identity shifts are irreversible. You can\'t go back to who you were.',
        change: 'NOT doing the scary thing now feels worse than doing it.',
        consequence: 'The flip is the single most important moment in the entire journey.'
      }
    }
  },

  // ------ Chapter 62 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '62',
    editorNote: 'EDITOR Q: Merge Dome + Expanding Dome into one chapter?',
    title: 'You Don\'t Rise to Your Ambitions',
    epigraph: 'Hustle culture obsesses over habits. But if you don\'t rise to the level of your ambitions, you fall to the level of your habits + safety. It\'s missing half the equation.',
    epigraphDate: '2025-05-18',
    description: 'We don\'t rise to the level of our ambitions. We fall to the level of what feels safe.\n\nEvery course, every vision board, every goal-setting session raises your ambitions. None of them change what your nervous system feels safe doing.\n\nThe ceiling isn\'t your dreams. The ceiling is your dome.',
    screenshotLine: 'We don\'t rise to the level of our ambitions. We fall to the level of what feels safe.',
    imageConcept: 'A glass dome over a person. Their dreams are drawn on the dome\'s surface, just out of reach.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 95,
    rawEntries: [
      { date: '2025-05-18', text: 'Hustle culture obsesses over habits. But if you don\'t rise to the level of your ambitions, you fall to the level of your habits + safety. It\'s missing half the equation. Arguably the most important half.', protoIp: 'Safety x Expression equation' },
      { date: '2024-12-23', text: 'Level 1: learning the tools. Level 2: deploying the tools. Level 3: not becoming dis-regulated no matter the environment.' },
      { date: '2024-08-12', text: 'Nervous system observations: there\'s a level of money it can handle. There\'s a level of attractiveness in a woman it can handle.' },
      { date: '2025-01-08', text: 'Procrastination = not feeling safe / comfortable to take action. Reason we take action at the last minute is the thought of not delivering is more unsafe / uncomfortable than taking action.', protoIp: 'Procrastination as safety' },
      { date: '2026-06-17', text: 'Performance = flow state. Flow state requires feeling safe. Way to make team feel safe quicker in big games is visualisations or anything that creates familiarity.', protoIp: 'Safety × Performance' },
      { date: '2026-06-28', text: 'The class ceiling isn\'t money. It\'s nervous system state. Affluent people access better choices because they have enough baseline safety that their NS has spare capacity for identity risks and cognitive effort. Poor NS regulation = locked in the same patterns regardless of price.', protoIp: 'Class ceiling = NS state' },
      { date: '2026-07-10', text: 'Life is a game. Your beliefs determine what\'s possible. Your comfort zone determines your reality. Your experience is the reward. That\'s why it\'s called the present. The dome isn\'t just a ceiling on your ambitions. It\'s the boundary of your entire reality. Expand it and reality itself changes.' }
    ],
    connects: [
      { ch: 'Ch 25', num: '25', text: 'Head Full of Dreams: ambitions with no safety' },
      { ch: 'Ch 63', num: '63', text: 'Expanding the Dome' },
      { ch: 'Ch 51', num: '51', text: 'The Gap: the dome creates it' },
      { ch: 'Ch 73', num: '73', text: 'What Actually Changed: same world, bigger dome' }
    ],
    beats: {
      scene: 'Vision board on the wall. Every goal crystal clear. And a glass dome around me, invisible, holding me exactly where I am. The goals are drawn on the dome\'s surface. Just out of reach.',
      tension: 'Every course raises ambitions. Every vision board raises ambitions. But none of them change the dome. The ceiling isn\'t your dreams. It\'s your nervous system. And the ceiling isn\'t money either. It\'s what your nervous system feels safe doing.',
      turn: 'We don\'t rise to the level of our ambitions. We fall to the level of what feels safe. Until you expand the dome, the ambitions are just drawings on glass.',
      land: 'The ceiling isn\'t your dreams. The ceiling is your dome.',
      fiveC: {
        context: 'Ambitions are high. Action stays the same.',
        catalyst: 'Every goal-setting tool raises ambitions but ignores the dome.',
        complication: 'The dome is your nervous system. It determines what\'s possible. The class ceiling isn\'t money. It\'s NS state.',
        change: 'The reframe: the ceiling isn\'t dreams OR money. It\'s safety.',
        consequence: 'Expand the dome. Everything changes.'
      }
    }
  },

  // ------ Chapter 63 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '63',
    editorNote: 'EDITOR Q: Merge Dome + Expanding Dome into one chapter?',
    title: 'Expanding the Dome',
    epigraph: 'To overcome fear need to bring the darkness into the light. Once you do that it becomes a behavioural thing.',
    epigraphDate: '2024-08-17',
    description: 'We all live in a dome. Everything inside is what feels safe. Everything outside triggers our fear.\n\nThere are two ways to expand it. Do the scary thing (prove to your nervous system it\'s survivable). Or heal the wound that made it scary in the first place.\n\nBest approach: both. Simultaneously.',
    screenshotLine: null,
    imageConcept: 'A dome expanding outward. Cracks of light where the old boundary was.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 85,
    rawEntries: [
      { date: '2024-08-17', text: 'To overcome fear need to bring the darkness into the light. The darkness is the limiting belief or trauma. Once you do that it becomes a behavioural thing.' },
      { date: '2025-04-12', text: 'Healing: river that flows. Trauma creates the flow to stop or rampage. Being whole = flowing without restraint.' },
      { date: '2023-06-01', text: 'Children are the way they are because they don\'t fear consequences. Over-coming fear is the secret to being more child-like.' }
    ],
    connects: [
      { ch: 'Ch 62', num: '62', text: 'The dome defined' },
      { ch: 'Ch 52', num: '52', text: 'What actually closes the gap' },
      { ch: 'Ch 73', num: '73', text: 'What actually changed: bigger dome' }
    ],
    beats: {
      scene: 'Week 9: the rainbow clothing returned. Week 12: ear piercings, bandana, finger nail cartoons. Each week something came back that had been buried since thirteen. The dome was expanding visibly. Two forces at once: the scary things pushing from outside, the healing work dissolving from inside. Both happening simultaneously. The dome cracking with light.ork: dissolving the dome from inside. Both happening at once. The dome starts cracking with light.',
      tension: 'Most people try only one. Action-takers push without healing (hustle). Healers dissolve without pushing (therapy). The dome needs both.',
      turn: 'Best approach: both. Simultaneously. Push the dome with scary things while healing the wound that built it.',
      land: 'Best approach: both. Simultaneously.',
      fiveC: {
        context: 'We live in a dome of what feels safe.',
        catalyst: 'Two expansion methods: action and healing.',
        complication: 'Most people use only one.',
        change: 'Push the dome with action while dissolving it with healing. Both at once.',
        consequence: 'Both simultaneously: the fastest dome expansion possible.'
      }
    }
  },

  // ------ Chapter 64 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '64',
    title: 'The Groan',
    epigraph: 'If life flows (provides resistance and ease) then the universe has influence over the order. What is it to completely flow?',
    epigraphDate: '2023-09-03',
    description: 'I call the sweet spot "the groan." The thing that makes you go "ughhhhh" AND "let\'s go" in the same breath.\n\nNot a panic attack. Not a yawn. A groan. The sound of your essence and your protection arguing in real time.',
    screenshotLine: null,
    imageConcept: 'A person making an exaggerated groan face. Half grimace, half grin.',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 55,
    rawEntries: [
      { date: '2023-09-03', text: 'If life flows (provides resistance and ease) then the universe has influence over the order. What is it to completely flow? Destiny?' },
      { date: '2025-04-27', text: 'It\'s not coming to peace with having no ambition. It\'s coming to peace with what the underlying meaning of that ambition was. You\'re then free to create your own meaning behind ambition. To play?' },
      { date: '2024-06-24', text: 'Secret is aligning what makes you enter flow state with the external environment that is flowing.' }
    ],
    connects: [
      { ch: 'Ch 55', num: '55', text: 'Essence Zone: the quadrant the groan lives in' },
      { ch: 'Ch 65', num: '65', text: 'Five Layers: where the groan escalates' },
      { ch: 'Ch 71', num: '71', text: '3% Better: making the groan more survivable' }
    ],
    beats: {
      scene: 'Bondi Beach. Week 4. Starting a silent disco by myself. "If I started it and no one joined there would be literally nowhere to hide." That sound in my chest: "ughhhhh... let\'s go." Not a panic attack. Not a yawn. A groan. The exact midpoint between terror and aliveness.e moment before quoting your real price. That sound: "ughhhhh... let\'s go." That\'s the groan.',
      tension: 'The groan is uncomfortable because it\'s the sound of two forces in conflict: essence pushing forward and protection pulling back. Neither will win. Both are real.',
      turn: 'The groan is the signal that you\'re at the exact right threshold. Not too safe (yawn). Not too dangerous (panic). The sweet spot.',
      land: 'The sound of your essence and your protection arguing in real time.',
      fiveC: {
        context: 'There\'s a sweet spot between comfort and panic.',
        catalyst: 'The groan: "ughhhhh" AND "let\'s go" in the same breath.',
        complication: 'It\'s uncomfortable because both voices are real.',
        change: 'The groan means you\'re at the exact right threshold. Not too safe, not too dangerous.',
        consequence: 'The groan is the compass. Follow it.'
      }
    }
  },

  // ------ Chapter 65 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '65',
    editorNote: 'EDITOR Q: 6 fear-layer chapters reads as a list. Your personal layer gets full chapter, others share?',
    title: 'The Five Layers of Fear',
    epigraph: 'Is a vulnerability hangover simply our body\'s reaction to trauma? Is all fear of sharing vulnerability coming from a place of trauma?',
    epigraphDate: '2025-06-05',
    description: 'Fear of being seen online. Fear of being judged in real time. Fear of asking for money. Fear of being rejected for who you really are. Fear of claiming authority.\n\nScreen. Live. Money. Vulnerable. Authority.\n\nEveryone has a layer where they get stuck. Find yours.',
    screenshotLine: null,
    imageConcept: 'Five doors, each slightly more intimidating. A person standing in front of one, the others visible behind it.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 90,
    rawEntries: [
      { date: '2025-06-05', text: 'Is a vulnerability hangover simply our body\'s reaction to trauma? Is all fear of sharing vulnerability coming from a place of trauma?' },
      { date: '2024-04-23', text: 'Problem with selling on social media is it\'s a cesspit for projection. The people who most need your solution are also likely to be most triggered by it.' },
      { date: '2024-08-12', text: 'Nervous system observations: there\'s a level of money it can handle.' }
    ],
    connects: [
      { ch: 'Ch 66', num: '66', text: 'Screen: the first layer' },
      { ch: 'Ch 67', num: '67', text: 'Live: the second layer' },
      { ch: 'Ch 68', num: '68', text: 'Money: the third layer' },
      { ch: 'Ch 69', num: '69', text: 'Vulnerable: the fourth layer' }
    ],
    beats: {
      scene: 'Mapping the five layers for the first time. Screen. Live. Money. Vulnerable. Authority. Realising I\'d been stuck at Money for two years.',
      tension: 'Everyone has a layer where they get stuck. They can do everything below it. Everything above it is blocked. The layer is the dam.',
      turn: 'Find your layer. That\'s where the groan lives. That\'s where the next dome expansion happens.',
      land: 'Everyone has a layer where they get stuck. Find yours.',
      fiveC: {
        context: 'Five layers of fear, each more intimate than the last.',
        catalyst: 'Screen, Live, Money, Vulnerable, Authority.',
        complication: 'Everyone has a layer that stops them. Everything above it is blocked.',
        change: 'Find your layer. That\'s where the groan lives, and the next expansion.',
        consequence: 'Find your layer. That\'s where you work.'
      }
    }
  },

  // ------ Chapter 66 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '66',
    editorNote: 'EDITOR Q: 6 fear-layer chapters reads as a list. Your personal layer gets full chapter, others share?',
    title: 'Screen',
    epigraph: 'Before that I didn\'t have unconditional self-worth which is why I was scared to post.',
    epigraphDate: '2023-04-20',
    description: 'The first layer: being seen online. Posting something. Sharing your face. Putting your name next to an opinion.\n\nFor some people this is nothing. For others it\'s the entire wall.\n\nStart here if: you\'ve never told the internet who you really are.',
    screenshotLine: null,
    imageConcept: 'A phone screen with a "Post" button. A finger hovering.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 90,
    rawEntries: [
      { date: '2023-04-20', text: 'I realise only since I\'ve started Sprouter have I entered Chapter 3. Before that I didn\'t have unconditional self-worth which is why I was scared to post.' },
      { date: '2024-04-23', text: 'Problem with selling on social media is it\'s a cesspit for projection.' },
      { date: '2022-10-18', text: 'What do I want my writing to do for me? Provide clarity on my thoughts. To connect with others and grow my tribe. To bring joy in growing my craft.' }
    ],
    connects: [
      { ch: 'Ch 65', num: '65', text: 'The five layers overview' },
      { ch: 'Ch 67', num: '67', text: 'Live: the next layer' },
      { ch: 'Ch 31', num: '31', text: 'One test changes everything' }
    ],
    beats: {
      scene: 'Week 1. Recording an Instagram story. Just my face. Just my voice. No filter, no joke, no Jackass mask. "Dating back to being called a gay rainbow I realised I was so scared of judgement that even uploading an Instagram story talking to the camera terrified me." Posted. Waited. The world didn\'t end.ieve. Three months of building this courage. The button is right there.',
      tension: 'For some people, posting online is nothing. For others it\'s the first time they\'ve ever shown the internet who they really are.',
      turn: 'The screen layer is the gateway. Once you\'ve been seen online and survived, every layer above it becomes slightly more possible.',
      land: 'Start here if: you\'ve never told the internet who you really are.',
      fiveC: {
        context: 'Layer one: being seen online.',
        catalyst: 'Post your face. Your name. Your opinion.',
        complication: 'For some this is trivial. For others it\'s the entire wall.',
        change: 'The screen layer is the gateway. Survive it and every layer above becomes possible.',
        consequence: 'Surviving layer one unlocks everything above it.'
      }
    }
  },

  // ------ Chapter 67 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '67',
    editorNote: 'EDITOR Q: 6 fear-layer chapters reads as a list. Your personal layer gets full chapter, others share?',
    title: 'Live',
    epigraph: 'Why does vulnerability create connection? 1) being vulnerable = feeling seen. 2) listening = feeling safe.',
    epigraphDate: '2024-10-01',
    description: 'The second layer: being seen in real time. No edits. No retakes. A video call. A conversation. A room of people looking at you.\n\nThis is where the Performer thrives and the Ghost disappears. Both are running from the same thing.',
    screenshotLine: null,
    imageConcept: 'A person on a video call, camera on, slightly uncomfortable, slightly alive.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 90,
    rawEntries: [
      { date: '2024-10-01', text: 'Why does vulnerability create connection? If connection = how safe you feel + how much you feel seen.' },
      { date: '2022-11-05', text: 'It\'s easy to come from a place of warmth when you\'re comfortable. It\'s doing it when you\'re vulnerable that\'s the real challenge.' },
      { date: '2024-11-06', text: 'We communicate to make people feel certain ways. Focus on the emotions, and see what words come out.' }
    ],
    connects: [
      { ch: 'Ch 66', num: '66', text: 'Screen: the layer below' },
      { ch: 'Ch 68', num: '68', text: 'Money: the next layer' },
      { ch: 'Ch 17', num: '17', text: 'The Ghost disappears here' }
    ],
    beats: {
      scene: 'Nick\'s Instagram Live. Ten interviews in ten days. I agreed to help a friend. Didn\'t know my 1,200 followers would be notified. High school acquaintances joining. Sporting peers. Alcohol-fuelled escapade friends. Nick probing about purpose, vulnerability, "finding your Zest." "I would have honestly preferred to walk naked down the busiest street in Sydney than have done this."s. Just me, in real time, with nowhere to hide.',
      tension: 'The Performer thrives here because they can control the room. The Ghost disappears because there\'s no escape. Both are running from the same thing: being seen as they really are.',
      turn: 'Live is the layer where curated versions of yourself can\'t survive. What comes out is closer to real. That\'s why it\'s terrifying.',
      land: 'Both are running from the same thing.',
      fiveC: {
        context: 'Layer two: real-time visibility.',
        catalyst: 'No edits. No retakes. A room of eyes.',
        complication: 'The Performer masks. The Ghost runs. Same fear.',
        change: 'Live is where curated versions can\'t survive. What comes out is closer to real.',
        consequence: 'Surviving live breaks the curated persona.'
      }
    }
  },

  // ------ Chapter 68 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '68',
    editorNote: 'EDITOR Q: 6 fear-layer chapters reads as a list. Your personal layer gets full chapter, others share?',
    title: 'Money',
    epigraph: 'In the past I think I\'ve created products to receive affiliation rather than cash. Need to shift.',
    epigraphDate: '2025-05-31',
    description: 'The third layer: asking for money. Quoting your price. Not discounting. Saying "this is what it costs" without apologising.\n\nThis layer isn\'t about money. It\'s about the question underneath: "Am I worth it?"',
    screenshotLine: null,
    imageConcept: 'A price tag with a number on it. No discount sticker. No "but."',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 90,
    rawEntries: [
      { date: '2025-05-31', text: 'In the past I think I\'ve created products to receive affiliation rather than cash. Need to shift.' },
      { date: '2024-08-07', text: 'To get paid you need to be remarkable. We\'re all unique so we\'re all remarkable. Never taught who we are so don\'t know our remarkableness.' },
      { date: '2024-08-12', text: 'Nervous system observations: there\'s a level of money it can handle. I\'m observing my inability to handle the headset cost.' }
    ],
    connects: [
      { ch: 'Ch 67', num: '67', text: 'Live: the layer below' },
      { ch: 'Ch 69', num: '69', text: 'Vulnerable: the next layer' },
      { ch: 'Ch 28', num: '28', text: 'Limiting Belief: "Am I worth it?"' }
    ],
    beats: {
      scene: 'First time quoting my real price. Not the discounted one. Not the "let\'s see what you can afford" one. The real one. My voice cracked.',
      tension: 'Money is the layer where self-worth becomes transactional. You\'re not just asking for money. You\'re putting a number on your value. And waiting for someone to agree or disagree.',
      turn: 'This layer isn\'t about money. It\'s about the question underneath: "Am I worth it?" Every time you discount, your nervous system records: I\'m worth less.',
      land: 'It\'s about the question underneath: "Am I worth it?"',
      fiveC: {
        context: 'Layer three: asking for money.',
        catalyst: 'Quote your price. Don\'t discount. Don\'t apologise.',
        complication: 'Every discount is your nervous system saying "I\'m worth less."',
        change: 'It\'s not about money. It\'s about the question underneath: "Am I worth it?"',
        consequence: 'The money layer is a self-worth diagnostic disguised as a transaction.'
      }
    }
  },

  // ------ Chapter 69 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '69',
    editorNote: 'EDITOR Q: 6 fear-layer chapters reads as a list. Your personal layer gets full chapter, others share?',
    title: 'Vulnerable',
    epigraph: 'Fear of non-authentic act can be rationalised away. Fear of authentic act can\'t.',
    epigraphDate: '2024-01-27',
    description: 'The fourth layer: being rejected for who you really are. Not your work. Not your product. You.\n\nSharing a failure. Admitting you don\'t know. Telling the real story instead of the polished one.\n\nThis is where most people stop forever.',
    screenshotLine: null,
    imageConcept: 'A person removing armour, piece by piece. Soft light underneath.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 90,
    rawEntries: [
      { date: '2023-09-28', text: 'We hide the parts we love the most because we love them so much we don\'t want them to be hurt.' },
      { date: '2025-06-05', text: 'Is a vulnerability hangover simply our body\'s reaction to trauma?' },
      { date: '2024-10-01', text: 'Being vulnerable = leads to them feeling seen. For people listening = leads to them feeling safe.' },
      { date: '2026-07-15', text: 'Instagram week 90 insight: "After 90 weeks it has dawned on me that doing these things that scare me hasn\'t been about overcoming fear like I first thought. It\'s been about stepping closer to love. Doing things we love is covered in fear because to love is vulnerable. To be rejected, judged or to fail is to feel the deepest pain."' }
    ],
    connects: [
      { ch: 'Ch 68', num: '68', text: 'Money: the layer below' },
      { ch: 'Ch 70', num: '70', text: 'Authority: the final layer' },
      { ch: 'Ch 38', num: '38', text: 'Essence vs Protective: sharing the real version' }
    ],
    beats: {
      scene: 'After the Instagram Live, I finally saw friends again. Braced for snide remarks. Instead: "A few friends were inspired by the way I\'ve put myself out there." To my shock, by putting myself out there I became more accepted than Jackass Nic ever was. My fear of social isolation was a facade. An irrational fear by prehistoric brain software. It wasn\'t a choice between isolation and authenticity. It was authenticity that ended the isolation.e. The one with the breakdown, the $30K on courses, the nights in Bali wondering if I\'d wasted my life.',
      tension: 'This layer is where most people stop forever. Because here, there\'s no product to hide behind. No skill to deflect with. Just you.',
      turn: 'Being rejected for a polished version of yourself is survivable. Being rejected for the real version feels like annihilation. That\'s why this layer is the wall.',
      land: 'This is where most people stop forever.',
      fiveC: {
        context: 'Layer four: being rejected for who you really are.',
        catalyst: 'Share the real story. The unpolished one.',
        complication: 'There\'s no product or skill to hide behind.',
        change: 'Being rejected for the real version feels like annihilation. That\'s the wall.',
        consequence: 'The wall where most people stop. For life.'
      }
    }
  },

  // ------ Chapter 70 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '70',
    editorNote: 'EDITOR Q: 6 fear-layer chapters reads as a list. Your personal layer gets full chapter, others share?',
    title: 'Authority',
    epigraph: 'What would you do if you completed your purpose? Whenever I look forward and think about these things I become rattled & draw blank.',
    epigraphDate: '2025-06-05',
    description: 'The fifth layer: claiming expertise. Saying "I know this." Positioning yourself as someone worth listening to.\n\nEvery imposter syndrome lives here. The fear isn\'t that you\'ll be exposed as a fraud. The fear is that you\'ll be seen as who you actually are, and it won\'t be enough.',
    screenshotLine: null,
    imageConcept: 'A podium. A person stepping up to it. Name plate blank, waiting to be filled in.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 90,
    rawEntries: [
      { date: '2025-06-05', text: 'What would you do if you completed your purpose? Whenever I look forward and think about these things I become rattled & draw blank. Need to place deep thought into it.' },
      { date: '2024-06-21', text: 'Difference between me and most: I have ambitions to change a system.' },
      { date: '2022-11-07', text: 'Life\'s work realisation: I will develop a craft / skill. Once I have mastered, I will attract people who need the answer.' }
    ],
    connects: [
      { ch: 'Ch 69', num: '69', text: 'Vulnerable: the layer below' },
      { ch: 'Ch 65', num: '65', text: 'The five layers overview' },
      { ch: 'Ch 28', num: '28', text: 'Limiting Belief: "Who am I to do this?"' }
    ],
    beats: {
      scene: 'Running a workshop. Afterwards, someone described me as "teaching the teacher." My first instinct: deflect. "I\'m not a teacher. I\'m just figuring this out." But I was teaching. And the people in the room saw it before I did. Claiming authority isn\'t arrogance. It\'s letting other people\'s evidence override your protective voice.hem. "I\'m not an expert, I just..." The imposter syndrome in real time.',
      tension: 'Every imposter syndrome lives at the authority layer. The fear isn\'t about being exposed. It\'s about being seen as yourself, and that not being enough.',
      turn: 'Claiming authority isn\'t about being the best. It\'s about being honest about what you know and being willing to be seen knowing it.',
      land: 'The fear is that you\'ll be seen as who you actually are, and it won\'t be enough.',
      fiveC: {
        context: 'Layer five: claiming expertise.',
        catalyst: 'Saying "I know this" without qualification.',
        complication: 'Every imposter syndrome lives here.',
        change: 'Claiming authority isn\'t arrogance. It\'s honesty about what you know.',
        consequence: 'The fear isn\'t fraud exposure. It\'s being seen as yourself and not being enough.'
      }
    }
  },

  // ------ Chapter 71 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '71',
    title: '3% Better',
    epigraph: 'Our being is in a state of constant movement. Either atrophy or growth.',
    epigraphDate: '2024-07-06',
    description: 'You don\'t need to be twice as brave tomorrow. You need to be 3% braver.\n\n3% compounds. In 24 iterations, you\'ve doubled. Not by forcing transformation. By making the groan slightly more survivable each time.',
    screenshotLine: null,
    imageConcept: 'A tiny upward line on a graph. Barely visible at first. Exponential by the end.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 85,
    rawEntries: [
      { date: '2024-07-06', text: 'Our being is in a state of constant movement. Either atrophy or growth. I realise I\'m highly driven for that movement to be growth.' },
      { date: '2025-03-25', text: 'Life map spectrum: what I\'m beginning to see is my understanding of spectrum of possibilities, combining with probabilities of possibilities, combining with systems that lead to certain outcomes.' },
      { date: '2024-06-23', text: 'Self-actualisation keeps moving with your growth.' }
    ],
    connects: [
      { ch: 'Ch 64', num: '64', text: 'The Groan: the threshold to push 3% past' },
      { ch: 'Ch 72', num: '72', text: 'The Proof: evidence of the 3%' },
      { ch: 'Ch 29', num: '29', text: 'The Diagonal: growing through evidence' }
    ],
    beats: {
      scene: 'Week 1: Instagram story. Week 4: silent disco at Bondi. Week 8: moved to Bali. Week 9: rainbow returned. Week 12: piercings and nail art. Week 18: quit the VC job. Week 20: Opera House solo disco. Each one 3% scarier than the last. Not a revolution. A compound curve.last week\'s. Not dramatically. Just slightly. The body barely notices the increment.',
      tension: '3% feels like nothing. That\'s the point. The nervous system doesn\'t resist what it can\'t detect. By the time it notices, you\'ve doubled.',
      turn: '3% compounds. In 24 iterations, you\'ve doubled. Not transformation. Compounding. The most powerful force in the universe applied to courage.',
      land: '3% compounds. In 24 iterations, you\'ve doubled.',
      fiveC: {
        context: 'The groan needs to be slightly more survivable each time.',
        catalyst: '3% braver per iteration.',
        complication: 'It feels like nothing is happening.',
        change: 'Compounding applied to courage. The body barely notices the increment.',
        consequence: '24 iterations: doubled. Compounding applied to courage.'
      }
    }
  },

  // ------ Chapter 72 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '72',
    title: 'The Proof',
    epigraph: 'Number 1 source of all fears: Our worth is dependent on our actions. Accept fear, 9 seconds, then move through.',
    epigraphDate: '2024-08-17',
    description: 'After every groan, capture proof. A screenshot. A link. A sentence. Something that says "I did this."\n\nNot for anyone else. For your nervous system. Evidence that the thing it was protecting you from didn\'t kill you.',
    screenshotLine: null,
    imageConcept: 'A wall of small photos. Each one a moment of someone doing something scary. None of them polished.',
    branch: 'Body keeps the score',
    branchColor: '#ef4444',
    confidence: 85,
    rawEntries: [
      { date: '2024-08-17', text: 'Number 1 source of all fears: Our worth is dependent on our actions. Accept fear, 9 seconds, then move through. Body is a vessel of beliefs.' },
      { date: '2024-01-27', text: 'Fear of non-authentic act can be rationalised away. Fear of authentic act can\'t.' },
      { date: '2025-02-20', text: 'Seeing my quarter-life crisis as a belief breaking event that changed my thoughts + habits and changed my life.' },
      { date: '2026-07-12', text: 'Hero Stage 11: Resurrection. The courage challenge isn\'t skill practice. It\'s proof of transformation. "Prove you\'re a different person in front of witnesses." The proof isn\'t for your resume. It\'s for your nervous system. And it\'s for the people watching, who now know it\'s possible.' }
    ],
    connects: [
      { ch: 'Ch 71', num: '71', text: '3% Better: the increment to capture' },
      { ch: 'Ch 31', num: '31', text: 'One test changes everything: the proof principle' },
      { ch: 'Ch 73', num: '73', text: 'What actually changed: the proof accumulated' }
    ],
    beats: {
      scene: 'A wall in my room in Bali. Covered in screenshots, photos, and sentences. "Did the open mic." "Posted my face." "Quoted my real price." None of them polished. All of them proof.',
      tension: 'The nervous system doesn\'t update from affirmations. It updates from evidence. You need to show it that the thing it feared didn\'t kill you.',
      turn: 'Capture proof. Not for Instagram. For your nervous system. Every screenshot is a data point that says: I survived.',
      land: 'Evidence that the thing it was protecting you from didn\'t kill you.',
      fiveC: {
        context: 'After every groan: capture evidence.',
        catalyst: 'A screenshot. A link. A sentence. "I did this."',
        complication: 'Not for anyone else. For your nervous system.',
        change: 'Each screenshot tells your body: I survived. The belief updates.',
        consequence: 'Evidence accumulates. The dome expands. The body updates.'
      }
    }
  },

  // ------ Chapter 73 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '73',
    title: 'What Actually Changed',
    epigraph: 'Importance of changing environment to overcome conditioning. Without it, it\'s like fish not observing they\'re in water.',
    epigraphDate: '2024-12-07',
    description: 'Here\'s what didn\'t change: the opportunities. The jobs existed before. The ideas existed before. The people existed before.\n\nHere\'s what changed: what my nervous system felt safe doing.\n\nSame world. Bigger dome.',
    screenshotLine: 'Same world. Bigger dome.',
    imageConcept: 'Same scene from Chapter 62 (dome), but the dome is three times wider. Same person. More room.',
    branch: 'Safety is the foundation',
    branchColor: '#f87171',
    confidence: 90,
    rawEntries: [
      { date: '2024-12-07', text: 'Importance of changing environment to overcome conditioning. Without it, it\'s like fish not observing they\'re in water.' },
      { date: '2024-02-24', text: 'Our environment has the ultimate power over our thoughts/conditioning/behaviour. It\'s only me being outside of Sydney, in an environment that celebrates different things, that I observed my own changes.' },
      { date: '2025-05-18', text: 'If your ambitions feel safe and those ambitions are what you love then you actually don\'t need habits because you\'ll make time to do the things you love.' }
    ],
    connects: [
      { ch: 'Ch 62', num: '62', text: 'The dome: before' },
      { ch: 'Ch 63', num: '63', text: 'Expanding the dome: the method' },
      { ch: 'Ch 77', num: '77', text: 'Silent discos: what the bigger dome produced' }
    ],
    beats: {
      scene: 'Looking at my life a year later. Same world. Same Sydney. Same friends. But rainbow clothes, ear piercings, finger nail cartoons, living in Bali, running silent discos on beaches, quit the VC job, dancing at the Opera House. Same world. Same person underneath. The only thing that changed: what my nervous system felt safe doing.t the dome was three times wider. I could reach things I couldn\'t even see before.',
      tension: 'We think we need to change the world to change our results. We don\'t. We need to change the dome.',
      turn: 'Nothing external changed. Everything internal did. Same world. Bigger dome. That\'s the whole transformation.',
      land: 'Same world. Bigger dome.',
      fiveC: {
        context: 'Before and after the scary things.',
        catalyst: 'What didn\'t change: opportunities, ideas, people.',
        complication: 'What changed: what the nervous system felt safe doing.',
        change: 'Same world. Bigger dome.',
        consequence: 'The transformation isn\'t external. It\'s the dome expanding.'
      }
    }
  },

  // ------ Chapter 74 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '74',
    title: 'The Diagonal',
    epigraph: 'Manifestation = aligning frequency. Align frequency = habits + safety + visualise.',
    epigraphDate: '2025-03-19',
    description: 'The destination isn\'t "healed." It isn\'t "successful." It isn\'t "rich" or "free" or "happy."\n\nThe destination is the diagonal. Action proportional to self-knowledge. Building from essence. Moving at the speed of what you actually know about yourself. No faster. No slower.',
    screenshotLine: null,
    imageConcept: 'The Sprouter Sweet Spot graph. A dotted line running diagonally. A single figure walking along it.',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 45,
    rawEntries: [
      { date: '2025-03-19', text: 'Manifestation = aligning frequency. Align frequency = habits + safety + visualise (mind doesn\'t know difference between reality + thought).' },
      { date: '2024-06-23', text: 'Self-actualisation keeps moving with your growth.' },
      { date: '2025-03-09', text: 'Make decisions based on future self. Decisions grounded in values / methodology / habits.' },
      { date: '2026-07-13', text: 'When you find your flow you no longer compare yourself to others. Because your flow is unique to you. Your combination of curiosities, wounds, skills, and people is un-replicable. Comparison dies on the diagonal because there\'s nobody walking the same path. The thing that used to torture you (why am I not as far as them?) dissolves because "as far as them" doesn\'t apply to a path only you can walk.' },
      { date: '2026-07-15', text: 'Leaving the matrix isn\'t quitting your job. It\'s changing your beliefs. I left one matrix for another and once I climbed to the top of that mountain I felt the same. Nomads travel as a form of escape. The constant change keeps them stimulated without addressing what makes them fear being stationary. The diagonal isn\'t a location. It\'s an operating system. You can walk it in a corporate job or on a beach in Bali. The question isn\'t where you are. It\'s which beliefs are running.' },
      { date: '2025-09-10', text: 'Instagram carousel "Escape the Matrix": The matrix isn\'t your job. It\'s the voice that fears what others think, compares you to others, is scared to take action. The matrix is ENCODED BELIEFS: success = status, happiness = future, worth = outcomes, emotions = unsafe, vulnerability = painful, safety = sameness. There\'s just as many people struggling in Bali who allegedly "escaped" as there are happy people still allegedly "trapped." Escaping means: question the beliefs you inherited, release the ones that aren\'t yours, rewire your system to feel safe being fully expressed. It\'s not about rebellion. It\'s about remembrance.' }
    ],
    connects: [
      { ch: 'Ch 29', num: '29', text: 'The diagonal on the Belief Graph' },
      { ch: 'Ch 37', num: '37', text: 'The Intersection: your unique combination' },
      { ch: 'Ch 76', num: '76', text: 'Not Hustle: what the diagonal is not' },
      { ch: 'Ch 80', num: '80', text: 'You\'re somewhere in this story' }
    ],
    beats: {
      scene: 'Walking the diagonal. Not a dramatic moment. A Tuesday. Taking action that matches what I know about myself. No more. No less. Proportional.',
      tension: 'The destination isn\'t an end state. It\'s a way of moving. And the temptation is always to sprint ahead (hustle) or fall behind (heal forever).',
      turn: 'Action proportional to self-knowledge. That\'s the diagonal. That\'s self-actualisation. Not a finish line. A way of walking.',
      land: 'Moving at the speed of what you actually know about yourself. No faster. No slower.',
      fiveC: {
        context: 'The destination of the entire book.',
        catalyst: 'Not healed. Not successful. Not rich. The diagonal.',
        complication: 'The temptation to sprint ahead or fall behind.',
        change: 'Action proportional to self-knowledge. A way of walking, not a finish line.',
        consequence: 'Action proportional to self-knowledge. Building from essence.'
      }
    }
  },

  // ------ Chapter 75 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '75',
    title: 'Essence Louder Than Protection',
    epigraph: 'How I feel myself softening and opening up. Opening myself up to dreaming again. Opening myself up to expressing.',
    epigraphDate: '2024-12-07',
    description: 'You will never fully silence the protective voice. It will always be there. It was installed too well and too early.\n\nBut you can make your essence louder. Loud enough that when both voices speak, you know which one is yours.\n\nThat\'s the whole game.',
    screenshotLine: 'That\'s the whole game.',
    imageConcept: 'Two speakers. The Essence one is clearly, visibly louder. The person is smiling.',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 90,
    rawEntries: [
      { date: '2024-12-07', text: 'How I feel myself softening and opening up. Opening myself up to romantic love. Opening myself up to dreaming again. Opening myself up to expressing. Opening myself up to feeling good.' },
      { date: '2024-09-16', text: 'Return to love is the ultimate role of "healing."' },
      { date: '2025-02-22', text: 'By showing up from a place of love you "manifest" a path of love.' }
    ],
    connects: [
      { ch: 'Ch 38', num: '38', text: 'Essence vs Protective: learning the distinction' },
      { ch: 'Ch 6', num: '06', text: 'Essence: the voice getting louder' },
      { ch: 'Ch 79', num: '79', text: 'The one sentence revisited' }
    ],
    beats: {
      scene: 'Both voices still there. Both still speaking. But now I can tell them apart. And the essence is louder. Not because I silenced the protector. Because I turned up the essence.',
      tension: 'The protective voice will never fully go away. It was installed too well and too early. Anyone who tells you otherwise is selling something.',
      turn: 'You don\'t need silence. You need volume. Make the essence loud enough that when both speak, you know which one is yours.',
      land: 'That\'s the whole game.',
      fiveC: {
        context: 'The protective voice will never fully disappear.',
        catalyst: 'But you can make the essence louder.',
        complication: 'Both voices will always speak. The question is which one you follow.',
        change: 'You don\'t need silence. You need volume. Turn up the essence.',
        consequence: 'That\'s the whole game. Essence louder than protection.'
      }
    }
  },

  // ------ Chapter 76 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '76',
    title: 'Not Hustle',
    epigraph: 'Redefine "hardwork" to following the flow.',
    epigraphDate: '2024-03-10',
    description: 'The diagonal is not hustle. Hustle is the Performer on the Y-axis, action without self-knowledge, building faster in the wrong direction.\n\nThe diagonal is proportional. You move at the speed of what you know. When you learn something new about yourself, your action adjusts. When you take action, your self-knowledge deepens.\n\nThey move together. That\'s alignment.',
    screenshotLine: null,
    imageConcept: 'Two feet walking in sync. Left foot labelled "Know." Right foot labelled "Move."',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 60,
    rawEntries: [
      { date: '2024-03-10', text: 'Design my days based on energy available, not time available. Rest is part of my job. When I show up as Zestful Nic I attract opportunities. Redefine "hardwork" to following the flow.' },
      { date: '2025-05-18', text: 'Also habits feel forced. Feeling safe and allowing your love to guide is flow.' },
      { date: '2025-01-26', text: 'As information becomes free, the parity of decision making is lowered. Impact of decision becomes more impacted by flow than knowledge.' }
    ],
    connects: [
      { ch: 'Ch 74', num: '74', text: 'The diagonal: what it is' },
      { ch: 'Ch 27', num: '27', text: 'Hubris: hustle\'s origin' },
      { ch: 'Ch 16', num: '16', text: 'The Controller: the hustler archetype' }
    ],
    beats: {
      scene: 'Watching my old self. Investible. Twelve-hour days. Taking on every project. "Crush it." Five years of sprinting in the wrong direction and calling it discipline. The speed felt like progress. It wasn\'t. It was the Performer on the Y-axis. Action without self-knowledge. Building faster, not better.." "Grind." And recognising the Performer in their eyes. Building fast. In the wrong direction.',
      tension: 'Hustle culture tells you the problem is speed. The diagonal tells you the problem is direction. Moving fast without self-knowledge is the Performer on steroids.',
      turn: 'The diagonal is not hustle. Know and Move in sync. Left foot. Right foot. Neither faster than the other.',
      land: 'They move together. That\'s alignment.',
      fiveC: {
        context: 'Hustle looks like progress. It\'s often the Performer.',
        catalyst: 'The diagonal is proportional: action matches self-knowledge.',
        complication: 'Culture rewards speed. The diagonal rewards alignment.',
        change: 'Know and Move in sync. Left foot, right foot. Neither faster than the other.',
        consequence: 'Know and Move. In sync. That\'s the whole thing.'
      }
    }
  },

  // ------ Chapter 77 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '77',
    title: 'Silent Discos',
    epigraph: 'External flow aligns with capitalistic opportunities which aligns with growing the edges of consciousness. Is Disco\'s what flowed for me because it\'s what put me in the highest frequency state?',
    epigraphDate: '2025-03-12',
    description: 'Within six months of the first scary thing, I was funding my life hosting silent discos on beaches in Southeast Asia.\n\nI didn\'t plan this. I didn\'t have a strategy. I did the things that scared and excited me, and doors opened that I didn\'t know existed.\n\nThat\'s what happens when you move from essence. The path reveals itself one step at a time.',
    screenshotLine: null,
    imageConcept: 'A beach at sunset. People wearing headphones, dancing. One person in the middle with their arms up.',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 55,
    rawEntries: [
      { date: '2025-01-18', text: 'I never understand quotes like "do what sets your heart on fire" until I came across disco\'s.' },
      { date: '2025-03-12', text: 'External flow aligns with capitalistic opportunities which aligns with growing the edges of consciousness. Is Disco\'s what flowed for me because it\'s what put me in the highest frequency state?' },
      { date: '2024-06-28', text: 'Game shop owner image: always knew I loved games. How it manifested is crazy.' },
      { date: '2026-07-09', text: 'Dance events + travel games + tuk tuk tournaments + experience creation. These look like separate careers. But they share the same skill (creating group experiences that shift state), the same audience (people who want to feel alive), and the same rule break (experiences don\'t need alcohol or stages to be remarkable). The convergence IS the thing nobody else can create.' }
    ],
    connects: [
      { ch: 'Ch 53', num: '53', text: 'One scary thing a week: the origin' },
      { ch: 'Ch 37', num: '37', text: 'The Intersection: where multiple curiosities merge' },
      { ch: 'Ch 78', num: '78', text: 'The path reveals itself' },
      { ch: 'Ch 39', num: '39', text: 'Essence voice: scared AND excited' }
    ],
    beats: {
      scene: 'A beach in Southeast Asia. Sunset. A hundred people wearing headphones, dancing. Me in the middle, arms up. Six months ago I was sitting in an office in Sydney. I didn\'t plan any of this.',
      tension: 'There was no strategy. No business plan. No five-year vision. Just: follow the thing that scares and excites you. And here I am.',
      turn: 'That\'s what happens when you move from essence. The path doesn\'t reveal itself all at once. It reveals itself one step at a time. But only to the person who\'s moving.',
      land: 'I did the things that scared and excited me, and doors opened that I didn\'t know existed.',
      fiveC: {
        context: 'Six months after the first scary thing.',
        catalyst: 'Funding life hosting silent discos on beaches.',
        complication: 'No plan. No strategy. Just following essence.',
        change: 'Doors opened that I didn\'t know existed.',
        consequence: 'The proof of the entire thesis: move from essence, the path appears.'
      }
    }
  },

  // ------ Chapter 78 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '78',
    title: 'The Path Reveals Itself',
    epigraph: 'Life map spectrum: each path consists of another spectrum. Combining probabilities with systems that lead to certain outcomes.',
    epigraphDate: '2025-03-25',
    description: 'You will never see the whole path from Head Full of Dreams. That\'s the trap. You think you need the complete plan before you can move.\n\nYou don\'t. You need the next step. And the next step is always: the thing that scares and excites you most right now.',
    screenshotLine: null,
    imageConcept: 'A path in fog. Only the next three steps are visible. They\'re lit.',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 80,
    rawEntries: [
      { date: '2024-06-24', text: 'Secret is aligning what makes you enter flow state with the external environment that is flowing.' },
      { date: '2023-09-03', text: 'If life flows then the universe has influence over the order. What is it to completely flow? Destiny?' },
      { date: '2025-03-25', text: 'What I\'m beginning to see is my understanding of spectrum of possibilities, combining with probabilities, combining with systems that lead to certain outcomes.' },
      { date: '2026-07-10', text: 'The curiosities you pursue now may merge later in ways you can\'t predict. Dance events + travel games + experience design looked like three separate interests. They converged into something nobody else could create. The convergence IS finding your flow. You can\'t see the merge point until both branches are inside your cone of safety.' },
      { date: '2026-07-10', text: 'Purpose emerges FROM experiences, not before them. You don\'t find purpose and then act. You act and purpose reveals itself through the experiences that light you up most. The path doesn\'t reveal a destination. It reveals a direction. And the direction keeps adjusting as you move.' },
      { date: '2026-07-13', text: 'We\'re living in the first era where the path is actually possible for everyone. Kevin Kelly\'s 1000 true fans used to require a team, a publisher, a distribution network. Now: the internet gives you the audience (infinite reach, no gatekeepers). AI gives you the capability (one person can do what used to take ten). What was previously limited supply, limited time, limited reach is now near-infinite. The only bottleneck left is you. Your cone of safety. Your willingness to pursue the curiosity. The tools are ready. The question is: are you?' }
    ],
    connects: [
      { ch: 'Ch 77', num: '77', text: 'Silent discos: proof the path reveals itself' },
      { ch: 'Ch 25', num: '25', text: 'Head Full of Dreams: the trap of needing the whole map' },
      { ch: 'Ch 37', num: '37', text: 'The Intersection: where curiosities converge' },
      { ch: 'Ch 55', num: '55', text: 'Essence Zone: the compass for each step' },
      { ch: 'Ch 7', num: '07', text: 'Direction: purpose from experiences, not before them' }
    ],
    beats: {
      scene: 'A path in fog. Three steps visible. Lit. The rest: invisible. And the realisation that every step I\'ve taken so far was taken with the same visibility. Three steps. Never more.',
      tension: 'Head Full of Dreams tells you that you need the whole map. You don\'t. You\'ve never had it. And you\'ve still arrived here.',
      turn: 'You need the next step. The next step is always: the thing that scares and excites you most right now. That\'s the only compass you need.',
      land: 'The next step is always: the thing that scares and excites you most right now.',
      fiveC: {
        context: 'You\'ll never see the whole path.',
        catalyst: 'You think you need the complete plan. You don\'t.',
        complication: 'Head Full of Dreams is the trap of needing the map before moving.',
        change: 'You only need the next step. The path reveals itself to the person who\'s moving.',
        consequence: 'The next step is always the same: the thing that scares and excites you most right now.'
      }
    }
  },

  // ------ Chapter 79 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '79',
    title: 'The One Sentence, Revisited',
    epigraph: 'Opening myself up to dreaming again. Opening myself up to expressing. Opening myself up to feeling good.',
    epigraphDate: '2024-12-07',
    description: 'Part 1 ended with: "I am [Essence]. [What happened] installed [Protection]. Now [Protection] is running my life instead of [Essence]."\n\nPart 3 ends with a different sentence:\n\n"I am [Essence]. [Protection] is still here. But I can hear my own voice now. And I\'m moving."',
    screenshotLine: null,
    imageConcept: 'The same wall from Chapter 20. The first sentence is still there. A second one is written below it, in bolder handwriting.',
    branch: 'Our essence is love',
    branchColor: '#f472b6',
    confidence: 85,
    rawEntries: [
      { date: '2025-03-09', text: 'It feels like my intuition has always been guiding me to my truth. I\'ve never known what connected all the parts. But I\'ve just trusted. But now with Vibe Rise it feels like everything is now interconnected. And my intuition has been like a sculptor, chipping away, until now the masterpiece that\'s always been inside has revealed itself.' },
      { date: '2024-12-07', text: 'How I feel myself softening and opening up. Opening myself up to dreaming again. Opening myself up to expressing.' },
      { date: '2024-09-16', text: 'Seek moments you love. Stack enough moments you love together and you live a life you love.' }
    ],
    connects: [
      { ch: 'Ch 20', num: '20', text: 'The One Sentence: Part 1 version' },
      { ch: 'Ch 75', num: '75', text: 'Essence louder than protection' },
      { ch: 'Ch 80', num: '80', text: 'You\'re somewhere in this story' }
    ],
    beats: {
      scene: 'The same wall from Chapter 20. The first sentence still there. Below it, in bolder handwriting: "I am a Playful Creator. The Performer is still here. But I can hear my own voice now. And I\'m moving."',
      tension: 'Part 1\'s sentence was about seeing the problem. Part 3\'s sentence is about having moved through it. The protection didn\'t disappear. But the essence got louder.',
      turn: 'The transformation isn\'t from broken to fixed. It\'s from first sentence to second sentence. Same wall. Different handwriting. Bolder.',
      land: '"I am [Essence]. [Protection] is still here. But I can hear my own voice now. And I\'m moving."',
      fiveC: {
        context: 'Part 1 ended with one sentence. Part 3 ends with another.',
        catalyst: 'The first sentence named the problem. The second names the progress.',
        complication: 'The protection didn\'t disappear. It never will.',
        change: 'But the essence is louder. And you\'re moving.',
        consequence: 'Two sentences. One wall. The entire journey between them.'
      }
    }
  },

  // ------ Chapter 80 ------
  {
    type: 'chapter',
    section: 'diagonal',
    number: '80',
    title: 'You\'re Somewhere in This Story',
    epigraph: 'Humans are vessels for experiences.',
    epigraphDate: '2025-01-12',
    description: 'You\'re in the crack, and the ground is still shaking. Or you\'re in the flood, drowning in clarity you can\'t use. Or you\'re on the diagonal, one groan at a time, making your essence louder than the voice that was installed.\n\nWherever you are, you\'re in the right place. The story is one story. And it moves forward.\n\nYour personal journey of breaking through your installation is the same pattern that drives all of human innovation. Every innovation in history is someone who challenged an inherited assumption that everyone else accepted. That\'s what you\'re doing. Breaking through software that was installed. You\'re not just finding yourself. You\'re participating in the oldest mechanism of human progress.',
    screenshotLine: null,
    imageConcept: 'The Sprouter graph one more time. Three dots on it, each in a different position. All on the same page. All part of the same journey. Behind the graph, faintly visible, a tree with branches spreading outward — the same pattern at a larger scale.',
    branch: 'FLAGGED',
    branchColor: '#666',
    confidence: 50,
    rawEntries: [
      { date: '2025-01-12', text: 'Humans are vessels for experiences.' },
      { date: '2022-10-06', text: 'Life is simply experiencing experiences. Our brain, eyes and body is the tool we\'ve been given to experience it. Emotions are signals about the experiences we do and don\'t want to have.' },
      { date: '2025-02-20', text: 'Mission: Make people high on life. How? By raising their frequency. How? Experiences that put them in that state + rewire their subconscious.' },
      { date: '2024-09-16', text: 'Seek moments you love. Stack enough moments you love together and you live a life you love.' },
      { date: '2026-06-27', text: 'My why: It\'s not that I don\'t want anyone to feel the pain I did. It\'s when they do, they have a place that gives them inspiration, hope, safety, when they do.', protoIp: 'Mission reframe' },
      { date: '2026-06-27', text: 'Every innovation in human history is a rule break — someone challenged an inherited assumption everyone else accepted and built something new on the other side. Your personal rule break follows the same pattern: essence → installation → break through → flow. Same mechanism, different scale.', protoIp: 'Rule Break Tree connection' },
      { date: '2026-06-28', text: 'The tree doesn\'t just grow. It breathes. Expand (industries grow outward) → Break (biology can\'t keep up) → Repair (loop back to what the vessel needs) → Expand again. Your personal journey follows the same rhythm: you expanded (The Promise), you broke (The Crack), you\'re repairing (The Diagonal). The repaired vessel can handle more experience.', protoIp: 'The Breathing Tree / Phase 3 loop-back' },
      { date: '2026-07-12', text: 'Hero Stage 12: Your First Graduate. Someone else transforms because of you. Not just "I helped" but "their life shifted because I showed up as my Flow." The cycle completes. The elixir leaves your hands. The story doesn\'t end with finding your flow. It ends when someone else finds theirs because of you.' }
    ],
    connects: [
      { ch: 'Ch 1', num: '01', text: 'The Promise: where the story begins (Phase 1: expand)' },
      { ch: 'Ch 2', num: '02', text: 'The Earthquake: where it broke (Phase 2: deviation peak)' },
      { ch: 'Ch 20', num: '20', text: 'The One Sentence: Part 1\'s milestone' },
      { ch: 'Ch 35', num: '35', text: 'Your Wound Is Your Credential: the personal rule break' },
      { ch: 'Ch 74', num: '74', text: 'The Diagonal: Phase 3 repair in action' },
      { ch: 'Ch 79', num: '79', text: 'The One Sentence Revisited: Part 3\'s milestone' }
    ],
    beats: {
      scene: 'The Sprouter graph one final time. Three dots. One in the crack, ground still shaking. One in the flood, drowning in clarity. One on the diagonal, moving. Behind the graph, faintly, a tree with branches spreading. The tree is breathing.',
      tension: 'Wherever you are, the voice in your head is telling you you\'re behind. You\'re not. The story is one story. It moves forward. Always.',
      turn: 'Your journey follows the same rhythm as all of human progress. You expanded (the promise). You broke (the crack). You\'re repairing (the diagonal). The tree doesn\'t just grow. It breathes. And so do you.',
      land: 'You\'re not just finding yourself. You\'re participating in the oldest rhythm of human progress. The story is one story. And it moves forward.',
      fiveC: {
        context: 'The final chapter. The reader meets themselves.',
        catalyst: 'Three positions: crack, flood, diagonal. All valid.',
        complication: 'The voice says you\'re behind. You\'re not.',
        change: 'Zoom out: your personal journey follows the same breathing rhythm as all innovation. Expand → break → repair → expand again. You\'re in the repair phase. The repaired vessel can handle more.',
        consequence: 'You\'re not just finding yourself. You\'re part of the oldest rhythm of human progress. The tree breathes. So do you. Find your flow.'
      }
    }
  }
];
