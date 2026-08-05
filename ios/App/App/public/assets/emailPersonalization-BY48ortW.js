const b=`
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
`;function u(o){const{offerName:t,confidence:e,flowType:n,funnelSteps:g,allScores:r}=o,s=e>=70?"Excellent Fit":e>=55?"Strong Fit":"Good Fit",c=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});return`
    <div class="pdf-container">
      <div class="pdf-header">
        <div class="pdf-logo">Find My Flow</div>
        <div class="pdf-subtitle">Your Personalized Business Strategy</div>
      </div>

      <h1 class="pdf-title">Your ${n} Strategy Results</h1>
      <p class="pdf-date">Generated on ${c}</p>

      <div class="pdf-highlight-box">
        <div class="pdf-highlight-name">${t}</div>
        <div class="pdf-highlight-desc">${s} - ${e}% Match</div>
      </div>

      ${g?`
        <div class="pdf-section">
          <h2 class="pdf-section-title">📊 Your Recommended Funnel Structure</h2>
          <ul class="pdf-list">
            ${g.map(l=>`<li>${l}</li>`).join("")}
          </ul>
        </div>
      `:""}

      ${r&&r.length>1?`
        <div class="pdf-section">
          <h2 class="pdf-section-title">📈 All Strategy Scores</h2>
          ${r.slice(0,5).map(l=>`
            <div class="pdf-stat">
              <span class="pdf-stat-label">${l.name}</span>
              <span class="pdf-stat-value">${l.confidence}%</span>
            </div>
          `).join("")}
        </div>
      `:""}

      <div class="pdf-section">
        <h2 class="pdf-section-title">🎯 Next Steps</h2>
        <ul class="pdf-list">
          <li>Review your recommended strategy in detail</li>
          <li>Complete the full Find My Flow journey to build your business</li>
          <li>Work through the 7-day challenge to put this into action</li>
        </ul>
      </div>

      <div class="pdf-footer">
        <p>Ready to bring this to life?</p>
        <a href="https://viberise.nichuzz.com" class="pdf-cta">Continue Your Journey</a>
        <p style="margin-top: 24px;">Based on Alex Hormozi's $100M Offers framework</p>
        <p>© ${new Date().getFullYear()} Find My Flow | viberise.nichuzz.com</p>
      </div>
    </div>
  `}function y(o){const{archetype:t,archetypeDescription:e,beingSeenEdge:n,earningEdge:g,coreFear:r,fearInterpretation:s,rewiringNeeded:c,activeContracts:l,warningSigns:d=[]}=o,p=a=>a>=1e6?`${(a/1e6).toFixed(1).replace(/\.0$/,"")}M`:a>=1e3?`${(a/1e3).toFixed(0)}K`:a,i=a=>a>=1e6?`$${(a/1e6).toFixed(1).replace(/\.0$/,"")}M`:a>=1e3?`$${(a/1e3).toFixed(0)}K`:`$${a}`;return`
    <div class="pdf-container">
      <div class="pdf-header">
        <div class="pdf-logo">Find My Flow</div>
        <div class="pdf-subtitle">Nervous System Calibration</div>
      </div>

      <h1 class="pdf-title">Your Nervous System Map</h1>
      <p class="pdf-date">Generated on ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</p>

      <div class="pdf-highlight-box">
        <div class="pdf-highlight-name">🌟 ${t}</div>
        <div class="pdf-highlight-desc">${e}</div>
      </div>

      <div class="pdf-section">
        <h2 class="pdf-section-title">📊 Your Nervous System Limits</h2>
        <div class="pdf-stat">
          <span class="pdf-stat-label">💰 Safe to earn up to</span>
          <span class="pdf-stat-value">${i(g)}/year</span>
        </div>
        <div class="pdf-stat">
          <span class="pdf-stat-label">👥 Safe being visible to</span>
          <span class="pdf-stat-value">${p(n)} people</span>
        </div>
      </div>

      ${r?`
        <div class="pdf-section" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3);">
          <h2 class="pdf-section-title" style="color: #fca5a5;">🔍 Primary Limiting Belief</h2>
          <p style="font-style: italic; font-size: 18px; margin-bottom: 16px;">"${r}"</p>
          ${s?`<p style="color: rgba(255,255,255,0.8);">${s}</p>`:""}
        </div>
      `:""}

      ${l&&l.length>0?`
        <div class="pdf-section">
          <h2 class="pdf-section-title">⚠️ Active Safety Contracts</h2>
          <ul class="pdf-list">
            ${l.map(a=>`<li>"${a}"</li>`).join("")}
          </ul>
        </div>
      `:""}

      ${c?`
        <div class="pdf-section" style="background: rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.3);">
          <h2 class="pdf-section-title" style="color: #c4b5fd;">✨ What Needs Rewiring</h2>
          <p style="white-space: pre-line; line-height: 1.6;">${c}</p>
        </div>
      `:""}

      ${d&&d.length>0?`
        <div class="pdf-section" style="background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3);">
          <h2 class="pdf-section-title" style="color: #fbbf24;">⚠️ Watch For These Patterns</h2>
          ${d.map(a=>`
            <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <h3 style="font-size: 16px; margin-bottom: 8px;">${a.icon} ${a.title}</h3>
              <p style="font-size: 14px; color: rgba(255,255,255,0.8); margin-bottom: 12px; line-height: 1.5;">${a.description}</p>
              ${a.triggers?`
                <p style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">Common triggers:</p>
                <ul style="margin: 0 0 12px 16px; font-size: 13px; color: rgba(255,255,255,0.7);">
                  ${a.triggers.map(h=>`<li>${h}</li>`).join("")}
                </ul>
              `:""}
              ${a.practice?`
                <div style="background: rgba(139, 92, 246, 0.15); padding: 12px; border-radius: 8px;">
                  <p style="font-size: 12px; color: #c4b5fd; margin-bottom: 4px;">Practice:</p>
                  <p style="font-size: 13px; color: rgba(255,255,255,0.85); margin: 0; line-height: 1.5;">${a.practice}</p>
                </div>
              `:""}
            </div>
          `).join("")}
        </div>
      `:""}

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
        <p style="margin-top: 24px;">© ${new Date().getFullYear()} Find My Flow | viberise.nichuzz.com</p>
      </div>
    </div>
  `}function x(o,t="Find My Flow Results"){const e=window.open("","_blank","width=800,height=600");if(!e){alert("Please allow popups to download your PDF");return}e.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${t}</title>
      <style>${b}</style>
    </head>
    <body>
      <div class="pdf-content">
        ${o}
      </div>
      <script>
        // Auto-trigger print dialog
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      <\/script>
    </body>
    </html>
  `),e.document.close()}function v(o,t,e,n){var l;const r=((o==null?void 0:o.split("@")[0])||"").replace(/[._-]/g," ").split(" ").map(d=>d.charAt(0).toUpperCase()+d.slice(1).toLowerCase()).join(" "),s={attraction_offer:"Attraction Offer",upsell:"Upsell",downsell:"Downsell",continuity:"Continuity",leads_strategy:"Lead Generation",lead_magnet:"Lead Magnet"},c=[];return e&&Object.entries(e).forEach(([d,p])=>{p!=null&&p.label&&(d.includes("strength")||d.includes("best"))&&c.push(p.label)}),{name:r||"there",email:o,offer_type:s[t]||t,recommended_offer:((l=n==null?void 0:n.offer)==null?void 0:l.name)||"your offer",confidence:n!=null&&n.confidence?Math.round(n.confidence*100):null,key_strengths:c.slice(0,3),income_range:"$5K-20K/month",flow_completed_at:new Date().toISOString()}}function m(o,t,e){const g=((o==null?void 0:o.split("@")[0])||"").replace(/[._-]/g," ").split(" ").map(i=>i.charAt(0).toUpperCase()+i.slice(1).toLowerCase()).join(" "),r=i=>i?i>=1e6?`$${(i/1e6).toFixed(1).replace(/\.0$/,"")}M`:i>=1e3?`$${(i/1e3).toFixed(0)}K`:`$${i}`:"$100K",s=i=>i?i>=1e6?`${(i/1e6).toFixed(1).replace(/\.0$/,"")}M`:i>=1e3?`${(i/1e3).toFixed(0)}K`:i.toString():"1,000",c=t!=null&&t.impact_goal?parseInt(t.impact_goal.replace(/[^0-9]/g,""))-(t.being_seen_edge||0):0,l=t!=null&&t.income_goal?parseInt(t.income_goal.replace(/[^0-9]/g,""))-(t.earning_edge||0):0,d=c>l?"visibility":"earning",p=t!=null&&t.contracts_tested?Object.entries(t.contracts_tested).filter(([i,f])=>f==="yes").map(([i])=>i):[];return{name:g||"there",email:o,archetype:(e==null?void 0:e.archetype_name)||"Protective Pattern",archetype_description:(e==null?void 0:e.archetype_description)||"",edge_visibility:s(t==null?void 0:t.being_seen_edge),edge_earning:r(t==null?void 0:t.earning_edge),edge_type:d,core_fear:(e==null?void 0:e.core_fear)||"",active_contracts:p.slice(0,3),impact_goal:(t==null?void 0:t.impact_goal)||"",income_goal:(t==null?void 0:t.income_goal)||"",flow_completed_at:new Date().toISOString()}}export{y as a,m as b,x as d,v as e,u as g};
