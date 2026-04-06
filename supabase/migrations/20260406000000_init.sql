-- Orgs
create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- API tokens (stored hashed)
create table public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  token_hash text not null unique,
  label text not null default 'Default',
  revoked_at timestamptz,
  created_at timestamptz default now()
);

-- Skill events
create table public.skill_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  skill_name text not null,
  invoked_at timestamptz not null,
  metadata jsonb
);

-- org_users: links auth users to orgs
create table public.org_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade
);

-- Indexes
create index on public.skill_events(org_id, invoked_at desc);
create index on public.skill_events(skill_name);
create index on public.api_tokens(token_hash) where revoked_at is null;

-- RLS
alter table public.orgs enable row level security;
alter table public.api_tokens enable row level security;
alter table public.skill_events enable row level security;
alter table public.org_users enable row level security;

-- Admin role: full access (checked via JWT custom claim)
create policy "admin full access orgs"
  on public.orgs for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "admin full access tokens"
  on public.api_tokens for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "admin full access events"
  on public.skill_events for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "admin full access org_users"
  on public.org_users for all
  using (auth.jwt() ->> 'role' = 'admin');

-- Org users: own org only
create policy "org read own events"
  on public.skill_events for select
  using (
    auth.jwt() ->> 'role' = 'org'
    and org_id::text = auth.jwt() ->> 'org_id'
  );

create policy "org read own tokens"
  on public.api_tokens for select
  using (
    auth.jwt() ->> 'role' = 'org'
    and org_id::text = auth.jwt() ->> 'org_id'
  );

create policy "org update own tokens (revoke)"
  on public.api_tokens for update
  using (
    auth.jwt() ->> 'role' = 'org'
    and org_id::text = auth.jwt() ->> 'org_id'
  );
