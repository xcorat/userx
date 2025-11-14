# Cloudflare D1 Database Setup Guide

This guide walks you through setting up a Cloudflare D1 database for the QnA App production deployment.

## Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI installed (`pnpm add -g wrangler`)
- Wrangler authenticated (`wrangler login`)

## Step 1: Create D1 Database

Create a new D1 database instance:

```bash
wrangler d1 create qna-app-db
```

This will output your database configuration. Copy the `database_id` from the output.

## Step 2: Update wrangler.jsonc

Add the D1 binding to your `wrangler.jsonc`:

```jsonc
{
  "name": "qna-app",
  "main": ".svelte-kit/cloudflare/_worker.js",
  "compatibility_date": "2025-01-01",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "qna-app-db",
      "database_id": "YOUR_DATABASE_ID_HERE"
    }
  ],
  "assets": {
    "binding": "ASSETS",
    "directory": ".svelte-kit/cloudflare"
  }
}
```

**Important**: The binding name MUST be `"DB"` (uppercase) to match the TypeScript interface in `app.d.ts`.

Replace `YOUR_DATABASE_ID_HERE` with the database ID from Step 1.

## Step 3: Run Migration

Apply the database schema:

```bash
wrangler d1 execute qna-app-db --file=./src/lib/server/db/d1-migration.sql
```

This creates all tables, indexes, and constraints.

## Step 4: Seed Database (Optional)

To populate the database with sample data for testing:

```bash
pnpm tsx scripts/d1-seed.ts
```

Or manually execute the seed SQL:

```bash
wrangler d1 execute qna-app-db --file=./scripts/d1-seed.sql
```

## Step 5: Verify Database

Check that tables were created:

```bash
wrangler d1 execute qna-app-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

You should see:
- users
- public_questions
- question_choices
- public_answers
- dm_questions
- dm_question_choices
- dm_answers

## Step 6: Deploy

Build and deploy your application:

```bash
pnpm build
wrangler deploy
```

## Development vs Production

The app automatically detects the runtime environment:

- **Development** (`pnpm dev`): Uses local SQLite database (`qna-app.db`)
- **Production** (Cloudflare Workers): Uses D1 database via the `DB` binding

No code changes needed - the repository factory selects the correct implementation based on `platform.env.DB` availability.

## Local D1 Testing (Optional)

To test D1 locally with Wrangler's local mode:

```bash
# Create local D1 database
wrangler d1 execute qna-app-db --local --file=./src/lib/server/db/d1-migration.sql

# Run dev server with local D1
wrangler pages dev .svelte-kit/cloudflare --d1=DB=qna-app-db
```

## Troubleshooting

### Migration fails with "table already exists"

Drop and recreate the database:

```bash
wrangler d1 execute qna-app-db --command="DROP TABLE IF EXISTS users"
# Repeat for other tables, then re-run migration
```

### "binding DB is not defined" error

Ensure:
1. `wrangler.jsonc` has correct D1 binding configuration
2. Database was created with `wrangler d1 create`
3. You've deployed the app (`wrangler deploy`)

### Data not persisting in local development

Local SQLite (`qna-app.db`) is separate from D1. Changes in dev won't affect production D1 database.

## Database Maintenance

### Backup Data

```bash
# Export to SQL
wrangler d1 export qna-app-db --output=backup.sql
```

### View Table Contents

```bash
# List all users
wrangler d1 execute qna-app-db --command="SELECT * FROM users LIMIT 10"

# Count questions
wrangler d1 execute qna-app-db --command="SELECT COUNT(*) as total FROM public_questions"
```

### Reset Database

```bash
# Drop all tables
wrangler d1 execute qna-app-db --file=./scripts/d1-drop-tables.sql

# Re-run migration
wrangler d1 execute qna-app-db --file=./src/lib/server/db/d1-migration.sql
```

## Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [D1 Limits and Pricing](https://developers.cloudflare.com/d1/platform/limits/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
