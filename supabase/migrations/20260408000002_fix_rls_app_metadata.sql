-- Supabase puts app_metadata into the JWT under the 'app_metadata' key.
-- All existing policies used auth.jwt() ->> 'role' (top-level) which no longer matches.
-- Re-create them using auth.jwt()->'app_metadata'->>'role' instead.

-- Helper: create stable functions so policies stay readable
create or replace function public.user_role()
returns text language sql stable
as $$ select coalesce(auth.jwt()->'app_metadata'->>'role', 'anon') $$;

create or replace function public.user_org_id()
returns text language sql stable
as $$ select auth.jwt()->'app_metadata'->>'org_id' $$;

-- ──── Drop and re-create every policy ────────────────────────────────────────

-- orgs
drop policy if exists "admin full access orgs" on public.orgs;
create policy "admin full access orgs" on public.orgs for all
  using (public.user_role() = 'admin');

-- api_tokens
drop policy if exists "admin full access tokens" on public.api_tokens;
drop policy if exists "org read own tokens" on public.api_tokens;
drop policy if exists "org update own tokens (revoke)" on public.api_tokens;

create policy "admin full access tokens" on public.api_tokens for all
  using (public.user_role() = 'admin');
create policy "org read own tokens" on public.api_tokens for select
  using (public.user_role() = 'org' and org_id::text = public.user_org_id());
create policy "org update own tokens (revoke)" on public.api_tokens for update
  using (public.user_role() = 'org' and org_id::text = public.user_org_id());

-- skill_events
drop policy if exists "admin full access events" on public.skill_events;
drop policy if exists "org read own events" on public.skill_events;

create policy "admin full access events" on public.skill_events for all
  using (public.user_role() = 'admin');
create policy "org read own events" on public.skill_events for select
  using (public.user_role() = 'org' and org_id::text = public.user_org_id());

-- org_users
drop policy if exists "admin full access org_users" on public.org_users;
create policy "admin full access org_users" on public.org_users for all
  using (public.user_role() = 'admin');

-- sessions
drop policy if exists "admin full access sessions" on public.sessions;
drop policy if exists "org read own sessions" on public.sessions;

create policy "admin full access sessions" on public.sessions for all
  using (public.user_role() = 'admin');
create policy "org read own sessions" on public.sessions for select
  using (public.user_role() = 'org' and org_id::text = public.user_org_id());

-- session_events
drop policy if exists "admin full access session_events" on public.session_events;
drop policy if exists "org read own session_events" on public.session_events;

create policy "admin full access session_events" on public.session_events for all
  using (public.user_role() = 'admin');
create policy "org read own session_events" on public.session_events for select
  using (
    public.user_role() = 'org'
    and exists (
      select 1 from public.sessions s
      where s.id = session_events.session_id
      and s.org_id::text = public.user_org_id()
    )
  );

-- tool_detections
drop policy if exists "admin full access tool_detections" on public.tool_detections;
drop policy if exists "org read own tool_detections" on public.tool_detections;

create policy "admin full access tool_detections" on public.tool_detections for all
  using (public.user_role() = 'admin');
create policy "org read own tool_detections" on public.tool_detections for select
  using (public.user_role() = 'org' and org_id::text = public.user_org_id());

-- permission_requests
drop policy if exists "admin full access permission_requests" on public.permission_requests;
drop policy if exists "org read own permission_requests" on public.permission_requests;

create policy "admin full access permission_requests" on public.permission_requests for all
  using (public.user_role() = 'admin');
create policy "org read own permission_requests" on public.permission_requests for select
  using (public.user_role() = 'org' and org_id::text = public.user_org_id());

-- permission_usage
drop policy if exists "admin full access permission_usage" on public.permission_usage;
drop policy if exists "org read own permission_usage" on public.permission_usage;

create policy "admin full access permission_usage" on public.permission_usage for all
  using (public.user_role() = 'admin');
create policy "org read own permission_usage" on public.permission_usage for select
  using (public.user_role() = 'org' and org_id::text = public.user_org_id());

-- suggestions
drop policy if exists "admin full access suggestions" on public.suggestions;
drop policy if exists "org read own suggestions" on public.suggestions;
drop policy if exists "org update own suggestions" on public.suggestions;

create policy "admin full access suggestions" on public.suggestions for all
  using (public.user_role() = 'admin');
create policy "org read own suggestions" on public.suggestions for select
  using (public.user_role() = 'org' and org_id::text = public.user_org_id());
create policy "org update own suggestions" on public.suggestions for update
  using (public.user_role() = 'org' and org_id::text = public.user_org_id());

-- alerts
drop policy if exists "admin full access alerts" on public.alerts;
drop policy if exists "org read own alerts" on public.alerts;
drop policy if exists "org update own alerts" on public.alerts;

create policy "admin full access alerts" on public.alerts for all
  using (public.user_role() = 'admin');
create policy "org read own alerts" on public.alerts for select
  using (public.user_role() = 'org' and org_id::text = public.user_org_id());
create policy "org update own alerts" on public.alerts for update
  using (public.user_role() = 'org' and org_id::text = public.user_org_id());

-- skill_metrics
drop policy if exists "admin full access skill_metrics" on public.skill_metrics;
drop policy if exists "org read own skill_metrics" on public.skill_metrics;

create policy "admin full access skill_metrics" on public.skill_metrics for all
  using (public.user_role() = 'admin');
create policy "org read own skill_metrics" on public.skill_metrics for select
  using (public.user_role() = 'org' and org_id::text = public.user_org_id());

-- session_replays
drop policy if exists "admin full access session_replays" on public.session_replays;
drop policy if exists "org read own session_replays" on public.session_replays;

create policy "admin full access session_replays" on public.session_replays for all
  using (public.user_role() = 'admin');
create policy "org read own session_replays" on public.session_replays for select
  using (public.user_role() = 'org' and org_id::text = public.user_org_id());

-- permission_templates
drop policy if exists "admin full access permission_templates" on public.permission_templates;
drop policy if exists "org read public templates" on public.permission_templates;

create policy "admin full access permission_templates" on public.permission_templates for all
  using (public.user_role() = 'admin');
create policy "org read public templates" on public.permission_templates for select
  using (is_public = true);

-- template_assignments
drop policy if exists "admin full access template_assignments" on public.template_assignments;
drop policy if exists "org read own template_assignments" on public.template_assignments;

create policy "admin full access template_assignments" on public.template_assignments for all
  using (public.user_role() = 'admin');
create policy "org read own template_assignments" on public.template_assignments for select
  using (public.user_role() = 'org' and org_id::text = public.user_org_id());

-- permission_tests
drop policy if exists "admin full access permission_tests" on public.permission_tests;
drop policy if exists "org read own permission_tests" on public.permission_tests;

create policy "admin full access permission_tests" on public.permission_tests for all
  using (public.user_role() = 'admin');
create policy "org read own permission_tests" on public.permission_tests for select
  using (public.user_role() = 'org' and org_id::text = public.user_org_id());

-- announcements
drop policy if exists "admin full access announcements" on public.announcements;
drop policy if exists "org read active announcements" on public.announcements;

create policy "admin full access announcements" on public.announcements for all
  using (public.user_role() = 'admin');
create policy "org read active announcements" on public.announcements for select
  using (active = true);

-- announcement_views
drop policy if exists "admin full access announcement_views" on public.announcement_views;
drop policy if exists "org insert own announcement_views" on public.announcement_views;
drop policy if exists "org update own announcement_views" on public.announcement_views;
drop policy if exists "org read own announcement_views" on public.announcement_views;

create policy "admin full access announcement_views" on public.announcement_views for all
  using (public.user_role() = 'admin');
create policy "org manage own announcement_views" on public.announcement_views for all
  using (user_id = auth.uid());

-- user_visits
drop policy if exists "admin full access user_visits" on public.user_visits;
drop policy if exists "org insert own user_visits" on public.user_visits;
drop policy if exists "org update own user_visits" on public.user_visits;
drop policy if exists "org read own user_visits" on public.user_visits;

create policy "admin full access user_visits" on public.user_visits for all
  using (public.user_role() = 'admin');
create policy "org manage own user_visits" on public.user_visits for all
  using (user_id = auth.uid());

-- user_roles
drop policy if exists "admin full access user_roles" on public.user_roles;
drop policy if exists "user read own role" on public.user_roles;

create policy "admin full access user_roles" on public.user_roles for all
  using (public.user_role() = 'admin');
create policy "user read own role" on public.user_roles for select
  using (user_id = auth.uid());
