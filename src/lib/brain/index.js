/**
 * Creator Brain — unified context engine for experience creators
 *
 * Usage:
 *   import { getCreatorBrain, updateBrainFields, getBrainContext } from '../lib/brain'
 *
 * For AI features:
 *   const { contextPrompt } = await getCreatorBrain(userId)
 *   // or for specific domains:
 *   const voiceContext = await getBrainContext(userId, ['voice', 'offer'])
 *
 * For flow completion hooks:
 *   await updateBrainFields(userId, {
 *     'identity.scope_position': { value: 'stream', source: 'flow', evidence: 'Scope Map result' },
 *   })
 */

// Service (main API)
export {
  getCreatorBrain,
  getBrainContext,
  updateBrainFields,
  updateBrainField,
  confirmBrainField,
  skipBrainField,
  getBrainStats,
} from './brainService'

// Merge logic (for advanced use / testing)
export { mergeField, mergeBatch, emptyField, proposedField } from './mergeBrain'

// Markdown generation
export { regenerateAllMarkdown, regenerateDomainMarkdown, generateContextPrompt } from './regenerateMarkdown'

// Auto-populate hooks (call from flow completion handlers)
export {
  onScopeMapComplete,
  onEssenceMirrorComplete,
  onCreatorMatchingComplete,
  onPlayProfileComplete,
  onRemarkableComplete,
  onNervousSystemComplete,
  onPayRentComplete,
  onCreatorAssessmentComplete,
  onLifeMapComplete,
  onWoundMapComplete,
  onBeliefRewireComplete,
  onJourneyLevelChange,
} from './autoPopulate'

// Field definitions
export {
  CANONICAL_FIELDS,
  DOMAINS,
  DOMAIN_LABELS,
  groupFieldsByDomain,
  getCanonicalField,
  getFieldsForDomain,
  getSectionsForDomain,
} from './canonicalFields'
