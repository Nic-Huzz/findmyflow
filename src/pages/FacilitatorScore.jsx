/**
 * FacilitatorScore.jsx — /try/facilitator-score AND /create/scale-diagnostic
 * Scale Score v2: 3-pillar Phase 3 diagnostic (RETURN · BREAK · TRIBAL).
 *
 * Public: Intro → Branch → RETURN (2Q) → TRIBAL (2Q) → BREAK (2Q) → Email → Results
 * Logged-in (report card): Intro → Single-page report card (read-only, links to source flows) → Results
 *
 * 3 Pillars:
 *   RETURN — Does it align with 100K-year-old biology? (Ancestral + Body)
 *   BREAK  — Does it create results in unexpected ways? (Format + Rule Break)
 *   TRIBAL — Does it create a tribe? (Identity + Shareability)
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useBranchScoring } from '../hooks/useBranchScoring'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import '../flows/ScaleDiagnosticFlow.css'

const STEPS = {
  INTRO: 'intro',
  REPORT: 'report',
  BRANCH: 'branch',
  RETURN: 'return',
  TRIBAL: 'tribal',
  BREAK: 'break',
  EMAIL: 'email',
  RESULTS: 'results',
}

// ── Branch data ──
const BRANCHES = [
  { key: 'movement',    label: 'Movement',    icon: '\u{1F3C3}', desc: 'Fitness, dance, cold exposure, physical challenge', creators: 21 },
  { key: 'nourishment', label: 'Nourishment', icon: '\u{1F37D}\uFE0F', desc: 'Food, cooking, fasting, nutrition', creators: 1 },
  { key: 'tools',       label: 'Tools/Tech',  icon: '\u{1F6E0}\uFE0F', desc: 'Skills, education, problem-solving, AI', creators: 3 },
  { key: 'status',      label: 'Status',      icon: '\u2728', desc: 'Identity, craft, reputation, self-expression', creators: 3 },
  { key: 'bonds',       label: 'Bonds',       icon: '\u{1F91D}', desc: 'Relationships, community, gathering, friendship', creators: 10 },
  { key: 'shelter',     label: 'Shelter',     icon: '\u{1F3E0}', desc: 'Space design, environments, co-living', creators: 1 },
  { key: 'story',       label: 'Story',       icon: '\u{1F4D6}', desc: 'Narrative, storytelling, live content, media', creators: 8 },
  { key: 'fire',        label: 'Fire/Energy', icon: '\u{1F525}', desc: 'Ceremony, lighting, ritual, frequency', creators: 1 },
  { key: 'healing',     label: 'Healing',     icon: '\u{1F49C}', desc: 'Therapy, breathwork, somatic, plant medicine', creators: 30 },
  { key: 'threat',      label: 'Threat',      icon: '\u2694\uFE0F', desc: 'Courage, fear-facing, resilience, safety', creators: 0 },
]

// ── Branch-specific examples for each question ──
const BRANCH_EXAMPLES = {
  movement: {
    ancestral: ['fitness apps, online PT', 'gym classes with some bodyweight', 'running, swimming, martial arts', 'CrossFit, obstacle races, cold plunge', 'barefoot running, wrestling, group hunts'],
    body: ['exercise theory videos', 'light stretching, warm-up drills', 'a tough workout, HIIT class', 'cold plunge, intense bootcamp, altitude training', 'multi-day endurance challenge, extreme cold exposure'],
    identity: ['a drop-in class', 'a memorable PT session', '"I did a Tough Mudder once"', '"I\'m a CrossFitter," "I do cold plunge every morning"', '"I\'m an ultra-runner," "I\'m a martial artist"'],
    format: ['studio class, Zoom workout', 'outdoor instead of indoor', 'yoga + live DJ, fitness + silent disco', 'headset-guided training, gamified challenges', 'sober dance party at sunrise, wilderness bootcamp'],
    rulebreak: ['standard fitness results', 'slightly faster progress', 'surprising body composition changes', '"wait, you healed your back doing THAT?"', 'results doctors say shouldn\'t be possible'],
  },
  healing: {
    ancestral: ['therapy apps, online counseling', 'guided meditation apps, journaling prompts', 'breathwork, sound healing, group circles', 'sweat lodges, plant medicine ceremony, fasting retreats', 'sitting in silence, grief rituals, laying on of hands'],
    body: ['talk therapy, a lecture', 'guided visualization, gentle meditation', 'sound bath, yin yoga, reiki', 'intense breathwork, cold exposure, somatic release', 'multi-day silent retreat, ayahuasca, extended fasting'],
    identity: ['a therapy session', 'a workshop they remember', '"I did a breathwork session once"', '"I\'m a breather," "I do plant medicine"', '"I\'m a healer," "I hold space"'],
    format: ['therapy room, Zoom session', 'outdoor sessions, walking therapy', 'breathwork + live music, therapy + nature', 'headset breathwork journeys, therapy via podcast', 'ceremony in a museum, healing at a music festival'],
    rulebreak: ['expected healing outcomes', 'faster recovery than usual', 'emotional breakthroughs people talk about', '"wait, one session did THAT?"', 'results that challenge what medicine says is possible'],
  },
  bonds: {
    ancestral: ['networking apps, LinkedIn events', 'team-building workshops', 'group dinners, community circles', 'men\'s/women\'s circles, fireside gatherings', 'tribal councils, communal feasts, rites of passage'],
    body: ['a networking event', 'a workshop with some movement', 'group activities, partner exercises', 'deep sharing circles, trust falls, vulnerability challenges', 'multi-day immersion, sleeping rough together, physical ordeals'],
    identity: ['a meetup', 'a memorable dinner party', '"I\'m part of a men\'s group"', '"I\'m in a brotherhood," "I\'m a circle keeper"', '"this community IS my family"'],
    format: ['meetups, Zoom calls', 'outdoor gatherings instead of offices', 'dinner + deep conversation, hikes + sharing', 'wilderness retreats, 24-hour challenges together', 'co-living experiments, year-long initiations'],
    rulebreak: ['people make a friend or two', 'deeper connections than expected', 'strangers crying together after 2 hours', '"I\'ve known these people 3 hours and I trust them more than friends I\'ve had for years"', 'lifelong bonds from a single weekend'],
  },
  story: {
    ancestral: ['content creation courses, blogging tools', 'storytelling workshops', 'live spoken word, open mic nights', 'campfire storytelling, oral history circles', 'myths told around fire, passing down lineage stories'],
    body: ['watching a presentation', 'feeling moved by a talk', 'goosebumps during a live performance', 'full-body response to a story, crying, shaking', 'cathartic release, feeling physically different after sharing your story'],
    identity: ['attending a show', 'a talk they quote later', '"I told my story on stage once"', '"I\'m a storyteller," "I\'m a spoken word artist"', '"my story IS my work"'],
    format: ['blog post, YouTube video', 'live stream instead of edited', 'documentary + live Q&A, story + music', 'immersive theater, story walks through a city', 'audience becomes the story, no stage at all'],
    rulebreak: ['a good story well told', 'a story that sticks with people', 'people share it with friends unprompted', '"that story changed how I see my own life"', 'people say the story healed something in them'],
  },
  nourishment: {
    ancestral: ['meal kit delivery, nutrition apps', 'cooking classes with some tradition', 'communal cooking, fermentation, foraging', 'fasting retreats, ancestral diet programs, fire-cooked feasts', 'hunting and preparing your own food, eating only what grows near you'],
    body: ['learning about nutrition', 'trying a new recipe', 'a cooking class where you eat what you make', 'a fast that resets your digestion, a feast that changes your palette', 'multi-day fast, a diet shift that changes your bloodwork'],
    identity: ['a cooking class', 'a memorable meal', '"I did a 3-day fast once"', '"I\'m a sourdough baker," "I fast regularly"', '"food IS my medicine"'],
    format: ['recipe blog, cooking video', 'outdoor cooking instead of kitchen', 'cooking + music, food + storytelling', 'foraging + cooking in the wild, farm-to-fire dinner', 'guests grow, harvest, and cook their own meal from scratch'],
    rulebreak: ['a tasty meal', 'healthier than expected', 'people change their diet after one experience', '"I haven\'t eaten processed food since that retreat"', 'bloodwork improvements doctors can\'t explain'],
  },
  fire: {
    ancestral: ['LED mood lighting, sound machines', 'candle-lit yoga, ambient playlists', 'fire circles, drumming sessions', 'sweat lodge ceremonies, fire walking, cacao ceremony', 'tending a fire all night, sunrise rituals, solstice gatherings'],
    body: ['a relaxing ambiance', 'mild warmth, gentle sensory shift', 'heat exposure, drumming vibrations through the body', 'fire walking, sweat lodge, intense heat ceremony', 'altered states from sustained fire-gazing, overnight vigils'],
    identity: ['attending an event', 'a memorable ceremony', '"I walked on fire once"', '"I keep a daily fire ritual," "I\'m a firekeeper"', '"ceremony IS how I live"'],
    format: ['workshop in a studio', 'outdoor instead of indoor', 'fire + breathwork, ceremony + live music', 'firewalking at a corporate event, ceremony in a gallery', 'an all-night fire that people discover at dawn in a public space'],
    rulebreak: ['a nice atmosphere', 'people feel more relaxed', 'people describe it as transformative', '"I can\'t explain what happened but something shifted"', 'measurable changes in stress, sleep, or pain after one session'],
  },
  tools: {
    ancestral: ['SaaS products, online courses', 'mentorship programs, skill workshops', 'apprenticeships, hands-on building', 'craft guilds, tool-making, building with your hands', 'flintknapping, weaving, shelter-building from raw materials'],
    body: ['watching a tutorial', 'light hands-on practice', 'building something physical, getting your hands dirty', 'exhausting physical build, hours of focused craft', 'building something from raw materials over days'],
    identity: ['taking a course', 'learning a useful skill', '"I built my own furniture"', '"I\'m a maker," "I build things"', '"I create with my hands every day, it\'s who I am"'],
    format: ['online course, YouTube tutorial', 'in-person workshop instead of video', 'build + community dinner, maker space + mentorship', 'wilderness building challenges, live-streamed craft', 'apprenticeship where you live with the craftsperson'],
    rulebreak: ['they learn a new skill', 'they build something better than expected', 'they solve a problem nobody thought they could', '"a beginner built THAT in one weekend?"', 'they create something a professional would charge thousands for'],
  },
  status: {
    ancestral: ['personal branding courses, LinkedIn optimization', 'confidence workshops, public speaking', 'style transformation, creative expression', 'rites of passage, initiation ceremonies, vision quests', 'earning your place through demonstrated skill in front of the tribe'],
    body: ['a personal branding talk', 'a confidence exercise', 'performing in front of people, style makeover', 'public challenge, standing in front of strangers and being seen', 'a physical test that proves something to yourself and witnesses'],
    identity: ['a workshop', 'a memorable coaching session', '"I did a vision quest"', '"I\'m someone who shows up fully," "I found my edge"', '"that experience made me who I am"'],
    format: ['coaching call, online course', 'outdoor challenge instead of classroom', 'style + storytelling, fashion + ceremony', 'public initiation, filmed transformation', 'a rite of passage with real stakes witnessed by strangers'],
    rulebreak: ['a confidence boost', 'noticeable behavior change', 'people around them ask "what happened to you?"', '"they walked in one person and walked out another"', 'a permanent identity shift from a single experience'],
  },
  shelter: {
    ancestral: ['interior design apps, Pinterest boards', 'space organization workshops', 'communal builds, garden design, natural materials', 'earthship building, off-grid cabins, permaculture design', 'building a shelter from the land with your hands, sleeping in what you made'],
    body: ['browsing design inspiration', 'rearranging a room', 'building with your hands, gardening', 'full-day build in nature, sleeping in your creation', 'multi-day shelter build, exposure to elements'],
    identity: ['an interior design class', 'a satisfying reorganization', '"I built a cabin once"', '"I live off-grid," "I design with nature"', '"I build homes from the earth"'],
    format: ['blog, Pinterest, YouTube', 'in-person workshop instead of video', 'build + communal meal, design + nature walk', 'live-in build retreat, design + sleep in your creation', 'arrive with nothing, leave having built your shelter from scratch'],
    rulebreak: ['a nicer looking room', 'a space that feels noticeably different', 'guests say "I feel different in this room"', '"sleeping in a space I built with my hands changed something in me"', 'measurable improvements in sleep, stress, or wellbeing from the space'],
  },
  threat: {
    ancestral: ['resilience courses, fear workshops', 'confidence challenges, public speaking', 'martial arts, cold exposure, heights', 'fear-facing rituals, survival training, night walks', 'facing real danger together, hunting, defending the group'],
    body: ['learning about fear', 'mild nervousness, butterflies', 'adrenaline rush, elevated heart rate', 'full fight-or-flight activation, shaking, crying, then calm', 'sustained exposure that rewires your nervous system over days'],
    identity: ['a workshop on courage', 'a challenge they remember', '"I jumped out of a plane once"', '"I face my fears regularly," "I\'m someone who doesn\'t back down"', '"I\'m fearless. That experience proved it."'],
    format: ['online course, video training', 'outdoor instead of classroom', 'obstacle course + sharing circle, boxing + breathwork', 'wilderness survival, 24-hour solo in the dark', 'real-stakes challenge where failure has consequences'],
    rulebreak: ['a small confidence boost', 'more brave than before', 'a shift in how they relate to fear', '"I haven\'t been afraid of the same things since"', 'a complete rewiring of their fear response from one experience'],
  },
}

// Fallback examples (used if no branch selected)
const DEFAULT_EXAMPLES = {
  ancestral: ['app-based coaching, online courses', 'journaling, guided meditation apps', 'group singing, cooking together, cold water', 'breathwork circles, fire ceremonies, fasting retreats', 'dancing together, sitting in silence, running in nature'],
  body: ['a lecture, a webinar', 'guided visualization, light stretching', 'yoga class, sound bath', 'cold plunge, intense breathwork, ecstatic dance', 'multi-day fasting, silent retreat, ayahuasca'],
  identity: ['a one-off workshop', 'a memorable talk', '"I did a silent retreat once"', '"I\'m a CrossFitter," "I\'m a cold plunger"', '"I\'m a breathwork facilitator," "I\'m a burner"'],
  format: ['studio class, Zoom session', 'outdoor instead of indoor', 'yoga + live DJ, therapy + wilderness', 'headset breathwork, therapy via podcast', 'sober dance party at sunrise'],
  rulebreak: ['', '', '', '', ''],
}

// Build options dynamically from branch
function getOptions(type, baseLabels, branch) {
  const examples = (branch && BRANCH_EXAMPLES[branch]?.[type]) || DEFAULT_EXAMPLES[type]
  return baseLabels.map((label, i) => ({
    value: i + 1,
    label: examples[i] ? `${label} (e.g., ${examples[i]})` : label,
  }))
}

const ANCESTRAL_LABELS = [
  'Not really. It\'s a modern invention.',
  'Loosely inspired. There\'s a thread back to something ancient.',
  'It includes something humans have always done.',
  'It\'s an ancient practice in a modern setting.',
  'It IS the practice. Humans did this exact thing for thousands of years.',
]

const BODY_LABELS = [
  'Not at all. It\'s purely informational.',
  'Slightly. Some relaxation or energy.',
  'Noticeable physical shift.',
  'Real physiological change.',
  'They feel it for days. Their body remembers.',
]

const IDENTITY_LABELS = [
  'No. They attend and leave.',
  'They might think about it later.',
  'It becomes part of their story.',
  'They start saying "I\'m someone who ___."',
  'It defines how they see themselves.',
]

const SHAREABILITY_OPTIONS = [
  { value: 1, label: 'Nobody would mention it.' },
  { value: 2, label: 'They might, if the topic came up.' },
  { value: 3, label: 'They\'d probably bring it up naturally.' },
  { value: 4, label: 'They\'d tell friends unprompted.' },
  { value: 5, label: 'They can\'t shut up about it. They post about it without being asked.' },
]

const FORMAT_LABELS = [
  'Same format everyone in my category uses.',
  'A slight variation on what exists.',
  'A notable twist on the standard delivery.',
  'A genuinely different delivery vehicle.',
  'A format nobody in my category has done.',
]

const RULEBREAK_LABELS = [
  'The result is expected for this type of experience.',
  'The result is slightly better than people expect.',
  'The result surprises people when they hear about it.',
  'People say "wait, really?" when they hear the result.',
  'The result is so unexpected people don\'t believe it until they try.',
]

// ── Pillar definitions ──
const PILLAR_META = {
  return: { key: 'return', label: 'Return', color: '#34d399', desc: 'Ancestral alignment' },
  break:  { key: 'break',  label: 'Break',  color: '#E9A23B', desc: 'Unexpected results' },
  tribal: { key: 'tribal', label: 'Tribal', color: '#a78bfa', desc: 'Tribe creation' },
}

const PILLAR_RECOMMENDATIONS = {
  return: 'Your experience doesn\'t connect to ancestral biology strongly enough. What did humans do for 100,000 years that this echoes? Get the body involved. People forget what they think, they remember what they feel.',
  break: 'Your results are expected. People won\'t talk about expected results. What would your industry say CAN\'T work that you prove DOES? And is your delivery vehicle new, or the same format everyone else uses?',
  tribal: 'People attend and leave. They don\'t become anything. Give them a word for what they are now: "I\'m someone who ___." The identity isn\'t a label, it\'s a CHOICE that reflects a VALUE. What do participants CHOOSE by doing this?',
}

export default function FacilitatorScore() {
  const navigate = useNavigate()
  const [step, setStepRaw] = useState(STEPS.INTRO)
  const setStep = (next) => { setStepRaw(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  // ── Scores ──
  // RETURN pillar
  const [scoreAncestral, setScoreAncestral] = useState(0)
  const [scoreBody, setScoreBody] = useState(0)
  // TRIBAL pillar
  const [scoreIdentity, setScoreIdentity] = useState(0)
  const [scoreShareability, setScoreShareability] = useState(0)
  // BREAK pillar
  const [scoreFormat, setScoreFormat] = useState(0)
  const [scoreRulebreak, setScoreRulebreak] = useState(0)

  // Identity text input
  const [identityStatement, setIdentityStatement] = useState('')

  // Branch (pre-fill from useBranchScoring if no remarkable_angles or previous diag)
  const { primary: scoredPrimary } = useBranchScoring()
  const [selectedBranch, setSelectedBranch] = useState(null)

  // Auth + context
  const [user, setUser] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [ruleBreak, setRuleBreak] = useState('')
  const [existingDiagId, setExistingDiagId] = useState(null)
  const [accessScore, setAccessScore] = useState(null)
  const [hasReportData, setHasReportData] = useState(false)
  const [pullSources, setPullSources] = useState({})

  // Email capture
  const [email, setEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data?.user
      if (!u) return
      setUser(u)

      const [
        { data: angleData },
        { data: reachData },
        { data: accessData },
        { data: diagData },
      ] = await Promise.all([
        supabase.from('remarkable_angles')
          .select('project_name, ai_rule_statement, wound_problem, score_unique, score_share, score_simple, branch, score_ancestral, score_body')
          .eq('user_id', u.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('narrative_builders')
          .select('identity_label, vehicle_type')
          .eq('user_id', u.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('access_architectures')
          .select('price_score, time_score, friction_score, cognitive_score, identity_score')
          .eq('user_id', u.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('scale_diagnostics')
          .select('id, score_body, score_culture, score_identity, score_ancestral, score_format, score_rulebreak, branch')
          .eq('user_id', u.id).order('created_at', { ascending: false }).limit(1),
      ])

      const angle = angleData?.[0]
      const reach = reachData?.[0]
      const access = accessData?.[0]
      const diag = diagData?.[0]
      const sources = {}

      if (angle) {
        if (angle.project_name) setProjectName(angle.project_name)
        if (angle.ai_rule_statement) setRuleBreak(angle.ai_rule_statement)

        // Q1 Ancestral — direct pull
        if (angle.score_ancestral) {
          setScoreAncestral(angle.score_ancestral)
          sources.ancestral = 'Remarkable Results'
        }
        // Q2 Body — direct pull
        if (angle.score_body) {
          setScoreBody(angle.score_body)
          sources.body = 'Remarkable Results'
        }
        // Branch — direct pull
        if (angle.branch) {
          setSelectedBranch(angle.branch)
          sources.branch = 'Remarkable Results'
        }
        // Q6 Rule Break — map remarkability score to 1-5
        if (angle.score_unique && angle.score_share && angle.score_simple) {
          const rmk = angle.score_unique * angle.score_share * angle.score_simple
          const rb = rmk >= 64 ? 5 : rmk >= 27 ? 4 : rmk >= 8 ? 3 : rmk >= 3 ? 2 : 1
          setScoreRulebreak(rb)
          sources.rulebreak = 'Remarkable Results'
        }
      }

      if (reach) {
        // Q3 Identity — infer from identity_label
        if (reach.identity_label?.trim()) {
          setScoreIdentity(4)
          sources.identity = 'Remarkable Reach'
        }
        // Q5 Format — map vehicle type
        if (reach.vehicle_type) {
          const fmap = { results: 2, new_action: 3, new_medium: 4 }
          setScoreFormat(fmap[reach.vehicle_type] || 2)
          sources.format = 'Remarkable Reach'
        }
      }

      if (access) {
        const avg = Math.round(((access.price_score || 0) + (access.time_score || 0) + (access.friction_score || 0) + (access.cognitive_score || 0) + (access.identity_score || 0)) / 5 * 10) / 10
        setAccessScore(avg)
        // Q4 Shareability — infer from identity barrier (inverted proxy)
        if (access.identity_score) {
          setScoreShareability(access.identity_score)
          sources.shareability = 'Remarkable Growth'
        }
      }

      // Existing diagnostic fills gaps only (fresh flow data takes priority)
      if (diag) {
        setExistingDiagId(diag.id)
        if (diag.score_ancestral && !sources.ancestral) { setScoreAncestral(diag.score_ancestral); sources.ancestral = 'Previous Scale Score' }
        if (diag.score_body && !sources.body) { setScoreBody(diag.score_body); sources.body = 'Previous Scale Score' }
        if (diag.score_identity && !sources.identity) { setScoreIdentity(diag.score_identity); sources.identity = 'Previous Scale Score' }
        if (diag.score_culture && !sources.shareability) { setScoreShareability(diag.score_culture); sources.shareability = 'Previous Scale Score' }
        if (diag.score_format && !sources.format) { setScoreFormat(diag.score_format); sources.format = 'Previous Scale Score' }
        if (diag.score_rulebreak && !sources.rulebreak) { setScoreRulebreak(diag.score_rulebreak); sources.rulebreak = 'Previous Scale Score' }
        if (diag.branch && !angle?.branch) setSelectedBranch(diag.branch)
      }

      setPullSources(sources)
      setHasReportData(!!angle?.score_ancestral || !!angle?.score_body)
    })
  }, [])

  // Fallback: pre-fill branch from useBranchScoring if nothing else set it
  useEffect(() => {
    if (!selectedBranch && scoredPrimary?.branch) {
      setSelectedBranch(scoredPrimary.branch)
    }
  }, [scoredPrimary, selectedBranch])

  const isLoggedIn = !!user

  // ── Pillar scores (average of sub-factors, 1-5) ──
  const pillarReturn = scoreAncestral > 0 && scoreBody > 0
    ? Math.round((scoreAncestral + scoreBody) / 2 * 10) / 10 : 0
  const pillarBreak = scoreFormat > 0 && scoreRulebreak > 0
    ? Math.round((scoreFormat + scoreRulebreak) / 2 * 10) / 10 : 0
  const pillarTribal = scoreIdentity > 0 && scoreShareability > 0
    ? Math.round((scoreIdentity + scoreShareability) / 2 * 10) / 10 : 0

  const totalScore = Math.round((pillarReturn + pillarBreak + pillarTribal) * 10) / 10
  const maxScore = 15

  const getPhaseClass = (score) => {
    if (score >= 12) return { label: 'Phase 3', desc: 'Blow-up conditions present. Protect the purity and find your format change.', color: '#34d399' }
    if (score >= 9) return { label: 'Strong Phase 3', desc: 'One pillar needs sharpening. Fix it and this scales.', color: '#6ee7b7' }
    if (score >= 6) return { label: 'Phase 2.5', desc: 'Phase 3 content delivered through a Phase 2 mechanism. Pick a lane.', color: '#fbbf24' }
    return { label: 'Phase 2', desc: 'This removes difficulty instead of building capacity. Rethink the concept.', color: '#f87171' }
  }

  const getBarColor = (score) => {
    if (score >= 4) return 'sdf-bar-green'
    if (score >= 3) return 'sdf-bar-amber'
    return 'sdf-bar-red'
  }

  const getPillarBarColor = (score) => {
    if (score >= 4) return 'sdf-bar-green'
    if (score >= 3) return 'sdf-bar-amber'
    return 'sdf-bar-red'
  }

  const pillars = [
    { ...PILLAR_META.return, score: pillarReturn, subs: [{ label: 'Ancestral', score: scoreAncestral }, { label: 'Body', score: scoreBody }] },
    { ...PILLAR_META.break, score: pillarBreak, subs: [{ label: 'Format', score: scoreFormat }, { label: 'Rule Break', score: scoreRulebreak }] },
    { ...PILLAR_META.tribal, score: pillarTribal, subs: [{ label: 'Identity', score: scoreIdentity }, { label: 'Shareability', score: scoreShareability }] },
  ]

  const weakestPillar = pillars.reduce((min, p) => p.score > 0 && p.score < min.score ? p : min, pillars[0])

  const branchObj = BRANCHES.find(b => b.key === selectedBranch)

  // ── Save ──
  const saveForUser = async () => {
    if (!user) return
    const fields = {
      score_body: scoreBody,
      score_culture: scoreShareability,
      score_identity: scoreIdentity,
      score_ancestral: scoreAncestral,
      score_format: scoreFormat,
      score_rulebreak: scoreRulebreak,
      branch: selectedBranch,
      total_score: Math.round(totalScore * 10),
      phase_classification: getPhaseClass(totalScore).label,
      gate_passed: pillarReturn >= 4 && pillarTribal >= 3,
      project_name: projectName || null,
    }
    try {
      if (existingDiagId) {
        await supabase.from('scale_diagnostics').update(fields).eq('id', existingDiagId)
      } else {
        const { data } = await supabase.from('scale_diagnostics').insert({ ...fields, user_id: user.id }).select('id').single()
        if (data?.id) setExistingDiagId(data.id)
      }
    } catch (err) { console.warn('Scale Score save failed:', err.message) }
  }

  // ── Email ──
  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@')) { setEmailError('Please enter a valid email address.'); return }
    setEmailSaving(true); setEmailError(null)
    try {
      await supabase.from('lead_captures').insert({
        email, source: 'scale-score',
        scores: { total: totalScore, branch: selectedBranch, return: pillarReturn, break: pillarBreak, tribal: pillarTribal, ancestral: scoreAncestral, body: scoreBody, identity: scoreIdentity, shareability: scoreShareability, format: scoreFormat, rulebreak: scoreRulebreak },
      })
    } catch (err) { console.warn('Lead capture error:', err.message) }
    setEmailSaving(false); hapticSuccess(); setStep(STEPS.RESULTS)
  }

  // ── Share ──
  const handleShare = async () => {
    const url = `${window.location.origin}/try/facilitator-score`
    const phase = getPhaseClass(totalScore)
    const text = `My Scale Score: ${totalScore}/15 (${phase.label}). Return ${pillarReturn}/5, Break ${pillarBreak}/5, Tribal ${pillarTribal}/5. Take yours: ${url}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true); hapticSuccess(); setTimeout(() => setCopied(false), 2500)
    } catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
      setCopied(true); hapticSuccess(); setTimeout(() => setCopied(false), 2500)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN 1: INTRO
  // ═══════════════════════════════════════════════════════════════
  if (step === STEPS.INTRO) {
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-intro">
            <div className="sdf-intro-content">
              <div className="sdf-badge">Scale Score</div>

              {ruleBreak && (
                <div className="sdf-context-card" style={{ marginBottom: '1rem' }}>
                  {projectName && <strong>{projectName}: </strong>}
                  "{ruleBreak}"
                </div>
              )}

              <h1>Will your experience <span className="sdf-gold">scale</span>?</h1>

              {hasReportData ? (
                <div style={{ textAlign: 'left', maxWidth: 380, margin: '0 auto', fontSize: '0.88rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.65)' }}>
                  <p style={{ margin: '0 0 0.75rem' }}>
                    We've pulled your answers from Remarkable Results, Reach, and Growth. Review each pillar, adjust anything that's changed, and see your score.
                  </p>
                  <p style={{ margin: 0 }}>
                    3 pillars. 6 questions. Already filled in.
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'left', maxWidth: 380, margin: '0 auto', fontSize: '0.88rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.65)' }}>
                  <p style={{ margin: '0 0 0.75rem' }}>
                    Your brain and body run on software that's 100,000 years old. Every invention since then made life more convenient. Less walking, less cooking, less face-to-face.
                  </p>
                  <p style={{ margin: '0 0 0.75rem' }}>
                    That worked great until it didn't. When convenience goes too far, people start paying to do the hard thing again. CrossFit. Cold plunge. Dancing sober at sunrise.
                  </p>
                  <p style={{ margin: '0 0 0.75rem', color: 'rgba(255,255,255,0.85)' }}>
                    <strong>The experiences that scale give people back what convenience took away.</strong>
                  </p>
                  <p style={{ margin: 0 }}>
                    3 pillars. 6 questions. 2 minutes.
                  </p>
                </div>
              )}
            </div>

            <button className="sdf-cta" onClick={() => { hapticLight(); setStep(hasReportData ? STEPS.REPORT : STEPS.BRANCH) }}>
              {hasReportData ? 'Review my score' : 'Score my experience'}
            </button>
            {isLoggedIn && (
              <button className="sdf-back" style={{ display: 'block', margin: '0.75rem auto 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => window.history.back()}>
                ← Back
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // REPORT CARD MODE — read-only, links back to source flows
  // ═══════════════════════════════════════════════════════════════
  if (step === STEPS.REPORT) {
    const allScored = scoreAncestral > 0 && scoreBody > 0 && scoreIdentity > 0 && scoreShareability > 0 && scoreFormat > 0 && scoreRulebreak > 0

    const reportItem = (question, score, labels, source, editPath, editLabel) => (
      <div className="sdf-report-item">
        <div className="sdf-report-q">{question}</div>
        {score > 0 ? (
          <>
            <div className="sdf-report-answer">
              <span className="sdf-report-score">{score}/5</span>
              <span className="sdf-report-text">{labels[score - 1]}</span>
            </div>
            {source && <div className="sdf-source-badge">{source}</div>}
            <span className="sdf-report-edit" onClick={() => navigate(editPath)}>Change in {editLabel} →</span>
          </>
        ) : (
          <div className="sdf-report-missing" onClick={() => navigate(editPath)}>
            Not answered yet. Complete {editLabel} →
          </div>
        )}
      </div>
    )

    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-badge">Scale Score</div>
          <h2 className="sdf-heading" style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>Your <span className="sdf-gold">report card</span></h2>
          <p className="sdf-prompt" style={{ marginBottom: '1.25rem' }}>Pulled from your earlier flows. To change an answer, go back to the flow where you answered it.</p>

          {/* ── RETURN PILLAR ── */}
          <div className="sdf-report-pillar" style={{ borderLeftColor: '#34d399' }}>
            <div className="sdf-report-pillar-header">
              <div className="sdf-report-pillar-label" style={{ color: '#34d399' }}>Return</div>
              {pillarReturn > 0 && <div className="sdf-report-pillar-score" style={{ color: '#34d399' }}>{pillarReturn}/5</div>}
            </div>
            {reportItem('Does your experience return something humans did for 100,000+ years?', scoreAncestral, ANCESTRAL_LABELS, pullSources.ancestral, '/create/remarkable', 'Remarkable Results')}
            {reportItem('Does the body feel physically different after?', scoreBody, BODY_LABELS, pullSources.body, '/create/remarkable', 'Remarkable Results')}
          </div>

          {/* ── TRIBAL PILLAR ── */}
          <div className="sdf-report-pillar" style={{ borderLeftColor: '#a78bfa' }}>
            <div className="sdf-report-pillar-header">
              <div className="sdf-report-pillar-label" style={{ color: '#a78bfa' }}>Tribal</div>
              {pillarTribal > 0 && <div className="sdf-report-pillar-score" style={{ color: '#a78bfa' }}>{pillarTribal}/5</div>}
            </div>
            {reportItem('Would participants start calling themselves something new?', scoreIdentity, IDENTITY_LABELS, pullSources.identity, '/create/narrative-builder', 'Remarkable Reach')}
            {reportItem('Would participants tell friends without being asked?', scoreShareability, SHAREABILITY_OPTIONS.map(o => o.label), pullSources.shareability, '/create/access-architecture', 'Remarkable Growth')}
          </div>

          {/* ── BREAK PILLAR ── */}
          <div className="sdf-report-pillar" style={{ borderLeftColor: '#E9A23B' }}>
            <div className="sdf-report-pillar-header">
              <div className="sdf-report-pillar-label" style={{ color: '#E9A23B' }}>Break</div>
              {pillarBreak > 0 && <div className="sdf-report-pillar-score" style={{ color: '#E9A23B' }}>{pillarBreak}/5</div>}
            </div>
            {reportItem('Is your delivery vehicle new?', scoreFormat, FORMAT_LABELS, pullSources.format, '/create/narrative-builder', 'Remarkable Reach')}
            {reportItem('Does your experience produce a result so unexpected people can\'t help talking about it?', scoreRulebreak, RULEBREAK_LABELS, pullSources.rulebreak, '/create/remarkable', 'Remarkable Results')}
          </div>

          <div className="sdf-nav">
            <button className="sdf-back" onClick={() => setStep(STEPS.INTRO)}>Back</button>
            <button className="sdf-cta" disabled={!allScored}
              onClick={() => { hapticLight(); saveForUser(); hapticSuccess(); setStep(STEPS.RESULTS) }}>
              See my score
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN 2: BRANCH SELECTION (public / no prior data)
  // ═══════════════════════════════════════════════════════════════
  if (step === STEPS.BRANCH) {
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-step-badge">Step 1 of 4</div>
          <h2 className="sdf-heading">Which <span className="sdf-gold">branch</span> does your experience sit on?</h2>
          <p className="sdf-prompt">Every experience maps to one of 10 primal human needs. This shapes the competition context on your results.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {BRANCHES.map(b => {
              const isRecommended = scoredPrimary?.branch === b.key
              return (
              <button key={b.key} className={`sdf-option-btn ${selectedBranch === b.key ? 'sdf-option-selected' : ''}`}
                onClick={() => { hapticLight(); setSelectedBranch(b.key) }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{b.icon}</span>
                <span>
                  <strong>{b.label}</strong>
                  {isRecommended && <span style={{ marginLeft: 8, fontSize: '0.65rem', fontWeight: 700, color: '#E9A23B', background: 'rgba(233,162,59,0.15)', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recommended</span>}
                  <span style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{b.desc}</span>
                </span>
              </button>
              )
            })}
          </div>

          <div className="sdf-nav">
            <button className="sdf-back" onClick={() => setStep(STEPS.INTRO)}>Back</button>
            <button className="sdf-cta" disabled={!selectedBranch} onClick={() => { hapticLight(); setStep(STEPS.RETURN) }}>Next</button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN 3: RETURN PILLAR (Ancestral + Body)
  // ═══════════════════════════════════════════════════════════════
  if (step === STEPS.RETURN) {
    const ready = scoreAncestral > 0 && scoreBody > 0
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-step-badge">Step 2 of 4 · Return</div>
          <h2 className="sdf-heading" style={{ color: '#34d399' }}>Does it align with our <span style={{ color: 'white' }}>100,000-year-old</span> biology?</h2>

          <div className="sdf-question-section">
            <div className="sdf-question-label">Does your experience return something humans did for 100,000+ years?</div>
            {pullSources.ancestral && <div className="sdf-source-badge">Pulled from {pullSources.ancestral}</div>}
            <p className="sdf-question-why">For 100,000 years humans moved in groups, cooked over fire, told stories in circles, faced fears together. The experiences that scale are the ones that give this back in a modern container.</p>
            <div className="sdf-option-list">
              {getOptions('ancestral', ANCESTRAL_LABELS, selectedBranch).map(opt => (
                <button key={opt.value} className={`sdf-option-btn ${scoreAncestral === opt.value ? 'sdf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setScoreAncestral(opt.value) }}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div className="sdf-question-section">
            <div className="sdf-question-label">After your experience, does the participant's body feel <span className="sdf-gold">physically different</span>?</div>
            {pullSources.body && <div className="sdf-source-badge">Pulled from {pullSources.body}</div>}
            <p className="sdf-question-why">You can learn something in your head and forget it by Tuesday. But trembling, sweating, tears, goosebumps: those get encoded differently. It's why you remember your first cold plunge but not last week's podcast.</p>
            <div className="sdf-option-list">
              {getOptions('body', BODY_LABELS, selectedBranch).map(opt => (
                <button key={opt.value} className={`sdf-option-btn ${scoreBody === opt.value ? 'sdf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setScoreBody(opt.value) }}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div className="sdf-nav">
            <button className="sdf-back" onClick={() => setStep(STEPS.BRANCH)}>Back</button>
            <button className="sdf-cta" disabled={!ready} onClick={() => { hapticLight(); setStep(STEPS.TRIBAL) }}>Next</button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN 4: TRIBAL PILLAR (Identity + Shareability)
  // ═══════════════════════════════════════════════════════════════
  if (step === STEPS.TRIBAL) {
    const ready = scoreIdentity > 0 && scoreShareability > 0
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-step-badge">Step 3 of 4 · Tribal</div>
          <h2 className="sdf-heading" style={{ color: '#a78bfa' }}>Does it create a <span style={{ color: 'white' }}>tribe</span>?</h2>

          <div className="sdf-question-section">
            <div className="sdf-question-label">Would participants start calling themselves <span className="sdf-gold">something new</span>?</div>
            {pullSources.identity && <div className="sdf-source-badge">Recommended from {pullSources.identity}</div>}
            <p className="sdf-question-why">Identity isn't a label. It's a CHOICE that reflects a VALUE. "I'm a CrossFitter" means "I choose hard over easy." "I'm a Daybreaker" means "I choose joy without substances." What do participants CHOOSE by doing your experience?</p>
            <div className="sdf-option-list">
              {getOptions('identity', IDENTITY_LABELS, selectedBranch).map(opt => (
                <button key={opt.value} className={`sdf-option-btn ${scoreIdentity === opt.value ? 'sdf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setScoreIdentity(opt.value) }}>{opt.label}</button>
              ))}
            </div>

            {scoreIdentity >= 3 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.35rem' }}>
                  Complete the sentence: "I'm someone who ___"
                </div>
                <input type="text" value={identityStatement} onChange={(e) => setIdentityStatement(e.target.value)}
                  placeholder="e.g. dances sober at sunrise"
                  style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 12, color: 'white', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.target.style.borderColor = '#a78bfa' }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.15)' }}
                />
              </div>
            )}
          </div>

          <div className="sdf-question-section">
            <div className="sdf-question-label">Would participants tell friends <span className="sdf-gold">without being asked</span>?</div>
            {pullSources.shareability && <div className="sdf-source-badge">Recommended from {pullSources.shareability}</div>}
            <p className="sdf-question-why">Shareable experiences have 3 elements: a surprising TRANSFORMATION ("I cried for 20 minutes"), an unexpected DELIVERY ("silent disco on a beach at sunrise"), and WITNESSES ("with 200 strangers"). The stronger each element, the more people talk.</p>
            <div className="sdf-option-list">
              {SHAREABILITY_OPTIONS.map(opt => (
                <button key={opt.value} className={`sdf-option-btn ${scoreShareability === opt.value ? 'sdf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setScoreShareability(opt.value) }}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div className="sdf-nav">
            <button className="sdf-back" onClick={() => setStep(STEPS.RETURN)}>Back</button>
            <button className="sdf-cta" disabled={!ready} onClick={() => { hapticLight(); setStep(STEPS.BREAK) }}>Next</button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN 5: BREAK PILLAR (Format + Rule Break)
  // ═══════════════════════════════════════════════════════════════
  if (step === STEPS.BREAK) {
    const ready = scoreFormat > 0 && scoreRulebreak > 0
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-step-badge">Step 4 of 4 · Break</div>
          <h2 className="sdf-heading" style={{ color: '#E9A23B' }}>Does it create results in <span style={{ color: 'white' }}>unexpected</span> ways?</h2>

          <div className="sdf-question-section">
            <div className="sdf-question-label">Is your <span className="sdf-gold">delivery vehicle</span> new, or is it the same format everyone else uses?</div>
            {pullSources.format && <div className="sdf-source-badge">Recommended from {pullSources.format}</div>}
            <p className="sdf-question-why">Gabor Mate had the same insight for 44 years. It blew up when the FORMAT changed (documentary). Wim Hof taught the same method for decades. It blew up when a scientific paper validated it. The blow-up is almost never a content change. It's a vehicle change.</p>
            <div className="sdf-option-list">
              {getOptions('format', FORMAT_LABELS, selectedBranch).map(opt => (
                <button key={opt.value} className={`sdf-option-btn ${scoreFormat === opt.value ? 'sdf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setScoreFormat(opt.value) }}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div className="sdf-question-section">
            {ruleBreak && (
              <div className="sdf-context-card" style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#E9A23B', marginBottom: '0.25rem' }}>From your Remarkable Results</div>
                "{ruleBreak}"
              </div>
            )}
            <div className="sdf-question-label">Does your experience produce a result <span className="sdf-gold">so unexpected</span> people can't help talking about it?</div>
            {pullSources.rulebreak && <div className="sdf-source-badge">Recommended from {pullSources.rulebreak}</div>}
            <p className="sdf-question-why">A rule break isn't about being controversial. It's about producing a result the industry says shouldn't be possible. "I walked on fire and felt unstoppable." "I breathed for 90 minutes and healed a trauma I'd had for 20 years." The more unexpected the result, the more it spreads.</p>
            <div className="sdf-option-list">
              {getOptions('rulebreak', RULEBREAK_LABELS, selectedBranch).map(opt => (
                <button key={opt.value} className={`sdf-option-btn ${scoreRulebreak === opt.value ? 'sdf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setScoreRulebreak(opt.value) }}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div className="sdf-nav">
            <button className="sdf-back" onClick={() => setStep(STEPS.TRIBAL)}>Back</button>
            <button className="sdf-cta" disabled={!ready} onClick={() => {
              hapticLight()
              if (isLoggedIn) { saveForUser(); hapticSuccess(); setStep(STEPS.RESULTS) }
              else setStep(STEPS.EMAIL)
            }}>
              See my score
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN 6: EMAIL CAPTURE (public only)
  // ═══════════════════════════════════════════════════════════════
  if (step === STEPS.EMAIL) {
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-intro">
            <div className="sdf-intro-content">
              <div className="sdf-badge">Almost there</div>
              <h1>Where should we send your <span className="sdf-gold">Scale Score</span>?</h1>
              <div style={{ width: '100%', maxWidth: 380, marginTop: '0.5rem' }}>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(null) }}
                  placeholder="your@email.com" autoFocus
                  style={{ width: '100%', padding: '0.9rem 1.1rem', background: 'rgba(255,255,255,0.08)', border: `2px solid ${emailError ? '#f87171' : 'rgba(255,255,255,0.2)'}`, borderRadius: 14, color: 'white', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={(e) => { if (!emailError) e.target.style.borderColor = '#E9A23B' }}
                  onBlur={(e) => { if (!emailError) e.target.style.borderColor = 'rgba(255,255,255,0.2)' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleEmailSubmit() }}
                />
                {emailError && <div className="sdf-error" style={{ marginTop: '0.5rem' }}>{emailError}</div>}
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginTop: '0.75rem', textAlign: 'center' }}>
                  Your 3-pillar breakdown + the one thing to fix first.
                </p>
              </div>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="sdf-cta" style={{ width: '100%' }} disabled={emailSaving} onClick={handleEmailSubmit}>
                {emailSaving ? 'Sending...' : 'Get my score'}
              </button>
              <button className="sdf-back" style={{ width: '100%', textAlign: 'center' }} onClick={() => setStep(STEPS.RESULTS)}>
                Skip, just show me
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN 7: RESULTS
  // ═══════════════════════════════════════════════════════════════
  if (step === STEPS.RESULTS) {
    const phase = getPhaseClass(totalScore)

    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">

          {/* Big score */}
          <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
            <div className="sdf-badge">Scale Score</div>
            <div style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1, color: phase.color, marginBottom: '0.25rem' }}>
              {totalScore}
            </div>
            <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '0.5rem' }}>
              out of {maxScore}
            </div>
            <div style={{ display: 'inline-block', padding: '0.3rem 0.9rem', background: `${phase.color}18`, border: `1px solid ${phase.color}40`, borderRadius: 100, fontSize: '0.82rem', fontWeight: 700, color: phase.color, marginBottom: '0.5rem' }}>
              {phase.label}
            </div>
            <div style={{ fontSize: '0.92rem', lineHeight: 1.45, color: 'rgba(255,255,255,0.65)', maxWidth: 360, margin: '0.5rem auto 0' }}>
              {phase.desc}
            </div>
          </div>

          {/* 3 Pillar bars with sub-factors */}
          <div className="sdf-results-section">
            {pillars.map(p => (
              <div key={p.key} className={`sdf-score-bar ${p.key === weakestPillar.key ? 'sdf-score-bar-weakest' : ''}`}>
                <div className="sdf-score-bar-header">
                  <span className="sdf-score-bar-label" style={{ color: p.color, fontWeight: 800, fontSize: '0.88rem' }}>{p.label}</span>
                  <span className="sdf-score-bar-value" style={{ color: p.color }}>{p.score}/5</span>
                </div>
                <div className="sdf-score-bar-track">
                  <div className={`sdf-score-bar-fill ${getPillarBarColor(p.score)}`} style={{ width: `${(p.score / 5) * 100}%` }} />
                </div>
                {/* Sub-factors */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {p.subs.map(s => (
                    <div key={s.label} style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>
                        <span>{s.label}</span><span>{s.score}/5</span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 2, width: `${(s.score / 5) * 100}%`, background: s.score >= 4 ? '#34d399' : s.score >= 3 ? '#fbbf24' : '#f87171', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Weakest pillar recommendation */}
          <div className="sdf-accelerator-card" style={{ borderColor: `${weakestPillar.color}40` }}>
            <div className="sdf-accelerator-label" style={{ color: weakestPillar.color }}>
              Your biggest growth lever: {weakestPillar.label}
            </div>
            <p className="sdf-accelerator-text">{PILLAR_RECOMMENDATIONS[weakestPillar.key]}</p>
          </div>

          {/* Identity statement */}
          {identityStatement && (
            <div className="sdf-gap-card">
              <div className="sdf-gap-label">Your Identity Statement</div>
              <p className="sdf-gap-text" style={{ fontSize: '1rem', fontWeight: 600, color: '#a78bfa' }}>
                "I'm someone who {identityStatement}"
              </p>
            </div>
          )}

          {/* Branch competition */}
          {branchObj && (
            <div className="sdf-gap-card">
              <div className="sdf-gap-label">Branch: {branchObj.label}</div>
              <p className="sdf-gap-text">
                {branchObj.creators === 0
                  ? `Zero known experience creators in ${branchObj.label}. You would be first.`
                  : branchObj.creators <= 3
                  ? `Only ${branchObj.creators} known creator${branchObj.creators > 1 ? 's' : ''} in ${branchObj.label}. Wide open.`
                  : branchObj.creators <= 10
                  ? `${branchObj.creators} creators in ${branchObj.label}. Room to differentiate.`
                  : `${branchObj.creators} creators in ${branchObj.label}. Crowded. Your Break pillar matters most.`
                }
              </p>
            </div>
          )}

          {/* Access context */}
          {accessScore !== null && (
            <div className="sdf-gap-card">
              <div className="sdf-gap-label">Access Score (from Barrier Audit)</div>
              <p className="sdf-gap-text">
                Barrier average: {accessScore}/5.
                {accessScore >= 4 ? ' Low barriers.' : accessScore >= 3 ? ' Moderate barriers. Consider a free micro-version.' : ' High barriers. The person who needs this most can\'t reach it yet.'}
              </p>
            </div>
          )}

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1.25rem' }}>
            <a href="/create" className="sdf-cta" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', width: '100%', boxSizing: 'border-box' }}>
              {isLoggedIn ? 'Back to Create Portal' : 'Start creating experiences'}
            </a>
            <button className="sdf-cta" onClick={handleShare} style={{ background: 'rgba(255,255,255,0.08)', color: 'white', boxShadow: 'none', border: '2px solid rgba(255,255,255,0.2)', width: '100%' }}>
              {copied ? 'Copied!' : 'Share my score'}
            </button>
            {!isLoggedIn && (
              <a href="/log-in" style={{ display: 'block', textAlign: 'center', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'underline', marginTop: '0.25rem' }}>
                Create a free account to save your results
              </a>
            )}
          </div>

        </div>
      </div>
    )
  }

  return null
}
