import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreateOrgForm } from "./CreateOrgForm";

export default async function OrgsPage() {
  const supabase = await createClient();
  const { data: orgs } = await supabase
    .from("orgs")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Organisations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage tenant organizations and access.
          </p>
        </div>
        <CreateOrgForm />
      </div>
      <div className="space-y-3">
        {orgs?.map((org) => (
          <Card key={org.id} className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-slate-900">{org.name}</p>
                <p className="text-xs text-slate-500">
                  {new Date(org.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button variant="outline" size="sm" className="border-slate-300 bg-white hover:bg-slate-50">
                <Link href={`/admin/orgs/${org.id}`}>Manage</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {(!orgs || orgs.length === 0) && (
          <p className="text-sm text-muted-foreground">No organisations yet.</p>
        )}
      </div>
    </div>
  );
}
