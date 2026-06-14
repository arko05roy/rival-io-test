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
import { signup } from "@/lib/api";
import { setAuth } from "@/lib/auth";

function passwordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  return Math.min(score, 4);
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(password);

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
      variant="signup"
      headline="Start with a clear list."
      subline="One account. Your tasks only."
      title="Create account"
      description="Your ledger starts empty — that's the point."
      footer={
        <p className="text-sm text-ink-muted dark:text-dark-muted text-center">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-action font-medium hover:underline underline-offset-2"
          >
            Sign in
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
        <div>
          <AuthField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={setPassword}
            hint="At least 8 characters"
          />
          {password.length > 0 && (
            <div className="mt-3 flex gap-1" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                    i < strength
                      ? strength <= 1
                        ? "bg-rose/70"
                        : strength <= 2
                          ? "bg-ember/80"
                          : "bg-moss/80"
                      : "bg-ink/10 dark:bg-dark-muted/20"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {error && <AuthError message={error} />}

        <AuthSubmitButton loading={loading}>
          {loading ? "Creating account…" : "Create account"}
        </AuthSubmitButton>
      </form>
    </AuthShell>
  );
}
