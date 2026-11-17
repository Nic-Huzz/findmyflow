/**
 * stemProcessing.js — AI processing of stem transcripts via edge function.
 */
import { supabase } from './supabaseClient'

/**
 * Process stage transcripts through Claude.
 * @param {number} stage - 1, 2, 3, 4, 5, or 6
 * @param {Array<{ stemId: string, stemText: string, transcript: string }>} transcripts
 * @param {object} context - { selectedExpression?, confirmedPrediction?, activities?, funActivities? }
 * @returns {Promise<object>} Stage-specific results
 */
export async function processStage(stage, transcripts, context = {}) {
  const { data, error } = await supabase.functions.invoke('process-stems', {
    body: { stage, transcripts, ...context },
  })

  if (error) {
    throw new Error(error.message || 'AI processing failed')
  }

  return data
}
