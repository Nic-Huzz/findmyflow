/**
 * Welcome - Opening screen for OfferBuilder100M
 *
 * Introduces the $100M Offers framework and sets expectations.
 */

function Welcome({ onContinue }) {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <div className="welcome-icon">🎯</div>
        <h1>Let's Build Your Grand Slam Offer</h1>

        <div className="welcome-text">
          <p>
            Before you build anything, we need to create an offer
            <strong> so compelling that people feel stupid saying no.</strong>
          </p>

          <p>
            This is based on Alex Hormozi's <em>$100M Offers</em> framework —
            the same system used to build multiple 8-figure businesses.
          </p>

          <div className="framework-preview">
            <h3>What we'll create together:</h3>
            <ul>
              <li>💰 Your dream outcome (in customer language)</li>
              <li>📦 3 delivery versions to compare (Product/Service/Hybrid)</li>
              <li>✅ Proof stacks that eliminate doubt</li>
              <li>⚡ Speed advantages that create urgency</li>
              <li>🧘 Ease factors that remove friction</li>
              <li>🎁 Bonuses that handle every objection</li>
              <li>🏆 A "Grand Slam Score" for your final offer</li>
            </ul>
          </div>
        </div>

        <p className="ready-prompt">Ready? Let's start with the most important question...</p>

        <button className="primary-button" onClick={onContinue}>
          Let's Go →
        </button>
      </div>
    </div>
  )
}

export default Welcome
