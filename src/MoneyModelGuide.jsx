import React from 'react'
import { Link } from 'react-router-dom'
import './MoneyModelGuide.css'

function MoneyModelGuide() {
  const offerTypes = [
    {
      number: 1,
      name: 'Attraction Offers',
      icon: '🧲',
      description: 'Get customers by offering something free or at a discount',
      examples: ['Win Your Money Back', 'Giveaways', 'Decoy Offers', 'Buy X Get Y Free', 'Pay Less Now or Pay More Later'],
      link: '/attraction-offer'
    },
    {
      number: 2,
      name: 'Upsell Offers',
      icon: '⬆️',
      description: 'Offer more, better, or newer versions of what they just bought',
      examples: ['Classic Upsell', 'Menu Upsells', 'Anchor Upsells', 'Rollover Upsells', 'Pick Your Price'],
      link: '/upsell-offer'
    },
    {
      number: 3,
      name: 'Downsell Offers',
      icon: '⬇️',
      description: 'Turn "No" into "Yes" by offering alternative payment or features',
      examples: ['Payment Plan Downsells', 'Trial With Penalty', 'Feature Downsells'],
      link: '/downsell-offer'
    },
    {
      number: 4,
      name: 'Continuity Offers',
      icon: '🔄',
      description: 'Provide ongoing value with recurring payments',
      examples: ['Downsell the Upsell', 'Calculating Back of Napkin LTV', 'Big Head, Long Tail'],
      link: '/continuity-offer'
    }
  ]

  const examples = [
    {
      name: 'Fitness Studio',
      flow: [
        { type: 'Attraction', detail: 'Win Your Money Back' },
        { type: 'Upsell', detail: 'Buy X Get Y' },
        { type: 'Upsell', detail: 'Prepay Time' },
        { type: 'Continuity', detail: 'Continuity Bonus / Rollover Upsell' },
        { type: 'Downsell', detail: 'Free Trial w/ Penalty' },
        { type: 'Upsell', detail: 'Menu Upsell' }
      ]
    },
    {
      name: 'Gym Launch',
      flow: [
        { type: 'Attraction', detail: 'Decoy Offer' },
        { type: 'Upsell', detail: 'Classic Upsell' },
        { type: 'Upsell', detail: 'Menu Upsell into Continuity' },
        { type: 'Downsell', detail: 'Payment Plan' },
        { type: 'Downsell', detail: 'Feature Downsell' },
        { type: 'Downsell', detail: 'Free Trial' }
      ]
    },
    {
      name: 'Newsletter & Consulting',
      flow: [
        { type: 'Attraction', detail: 'Free Trial' },
        { type: 'Upsell', detail: 'Pay Less Now Pay More Later (Past Newsletters)' },
        { type: 'Continuity', detail: 'Continuity Discount (Lifetime Lower Rate)' },
        { type: 'Upsell', detail: 'Classic Upsell (Consulting)' }
      ]
    }
  ]

  const importantNotes = [
    'Perfect one offer at a time',
    'Raise prices in stages',
    'Simple Scales, fancy fails',
    'Affiliate products can fill money model gaps',
    'Turn attraction offers into continuity offers with automatic renewal',
    'You can mix and match however you like - e.g., use an attraction offer as an upsell'
  ]

  return (
    <div className="money-model-guide">
      <div className="guide-header">
        <h1>Make Your Own Money Models</h1>
        <p className="subtitle">Putting it All Together</p>
        <div className="hero-message">
          <p>If just starting out, pick ONE of the money models to inspire you to do something in your business.</p>
          <p>If you are more advanced, consider weaving two together. There are no rules for how you can stack these.</p>
        </div>
      </div>

      <section className="money-model-overview">
        <h2>What is a Money Model?</h2>
        <div className="definition-cards">
          <div className="definition-card">
            <h3>Money Model</h3>
            <p>A series of offers designed to increase how many customers you get, how much they pay, and how fast they pay it.</p>
          </div>
          <div className="definition-card">
            <h3>Good Money Model</h3>
            <p>Makes more profit from a customer than it costs to get and service them in the first thirty days. That's the bare minimum.</p>
          </div>
          <div className="definition-card">
            <h3>$100M Money Model</h3>
            <p>Makes more profit from one customer than it costs to get and service many customers in the first thirty days — removing cash as a limiter to scaling your business.</p>
          </div>
        </div>
      </section>

      <section className="four-steps">
        <h2>Build Your Money Model in 4 Steps</h2>
        <div className="steps-grid">
          {offerTypes.map((offer) => (
            <div key={offer.number} className="step-card">
              <div className="step-number">Step {offer.number}</div>
              <div className="step-icon">{offer.icon}</div>
              <h3>{offer.name}</h3>
              <p className="step-description">{offer.description}</p>
              <div className="examples-list">
                <strong>Examples:</strong>
                <ul>
                  {offer.examples.map((ex, idx) => (
                    <li key={idx}>{ex}</li>
                  ))}
                </ul>
              </div>
              <Link to={offer.link} className="take-assessment-btn">
                Take {offer.name} Assessment
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="result-section">
        <h2>The Result</h2>
        <div className="result-box">
          <p>Get your cash back in 30 days, get more customers, make more money, win.</p>
        </div>
      </section>

      <section className="examples-section">
        <h2>Real Money Model Examples</h2>
        <div className="examples-grid">
          {examples.map((example, idx) => (
            <div key={idx} className="example-card">
              <h3>{example.name}</h3>
              <div className="flow-diagram">
                {example.flow.map((step, stepIdx) => (
                  <div key={stepIdx} className="flow-step">
                    <span className={`flow-type flow-${step.type.toLowerCase()}`}>
                      {step.type}
                    </span>
                    <span className="flow-detail">{step.detail}</span>
                    {stepIdx < example.flow.length - 1 && <span className="flow-arrow">→</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="important-notes">
        <h2>Important Notes</h2>
        <div className="notes-grid">
          {importantNotes.map((note, idx) => (
            <div key={idx} className="note-card">
              <span className="note-icon">💡</span>
              <p>{note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="key-insight">
        <h2>Key Insight</h2>
        <div className="insight-box">
          <p>The possibilities are <strong>endless</strong>!</p>
          <p className="insight-subtext">
            KEY: Upfront Cash + Continuity + Upsell + Downsell
          </p>
        </div>
      </section>

      <section className="build-stages">
        <h2>Building One Stage at a Time</h2>
        <div className="stages-content">
          <p>Once I get customers reliably, <strong>then</strong> I make sure they pay for themselves reliably, <strong>then</strong> I make sure they pay for other customers reliably, <strong>then</strong> I start maximizing each customer's long term value. <strong>Then</strong>, I print as much money as I can.</p>
        </div>
      </section>

      <section className="final-words">
        <h2>Final Words from $100M Leads</h2>
        <div className="final-message">
          <p>The knowledge in these bullets brought me more free and profitable customers than I've known what to do with. If executed, they will do the same for you. And with that, cash will no longer constrain your business.</p>
          <p className="emphasis">Set audacious goals. Keep improving. Learn from failure. Repeat.</p>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Build Your Money Model?</h2>
        <p>Start by taking each assessment to discover which specific offer types work best for your business.</p>
        <div className="cta-buttons">
          <Link to="/attraction-offer" className="cta-button attraction">
            Start with Attraction Offers
          </Link>
          <Link to="/upsell-offer" className="cta-button upsell">
            Explore Upsell Offers
          </Link>
          <Link to="/downsell-offer" className="cta-button downsell">
            Discover Downsell Offers
          </Link>
          <Link to="/continuity-offer" className="cta-button continuity">
            Learn Continuity Offers
          </Link>
        </div>
      </section>
    </div>
  )
}

export default MoneyModelGuide
