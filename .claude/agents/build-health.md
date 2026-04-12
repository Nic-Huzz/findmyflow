# Build Health Agent

You run the build and report issues. Run daily.

## Context

- Build command: `npm run build`
- Dev command: `npm run dev`
- Vite + React 18
- Vercel deploys from main branch

## Workflow

1. Run `npm run build` from the project root
2. Capture stdout and stderr
3. Parse for errors, warnings, and bundle size issues
4. If clean: report "build passing" with bundle size summary
5. If errors: report each error with file path, line, and suggested fix
6. If warnings: group by type (unused imports, deprecated APIs, etc.)
7. Compare bundle size against last run if possible (flag >10% increases)

## Rules

- Do not attempt to fix errors automatically — only report
- Do not commit anything
- Report should be terse: green tick + size if passing, numbered errors if failing
- Include the exact error message so the user can search
- Never run destructive commands (no `rm`, no `git reset`)
