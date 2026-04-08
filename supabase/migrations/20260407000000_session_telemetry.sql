-- Sessions: track Claude Code sessions for telemetry
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  session_id text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  total_invocations integer default 0,
  total_errors integer default 0,
  metadata jsonb
);

-- Session events: detailed event tracking within sessions
create table public.session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  event_type text not null, -- 'skill_invocation', 'tool_use', 'error', 'permission_request'
  timestamp timestamptz not null default now(),
  skill_name text,
  tool_name text,
  metadata jsonb,
  error_message text,
  status text -- 'success', 'error', 'blocked'
);

-- Tool detections: detected advertising platforms and suggested skills
create table public.tool_detections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete cascade,
  platform_name text not null, -- 'google_ads', 'meta_ads', 'tiktok_ads', etc
  detected_at timestamptz not null default now(),
  confidence text, -- 'high', 'medium', 'low'
  evidence jsonb, -- API endpoints, patterns detected
  suggested_skills text[],
  status text default 'pending' -- 'pending', 'acknowledged', 'dismissed'
);

-- Permission requests and evidence
create table public.permission_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete cascade,
  permission_type text not null, -- 'file_read', 'file_write', 'api_call', etc
  tool_name text,
  risk_level text not null, -- 'low', 'medium', 'high', 'critical'
  requested_at timestamptz not null default now(),
  evidence jsonb, -- session history, patterns, context
  decision text, -- 'approved', 'denied', 'pending'
  decision_made_at timestamptz,
  decision_reason text
);

-- Permission usage patterns: track how permissions are actually used
create table public.permission_usage (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  permission_type text not null,
  tool_name text,
  first_used_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  usage_count integer default 1,
  risk_level text,
  actual_impact jsonb -- what actually happened when used
);

-- Indexes for performance
create index on public.sessions(org_id, started_at desc);
create index on public.session_events(session_id, timestamp);
create index on public.tool_detections(org_id, detected_at desc);
create index on public.permission_requests(org_id, requested_at desc);
create index on public.permission_usage(org_id, last_used_at desc);

-- RLS policies
alter table public.sessions enable row level security;
alter table public.session_events enable row level security;
alter table public.tool_detections enable row level security;
alter table public.permission_requests enable row level security;
alter table public.permission_usage enable row level security;

-- Admin policies
create policy "admin full access sessions"
  on public.sessions for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "admin full access session_events"
  on public.session_events for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "admin full access tool_detections"
  on public.tool_detections for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "admin full access permission_requests"
  on public.permission_requests for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "admin full access permission_usage"
  on public.permission_usage for all
  using (auth.jwt() ->> 'role' = 'admin');

-- Org user policies (read-only for telemetry)
create policy "org read own sessions"
  on public.sessions for select
  using (
    auth.jwt() ->> 'role' = 'org'
    and org_id::text = auth.jwt() ->> 'org_id'
  );

create policy "org read own session_events"
  on public.session_events for select
  using (
    auth.jwt() ->> 'role' = 'org'
    and exists (
      select 1 from public.sessions s
      where s.id = session_events.session_id
      and s.org_id::text = auth.jwt() ->> 'org_id'
    )
  );

create policy "org read own tool_detections"
  on public.tool_detections for select
  using (
    auth.jwt() ->> 'role' = 'org'
    and org_id::text = auth.jwt() ->> 'org_id'
  );

create policy "org read own permission_requests"
  on public.permission_requests for select
  using (
    auth.jwt() ->> 'role' = 'org'
    and org_id::text = auth.jwt() ->> 'org_id'
  );

create policy "org read own permission_usage"
  on public.permission_usage for select
  using (
    auth.jwt() ->> 'role' = 'org'
    and org_id::text = auth.jwt() ->> 'org_id'
  );
