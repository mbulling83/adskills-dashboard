"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Plus, Trash2, Edit2, Eye, EyeOff, Rocket, Wrench, Shield, AlertTriangle, Info, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  active: boolean;
  created_at: string;
  valid_from: string;
  valid_until?: string;
}

const ANNOUNCEMENT_TYPES = [
  { value: "new_feature", label: "New Feature", icon: Rocket },
  { value: "improvement", label: "Improvement", icon: Sparkles },
  { value: "bug_fix", label: "Bug Fix", icon: Wrench },
  { value: "security", label: "Security", icon: Shield },
  { value: "maintenance", label: "Maintenance", icon: Wrench },
];

const SEVERITIES = [
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "critical", label: "Critical" },
];

const EMPTY_FORM = {
  title: "",
  message: "",
  announcement_type: "new_feature",
  severity: "info",
  icon: "",
  action_url: "",
  action_label: "",
  featured: false,
  valid_until: "",
};

export default function AdminAnnouncementsPage() {
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    setLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setAnnouncements(data);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: form.title,
        message: form.message,
        announcement_type: form.announcement_type,
        severity: form.severity,
        icon: form.icon || null,
        action_url: form.action_url || null,
        action_label: form.action_label || null,
        featured: form.featured,
        valid_until: form.valid_until || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("announcements")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("announcements")
          .insert({ ...payload, active: true });
        if (error) throw error;
      }

      setForm(EMPTY_FORM);
      setShowForm(false);
      setEditingId(null);
      await fetchAnnouncements();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase
      .from("announcements")
      .update({ active: !current })
      .eq("id", id);
    setAnnouncements(prev =>
      prev.map(a => a.id === id ? { ...a, active: !current } : a)
    );
  }

  async function handleDelete(id: string) {
    await supabase.from("announcements").delete().eq("id", id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }

  function handleEdit(a: Announcement) {
    setEditingId(a.id);
    setForm({
      title: a.title,
      message: a.message,
      announcement_type: a.announcement_type,
      severity: a.severity,
      icon: a.icon || "",
      action_url: a.action_url || "",
      action_label: a.action_label || "",
      featured: a.featured,
      valid_until: a.valid_until ? a.valid_until.split("T")[0] : "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const typeConfig = Object.fromEntries(
    ANNOUNCEMENT_TYPES.map(t => [t.value, t])
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-border py-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/15 bg-foreground text-background">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[0.64rem] uppercase tracking-[0.34em] text-muted-foreground">AdSkills</p>
              <p className="text-sm font-medium">Admin</p>
            </div>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">Overview</Link>
            <Link href="/dashboard/admin/announcements" className="text-sm font-medium text-foreground">Announcements</Link>
          </nav>
        </header>

        <div className="py-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
              <p className="mt-1 text-muted-foreground">
                Create and manage feature announcements shown to users on login
              </p>
            </div>
            <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </div>

          {/* Create / Edit Form */}
          {showForm && (
            <Card className="border-border/80 bg-card p-6 space-y-5">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Announcement" : "Create Announcement"}
              </h2>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</label>
                  <input
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="What's new?"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Message</label>
                  <textarea
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent min-h-[80px] resize-y"
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Describe the update..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    value={form.announcement_type}
                    onChange={e => setForm(f => ({ ...f, announcement_type: e.target.value }))}
                  >
                    {ANNOUNCEMENT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Severity</label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    value={form.severity}
                    onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                  >
                    {SEVERITIES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Action URL (optional)</label>
                  <input
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    value={form.action_url}
                    onChange={e => setForm(f => ({ ...f, action_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Action Label (optional)</label>
                  <input
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    value={form.action_label}
                    onChange={e => setForm(f => ({ ...f, action_label: e.target.value }))}
                    placeholder="Learn More"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expires (optional)</label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    value={form.valid_until}
                    onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                  />
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <input
                    type="checkbox"
                    id="featured"
                    className="h-4 w-4 rounded"
                    checked={form.featured}
                    onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                  />
                  <label htmlFor="featured" className="text-sm">Feature prominently</label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <Button onClick={handleSave} disabled={saving || !form.title || !form.message}>
                  {saving ? "Saving..." : editingId ? "Update" : "Publish"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Announcements list */}
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
            ) : announcements.length === 0 ? (
              <Card className="border-border/80 bg-card p-12 text-center">
                <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No announcements yet</p>
                <p className="text-sm text-muted-foreground mt-1">Create your first announcement above</p>
              </Card>
            ) : (
              announcements.map(a => {
                const TypeIcon = typeConfig[a.announcement_type]?.icon ?? Info;
                return (
                  <Card
                    key={a.id}
                    className={`border-border/80 bg-card p-5 flex items-start gap-4 ${!a.active ? "opacity-50" : ""}`}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/15">
                      <TypeIcon className="h-5 w-5 text-accent" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold">{a.title}</p>
                        {a.featured && <Badge className="text-xs bg-accent/20 text-accent">Featured</Badge>}
                        <Badge variant="outline" className="text-xs capitalize">
                          {typeConfig[a.announcement_type]?.label ?? a.announcement_type}
                        </Badge>
                        <Badge
                          variant={a.severity === "critical" ? "destructive" : "outline"}
                          className="text-xs capitalize"
                        >
                          {a.severity}
                        </Badge>
                        {!a.active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Published {new Date(a.created_at).toLocaleDateString()}
                        {a.valid_until && ` · Expires ${new Date(a.valid_until).toLocaleDateString()}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleActive(a.id, a.active)}
                        title={a.active ? "Deactivate" : "Activate"}
                        className="p-2 rounded hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {a.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(a)}
                        className="p-2 rounded hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-2 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
