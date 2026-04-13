"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/AuthShell";

export default function SignUpPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <AuthShell
        title="Check your email"
        description="We sent a confirmation link to finish setting up your account."
      >
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-700" />
          </div>
        </div>

        <div className="mb-6 text-center">
          <p className="text-sm text-slate-500">Confirmation sent to</p>
          <p className="mt-1 font-medium text-slate-900">{email}</p>
          <p className="mt-3 text-sm text-slate-500">
            Click the link in that email to activate your account.
          </p>
        </div>

        <Button
          variant="outline"
          className="h-10 w-full rounded-md border-slate-300 bg-white hover:bg-slate-50"
          onClick={() => router.push("/auth/login")}
        >
          Back to sign in
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      description="Set up your workspace and start tracking skill performance."
    >
      <form onSubmit={handleSignUp} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="border-slate-300 bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="At least 6 characters"
            className="border-slate-300 bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Repeat your password"
            className="border-slate-300 bg-white"
          />
        </div>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="h-10 w-full rounded-md bg-slate-900 text-white hover:bg-slate-800"
          disabled={loading}
        >
          {loading ? "Creating account…" : "Create account"}
          {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-slate-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
