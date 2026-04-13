import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBanner />
      <DashboardShell>{children}</DashboardShell>
    </div>
  );
}
