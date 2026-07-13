# MamaCare Triage

An offline-first, multimodal AI health triage assistant for community health workers (CHWs) in rural Nigerian clinics. Built for the "Build with Gemma: GenAI for SDGs" hackathon (SDG 3 — Good Health). Submission deadline: July 25, 2026.

## Run & Operate

- `pnpm --filter @workspace/mamacare run dev` — run the frontend (port from workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Required secret: `GEMINI_API_KEY` — Google Gemini API key (user's own, from https://aistudio.google.com/apikey)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS, Wouter (routing), TanStack React Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: Gemma 4 (`gemma-4-26b-a4b-it`) via Google AI Studio API (multimodal — photo + text analysis)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mamacare/` — React frontend (design: earthy forest palette, forest green + terracotta)
- `artifacts/api-server/` — Express API server
- `artifacts/api-server/src/lib/triage.ts` — Gemini multimodal triage logic (THE core AI feature)
- `artifacts/api-server/src/routes/patients/` — Patient CRUD routes
- `artifacts/api-server/src/routes/visits/` — Visit/triage routes (calls Gemini)
- `artifacts/api-server/src/routes/dashboard/` — Dashboard stats + recent visits
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/patients.ts` — Patients table
- `lib/db/src/schema/visits.ts` — Visits table (stores full triage results)
- `lib/integrations-gemini-ai/` — Gemini AI client lib (modified for user-provided GEMINI_API_KEY)

## Architecture decisions

- Gemini AI Integration: Uses user's own `GEMINI_API_KEY` (not Replit AI Integrations) — modified `lib/integrations-gemini-ai/src/client.ts` and `image/client.ts` to use `GEMINI_API_KEY` instead of `AI_INTEGRATIONS_GEMINI_*` vars.
- `@google/genai` and `p-limit`, `p-retry` are added as direct dependencies of `api-server` because esbuild externalizes `@google/*` — they must be in api-server's own node_modules to be resolved at runtime.
- Photo upload: frontend reads file as base64 and sends as `photoBase64` field; backend strips `data:image/...;base64,` prefix before sending to Gemini inline data.
- Body size limit: `express.json({ limit: "20mb" })` to handle large base64 images.
- Danger sign safety: if `dangerSignDetected=true`, server always sets `referralRequired=true` and `urgency="urgent_referral"` regardless of Gemini output.
- `weightKg` is stored as Drizzle `numeric` (returns string from DB) — mapped to `parseFloat()` in route handlers before Zod parsing.

## Product

- **Dashboard**: Today's stats + recent triage activity feed across all patients
- **Patient Registry**: Searchable list of all patients with last visit urgency
- **Patient Registration**: Form to add a new patient (name, age, weight, sex, village, phone)
- **Patient Profile**: Demographics + full visit history timeline + "New Triage" CTA
- **Triage Core**: Photo upload + symptom text → Gemini AI analysis → urgency badge + guidance in English & Yoruba. Shows full-width red "REFER TO HOSPITAL NOW" banner when danger signs detected.
- **Visit Detail**: Full triage result including conditions, dosage, bi-lingual guidance

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`
- Run `pnpm --filter @workspace/db run push` after changing `lib/db/src/schema/`
- The Gemini client (`lib/integrations-gemini-ai`) uses `GEMINI_API_KEY` — NOT the Replit AI Integration env vars
- `@google/genai` must stay in `artifacts/api-server/package.json` dependencies (not just the lib) or esbuild leaves it unresolved at runtime

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
