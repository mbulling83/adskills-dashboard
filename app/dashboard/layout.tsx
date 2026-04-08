import { AnnouncementBanner } from "@/components/AnnouncementBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBanner />
      {children}
    </div>
  );
}
