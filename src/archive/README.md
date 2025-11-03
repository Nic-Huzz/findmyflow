# Archived Components

This folder contains deprecated/test components that have been replaced by unified implementations.

## Archived Components

### **App-test.jsx**
- **Status:** Archived November 2024
- **Reason:** Test version of main App.jsx - layout issues resolved in main component
- **Replaced by:** `src/App.jsx` (main flow)

### **EssenceTest.jsx & EssenceTest.css**
- **Status:** Archived November 2024
- **Reason:** Standalone test component for essence archetypes
- **Note:** Essence archetype selection now integrated into main flow via `HybridArchetypeFlow.jsx`

### **HybridEssenceFlow.jsx**
- **Status:** Archived November 2024
- **Reason:** Standalone hybrid essence flow component
- **Replaced by:** `src/HybridArchetypeFlow.jsx` (unified component handling both essence and protective)

### **HybridProtectiveFlow.jsx**
- **Status:** Archived November 2024
- **Reason:** Standalone hybrid protective flow component
- **Replaced by:** `src/HybridArchetypeFlow.jsx` (unified component handling both essence and protective)

### **HybridCombinedFlow.jsx**
- **Status:** Archived November 2024
- **Reason:** Standalone combined hybrid flow component
- **Replaced by:** `src/HybridArchetypeFlow.jsx` (unified component handling both essence and protective)

## Usage

These files are archived for reference only. They are **not imported or used** in the active codebase.

If you need to reference these components:
1. Check the archived files for implementation details
2. Update import paths if you restore them (they reference CSS files in parent directory)

## Related Archives

- `public/archive/Essence-test.json` - Test data for essence archetypes
- `public/archive/Protective-test.json` - Test data for protective archetypes

## Cleanup Policy

These files can be safely deleted after 6 months if they haven't been referenced.

