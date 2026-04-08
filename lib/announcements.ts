export type AnnouncementType =
  | "new_feature"
  | "improvement"
  | "bug_fix"
  | "security"
  | "maintenance";

export type AnnouncementSeverity = "info" | "warning" | "critical";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  announcement_type: AnnouncementType;
  severity: AnnouncementSeverity;
  icon?: string;
  action_url?: string;
  action_label?: string;
  featured: boolean;
  active: boolean;
  created_at: string;
  valid_from: string;
  valid_until?: string;
}

/** Returns true if the announcement is currently visible (active, within validity window) */
export function isAnnouncementVisible(
  announcement: Pick<Announcement, "active" | "valid_from" | "valid_until">,
  now = new Date()
): boolean {
  if (!announcement.active) return false;
  if (new Date(announcement.valid_from) > now) return false;
  if (announcement.valid_until && new Date(announcement.valid_until) < now)
    return false;
  return true;
}

/** Returns announcements the user hasn't seen since their last visit */
export function filterUnseenAnnouncements(
  announcements: Announcement[],
  lastVisit: Date | null,
  dismissedIds: Set<string>,
  now = new Date()
): Announcement[] {
  return announcements.filter((a) => {
    if (!isAnnouncementVisible(a, now)) return false;
    if (dismissedIds.has(a.id)) return false;
    if (lastVisit && new Date(a.created_at) <= lastVisit) return false;
    return true;
  });
}
