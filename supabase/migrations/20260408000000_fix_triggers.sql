-- Fix: update_skill_metrics and generate_alerts both reference NEW.org_id
-- but session_events has no org_id column. Join through sessions instead.

-- Fix update_skill_metrics trigger
create or replace function update_skill_metrics()
returns trigger as $$
declare
  v_org_id uuid;
begin
  -- Get org_id from parent session
  select org_id into v_org_id
  from public.sessions
  where id = NEW.session_id;

  if v_org_id is null then
    return NEW;
  end if;

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
    v_org_id,
    NEW.skill_name,
    1,
    case when NEW.status = 'success' then 1 else 0 end,
    case when NEW.status = 'error' then 1 else 0 end,
    NEW.timestamp,
    case when NEW.status = 'success' then 100.0 else 0.0 end,
    case when NEW.status = 'error' and NEW.error_message is not null then
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
    success_rate = (
      (skill_metrics.successful_invocations + case when NEW.status = 'success' then 1 else 0 end)::float /
      nullif(skill_metrics.total_invocations + 1, 0) * 100
    ),
    error_types = skill_metrics.error_types ||
      case when NEW.status = 'error' and NEW.error_message is not null then
        jsonb_build_object(
          NEW.error_message,
          coalesce((skill_metrics.error_types->>NEW.error_message)::int, 0) + 1
        )
      else '{}'::jsonb end,
    updated_at = now();

  return NEW;
end;
$$ language plpgsql;

-- Fix generate_alerts trigger
create or replace function generate_alerts()
returns trigger as $$
declare
  v_org_id uuid;
  recent_errors integer;
begin
  -- Get org_id from parent session
  select org_id into v_org_id
  from public.sessions
  where id = NEW.session_id;

  if v_org_id is null then
    return NEW;
  end if;

  -- Check for error spikes (more than 5 errors in last hour)
  select count(*)
  into recent_errors
  from public.session_events se
  join public.sessions s on s.id = se.session_id
  where se.event_type = 'skill_invocation'
    and se.status = 'error'
    and se.timestamp > now() - interval '1 hour'
    and s.org_id = v_org_id;

  if recent_errors > 5 then
    insert into public.alerts (
      org_id, alert_type, severity, title, message, data, status
    )
    values (
      v_org_id,
      'error_spike',
      'warning',
      'High error rate detected',
      format('Your sessions have had %s errors in the last hour', recent_errors),
      jsonb_build_object('error_count', recent_errors, 'timeframe', '1 hour'),
      'active'
    )
    -- Avoid duplicate alerts within an hour
    on conflict do nothing;
  end if;

  -- Check for high-risk permission requests
  if NEW.event_type = 'permission_request' then
    insert into public.alerts (
      org_id, alert_type, severity, title, message, data, status
    )
    values (
      v_org_id,
      'high_risk_permission',
      case
        when (NEW.metadata->>'risk_level') in ('high', 'critical') then 'critical'
        else 'warning'
      end,
      'High-risk permission requested',
      format(
        'Permission "%s" has been classified as %s risk',
        NEW.tool_name,
        coalesce(NEW.metadata->>'risk_level', 'unknown')
      ),
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
