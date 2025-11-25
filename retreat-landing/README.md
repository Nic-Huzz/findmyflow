# Healing But Fun - Retreat Landing Page

Standalone deployment for retreats.nichuzz.com

## Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` folder.

## Deploying to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy from the retreat-landing directory
cd retreat-landing
vercel

# For production deployment
vercel --prod
```

### Option 2: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. **IMPORTANT**: Set the "Root Directory" to `retreat-landing`
5. Framework Preset: Vite
6. Click "Deploy"

### Adding Custom Domain

After deployment:

1. Go to Project Settings → Domains
2. Add `retreats.nichuzz.com`
3. Follow DNS configuration instructions
4. In Cloudflare, add a CNAME record:
   - Name: `retreats`
   - Target: `cname.vercel-dns.com` (or the target Vercel provides)
   - Proxy status: DNS only (or Proxied, both work)

## Project Structure

```
retreat-landing/
├── public/
│   ├── images/retreats/     # Images for the retreat page
│   └── videos/retreats/     # Videos for the retreat page
├── src/
│   ├── App.jsx              # Root component
│   ├── main.jsx             # Entry point
│   ├── RetreatLanding.jsx   # Main landing page component
│   └── RetreatLanding.css   # Styles
├── index.html               # HTML with SEO meta tags
├── package.json
└── vite.config.js
```

## SEO Features

The landing page includes:
- Meta tags for SEO
- Open Graph tags for social sharing
- Twitter Card tags
- Google Business Schema (JSON-LD)
- Geo tags for Google Maps integration
- Optimized for search engines

## Features

- ✅ Standalone React app with Vite
- ✅ Full SEO meta tags
- ✅ Google Maps/Business integration ready
- ✅ Responsive design
- ✅ Video support for offerings
- ✅ WhatsApp and Instagram CTAs
- ✅ Testimonials section
- ✅ Clean, professional design

## Environment

- Framework: React 18
- Build tool: Vite 5
- No external dependencies beyond React
