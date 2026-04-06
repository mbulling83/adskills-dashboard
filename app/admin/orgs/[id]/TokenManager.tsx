"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type Token = {
  id: string;
  label: string;
  created_at: string;
  revoked_at: string | null;
};

export function TokenManager({
  orgId,
  tokens,
}: {
  orgId: string;
  tokens: Token[];
}) {
  const [newToken, setNewToken] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function generate() {
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org_id: orgId, label: label || "Default" }),
    });
    const data = await res.json();
    setNewToken(data.token);
    setLabel("");
    router.refresh();
  }

  async function revoke(tokenId: string) {
    await fetch("/api/tokens", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token_id: tokenId }),
    });
    router.refresh();
  }

  function copyToken() {
    if (!newToken) return;
    navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {newToken && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded space-y-2">
          <p className="text-sm font-semibold">
            New token — copy now, shown once:
          </p>
          <div className="flex items-center gap-2">
            <code className="text-xs break-all flex-1">{newToken}</code>
            <Button size="sm" variant="outline" onClick={copyToken}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Token label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="max-w-xs"
          onKeyDown={(e) => e.key === "Enter" && generate()}
        />
        <Button onClick={generate}>Generate Token</Button>
      </div>

      <div className="space-y-2">
        {tokens.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between p-3 border rounded"
          >
            <div>
              <span className="font-medium text-sm">{t.label}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {new Date(t.created_at).toLocaleDateString()}
              </span>
            </div>
            {t.revoked_at ? (
              <Badge variant="destructive">Revoked</Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => revoke(t.id)}
              >
                Revoke
              </Button>
            )}
          </div>
        ))}
        {tokens.length === 0 && (
          <p className="text-sm text-muted-foreground">No tokens yet.</p>
        )}
      </div>
    </div>
  );
}
