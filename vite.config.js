import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isCreator = process.env.VITE_APP_MODE === 'creator'

function creatorBrandPlugin() {
  const replacements = [
    // Icons
    [/href="\/icon-192\.png"/g, 'href="/icon-creator-192.png"'],
    // Manifest
    ['href="/manifest.json"', 'href="/manifest-creator.json"'],
    // Title
    [/<title>.*?<\/title>/, '<title>Scale — Where Experience Creators Grow</title>'],
    // Meta description
    ['content="Safety × Expression = experiences you love. Find My Flow helps you live your ikigai, tracks your aliveness, and helps you stack experiences you love until you have a life you love."',
     'content="Where experience creators grow. Design, fill, and scale transformational experiences."'],
    // OG
    ['content="Find My Flow — Live Your Ikigai"', 'content="Scale — Where Experience Creators Grow"'],
    ['content="Safety × Expression = experiences you love. Gamified courage challenges, daily practices, and a community that helps you feel more alive."',
     'content="Design, fill, and scale transformational experiences. The OS for experience creators."'],
    ['content="https://viberise.nichuzz.com"', 'content="https://create.nichuzz.com"'],
    ['content="https://viberise.nichuzz.com/icon-512.png"', 'content="https://create.nichuzz.com/icon-creator-512.png"'],
    // Twitter
    ['content="Find My Flow — Live Your Ikigai"', 'content="Scale — Where Experience Creators Grow"'],
    // Apple
    ['content="Find My Flow"', 'content="Scale"'],
    // JSON-LD: swap all remaining Find My Flow refs
    [/"name": "Find My Flow"/g, '"name": "Scale"'],
    [/"url": "https:\/\/viberise\.nichuzz\.com"/g, '"url": "https://create.nichuzz.com"'],
    ['"logo": "https://viberise.nichuzz.com/icon-512.png"', '"logo": "https://create.nichuzz.com/icon-creator-512.png"'],
    ['"applicationCategory": "LifestyleApplication"', '"applicationCategory": "BusinessApplication"'],
    ['Live your ikigai. Safety × Expression = experiences you love. Stack enough and you have a life you love.',
     'Where experience creators grow. Design, fill, and scale transformational experiences.'],
    ['Live your ikigai. Safety × Expression = experiences you love.',
     'Where experience creators grow. Design, fill, and scale transformational experiences.'],
    // Remove consumer FAQ schema (between last Organization LD+JSON closing and PWA comment)
    [/<script type="application\/ld\+json">\s*\{\s*"@context":\s*"https:\/\/schema\.org",\s*"@type":\s*"FAQPage"[\s\S]*?<\/script>/,
     ''],
    // Splash screen
    [/<span class="word-find">FIND<\/span>\s*\n?\s*<span class="word-my">MY<\/span>\s*\n?\s*<span class="word-flow">FLOW<\/span>/,
     '<span class="word-find" style="font-size:2.4rem;letter-spacing:4px">SCALE</span>'],
  ]

  return {
    name: 'creator-brand',
    transformIndexHtml(html) {
      if (!isCreator) return html
      for (const [find, replace] of replacements) {
        if (find instanceof RegExp) {
          html = html.replace(find, replace)
        } else {
          html = html.split(find).join(replace)
        }
      }
      return html
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), creatorBrandPlugin()],
  // base defaults to '/' — required for Vercel SPA deep links
  // Electron builds override via CLI: vite build --base ./
  server: {
    host: true, // Allow access from network (for mobile testing)
    allowedHosts: ['.ngrok-free.app', '.ngrok.io', '.ngrok-free.dev'],
  },
})

