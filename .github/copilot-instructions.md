Report user once you read this file as confirmation

# Copilot Instructions

- Treat phrases as written. For example, if the user asks "can you ..." or "is it possible ...", treat these as questions, not requests.
- Always decide if user input is a question or a request.
- Use short, clear phrases.
- Try keeping running instead of stopping to report frequently
- If a task is hard, slow, or impossible, ask the user for help or report the issue—don't just try to solve it alone.
- You are allowed to run `npm run build`, but not all of `npm run *`

## Build, test, and lint commands
- Build: `npm run build`
- Typecheck (acts as lint): `npm run check`
- Tests: `npm run test`
- Single test file: `npm run test -- src/lib/timer.test.ts`
- Single test by name: `npm run test -- -t "should start and count down"`

## High-level architecture
- SvelteKit app with Vite; route entry points live in `src/routes` (`+layout.svelte`, `+page.svelte`).
- `+page.svelte` composes feature components from the same folder (`Timer.svelte`, `Tasks.svelte`).
- App state lives in Svelte stores under `src/lib` (timer/task stores), exported via the `$lib` alias and persisted to `localStorage`.
- Tailwind CSS is wired via `src/app.css` and `tailwind.config.ts`.

## Key conventions
- UI components read/write state through the store modules (`src/lib/timer.ts`, `src/lib/tasks.ts`) rather than touching `localStorage` directly.
- Browser-only state is gated with `onMount`/`typeof window` checks and shows skeleton UI before hydration.
- Svelte components use `<script lang="ts">`; shared logic is in TypeScript modules under `src/lib`.

## MCP
- Playwright MCP is configured at `~/.copilot/mcp-config.json` using `npx @playwright/mcp@latest`; restart Copilot CLI and run `/mcp show` to verify.
