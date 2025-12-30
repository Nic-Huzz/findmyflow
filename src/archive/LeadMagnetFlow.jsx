/**
 * LeadMagnetFlow - Lead magnet type assessment flow
 *
 * Thin wrapper around MoneyModelFlowBase with flow-specific configuration.
 */

import MoneyModelFlowBase from './MoneyModelFlowBase'
import { MONEY_MODEL_CONFIGS } from './moneyModelConfigs'
import '../LeadMagnetFlow.css'

function LeadMagnetFlow() {
  const config = MONEY_MODEL_CONFIGS.leadMagnet

  const welcomeContent = (
    <>
      <p><strong>A lead magnet's job is simple: build trust so potential customers believe your solution solves their problem.</strong></p>
      <p>The right lead magnet proves your value and demonstrates expertise so you convert more leads into customers.</p>
      <p>There are 3 proven lead magnet types that work best:</p>
      <p><strong>1. Reveal Problem</strong> - Help prospects discover what's wrong</p>
      <p><strong>2. Free Trial</strong> - Let them experience your solution</p>
      <p><strong>3. Free Step 1</strong> - Give them a quick win upfront</p>
      <p>But which type matches your offer, skills, and resources?</p>
      <p>With the right lead magnet you will attract qualified prospects who are ready to buy.</p>
      <p className="welcome-cta-text">Answer 10 quick questions and I'll recommend the perfect lead magnet type for your business.</p>
    </>
  )

  return (
    <MoneyModelFlowBase
      config={config}
      welcomeContent={welcomeContent}
    />
  )
}

export default LeadMagnetFlow
