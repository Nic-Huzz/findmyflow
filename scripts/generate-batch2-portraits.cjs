const fs = require('fs')
const path = require('path')
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
if (!API_KEY) { console.error('Set GEMINI_API_KEY'); process.exit(1) }
const OUT = path.join(__dirname, '..', 'public', 'images', 'creators')
const PX = `Pixar 3D cinematic animation style — the EXACT rendering quality of Pixar's Inside Out 2, Soul, and Coco. Smooth subsurface-scattering skin, large expressive eyes with visible iris detail and specular highlights, slightly exaggerated proportions, volumetric atmospheric lighting with visible light rays, depth of field with subtle bokeh.`

const CREATORS = [
  { slug: 'vishen-lakhiani', prompt: `${PX} Portrait of a charismatic Malaysian-Indian man in his late 40s. Short dark hair, warm brown skin, bright confident smile, well-groomed stubble. Wearing a simple dark crew neck. Energetic, visionary expression. Warm lighting. Background: soft purple-to-gold gradient. No text or words anywhere in the image.` },
  { slug: 'michael-singer', prompt: `${PX} Portrait of a gentle older American man in his late 70s. White hair, kind blue eyes, peaceful warm smile, clean-shaven. Simple casual clothing. Radiates quiet wisdom and surrender. Soft warm lighting. Background: soft purple-to-gold gradient. No text or words anywhere in the image.` },
  { slug: 'michael-beckwith', prompt: `${PX} Portrait of a charismatic African-American man in his late 60s. Dreadlocks or natural grey hair, warm brown skin, radiant joyful smile, expressive eyes full of spiritual energy. Wearing elegant but simple clothing. Dynamic warm lighting suggesting spiritual power. Background: soft purple-to-gold gradient. No text or words anywhere in the image.` },
  { slug: 'radha-agrawal', prompt: `${PX} Portrait of a vibrant Indian-American woman in her mid-40s. Long dark hair, warm brown skin, huge infectious smile full of joy and energy. Athletic, dancer's build. Wearing something fun and colorful. Radiates community energy and playfulness. Bright warm lighting. Background: soft purple-to-gold gradient. No text or words anywhere in the image.` },
  { slug: 'meghan-pappenheim', prompt: `${PX} Portrait of a warm American woman in her early 50s. Blonde/light brown hair, sun-kissed skin from years in Bali, warm genuine smile, relaxed bohemian style. Simple natural clothing. Radiates grounded community-builder energy. Soft tropical warm lighting. Background: soft purple-to-gold gradient. No text or words anywhere in the image.` },
  { slug: 'jeff-krasno', prompt: `${PX} Portrait of a thoughtful American man in his mid-50s. Short grey-brown hair, gentle blue eyes, warm smile, slight stubble. Wearing a simple casual henley or t-shirt. Radiates calm producer energy, someone who builds things for others. Natural warm lighting. Background: soft purple-to-gold gradient. No text or words anywhere in the image.` },
  { slug: 'gabrielle-roth', prompt: `${PX} Portrait of an expressive American woman in her 60s. Wild curly dark hair with grey, intense passionate dark eyes, strong face showing creative fire. Wearing something flowing and artistic. Radiates raw creative dancer energy. Dynamic warm lighting with movement feel. Background: soft purple-to-gold gradient. No text or words anywhere in the image.` },
  { slug: 'larry-harvey', prompt: `${PX} Portrait of a rugged American man in his late 60s. Distinctive handlebar mustache, weathered face, warm knowing eyes, slight mysterious smile. Wearing a cowboy hat or western-style hat. Radiates desert philosopher energy. Warm dusty golden lighting. Background: soft purple-to-gold gradient. No text or words anywhere in the image.` },
]

async function gen(c) {
  const out = path.join(OUT, c.slug + '.png')
  if (fs.existsSync(out)) { console.log('  SKIP ' + c.slug); return true }
  console.log('  Generating ' + c.slug + '...')
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: c.prompt }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } })
    })
    if (!r.ok) { console.error('  FAIL ' + c.slug + ': ' + r.status); return false }
    const data = await r.json()
    for (const p of (data.candidates?.[0]?.content?.parts || [])) {
      if (p.inlineData) { fs.writeFileSync(out, Buffer.from(p.inlineData.data, 'base64')); console.log('  OK ' + c.slug); return true }
    }
    console.error('  FAIL ' + c.slug + ': no image'); return false
  } catch (e) { console.error('  FAIL ' + c.slug + ': ' + e.message); return false }
}

async function main() {
  let ok = 0, fail = 0
  for (const c of CREATORS) { (await gen(c)) ? ok++ : fail++; await new Promise(r => setTimeout(r, 2000)) }
  console.log(`\nDone: ${ok} ok, ${fail} failed`)
}
main()
