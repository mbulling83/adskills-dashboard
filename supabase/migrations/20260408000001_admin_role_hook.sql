-- Table to store role assignments (separate from auth so we can edit without touching auth.users)
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'org', -- 'admin' | 'org'
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

create policy "admin full access user_roles"
  on public.user_roles for all
  using (auth.jwt() ->> 'role' = 'admin');

-- Admins can read their own role (needed on first login before JWT is stamped)
create policy "user read own role"
  on public.user_roles for select
  using (user_id = auth.uid());

-- JWT custom claims hook: stamp role + org_id into every access token
create or replace function public.custom_jwt_claims(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  v_user_id uuid;
  v_role text;
  v_org_id uuid;
  v_claims jsonb;
begin
  v_user_id := (event->>'user_id')::uuid;

  -- Get role
  select role into v_role
  from public.user_roles
  where user_id = v_user_id;

  v_role := coalesce(v_role, 'org');

  -- Get org_id (null for admins — they see everything)
  select org_id into v_org_id
  from public.org_users
  where user_id = v_user_id;

  -- Build claims
  v_claims := event->'claims';
  v_claims := jsonb_set(v_claims, '{role}', to_jsonb(v_role));

  if v_org_id is not null then
    v_claims := jsonb_set(v_claims, '{org_id}', to_jsonb(v_org_id::text));
  end if;

  return jsonb_set(event, '{claims}', v_claims);
end;
$$;

-- Grant execute to supabase auth hook user
grant execute on function public.custom_jwt_claims to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant select on public.user_roles to supabase_auth_admin;
grant select on public.org_users to supabase_auth_admin;

-- Seed: make mark.bulling@gmail.com an admin
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where email = 'mark.bulling@gmail.com';

  if v_user_id is not null then
    insert into public.user_roles (user_id, role)
    values (v_user_id, 'admin')
    on conflict (user_id) do update set role = 'admin', updated_at = now();

    raise notice 'Set mark.bulling@gmail.com as admin (%)' , v_user_id;
  else
    raise notice 'mark.bulling@gmail.com not found — will be set to admin on first sign-up';
  end if;
end;
$$;
