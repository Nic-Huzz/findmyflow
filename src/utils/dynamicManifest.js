// Dynamic manifest generator for PWA
// This allows "Add to Home Screen" to remember the current page URL

export const updateManifestForCurrentPage = () => {
  // Get the current page path and origin
  const currentPath = window.location.pathname + window.location.search
  const origin = window.location.origin

  // Create dynamic manifest with absolute URLs
  const manifest = {
    name: "Find My Flow",
    short_name: "FindMyFlow",
    description: "Complete your 7-Day Challenge and unlock your flow state",
    start_url: `${origin}${currentPath || "/"}`,
    scope: `${origin}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6366f1",
    orientation: "portrait-primary",
    icons: [
      {
        src: `${origin}/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: `${origin}/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    categories: ["health", "lifestyle", "productivity"],
    prefer_related_applications: false
  }

  // Convert to JSON blob
  const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' })
  const manifestURL = URL.createObjectURL(manifestBlob)

  // Update or create manifest link
  let manifestLink = document.querySelector('link[rel="manifest"]')

  if (manifestLink) {
    // Revoke old URL if it was a blob
    if (manifestLink.href.startsWith('blob:')) {
      URL.revokeObjectURL(manifestLink.href)
    }
    manifestLink.href = manifestURL
  } else {
    manifestLink = document.createElement('link')
    manifestLink.rel = 'manifest'
    manifestLink.href = manifestURL
    document.head.appendChild(manifestLink)
  }

  console.log('📱 Dynamic manifest updated for:', currentPath)
}
