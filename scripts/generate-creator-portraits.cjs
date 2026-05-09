#!/usr/bin/env node
/**
 * Generate Pixar-style portraits for new experience creators.
 * Uses Gemini 3.1 Flash image generation (text-to-image, no photo input).
 *
 * Usage: GEMINI_API_KEY=xxx node scripts/generate-creator-portraits.cjs
 *
 * Output: public/images/creators/{slug}.png
 */

const fs = require('fs')
const path = require('path')

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
if (!API_KEY) {
  console.error('Set GEMINI_API_KEY or GOOGLE_API_KEY env var')
  process.exit(1)
}

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'creators')

const PIXAR_BASE = `Pixar 3D cinematic animation style — the EXACT rendering quality of Pixar's Inside Out 2, Soul, and Coco. Smooth subsurface-scattering skin, large expressive eyes with visible iris detail and specular highlights, slightly exaggerated proportions, volumetric atmospheric lighting with visible light rays, depth of field with subtle bokeh.`

const CREATORS = [
  {
    name: 'Eckhart Tolle',
    slug: 'eckhart-tolle',
    prompt: `${PIXAR_BASE} Portrait of a gentle older German man in his late 70s. Bald head, kind warm eyes, slight peaceful smile. Clean-shaven. Simple dark clothing. Serene, still expression radiating calm presence. Soft warm lighting suggesting inner peace. Background: soft purple-to-gold gradient. No text or words anywhere in the image.`
  },
  {
    name: 'Deepak Chopra',
    slug: 'deepak-chopra',
    prompt: `${PIXAR_BASE} Portrait of a distinguished Indian man in his late 70s. Silver-grey hair, warm brown skin, round glasses, warm welcoming smile. Wearing a simple dark Nehru collar jacket. Wise, approachable expression. Soft warm lighting. Background: soft purple-to-gold gradient. No text or words anywhere in the image.`
  },
  {
    name: 'Jack Kornfield',
    slug: 'jack-kornfield',
    prompt: `${PIXAR_BASE} Portrait of a warm American man in his late 70s. Bald head with some remaining white hair on sides, gentle blue eyes, kind smile with laugh lines. Clean-shaven. Simple casual clothing. Radiates warmth and gentle humor. Soft natural lighting. Background: soft purple-to-gold gradient. No text or words anywhere in the image.`
  },
  {
    name: 'Sam Harris',
    slug: 'sam-harris',
    prompt: `${PIXAR_BASE} Portrait of an intellectual American man in his late 50s. Short dark brown hair with some grey, closely trimmed beard, intense thoughtful blue eyes, serious but approachable expression. Simple dark t-shirt or henley. Clean, sharp lighting suggesting clarity and rationality. Background: soft purple-to-gold gradient. No text or words anywhere in the image.`
  },
  {
    name: 'Thich Nhat Hanh',
    slug: 'thich-nhat-hanh',
    prompt: `${PIXAR_BASE} Portrait of a serene Vietnamese Buddhist monk in his 80s. Shaved head, warm brown skin, deeply peaceful expression with gentle closed-mouth smile. Wearing traditional brown Buddhist robes. Radiates profound stillness and compassion. Soft golden light suggesting mindful presence. Background: soft purple-to-gold gradient. No text or words anywhere in the image.`
  },
  {
    name: 'Seane Corn',
    slug: 'seane-corn',
    prompt: `${PIXAR_BASE} Portrait of a passionate American woman in her late 50s. Long wavy dark brown hair with some grey, expressive brown eyes, warm open smile showing strength and vulnerability. Athletic yoga teacher build. Simple tank top or casual clothing. Dynamic warm lighting suggesting passionate energy. Background: soft purple-to-gold gradient. No text or words anywhere in the image.`
  },
  {
    name: 'Joe Dispenza',
    slug: 'joe-dispenza',
    prompt: `${PIXAR_BASE} Portrait of a confident American man in his early 60s. Short dark hair greying at temples, strong jawline, focused determined eyes, slight knowing smile. Wearing a simple dark button-up shirt. Professional yet approachable expression suggesting scientific authority combined with spiritual conviction. Clean bright lighting. Background: soft purple-to-gold gradient. No text or words anywhere in the image.`
  },
  {
    name: 'Aubrey Marcus',
    slug: 'aubrey-marcus',
    prompt: `${PIXAR_BASE} Portrait of an adventurous American man in his early 40s. Medium-length wavy brown hair, short beard, warm hazel eyes, confident open smile. Athletic build. Wearing a simple casual henley or t-shirt. Rugged yet warm expression suggesting someone who lives fully. Natural warm lighting. Background: soft purple-to-gold gradient. No text or words anywhere in the image.`
  },
  {
    name: 'Ram Dass',
    slug: 'ram-dass',
    prompt: `${PIXAR_BASE} Portrait of a wise elderly American man in his 80s. White beard, bald head, bright warm blue eyes with deep kindness, gentle peaceful smile. Wearing a simple white or light colored garment with a prayer bead mala necklace. Expression radiates unconditional love and compassion. Soft warm golden lighting. Background: soft purple-to-gold gradient. No text or words anywhere in the image.`
  },
  {
    name: 'Sadhguru',
    slug: 'sadhguru',
    prompt: `${PIXAR_BASE} Portrait of a charismatic Indian man in his late 60s. Long silver-grey beard, dark turban/head wrap, piercing dark eyes with a playful twinkle, slight mysterious smile. Medium brown skin. Simple white or cream clothing. Expression suggests both mystical depth and accessible humor. Warm dramatic lighting. Background: soft purple-to-gold gradient. No text or words anywhere in the image.`
  },
  {
    name: 'Marianne Williamson',
    slug: 'marianne-williamson',
    prompt: `${PIXAR_BASE} Portrait of an eloquent American woman in her early 70s. Shoulder-length blonde hair, warm blue eyes, dignified yet compassionate expression, gentle knowing smile. Wearing elegant but simple clothing. Radiates conviction and spiritual authority. Soft warm lighting suggesting wisdom and grace. Background: soft purple-to-gold gradient. No text or words anywhere in the image.`
  },
  {
    name: 'Mooji',
    slug: 'mooji',
    prompt: `${PIXAR_BASE} Portrait of a peaceful Jamaican-British man in his early 70s. Dark brown skin, grey dreadlocks or natural grey hair, warm gentle brown eyes, serene peaceful smile radiating deep stillness. Full grey beard. Simple white or light clothing. Expression of absolute calm and presence. Soft warm lighting. Background: soft purple-to-gold gradient. No text or words anywhere in the image.`
  },
  {
    name: 'Yung Pueblo',
    slug: 'yung-pueblo',
    prompt: `${PIXAR_BASE} Portrait of a thoughtful Ecuadorian-American man in his late 30s. Short dark hair, light brown skin, warm dark brown eyes, gentle contemplative expression with a slight peaceful smile. Short beard or stubble. Simple casual clothing like a plain t-shirt. Quiet introspective energy. Soft natural lighting. Background: soft purple-to-gold gradient. No text or words anywhere in the image.`
  },
  {
    name: 'Sahara Rose',
    slug: 'sahara-rose',
    prompt: `${PIXAR_BASE} Portrait of a vibrant young Iranian-American woman in her mid-30s. Long dark flowing hair, warm olive skin, bright expressive dark eyes, radiant warm smile. Beautiful and approachable. Wearing something colorful and bohemian with perhaps a small nose ring or subtle jewelry. Energetic warm lighting suggesting creativity and feminine power. Background: soft purple-to-gold gradient. No text or words anywhere in the image.`
  },
  {
    name: 'Sri Sri Ravi Shankar',
    slug: 'sri-sri-ravi-shankar',
    prompt: `${PIXAR_BASE} Portrait of a serene Indian spiritual leader in his late 60s. Long flowing dark hair with grey streaks past shoulders, full dark beard with grey, warm gentle brown eyes, peaceful beatific smile. Medium brown skin. Wearing simple white robes. Expression radiates calm joy and compassion. Soft ethereal lighting. Background: soft purple-to-gold gradient. No text or words anywhere in the image.`
  },
]

async function generateImage(creator) {
  const outPath = path.join(OUTPUT_DIR, `${creator.slug}.png`)
  if (fs.existsSync(outPath)) {
    console.log(`  SKIP ${creator.name} (already exists)`)
    return true
  }

  console.log(`  Generating ${creator.name}...`)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: creator.prompt }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error(`  FAIL ${creator.name}: ${response.status} ${err.substring(0, 200)}`)
      return false
    }

    const result = await response.json()
    const parts = result.candidates?.[0]?.content?.parts || []

    for (const part of parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, 'base64')
        fs.writeFileSync(outPath, buffer)
        console.log(`  OK ${creator.name} (${(buffer.length / 1024).toFixed(0)}KB)`)
        return true
      }
    }

    console.error(`  FAIL ${creator.name}: no image in response`)
    return false
  } catch (err) {
    console.error(`  FAIL ${creator.name}: ${err.message}`)
    return false
  }
}

async function main() {
  console.log(`Generating ${CREATORS.length} Pixar portraits...\n`)

  let success = 0
  let fail = 0

  // Generate sequentially to avoid rate limits
  for (const creator of CREATORS) {
    const ok = await generateImage(creator)
    if (ok) success++
    else fail++

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log(`\nDone! ${success} succeeded, ${fail} failed.`)
}

main()
