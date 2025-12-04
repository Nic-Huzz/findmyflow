import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { resolvePrompt } from './lib/promptResolver'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import { completeFlowQuest } from './lib/questCompletion'
import { selectSafetyContracts } from './data/nervousSystemBeliefs'

// Helper function to convert markdown to HTML for basic formatting
function formatMarkdown(text) {
  if (!text) return ''

  return text
    // Bold: **text** or __text__ (including multiline)
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__([\s\S]+?)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_ (including multiline)
    .replace(/\*([\s\S]+?)\*/g, '<em>$1</em>')
    .replace(/_([\s\S]+?)_/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br />')
}

// Helper function to extract YES safety contracts from belief test results
function extractYesContracts(beliefTestResults) {
  if (!beliefTestResults || typeof beliefTestResults !== 'object') {
    return []
  }

  return Object.entries(beliefTestResults)
    .filter(([contract, response]) => response === 'yes')
    .map(([contract]) => contract)
}

// Helper function to parse income goal string to number
function parseIncomeGoal(incomeGoalString) {
  if (!incomeGoalString) return 100000 // default

  // Extract number from strings like "$1,000,000+" or "$500,000+"
  const match = incomeGoalString.replace(/,/g, '').match(/\d+/)
  return match ? parseInt(match[0], 10) : 100000
}

// Helper function to parse impact goal string to number
function parseImpactGoal(impactGoalString) {
  if (!impactGoalString) return 10000 // default

  // Extract number from strings like "100,000+" or "10,000+"
  const match = impactGoalString.replace(/,/g, '').match(/\d+/)
  return match ? parseInt(match[0], 10) : 10000
}

// Helper function to format amount as currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Helper function to format impact as people count
function formatPeople(amount) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' people'
}

// Helper function to evaluate conditional logic
function evaluateConditional(conditional, context) {
  if (!conditional) return true

  // Handle simple equality checks like "triage_safe_earning_initial === 'yes'"
  const match = conditional.match(/(\w+)\s*===\s*'(\w+)'/)
  if (match) {
    const [, varName, expectedValue] = match
    return context[varName] === expectedValue
  }

  return true
}

// Helper function to extract archetype from AI reflection text
function extractArchetype(reflectionText) {
  if (!reflectionText) return null

  // Look for patterns like "The Good Soldier", "The Hustling Healer", etc.
  // Patterns: "The [Word]" or "The [Word] [Word]"
  const match = reflectionText.match(/['"](The\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)['"]/i)
  if (match) {
    return match[1]
  }

  // Alternative pattern: mentions of archetype directly
  const archetypeMatch = reflectionText.match(/archetype[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
  if (archetypeMatch) {
    return archetypeMatch[1]
  }

  return null
}

function NervousSystemFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [flow, setFlow] = useState(null)
  const [messages, setMessages] = useState([])
  const [context, setContext] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [leadMagnetData, setLeadMagnetData] = useState(null)
  const messagesEndRef = useRef(null)

  // Dynamic contract testing state
  const [contracts, setContracts] = useState([]) // Array of contract strings
  const [contractResults, setContractResults] = useState({}) // { contract: 'yes'/'no' }
  const [currentContractIndex, setCurrentContractIndex] = useState(0)
  const [isInContractMode, setIsInContractMode] = useState(false)

  // Binary search state for income limit discovery
  const [isInBinarySearchMode, setIsInBinarySearchMode] = useState(false)
  const [binarySearchCurrentAmount, setBinarySearchCurrentAmount] = useState(null)
  const [binarySearchPreviousYesAmount, setBinarySearchPreviousYesAmount] = useState(null)
  const [binarySearchIteration, setBinarySearchIteration] = useState(0)
  const [binarySearchDirection, setBinarySearchDirection] = useState(null) // 'doubling' or 'halving'

  // Fetch lead magnet data from Supabase
  const fetchLeadMagnetData = async () => {
    if (!supabase) {
      console.warn('⚠️ Supabase not available - using fallback data')
      return {
        user_name: 'User',
        protective_archetype: 'Unknown'
      }
    }

    try {
      console.log('🔍 Fetching lead magnet data from Supabase...')

      const { data, error } = await supabase
        .from('lead_flow_profiles')
        .select('user_name, protective_archetype, essence_archetype, persona')
        .eq('email', user?.email)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('❌ Error fetching lead magnet data:', error)
        return {
          user_name: 'User',
          protective_archetype: 'Unknown'
        }
      }

      if (data && data.length > 0) {
        console.log('✅ Lead magnet data fetched:', data[0])
        return data[0]
      } else {
        console.warn('⚠️ No lead magnet data found')
        return {
          user_name: 'User',
          protective_archetype: 'Unknown'
        }
      }
    } catch (err) {
      console.error('❌ Error fetching lead magnet data:', err)
      return {
        user_name: 'User',
        protective_archetype: 'Unknown'
      }
    }
  }

  // Load nervous system flow JSON and lead magnet data
  useEffect(() => {
    const loadFlow = async () => {
      try {
        // Fetch lead magnet data first
        const leadData = await fetchLeadMagnetData()
        setLeadMagnetData(leadData)

        // Update context with lead magnet data
        const updatedContext = {
          user_name: leadData.user_name,
          protective_archetype: leadData.protective_archetype
        }
        setContext(updatedContext)

        // Load nervous system safety flow
        const response = await fetch('/nervous-system-safety-flow.json')
        if (!response.ok) throw new Error('Failed to load nervous system flow')
        const flowData = await response.json()
        setFlow(flowData)

        // Start with the first step using the updated context
        if (flowData.steps && flowData.steps.length > 0) {
          const firstStep = flowData.steps[0]
          const responseText = await resolvePrompt(firstStep, updatedContext)
          const aiMessage = {
            id: `ai-${Date.now()}`,
            isAI: true,
            text: responseText,
            timestamp: new Date().toLocaleTimeString()
          }
          setMessages([aiMessage])
        }
      } catch (err) {
        console.error('Error loading nervous system flow:', err)
        setError('Failed to load nervous system flow')
      }
    }

    loadFlow()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const currentStep = flow?.steps?.[currentIndex]

  // Calculate dynamic variables for a step based on metadata and context
  const calculateDynamicVariables = (step, ctx) => {
    const dynamicVars = {}

    if (!step?.metadata?.binary_search) {
      return dynamicVars
    }

    const metadata = step.metadata

    // Determine if this is income or impact binary search
    const isImpactSearch = metadata.base_amount === '{{impact_goal}}'
    const isIncomeSearch = metadata.base_amount === '{{income_goal}}'

    if (isImpactSearch) {
      // Impact goal calculations (people)
      const impactGoalNum = parseImpactGoal(ctx.impact_goal)

      if (metadata.direction === 'doubling' && metadata.multiplier) {
        const amount = impactGoalNum * metadata.multiplier
        dynamicVars[`doubled_impact_${metadata.iteration}`] = formatPeople(amount)
      } else if (metadata.direction === 'halving' && metadata.divisor) {
        const amount = Math.max(
          impactGoalNum / metadata.divisor,
          metadata.min_floor || 10
        )
        dynamicVars[`halved_impact_${metadata.iteration}`] = formatPeople(amount)
      }
    } else if (isIncomeSearch) {
      // Income goal calculations (currency)
      const incomeGoalNum = parseIncomeGoal(ctx.income_goal)

      if (metadata.direction === 'doubling' && metadata.multiplier) {
        const amount = incomeGoalNum * metadata.multiplier
        dynamicVars[`doubled_amount_${metadata.iteration}`] = formatCurrency(amount)
      } else if (metadata.direction === 'halving' && metadata.divisor) {
        const amount = Math.max(
          incomeGoalNum / metadata.divisor,
          metadata.min_floor || 10000
        )
        dynamicVars[`halved_amount_${metadata.iteration}`] = formatCurrency(amount)
      }
    }

    return dynamicVars
  }

  // Find next valid step (skip steps that don't meet conditional)
  const findNextStep = (startIndex, ctx) => {
    let nextIndex = startIndex

    while (nextIndex < flow?.steps?.length) {
      const step = flow.steps[nextIndex]

      // Check if step's conditional is met
      if (evaluateConditional(step.conditional, ctx)) {
        return { step, index: nextIndex }
      }

      nextIndex++
    }

    return { step: null, index: nextIndex }
  }

  // Complete binary search and store discovered limit
  const completeBinarySearch = async (limitAmount, ctx, searchType = 'income') => {
    console.log(`✅ Binary search complete! ${searchType} limit found:`, limitAmount)

    const newContext = { ...ctx }
    let completionStepName
    let limitVarName

    if (searchType === 'impact') {
      newContext.nervous_system_impact_limit = formatPeople(limitAmount)
      completionStepName = 'stage4_triage_1_complete'
      limitVarName = 'nervous_system_impact_limit'
    } else {
      // income
      newContext.nervous_system_income_limit = formatCurrency(limitAmount)
      completionStepName = 'stage4_triage_2_complete'
      limitVarName = 'nervous_system_income_limit'
    }

    setContext(newContext)

    // Find the completion step
    const completionStep = flow?.steps?.find(s => s.step === completionStepName)

    if (completionStep) {
      const completionIndex = flow.steps.indexOf(completionStep)
      let responseText = await resolvePrompt(completionStep, newContext)

      // Replace the limit variable in the response
      responseText = responseText.replace(`{{${limitVarName}}}`, newContext[limitVarName])

      const aiMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: responseText,
        timestamp: new Date().toLocaleTimeString()
      }

      setMessages(prev => [...prev, aiMessage])
      setCurrentIndex(completionIndex)
      setIsInBinarySearchMode(false)
    }
  }

  // Generate contracts based on user context and start contract testing mode
  const startContractTesting = (newContext) => {
    const userContext = {
      impactGoal: newContext.impact_goal,
      incomeGoal: newContext.income_goal,
      struggleArea: newContext.struggle_area,
      noToSafeBeingSeen: newContext.triage_safe_being_seen === 'no',
      noToSafeEarning: newContext.triage_safe_earning === 'no',
      noToSafePursuing: newContext.triage_safe_pursuing === 'no',
      yesToSelfSabotage: newContext.triage_self_sabotage === 'yes',
      yesToFeelsUnsafe: newContext.triage_feels_unsafe === 'yes'
    }

    const selectedContracts = selectSafetyContracts(userContext)
    console.log('📋 Generated contracts:', selectedContracts)

    setContracts(selectedContracts)
    setContractResults({})
    setCurrentContractIndex(0)
    setIsInContractMode(true)

    // Show first contract
    showContractQuestion(selectedContracts, 0)
  }

  // Show a contract question
  const showContractQuestion = (contractList, index) => {
    const contract = contractList[index]
    const questionNumber = index + 1
    const totalContracts = contractList.length

    const aiMessage = {
      id: `ai-${Date.now()}`,
      isAI: true,
      text: `**Safety Contract ${questionNumber} of ${totalContracts}:**\n\n"${contract}"\n\nDid you sway YES or NO?`,
      timestamp: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, aiMessage])
  }

  // Handle contract YES/NO response
  const handleContractResponse = async (response) => {
    const contract = contracts[currentContractIndex]

    // Store the result
    const newResults = { ...contractResults, [contract]: response }
    setContractResults(newResults)

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      isAI: false,
      text: response.toUpperCase(),
      timestamp: new Date().toLocaleTimeString()
    }
    setMessages(prev => [...prev, userMessage])

    // Check if there are more contracts
    const nextContractIndex = currentContractIndex + 1

    if (nextContractIndex < contracts.length) {
      // Show next contract
      setCurrentContractIndex(nextContractIndex)
      setTimeout(() => showContractQuestion(contracts, nextContractIndex), 500)
    } else {
      // All contracts done - exit contract mode and continue flow
      setIsInContractMode(false)

      // Store all results in context
      const newContext = {
        ...context,
        belief_test_results: newResults,
        stage5_contract_tests_complete: true
      }
      setContext(newContext)

      // Move to next step in flow (mirror intro)
      const nextIndex = currentIndex + 1
      const nextStep = flow?.steps?.[nextIndex]

      if (nextStep) {
        const responseText = await resolvePrompt(nextStep, newContext)
        const aiMessage = {
          id: `ai-${Date.now()}`,
          isAI: true,
          text: responseText,
          timestamp: new Date().toLocaleTimeString()
        }
        setMessages(prev => [...prev, aiMessage])
        setCurrentIndex(nextIndex)
      }
    }
  }

  const handleSubmit = async () => {
    console.log('🚀 Nervous System Flow handleSubmit called')
    console.log('Current step:', currentStep?.step)
    console.log('Input text:', inputText)

    if (!currentStep || isLoading || !inputText.trim()) {
      return
    }

    const trimmedInput = inputText.trim()
    setIsLoading(true)

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      isAI: false,
      text: trimmedInput,
      timestamp: new Date().toLocaleTimeString()
    }

    // Update context
    const newContext = { ...context }
    if (currentStep.tag_as) {
      newContext[currentStep.tag_as] = trimmedInput
    }
    if (currentStep.store_as) {
      newContext[currentStep.store_as] = true
    }

    setContext(newContext)
    setMessages(prev => [...prev, userMessage])
    setInputText('')

    // Move to next step
    const nextIndex = currentIndex + 1
    const nextStep = flow?.steps?.[nextIndex]

    if (nextStep) {
      // Add AI response
      const responseText = await resolvePrompt(nextStep, newContext)
      const aiMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: responseText,
        timestamp: new Date().toLocaleTimeString()
      }

      setMessages(prev => [...prev, aiMessage])
      setCurrentIndex(nextIndex)
    } else {
      // Flow completed - save to Supabase
      if (supabase) {
        try {
          console.log('💾 SAVING NERVOUS SYSTEM DATA TO SUPABASE')
          console.log('📤 Sending to Supabase:', newContext)

          // Extract YES contracts for Healing Compass
          const safetyContracts = extractYesContracts(newContext.belief_test_results)

          const { data, error } = await supabase
            .from('nervous_system_responses')
            .insert([{
              user_id: user?.id,
              user_email: user?.email,
              user_name: newContext.user_name || 'Anonymous',
              impact_goal: newContext.impact_goal,
              income_goal: newContext.income_goal,
              nervous_system_impact_limit: newContext.nervous_system_impact_limit,
              nervous_system_income_limit: newContext.nervous_system_income_limit,
              archetype: newContext.archetype,
              positive_change: newContext.positive_change,
              current_struggle: newContext.struggle_area,
              belief_test_results: newContext.belief_test_results,
              safety_contracts: safetyContracts,
              reflection_text: newContext.pattern_mirrored,
              context: newContext
            }])

          if (error) {
            console.error('❌ Supabase error:', error)
            throw error
          }
          console.log('✅ Nervous system data saved successfully:', data)

          // Auto-complete challenge quest if user has active challenge
          if (user?.id) {
            console.log('🎯 Attempting to complete flow quest for nervous_system')
            const questResult = await completeFlowQuest({
              userId: user.id,
              flowId: 'nervous_system',
              pointsEarned: 25
            })

            if (questResult.success) {
              console.log('✅ Quest completed!', questResult.message)
            } else {
              console.log('ℹ️ Quest not completed:', questResult.reason || questResult.error)
            }
          }
        } catch (err) {
          console.error('❌ Failed to save nervous system data:', err)
          // Continue with flow even if save fails
        }
      }

      // Flow completed
      const completionMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        kind: 'completion',
        text: "🎉 Congratulations! You've completed the Nervous System Safety Boundaries flow.\n\nYou've identified safety contracts that may be limiting your flow. The next step is to heal the root cause through the Healing Compass.",
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, completionMessage])

      // Move currentIndex beyond last step to hide options
      setCurrentIndex(flow.steps.length)
    }

    setIsLoading(false)
  }

  const handleOptionClick = async (option) => {
    if (!currentStep || isLoading) return

    const optionValue = option.value || option.label
    setIsLoading(true)

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      isAI: false,
      text: option.label,
      timestamp: new Date().toLocaleTimeString()
    }

    // Update context
    const newContext = { ...context }
    if (currentStep.tag_as) {
      newContext[currentStep.tag_as] = optionValue
    }
    if (currentStep.store_as) {
      newContext[currentStep.store_as] = true
    }

    setContext(newContext)
    setMessages(prev => [...prev, userMessage])

    // Check if this is the contracts intro step - if so, start contract testing mode
    if (currentStep.step === 'stage5_contracts_intro') {
      setIsLoading(false)
      // Small delay before showing first contract
      setTimeout(() => startContractTesting(newContext), 500)
      return
    }

    // Check if current step has navigate_to - if so, save data and navigate
    if (currentStep.navigate_to) {
      console.log('🧭 Step has navigate_to, saving data and navigating to:', currentStep.navigate_to)

      // Save to Supabase before navigating
      if (supabase && user?.id) {
        try {
          console.log('💾 SAVING NERVOUS SYSTEM DATA TO SUPABASE')
          console.log('📤 Sending to Supabase:', newContext)

          // Extract YES contracts for Healing Compass
          const safetyContracts = extractYesContracts(newContext.belief_test_results)

          const { data, error } = await supabase
            .from('nervous_system_responses')
            .insert([{
              user_id: user.id,
              user_email: user?.email,
              user_name: newContext.user_name || 'Anonymous',
              impact_goal: newContext.impact_goal,
              income_goal: newContext.income_goal,
              nervous_system_income_limit: newContext.nervous_system_income_limit,
              archetype: newContext.archetype,
              positive_change: newContext.positive_change,
              current_struggle: newContext.struggle_area,
              belief_test_results: newContext.belief_test_results,
              safety_contracts: safetyContracts,
              reflection_text: newContext.pattern_mirrored,
              context: newContext
            }])

          if (error) {
            console.error('❌ Supabase error:', error)
          } else {
            console.log('✅ Nervous system data saved successfully:', data)
          }

          // Auto-complete challenge quest
          console.log('🎯 Attempting to complete flow quest for nervous_system')
          const questResult = await completeFlowQuest({
            userId: user.id,
            flowId: 'nervous_system',
            pointsEarned: 25
          })

          if (questResult.success) {
            console.log('✅ Quest completed!', questResult.message)
          } else {
            console.log('ℹ️ Quest not completed:', questResult.reason || questResult.error)
          }
        } catch (err) {
          console.error('❌ Failed to save nervous system data:', err)
        }
      }

      setIsLoading(false)
      navigate(currentStep.navigate_to)
      return
    }

    // Check if this is a binary search step and handle accordingly
    if (currentStep?.metadata?.binary_search) {
      const metadata = currentStep.metadata
      const response = optionValue.toLowerCase()

      // Determine if this is impact or income search
      const isImpactSearch = metadata.base_amount === '{{impact_goal}}'
      const searchType = isImpactSearch ? 'impact' : 'income'

      // Parse the appropriate goal value
      const goalNum = isImpactSearch
        ? parseImpactGoal(newContext.impact_goal)
        : parseIncomeGoal(newContext.income_goal)

      const minFloor = isImpactSearch ? 10 : 10000

      // Initial test
      if (metadata.initial_test) {
        console.log(`🔍 Initial ${searchType} binary search test:`, response)

        if (response === 'yes') {
          // Start doubling path
          setBinarySearchDirection('doubling')
          setBinarySearchPreviousYesAmount(goalNum)
        } else {
          // Start halving path
          setBinarySearchDirection('halving')
        }

        setIsInBinarySearchMode(true)
        setBinarySearchIteration(0)
      }
      // Doubling path - testing higher amounts
      else if (metadata.direction === 'doubling') {
        const currentTestAmount = goalNum * metadata.multiplier

        if (response === 'no') {
          // Hit their limit! Previous YES is the limit
          const limit = metadata.previous_yes_amount
          const limitNum = typeof limit === 'string' && limit.startsWith('{{')
            ? (isImpactSearch
                ? parseImpactGoal(newContext[limit.slice(2, -2)])
                : parseIncomeGoal(newContext[limit.slice(2, -2)]))
            : (binarySearchPreviousYesAmount || goalNum)

          await completeBinarySearch(limitNum, newContext, searchType)
          setIsLoading(false)
          return
        } else {
          // They can go higher
          setBinarySearchPreviousYesAmount(currentTestAmount)

          // Check if final iteration
          if (metadata.final_iteration) {
            // They said YES at max iteration - this is their limit
            await completeBinarySearch(currentTestAmount, newContext, searchType)
            setIsLoading(false)
            return
          }
        }
      }
      // Halving path - testing lower amounts
      else if (metadata.direction === 'halving') {
        const currentTestAmount = Math.max(
          goalNum / metadata.divisor,
          metadata.min_floor || minFloor
        )

        if (response === 'yes') {
          // Found their limit!
          await completeBinarySearch(currentTestAmount, newContext, searchType)
          setIsLoading(false)
          return
        } else {
          // Need to go lower
          if (metadata.final_iteration) {
            // Hit floor at final iteration
            await completeBinarySearch(metadata.min_floor || minFloor, newContext, searchType)
            setIsLoading(false)
            return
          }
        }
      }
    }

    // Find next valid step (respecting conditionals)
    const { step: nextStep, index: nextIndex } = findNextStep(currentIndex + 1, newContext)

    if (nextStep) {
      // Calculate dynamic variables for this step
      const dynamicVars = calculateDynamicVariables(nextStep, newContext)

      // Add AI response with dynamic variable replacement
      let responseText = await resolvePrompt(nextStep, { ...newContext, ...dynamicVars })

      // Replace any remaining dynamic variables
      Object.keys(dynamicVars).forEach(key => {
        responseText = responseText.replace(`{{${key}}}`, dynamicVars[key])
      })

      // If this is the mirror reflection step, store the generated text and extract archetype
      if (nextStep.step === 'stage6_mirror_reflection') {
        newContext.pattern_mirrored = responseText
        const archetype = extractArchetype(responseText)
        if (archetype) {
          newContext.archetype = archetype
          console.log('🎭 Extracted archetype:', archetype)
        }
        setContext(newContext)
      }

      const aiMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: responseText,
        timestamp: new Date().toLocaleTimeString()
      }

      setMessages(prev => [...prev, aiMessage])
      setCurrentIndex(nextIndex)
    } else {
      // Flow completed - save to Supabase
      if (supabase) {
        try {
          console.log('💾 SAVING NERVOUS SYSTEM DATA TO SUPABASE')
          console.log('📤 Sending to Supabase:', newContext)

          // Extract YES contracts for Healing Compass
          const safetyContracts = extractYesContracts(newContext.belief_test_results)

          const { data, error } = await supabase
            .from('nervous_system_responses')
            .insert([{
              user_id: user?.id,
              user_email: user?.email,
              user_name: newContext.user_name || 'Anonymous',
              impact_goal: newContext.impact_goal,
              income_goal: newContext.income_goal,
              nervous_system_impact_limit: newContext.nervous_system_impact_limit,
              nervous_system_income_limit: newContext.nervous_system_income_limit,
              archetype: newContext.archetype,
              positive_change: newContext.positive_change,
              current_struggle: newContext.struggle_area,
              belief_test_results: newContext.belief_test_results,
              safety_contracts: safetyContracts,
              reflection_text: newContext.pattern_mirrored,
              context: newContext
            }])

          if (error) {
            console.error('❌ Supabase error:', error)
            throw error
          }
          console.log('✅ Nervous system data saved successfully:', data)

          // Auto-complete challenge quest if user has active challenge
          if (user?.id) {
            console.log('🎯 Attempting to complete flow quest for nervous_system')
            const questResult = await completeFlowQuest({
              userId: user.id,
              flowId: 'nervous_system',
              pointsEarned: 25
            })

            if (questResult.success) {
              console.log('✅ Quest completed!', questResult.message)
            } else {
              console.log('ℹ️ Quest not completed:', questResult.reason || questResult.error)
            }
          }
        } catch (err) {
          console.error('❌ Failed to save nervous system data:', err)
          // Continue with flow even if save fails
        }
      }

      // Flow completed
      const completionMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        kind: 'completion',
        text: "🎉 Congratulations! You've completed the Nervous System Safety Boundaries flow.\n\nYou've identified safety contracts that may be limiting your flow. The next step is to heal the root cause through the Healing Compass.",
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, completionMessage])

      // Move currentIndex beyond last step to hide options
      setCurrentIndex(flow.steps.length)
    }

    setIsLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          {error}
        </div>
      </div>
    )
  }

  if (!flow) {
    return (
      <div className="app">
        <div className="loading">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Nervous System Map</h1>
        <p>Identify your subconscious limits</p>
      </header>

      <main className="chat-container">
        <div className="messages">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.isAI ? 'ai' : 'user'}`}>
              <div className="bubble">
                {message.kind === 'completion' ? (
                  <div className="text">
                    <div dangerouslySetInnerHTML={{ __html: formatMarkdown(message.text) }} />
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Link
                        to="/healing-compass"
                        style={{
                          display: 'inline-block',
                          padding: '12px 24px',
                          backgroundColor: '#5e17eb',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          textAlign: 'center',
                          fontWeight: 500
                        }}
                      >
                        Proceed to Healing Compass
                      </Link>
                      <Link
                        to="/7-day-challenge"
                        style={{
                          display: 'inline-block',
                          padding: '12px 24px',
                          backgroundColor: 'transparent',
                          color: '#5e17eb',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          textAlign: 'center',
                          fontWeight: 500,
                          border: '1px solid #5e17eb'
                        }}
                      >
                        Return to 7-Day Challenge
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text" dangerouslySetInnerHTML={{ __html: formatMarkdown(message.text) }} />
                )}
                <div className="timestamp">{message.timestamp}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message ai">
              <div className="bubble">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Show YES/NO buttons when in contract testing mode */}
      {isInContractMode && (
        <div className="options-container">
          <button
            className="option-button"
            onClick={() => handleContractResponse('yes')}
            disabled={isLoading}
          >
            YES
          </button>
          <button
            className="option-button"
            onClick={() => handleContractResponse('no')}
            disabled={isLoading}
          >
            NO
          </button>
        </div>
      )}

      {/* Show regular options when not in contract mode */}
      {!isInContractMode && currentStep?.options && currentStep.options.length > 0 && (
        <div className="options-container">
          {currentStep.options.map((option, index) => (
            <button
              key={index}
              className="option-button"
              onClick={() => handleOptionClick(option)}
              disabled={isLoading}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {!isInContractMode && currentStep && !currentStep.options && (
        <div className="input-bar">
          <textarea
            className="message-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your thoughts..."
            disabled={isLoading}
            rows={1}
          />
          <button
            className="send-button"
            onClick={handleSubmit}
            disabled={isLoading || !inputText.trim()}
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}

export default NervousSystemFlow
