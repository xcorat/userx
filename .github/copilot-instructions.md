# QnA App - AI Coding Agent Instructions

## Architecture Overview

This is a **SvelteKit + TypeScript** application using a **layered architecture** with strict separation of concerns:

- **UI Layer**: Svelte 5 components with runes (`$state`, `$derived`) + shadcn-svelte
- **Service Layer**: Business logic (validation, sorting, orchestration)
- **Repository Layer**: Data access abstraction (currently Mock implementations)
- **Storage**: Mock JSON data (future: SQLite migration planned)

**Critical principle**: Higher layers depend on abstractions (interfaces), not implementations. This enables swapping data sources without touching business logic.

## Dependency Injection Pattern

All services are instantiated through `lib/config/di-container.ts` using the **Singleton pattern**:

```typescript
// ALWAYS use DI container - never instantiate services directly
const questionService = DIContainer.getQuestionService();
const answerService = DIContainer.getAnswerService();
```

Services receive repository interfaces via constructor injection. To swap implementations (Mock → SQLite), only update `di-container.ts`.

## Key File Structure

```
lib/
├── models/               # Domain models & DTOs (User, Question, Answer, DM)
├── repositories/
│   ├── interfaces/       # IUserRepository, IQuestionRepository, etc.
│   └── implementations/mock/  # MockUserRepository, MockQuestionRepository
├── services/             # Business logic (AuthService, QuestionService, etc.)
├── stores/               # Svelte 5 runes-based state (auth.store.ts, questions.store.ts)
├── components/
│   ├── ui/              # shadcn-svelte primitives
│   ├── features/        # Domain components (questions/, profile/, dm/)
│   └── layout/
└── config/
    ├── di-container.ts  # Dependency injection container
    └── app.config.ts    # App-wide configuration
```

## Data Flow Patterns

### Read Flow
```
Component → Store → Service → Repository → Mock Data → back up the chain
```

### Write Flow
```
User input → Component → Service (validate) → Repository (persist) → Store update → UI reactive update
```

Example from `question.service.ts`:
```typescript
async getPublicQuestions(sortBy: SortOption, userId?: string): Promise<QuestionWithStats[]> {
  const questions = await this.questionRepo.findAll();
  const sorted = this.sortQuestions(questions, sortBy);
  // Enhance with stats by querying answerRepo
  return enhanced;
}
```

## Svelte 5 State Management

**Critical**: Svelte 5 runes (`$state`, `$derived`, `$effect`) can ONLY be used in:
1. `.svelte` component files
2. `.svelte.ts` or `.svelte.js` files

**Never use runes in regular `.ts` files** - they will not work!

For shared state across components, use either:
1. **Module-level state in `.svelte.ts` files** with runes
2. **Traditional JavaScript classes** with regular properties (getters/setters)

### Rune Usage Guidelines

**`$state`**: Creates reactive state that triggers updates when changed
```typescript
// In .svelte or .svelte.ts files only!
let count = $state(0);
let user = $state<User | null>(null);
```

**`$derived`**: For simple computed values (avoid for complex objects/arrays)
```typescript
// Good: simple computations
let doubled = $derived(count * 2);
let fullName = $derived(`${firstName} ${lastName}`);

// BAD: complex objects (use $effect instead)
// let stats = $derived(calculateComplexStats(data)); // ❌
```

**`$effect`**: For side effects, runs when dependencies change
```typescript
// Only tracks what you actually read inside
$effect(() => {
  if (question.userAnswered) { // tracks question.userAnswered
    loadAggregates();
  }
});

// Cleanup with return function
$effect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer);
});
```

### Store Pattern (with runes in .svelte.ts)

For stores with reactive state, use `.svelte.ts` files with runes:

```typescript
// stores/questions.store.svelte.ts (.svelte.ts file - enables runes!)
class QuestionsStore {
  questions = $state<QuestionWithStats[]>([]);
  isLoading = $state(false);
  
  async load() {
    this.isLoading = true;
    this.questions = await DIContainer.getQuestionService().getPublicQuestions();
    this.isLoading = false;
  }
}

export const questionsStore = new QuestionsStore();
```

**Important**: Store files MUST use `.svelte.ts` extension to use runes. Regular `.ts` files cannot use `$state`, `$derived`, or `$effect`.

Components import stores and access reactive properties directly:
```svelte
<script>
  import { questionsStore } from '$lib/stores/questions.store.svelte';
  // questionsStore.questions is automatically reactive
</script>
```

## Repository Pattern

All repositories implement interfaces from `repositories/interfaces/`. Mock implementations store data in-memory arrays:

```typescript
// Mock repositories maintain in-memory state
class MockQuestionRepository implements IQuestionRepository {
  private questions: PublicQuestion[] = [...mockQuestions];
  
  async findAll(): Promise<PublicQuestion[]> {
    return this.questions;
  }
}
```

**Future migration**: Create `repositories/implementations/sqlite/` with same interfaces.

## Component Conventions

- **Feature components** (`components/features/`): Domain-specific, call services via DI container
- **UI components** (`components/ui/`): Generic, reusable shadcn-svelte primitives
- **Layout components**: Structure only, no business logic

Components should:
1. Import stores as singletons (not instantiate)
2. Call services through `DIContainer.getXxxService()`
3. Use Svelte 5 runes for local state

## Business Logic Location

- **Services** (`lib/services/`): All business logic (validation, authorization, sorting, aggregation)
- **Repositories**: Only CRUD operations, no business logic
- **Components**: Only UI logic and event handling

Example: Answer visibility validation lives in `AnswerService`, not in components or repositories.

## Key Domain Concepts

- **Public Questions**: Visible to all, answers can be public/private
- **DM Questions**: Private 1:1 questions between users
- **Answer Visibility**: Users choose `PUBLIC` or `PRIVATE` when answering
- **Aggregates**: Public answer statistics (count, percentage per choice)
- **Profile**: Shows user's public answers, stats (answers given, questions answered)

## Configuration

`lib/config/app.config.ts` holds app-wide constants:
- Feature limits (max choices, text lengths)
- UI settings (items per page, toast duration)
- Storage type configuration
- Auth settings

Reference via `import { appConfig } from '$lib/config/app.config'`.

## Package Manager

**Use pnpm exclusively** for all package management operations:
- Install: `pnpm install`
- Add packages: `pnpm add <package>`
- Dev dependencies: `pnpm add -D <package>`
- Run scripts: `pnpm dev`, `pnpm build`

## Testing Strategy

- Unit tests: Services with mock repository implementations
- Integration tests: Service + repository integration
- E2E tests: Critical flows with real mock data

Use `DIContainer.setRepositories()` to inject test doubles.

## Common Tasks

### Adding a new feature:
1. Define models in `lib/models/`
2. Create repository interface in `repositories/interfaces/`
3. Implement mock version in `repositories/implementations/mock/`
4. Create service in `lib/services/` with business logic
5. Register in `di-container.ts`
6. Create store if needed for UI state
7. Build components in `components/features/`

### Migrating to SQLite:
1. Create `repositories/implementations/sqlite/` with same interfaces
2. Update `di-container.ts` to return SQLite implementations
3. Zero changes needed in services, stores, or components

## Error Handling

Services throw typed errors. Components catch and display user-friendly messages. See `qna_tech_arch.txt` for error type definitions.

## Documentation

Comprehensive architecture details in `docs/qna_tech_arch.txt`. Models, repositories, services, stores, and DI container are fully documented in their respective doc files.
