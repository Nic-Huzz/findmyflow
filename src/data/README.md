# Archetype Data Structure

This folder contains all the archetype profile data for the Find My Flow application.

## File Structure

- `essenceProfiles.js` - Essence archetype profiles (already exists)
- `protectiveProfiles.js` - Protective archetype profiles
- `personaProfiles.js` - Persona stage profiles

## Data Structure

Each profile follows this structure:

```javascript
export const profileType = {
  "Archetype Name": {
    summary: "One-line description",
    detailed: {
      howItShowsUp: "How this pattern manifests in daily life",
      breakingFree: "How to work with this pattern",
      image: "/images/archetypes/type/archetype-name.png"
    }
  }
}
```

## Image Organization

Images are stored in `public/images/` with this structure:
- `archetypes/essence/` - Essence archetype images
- `archetypes/protective/` - Protective archetype images  
- `personas/` - Persona stage images

## Usage in Components

```javascript
import { protectiveProfiles } from '@/data/protectiveProfiles'
import { essenceProfiles } from '@/data/essenceProfiles'
import { personaProfiles } from '@/data/personaProfiles'

// Access profile data
const profile = protectiveProfiles["Perfectionist"]
const image = profile.detailed.image
```
