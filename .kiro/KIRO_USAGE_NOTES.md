# Kiro usage notes

Running log for the Kiroween 2026 write-up (requirement 17.8). Add an entry whenever a Kiro feature changes how the work went. Keep entries short and concrete: what we did, what Kiro produced, what we changed by hand, what it saved or cost. Do not use em dashes.

## How to use this file

- One entry per event, newest at the bottom.
- Link to the file or commit that shows the result.
- Note surprises and failures too. Judges value honest notes.
- Before submission, turn the best entries into the write-up and the demo video script.

## Feature checklist

| Kiro feature | Used? | Where | Notes |
| --- | --- | --- | --- |
| Specs (requirements, design, tasks) | yes | `.kiro/specs/story-scroll-horror/` | |
| Steering | yes | `.kiro/steering/` (product, tech, design-system) | |
| Agent hooks | yes | `.kiro/hooks/` | asset license check, lint and typecheck on save |
| Property-based testing | planned | `src/core/*.test.ts` with fast-check | scroll, gesture debounce, poster bounds, quality, counts |
| MCP | not yet | | candidate: Playwright MCP for e2e checks |
| Powers | not yet | | |
| Vibe or chat sessions | yes | | |

## Log

| Date | Kiro feature | What happened | Result |
| --- | --- | --- | --- |
| 2026-11-20 | Specs | Wrote requirements for 4 stages in EARS style, with a review pass that found 4 inconsistencies (fonts, fallback buttons, blink units, test tooling). | Fixed in requirements.md and steering. |
| 2026-11-20 | Steering | Product, tech and design-system files give every session the same rules (privacy, palette, folder layout). | |
| 2026-11-20 | Hooks | Added asset license check and lint on save hooks. | |
| 2026-11-25 | Spec tasks (delegated agent) | Implemented tasks 2.1 to 2.5 from tasks.md: Next.js scaffold, folder layout, tokens, docs, self-hosted fonts, CSP headers. | Lint, typecheck, test and build pass. |
