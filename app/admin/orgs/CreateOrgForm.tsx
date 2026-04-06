"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateOrgForm() {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleCreate() {
    if (!name.trim()) return;
    await supabase.from("orgs").insert({ name: name.trim() });
    setOpen(false);
    setName("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        New Organisation
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organisation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Organisation name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button onClick={handleCreate} className="w-full">
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
