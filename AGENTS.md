# Repository Guidelines

## Project Structure & Module Organization
- Source lives under `src/` with HTTP wiring in `routes/`, controllers in `controllers/`, business logic in `services/`, shared helpers in `utils/` and `middleware/`, and common types in `types/`.
- Transpiled output lands in `dist/`; static assets sit in `public/`; Vercel deploys via `api/index.js`.
- Jest specs mirror the source tree inside `tests/`; shared mocks and setup belong in `tests/setup.ts`.

## Build, Test, and Development Commands
- `npm run dev` starts the API with `ts-node` and Nodemon for hot reload during local development.
- `npm run build` compiles TypeScript to `dist/`; follow with `npm start` to serve the production bundle.
- `npm test` (optionally `npm test -- --watch`) runs Jest; `npm run lint` and `npm run typecheck` gate ESLint and the TypeScript compiler.

## Coding Style & Naming Conventions
- Follow `.eslintrc.json`: two-space indentation, single quotes, required semicolons, and no unused vars.
- Prefer TypeScript interfaces for request/response DTOs; keep filenames camel-case to match exports (e.g., `bidMultiplierService.ts`, `auth.controller.ts`).
- Avoid `any`; if unavoidable, document the expected shape in `types/` and add a narrowing helper.

## Testing Guidelines
- Tests use Jest with `ts-jest`; one spec per module (e.g., `tests/services/bidMultiplierService.spec.ts`).
- Cover validation branches, error paths, and Snapchat API interactions; add regression tests when fixing bugs.
- Run `npm test` before submitting and ensure `tests/setup.ts` initializes shared mocks.

## Commit & Pull Request Guidelines
- Follow the conventional subject style (`fix:`, `simplify:`, `chore:`) under 72 characters; group related changes per commit.
- PR descriptions should state the problem, solution, and validation (command output or relevant screenshots); link to tracking issues when available.
- Verify CI by running `npm run lint`, `npm run typecheck`, and `npm test` locally before requesting review.

## Environment & Deployment Tips
- Copy `.env.example` to `.env` and supply Snapchat OAuth credentials plus local secrets; keep production secrets in the manager.
- For Vercel, rerun `npm run build` so `api/index.js` reflects new logic; use scripts like `test-direct-token.sh` to verify deployed endpoints.
