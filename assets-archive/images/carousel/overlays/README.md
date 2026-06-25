# Carousel Overlay Files

All overlays are 1080x1080px SVGs with transparent backgrounds. Layer them on top of the Pixar background images.

## Files

| File | Background Image | Purpose |
|---|---|---|
| `slide-1-overlay.svg` | `slide-1-hook.jpg` | Hook text: "Does work feel heavy instead of fun?" |
| `slide-2-diagram.svg` | `slide-2-pattern.jpg` | Journey diagram with axes, arrows, and 3 stage labels |
| `slide-3-overlay.svg` | `slide-2-misguided.jpg` | Misguided Zone: "Busy. Productive. Quietly empty." |
| `slide-4-overlay.svg` | `slide-3-paralysis.jpg` | Paralysis Zone: "Head full of dreams." |
| `slide-5-overlay.svg` | `slide-4-diagonal.jpg` | The Diagonal: "Self-Actualisation." |
| `slide-6-overlay.svg` | `slide-5-cta.jpg` | CTA: "Which zone are you in?" |

## Option 1: Use in Canva

1. Create a new Instagram Post (1080x1080)
2. Upload the background image (e.g. `slide-1-hook.jpg`)
3. Set it as the background, fill the frame
4. Upload the matching SVG overlay
5. Place on top, stretch to fill (1080x1080)
6. The SVG has built-in gradients so text is readable
7. You can now select and move/edit any text element in the SVG
8. Export as PNG or JPG

## Option 3: Use the standalone diagram SVG

`slide-2-diagram.svg` is the full journey diagram (axes, arrows, labels) with a semi-transparent dark background. You can:

1. Open in Figma: File > Import > select the SVG
   - Every text element and arrow is a separate editable object
   - Move, resize, recolor anything
   - Change the background opacity

2. Open in Canva: Upload as SVG
   - Place over the `slide-2-pattern.jpg` background
   - Adjust positioning

3. Open in any SVG editor (Inkscape, Illustrator, Affinity Designer)
   - Full vector editing

## Editing the SVGs directly

The SVGs are plain text files. Open in any code editor to change:
- Text content: edit the `<text>` elements
- Colors: `fill="#E9A23B"` (gold), `fill="white"`
- Font size: `font-size="64"`
- Position: `x="540" y="890"` (x=horizontal, y=vertical from top)
- Gradient darkness: edit `stop-opacity` values in the `<linearGradient>`

## Brand Colors
- Purple: `#5e17eb`
- Gold: `#E9A23B`
- White text: `white` or `rgba(255,255,255,0.8)` for softer
- Font: Inter (bold 800-900 for headlines, 500 for body)
