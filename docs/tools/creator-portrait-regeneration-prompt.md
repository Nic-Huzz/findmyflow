# Creator Portrait Regeneration Prompt

## Task

Regenerate 23 experience creator portrait images in the full-scene Pixar style. The current images are head-only portraits against gradient backgrounds. They need to be replaced with full-scene compositions showing each creator IN THEIR ELEMENT, doing what they're known for.

## Reference Examples (existing correct style)

Look at these existing images in `public/images/creators/` for the target style:
- `gabor-mate.png` - Sitting in a therapy circle with patients, warm wooden room
- `tony-robbins.png` - On stage at a massive arena event, crowd, stage lights
- `priya-parker.png` - Hosting an intimate candlelit dinner, guests around a table
- `esther-perel.png` - In a cozy therapy room with a couple, bookshelves, warm lighting
- `phil-jackson.png` - Meditating on a basketball court, arena in background
- `wim-hof.png` - Check this one for style reference too

These are all 1024x1024, full-scene compositions with environments, other people, and context. NOT head-only portraits.

## Technical Setup

**Model:** `gemini-3.1-flash-image-preview` (this is critical, other models produce different styles)

**API call:**
```javascript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
  }
);
```

**API Key:** `GOOGLE_API_KEY` from `.env.local`

**Output:** Save as PNG to `public/images/creators/{slug}.png`, overwriting existing files.

**Rate limiting:** 2-3 second delay between requests to avoid rate limits.

**Cost:** ~$0.07 per image, ~$1.60 total for 23 images.

## Prompt Template

Every prompt starts with this base:

```
Pixar 3D cinematic animation style — the EXACT rendering quality of Pixar's Inside Out 2, Soul, and Coco. Smooth subsurface-scattering skin, large expressive eyes with visible iris detail and specular highlights, slightly exaggerated proportions, volumetric atmospheric lighting with visible light rays, depth of field with subtle bokeh. Square 1:1 composition.
```

Then add the scene-specific description. End every prompt with: `No text or words anywhere in the image.`

## The 23 Prompts

### Spiritual Leaders (15)

**1. eckhart-tolle.png**
{BASE} A gentle older bald German man in a simple black sweater sitting peacefully on a park bench in a beautiful autumn garden, eyes softly half-closed, slight peaceful smile. Golden sunlight filtering through colorful trees. A small group of people sit nearby on other benches drawn to his calm presence. Warm volumetric light rays. No text or words anywhere in the image.

**2. deepak-chopra.png**
{BASE} A distinguished Indian man with silver hair and round glasses, wearing a dark blue Nehru collar jacket, standing at a podium in a beautiful wellness retreat space giving a talk. Behind him, warm ambient lighting and tropical plants. A small attentive audience sitting in front of him. Warm golden lighting. No text or words anywhere in the image.

**3. jack-kornfield.png**
{BASE} A warm bald older American man with gentle eyes and a kind smile, sitting cross-legged at the front of a beautiful wooden meditation hall. Meditation cushions arranged in a circle around him, a few students sitting peacefully with eyes closed. Sunlight streaming through large windows looking out into forest. Spirit Rock retreat centre atmosphere. No text or words anywhere in the image.

**4. sam-harris.png**
{BASE} A serious but approachable American man with short dark hair and trimmed beard, sitting at a clean modern desk with a professional microphone and headphones, recording a podcast. Behind him, a minimal bookshelf and a meditation cushion in the corner. Clean, bright natural light from a window. Intellectual home studio atmosphere. No text or words anywhere in the image.

**5. thich-nhat-hanh.png**
{BASE} A serene elderly Vietnamese Buddhist monk in traditional brown robes, walking slowly and peacefully along a garden path at a beautiful monastery. Cherry blossom petals falling gently. A line of monks walking behind him practicing walking meditation. Soft golden morning light filtering through trees. Deep peace radiating from the scene. No text or words anywhere in the image.

**6. seane-corn.png**
{BASE} A passionate woman with long dark wavy hair, leading a powerful vinyasa yoga class outdoors on a wooden deck. Students around her flowing through warrior pose. Tropical jungle setting, warm golden sunset light streaming through palm trees. She is mid-flow, demonstrating with intensity and grace. No text or words anywhere in the image.

**7. joe-dispenza.png**
{BASE} A confident man with dark hair greying at the temples, wearing a dark button-up shirt, standing on a large stage before a massive seated audience of thousands in a convention centre. Behind him, a huge screen showing colorful brain scan imagery with neural networks. Dramatic purple and blue stage lighting. He is mid-presentation, gesturing to the screen. No text or words anywhere in the image.

**8. aubrey-marcus.png**
{BASE} An adventurous man with wavy brown hair and short beard, sitting in a circle of people around a ceremonial fire at night in a jungle clearing. Other participants sitting cross-legged with eyes closed in meditation. Starry sky visible above the canopy. Warm orange firelight illuminating faces. Intimate, sacred ceremonial atmosphere. No text or words anywhere in the image.

**9. ram-dass.png**
{BASE} A wise elderly American man with a white beard, bald head, and wooden prayer bead mala necklace, sitting in a wheelchair on a beautiful Hawaiian lanai porch overlooking a tropical garden and ocean in the distance. Warm sunset golden hour light. A few people sitting at his feet on cushions, listening with devotion. Expression of pure love and peace on his face. No text or words anywhere in the image.

**10. sadhguru.png**
{BASE} A charismatic Indian man with a long silver-grey beard and dark turban, wearing flowing white robes, riding a motorcycle through lush green Indian countryside. His robes flowing dramatically in the wind. Rolling green hills and misty mountains in the background, golden dust rising from the road. Playful mysterious smile on his face. Dynamic sense of motion and warm golden hour lighting. No text or words anywhere in the image.

**11. marianne-williamson.png**
{BASE} An elegant older blonde woman in a simple dark outfit, standing at a podium in a beautiful candlelit church, speaking passionately to a packed audience. Her hands open and expressive mid-speech. Stained glass windows casting colored light across the scene. The audience is rapt and emotional. Warm dramatic lighting. No text or words anywhere in the image.

**12. mooji.png**
{BASE} A peaceful older man with dark skin, grey dreadlocks and a full grey beard, wearing a simple white linen shirt, sitting on a wooden chair under an old olive tree in the Portuguese countryside. A circle of seekers sitting on cushions around him in a natural outdoor amphitheatre. Dappled golden sunlight through olive branches. Deep stillness and presence in the scene. No text or words anywhere in the image.

**13. yung-pueblo.png**
{BASE} A contemplative young Latino man with short dark hair and light stubble, sitting alone at a simple wooden desk near a window, writing in a journal with a pen. A meditation cushion on the floor beside him. Soft morning light streaming through the window. A phone face-down on the desk. Quiet, introspective, peaceful atmosphere. A cup of tea steaming nearby. No text or words anywhere in the image.

**14. sahara-rose.png**
{BASE} A vibrant young woman with long dark flowing hair and bohemian jewelry, sitting cross-legged on colorful cushions in a sacred feminine circle. Other women sitting in a circle around her, candles and crystals arranged in the centre on a cloth. Warm ambient lighting from string lights and candles. Tapestries and plants on the walls. Goddess circle atmosphere. No text or words anywhere in the image.

**15. sri-sri-ravi-shankar.png**
{BASE} A serene Indian man with long flowing dark hair with grey streaks and a full beard, wearing simple white robes, sitting cross-legged on a stage leading a massive group meditation. Hundreds of people sitting in rows with eyes closed, breathing in unison. Beautiful Indian ashram architecture with arches in the background. Golden evening light. Peaceful collective energy. No text or words anywhere in the image.

### Community/Festival Leaders (8)

**16. vishen-lakhiani.png**
{BASE} A charismatic Malaysian-Indian man with short dark hair and a confident smile, wearing a dark crew neck, standing on a modern conference stage giving a keynote to a large auditorium of thousands. Dynamic blue and purple stage lighting. A huge screen behind him. His arms are wide open mid-speech, full of energy. The audience is engaged and inspired. No text or words anywhere in the image.

**17. michael-singer.png**
{BASE} A gentle older American man with white hair and a peaceful expression, sitting in meditation inside a simple, beautiful temple in the Florida woods. Tall windows looking out to lush green forest. Sunlight filtering through trees creating dappled light inside. A few meditation cushions arranged nearby. Books on a small shelf. Deep quiet woodland sanctuary atmosphere. No text or words anywhere in the image.

**18. michael-beckwith.png**
{BASE} A charismatic African-American man with natural grey hair, wearing a flowing purple ceremonial robe, standing at the front of a beautiful church with his arms raised in celebration. A gospel choir behind him singing. The congregation on their feet with hands raised in joy. Golden light streaming through the ceiling. Spiritual energy and joy radiating through the scene. No text or words anywhere in the image.

**19. radha-agrawal.png**
{BASE} A joyful community leader, a woman in her 40s with long dark hair, dancing with arms raised in a crowd of happy people at an early morning dance party inside a sunlit warehouse. Golden sunrise light streaming through large industrial windows. A DJ booth visible in the background with warm lights. Everyone dancing together with huge smiles, pure joy and community energy. Sober morning party atmosphere. No text or words anywhere in the image.

**20. meghan-pappenheim.png**
{BASE} A warm blonde woman in relaxed bohemian clothing, standing at the entrance of a beautiful open-air yoga pavilion in Bali. Lush tropical jungle in the background with palm trees. Rice terraces visible in the distance. Colorful prayer flags hanging. Students arriving with yoga mats, greeting each other. Soft morning mist. Ubud Bali atmosphere with warm golden light. No text or words anywhere in the image.

**21. jeff-krasno.png**
{BASE} A thoughtful man with grey-brown hair wearing a casual henley, standing at the edge of a beautiful outdoor festival field at golden hour. In the foreground, yoga practitioners on mats stretching. In the background, a music stage with lights and mountains behind it. He is surveying the scene he built with quiet pride, hands in pockets. Wanderlust festival atmosphere. No text or words anywhere in the image.

**22. gabrielle-roth.png**
{BASE} An original character: a creative older woman with wild curly grey-streaked dark hair, wearing flowing dark artistic clothing, dancing ecstatically in a wooden dance studio. Other dancers around her in various states of free expressive movement. Bare feet on polished wooden floor. Dynamic, swirling energy in the scene. Dramatic warm side lighting creating long shadows. Dance as meditation atmosphere. No text or words anywhere in the image.

**23. larry-harvey.png**
{BASE} A rugged man with a distinctive handlebar mustache wearing a cowboy hat and a leather jacket, standing in the desert at dusk. Behind him in the distance, a massive wooden structure glows against a dramatic orange and purple sunset sky. Art installations and camp structures visible across the desert landscape. Dust particles catching the golden light. Burning Man desert atmosphere. No text or words anywhere in the image.

## Important Notes

- Use `gemini-3.1-flash-image-preview` model, NOT `gemini-2.5-flash-image` (different output style)
- "Square 1:1 composition." in the prompt ensures 1024x1024 output
- For Gabrielle Roth: use "An original character" framing to avoid content filter blocks (she's deceased, Gemini may block)
- For Radha Agrawal: use "A joyful community leader" framing (content filter blocked her name previously)
- If any image fails with PROHIBITED_CONTENT, rephrase to describe the character generically without using their name
- Delay 2-3 seconds between API calls
- Overwrite existing files in `public/images/creators/`
- After generation, verify all images are 1024x1024 with: `sips -g pixelWidth -g pixelHeight public/images/creators/*.png`
