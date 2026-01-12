---
description: Add page context for Zarlo AI co-founder
---
# Add Zarlo Page Context

You are adding context for a new page so Zarlo AI can provide relevant help.

## Steps

1. **Read the existing context file**: `src/lib/zarlo/zarloPageContent.js`

2. **Gather page details** - Ask user for:
   - Route path (e.g., "/content-strategy")
   - Page name/title
   - What the page helps users accomplish
   - Common questions users might have
   - Suggested quick reply prompts

3. **Add context entry** to `zarloPageContent.js`:
   ```javascript
   '/route-path': {
     pageName: 'Page Name',
     context: `
       This page helps users [accomplish X].

       Key features:
       - Feature 1
       - Feature 2

       Users typically need help with:
       - Understanding how to [action]
       - Deciding between [options]
     `,
     quickReplies: [
       'How do I get started?',
       'What should I focus on first?',
       'Can you explain [concept]?',
     ],
   },
   ```

4. **Context writing tips**:
   - Be specific about what the page does
   - Include terminology used on the page
   - Mention related flows/pages for cross-referencing
   - Keep quick replies actionable and common

5. **Test** by navigating to the page and opening Zarlo widget

## Output
Show the context entry added and suggest testing the integration.
