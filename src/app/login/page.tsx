"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  AuthError,
  AuthField,
  AuthShell,
  AuthSubmitButton,
} from "@/components/auth-shell";
import { login } from "@/lib/api";
import { setAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      setAuth(res.token, res.user);
      router.push("/tasks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      variant="login"
      headline="Know what needs doing, and when."
      subline="Deadlines surface as urgency — not noise."
      title="Sign in"
      description="Open your ledger and pick up where you left off."
      footer={
        <p className="text-sm text-ink-muted dark:text-dark-muted text-center">
          No account?{" "}
          <Link
            href="/signup"
            className="text-action font-medium hover:underline underline-offset-2"
          >
            Create one
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={setEmail}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={setPassword}
        />

        {error && <AuthError message={error} />}

        <AuthSubmitButton loading={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </AuthSubmitButton>
      </form>
    </AuthShell>
  );
}
