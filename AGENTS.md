# Repository Guidelines

## Project Structure & Module Organization
The TypeScript Express app lives in `src/`: HTTP wiring in `routes/`, request handlers in `controllers/`, business logic in `services/`, plus shared helpers under `utils/` and `middleware/`. DTOs and types centralize in `types/`. Build artifacts land in `dist/`, static assets in `public/`, Vercel uses `api/index.js`, and Jest specs sit in `tests/` with shared setup at `tests/setup.ts`.

## Build, Test, and Development Commands
- `npm run dev` runs the API through `ts-node` with Nodemon for local hot reload.
- `npm run build` emits production JS into `dist/`; `npm start` serves that bundle.
- `npm test` executes the Jest suite; append `--watch` for rapid cycles.
- `npm run lint` and `npm run typecheck` gate ESLint and the TypeScript compiler before PRs.

## Coding Style & Naming Conventions
ESLint (`.eslintrc.json`) is the source of truth: two-space indentation, single quotes, required semicolons. Prefer TypeScript interfaces for request/response shapes and keep file names camel-case to mirror exports (`bidMultiplierService.ts`, `auth.controller.ts`). Avoid `any`; when you must, document the shape and add a narrowing helper in `types/`. Route logs through the shared logger instead of `console` to satisfy lint rules.

## Testing Guidelines
Tests use Jest with `ts-jest`. Mirror the source path under `tests/` (e.g. `tests/services/bidMultiplierService.spec.ts`) and initialize shared mocks in `tests/setup.ts`. Cover validation, service error paths, and Snapchat API boundaries. Run `npm test` before submitting; when fixing bugs, add a regression spec showing the previous failure.

## Commit & Pull Request Guidelines
Follow the existing conventional tone (`fix:`, `simplify:`, `chore:`) for commit prefixes, keeping the subject under 72 characters and the body reserved for context or rollout notes. Group related changes into a single commit to make history reviewable. PRs should state the problem, the solution, and validation steps (command output, screenshots of the web interface when relevant). Link to tracking issues or tickets, request a reviewer familiar with the touched module, and verify that CI passes before merging.

## Environment & Deployment Tips
Copy `.env.example` to `.env` and supply Snapchat OAuth credentials plus local secrets; keep production values in your secret manager. For Vercel, ensure environment variables exist and rebuild with `npm run build` so `api/index.js` reflects new logic. Scripts like `test-direct-token.sh` and `test-auth.sh` verify tokens against deployed endpoints; use them before deployment PRs. Never commit tokens; track new secret files in `.gitignore`.
