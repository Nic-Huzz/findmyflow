/**
 * RemarkableFlow.jsx — /create/remarkable
 * "Blow Up Your Brand — Part 1: Readiness Diagnostic"
 *
 * 7-step distillation: Problem → Assumption → Two Worlds → Different → Experience → Compress → Score
 * Remarkability Score: Uniqueness x Shareability x Simplicity (gates AI generation)
 * Data-enriched: Scope Map, DNA match, Life Map inform answers
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { onRemarkableComplete } from '../lib/brain/autoPopulate'
import { useBranchScoring } from '../hooks/useBranchScoring'
import dnaData from '../../public/data/experienceCreatorDNA.json'
import './RemarkableFlow.css'

const BRANCHES = [
  { key: 'movement',    label: 'Movement',    icon: '\u{1F3C3}', desc: 'Fitness, dance, cold exposure, physical challenge' },
  { key: 'nourishment', label: 'Nourishment', icon: '\u{1F37D}\uFE0F', desc: 'Food, cooking, fasting, nutrition' },
  { key: 'tools',       label: 'Tools/Tech',  icon: '\u{1F6E0}\uFE0F', desc: 'Skills, education, problem-solving, AI' },
  { key: 'status',      label: 'Status',      icon: '\u2728', desc: 'Identity, craft, reputation, self-expression' },
  { key: 'bonds',       label: 'Bonds',       icon: '\u{1F91D}', desc: 'Relationships, community, gathering, friendship' },
  { key: 'shelter',     label: 'Shelter',     icon: '\u{1F3E0}', desc: 'Space design, environments, co-living' },
  { key: 'story',       label: 'Story',       icon: '\u{1F4D6}', desc: 'Narrative, storytelling, live content, media' },
  { key: 'play',        label: 'Play',        icon: '🎲', desc: 'Games, recreation, improv, adventure, fun' },
  { key: 'fire',        label: 'Fire/Energy', icon: '\u{1F525}', desc: 'Ceremony, lighting, ritual, frequency' },
  { key: 'healing',     label: 'Healing',     icon: '\u{1F49C}', desc: 'Therapy, breathwork, somatic, plant medicine' },
  { key: 'rest',        label: 'Rest',        icon: '😴', desc: 'Rest, dreams, stillness, recovery' },
  { key: 'threat',      label: 'Threat',      icon: '\u2694\uFE0F', desc: 'Courage, fear-facing, resilience, safety' },
]

const ANCESTRAL_EXAMPLES = {
  movement:    ['fitness apps, online PT', 'gym classes with some bodyweight', 'running, swimming, martial arts', 'CrossFit, obstacle races, cold plunge', 'barefoot running, wrestling, group hunts'],
  healing:     ['therapy apps, online counseling', 'guided meditation apps, journaling prompts', 'breathwork, sound healing, group circles', 'sweat lodges, plant medicine ceremony, fasting retreats', 'sitting in silence, grief rituals, laying on of hands'],
  rest: ['sleep tracking apps, white noise', 'consistent sleep schedule, dark room', 'guided relaxation, gentle breathing', 'yoga nidra sessions, float tanks, dream journaling', 'polyphasic sleep, lucid dreaming, sleep as spiritual practice'],
  bonds:       ['networking apps, LinkedIn events', 'team-building workshops', 'group dinners, community circles', 'men\'s/women\'s circles, fireside gatherings', 'tribal councils, communal feasts, rites of passage'],
  story:       ['content creation courses, blogging tools', 'storytelling workshops', 'live spoken word, open mic nights', 'campfire storytelling, oral history circles', 'myths told around fire, passing down lineage stories'],
  play: ['mobile games, casual apps', 'board games, card games with friends', 'improv classes, escape rooms, active play', 'daily play groups, flow arts circles, adventure challenges', 'play as ceremony, unstructured free play in nature'],
  nourishment: ['meal kit delivery, nutrition apps', 'cooking classes with some tradition', 'communal cooking, fermentation, foraging', 'fasting retreats, ancestral diet programs, fire-cooked feasts', 'hunting and preparing your own food, eating only what grows near you'],
  fire:        ['LED mood lighting, sound machines', 'candle-lit yoga, ambient playlists', 'fire circles, drumming sessions', 'sweat lodge ceremonies, fire walking, cacao ceremony', 'tending a fire all night, sunrise rituals, solstice gatherings'],
  tools:       ['SaaS products, online courses', 'mentorship programs, skill workshops', 'apprenticeships, hands-on building', 'craft guilds, tool-making, building with your hands', 'flintknapping, weaving, shelter-building from raw materials'],
  status:      ['personal branding courses, LinkedIn optimization', 'confidence workshops, public speaking', 'style transformation, creative expression', 'rites of passage, initiation ceremonies, vision quests', 'earning your place through demonstrated skill in front of the tribe'],
  shelter:     ['interior design apps, Pinterest boards', 'space organization workshops', 'communal builds, garden design, natural materials', 'earthship building, off-grid cabins, permaculture design', 'building a shelter from the land with your hands, sleeping in what you made'],
  threat:      ['resilience courses, fear workshops', 'confidence challenges, public speaking', 'martial arts, cold exposure, heights', 'fear-facing rituals, survival training, night walks', 'facing real danger together, hunting, defending the group'],
}

const BODY_EXAMPLES = {
  movement:    ['exercise theory videos', 'light stretching, warm-up drills', 'a tough workout, HIIT class', 'cold plunge, intense bootcamp, altitude training', 'multi-day endurance challenge, extreme cold exposure'],
  healing:     ['talk therapy, a lecture', 'guided visualization, gentle meditation', 'sound bath, yin yoga, reiki', 'intense breathwork, cold exposure, somatic release', 'multi-day silent retreat, ayahuasca, extended fasting'],
  rest: ['hearing about sleep science', 'trying a relaxation routine', 'guided meditation, gentle body scan', 'deep yoga nidra, full body surrender', 'extended rest retreat, multi-day sleep reset'],
  bonds:       ['a networking event', 'a workshop with some movement', 'group activities, partner exercises', 'deep sharing circles, trust falls, vulnerability challenges', 'multi-day immersion, sleeping rough together, physical ordeals'],
  story:       ['watching a presentation', 'feeling moved by a talk', 'goosebumps during a live performance', 'full-body response to a story, crying, shaking', 'cathartic release, feeling physically different after sharing your story'],
  play: ['watching a game or comedy', 'playing a casual game, light activity', 'active games, laughing with others, improv', 'full body play, flow state, feeling fully alive', 'ecstatic play, multi-hour movement, embodied joy'],
  nourishment: ['learning about nutrition', 'trying a new recipe', 'a cooking class where you eat what you make', 'a fast that resets your digestion, a feast that changes your palette', 'multi-day fast, a diet shift that changes your bloodwork'],
  fire:        ['a relaxing ambiance', 'mild warmth, gentle sensory shift', 'heat exposure, drumming vibrations through the body', 'fire walking, sweat lodge, intense heat ceremony', 'altered states from sustained fire-gazing, overnight vigils'],
  tools:       ['watching a tutorial', 'light hands-on practice', 'building something physical, getting your hands dirty', 'exhausting physical build, hours of focused craft', 'building something from raw materials over days'],
  status:      ['a personal branding talk', 'a confidence exercise', 'performing in front of people, style makeover', 'public challenge, standing in front of strangers and being seen', 'a physical test that proves something to yourself and witnesses'],
  shelter:     ['browsing design inspiration', 'rearranging a room', 'building with your hands, gardening', 'full-day build in nature, sleeping in your creation', 'multi-day shelter build, exposure to elements'],
  threat:      ['learning about fear', 'mild nervousness, butterflies', 'adrenaline rush, elevated heart rate', 'full fight-or-flight activation, shaking, crying, then calm', 'sustained exposure that rewires your nervous system over days'],
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

function getBranchOptions(type, labels, branch) {
  const examples = (branch && (type === 'ancestral' ? ANCESTRAL_EXAMPLES : BODY_EXAMPLES)[branch]) || null
  return labels.map((label, i) => ({
    value: i + 1,
    label: examples ? `${label} (e.g., ${examples[i]})` : label,
  }))
}

const STEPS = {
  INTRO: 'intro',
  PROJECTS: 'projects',
  BRANCH: 'branch',
  ANCESTRAL: 'ancestral',
  BODY: 'body',
  PROBLEM: 'problem',
  ASSUMPTION: 'assumption',
  TWO_WORLDS: 'two_worlds',
  DIFFERENT: 'different',
  EXPERIENCE: 'experience',
  COMPRESSION: 'compression',
  SCORE: 'score',
  GENERATING: 'generating',
  REVIEW_RULE: 'review_rule',
  SUMMARY: 'summary',
}

function creatorSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
}

function lookupCreatorOneLiner(name) {
  const profile = dnaData.profiles?.find(p => p.name === name)
  return profile?.oneLiner || null
}

export default function RemarkableFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStepRaw] = useState(STEPS.INTRO)

  const setStep = (next) => {
    setStepRaw(next)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // User inputs — Screen 0 (Projects)
  const [projectItems, setProjectItems] = useState([''])
  const [projectType, setProjectType] = useState('') // 'one_thing' | 'separate'
  const [selectedItems, setSelectedItems] = useState([])
  const [projectName, setProjectName] = useState('')

  // User inputs — Branch + Foundation
  const [selectedBranch, setSelectedBranch] = useState('')
  const [scoreAncestral, setScoreAncestral] = useState(0)
  const [scoreBody, setScoreBody] = useState(0)

  // User inputs — Distillation
  const [problem, setProblem] = useState('')
  const [assumption, setAssumption] = useState('')
  const [twoWorlds, setTwoWorlds] = useState('')
  const [different, setDifferent] = useState('')
  const [experience, setExperience] = useState('')
  const [compression, setCompression] = useState('')

  // User inputs — Remarkability Score
  const [scoreUnique, setScoreUnique] = useState(0)
  const [scoreShare, setScoreShare] = useState(0)
  const [scoreSimple, setScoreSimple] = useState(0)

  // Data from other flows
  const [skills, setSkills] = useState([])
  const [problems, setProblems] = useState([])
  const [scopeMapProblem, setScopeMapProblem] = useState('')
  const [matchedFounder, setMatchedFounder] = useState('')
  const [matchedOneLiner, setMatchedOneLiner] = useState('')
  const [existingAngle, setExistingAngle] = useState(null)
  const [loading, setLoading] = useState(true)

  // AI result
  const [aiResult, setAiResult] = useState(null)
  const [editedRuleBreak, setEditedRuleBreak] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedAngleId, setSavedAngleId] = useState(null)

  // Branch scoring (for recommended tag + frontier hint)
  const { primary: scoredPrimary, rarity: scoredRarity } = useBranchScoring()
  const [matrixData, setMatrixData] = useState(null)
  const [hintOpen, setHintOpen] = useState(false)

  useEffect(() => {
    fetch('/data/spiralDynamicsMatrix.json')
      .then(r => r.json())
      .then(setMatrixData)
      .catch(() => {})
  }, [])

  // Reset hint when branch changes (don't show stale content already expanded)
  useEffect(() => { setHintOpen(false) }, [selectedBranch])

  // Fetch all data sources
  useEffect(() => {
    if (!user) { setLoading(false); return }
    ;(async () => {
      try {
        const [
          { data: probData },
          { data: skillData },
          { data: scopeData },
          { data: dnaResult },
          { data: angleData },
        ] = await Promise.all([
          supabase
            .from('nikigai_clusters')
            .select('cluster_label, is_favourite')
            .eq('user_id', user.id)
            .eq('cluster_type', 'problems'),
          supabase
            .from('nikigai_clusters')
            .select('cluster_label, items')
            .eq('user_id', user.id)
            .eq('cluster_type', 'skills'),
          supabase
            .from('scope_map_results')
            .select('stage, response_problem, response_audience')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('founder_dna_results')
            .select('matched_founder, archetype')
            .eq('user_id', user.id)
            .limit(1),
          supabase
            .from('remarkable_angles')
            .select('id, wound_problem, assumption, rule_identified, combination_insight, different, experience, extreme_action_plan, project_name, score_unique, score_share, score_simple, ai_rule_statement, ai_remarkable_bio, branch, score_ancestral, score_body')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),
        ])

        const sorted = (probData || []).sort((a, b) => (b.is_favourite ? 1 : 0) - (a.is_favourite ? 1 : 0))
        setProblems(sorted.map(p => p.cluster_label))
        setSkills(skillData?.map(s => s.cluster_label) || [])
        setScopeMapProblem(scopeData?.[0]?.response_problem || '')

        // DNA match → look up oneLiner from JSON
        const founder = dnaResult?.[0]?.matched_founder || ''
        setMatchedFounder(founder)
        if (founder) setMatchedOneLiner(lookupCreatorOneLiner(founder) || '')

        // Pre-fill for returning users
        const angle = angleData?.[0]
        if (angle) {
          setExistingAngle(angle)
          if (angle.id) setSavedAngleId(angle.id)
          if (angle.wound_problem) setProblem(angle.wound_problem)
          if (angle.assumption) setAssumption(angle.assumption)
          if (angle.combination_insight) setTwoWorlds(angle.combination_insight)
          if (angle.different) setDifferent(angle.different)
          if (angle.experience) setExperience(angle.experience)
          if (angle.extreme_action_plan) setCompression(angle.extreme_action_plan)
          if (angle.project_name) setProjectName(angle.project_name)
          if (angle.score_unique) setScoreUnique(angle.score_unique)
          if (angle.score_share) setScoreShare(angle.score_share)
          if (angle.score_simple) setScoreSimple(angle.score_simple)
          if (angle.branch) setSelectedBranch(angle.branch)
          if (angle.score_ancestral) setScoreAncestral(angle.score_ancestral)
          if (angle.score_body) setScoreBody(angle.score_body)
          // Legacy fallback: parse rule_identified if new columns are empty
          if (!angle.assumption && angle.rule_identified?.includes('Assumption: ')) {
            const parts = angle.rule_identified.split(' | ')
            parts.forEach(part => {
              if (part.startsWith('Project: ') && !angle.project_name) setProjectName(part.replace('Project: ', ''))
              if (part.startsWith('Assumption: ') && !angle.assumption) setAssumption(part.replace('Assumption: ', ''))
              if (part.startsWith('Different: ') && !angle.different) setDifferent(part.replace('Different: ', ''))
              if (part.startsWith('Experience: ') && !angle.experience) setExperience(part.replace('Experience: ', ''))
              if (part.startsWith('One-liner: ') && !angle.extreme_action_plan) setCompression(part.replace('One-liner: ', ''))
            })
          }
        }
      } catch (err) {
        console.warn('RemarkableFlow data load failed:', err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  // Auto-save when step changes (after render with latest state)
  useEffect(() => {
    if (step !== STEPS.INTRO && step !== STEPS.PROJECTS && step !== STEPS.SCORE && step !== STEPS.GENERATING && step !== STEPS.SUMMARY && user) {
      autoSave()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // Auto-save progress after each screen (silent, non-blocking)
  // Only saves fields that have values — never blanks existing data
  const autoSave = () => {
    if (!user) return
    const ruleId = `Project: ${projectName} | Problem: ${problem} | Assumption: ${assumption} | Two worlds: ${twoWorlds} | Different: ${different} | Experience: ${experience} | One-liner: ${compression} | Score: ${scoreUnique}x${scoreShare}x${scoreSimple}=${scoreUnique * scoreShare * scoreSimple}`

    const fields = { rule_identified: ruleId }
    if (problem) fields.wound_problem = problem
    if (assumption) fields.assumption = assumption
    if (twoWorlds) fields.combination_insight = twoWorlds
    if (different) fields.different = different
    if (experience) fields.experience = experience
    if (compression) fields.extreme_action_plan = compression
    if (projectName) fields.project_name = projectName
    if (scoreUnique) fields.score_unique = scoreUnique
    if (scoreShare) fields.score_share = scoreShare
    if (scoreSimple) fields.score_simple = scoreSimple
    if (selectedBranch) fields.branch = selectedBranch
    if (scoreAncestral) fields.score_ancestral = scoreAncestral
    if (scoreBody) fields.score_body = scoreBody

    if (savedAngleId) {
      supabase.from('remarkable_angles').update(fields).eq('id', savedAngleId)
        .then(({ error }) => { if (error) console.error('Auto-save update failed:', error.message) })
    } else {
      supabase.from('remarkable_angles').insert({ ...fields, user_id: user.id }).select('id').single()
        .then(({ data: row, error }) => {
          if (error) console.error('Auto-save insert failed:', error.message)
          else if (row?.id) setSavedAngleId(row.id)
        })
    }
  }

  // Generate AI extractions from user's answers
  const generate = async () => {
    setStep(STEPS.GENERATING)
    setError(null)
    hapticLight()

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-remarkable-angle', {
        body: {
          wound_problem: problem,
          rule_identified: assumption,
          combination_insight: twoWorlds,
          extreme_action_plan: `${different}. The experience: ${experience}. User's one-liner: ${compression}`,
          user_name: projectName,
        },
      })
      if (fnError) throw fnError
      setAiResult(data)
      setEditedRuleBreak(data?.rule_statement || '')
      hapticSuccess()
      setStep(STEPS.REVIEW_RULE)
    } catch (err) {
      console.error('Remarkable generation error:', err)
      setError('Something went wrong. Let\'s try again.')
      setStep(STEPS.SCORE)
    }
  }

  // Save final result — updates existing auto-saved row or inserts new
  const save = async () => {
    if (!user || saving) return false
    setSaving(true)
    try {
      const coreData = {
        wound_problem: problem,
        assumption: assumption,
        combination_insight: twoWorlds,
        different: different,
        experience: experience,
        extreme_action_plan: compression,
        project_name: projectName,
        score_unique: scoreUnique || null,
        score_share: scoreShare || null,
        score_simple: scoreSimple || null,
        branch: selectedBranch || null,
        score_ancestral: scoreAncestral || null,
        score_body: scoreBody || null,
        rule_identified: `Project: ${projectName} | Problem: ${problem} | Assumption: ${assumption} | Two worlds: ${twoWorlds} | Different: ${different} | Experience: ${experience} | One-liner: ${compression} | Score: ${scoreUnique}x${scoreShare}x${scoreSimple}=${scoreUnique * scoreShare * scoreSimple}`,
        ai_rule_statement: editedRuleBreak || aiResult?.rule_statement || null,
        ai_remarkable_bio: aiResult?.remarkable_bio || null,
        ai_tribe_statement: null,
      }
      let rowId = savedAngleId
      if (rowId) {
        const { error: updateErr } = await supabase.from('remarkable_angles').update(coreData).eq('id', rowId)
        if (updateErr) throw updateErr
      } else {
        const { data: insertedRow, error: insertErr } = await supabase.from('remarkable_angles').insert({ ...coreData, user_id: user.id }).select('id').single()
        if (insertErr) throw insertErr
        if (insertedRow?.id) rowId = insertedRow.id
      }
      if (rowId) setSavedAngleId(rowId)
      // Auto-populate brain
      onRemarkableComplete(user.id, {
        ruleIdentified: `Assumption: ${assumption} | Two worlds: ${twoWorlds} | Different: ${different}`,
        combinationInsight: twoWorlds,
        extremeAction: compression,
        aiRuleStatement: aiResult?.rule_statement || null,
        aiTribeStatement: null,
      })
      hapticSuccess()
      return true
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save. Please try again.')
      return false
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rmk">
        <div className="rmk-center">
          <div className="rmk-spinner" />
        </div>
      </div>
    )
  }

  // ── SCREEN 1: INTRO (3-Layer Model) ──
  if (step === STEPS.INTRO) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-intro">
            <div className="rmk-intro-content">
              <div className="rmk-badge">Remarkable Results</div>
              {existingAngle ? (
                <>
                  <h1>Welcome back. Let's <span className="rmk-gold">sharpen</span> your angle.</h1>
                  <p>Last time you identified your remarkable angle. Let's see if it's evolved.</p>
                </>
              ) : (
                <>
                  <h1>What makes you <span className="rmk-gold">worth talking about</span>?</h1>
                  <p>We studied 129 experience creators. Every one who sustained had 3 ingredients. Every one who peaked was missing at least one.</p>
                </>
              )}
            </div>

            <button className="rmk-cta" onClick={() => { hapticLight(); setStep(STEPS.PROJECTS) }}>
              {existingAngle ? 'Sharpen my angle' : 'Let\'s go'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 0: PROJECTS ──
  if (step === STEPS.PROJECTS) {
    const filledItems = projectItems.filter(s => s.trim())
    const canAddMore = projectItems.length < 5
    const showTypeChoice = filledItems.length >= 2 && !projectType
    const singleItem = filledItems.length === 1
    const showNameInput = projectType === 'one_thing' || (projectType === 'separate' && selectedItems.length > 0) || singleItem
    const canProceed = projectName.trim().length >= 2

    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Getting started</div>
          <h2 className="rmk-heading">What are you <span className="rmk-gold">building</span>?</h2>
          <p className="rmk-prompt">List everything you're working on. Events, apps, content, products.</p>

          <div className="rmk-project-inputs">
            {projectItems.map((item, i) => (
              <textarea
                key={i}
                className="rmk-textarea"
                value={item}
                onChange={e => {
                  const next = [...projectItems]
                  next[i] = e.target.value
                  setProjectItems(next)
                }}
                placeholder={i === 0 ? 'e.g. Dance events, breathwork workshops' : 'e.g. An app, a podcast, a course'}
                rows={1}
                style={{ marginBottom: '0.5rem' }}
              />
            ))}
            {canAddMore && (
              <button
                className="rmk-add-more"
                onClick={() => { hapticLight(); setProjectItems([...projectItems, '']) }}
              >
                + Add more
              </button>
            )}
          </div>

          {showTypeChoice && (
            <div style={{ marginTop: '1.25rem' }}>
              <p className="rmk-prompt">Are these expressions of one thing, or separate projects?</p>
              <div className="rmk-problem-list">
                <button
                  className="rmk-problem-btn"
                  onClick={() => { hapticLight(); setProjectType('one_thing'); setSelectedItems(filledItems) }}
                >
                  Expressions of one thing
                </button>
                <button
                  className="rmk-problem-btn"
                  onClick={() => { hapticLight(); setProjectType('separate') }}
                >
                  Separate projects
                </button>
              </div>
            </div>
          )}

          {projectType === 'separate' && (
            <div style={{ marginTop: '1rem' }}>
              <p className="rmk-prompt">Select which ones you want to focus on:</p>
              <div className="rmk-problem-list">
                {filledItems.map((item, i) => (
                  <button
                    key={i}
                    className={`rmk-problem-btn ${selectedItems.includes(item) ? 'rmk-problem-selected' : ''}`}
                    onClick={() => {
                      hapticLight()
                      setSelectedItems(prev =>
                        prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]
                      )
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showNameInput && (
            <div style={{ marginTop: '1.25rem' }}>
              <p className="rmk-prompt">
                {projectType === 'one_thing' ? 'What do you call this movement?' : 'What do you call this project?'}
              </p>
              <textarea
                className="rmk-textarea"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder={projectType === 'one_thing' ? 'e.g. Vibe Rise' : 'e.g. My breathwork workshop'}
                rows={1}
              />
            </div>
          )}

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.INTRO)}>Back</button>
            <button
              className="rmk-cta"
              disabled={!canProceed}
              onClick={() => { hapticLight(); setStep(STEPS.BRANCH) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 1B: BRANCH SELECTION ──
  if (step === STEPS.BRANCH) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Foundation</div>
          <h2 className="rmk-heading">Which <span className="rmk-gold">branch</span> does your experience sit on?</h2>
          <p className="rmk-prompt">This shapes the examples you'll see throughout the flow.</p>

          <div>
            {BRANCHES.map(b => {
              const isRecommended = scoredPrimary?.branch === b.key
              return (
                <button key={b.key}
                  className={`rmk-problem-btn ${selectedBranch === b.key ? 'rmk-problem-selected' : ''}`}
                  style={{ marginBottom: '0.4rem' }}
                  onClick={() => { hapticLight(); setSelectedBranch(b.key) }}>
                  <span style={{ fontWeight: 700 }}>{b.icon} {b.label}</span>
                  {isRecommended && <span className="rmk-recommended-tag">Recommended</span>}
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginLeft: 8, fontWeight: 400 }}>{b.desc}</span>
                </button>
              )
            })}
          </div>

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.PROJECTS)}>Back</button>
            <button className="rmk-cta" disabled={!selectedBranch}
              onClick={() => { hapticLight(); setStep(STEPS.ANCESTRAL) }}>Next</button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 1C: ANCESTRAL ──
  if (step === STEPS.ANCESTRAL) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Foundation</div>
          <h2 className="rmk-heading">Does your experience return something humans did for <span className="rmk-gold">100,000+ years</span>?</h2>
          <p className="rmk-prompt">For 100,000 years humans moved in groups, cooked over fire, told stories in circles, faced fears together. The experiences that scale give this back in a modern container.</p>

          <div>
            {getBranchOptions('ancestral', ANCESTRAL_LABELS, selectedBranch).map(opt => (
              <button key={opt.value}
                className={`rmk-problem-btn ${scoreAncestral === opt.value ? 'rmk-problem-selected' : ''}`}
                onClick={() => { hapticLight(); setScoreAncestral(opt.value) }}>
                {opt.label}
              </button>
            ))}
          </div>

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.BRANCH)}>Back</button>
            <button className="rmk-cta" disabled={!scoreAncestral}
              onClick={() => { hapticLight(); setStep(STEPS.BODY) }}>Next</button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 1D: BODY ──
  if (step === STEPS.BODY) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Foundation</div>
          <h2 className="rmk-heading">After your experience, does the body feel <span className="rmk-gold">physically different</span>?</h2>
          <p className="rmk-prompt">You can learn something in your head and forget it by Tuesday. But trembling, sweating, tears, goosebumps: those get encoded differently. The body remembers what the mind forgets.</p>

          <div>
            {getBranchOptions('body', BODY_LABELS, selectedBranch).map(opt => (
              <button key={opt.value}
                className={`rmk-problem-btn ${scoreBody === opt.value ? 'rmk-problem-selected' : ''}`}
                onClick={() => { hapticLight(); setScoreBody(opt.value) }}>
                {opt.label}
              </button>
            ))}
          </div>

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.ANCESTRAL)}>Back</button>
            <button className="rmk-cta" disabled={!scoreBody}
              onClick={() => { hapticLight(); setStep(STEPS.PROBLEM) }}>Next</button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 2: PROBLEM ──
  if (step === STEPS.PROBLEM) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Distil · 1 of 7</div>
          <h2 className="rmk-heading">What problem does {projectName ? <span className="rmk-gold">{projectName}</span> : 'your work'} solve that nobody else is <span className="rmk-gold">solving right</span>?</h2>
          <p className="rmk-prompt">The one that still fires you up when you think about it.</p>

          {scopeMapProblem && (
            <div className="rmk-context-card">
              You told us before: "{scopeMapProblem}"
            </div>
          )}

          {problems.length > 0 && (
            <>
              <div className="rmk-problem-list">
                {problems.map((prob, i) => (
                  <button
                    key={i}
                    className={`rmk-problem-btn ${problem === prob ? 'rmk-problem-selected' : ''}`}
                    onClick={() => { hapticLight(); setProblem(prob) }}
                  >
                    {prob}
                  </button>
                ))}
              </div>
              <div className="rmk-or-divider"><span>or write your own</span></div>
            </>
          )}

          <textarea
            className="rmk-textarea"
            value={problem}
            onChange={e => setProblem(e.target.value)}
            placeholder="e.g. Real transformation is paywalled. People spend thousands and are still stuck."
            rows={3}
          />

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.BODY)}>Back</button>
            <button
              className="rmk-cta"
              disabled={!problem || problem.trim().length < 5}
              onClick={() => { hapticLight(); setStep(STEPS.ASSUMPTION) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 3: ASSUMPTION ──
  if (step === STEPS.ASSUMPTION) {
    // Look up frontier insight for selected branch
    const frontierHint = (() => {
      if (!matrixData?.cells || !selectedBranch) return null
      const sdLevels = ['purple', 'red', 'blue', 'orange', 'green', 'yellow']
      for (const sd of sdLevels) {
        const cell = matrixData.cells[`${selectedBranch}-${sd}`]
        if (cell?.status === 'frontier' && cell.simple) return cell.simple
      }
      return null
    })()

    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Distil · 2 of 7</div>
          <div className="rmk-context-card">{problem}</div>
          <h2 className="rmk-heading">What does everyone assume is <span className="rmk-gold">required</span> to solve it?</h2>
          <p className="rmk-prompt">What rule does everyone follow that you think is wrong?</p>

          {frontierHint && (
            <div className="rmk-hint-box">
              <button
                type="button"
                className="rmk-hint-toggle"
                onClick={() => setHintOpen(!hintOpen)}
              >
                {hintOpen ? 'Hide hint ▴' : assumption.trim() ? 'What the market assumes ▾' : 'Stuck? Read this ▾'}
              </button>
              {hintOpen && (
                <div className="rmk-hint-content">
                  <div className="rmk-hint-label">What most people in {BRANCHES.find(b => b.key === selectedBranch)?.label || selectedBranch} assume:</div>
                  <p className="rmk-hint-text">{frontierHint.crowded}</p>
                  {frontierHint.stuck && (
                    <>
                      <div className="rmk-hint-label" style={{ marginTop: '0.6rem' }}>Why it no longer works:</div>
                      <p className="rmk-hint-text">{frontierHint.stuck}</p>
                    </>
                  )}
                  <p className="rmk-hint-nudge">Use this as a starting point, or write your own.</p>
                </div>
              )}
            </div>
          )}

          <textarea
            className="rmk-textarea"
            value={assumption}
            onChange={e => setAssumption(e.target.value)}
            placeholder="e.g. Everyone assumes healing must be serious, clinical, and expensive"
            rows={3}
            autoFocus
          />

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.PROBLEM)}>Back</button>
            <button
              className="rmk-cta"
              disabled={assumption.trim().length < 10}
              onClick={() => { hapticLight(); setStep(STEPS.TWO_WORLDS) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 4: TWO WORLDS ──
  if (step === STEPS.TWO_WORLDS) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Distil · 3 of 7</div>
          <div className="rmk-context-card">{assumption}</div>
          <h2 className="rmk-heading">What experience or background showed you that assumption is <span className="rmk-gold">wrong</span>?</h2>
          <p className="rmk-prompt">What did you live through that made you see what others can't?</p>

          {skills.length > 0 && (
            <div className="rmk-skills-hint">
              <div className="rmk-skills-label">Your Life Map</div>
              <div className="rmk-skills-tags">
                {skills.slice(0, 6).map((skill, i) => (
                  <span key={i} className="rmk-skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

          <div className="rmk-example-card">
            Radha Agrawal spent years in nightlife and saw parties don't need alcohol. Wim Hof nearly lost everything and discovered breathing could control what doctors said was impossible.
          </div>

          <textarea
            className="rmk-textarea"
            value={twoWorlds}
            onChange={e => setTwoWorlds(e.target.value)}
            placeholder="e.g. I did a year-long fear challenge that changed my life more in 3 months than 3 years of online courses"
            rows={3}
            autoFocus
          />

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.ASSUMPTION)}>Back</button>
            <button
              className="rmk-cta"
              disabled={twoWorlds.trim().length < 10}
              onClick={() => { hapticLight(); setStep(STEPS.DIFFERENT) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 5: HOW YOU'RE DIFFERENT ──
  if (step === STEPS.DIFFERENT) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Distil · 4 of 7</div>
          <div className="rmk-context-card">{assumption}</div>
          <h2 className="rmk-heading">Remove that assumption. How does {projectName ? <span className="rmk-gold">{projectName}</span> : 'your approach'} <span className="rmk-gold">solve it differently</span>?</h2>
          <p className="rmk-prompt">Given what you lived through, what does your approach look like?</p>

          {scoredRarity && scoredRarity.matchCount <= 5 && scoredRarity.topSkill && scoredRarity.topProblem && (
            <div className="rmk-hint-box" style={{ marginBottom: '0.8rem' }}>
              <div className="rmk-hint-content" style={{ padding: '0.8rem' }}>
                <div className="rmk-hint-label">What makes you rare</div>
                <p className="rmk-hint-text">
                  {scoredRarity.matchCount === 0
                    ? `Nobody in ${scoredRarity.totalProfiles} profiles combines ${scoredRarity.topSkill.replace(/_/g, ' ')} + ${scoredRarity.topProblem.replace(/_/g, ' ')}${scoredRarity.topPersona ? ` + ${scoredRarity.topPersona}` : ''}. Lean into that.`
                    : `Only ${scoredRarity.matchCount} of ${scoredRarity.totalProfiles} combine ${scoredRarity.topSkill.replace(/_/g, ' ')} + ${scoredRarity.topProblem.replace(/_/g, ' ')}${scoredRarity.topPersona ? ` + ${scoredRarity.topPersona}` : ''}. That combination is your edge.`
                  }
                </p>
              </div>
            </div>
          )}

          <textarea
            className="rmk-textarea"
            value={different}
            onChange={e => setDifferent(e.target.value)}
            placeholder="e.g. Silent discos with breathwork. Group healing through play. No credentials, just a room, music, and permission."
            rows={3}
            autoFocus
          />

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.TWO_WORLDS)}>Back</button>
            <button
              className="rmk-cta"
              disabled={different.trim().length < 10}
              onClick={() => { hapticLight(); setStep(STEPS.EXPERIENCE) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── THE EXPERIENCE (Product) ──
  if (step === STEPS.EXPERIENCE) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Distil · 5 of 7</div>
          <h2 className="rmk-heading">What's the <span className="rmk-gold">experience</span> people actually have?</h2>
          <p className="rmk-prompt">Describe the thing someone walks into, signs up for, or downloads. The product that IS the rule break.</p>

          <div className="rmk-example-card">
            Dawnbreak: 5am sober silent discos on the beach. Byron Katie: 4 questions anyone can ask themselves. Wim Hof: A breathing protocol + ice baths.
          </div>

          <textarea
            className="rmk-textarea"
            value={experience}
            onChange={e => setExperience(e.target.value)}
            placeholder="e.g. A weekly fear challenge where participants do one scary thing and track how it shifts their state"
            rows={3}
            autoFocus
          />

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.DIFFERENT)}>Back</button>
            <button
              className="rmk-cta"
              disabled={experience.trim().length < 10}
              onClick={() => { hapticLight(); setStep(STEPS.COMPRESSION) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── COMPRESSION GATE ──
  if (step === STEPS.COMPRESSION) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Distil · 6 of 7</div>
          <h2 className="rmk-heading">State your method in <span className="rmk-gold">one sentence</span>.</h2>
          <p className="rmk-prompt">If you can compress it, it's ready to travel. If you can't, it needs more reps.</p>

          {matchedOneLiner && (
            <div className="rmk-example-card">
              {matchedFounder}: "{matchedOneLiner}"
            </div>
          )}

          {!matchedOneLiner && (
            <div className="rmk-example-card">
              Ram Dass: "Be here now." Priya Parker: "How you gather matters more than why."
            </div>
          )}

          <textarea
            className="rmk-textarea"
            value={compression}
            onChange={e => setCompression(e.target.value)}
            placeholder="e.g. Healing should be fun, communal, and accessible"
            rows={2}
            autoFocus
          />

          {error && <div className="rmk-error">{error}</div>}

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.EXPERIENCE)}>Back</button>
            <button
              className="rmk-cta"
              disabled={compression.trim().length < 5}
              onClick={() => { hapticLight(); setStep(STEPS.SCORE) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCORE YOURSELF ──
  if (step === STEPS.SCORE) {
    const total = scoreUnique * scoreShare * scoreSimple
    const allScored = scoreUnique > 0 && scoreShare > 0 && scoreSimple > 0
    const anyLow = allScored && (scoreUnique < 3 || scoreShare < 3 || scoreSimple < 3)

    const ScoreRow = ({ label, value, setValue, hint }) => (
      <div className="rmk-score-row">
        <div className="rmk-score-header">
          <div className="rmk-output-label">{label}</div>
          <div className="rmk-score-hint">{hint}</div>
        </div>
        <div className="rmk-score-buttons">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              className={`rmk-score-btn ${value === n ? 'rmk-score-active' : ''}`}
              onClick={() => { hapticLight(); setValue(n) }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    )

    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Rate your angle</div>
          <h2 className="rmk-heading">How <span className="rmk-gold">remarkable</span> is this?</h2>
          <p className="rmk-prompt">Be honest. Low scores help you sharpen.</p>

          {experience && (
            <div className="rmk-context-card">{experience}</div>
          )}

          <div className="rmk-score-section">
            <ScoreRow
              label="Uniqueness"
              value={scoreUnique}
              setValue={setScoreUnique}
              hint="How many others do this thing this way?"
            />
            <ScoreRow
              label="Shareability"
              value={scoreShare}
              setValue={setScoreShare}
              hint="If you saw someone doing this, would you tell a friend?"
            />
            <ScoreRow
              label="Simplicity"
              value={scoreSimple}
              setValue={setScoreSimple}
              hint="Could a stranger get it in under 10 seconds?"
            />
          </div>

          {allScored && (
            <div className={`rmk-score-result ${anyLow ? 'rmk-score-low' : 'rmk-score-good'}`}>
              <div className="rmk-score-total">{total}<span style={{ fontSize: '0.7rem', opacity: 0.5 }}>/125</span></div>
              {anyLow ? (
                <>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.88rem' }}>
                    {scoreUnique < 3 && 'Your angle might not be different enough. '}
                    {scoreShare < 3 && 'It\'s not remarkable enough to spread yet. '}
                    {scoreSimple < 3 && 'It\'s too complex to travel. '}
                    Sharpen it.
                  </p>
                  <div className="rmk-score-actions">
                    {scoreUnique < 3 && (
                      <button className="rmk-score-fix" onClick={() => setStep(STEPS.ASSUMPTION)}>
                        Sharpen your assumption
                      </button>
                    )}
                    {scoreShare < 3 && (
                      <button className="rmk-score-fix" onClick={() => setStep(STEPS.DIFFERENT)}>
                        Sharpen how you're different
                      </button>
                    )}
                    {scoreSimple < 3 && (
                      <button className="rmk-score-fix" onClick={() => setStep(STEPS.COMPRESSION)}>
                        Sharpen your one-liner
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)' }}>
                  Your angle is remarkable. Let's generate your positioning.
                </p>
              )}
            </div>
          )}

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.COMPRESSION)}>Back</button>
            <button
              className="rmk-cta"
              disabled={!allScored}
              onClick={generate}
            >
              {anyLow ? 'Generate anyway' : 'Show me my angle'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── GENERATING ──
  if (step === STEPS.GENERATING) {
    return (
      <div className="rmk">
        <div className="rmk-center">
          <div className="rmk-spinner" />
          <p className="rmk-loading-text">Finding your remarkable angle...</p>
        </div>
      </div>
    )
  }

  // ── REVIEW RULE BREAK ──
  if (step === STEPS.REVIEW_RULE && aiResult) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-badge">Your Rule Break</div>
          <p className="rmk-prompt">The AI generated this from your answers. Edit it until it feels right.</p>

          <textarea
            className="rmk-textarea"
            value={editedRuleBreak}
            onChange={e => setEditedRuleBreak(e.target.value)}
            placeholder="Your rule break statement..."
            rows={3}
            autoFocus
            style={{ fontSize: '1.05rem', fontWeight: 600 }}
          />

          <div className="rmk-example-card">
            Examples: "You don't change by learning, you change by being in your discomfort zone." "The question is never why the addiction, but why the pain."
          </div>

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.SCORE)}>Back</button>
            <button
              className="rmk-cta"
              disabled={editedRuleBreak.trim().length < 5}
              onClick={() => { hapticLight(); setStep(STEPS.SUMMARY) }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SUMMARY ──
  if (step === STEPS.SUMMARY && aiResult) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-badge">{projectName || 'Your'} Remarkable Angle</div>

          {/* Rule break statement */}
          {editedRuleBreak && (
            <div className="rmk-output-card rmk-output-tribe" style={{ marginBottom: '1rem' }}>
              <div className="rmk-output-label">Your rule break</div>
              <p className="rmk-output-text" style={{ fontWeight: 700, fontSize: '1.05rem' }}>{editedRuleBreak}</p>
            </div>
          )}

          <div className="rmk-output-section">
            <div className="rmk-output-card">
              <div className="rmk-output-label">The problem{projectName ? ` ${projectName}` : ' you'} solve{projectName ? 's' : ''}</div>
              <p className="rmk-output-text">{problem}</p>
            </div>

            <div className="rmk-output-card">
              <div className="rmk-output-label">The assumption you break</div>
              <p className="rmk-output-text">{assumption}</p>
            </div>

            <div className="rmk-output-card">
              <div className="rmk-output-label">What showed you it was wrong</div>
              <p className="rmk-output-text">{twoWorlds}</p>
            </div>

            <div className="rmk-output-card">
              <div className="rmk-output-label">How {projectName || 'you\'re'} different</div>
              <p className="rmk-output-text">{different}</p>
            </div>

            <div className="rmk-output-card">
              <div className="rmk-output-label">The experience</div>
              <p className="rmk-output-text">{experience}</p>
            </div>

            <div className="rmk-output-card">
              <div className="rmk-output-label">Your one-liner</div>
              <p className="rmk-output-text" style={{ fontWeight: 700, fontSize: '1.05rem' }}>{compression}</p>
            </div>
          </div>

          {aiResult.remarkable_bio && (
            <div className="rmk-output-card" style={{ marginTop: '0.75rem' }}>
              <div className="rmk-output-label">Your remarkable bio</div>
              <p className="rmk-output-text">{aiResult.remarkable_bio}</p>
            </div>
          )}

          {error && <div className="rmk-error">{error}</div>}

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.REVIEW_RULE)}>Back</button>
            <button
              className="rmk-cta"
              disabled={saving}
              onClick={async () => {
                const saved = await save()
                if (saved) {
                  navigate('/create')
                }
              }}
            >
              {saving ? 'Saving...' : 'Save my angle'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
