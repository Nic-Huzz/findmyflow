/**
 * ContinuityFlow - Continuity model assessment flow
 *
 * Thin wrapper around MoneyModelFlowBase with flow-specific configuration.
 */

import MoneyModelFlowBase from './MoneyModelFlowBase'
import { MONEY_MODEL_CONFIGS } from './moneyModelConfigs'
import '../ContinuityFlow.css'

function ContinuityFlow() {
  const config = MONEY_MODEL_CONFIGS.continuity

  const welcomeContent = (
    <>
      <p><strong>Ready to build predictable, recurring revenue?</strong></p>
      <p>Continuity offers provide ongoing value that customers make ongoing payments for—until they cancel.</p>
      <p>They boost profit from every customer and give you one last thing to sell.</p>
      <p>But not all continuity models work for every business...</p>
      <p>Some work best with high-value bonuses. Others use commitment discounts. Some waive setup fees. Others downsell upsells.</p>
      <p>Finding the right model will create predictable revenue, higher lifetime value, and a more valuable business.</p>
      <p className="welcome-cta-text">Answer 10 quick questions and I'll recommend the perfect continuity model for your business.</p>
    </>
  )

  return (
    <MoneyModelFlowBase
      config={config}
      welcomeContent={welcomeContent}
    />
  )
}

export default ContinuityFlow
