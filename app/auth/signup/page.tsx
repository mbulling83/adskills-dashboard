"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

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
      <main className="min-h-screen bg-background text-foreground">
        <div className="hero-grain pointer-events-none fixed inset-0 opacity-70" />
        <section className="relative mx-auto min-h-screen max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-screen items-center justify-center py-12">
            <Card className="w-full max-w-md border-border/80 bg-card/95 backdrop-blur p-8">
              <div className="mb-8 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-accent/25">
                  <CheckCircle2 className="h-8 w-8 text-accent" />
                </div>
              </div>

              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold">Check your email</h1>
                <p className="mt-2 text-muted-foreground">
                  We've sent a confirmation link to
                </p>
                <p className="mt-1 font-medium text-foreground">{email}</p>
                <p className="mt-4 text-sm text-muted-foreground">
                  Click the link in the email to activate your account.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/auth/login")}
              >
                Back to sign in
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="hero-grain pointer-events-none fixed inset-0 opacity-70" />
      <section className="relative mx-auto min-h-screen max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-screen items-center justify-center py-12">
          <Card className="w-full max-w-md border-border/80 bg-card/95 backdrop-blur p-8">
            <div className="mb-8">
              <Link href="/" className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/15 bg-foreground text-background">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.34em] text-muted-foreground">
                    AdSkills
                  </p>
                  <p className="text-base font-medium">Dashboard</p>
                </div>
              </Link>

              <div className="mt-8">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="mt-2 text-muted-foreground">
                  Get started with AdSkills Dashboard
                </p>
              </div>
            </div>

            <form onSubmit={handleSignUp} className="space-y-6">
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Same as above"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Creating account…" : "Create account"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-medium text-foreground hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
