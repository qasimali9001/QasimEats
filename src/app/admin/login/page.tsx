"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/auth/me");
      const data = (await res.json()) as { user: string | null };
      if (!cancelled && data.user) {
        router.replace("/admin");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? `Login failed (${res.status})`);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto min-w-0 max-w-md px-0">
      <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted">
        Superuser access only. Credentials live in your local{" "}
        <code className="text-foreground/90">.env.local</code> (never committed).
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-muted">
            Username
          </label>
          <input
            className="mt-1 w-full min-w-0 max-w-full rounded-lg border border-white/15 bg-background/80 px-3 py-2.5 text-base outline-none focus:border-sky-400/40 sm:py-2 sm:text-sm"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-muted">
            Password
          </label>
          <input
            type="password"
            className="mt-1 w-full min-w-0 max-w-full rounded-lg border border-white/15 bg-background/80 px-3 py-2.5 text-base outline-none focus:border-sky-400/40 sm:py-2 sm:text-sm"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 w-full touch-manipulation rounded-lg border border-sky-400/30 bg-sky-600/80 py-2.5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50 sm:min-h-0 sm:py-2"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
