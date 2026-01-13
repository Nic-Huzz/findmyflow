/**
 * Retargeting Pixel Tracking
 *
 * Tracks events to Meta (Facebook) and LinkedIn pixels for retargeting.
 *
 * SETUP REQUIRED:
 * 1. Add your Meta Pixel ID to VITE_META_PIXEL_ID in .env
 * 2. Add your LinkedIn Partner ID to VITE_LINKEDIN_PARTNER_ID in .env
 * 3. Add pixel scripts to index.html (see comments below)
 */

// ============================================
// CONFIGURATION
// ============================================

// These will be read from environment variables
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID
const LINKEDIN_PARTNER_ID = import.meta.env.VITE_LINKEDIN_PARTNER_ID

// LinkedIn conversion IDs (set these up in LinkedIn Campaign Manager)
const LINKEDIN_CONVERSION_IDS = {
  FlowStarted: null,        // Set after creating conversion
  FlowProgress50: null,
  FlowCompleted: null,
  EmailCaptured: null,
  CTAClicked: null,
  ZarloEngaged: null
}

// ============================================
// PIXEL INITIALIZATION CHECK
// ============================================

function isMetaPixelLoaded() {
  return typeof window !== 'undefined' && typeof window.fbq === 'function'
}

function isLinkedInPixelLoaded() {
  return typeof window !== 'undefined' && typeof window.lintrk === 'function'
}

// ============================================
// TRACKING FUNCTIONS
// ============================================

/**
 * Track an event to all configured pixels
 * @param {string} eventName - Name of the event (e.g., 'FlowCompleted')
 * @param {object} params - Additional parameters
 */
export function trackPixelEvent(eventName, params = {}) {
  // Track to Meta Pixel
  if (isMetaPixelLoaded()) {
    try {
      window.fbq('trackCustom', eventName, {
        ...params,
        source: 'findmyflow_public_flow'
      })
      console.log(`[Meta Pixel] Tracked: ${eventName}`, params)
    } catch (err) {
      console.warn('[Meta Pixel] Error tracking:', err)
    }
  }

  // Track to LinkedIn
  if (isLinkedInPixelLoaded() && LINKEDIN_CONVERSION_IDS[eventName]) {
    try {
      window.lintrk('track', { conversion_id: LINKEDIN_CONVERSION_IDS[eventName] })
      console.log(`[LinkedIn] Tracked: ${eventName}`)
    } catch (err) {
      console.warn('[LinkedIn] Error tracking:', err)
    }
  }

  // Also track to our internal analytics
  if (typeof window !== 'undefined' && window.trackEvent) {
    window.trackEvent(`pixel_${eventName}`, params)
  }
}

/**
 * Track standard Meta events
 */
export function trackMetaStandardEvent(eventName, params = {}) {
  if (isMetaPixelLoaded()) {
    try {
      window.fbq('track', eventName, params)
      console.log(`[Meta Pixel] Standard event: ${eventName}`, params)
    } catch (err) {
      console.warn('[Meta Pixel] Error:', err)
    }
  }
}

// ============================================
// SPECIFIC EVENT HELPERS
// ============================================

/**
 * Track when user starts a flow
 */
export function trackFlowStarted(flowType) {
  trackPixelEvent('FlowStarted', { flow_type: flowType })
  trackMetaStandardEvent('ViewContent', { content_name: flowType })
}

/**
 * Track when user reaches 50% of flow
 */
export function trackFlowProgress50(flowType) {
  trackPixelEvent('FlowProgress50', { flow_type: flowType })
}

/**
 * Track when user completes a flow
 */
export function trackFlowCompleted(flowType, result = {}) {
  trackPixelEvent('FlowCompleted', { flow_type: flowType, ...result })
  trackMetaStandardEvent('CompleteRegistration', {
    content_name: flowType,
    value: 0,
    currency: 'USD'
  })
}

/**
 * Track when email is captured
 */
export function trackEmailCaptured(flowType) {
  trackPixelEvent('EmailCaptured', { flow_type: flowType })
  trackMetaStandardEvent('Lead', { content_name: flowType })
}

/**
 * Track when CTA is clicked
 */
export function trackCTAClicked(flowType, ctaVariant = null) {
  trackPixelEvent('CTAClicked', {
    flow_type: flowType,
    cta_variant: ctaVariant
  })
}

/**
 * Track when user engages with Zarlo
 */
export function trackZarloEngaged(flowType, promptId = null) {
  trackPixelEvent('ZarloEngaged', {
    flow_type: flowType,
    prompt_id: promptId
  })
}

// ============================================
// PIXEL SCRIPT SNIPPETS (Add to index.html)
// ============================================

/*
META PIXEL - Add to <head>:
--------------------------
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_META_PIXEL_ID');
  fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id=YOUR_META_PIXEL_ID&ev=PageView&noscript=1"/>
</noscript>


LINKEDIN INSIGHT TAG - Add to <head>:
-------------------------------------
<script type="text/javascript">
_linkedin_partner_id = "YOUR_LINKEDIN_PARTNER_ID";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
</script>
<script type="text/javascript">
(function(l) {
if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
window.lintrk.q=[]}
var s = document.getElementsByTagName("script")[0];
var b = document.createElement("script");
b.type = "text/javascript";b.async = true;
b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
s.parentNode.insertBefore(b, s);})(window.lintrk);
</script>
<noscript>
<img height="1" width="1" style="display:none;" alt="" src="https://px.ads.linkedin.com/collect/?pid=YOUR_LINKEDIN_PARTNER_ID&fmt=gif" />
</noscript>
*/

export default {
  trackPixelEvent,
  trackFlowStarted,
  trackFlowProgress50,
  trackFlowCompleted,
  trackEmailCaptured,
  trackCTAClicked,
  trackZarloEngaged
}
