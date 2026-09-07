# AGENTS.md - System Guidelines

## Instructions

### Operation principles

- Do not install new `npm` packages or add third-party dependencies without explicit user authorization.
- Do not create git commits; all commits are done manually by the user.

### Code standards and conventions

- Always code in English. Comments may be written in Portuguese only when strictly necessary.
- **Boolean Naming Convention (ESLint):** All boolean variables, props, and state indicators MUST use standard auxiliary verb prefixes (`is`, `has`, `can`, `should`, `will`, `did`, etc. — e.g., `isLoading`, `hasError`, `isVisible`, `canSubmit`). The linter strictly checks this rule; naming booleans without these prefixes will fail the build.
- **Modularity & Clean Architecture:** Break down complex screens and logic aggressively. You can and should create modular components (`src/components`), custom hooks (`src/hooks`), constants (`src/constants`), types (`src/types`), and utility functions (`src/utils`) to prevent bloated, monolithic screen files.
- Always run `npx eslint` and `npx tsc --noEmit` after changing imports, moving files, or finishing a task to ensure linting and types pass.
- Format modified files with Prettier: `npx prettier --write <modified-file>` (or `npx prettier . --write` if multiple files changed).
- Avoid the usage of `any` when typing; explicit type definitions, interfaces, or proper generic inferences are required.
- Follow the design guidelines in `DESIGN.md`:
  - **Flat-First Policy:** No elevation or drop shadows on standard containers/cards (rely on background contrast and 1px borders); elevation is strictly reserved for Floating Action Buttons (FAB).
  - **Touch Targets:** Maintain a minimum hit target of `48x48dp` for all interactive controls.
  - **Design Tokens:** Always consume colors, typography, and spacing from the centralized theme system (`src/theme`) rather than hardcoding arbitrary values.

## Project Architecture

### Tech stack and commands

- **Framework & Runtime:** React Native with Expo (SDK 57).
- **Navigation:** Expo Router (file-based routing under `app/`).
- **Language:** TypeScript (strict mode).
- **HTTP Client:** Axios (`src/services`) for communication with the backend API.
- **Typecheck:** `npx tsc --noEmit`
- **Linter & Formatter:**
  - Linter: `npx eslint <file-path>` (or `npx eslint .`)
  - Formatter: `npx prettier --write <file-path>`

### Simplified tree

- **Routes & Screens:** `app/`
  - _Tab Navigation:_ `app/(tabs)`
  - _Root Layouts:_ `app/_layout.tsx`
- **Assets:** `assets/images`
- **Components:** `src/components/` (reusable UI elements: buttons, cards, inputs, tags, etc.)
- **Configuration:** `src/config/` (environment config, API base URLs, Axios setup)
- **Constants:** `src/constants/` (layout dimensions, static options, fixed values)
- **Contexts:** `src/contexts/` (React Contexts for state management, e.g., auth, global state)
- **Hooks:** `src/hooks/` (reusable custom hooks for UI and business logic)
- **Services:** `src/services/` (Axios API calls, endpoints, and HTTP handling)
- **Theme:** `src/theme/` (colors, typography, spacing tokens, and theme definitions)
- **Types:** `src/types/` (TypeScript interfaces, DTOs, navigation types, and API contracts)
- **Utils:** `src/utils/` (pure helper functions, currency/date formatters, validators)

### Run the project

To run the application, execute:

- `npx expo start` (or `npm start`)

## Definition of Done (DoD)

Before completing any task, ensure you run:

1. `npx eslint <modified-file>` (must pass without errors, paying special attention to boolean naming and unused imports)
2. `npx prettier --write <modified-file>` (to format updated code)
3. `npx tsc --noEmit` (to guarantee no type regressions were introduced)
