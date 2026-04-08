# Supabase Setup Guide

## Prerequisites

1. **Install Docker Desktop** - Supabase local development requires Docker
   - Download from https://www.docker.com/products/docker-desktop/
   - Start Docker Desktop after installation

2. **Supabase CLI** - Already installed (v2.75.0)
   - Update recommended: `supabase update`

## Quick Start

### 1. Start Docker
Make sure Docker Desktop is running on your Mac.

### 2. Start Local Supabase
```bash
supabase start
```

This will:
- Start a local Supabase instance with PostgreSQL
- Run database migrations automatically
- Provide local API URLs and keys

### 3. Configure Environment Variables

The `supabase start` command will output your local credentials. Update `.env.local`:

```bash
# Get these values from `supabase start` output
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
```

### 4. Run Development Server
```bash
npm run dev
```

## Database Schema

The following tables are created by migrations:

- **orgs** - Organizations
- **api_tokens** - API tokens (stored hashed)
- **skill_events** - Skill usage events
- **org_users** - User-to-org mappings

## Access Local Dashboard

After starting Supabase, access the dashboard at:
```
http://localhost:54323
```

Default credentials:
- Email: `admin@supabase.com`
- Password: `admin` (or check `supabase start` output)

## Common Commands

```bash
# Start Supabase
supabase start

# Stop Supabase
supabase stop

# Reset database (wipe all data)
supabase db reset

# View logs
supabase logs

# Generate types
supabase gen types typescript --local > lib/database.types.ts
```

## Production Setup

For production, you'll need to:

1. Create a project at https://supabase.com
2. Run migrations: `supabase db push --project-ref YOUR_PROJECT_ID`
3. Update `.env.local` with production credentials
4. Deploy Edge Functions: `supabase functions deploy --project-ref YOUR_PROJECT_ID`

## Troubleshooting

**Docker not running**: Start Docker Desktop
**Port conflicts**: Check if ports 54321-54323 are available
**Migration errors**: Run `supabase db reset` to restart cleanly
