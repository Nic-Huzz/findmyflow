/**
 * LeadsStrategyFlow - Lead generation strategy assessment flow
 *
 * Thin wrapper around MoneyModelFlowBase with flow-specific configuration.
 */

import MoneyModelFlowBase from './MoneyModelFlowBase'
import { MONEY_MODEL_CONFIGS } from './moneyModelConfigs'
import '../LeadsStrategyFlow.css'

function LeadsStrategyFlow() {
  const config = MONEY_MODEL_CONFIGS.leadsStrategy

  const welcomeContent = (
    <>
      <p><strong>The Core Four lead generation strategies:</strong></p>
      <p>Every successful business uses one or more of these proven methods to attract customers...</p>
      <p><strong>1. Warm Outreach</strong> - Tap into your existing network</p>
      <p><strong>2. Cold Outreach</strong> - Reach strangers who match your ideal customer</p>
      <p><strong>3. Post Free Content</strong> - Attract audiences through valuable content</p>
      <p><strong>4. Run Paid Ads</strong> - Invest to reach cold audiences at scale</p>
      <p>But which strategy is right for YOUR situation?</p>
      <p>With the right strategy you will build a predictable pipeline of qualified leads.</p>
      <p className="welcome-cta-text">Answer 10 quick questions and I'll recommend the perfect lead generation strategy for your resources, skills, and goals.</p>
    </>
  )

  return (
    <MoneyModelFlowBase
      config={config}
      welcomeContent={welcomeContent}
    />
  )
}

export default LeadsStrategyFlow
