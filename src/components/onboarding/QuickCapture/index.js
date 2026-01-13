/**
 * QuickCapture/index.js
 * Barrel export for QuickCapture components
 */

export { default as WheelPicker } from './WheelPicker'
export { default as DeliverySelector, CATEGORY_OPTIONS, PRODUCT_TYPES, PRODUCT_SUBTYPES } from './DeliverySelector'
export { default as ProductCard } from './ProductCard'
export { default as MultiProductCapture } from './MultiProductCapture'
export { default as QuickCapture } from './QuickCapture'

// Re-export wheel data from taxonomy lib
export {
  SKILLS_SEGMENTS,
  PROBLEM_SEGMENTS,
  PERSONA_SEGMENTS,
  PROFICIENCY_RINGS,
  PROBLEMS_PROFICIENCY_RINGS,
  JOURNEY_STAGES
} from '../../../lib/wheelTaxonomy'
