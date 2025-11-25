# Retreat Landing Page - Setup Guide

## Overview
This landing page is designed for retreat hosts looking to book facilitators for their retreat experiences. It's built in the FindMyFlow design system style with purple gradients, gold accents, and smooth animations.

## Files Created
- `/src/RetreatLanding.jsx` - Main React component
- `/src/RetreatLanding.css` - Styling (using FindMyFlow design system)
- `/public/images/retreats/` - Media folder for images

## Images & Videos Needed

### Required Images (Poster/Fallback)
Upload these images to `/public/images/retreats/`:

1. **hero-bg.jpg** (1920x1080px or larger)
   - Hero section background image
   - Should be an inspiring retreat/Bali scene

2. **huzz-profile.jpg** (800x800px minimum)
   - Your professional photo for the About section
   - Square aspect ratio works best

3. **healing-compass.jpg** (800x600px minimum)
   - Poster image for Healing Compass (shows when video not playing)

4. **breathwork.jpg** (800x600px minimum)
   - Poster image for Breathwork session

5. **rewire.jpg** (800x600px minimum)
   - Poster image for Rewire workshop

6. **vibe-rise.jpg** (800x600px minimum)
   - Poster image for Vibe Rise dance

### Optional Videos (Click to Play)
Upload these videos to `/public/videos/retreats/`:

1. **healing-compass.mp4** - Healing Compass experience video
2. **breathwork.mp4** - Breathwork session video
3. **rewire.mp4** - Rewire workshop video
4. **vibe-rise.mp4** - Vibe Rise dance video

**Video Features:**
- Click to play/pause
- Shows poster image when paused
- Purple play button overlay
- Loops when playing
- Mobile-friendly

### Optional Images (Testimonial Avatars)
7. **testimonial-alyce.jpg** (300x300px)
8. **testimonial-amy.jpg** (300x300px)
9. **testimonial-kylie.jpg** (300x300px) - placeholder for future
10. **testimonial-krislin.jpg** (300x300px) - placeholder for future

### Image Tips
- Use high-quality, well-lit photos
- Keep file sizes under 500KB each (use compression tools)
- JPG format is recommended for photos
- Make sure images convey the "Healing But Fun" energy

## Adding Video for Vibe Rise

In `/src/RetreatLanding.jsx`, find this section (around line 271):

```jsx
<div className="retreat-video-placeholder">
  <p>Video placeholder - Add your Vibe Rise video URL here</p>
  <p className="retreat-video-note">Replace this with an iframe or video element</p>
</div>
```

Replace it with either:

### Option 1: YouTube Video
```jsx
<iframe
  width="100%"
  height="500"
  src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
></iframe>
```

### Option 2: Direct Video File
```jsx
<video
  width="100%"
  height="500"
  controls
  autoPlay={false}
>
  <source src="/videos/vibe-rise-demo.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
```

## How to View the Landing Page Locally

### Option 1: Add as a Route (Recommended)
1. Open `/src/App.jsx` (or your main routing file)
2. Import the component:
   ```jsx
   import RetreatLanding from './RetreatLanding';
   ```
3. Add a route:
   ```jsx
   <Route path="/retreats" element={<RetreatLanding />} />
   ```
4. Visit `http://localhost:3000/retreats`

### Option 2: Standalone Test
1. Temporarily replace your App.jsx content:
   ```jsx
   import RetreatLanding from './RetreatLanding';

   function App() {
     return <RetreatLanding />;
   }

   export default App;
   ```
2. Run `npm start`
3. View at `http://localhost:3000`

## Deploying to retreats.nichuzz.com

### Prerequisites
- Domain configured: `retreats.nichuzz.com`
- Hosting service (Vercel, Netlify, or custom server)

### Option 1: Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Create a new Vercel project for the retreat landing
3. Deploy: `vercel --prod`
4. In Vercel dashboard:
   - Go to Settings → Domains
   - Add custom domain: `retreats.nichuzz.com`
   - Configure DNS as instructed

### Option 2: Netlify
1. Build the project: `npm run build`
2. Deploy to Netlify
3. Configure custom domain in Netlify settings

### Option 3: Subdomain on Existing Server
If findmyflow is already hosted:
1. Set up a subdomain in your DNS provider
2. Configure your web server (nginx/Apache) to route `retreats.nichuzz.com` to this page
3. Deploy the build

## Customization Options

### Change Colors
Edit `/src/RetreatLanding.css`:

```css
/* Primary Purple */
background: linear-gradient(135deg, #5e17eb 0%, #8b5cf6 100%);

/* Gold Accent */
background: linear-gradient(135deg, #ffdd27 0%, #ffc107 100%);
```

### Update Content
Edit `/src/RetreatLanding.jsx`:

- **Hero text**: Lines 39-43
- **Philosophy**: Lines 45-77
- **Offerings**: Lines 10-37
- **Testimonials**: Lines 79-108
- **Contact info**: Lines 129-131

### Add More Testimonials
In the `testimonials` array (line 79), add new objects:

```jsx
{
  name: "New Name",
  handle: "@instagram_handle",
  text: "Testimonial text here...",
  image: "/images/retreats/testimonial-name.jpg",
  placeholder: false  // Set to true if saving space for future
}
```

### Modify WhatsApp Number
Line 129:
```jsx
window.open('https://wa.me/61423220241', '_blank');
```

### Update Instagram Handle
Line 133:
```jsx
window.open('https://instagram.com/_Huzz', '_blank');
```

## Design System Features

This landing page uses the FindMyFlow design system:

- **Colors**: Purple (#5e17eb) primary, Gold (#ffdd27) accent
- **Typography**: System fonts (SF Pro on Apple devices)
- **Border Radius**: 16-24px for cards and buttons
- **Shadows**: Multi-level elevation (subtle to prominent)
- **Animations**: Smooth 0.3s transitions with transform effects
- **Responsive**: Breakpoints at 1024px, 768px, 480px

## Troubleshooting

### Images Not Showing
- Verify images are in `/public/images/retreats/`
- Check file names match exactly (case-sensitive)
- Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)

### Styling Issues
- Make sure `RetreatLanding.css` is imported in the component
- Check for CSS conflicts with global styles
- Inspect element in browser DevTools

### Responsive Issues
- Test on different screen sizes using browser DevTools
- Check media queries in CSS file
- Verify images are responsive

## Next Steps

1. ✅ Upload images to `/public/images/retreats/`
2. ✅ Add video URL for Vibe Rise section
3. ✅ Test locally
4. ✅ Deploy to `retreats.nichuzz.com`
5. ✅ Test on mobile devices
6. ✅ Share with retreat hosts!

## Future Enhancements

Consider adding:
- Booking form integration
- Calendar for availability
- Pricing calculator
- FAQ section (currently "Coming soon")
- Past retreat gallery
- Email signup for updates
- SEO optimization

## Support

For questions or modifications, refer to:
- FindMyFlow design system docs
- React documentation
- CSS customization in `.css` file

---

**Built with the FindMyFlow Design System**
Purple gradient (#5e17eb → #8b5cf6) | Gold accent (#ffdd27)
