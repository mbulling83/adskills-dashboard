-- Feature announcements
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  announcement_type text not null, -- 'new_feature', 'improvement', 'bug_fix', 'security', 'maintenance'
  severity text default 'info', -- 'info', 'warning', 'critical'
  icon text, -- emoji or icon name
  action_url text, -- optional link for more info
  action_label text, -- text for action button
  active boolean default true,
  featured boolean default false, -- show prominently
  created_at timestamptz not null default now(),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  metadata jsonb -- additional data, tags, etc
);

-- Track which announcements each user has seen/dismissed
create table public.announcement_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  dismissed_at timestamptz,
  action_taken boolean default false,
  unique(user_id, announcement_id)
);

-- Track user visits for announcement targeting
create table public.user_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  visited_at timestamptz not null default now(),
  last_viewed_announcement_at timestamptz,
  unique(user_id)
);

-- Indexes
create index on public.announcements(active, valid_from, valid_until);
create index on public.announcements(featured, active);
create index on public.announcement_views(user_id, viewed_at);
create index on public.announcement_views(announcement_id);
create index on public.user_visits(user_id, visited_at);

-- RLS
alter table public.announcements enable row level security;
alter table public.announcement_views enable row level security;
alter table public.user_visits enable row level security;

-- Admin policies (full access)
create policy "admin full access announcements"
  on public.announcements for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "admin full access announcement_views"
  on public.announcement_views for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy "admin full access user_visits"
  on public.user_visits for all
  using (auth.jwt() ->> 'role' = 'admin');

-- Org user policies (read-only for active announcements)
create policy "org read active announcements"
  on public.announcements for select
  using (active = true);

create policy "org insert own announcement_views"
  on public.announcement_views for insert
  with check (
    auth.jwt() ->> 'role' = 'org'
    and user_id::text = auth.jwt() ->> 'user_id'
  );

create policy "org update own announcement_views"
  on public.announcement_views for update
  using (
    auth.jwt() ->> 'role' = 'org'
    and user_id::text = auth.jwt() ->> 'user_id'
  );

create policy "org read own announcement_views"
  on public.announcement_views for select
  using (
    auth.jwt() ->> 'role' = 'org'
    and user_id::text = auth.jwt() ->> 'user_id'
  );

create policy "org insert own user_visits"
  on public.user_visits for insert
  with check (
    auth.jwt() ->> 'role' = 'org'
    and user_id::text = auth.jwt() ->> 'user_id'
  );

create policy "org update own user_visits"
  on public.user_visits for update
  using (
    auth.jwt() ->> 'role' = 'org'
    and user_id::text = auth.jwt() ->> 'user_id'
  );

create policy "org read own user_visits"
  on public.user_visits for select
  using (
    auth.jwt() ->> 'role' = 'org'
    and user_id::text = auth.jwt() ->> 'user_id'
  );

-- Function to record user visit
create or replace function record_user_visit()
returns trigger as $$
begin
  insert into public.user_visits (user_id, visited_at)
  values (NEW.id, now())
  on conflict (user_id)
  do update set visited_at = now();
  return NEW;
end;
$$ language plpgsql;

-- Function to get relevant announcements for a user
create or replace function get_relevant_announcements(p_user_id uuid)
returns setof public.announcements as $$
declare
  v_last_visit timestamptz;
begin
  -- Get user's last visit time
  select visited_at into v_last_visit
  from public.user_visits
  where user_id = p_user_id;

  -- Return announcements created since last visit that haven't been dismissed
  return query
  select a.*
  from public.announcements a
  where a.active = true
    and a.valid_from <= now()
    and (a.valid_until is null or a.valid_until > now())
    and a.created_at >= coalesce(v_last_visit, '1970-01-01'::timestamptz)
    and not exists (
      select 1 from public.announcement_views av
      where av.announcement_id = a.id
        and av.user_id = p_user_id
        and av.dismissed_at is not null
    )
  order by a.featured desc, a.created_at desc;
end;
$$ language plpgsql;
