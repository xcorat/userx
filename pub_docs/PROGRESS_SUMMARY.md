**Progress Summary**

This document summarizes the QnA App (POC) as implemented in this repository. It covers a high-level overview, basic usage for a single user, and concise implementation notes for the major parts and features.

**Overview**
- **App Type:**: Single-user platform with a shared main app layer powering multiple apps (Q&A + additional apps such as Memeball).
- **Purpose:**: Lightweight social Q&A plus companion apps (example: Memeball) that reuse core services and components. Users post short questions, answer them (public or private), and exchange DM questions; Memeball provides a swipeable meme voting experience.
- **Primary Users:**: Individual users interacting with one or more apps built on the shared platform.

**Basic Usage**
- **Browse Questions:**: Open the root route (`/`) to view the questions feed and sort/filter options.
- **Answer a Question:**: Click a question card or use the inline answer form. Choose visibility (`PUBLIC` or `PRIVATE`).
- **View Aggregates:**: After answering, public aggregates (counts/percentages) appear on the question.
- **Profile:**: Visit `/profile` to see own answers, stats, and edit profile. Other users' profiles show only public answers.
- **DMs:**: Use the DM composer to send private questions to other users and answer received DM questions via the inbox (`/dm`).

**Architecture & Implementation Summary**
- **Framework:**: SvelteKit with Svelte 5 + TypeScript.
- **Project Structure:**: Main source under `src/` with `lib/` (models, services, stores, repositories), `routes/` for SvelteKit pages and APIs, and `pub_docs/` for public documentation.
- **DI Pattern:**: A DI container (`lib/config/di-container.ts`) resolves services and repositories so higher layers depend on abstractions.

**Multi-App / Shared Main Layer**
- **Shared Core:**: The repository, service, and store layers form a reusable main app layer that multiple frontends/features consume (Q&A, Memeball, etc.).
- **Feature Isolation:**: Feature apps live under `src/routes/` (e.g., `/memeball`) and may use their own layouts while reusing DI-registered services, shared components, and store patterns.
- **Server Boundary:**: Server-only code is isolated in `src/lib/server/` (database and SQLite/D1 repositories) to avoid bundling native modules into browser builds.
- **API Layer:**: Client-side apps use API repositories (fetch-based) that call SvelteKit server routes under `src/routes/api/`. This allows multiple apps (web, mobile, other clients) to use the same backend.
- **Examples:**: Memeball is implemented as an independent feature that reuses the DI container and can be backed by mock, API, SQLite, or D1 repositories depending on environment.

**Data Layer**
- **Models:**: Domain models in `src/lib/models/` (User, Question, Answer, DM, Aggregate, etc.).
- **Repository Interfaces:**: Under `src/lib/repositories/interfaces/`; implementations live in `src/lib/repositories/implementations/` (mocks and server adapters).
- **Storage Adapters:**: Mock repositories for client/dev and server-side adapters (SQLite local dev, Cloudflare D1 in production) selected by the repository factory.

- **Environment Detection & Storage Selection:**: The app uses `NODE_ENV` and other environment signals to choose storage:
	- `development` → SQLite (local `better-sqlite3`) or `mock` for fast iteration
	- `production` → D1 (Cloudflare) via server API routes
	- Client builds never import SQLite directly; the `ServerRepositoryFactory` ensures server-only code stays server-side.

**Business Logic (Services)**
- **Auth Service:**: Handles signup/login and current user resolution (`src/lib/services/auth.service.ts`).
- **Question Service:**: Fetches, sorts, validates, and creates questions (`question.service.ts`). Sorting options include newest, trending, and random.
- **Answer Service:**: Creates answers, enforces visibility rules, prevents duplicates, and supports updates/deletes (`answer.service.ts`).
- **Aggregate Service:**: Computes question-level aggregates (counts, percentages) for public answers (`aggregate.service.ts`).
- **DM Service:**: Sends and retrieves DM questions, enforces authorization for viewing conversations (`dm.service.ts`).

**State Management (Stores)**
- **Svelte 5 Runes:**: Stores use `.svelte.ts` files with `$state` runes (e.g., `auth.store.svelte.ts`, `questions.store.svelte.ts`) so UI components reactively bind to state.
- **Flow:**: Components call store methods → stores call services → services call repositories.

**UI Components**
- **Shadcn-svelte Primitives:**: UI primitives and components live under `src/lib/components/` and use shadcn-svelte for consistent look-and-feel.
- **Key Components:**: QuestionCard, QuestionList, AnswerForm, ProfileHeader, DMInbox, DMComposer, and layout components (`Header`, `Navigation`).

**Routing & APIs**
- **SvelteKit Routes:**: Page routes under `src/routes/` (e.g., `/`, `/profile`, `/dm`, `/questions/[id]`).
- **API Endpoints:**: Server routes under `src/routes/api/` integrate with server repositories and return JSON used by client-side stores.

- **API Coverage:**: The app exposes 40+ API endpoints covering users, questions, answers, DMs, relations, memes, and admin/debug routes. Endpoints support filtering, pagination, and standard CRUD operations so multiple apps can reuse the same backend.

**Testing & QA**
- **Planned Tests:**: Unit tests for utilities and services; integration tests for store-service interactions; E2E tests for core flows.
- **Tools:**: Vitest for unit testing and Playwright for E2E (per WBS plan). Test setup lives in project config and package.json scripts.

**Deployment & Runtime**
- **Dev:**: Runs with local SQLite (or mock repos) via `pnpm dev`.
- **Production:**: Configured to deploy to Cloudflare Workers with D1 (detects `platform.env.DB`) or to static hosts if APIs are hosted separately.

- **Runtime Summary:**: Browser apps use API repositories (`/api/*`) that call server routes. Server routes instantiate SQLite or D1 repositories depending on environment. This pattern supports multiple client apps against the same backend.

**Identity & Security**
- **Ed25519 Identity:**: The system migrated to using `User.publicKey` (Ed25519) as the canonical user identifier. Private keys are encrypted locally and only encrypted blobs are stored server-side for onboarding/testing.
- **Auth Flow:**: Challenge-response login with signed challenges (two-step endpoints) — suitable for secure, key-based authentication across apps.

**Key Design Notes**
- **Separation of Concerns:**: Services hold business logic; Repositories handle persistence; Components and Stores handle UI and state.
- **Swapable Storage:**: The `ServerRepositoryFactory` and DI container make it straightforward to swap storage backends without changing services.
- **Rune Usage:**: Runes (`$state`, `$derived`, `$effect`) are only used inside `.svelte` or `.svelte.ts` files per project rules.

**Next Steps / Recommendations**
- **Finalize Tests:**: Add unit and integration tests for all services and repositories to reach target coverage.
- **Seed Data:**: Create richer mock and seed data for more realistic demos (see `scripts/d1-seed.sql` and `scripts/d1-seed.ts`).
- **Polish UI:**: Improve empty states, add transitions, and refine responsive layout.
- **CI/CD:**: Add automated test runs and deploy pipelines (GitHub Actions / Wrangler for Cloudflare).

- **Multi-App Recommendations:**: When adding new apps that reuse the main layer:
	- Register feature-specific services in the DI container and keep feature UI isolated to its route/layout.
	- Use API repositories for client-side code; keep database adapters server-only under `src/lib/server/`.
	- Reuse seed data and deterministic UUID/keypair scripts for consistent cross-app identities.

**Contact / Docs**
- **Architecture Docs:**: See `docs/` for FRD/PRD and design notes.
- **Code Entry Points:**: Start here: `src/lib/config/di-container.ts`, `src/routes/+page.svelte`, and `src/lib/services/`.

---
Generated: automated progress summary (concise). For more detail, open the files linked above.
