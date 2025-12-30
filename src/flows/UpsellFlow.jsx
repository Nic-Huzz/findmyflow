/**
 * UpsellFlow - Upsell strategy assessment flow
 *
 * Thin wrapper around MoneyModelFlowBase with flow-specific configuration.
 */

import MoneyModelFlowBase from './MoneyModelFlowBase'
import { MONEY_MODEL_CONFIGS } from './moneyModelConfigs'
import '../UpsellFlow.css'

function UpsellFlow() {
  const config = MONEY_MODEL_CONFIGS.upsell

  const welcomeContent = (
    <>
      <p><strong>Ready to multiply your revenue with the right upsell?</strong></p>
      <p>Every customer who buys from you is a potential upsell opportunity. But most businesses leave massive profit on the table by using the wrong upsell strategy.</p>
      <p>There are 4 proven upsell models that work... the following 10 questions will decide which is best for you.</p>
      <p>The right upsell? You'll boost profit per sale, increase LTV, and delight customers.</p>
    </>
  )

  return (
    <MoneyModelFlowBase
      config={config}
      welcomeContent={welcomeContent}
    />
  )
}

export default UpsellFlow
