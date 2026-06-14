"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { signup } from "@/lib/api";
import { setAuth } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await signup(email, password);
      setAuth(res.token, res.user);
      router.push("/tasks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      headline="Start with a clear list."
      subline="One account. Your tasks only."
      title="Create account"
      description="Takes less than a minute."
      footer={
        <p className="text-sm text-ink-muted dark:text-dark-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-action hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md bg-surface-raised dark:bg-dark-raised border border-ink/15 dark:border-dark-muted/30 text-sm shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md bg-surface-raised dark:bg-dark-raised border border-ink/15 dark:border-dark-muted/30 text-sm shadow-sm"
          />
          <p className="text-xs text-ink-muted dark:text-dark-muted mt-1">
            At least 8 characters
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-rose px-3 py-2 rounded-md bg-rose/8">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-md bg-action hover:bg-action-hover text-white text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
