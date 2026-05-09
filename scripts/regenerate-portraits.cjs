/**
 * Regenerate 23 creator portraits in full-scene Pixar style.
 * Uses Gemini 3.1 Flash image preview.
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyAfF7Q1EZR77J5ki0qkD_OU7z7uHD7QbC4';
const MODEL = 'gemini-3.1-flash-image-preview';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'creators');

const BASE = `Pixar 3D cinematic animation style — the EXACT rendering quality of Pixar's Inside Out 2, Soul, and Coco. Smooth subsurface-scattering skin, large expressive eyes with visible iris detail and specular highlights, slightly exaggerated proportions, volumetric atmospheric lighting with visible light rays, depth of field with subtle bokeh. Square 1:1 composition.`;

const PORTRAITS = [
  {
    slug: 'eckhart-tolle',
    prompt: `${BASE} A gentle older bald German man in a simple black sweater sitting peacefully on a park bench in a beautiful autumn garden, eyes softly half-closed, slight peaceful smile. Golden sunlight filtering through colorful trees. A small group of people sit nearby on other benches drawn to his calm presence. Warm volumetric light rays. No text or words anywhere in the image.`,
  },
  {
    slug: 'deepak-chopra',
    prompt: `${BASE} A distinguished Indian man with silver hair and round glasses, wearing a dark blue Nehru collar jacket, standing at a podium in a beautiful wellness retreat space giving a talk. Behind him, warm ambient lighting and tropical plants. A small attentive audience sitting in front of him. Warm golden lighting. No text or words anywhere in the image.`,
  },
  {
    slug: 'jack-kornfield',
    prompt: `${BASE} A warm bald older American man with gentle eyes and a kind smile, sitting cross-legged at the front of a beautiful wooden meditation hall. Meditation cushions arranged in a circle around him, a few students sitting peacefully with eyes closed. Sunlight streaming through large windows looking out into forest. Spirit Rock retreat centre atmosphere. No text or words anywhere in the image.`,
  },
  {
    slug: 'sam-harris',
    prompt: `${BASE} A serious but approachable American man with short dark hair and trimmed beard, sitting at a clean modern desk with a professional microphone and headphones, recording a podcast. Behind him, a minimal bookshelf and a meditation cushion in the corner. Clean, bright natural light from a window. Intellectual home studio atmosphere. No text or words anywhere in the image.`,
  },
  {
    slug: 'thich-nhat-hanh',
    prompt: `${BASE} A serene elderly Vietnamese Buddhist monk in traditional brown robes, walking slowly and peacefully along a garden path at a beautiful monastery. Cherry blossom petals falling gently. A line of monks walking behind him practicing walking meditation. Soft golden morning light filtering through trees. Deep peace radiating from the scene. No text or words anywhere in the image.`,
  },
  {
    slug: 'seane-corn',
    prompt: `${BASE} A passionate woman with long dark wavy hair, leading a powerful vinyasa yoga class outdoors on a wooden deck. Students around her flowing through warrior pose. Tropical jungle setting, warm golden sunset light streaming through palm trees. She is mid-flow, demonstrating with intensity and grace. No text or words anywhere in the image.`,
  },
  {
    slug: 'joe-dispenza',
    prompt: `${BASE} A confident man with dark hair greying at the temples, wearing a dark button-up shirt, standing on a large stage before a massive seated audience of thousands in a convention centre. Behind him, a huge screen showing colorful brain scan imagery with neural networks. Dramatic purple and blue stage lighting. He is mid-presentation, gesturing to the screen. No text or words anywhere in the image.`,
  },
  {
    slug: 'aubrey-marcus',
    prompt: `${BASE} An adventurous man with wavy brown hair and short beard, sitting in a circle of people around a ceremonial fire at night in a jungle clearing. Other participants sitting cross-legged with eyes closed in meditation. Starry sky visible above the canopy. Warm orange firelight illuminating faces. Intimate, sacred ceremonial atmosphere. No text or words anywhere in the image.`,
  },
  {
    slug: 'ram-dass',
    prompt: `${BASE} A wise elderly American man with a white beard, bald head, and wooden prayer bead mala necklace, sitting in a wheelchair on a beautiful Hawaiian lanai porch overlooking a tropical garden and ocean in the distance. Warm sunset golden hour light. A few people sitting at his feet on cushions, listening with devotion. Expression of pure love and peace on his face. No text or words anywhere in the image.`,
  },
  {
    slug: 'sadhguru',
    prompt: `${BASE} A charismatic Indian man with a long silver-grey beard and dark turban, wearing flowing white robes, riding a motorcycle through lush green Indian countryside. His robes flowing dramatically in the wind. Rolling green hills and misty mountains in the background, golden dust rising from the road. Playful mysterious smile on his face. Dynamic sense of motion and warm golden hour lighting. No text or words anywhere in the image.`,
  },
  {
    slug: 'marianne-williamson',
    prompt: `${BASE} An elegant older blonde woman in a simple dark outfit, standing at a podium in a beautiful candlelit church, speaking passionately to a packed audience. Her hands open and expressive mid-speech. Stained glass windows casting colored light across the scene. The audience is rapt and emotional. Warm dramatic lighting. No text or words anywhere in the image.`,
  },
  {
    slug: 'mooji',
    prompt: `${BASE} A peaceful older man with dark skin, grey dreadlocks and a full grey beard, wearing a simple white linen shirt, sitting on a wooden chair under an old olive tree in the Portuguese countryside. A circle of seekers sitting on cushions around him in a natural outdoor amphitheatre. Dappled golden sunlight through olive branches. Deep stillness and presence in the scene. No text or words anywhere in the image.`,
  },
  {
    slug: 'yung-pueblo',
    prompt: `${BASE} A contemplative young Latino man with short dark hair and light stubble, sitting alone at a simple wooden desk near a window, writing in a journal with a pen. A meditation cushion on the floor beside him. Soft morning light streaming through the window. A phone face-down on the desk. Quiet, introspective, peaceful atmosphere. A cup of tea steaming nearby. No text or words anywhere in the image.`,
  },
  {
    slug: 'sahara-rose',
    prompt: `${BASE} A vibrant young woman with long dark flowing hair and bohemian jewelry, sitting cross-legged on colorful cushions in a sacred feminine circle. Other women sitting in a circle around her, candles and crystals arranged in the centre on a cloth. Warm ambient lighting from string lights and candles. Tapestries and plants on the walls. Goddess circle atmosphere. No text or words anywhere in the image.`,
  },
  {
    slug: 'sri-sri-ravi-shankar',
    prompt: `${BASE} A serene Indian man with long flowing dark hair with grey streaks and a full beard, wearing simple white robes, sitting cross-legged on a stage leading a massive group meditation. Hundreds of people sitting in rows with eyes closed, breathing in unison. Beautiful Indian ashram architecture with arches in the background. Golden evening light. Peaceful collective energy. No text or words anywhere in the image.`,
  },
  {
    slug: 'vishen-lakhiani',
    prompt: `${BASE} A charismatic Malaysian-Indian man with short dark hair and a confident smile, wearing a dark crew neck, standing on a modern conference stage giving a keynote to a large auditorium of thousands. Dynamic blue and purple stage lighting. A huge screen behind him. His arms are wide open mid-speech, full of energy. The audience is engaged and inspired. No text or words anywhere in the image.`,
  },
  {
    slug: 'michael-singer',
    prompt: `${BASE} A gentle older American man with white hair and a peaceful expression, sitting in meditation inside a simple, beautiful temple in the Florida woods. Tall windows looking out to lush green forest. Sunlight filtering through trees creating dappled light inside. A few meditation cushions arranged nearby. Books on a small shelf. Deep quiet woodland sanctuary atmosphere. No text or words anywhere in the image.`,
  },
  {
    slug: 'michael-beckwith',
    prompt: `${BASE} A charismatic African-American man with natural grey hair, wearing a flowing purple ceremonial robe, standing at the front of a beautiful church with his arms raised in celebration. A gospel choir behind him singing. The congregation on their feet with hands raised in joy. Golden light streaming through the ceiling. Spiritual energy and joy radiating through the scene. No text or words anywhere in the image.`,
  },
  {
    slug: 'radha-agrawal',
    prompt: `${BASE} A joyful community leader, a woman in her 40s with long dark hair, dancing with arms raised in a crowd of happy people at an early morning dance party inside a sunlit warehouse. Golden sunrise light streaming through large industrial windows. A DJ booth visible in the background with warm lights. Everyone dancing together with huge smiles, pure joy and community energy. Sober morning party atmosphere. No text or words anywhere in the image.`,
  },
  {
    slug: 'meghan-pappenheim',
    prompt: `${BASE} A warm blonde woman in relaxed bohemian clothing, standing at the entrance of a beautiful open-air yoga pavilion in Bali. Lush tropical jungle in the background with palm trees. Rice terraces visible in the distance. Colorful prayer flags hanging. Students arriving with yoga mats, greeting each other. Soft morning mist. Ubud Bali atmosphere with warm golden light. No text or words anywhere in the image.`,
  },
  {
    slug: 'jeff-krasno',
    prompt: `${BASE} A thoughtful man with grey-brown hair wearing a casual henley, standing at the edge of a beautiful outdoor festival field at golden hour. In the foreground, yoga practitioners on mats stretching. In the background, a music stage with lights and mountains behind it. He is surveying the scene he built with quiet pride, hands in pockets. Wanderlust festival atmosphere. No text or words anywhere in the image.`,
  },
  {
    slug: 'gabrielle-roth',
    prompt: `${BASE} An original character: a creative older woman with wild curly grey-streaked dark hair, wearing flowing dark artistic clothing, dancing ecstatically in a wooden dance studio. Other dancers around her in various states of free expressive movement. Bare feet on polished wooden floor. Dynamic, swirling energy in the scene. Dramatic warm side lighting creating long shadows. Dance as meditation atmosphere. No text or words anywhere in the image.`,
  },
  {
    slug: 'larry-harvey',
    prompt: `${BASE} A rugged man with a distinctive handlebar mustache wearing a cowboy hat and a leather jacket, standing in the desert at dusk. Behind him in the distance, a massive wooden structure glows against a dramatic orange and purple sunset sky. Art installations and camp structures visible across the desert landscape. Dust particles catching the golden light. Burning Man desert atmosphere. No text or words anywhere in the image.`,
  },
];

async function generateImage(slug, prompt, index) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  console.log(`[${index + 1}/${PORTRAITS.length}] Generating ${slug}...`);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  FAILED (${res.status}): ${err.slice(0, 200)}`);
    return false;
  }

  const data = await res.json();

  // Find image part in response
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));

  if (!imagePart) {
    const finishReason = data.candidates?.[0]?.finishReason;
    console.error(`  NO IMAGE returned for ${slug} (finishReason: ${finishReason})`);
    return false;
  }

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
  const outPath = path.join(OUTPUT_DIR, `${slug}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`  Saved ${outPath} (${Math.round(buffer.length / 1024)}KB)`);
  return true;
}

async function main() {
  console.log(`Generating ${PORTRAITS.length} portraits...`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  let success = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < PORTRAITS.length; i++) {
    const { slug, prompt } = PORTRAITS[i];
    const ok = await generateImage(slug, prompt, i);
    if (ok) {
      success++;
    } else {
      failed++;
      failures.push(slug);
    }

    // Rate limit: 3s delay between requests
    if (i < PORTRAITS.length - 1) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log(`\nDone: ${success} generated, ${failed} failed`);
  if (failures.length > 0) {
    console.log(`Failed: ${failures.join(', ')}`);
  }
}

main().catch(console.error);
