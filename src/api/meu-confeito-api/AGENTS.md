# AGENTS.md - System Guidelines

## Instructions

### Operation principles

- Do not rewrite entire files for minor modifications; apply targeted, surgical edits.
- Do not install new `npm` packages or execute destructive database operations without explicit user authorization.
- Do not create git commits; all commits are done manually by the user.

### Code standards and conventions

- Always code in English. Comments may be written in Portuguese only when strictly necessary.
- Documentation summaries, tags and descriptions must be written in Portuguese.
- Always run `npx eslint` and `npx tsc --noEmit` after changing imports, moving files, or finishing a task to ensure linting and types pass.
- Format modified files with Prettier: `npx prettier --write <modified-file>` (or `npx prettier . --write` if multiple modules changed).
- Avoid the usage of `any` when typing; explicit type definitions or inferences are required (the only exception is Raw SQL queries).
- Keep files cohesive and small, breaking responsibilities when appropriate (avoid over-engineering if the complexity outweighs the benefit).

## Project Architecture

### Tech stack and commands

- **Runtime & Language:** Node.js (20+), TypeScript (strict mode).
- **Backend & ORM:** Express, Prisma ORM.
- **Database:** PostgreSQL with PostGIS extension.
- **Typecheck:** `npx tsc --noEmit`
- **Linter & Formatter:**
  - Linter: `npx eslint <file-path>` (or `npx eslint src/`)
  - Formatter: `npx prettier --write <file-path>`
- **Auth:** JWT access tokens (15 minutes) with refresh tokens (TTL defined in `.env`).

### Flow

Request Flow: `Routes -> Middlewares/Zod Validation -> Controller -> Service -> DB`

### Simplified tree

- **Database Schema:** `prisma/schema.prisma`
- **Application Routes Aggregator:** `src/routes.ts`
- **Core (Shared & Cross-Cutting Infrastructure):** `src/core/`
  - _Database:_ `src/core/database/prisma.client.ts`
  - _Errors:_ `src/core/errors/app.error.ts`, `http.error.ts`, `error.code.ts`
  - _HTTP Responses:_ `src/core/http/api.response.ts`, `http.success.ts`, `response.success.ts`
  - _Middlewares:_ `src/core/middlewares/auth.middleware.ts`, `error.handler.ts`, `logger.middleware.ts`, `rate-limit.middleware.ts`, `request-id.middleware.ts`, `upload.middleware.ts`, `validate.middleware.ts`
  - _Types:_ `src/core/types/context.interface.ts`, `express.d.ts`, `schema.interface.ts`
  - _Utils:_ `src/core/utils/slugify.util.ts`, `storage.util.ts`
- **Modules (Package by Feature):** `src/modules/[module]/`
  - _Routes:_ `src/modules/[module]/[module].route.ts`
  - _Zod Validation:_ `src/modules/[module]/[module].schema.ts`
  - _Controllers:_ `src/modules/[module]/[module].controller.ts`
  - _Services:_ `src/modules/[module]/[module].service.ts`
  - _DTOs:_ `src/modules/[module]/[module].dto.ts`
  - _Domain Utils (optional):_ `src/modules/[module]/utils/[util].util.ts`
  - _Documentation:_ `src/modules/[module]/docs/[module].doc.yaml`
  - _Yaml Components:_ `src/modules/[module]/docs/[module].component.yaml`

### Run the project

To run, just execute `npm run dev`.

## Skills & Workflows (`.agents/skills/`)

- Before starting a complex or repetitive task, check if a dedicated skill exists in the repository.
- **Location:** Skills are stored in `.agents/skills/<skill-name>/SKILL.md` or a standalone `SKILL.md`.
- **Execution Triggers:** When requested to perform standard tasks, strictly follow the step-by-step procedures outlined in the matching skill file.

## Definition of Done (DoD)

Before completing any task, ensure you run:

1. `npx eslint <modified-file>` (must pass without errors)
2. `npx prettier --write <modified-file>` (to format updated code)
