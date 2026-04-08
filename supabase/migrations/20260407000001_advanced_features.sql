-- Auto-suggestions
create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  suggestion_type text not null, -- 'skill_enable', 'permission_grant', 'workflow_optimization'
  title text not null,
  description text,
  evidence jsonb, -- telemetry data, patterns, context
  suggested_actions jsonb, -- specific actions to take
  status text default 'pending', -- 'pending', 'accepted', 'dismissed', 'implemented'
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  implemented_at timestamptz
);

-- Real-time alerts
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  alert_type text not null, -- 'high_risk_permission', 'new_platform', 'error_spike', 'unusual_usage'
  severity text not null, -- 'info', 'warning', 'critical'
  title text not null,
  message text,
  data jsonb, -- alert-specific data
  status text default 'active', -- 'active', 'acknowledged', 'resolved'
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz
);

-- Skill performance metrics
create table public.skill_metrics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  skill_name text not null,
  total_invocations integer default 0,
  successful_invocations integer default 0,
  failed_invocations integer default 0,
  avg_latency_ms float,
  last_used_at timestamptz,
  error_types jsonb, -- {error_type: count}
  success_rate float,
  metadata jsonb,
  updated_at timestamptz not null default now(),
  unique(org_id, skill_name)
);

-- Session replay data
create table public.session_replays (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  replay_data jsonb not null, -- full event timeline with context
  snapshot_data jsonb, -- state at key moments
  annotations jsonb, -- user notes, markers
  is_shared boolean default false,
  shared_with uuid[], -- array of user IDs who can view
  created_at timestamptz not null default now()
);

-- Permission templates
create table public.permission_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  workflow_type text not null, -- 'google_ads_setup', 'meta_ads_reporting', etc
  permissions jsonb not null, -- {permission_type: risk_level}
  auto_apply boolean default false,
  trigger_conditions jsonb, -- when to auto-apply
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  is_public boolean default false
);

-- Permission template assignments
create table public.template_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  template_id uuid not null references public.permission_templates(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id),
  status text default 'active', -- 'active', 'revoked'
  unique(org_id, template_id)
);

-- Automated permission testing
create table public.permission_tests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  permission_type text not null,
  tool_name text,
  test_type text not null, -- 'sandbox', 'validation', 'impact_assessment'
  test_data jsonb,
  expected_impact jsonb,
  actual_impact jsonb,
  test_result text, -- 'passed', 'failed', 'warning'
  risk_assessment jsonb,
  tested_at timestamptz not null default now(),
  tested_by uuid references auth.users(id),
  status text default 'pending_review' -- 'pending_review', 'approved', 'rejected'
);

-- Indexes
create index on public.suggestions(org_id, status, created_at desc);
create index on public.alerts(org_id, status, created_at desc);
create index on public.skill_metrics(org_id, skill_name);
create index on public.skill_metrics(success_rate);
create index on public.session_replays(org_id, session_id);
create index on public.session_replays(is_shared);
create index on public.permission_templates(workflow_type, is_public);
create index on public.template_assignments(org_id, status);
create index on public.permission_tests(org_id, test_result, tested_at desc);

-- RLS
alter table public.suggestions enable row level security;
alter table public.alerts enable row level security;
alter table public.skill_metrics enable row level security;
alter table public.session_replays enable row level security;
alter table public.permission_templates enable row level security;
alter table public.template_assignments enable row level security;
alter table public.permission_tests enable row level security;

-- Admin policies
create policy "admin full access suggestions"
  on public.suggestions for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "admin full access alerts"
  on public.alerts for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "admin full access skill_metrics"
  on public.skill_metrics for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "admin full access session_replays"
  on public.session_replays for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "admin full access permission_templates"
  on public.permission_templates for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "admin full access template_assignments"
  on public.template_assignments for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "admin full access permission_tests"
  on public.permission_tests for all
  using (auth.jwt() ->> 'role' = 'admin');

-- Org user policies
create policy "org read own suggestions"
  on public.suggestions for select
  using (
    auth.jwt() ->> 'role' = 'org'
    and org_id::text = auth.jwt() ->> 'org_id'
  );

create policy "org update own suggestions"
  on public.suggestions for update
  using (
    auth.jwt() ->> 'role' = 'org'
    and org_id::text = auth.jwt() ->> 'org_id'
  );

create policy "org read own alerts"
  on public.alerts for select
  using (
    auth.jwt() ->> 'role' = 'org'
    and org_id::text = auth.jwt() ->> 'org_id'
  );

create policy "org update own alerts"
  on public.alerts for update
  using (
    auth.jwt() ->> 'role' = 'org'
    and org_id::text = auth.jwt() ->> 'org_id'
  );

create policy "org read own skill_metrics"
  on public.skill_metrics for select
  using (
    auth.jwt() ->> 'role' = 'org'
    and org_id::text = auth.jwt() ->> 'org_id'
  );

create policy "org read own session_replays"
  on public.session_replays for select
  using (
    auth.jwt() ->> 'role' = 'org'
    and org_id::text = auth.jwt() ->> 'org_id'
  );

create policy "org read public templates"
  on public.permission_templates for select
  using (is_public = true);

create policy "org read own template_assignments"
  on public.template_assignments for select
  using (
    auth.jwt() ->> 'role' = 'org'
    and org_id::text = auth.jwt() ->> 'org_id'
  );

create policy "org read own permission_tests"
  on public.permission_tests for select
  using (
    auth.jwt() ->> 'role' = 'org'
    and org_id::text = auth.jwt() ->> 'org_id'
  );

-- Function to update skill metrics
create or replace function update_skill_metrics()
returns trigger as $$
begin
  insert into public.skill_metrics (
    org_id,
    skill_name,
    total_invocations,
    successful_invocations,
    failed_invocations,
    last_used_at,
    success_rate,
    error_types,
    updated_at
  )
  values (
    NEW.org_id,
    NEW.skill_name,
    1,
    case when NEW.status = 'success' then 1 else 0 end,
    case when NEW.status = 'error' then 1 else 0 end,
    NEW.timestamp,
    case when NEW.status = 'success' then 100.0 else 0.0 end,
    case when NEW.status = 'error' then
      jsonb_build_object(NEW.error_message, 1)
    else
      '{}'::jsonb
    end,
    now()
  )
  on conflict (org_id, skill_name)
  do update set
    total_invocations = skill_metrics.total_invocations + 1,
    successful_invocations = skill_metrics.successful_invocations +
      case when NEW.status = 'success' then 1 else 0 end,
    failed_invocations = skill_metrics.failed_invocations +
      case when NEW.status = 'error' then 1 else 0 end,
    last_used_at = NEW.timestamp,
    success_rate = (skill_metrics.successful_invocations +
      case when NEW.status = 'success' then 1 else 0 end)::float /
      nullif(skill_metrics.total_invocations + 1, 0) * 100,
    error_types = skill_metrics.error_types ||
      case when NEW.status = 'error' then
        jsonb_build_object(NEW.error_message, coalesce((skill_metrics.error_types->>NEW.error_message)::int, 0) + 1)
      else
        '{}'::jsonb
      end,
    updated_at = now();

  return NEW;
end;
$$ language plpgsql;

-- Trigger to auto-update metrics on session events
create trigger on_session_event_insert
  after insert on public.session_events
  for each row
  when (NEW.event_type = 'skill_invocation')
  execute function update_skill_metrics();

-- Function to generate alerts based on conditions
create or replace function generate_alerts()
returns trigger as $$
declare
  error_count integer;
  recent_errors integer;
begin
  -- Check for error spikes (more than 5 errors in last hour)
  select count(*)
  into recent_errors
  from public.session_events
  where event_type = 'skill_invocation'
    and status = 'error'
    and timestamp > now() - interval '1 hour'
    and session_id in (
      select id from public.sessions where org_id = NEW.org_id
    );

  if recent_errors > 5 then
    insert into public.alerts (
      org_id,
      alert_type,
      severity,
      title,
      message,
      data,
      status
    )
    values (
      NEW.org_id,
      'error_spike',
      'warning',
      'High error rate detected',
      format('Your sessions have had %s errors in the last hour', recent_errors),
      jsonb_build_object(
        'error_count', recent_errors,
        'timeframe', '1 hour'
      ),
      'active'
    );
  end if;

  -- Check for high-risk permission requests
  if NEW.event_type = 'permission_request' then
    insert into public.alerts (
      org_id,
      alert_type,
      severity,
      title,
      message,
      data,
      status
    )
    values (
      NEW.org_id,
      'high_risk_permission',
      case
        when (NEW.metadata->>'risk_level') in ('high', 'critical') then 'critical'
        else 'warning'
      end,
      'High-risk permission requested',
      format('Permission %s has been classified as %s risk', NEW.tool_name, NEW.metadata->>'risk_level'),
      jsonb_build_object(
        'permission_type', NEW.tool_name,
        'risk_level', NEW.metadata->>'risk_level',
        'session_id', NEW.session_id
      ),
      'active'
    );
  end if;

  return NEW;
end;
$$ language plpgsql;

-- Trigger to auto-generate alerts
create trigger on_session_event_alert
  after insert on public.session_events
  for each row
  execute function generate_alerts();
