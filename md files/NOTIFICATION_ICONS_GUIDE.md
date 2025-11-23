# Notification Icons Guide

## Required Icons

Your push notifications need two icon files in the `/public` folder:

1. **icon-192x192.png** - Main notification icon (192x192 pixels)
2. **badge-72x72.png** - Badge icon for Android (72x72 pixels)

## Icon Specifications

### icon-192x192.png
- **Size**: 192x192 pixels
- **Format**: PNG with transparency
- **Purpose**: Main icon shown in notifications
- **Design**: Should represent your app/brand (e.g., FindMyFlow logo)
- **Color**: Can be full color
- **Background**: Transparent or solid color

### badge-72x72.png
- **Size**: 72x72 pixels
- **Format**: PNG with transparency
- **Purpose**: Small badge shown in notification tray (Android only)
- **Design**: Simplified monochrome version of your logo
- **Color**: White icon on transparent background (Android will tint it)
- **Style**: Simple, recognizable silhouette

## Creating the Icons

### Option 1: Use an Online Tool
1. Go to https://www.favicon-generator.org/ or https://realfavicongenerator.net/
2. Upload your logo/brand image
3. Generate PWA icons
4. Download the 192x192 and 72x72 versions
5. Rename them to `icon-192x192.png` and `badge-72x72.png`
6. Place them in `/public` folder

### Option 2: Use Design Software
1. Open Figma, Canva, or Photoshop
2. Create a 192x192px canvas
3. Design your notification icon (centered, with padding)
4. Export as PNG
5. Repeat for 72x72px badge (simplified monochrome version)

### Option 3: Temporary Placeholder
For testing purposes, you can use simple colored squares:

**Quick CSS-based placeholder creation:**
1. Create a simple HTML file
2. Use canvas or SVG to create colored squares
3. Take screenshots at exact dimensions
4. Use as temporary icons

## Recommended Design Guidelines

### For icon-192x192.png:
- Use your app's primary color scheme
- Include your logo or brand mark
- Leave 15-20px padding around edges
- Ensure legibility at small sizes
- Test on both light and dark backgrounds

### For badge-72x72.png:
- Keep it extremely simple (icon will be very small)
- Use solid white shapes on transparent background
- Avoid fine details or text
- Think "silhouette" style

## Example Design Ideas

**For FindMyFlow:**
- Icon: Purple gradient circle with "F" or flow symbol
- Badge: Simple white "F" or wave symbol

## Testing Your Icons

After creating the icons:

1. Place them in `/public` folder
2. Clear browser cache
3. Re-register service worker
4. Send a test notification from `/settings/notifications`
5. Check how the icon looks in the notification

## Fallback Behavior

If icons are missing, browsers will use:
- Default browser icon
- Page favicon
- App icon from manifest

However, custom icons provide much better user experience and branding.

## Current Status

Check if icons exist:
```bash
ls -la /Users/nichurrell/Findmyflow/public/icon-192x192.png
ls -la /Users/nichurrell/Findmyflow/public/badge-72x72.png
```

If missing, create them using one of the options above.
