"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Não foi possível entrar.");
        setLoading(false);
        return;
      }
      router.push(searchParams.get("next") ?? "/admin");
      router.refresh();
    } catch {
      setError("Falha de conexão.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h1 className="mb-1 text-lg font-bold text-foreground">Painel administrativo</h1>
      <p className="mb-6 text-sm text-foreground/60">Entre com suas credenciais.</p>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-foreground/70">E-mail</span>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-brand"
        />
      </label>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block text-foreground/70">Senha</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-brand"
        />
      </label>

      {error && (
        <p role="alert" className="mb-4 text-sm font-medium text-price">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
