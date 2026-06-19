# Archived JSON Data Files

This folder previously contained test data files, but they have been moved back to `public/` because they are **still actively used**.

## Status Update

### **essence-archetypes.json** (formerly Essence-test.json)
- **Status:** Renamed and active (November 2024)
- **Reason:** Required by `src/HybridArchetypeFlow.jsx` for the swipe flow
- **Location:** `public/essence-archetypes.json`
- **Previous name:** `Essence-test.json` (renamed to remove "test" identifier)

### **protective-archetypes.json** (formerly Protective-test.json)
- **Status:** Renamed and active (November 2024)
- **Reason:** Required by `src/HybridArchetypeFlow.jsx` for the swipe flow
- **Location:** `public/protective-archetypes.json`
- **Previous name:** `Protective-test.json` (renamed to remove "test" identifier)

## Why They're Not Archived

These JSON files contain the swipe card data (name, description, image) needed for the hybrid swipe flow in the main application. The `HybridArchetypeFlow.jsx` component fetches these files at runtime.

**Note:** These files were renamed from `*-test.json` to `*-archetypes.json` to reflect their production use (no longer "test" files).

## Current Usage

- ✅ **Active:** `src/HybridArchetypeFlow.jsx` loads these files
- ❌ **Archived:** Components that used these files (`src/archive/HybridEssenceFlow.jsx`, etc.) are archived

## Cleanup Policy

These files should **NOT be archived** as they are part of the active application.

