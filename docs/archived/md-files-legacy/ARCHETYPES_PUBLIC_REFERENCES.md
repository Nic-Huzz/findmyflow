# Public-Facing "Archetypes" References

This document lists all places where "archetypes" appears in user-facing text (not code variables or internal references).

## 🎯 HIGH PRIORITY - User-Facing UI Text

### **src/Profile.jsx**
1. **Line 248**: Navigation menu item
   ```jsx
   ✨ Archetypes
   ```
   - **Location**: Sidebar navigation
   - **Action**: Change to "✨ Voices" or "✨ Your Voices"

2. **Line 402**: Section title
   ```jsx
   <h2 className="section-title">Your Archetypes</h2>
   ```
   - **Location**: Main profile page section
   - **Action**: Change to "Your Voices"

### **src/ArchetypeSelection.jsx**
3. **Line 77**: Page title
   ```jsx
   <h1 className="page-title">Your Archetypes</h1>
   ```
   - **Location**: Archetype selection page header
   - **Action**: Change to "Your Voices"

4. **Line 85**: Intro section title
   ```jsx
   <h2 className="intro-title">Explore Your Archetypes</h2>
   ```
   - **Location**: Intro text on selection page
   - **Action**: Change to "Explore Your Voices"

### **src/Challenge.jsx**
5. **Line 1202**: Tooltip text
   ```jsx
   title="View your archetypes"
   ```
   - **Location**: Button tooltip
   - **Action**: Change to "View your voices"

6. **Line 1206**: Button text
   ```jsx
   ✨ Archetypes
   ```
   - **Location**: Challenge page button
   - **Action**: Change to "✨ Voices"

### **public/challengeQuests.json**
7. **Line 62**: Quest name
   ```json
   "name": "Identify Your Archetypes",
   ```
   - **Location**: Weekly quest
   - **Action**: Change to "Identify Your Voices"

### **mockups/archetype-selection-page.html**
8. **Line 6**: Page title (HTML)
   ```html
   <title>Your Archetypes - Selection Page</title>
   ```
   - **Location**: Browser tab title
   - **Action**: Change to "Your Voices - Selection Page"

9. **Line 214**: Page heading
   ```html
   <h1 class="page-title">Your Archetypes</h1>
   ```
   - **Location**: Mockup page
   - **Action**: Change to "Your Voices"

10. **Line 221**: Intro title
    ```html
    <h2 class="intro-title">Explore Your Archetypes</h2>
    ```
    - **Location**: Mockup page
    - **Action**: Change to "Explore Your Voices"

## 📝 MEDIUM PRIORITY - Journey/Milestone Text

### **public/mockups/journey-style-3-cards.html**
11. **Line 304**: Journey milestone
    ```html
    Identified your essence and protective archetypes
    ```
    - **Location**: Journey visualization
    - **Action**: Change to "Identified your essence and protective voices"

### **public/mockups/journey-style-2-path.html**
12. **Line 285**: Milestone description
    ```html
    <div class="milestone-description">Found your archetypes</div>
    ```
    - **Location**: Journey path visualization
    - **Action**: Change to "Found your voices"

## 📦 LOW PRIORITY - Archive Files

### **public/archive/challengeQuests copy.json**
13. **Line 51**: Quest name (archive file)
    ```json
    "name": "Identify Your Archetypes",
    ```
    - **Note**: This is an archive/backup file
    - **Action**: Optional - update for consistency

## 🔍 CODE REFERENCES (DO NOT CHANGE)

These are code variables, file paths, or internal references that should **NOT** be changed:

- File paths: `/images/archetypes/...` (image directory structure)
- Component names: `ArchetypeSelection.jsx`, `HybridArchetypeFlow.jsx`
- Route paths: `/archetypes`, `/archetypes/essence`, `/archetypes/protective`
- CSS classes: `.archetype-card`, `.archetypes-section`, etc.
- Data structure keys: `essence_archetypes` in JSON/data files
- Variable names: `archetype`, `archetypes`, `archetypeType`, etc.
- Comments: Code comments mentioning archetypes

## 📊 Summary

**Total public-facing occurrences**: 12-13 (depending on whether archive files are included)

**Priority breakdown**:
- **High Priority** (UI text): 10 occurrences
- **Medium Priority** (journey text): 2 occurrences  
- **Low Priority** (archive): 1 occurrence

## 🎯 Recommended Changes

1. **Navigation & Headers**: "Archetypes" → "Voices" or "Your Voices"
2. **Page Titles**: "Your Archetypes" → "Your Voices"
3. **Quest Names**: "Identify Your Archetypes" → "Identify Your Voices"
4. **Journey Text**: "archetypes" → "voices"

