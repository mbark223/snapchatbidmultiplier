# Repository Guidelines

## Project Structure & Module Organization
- Keep application code in `src/` with `routes/` for HTTP wiring, `controllers/` for request handling, `services/` for business logic, and shared helpers under `utils/` plus `middleware/`.
- Place DTOs and shared types in `types/`. Static assets belong in `public/`, while Vercel deploys through `api/index.js`.
- Transpiled bundles land in `dist/`. Jest specs mirror the source tree under `tests/`, with shared mocks or bootstrapping logic centralized in `tests/setup.ts`.

## Build, Test, and Development Commands
- `npm run dev` starts the API with `ts-node` and Nodemon for live reload.
- `npm run build` transpiles TypeScript to `dist/`; follow with `npm start` to serve the production bundle.
- `npm test` executes Jest; use `npm test -- --watch` for focused iteration. Run `npm run lint` and `npm run typecheck` before submitting changes.

## Coding Style & Naming Conventions
- Follow `.eslintrc.json`: two-space indentation, single quotes, and required semicolons.
- Prefer TypeScript interfaces for request/response DTOs. Match filenames to exports (e.g., `bidMultiplierService.ts`, `auth.controller.ts`).
- Avoid `any`; if unavoidable, document the structure in `types/` and add a narrowing helper.

## Testing Guidelines
- Specs live beside peers in `tests/`. Use `ts-jest` helpers and initialize shared mocks in `tests/setup.ts`.
- Cover validation branches, error paths, and Snapchat API integrations. Add regression tests whenever you fix bugs.
- Run `npm test` before pushing to keep suites green.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `fix: correct bid rounding`). Keep subjects under 72 characters and group related changes.
- PR descriptions should state the problem, solution, and validation steps (e.g., `npm test`, `npm run lint` outputs). Link tracking issues and add screenshots for UI-affecting changes.

## Environment & Deployment Tips
- Copy `.env.example` to `.env` and configure Snapchat OAuth plus local secrets. Never commit production credentials.
- Rebuild with `npm run build` before deploying so `api/index.js` matches the latest logic. Use helper scripts like `test-direct-token.sh` to verify deployed endpoints.
