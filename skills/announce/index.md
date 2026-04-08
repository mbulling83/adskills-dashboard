---
name: announce
description: Create, list, and manage AdSkills feature announcements stored in Supabase. Triggered when the user wants to announce a feature, send a notification to users, or manage existing announcements.
---

# AdSkills Announcement Skill

Use this skill to create and manage feature announcements that are displayed to users when they log into the AdSkills dashboard.

## How Announcements Work

- Stored in the `announcements` table in Supabase
- Shown as a dismissible banner at the top of the dashboard
- Only shown to users who haven't seen them since the feature was released
- Each user's dismissal is tracked in `announcement_views`

## Available Actions

### 1. Create an announcement

Use the Supabase CLI or API to insert a new announcement:

```bash
# Via Supabase CLI (run from project root)
npx supabase db execute --project-ref gcvoqlahswwhckwxdesu "
  INSERT INTO announcements (title, message, announcement_type, severity, featured, action_url, action_label)
  VALUES (
    'YOUR TITLE',
    'YOUR MESSAGE',
    'new_feature',        -- new_feature | improvement | bug_fix | security | maintenance
    'info',               -- info | warning | critical
    true,                 -- featured = show prominently
    'https://...',        -- optional link
    'Learn More'          -- optional button label
  );"
```

### 2. List active announcements

```bash
npx supabase db execute --project-ref gcvoqlahswwhckwxdesu "
  SELECT id, title, announcement_type, severity, featured, active, created_at, valid_until
  FROM announcements
  ORDER BY created_at DESC;"
```

### 3. Deactivate an announcement

```bash
npx supabase db execute --project-ref gcvoqlahswwhckwxdesu "
  UPDATE announcements SET active = false WHERE id = 'ANNOUNCEMENT_ID';"
```

### 4. Set expiry on an announcement

```bash
npx supabase db execute --project-ref gcvoqlahswwhckwxdesu "
  UPDATE announcements SET valid_until = '2026-05-01T00:00:00Z' WHERE id = 'ANNOUNCEMENT_ID';"
```

## Announcement Types

| Type | When to use |
|------|-------------|
| `new_feature` | Launching a new capability |
| `improvement` | Enhancements to existing features |
| `bug_fix` | Notable bug fixes users should know about |
| `security` | Security updates or important notices |
| `maintenance` | Downtime, migrations, breaking changes |

## Severity Levels

| Severity | Style | When to use |
|----------|-------|-------------|
| `info` | Accent colour | Default — positive news |
| `warning` | Yellow | Requires user action or awareness |
| `critical` | Red | Urgent — security, data loss risk |

## Admin UI

Announcements can also be managed via the dashboard at:
`/dashboard/admin/announcements`

## Workflow for a New Feature Launch

When the user says "announce [feature]", follow this process:

1. **Ask** (if not provided):
   - What is the feature called?
   - One-sentence description for users
   - Is there a link to learn more?
   - Should it expire? When?
   - Severity: info / warning / critical?

2. **Draft** the announcement title and message:
   - Title: short, action-oriented ("Introducing Session Analytics")
   - Message: benefit-focused, one sentence ("Track your skill usage patterns and get AI-powered improvement suggestions.")

3. **Insert** using the SQL above

4. **Confirm** by listing active announcements

## Example

User: "Announce the new session replay feature"

Response:
```sql
INSERT INTO announcements (title, message, announcement_type, severity, featured, action_url, action_label)
VALUES (
  'New: Session Replay',
  'You can now replay any session to debug issues and understand exactly how your skills are performing.',
  'new_feature',
  'info',
  true,
  '/dashboard/analytics',
  'View Analytics'
);
```
