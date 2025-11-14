# QnA App - Progress Report

## Phase 1: Core Architecture & Foundation ✅
**Status**: Completed

### Implemented:
- **Architecture**: Layered architecture with UI → Service → Repository → Storage layers
- **Dependency Injection**: DIContainer singleton pattern for service instantiation
- **Repository Pattern**: Interface-driven with Mock implementations
- **Models**: User, Question, Answer, DM domain models with DTOs
- **Services**: AuthService, QuestionService, AnswerService, DMService with business logic
- **Stores**: Svelte 5 runes-based state management (.svelte.ts files)
- **UI Components**: shadcn-svelte integration with custom feature components

### Key Files Created:
- `lib/models/` - Domain models and DTOs
- `lib/repositories/interfaces/` - Repository interfaces
- `lib/repositories/implementations/mock/` - Mock data implementations
- `lib/services/` - Business logic layer
- `lib/stores/` - Reactive state stores
- `lib/config/di-container.ts` - Dependency injection
- `lib/config/app.config.ts` - Application configuration

---

## Phase 2: User Experience & Features ✅
**Status**: Completed

### Implemented:
- **SQLite Integration**: Migrated from mock data to SQLite with better-sqlite3
- **Database Schema**: Comprehensive schema with users, questions, answers, DM tables
- **Onboarding Flow**: User registration with username uniqueness validation
- **Profile Page**: User profile with public answers, visibility toggle, statistics
- **Question Creation**: New question form with dynamic choices, validation
- **Question Feed**: Browse public questions with sorting options

### Key Files Created:
- `src/lib/db/database.ts` - SQLite database initialization (moved to server in Phase 3)
- `src/lib/db/schema.sql` - Database schema definition
- `src/lib/repositories/implementations/sqlite/` - SQLite repositories (moved to server in Phase 3)
- `src/routes/onboarding/+page.svelte` - User registration flow
- `src/routes/profile/+page.svelte` - User profile and answers
- `src/routes/questions/+page.svelte` - Question feed
- `src/routes/questions/new/+page.svelte` - Create question form

### Database Schema:
```sql
users (id, username, created_at)
public_questions (id, creator_id, question_text, created_at)
choices (id, question_id, choice_text, display_order)
public_answers (id, user_id, question_id, choice_id, visibility, answered_at)
dm_questions (id, sender_id, recipient_id, question_text, created_at)
dm_choices (id, dm_question_id, choice_text, display_order)
dm_answers (id, dm_question_id, choice_id, answered_at)
```

---

## Phase 3: Production Architecture - API Layer ✅
**Status**: Completed (All Issues Resolved)

### Problem Identified:
SQLite repositories were being imported into browser code, which won't work in production because `better-sqlite3` is a Node.js native module and cannot be bundled for the browser.

### Solution Implemented:
Created a proper client-server architecture using SvelteKit's server-side API routes (+server.ts files).

### Critical Bugs Fixed:
1. **Date Parsing Issue**: API responses returned ISO date strings, but app expected Date objects. Added date parsing in all API repositories.
2. **Enum Import Issue**: `AnswerVisibility` was imported as `type` but used as runtime value in SQLiteAnswerRepository. Fixed by removing `type` keyword.
3. **API Base URL**: Corrected from `http://localhost:3000/api` to `/api` (relative URL - same SvelteKit app).
4. **Missing Repository Method**: Added `findByCreator()` to APIQuestionRepository to match interface.
5. **better-sqlite3 Bindings**: Rebuilt native bindings for Node.js v20.19.0.

### Architecture Changes:

**Before (Broken in Production)**:
```
Browser → SQLite Repositories → better-sqlite3 ❌ (won't work)
```

**After (Production-Ready)**:
```
Browser → API Repositories (fetch) → SvelteKit +server.ts → SQLite Repositories → Database ✅
```

### Implemented Components:

#### 1. Server-Side Code Separation
- **Created**: `src/lib/server/` directory for server-only code
- **Moved**: Database and SQLite repositories to server context
  - `src/lib/server/db/` - Database initialization (from `lib/db/`)
  - `src/lib/server/repositories/sqlite/` - SQLite implementations (from `lib/repositories/implementations/sqlite/`)
- **Updated**: All SQLite repository imports to use server paths (`$lib/server/db/database`)

#### 2. SvelteKit API Routes (12 endpoints)
All routes use pattern: `src/routes/api/[resource]/+server.ts`

**User Endpoints**:
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user
- `GET /api/users/email/[email]` - Find user by email (login)
- `GET /api/users/username/[username]` - Check username existence (signup validation)

**Question Endpoints**:
- `GET /api/questions` - List questions (supports `?creatorId=` filter)
- `POST /api/questions` - Create question
- `GET /api/questions/[id]` - Get question by ID
- `DELETE /api/questions/[id]` - Delete question

**Answer Endpoints**:
- `GET /api/answers` - List answers (supports `?userId=`, `?questionId=`, `?publicOnly=` filters)
- `POST /api/answers` - Create answer
- `GET /api/answers/[id]` - Get answer by ID
- `PUT /api/answers/[id]` - Update answer visibility
- `DELETE /api/answers/[id]` - Delete answer

**DM Endpoints**:
- `GET /api/dm/questions` - List DM questions (supports `?userId=&sent=true|received=true` filters)
- `POST /api/dm/questions` - Create DM question
- `GET /api/dm/questions/[id]` - Get DM question by ID
- `GET /api/dm/answers` - Get DM answers (requires `?questionId=`)
- `POST /api/dm/answers` - Create DM answer
- `GET /api/dm/answers/[id]` - Returns 501 (not supported by repository interface)

#### 3. API Repository Implementations (4 files)
Created client-side repositories using `fetch()` API:

- `src/lib/repositories/implementations/api/APIUserRepository.ts` - User operations
- `src/lib/repositories/implementations/api/APIQuestionRepository.ts` - Question operations
- `src/lib/repositories/implementations/api/APIAnswerRepository.ts` - Answer operations
- `src/lib/repositories/implementations/api/APIDMRepository.ts` - DM operations
- `src/lib/repositories/implementations/api/index.ts` - Barrel exports

**Pattern Used**:
```typescript
class APIUserRepository implements IUserRepository {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async findById(id: string): Promise<User | null> {
    const response = await fetch(`${API_BASE}/users/${id}`);
    if (response.status === 404) return null;
    return this.handleResponse(response);
  }
  // ... other methods
}
```

#### 4. Repository Factory Updates
- **Added**: API repository imports
- **Updated**: All factory methods to return API repositories for `'api'` storage type
- **Protected**: `'sqlite'` case throws error in client context to prevent misuse

```typescript
static createUserRepository(): IUserRepository {
  switch (this.storageType) {
    case 'mock': return new MockUserRepository();
    case 'sqlite': throw new Error('SQLite must be used server-side only');
    case 'api': return new APIUserRepository(); // ✅ Production mode
  }
}
```

#### 5. Configuration Updates
- **Changed**: `appConfig.storage.type` from `'mock'` to `'api'`
- **Fixed**: `apiBaseUrl` from `'http://localhost:3000/api'` to `'/api'` (relative URL, same SvelteKit app)

#### 6. Date Parsing in API Repositories
All API repositories now include date parsing helpers to convert ISO string dates back to Date objects:
- `APIUserRepository`: Parses `createdAt` and `updatedAt`
- `APIQuestionRepository`: Parses `createdAt`
- `APIAnswerRepository`: Parses `answeredAt`
- `APIDMRepository`: Parses `createdAt` and `answeredAt`

**Pattern Used**:
```typescript
private parseQuestion(question: any): PublicQuestion {
  return {
    ...question,
    createdAt: new Date(question.createdAt)
  };
}
```

### Key Architectural Principles:

1. **Clean Separation**: Server-only code in `src/lib/server/`, never bundled to browser
2. **Interface Consistency**: All repositories implement same interfaces regardless of storage type
3. **Zero Service Changes**: Services, stores, and components completely unchanged
4. **Environment Switching**: Change storage type in config: `'mock'` for dev/testing, `'api'` for production
5. **RESTful API**: Standard HTTP methods, proper status codes, JSON serialization
6. **Error Handling**: Consistent error responses across all endpoints

### Storage Type Options:
- **`'mock'`**: In-memory data, fast for development/testing, no persistence
- **`'api'`**: Production mode, browser → API → SQLite database
- **`'sqlite'`**: Server-side only, direct database access (used by API routes)

### Files Modified:
- `src/lib/config/app.config.ts` - Storage type changed to 'api', API base URL fixed
- `src/lib/repositories/factory.ts` - Added API repository cases, enabled production mode
- `src/lib/server/repositories/sqlite/SQLiteAnswerRepository.ts` - Fixed enum import (removed `type` keyword)
- All 4 API repositories - Added date parsing helpers
- All SQLite repository imports - Updated to server paths

### Debugging & Issue Resolution:
1. **Sorting Error**: `b.createdAt.getTime is not a function` - Fixed by adding date parsing in API repositories
2. **Runtime Error**: `AnswerVisibility is not defined` - Fixed by importing enum as value, not type
3. **Build Error**: `better-sqlite3` bindings missing - Rebuilt with `npm run build-release`
4. **Missing Method**: `findByCreator` not implemented - Added to APIQuestionRepository and questions API route

### Benefits:
✅ **Production-Ready**: Works in any deployment environment  
✅ **Secure**: Database access properly isolated server-side  
✅ **Scalable**: Easy to add PostgreSQL, MongoDB, or other backends  
✅ **Generic**: Repository abstraction enables storage flexibility  
✅ **Testable**: Can switch between mock and real data easily  
✅ **Future-Proof**: API can serve mobile apps or external clients  

---

## Current Status

### Working Features:
- ✅ User registration with SQLite persistence via API
- ✅ User profile with answer visibility toggle
- ✅ Question creation and browsing with sorting
- ✅ Complete API layer with 12 REST endpoints
- ✅ Client-server architecture with proper separation
- ✅ Production-ready deployment structure
- ✅ Date parsing for all time-based operations
- ✅ Enum values properly handled at runtime
- ✅ Database test/debug page for development

### Technical Stack:
- **Frontend**: SvelteKit + Svelte 5 + TypeScript + shadcn-svelte
- **Backend**: SvelteKit +server.ts routes + better-sqlite3
- **Architecture**: Layered (UI → API Repos → Server Routes → SQLite Repos → Database)
- **State Management**: Svelte 5 runes (.svelte.ts stores)
- **Package Manager**: pnpm

### Development Tools:
- **Database Debug UI**: `/tests` route for inspecting database state
  - View all tables with row counts
  - Sample data display (10 rows per table)
  - Password field masking
  - Real-time refresh capability

### Next Steps (Phase 5 - Planned):
- [ ] Enhanced search and filtering
- [ ] Question recommendations
- [ ] User discovery features
- [ ] Analytics dashboard
- [ ] Comprehensive testing suite
- [ ] Performance optimizations
- [ ] Mobile responsiveness polish

---

## Phase 4: Cloudflare D1 Integration & Environment Detection ✅
**Status**: Completed (November 14, 2025)

### Issues Fixed:

#### 1. **API Route Bug - Direct Repository Instantiation**
- **Problem**: `/api/questions/[id]` was directly instantiating `SQLiteQuestionRepository()` without required constructor parameters
- **Result**: `db` property was `undefined`, causing "Cannot read properties of undefined (reading 'prepare')" error
- **Fix**: Changed to use `ServerRepositoryFactory.getQuestionRepository()` to get properly initialized repositories
- **Verification**: Tested with curl - endpoint now returns question data successfully

#### 2. **Environment Detection for Multi-Database Support**
- **Problem**: Complex platform detection logic caused false positives - Cloudflare was trying to use SQLite instead of D1
- **Root Cause**: `hasD1Binding` is `true` in dev mode (SvelteKit Cloudflare adapter creates mock binding), making it impossible to distinguish between local dev and production
- **Fix**: Simplified to use `NODE_ENV` as primary indicator:
  - `NODE_ENV=development` → SQLite (local development with `pnpm dev`)
  - `NODE_ENV=production` or `CF_PAGES=1` → D1 (Cloudflare Workers production)
  - No `process` object → D1 (Workers runtime)
- **Fallback**: Check `hasD1Binding` as secondary confirmation

#### 3. **Password Input Autocomplete Warnings**
- **Problem**: DOM warning about missing autocomplete attributes on password fields
- **Fix**: 
  - Added `autocomplete="current-password"` to login form password input
  - Added `autocomplete="new-password"` to signup form password input
- **Browser Benefit**: Enables password manager integration and browser autocomplete

#### 4. **Database Test Endpoint Data Structure**
- **Problem**: Frontend component expected `{ tableCount, timestamp, tables: TableInfo[] }` but endpoint returned `{ success, repoType, counts, sampleData }`
- **Result**: Tests page showed no data
- **Fix**: Transformed endpoint response to match frontend expectations:
  ```typescript
  tables: [
    { name: 'users', count, sampleRows },
    { name: 'questions', count, sampleRows },
    { name: 'answers', count, sampleRows },
    { name: 'dm_questions', count, sampleRows }
  ]
  ```

#### 5. **Git Cleanup**
- **Problem**: SQLite WAL files (`qna-app.db-shm`, `qna-app.db-wal`) were tracked in git
- **Fix**: Removed from tracking with `git rm --cached` and added to `.gitignore`
- **Reason**: WAL files are temporary SQLite runtime files that should never be committed

### Files Modified:
- `src/lib/server/repositories/server-factory.ts` - Simplified environment detection
- `src/routes/api/questions/[id]/+server.ts` - Fixed to use ServerRepositoryFactory
- `src/routes/login/+page.svelte` - Added autocomplete attribute
- `src/routes/onboard/+page.svelte` - Added autocomplete attribute
- `src/routes/tests/+server.ts` - Fixed response data structure
- `.gitignore` - Added SQLite WAL files

### Key Architectural Improvement:
The environment detection now clearly separates local development from production without relying on unreliable platform binding detection. This ensures:
- ✅ Local dev (`pnpm dev`) reliably uses SQLite with `better-sqlite3`
- ✅ Production (Cloudflare Workers) reliably uses D1
- ✅ No cross-contamination between environments
- ✅ Opaque dynamic imports still prevent bundling SQLite into Cloudflare

---

## Phase 5: Core Features - Answer Submission & DM System ✅
**Status**: Completed

### Implemented:
- **Toast Notifications**: Integrated svelte-sonner for user feedback
  - Success/error messages for all actions
  - Positioned at top-right
  - Rich colors for better UX

- **Answer Submission Flow**: Complete implementation
  - Radio button selection for choices
  - Visibility toggle (Public/Private)
  - Form validation with inline errors
  - Toast notifications on success/failure
  - Automatic question refresh after answering

- **Answer Aggregates Display**: Visual statistics
  - Progress bars showing percentage distribution
  - Count and percentage per choice
  - Only visible to users who have answered
  - Real-time updates on answer submission

- **Pagination System**: Industry-standard implementation
  - Offset-based pagination (20 items per page)
  - API support: `GET /api/questions?page=1&limit=20`
  - Metadata: page, limit, total, totalPages, hasMore
  - Previous/Next navigation buttons
  - Page indicator with total count
  - Preserves sort order across pages
  - Fallback to in-memory pagination for compatibility

- **DM (Direct Message) Questions**: Complete private messaging
  - **Inbox**: `/dm` route with tabbed interface
    - Received DMs with answer status
    - Sent DMs with response tracking
    - Sender/recipient information
    - Timestamp display
  - **Composer**: `/dm/compose` route
    - User selection dropdown
    - Question text input with validation
    - Optional multiple choices (0-6)
    - Empty choice filtering
  - **Answering**: Inline answer forms
    - Choice selection for multiple-choice DMs
    - Support for open-ended questions
    - Validation and error handling
    - Real-time status updates
  - **Status Badges**: Visual indicators
    - "Answered" - Green badge with checkmark
    - "Pending" - Gray badge with clock (received)
    - "Waiting" - Gray badge with clock (sent)

- **User Profile Viewing**: `/profile/[userId]`
  - View other users' public profiles
  - Display only public answers
  - User stats (questions answered, public answer count)
  - "Send DM Question" button for easy messaging
  - Avatar/initials display
  - Location and birthdate (if provided)

- **User Service**: New service layer
  - `getAllUsers()` - List all users
  - `getUserById()` - Fetch user details
  - `getUserByEmail()` - Login support
  - `getUserByUsername()` - Username validation
  - Integrated into DI container

### Key Files Created:
- `src/lib/stores/dm.store.svelte.ts` - DM state management
- `src/lib/services/user.service.ts` - User operations
- `src/routes/dm/+page.svelte` - DM inbox with tabs
- `src/routes/dm/compose/+page.svelte` - DM composer
- `src/routes/profile/[userId]/+page.svelte` - User profile view

### Key Files Modified:
- `src/lib/config/di-container.ts` - Added getDMService() and getUserService()
- `src/lib/stores/questions.store.svelte.ts` - Pagination support
- `src/lib/services/question.service.ts` - getPublicQuestionsPaginated()
- `src/lib/repositories/implementations/api/APIQuestionRepository.ts` - findAllPaginated()
- `src/routes/api/questions/+server.ts` - Pagination parameters
- `src/routes/questions/+page.svelte` - Pagination UI controls
- `src/routes/+layout.svelte` - Toaster and DM navigation
- `src/lib/components/features/questions/AnswerForm.svelte` - Toast integration

### Technical Improvements:
- **Pagination Pattern**: Standard offset-based with metadata
- **DM Conversations**: Proper data modeling with sender/recipient/answer
- **Toast Integration**: Consistent error/success feedback
- **Loading States**: Spinners and disabled states throughout
- **Empty States**: Helpful messages for no data scenarios
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Try-catch with user-friendly messages

### Benefits:
✅ **Complete User Interaction**: Users can now fully interact with questions and each other  
✅ **Private Messaging**: One-on-one question system for deeper connections  
✅ **Scalable Pagination**: Handles large datasets efficiently  
✅ **Enhanced UX**: Toast notifications provide immediate feedback  
✅ **Social Features**: User discovery through profiles  
✅ **Maintainable**: Clean separation of concerns maintained  

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Configuration

Storage type is configured in `src/lib/config/app.config.ts`:
```typescript
storage: {
  type: 'api',  // 'mock' for dev, 'api' for production
  apiBaseUrl: '/api'  // Relative URL (same SvelteKit app)
}
```
