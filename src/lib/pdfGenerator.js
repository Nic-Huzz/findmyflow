/**
 * PDF Generator for Flow Results
 *
 * Generates printable/downloadable PDFs of flow results
 * using browser's print-to-PDF functionality.
 */

// Branded styling for the PDF
const PDF_STYLES = `
  @media print {
    body * {
      visibility: hidden;
    }
    .pdf-content, .pdf-content * {
      visibility: visible;
    }
    .pdf-content {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
  }

  .pdf-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    color: white;
    padding: 40px;
    min-height: 100vh;
  }

  .pdf-header {
    text-align: center;
    border-bottom: 2px solid rgba(251, 191, 36, 0.3);
    padding-bottom: 24px;
    margin-bottom: 32px;
  }

  .pdf-logo {
    font-size: 28px;
    font-weight: 700;
    color: #fbbf24;
    margin-bottom: 8px;
  }

  .pdf-subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }

  .pdf-title {
    font-size: 32px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 8px;
    color: white;
  }

  .pdf-date {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    margin-bottom: 40px;
  }

  .pdf-section {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .pdf-section-title {
    font-size: 18px;
    font-weight: 600;
    color: #fbbf24;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pdf-highlight-box {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.05));
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    text-align: center;
  }

  .pdf-highlight-name {
    font-size: 28px;
    font-weight: 700;
    color: #fbbf24;
    margin-bottom: 8px;
  }

  .pdf-highlight-desc {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.6;
  }

  .pdf-stat {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .pdf-stat:last-child {
    border-bottom: none;
  }

  .pdf-stat-label {
    color: rgba(255, 255, 255, 0.7);
  }

  .pdf-stat-value {
    font-weight: 600;
    color: #fbbf24;
  }

  .pdf-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .pdf-list li {
    padding: 8px 0;
    padding-left: 24px;
    position: relative;
    color: rgba(255, 255, 255, 0.85);
  }

  .pdf-list li::before {
    content: "→";
    position: absolute;
    left: 0;
    color: #fbbf24;
  }

  .pdf-footer {
    text-align: center;
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
  }

  .pdf-cta {
    background: #fbbf24;
    color: #1a1a2e;
    padding: 16px 32px;
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
    display: inline-block;
    margin-top: 16px;
  }
`

/**
 * Generate Money Model PDF content
 */
export function generateMoneyModelPdf(results) {
  const { offerName, confidence, flowType, funnelSteps, allScores } = results

  const confidenceLabel = confidence >= 70 ? 'Excellent Fit' :
                          confidence >= 55 ? 'Strong Fit' : 'Good Fit'

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
    <div class="pdf-container">
      <div class="pdf-header">
        <div class="pdf-logo">Vibe Rise</div>
        <div class="pdf-subtitle">Your Personalized Business Strategy</div>
      </div>

      <h1 class="pdf-title">Your ${flowType} Strategy Results</h1>
      <p class="pdf-date">Generated on ${date}</p>

      <div class="pdf-highlight-box">
        <div class="pdf-highlight-name">${offerName}</div>
        <div class="pdf-highlight-desc">${confidenceLabel} - ${confidence}% Match</div>
      </div>

      ${funnelSteps ? `
        <div class="pdf-section">
          <h2 class="pdf-section-title">📊 Your Recommended Funnel Structure</h2>
          <ul class="pdf-list">
            ${funnelSteps.map(step => `<li>${step}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${allScores && allScores.length > 1 ? `
        <div class="pdf-section">
          <h2 class="pdf-section-title">📈 All Strategy Scores</h2>
          ${allScores.slice(0, 5).map(score => `
            <div class="pdf-stat">
              <span class="pdf-stat-label">${score.name}</span>
              <span class="pdf-stat-value">${score.confidence}%</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="pdf-section">
        <h2 class="pdf-section-title">🎯 Next Steps</h2>
        <ul class="pdf-list">
          <li>Review your recommended strategy in detail</li>
          <li>Complete the full Vibe Rise journey to build your business</li>
          <li>Work through the 7-day challenge to put this into action</li>
        </ul>
      </div>

      <div class="pdf-footer">
        <p>Ready to bring this to life?</p>
        <a href="https://viberise.nichuzz.com" class="pdf-cta">Continue Your Journey</a>
        <p style="margin-top: 24px;">Based on Alex Hormozi's $100M Offers framework</p>
        <p>© ${new Date().getFullYear()} Vibe Rise | viberise.nichuzz.com</p>
      </div>
    </div>
  `
}

/**
 * Generate Nervous System PDF content
 */
export function generateNervousSystemPdf(results) {
  const {
    archetype,
    archetypeDescription,
    beingSeenEdge,
    earningEdge,
    coreFear,
    fearInterpretation,
    rewiringNeeded,
    activeContracts,
    warningSigns = []
  } = results

  const formatPeople = (num) => num >= 1000000 ? `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M` : num >= 1000 ? `${(num / 1000).toFixed(0)}K` : num
  const formatMoney = (num) => num >= 1000000 ? `$${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M` : num >= 1000 ? `$${(num / 1000).toFixed(0)}K` : `$${num}`

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
    <div class="pdf-container">
      <div class="pdf-header">
        <div class="pdf-logo">Vibe Rise</div>
        <div class="pdf-subtitle">Nervous System Calibration</div>
      </div>

      <h1 class="pdf-title">Your Nervous System Map</h1>
      <p class="pdf-date">Generated on ${date}</p>

      <div class="pdf-highlight-box">
        <div class="pdf-highlight-name">🌟 ${archetype}</div>
        <div class="pdf-highlight-desc">${archetypeDescription}</div>
      </div>

      <div class="pdf-section">
        <h2 class="pdf-section-title">📊 Your Nervous System Limits</h2>
        <div class="pdf-stat">
          <span class="pdf-stat-label">💰 Safe to earn up to</span>
          <span class="pdf-stat-value">${formatMoney(earningEdge)}/year</span>
        </div>
        <div class="pdf-stat">
          <span class="pdf-stat-label">👥 Safe being visible to</span>
          <span class="pdf-stat-value">${formatPeople(beingSeenEdge)} people</span>
        </div>
      </div>

      ${coreFear ? `
        <div class="pdf-section" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3);">
          <h2 class="pdf-section-title" style="color: #fca5a5;">🔍 Primary Limiting Belief</h2>
          <p style="font-style: italic; font-size: 18px; margin-bottom: 16px;">"${coreFear}"</p>
          ${fearInterpretation ? `<p style="color: rgba(255,255,255,0.8);">${fearInterpretation}</p>` : ''}
        </div>
      ` : ''}

      ${activeContracts && activeContracts.length > 0 ? `
        <div class="pdf-section">
          <h2 class="pdf-section-title">⚠️ Active Safety Contracts</h2>
          <ul class="pdf-list">
            ${activeContracts.map(contract => `<li>"${contract}"</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${rewiringNeeded ? `
        <div class="pdf-section" style="background: rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.3);">
          <h2 class="pdf-section-title" style="color: #c4b5fd;">✨ What Needs Rewiring</h2>
          <p style="white-space: pre-line; line-height: 1.6;">${rewiringNeeded}</p>
        </div>
      ` : ''}

      ${warningSigns && warningSigns.length > 0 ? `
        <div class="pdf-section" style="background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3);">
          <h2 class="pdf-section-title" style="color: #fbbf24;">⚠️ Watch For These Patterns</h2>
          ${warningSigns.map(warning => `
            <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <h3 style="font-size: 16px; margin-bottom: 8px;">${warning.icon} ${warning.title}</h3>
              <p style="font-size: 14px; color: rgba(255,255,255,0.8); margin-bottom: 12px; line-height: 1.5;">${warning.description}</p>
              ${warning.triggers ? `
                <p style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">Common triggers:</p>
                <ul style="margin: 0 0 12px 16px; font-size: 13px; color: rgba(255,255,255,0.7);">
                  ${warning.triggers.map(t => `<li>${t}</li>`).join('')}
                </ul>
              ` : ''}
              ${warning.practice ? `
                <div style="background: rgba(139, 92, 246, 0.15); padding: 12px; border-radius: 8px;">
                  <p style="font-size: 12px; color: #c4b5fd; margin-bottom: 4px;">Practice:</p>
                  <p style="font-size: 13px; color: rgba(255,255,255,0.85); margin: 0; line-height: 1.5;">${warning.practice}</p>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="pdf-section">
        <h2 class="pdf-section-title">🎯 Next Steps</h2>
        <ul class="pdf-list">
          <li>Acknowledge these patterns without judgment</li>
          <li>Use the Healing Compass to work through active contracts</li>
          <li>Practice expanding your safety edges gradually</li>
          <li>Join the 7-day challenge for guided rewiring exercises</li>
        </ul>
      </div>

      <div class="pdf-footer">
        <p>Ready to expand your edges?</p>
        <a href="https://viberise.nichuzz.com" class="pdf-cta">Continue Your Journey</a>
        <p style="margin-top: 24px;">© ${new Date().getFullYear()} Vibe Rise | viberise.nichuzz.com</p>
      </div>
    </div>
  `
}

/**
 * Open print dialog with PDF content
 */
export function downloadResultsPdf(htmlContent, title = 'Vibe Rise Results') {
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600')

  if (!printWindow) {
    alert('Please allow popups to download your PDF')
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>${PDF_STYLES}</style>
    </head>
    <body>
      <div class="pdf-content">
        ${htmlContent}
      </div>
      <script>
        // Auto-trigger print dialog
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `)

  printWindow.document.close()
}

export default {
  generateMoneyModelPdf,
  generateNervousSystemPdf,
  downloadResultsPdf
}
