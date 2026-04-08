import { describe, it, expect } from "vitest";
import {
  isAnnouncementVisible,
  filterUnseenAnnouncements,
  type Announcement,
} from "@/lib/announcements";

const NOW = new Date("2026-04-08T12:00:00Z");

function makeAnnouncement(overrides: Partial<Announcement> = {}): Announcement {
  return {
    id: "test-id",
    title: "Test",
    message: "Test message",
    announcement_type: "new_feature",
    severity: "info",
    featured: false,
    active: true,
    created_at: "2026-04-08T10:00:00Z",
    valid_from: "2026-04-08T00:00:00Z",
    ...overrides,
  };
}

describe("isAnnouncementVisible", () => {
  it("returns true for active announcement with no expiry", () => {
    const a = makeAnnouncement();
    expect(isAnnouncementVisible(a, NOW)).toBe(true);
  });

  it("returns false when inactive", () => {
    const a = makeAnnouncement({ active: false });
    expect(isAnnouncementVisible(a, NOW)).toBe(false);
  });

  it("returns false when valid_from is in the future", () => {
    const a = makeAnnouncement({ valid_from: "2026-04-09T00:00:00Z" });
    expect(isAnnouncementVisible(a, NOW)).toBe(false);
  });

  it("returns false when valid_until has passed", () => {
    const a = makeAnnouncement({ valid_until: "2026-04-07T00:00:00Z" });
    expect(isAnnouncementVisible(a, NOW)).toBe(false);
  });

  it("returns true when within valid_from and valid_until window", () => {
    const a = makeAnnouncement({
      valid_from: "2026-04-07T00:00:00Z",
      valid_until: "2026-04-09T00:00:00Z",
    });
    expect(isAnnouncementVisible(a, NOW)).toBe(true);
  });
});

describe("filterUnseenAnnouncements", () => {
  const base = makeAnnouncement({ id: "a1", created_at: "2026-04-08T10:00:00Z" });

  it("returns announcement when user has no prior visit", () => {
    const result = filterUnseenAnnouncements([base], null, new Set(), NOW);
    expect(result).toHaveLength(1);
  });

  it("returns announcement created after last visit", () => {
    const lastVisit = new Date("2026-04-07T00:00:00Z");
    const result = filterUnseenAnnouncements([base], lastVisit, new Set(), NOW);
    expect(result).toHaveLength(1);
  });

  it("excludes announcement created before last visit", () => {
    const lastVisit = new Date("2026-04-08T11:00:00Z");
    const result = filterUnseenAnnouncements([base], lastVisit, new Set(), NOW);
    expect(result).toHaveLength(0);
  });

  it("excludes dismissed announcements", () => {
    const dismissed = new Set(["a1"]);
    const result = filterUnseenAnnouncements([base], null, dismissed, NOW);
    expect(result).toHaveLength(0);
  });

  it("excludes inactive announcements", () => {
    const inactive = makeAnnouncement({ id: "a2", active: false });
    const result = filterUnseenAnnouncements([inactive], null, new Set(), NOW);
    expect(result).toHaveLength(0);
  });

  it("excludes expired announcements", () => {
    const expired = makeAnnouncement({
      id: "a3",
      valid_until: "2026-04-07T00:00:00Z",
    });
    const result = filterUnseenAnnouncements([expired], null, new Set(), NOW);
    expect(result).toHaveLength(0);
  });

  it("returns only unseen from mixed list", () => {
    const seen = makeAnnouncement({ id: "seen", created_at: "2026-04-08T10:00:00Z" });
    const unseen = makeAnnouncement({ id: "unseen", created_at: "2026-04-08T10:00:00Z" });
    const dismissed = new Set(["seen"]);
    const result = filterUnseenAnnouncements([seen, unseen], null, dismissed, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("unseen");
  });
});
