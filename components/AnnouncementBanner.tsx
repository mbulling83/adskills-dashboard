"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Sparkles, Rocket, AlertTriangle, Wrench, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  message: string;
  announcement_type: string;
  severity: string;
  icon?: string;
  action_url?: string;
  action_label?: string;
  featured: boolean;
}

export function AnnouncementBanner() {
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // Record user visit
        await fetch("/api/user/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id })
        });

        // Fetch relevant announcements (uses session cookie automatically)
        const response = await fetch("/api/announcements");

        if (response.ok) {
          const { announcements } = await response.json();
          setAnnouncements(announcements || []);
        }
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnnouncements();
  }, [supabase]);

  const handleDismiss = async (announcementId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await fetch("/api/announcements/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          announcement_id: announcementId
        })
      });

      // Remove from local state
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));

      // Move to next announcement if available
      if (announcements.length > 1) {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to dismiss announcement:", error);
    }
  };

  const getIcon = (iconName?: string) => {
    if (iconName) {
      // You could map custom icons here
      return <Sparkles className="h-5 w-5" />;
    }

    switch (announcements[currentIndex]?.announcement_type) {
      case "new_feature":
        return <Rocket className="h-5 w-5" />;
      case "improvement":
        return <Sparkles className="h-5 w-5" />;
      case "bug_fix":
        return <Wrench className="h-5 w-5" />;
      case "security":
        return <Shield className="h-5 w-5" />;
      case "maintenance":
        return <Wrench className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getSeverityStyles = () => {
    const severity = announcements[currentIndex]?.severity;

    switch (severity) {
      case "critical":
        return "border-destructive/50 bg-destructive/10 text-destructive";
      case "warning":
        return "border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      default:
        return "border-accent/50 bg-accent/10 text-accent";
    }
  };

  if (loading || announcements.length === 0) {
    return null;
  }

  const announcement = announcements[currentIndex];

  return (
    <div className={`border-b ${getSeverityStyles()}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              {getIcon(announcement.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{announcement.title}</p>
              <p className="text-sm opacity-90 truncate">{announcement.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {announcement.action_url && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => window.open(announcement.action_url, "_blank")}
              >
                {announcement.action_label || "Learn More"}
              </Button>
            )}

            {announcements.length > 1 && (
              <div className="flex items-center gap-1">
                {announcements.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentIndex ? "bg-current" : "bg-current/30"
                    }`}
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => handleDismiss(announcement.id)}
              className="flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
