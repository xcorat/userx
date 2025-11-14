# QnA App (SvelteKit POC)

A proof-of-concept QnA platform built with SvelteKit, TypeScript, and shadcn-svelte. Features include:

- Public questions and answers
- Direct messaging (DM) system
- Answer visibility (public/private)
- Aggregates and stats
- Pagination
- User profiles
- Layered architecture: UI → Service → Repository → Storage
- Mock data, ready for SQLite migration

See `docs/PROGRESS_REPORT.md` for implementation details and progress.

## Features Implemented

### Phase 1 - Working Demo ✅

- **Authentication**
  - Login with email/password
  - Signup with name, email, password
  - Session persistence in localStorage
  - Route guards for protected pages

- **Questions Feed**
  - Display all public questions
  - Sort by Newest, Trending, Random
  - Show answer counts
  - Indicate if user has answered

- **Answer System**
  - Answer questions with multiple choice
  - Choose answer visibility (Public/Private)
  - One answer per user per question
  - View aggregates after answering

- **Aggregates**
  - Calculate statistics from public answers only
  - Show count and percentage per choice
  - Display as progress bars

- **Basic Profile**
  - View current user information
  - Placeholder for stats and answers (coming soon)

## Tech Stack

- **Framework**: SvelteKit with Svelte 5 (runes)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Components**: shadcn-svelte
- **Package Manager**: pnpm
- **Storage**: Mock data (in-memory)

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Test Users

You can login with any of these test users (password is ignored in POC):

- alice@example.com - Alice Johnson
- bob@example.com - Bob Smith
- carol@example.com - Carol Davis
- david@example.com - David Wilson
- emma@example.com - Emma Brown

Or create a new account via signup.

## Development Server

The app is running at: **http://localhost:5173**

Try logging in with any test user email or creating a new account!

## Architecture

### Layered Architecture
```
UI Layer (Svelte 5 Components)
    ↓
Application Layer (Services)
    ↓
Data Access Layer (Repositories)
    ↓
Storage Layer (Mock Data)
```

### Key Patterns
- **Repository Pattern**: All data access through interfaces
- **Service Pattern**: Business logic encapsulated in services
- **Dependency Injection**: Via DIContainer singleton
- **Svelte 5 Runes**: `$state`, `$effect` for reactive state

## Next Steps (Phase 2)

- Complete profile page with answers list
- Answer visibility toggle
- Delete answer functionality
- Question creation UI
- DM system
- Unit tests

See `docs/proj_design/WBS.txt` for full roadmap.
