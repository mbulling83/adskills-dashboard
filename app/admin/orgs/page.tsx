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
        <h1 className="text-2xl font-bold">Organisations</h1>
        <CreateOrgForm />
      </div>
      <div className="space-y-2">
        {orgs?.map((org) => (
          <Card key={org.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{org.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(org.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button variant="outline" size="sm">
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
