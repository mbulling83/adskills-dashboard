import Link from "next/link";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <nav className="w-56 border-r p-4 space-y-2 bg-gray-50">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-4">
          My Dashboard
        </p>
        <Link href="/dashboard" className="block text-sm hover:underline">
          Usage
        </Link>
        <Link href="/dashboard/tokens" className="block text-sm hover:underline">
          API Tokens
        </Link>
      </nav>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
