# Quick Start: Cloudflare D1 Integration

## ✅ Implementation Complete

The QnA App now supports **automatic environment-based database selection**:
- **SQLite** for local development
- **Cloudflare D1** for production deployment

## 🚀 Getting Started

### Local Development (SQLite - Default)
```bash
pnpm dev
# App runs on http://localhost:5173 using SQLite
```

### Production Setup (Cloudflare D1)

#### 1. Create D1 Database
```bash
wrangler d1 create qna-app-db
```

Copy the `database_id` from the output.

#### 2. Configure wrangler.jsonc
Edit `wrangler.jsonc` and replace `YOUR_DATABASE_ID_HERE` with your actual database ID:
```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "qna-app-db",
      "database_id": "abc123-your-actual-id-here"
    }
  ]
}
```

#### 3. Run Migration
```bash
wrangler d1 execute qna-app-db --file=./src/lib/server/db/d1-migration.sql
```

#### 4. (Optional) Seed Test Data
```bash
pnpm tsx scripts/d1-seed.ts --generate-sql > scripts/d1-seed.sql
wrangler d1 execute qna-app-db --file=./scripts/d1-seed.sql
```

#### 5. Build & Deploy
```bash
pnpm build
wrangler deploy
```

## 📖 How It Works

### Automatic Environment Detection

The `ServerRepositoryFactory` automatically detects the runtime:

```typescript
// In hooks.server.ts (runs on every request)
ServerRepositoryFactory.initialize(event.platform);

// In API routes
const repo = ServerRepositoryFactory.getQuestionRepository();
// Returns SQLiteQuestionRepository in dev
// Returns D1QuestionRepository in production
```

### Zero Configuration Needed

- **Development**: Just run `pnpm dev` - uses SQLite automatically
- **Production**: Deploy to Cloudflare - detects D1 binding automatically
- **No environment variables** needed
- **No code changes** between environments

## 📁 Key Files

### Documentation
- `docs/pub/d1-setup.md` - Complete setup guide
- `docs/pub/D1_IMPLEMENTATION.md` - Technical implementation details

### Database
- `src/lib/server/db/d1-migration.sql` - D1 schema
- `scripts/d1-seed.ts` - Seed data generator

### Repositories
- `src/lib/server/repositories/d1/` - D1 implementations
- `src/lib/server/repositories/sqlite/` - SQLite implementations
- `src/lib/server/repositories/server-factory.ts` - Factory pattern

### Configuration
- `src/hooks.server.ts` - Initialize factory at app startup
- `src/app.d.ts` - TypeScript types for D1
- `wrangler.jsonc` - Cloudflare configuration
- `tsconfig.json` - Added @cloudflare/workers-types

## 🧪 Testing Both Environments

### Test with SQLite (default)
```bash
pnpm dev
```

### Test with Local D1
```bash
# Setup local D1
wrangler d1 execute qna-app-db --local --file=./src/lib/server/db/d1-migration.sql

# Run dev server with D1
wrangler pages dev .svelte-kit/cloudflare --d1=DB=qna-app-db
```

## 🎯 Benefits

✅ **Modular**: Swap storage without touching business logic  
✅ **Type-Safe**: Full TypeScript support for both backends  
✅ **Automatic**: No manual environment configuration  
✅ **Scalable**: Easy to add new database adapters  
✅ **DRY**: Single initialization point (hooks.server.ts)  

## 📚 Additional Resources

- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [SvelteKit Cloudflare Adapter](https://kit.svelte.dev/docs/adapter-cloudflare)

## 💡 Architecture Highlights

- **Repository Pattern**: Interface-based abstraction
- **Factory Pattern**: Runtime-based implementation selection
- **Singleton Pattern**: One repository instance per type
- **Dependency Injection**: Services receive repositories via constructor
- **Environment Detection**: Based on `platform.env.DB` presence

---

**Ready to deploy?** Follow the [D1 Setup Guide](./d1-setup.md) for detailed instructions.
