"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Search, Shield, Building2, UserCheck, UserX, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  app_metadata: { role?: string; org_id?: string };
  org?: { id: string; name: string } | null;
}

interface Org {
  id: string;
  name: string;
}

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    // Fetch orgs
    const { data: orgData } = await supabase.from("orgs").select("id, name").order("name");
    setOrgs(orgData || []);

    // Fetch users + their org via org_users join
    const response = await fetch("/api/admin/users");
    if (response.ok) {
      const { users } = await response.json();
      setUsers(users || []);
    }

    setLoading(false);
  }

  async function setRole(userId: string, role: "admin" | "org") {
    setSaving(userId);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  }

  async function assignOrg(userId: string, orgId: string | null) {
    setSaving(userId);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, org_id: orgId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  }

  const filtered = users.filter(
    (u) =>
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.org?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter((u) => u.app_metadata?.role === "admin").length;
  const orgCount = users.filter((u) => u.app_metadata?.role === "org").length;
  const unassigned = users.filter((u) => !u.app_metadata?.role).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Users
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Assign users to organisations and manage roles
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{adminCount} admin{adminCount !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>{orgCount} org users</span>
          {unassigned > 0 && (
            <>
              <span>·</span>
              <span className="text-yellow-600">{unassigned} unassigned</span>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-md">{error}</p>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className="w-full rounded-md border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Search by email or org..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="border-border/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Organisation</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last seen</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const role = user.app_metadata?.role;
                  const isSaving = saving === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      {/* Email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-semibold flex-shrink-0">
                            {user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {role === "admin" ? (
                            <Badge className="bg-accent/20 text-accent gap-1">
                              <Shield className="h-3 w-3" />
                              Admin
                            </Badge>
                          ) : role === "org" ? (
                            <Badge variant="outline" className="gap-1">
                              <UserCheck className="h-3 w-3" />
                              Org
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 text-yellow-600">
                              <UserX className="h-3 w-3" />
                              Unassigned
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Org */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <select
                            className="text-sm bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 py-0.5 min-w-0 max-w-[180px]"
                            value={user.app_metadata?.org_id || ""}
                            disabled={isSaving}
                            onChange={(e) => assignOrg(user.id, e.target.value || null)}
                          >
                            <option value="">— No org —</option>
                            {orgs.map((org) => (
                              <option key={org.id} value={org.id}>
                                {org.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Last seen */}
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : "Never"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {role !== "admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={isSaving}
                              onClick={() => setRole(user.id, "admin")}
                            >
                              Make admin
                            </Button>
                          )}
                          {role === "admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground"
                              disabled={isSaving}
                              onClick={() => setRole(user.id, "org")}
                            >
                              Demote
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
