/**
 * stemProcessing.js — AI processing of stem transcripts via edge function.
 */
import { supabase } from './supabaseClient'

/**
 * Process stage transcripts through Claude.
 * @param {number} stage - 1, 2, or 3
 * @param {Array<{ stemId: string, stemText: string, transcript: string }>} transcripts
 * @param {object} context - { selectedExpression?, confirmedPrediction? }
 * @returns {Promise<object>} Stage-specific results
 */
export async function processStage(stage, transcripts, context = {}) {
  const { data, error } = await supabase.functions.invoke('process-stems', {
    body: {
      stage,
      transcripts,
      selectedExpression: context.selectedExpression || null,
      confirmedPrediction: context.confirmedPrediction || null,
    },
  })

  if (error) {
    throw new Error(error.message || 'AI processing failed')
  }

  return data
}
