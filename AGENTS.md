# Repository Guidelines

## Project Structure & Module Organization
Keep application code in `src/`. Route definitions live in `src/routes/`, controllers in `src/controllers/`, and request-independent logic in `src/services/`. Shared helpers sit under `src/utils/`, with reusable middleware in `src/middleware/`. DTOs and shared types belong in `types/`. Static assets reside in `public/`, while Vercel deployments mount the compiled handler from `api/index.js`. Transpiled bundles are emitted to `dist/`. Jest specs mirror the source tree under `tests/`, with cross-cutting mocks initialized in `tests/setup.ts`.

## Build, Test, and Development Commands
Use `npm run dev` for a live-reloading API via `ts-node` and Nodemon. Build production assets with `npm run build`, then validate using `npm start`. Run `npm test` (or `npm test -- --watch`) to execute the Jest suite. Lint and type-check before raising a PR using `npm run lint` and `npm run typecheck`.

## Coding Style & Naming Conventions
Follow the enforced `.eslintrc.json`: two-space indentation, single quotes, and required semicolons. Prefer TypeScript interfaces for request and response DTOs, and align filenames with their primary export (e.g., `bidMultiplierService.ts`). Avoid `any`; if unavoidable, define structured types in `types/` and add a narrowing helper.

## Testing Guidelines
Place new specs beneath `tests/`, matching the folder layout of the unit under test and naming files `*.spec.ts`. Cover validation branches, error handling paths, and Snapchat API integrations. Initialize shared setup through `tests/setup.ts`, and ensure regression cases are added whenever you fix bugs.

## Commit & Pull Request Guidelines
Use Conventional Commits like `fix: correct bid rounding`, keeping subjects under 72 characters. PR descriptions must state the problem, outline the solution, and list validation steps (e.g., `npm test`, `npm run lint`). Link tracking issues and provide screenshots for user-facing changes.

## Security & Configuration Tips
Copy `.env.example` to `.env` for local development, populating Snapchat OAuth secrets without committing them. Rebuild with `npm run build` before deployments so `api/index.js` stays in sync. Use helper scripts such as `test-direct-token.sh` to validate endpoints in production-like environments.
