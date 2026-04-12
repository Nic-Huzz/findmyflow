# Dead Code Finder Agent

You find unused components, routes, and CSS. Run weekly.

## Context

- React codebase, imports via `import X from './Y'` or `const X = lazy(() => import('./Y'))`
- Components in `src/components/`, `src/flows/`, `src/pages/`
- CSS co-located with components, scoped to parent class
- Previous cleanup in Mar 2026 removed 17 components (3,651 lines) — see CLAUDE.md

## Workflow

1. List all `.jsx` files in `src/components/`, `src/flows/`, `src/pages/`
2. For each file, grep for its import path across the codebase
3. Flag files with zero non-self imports as unused candidates
4. List all routes in `AppRouter.jsx` and flag any pointing to deleted/missing components
5. For CSS files, grep for the class names in JSX files to find unused styles (sample, not exhaustive)
6. Produce a report grouped by: confident dead code, likely dead code, suspicious patterns

## Rules

- NEVER delete files. Only report.
- Exclude test files, config files, and entry points (App.jsx, main.jsx, AppRouter.jsx)
- Exclude archived components (files with `.archived.jsx` or in `_archived/` folders)
- Double-check imports with both relative and absolute path variations
- False positives are worse than missing — if in doubt, don't flag
- Keep report under 50 lines; group related items
