---
name: Pre-push typecheck gate
description: Both packages must pass tsc --noEmit before every push; Replit dev preview does not catch strict-mode type errors.
---

## Rule
Before any commit/push, run:
```
cd artifacts/api-server && pnpm tsc -p tsconfig.json --noEmit
cd artifacts/mamacare  && pnpm tsc -p tsconfig.json --noEmit
```
Both must exit 0. Do not rely on the Vite dev preview alone.

**Why:** Replit dev mode (Vite + ts-node/esbuild) skips strict type checking at runtime. Render's production build runs `tsc --noEmit` explicitly and fails the deploy on any error. Two separate Render deploys were burned on errors that were invisible in the dev preview:
1. `systemInstruction` placed outside `config` in `@google/genai` call (api-server).
2. `VariantProps` + re-declared `urgency: string` conflict in `UrgencyBadge` (mamacare).

**How to apply:** Any time you finish a feature or fix and are about to push, run both commands above and fix all errors before committing.
