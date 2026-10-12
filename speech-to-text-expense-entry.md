# Speech-to-Text for Ledgerly AI Expense Entry

## Objectives
Implement client-side browser Web Speech API voice input next to Ledgerly's AI natural language expense input, supporting English (`en-US`) and Bangla (`bn-BD`), handling listening/error states, maintaining financial draft validation via Groq, preserving explicit confirmation, and ensuring responsive mobile UX in Light & Dark modes.

## Tasks
- [x] Task 1: Create reusable Web Speech recognition hook (`apps/web/src/lib/use-speech-recognition.ts`) with feature detection, language switching (`en-US`, `bn-BD`), session deduplication, interim streaming, and error handling.
- [x] Task 2: Create accessible, theme-compliant microphone control & speech indicator components matching Ledgerly's `DESIGN.md` design tokens.
- [x] Task 3: Integrate microphone control into `apps/web/src/app/ai-entry/page.tsx`, preserving text append behavior, manual editability, and the existing Groq AI extraction & draft review/confirmation flow.
- [x] Task 4: Add unit and integration tests covering browser feature detection, start/stop/cancel lifecycle, interim streaming, permission denial, and duplicate session prevention.
- [x] Task 5: Mobile browser and responsive UI verification (touch targets, no overflow, light/dark mode contrast, iOS/Android compatibility constraints).
- [x] Task 6: Run verification suite (`npm test`, `npm run lint`, `npm run build:web`, and final checklist).
- [x] Task 7: Update system documentation (`ai2/current-state.md`, `ai2/decisions.md`, `ai2/known-issues.md`, `data/data-flow.md`).
