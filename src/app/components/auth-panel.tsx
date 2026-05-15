"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ApiError, getProfile, getStatus, login, logout } from "@/lib/api/client";
import type { ApiStatus, User } from "@/lib/api/types";

const tokenStorageKey = "agung-presence-token";

type ConnectionState =
  | { status: "checking" }
  | { status: "online"; api: ApiStatus }
  | { status: "offline"; message: string };

export function AuthPanel() {
  const [connection, setConnection] = useState<ConnectionState>({
    status: "checking",
  });
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loginValue, setLoginValue] = useState("hello@aliceevr.com");
  const [password, setPassword] = useState("aldio1234");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initials = useMemo(() => {
    return user?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  useEffect(() => {
    getStatus()
      .then((api) => setConnection({ status: "online", api }))
      .catch((error: unknown) => {
        setConnection({
          status: "offline",
          message:
            error instanceof Error
              ? error.message
              : "Tidak bisa menghubungi backend.",
        });
      });

    const storedToken = window.localStorage.getItem(tokenStorageKey);

    if (storedToken) {
      getProfile(storedToken)
        .then((profile) => {
          setToken(storedToken);
          setUser(profile);
        })
        .catch(() => {
          window.localStorage.removeItem(tokenStorageKey);
        });
    }
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const session = await login(loginValue, password);

      window.localStorage.setItem(tokenStorageKey, session.token);
      setToken(session.token);
      setUser(session.user);
      setMessage("Login berhasil.");
    } catch (error) {
      setMessage(
        error instanceof ApiError ? error.message : "Login gagal diproses.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    if (token) {
      await logout(token).catch(() => null);
    }

    window.localStorage.removeItem(tokenStorageKey);
    setToken("");
    setUser(null);
    setMessage("Session lokal sudah dibersihkan.");
  }

  return (
    <div className="grid min-h-screen bg-[#f7f8fb] text-slate-950 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.55fr)]">
      <section className="flex flex-col justify-between gap-12 px-6 py-8 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              AP
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Agung Presence
              </p>
              <p className="text-xs text-slate-500">UWP Frontend</p>
            </div>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
            Next.js + Laravel API
          </div>
        </header>

        <main className="max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Presence Management
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-5xl">
            Base project siap untuk integrasi absensi, kantor, dan autentikasi.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Frontend sudah diarahkan ke backend Laravel melalui API proxy lokal.
            Token Sanctum disimpan di browser dan dikirim sebagai Bearer token
            untuk request yang membutuhkan autentikasi.
          </p>

          <div className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            <StatusCard
              label="Backend"
              value={
                connection.status === "online"
                  ? connection.api.name
                  : connection.status === "checking"
                    ? "Checking"
                    : "Offline"
              }
              tone={connection.status === "online" ? "good" : "neutral"}
            />
            <StatusCard
              label="Endpoint"
              value="/api/backend"
              tone="neutral"
            />
            <StatusCard
              label="Session"
              value={user ? user.role : "Guest"}
              tone={user ? "good" : "neutral"}
            />
          </div>
        </main>

        <footer className="text-sm text-slate-500">
          API target: <span className="font-medium">api-agung-presence.test</span>
        </footer>
      </section>

      <aside className="border-l border-slate-200 bg-white px-6 py-8 sm:px-10">
        <div className="mx-auto flex h-full max-w-md flex-col justify-center">
          {user ? (
            <div>
              <div className="mb-6 grid size-14 place-items-center rounded-xl bg-slate-950 text-lg font-semibold text-white">
                {initials}
              </div>
              <p className="text-sm font-medium text-emerald-700">
                Authenticated
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {user.name}
              </h2>
              <dl className="mt-6 space-y-3 text-sm">
                <InfoRow label="Username" value={user.username} />
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Role" value={user.role} />
              </dl>
              <button
                className="mt-8 h-11 w-full rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <p className="text-sm font-medium text-emerald-700">Sign in</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Masuk ke Agung Presence
              </h2>

              <label className="mt-8 block text-sm font-medium text-slate-700">
                Email atau username
                <input
                  className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  value={loginValue}
                  onChange={(event) => setLoginValue(event.target.value)}
                  autoComplete="username"
                  required
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-slate-700">
                Password
                <input
                  className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>

              <button
                className="mt-6 h-11 w-full rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Memproses..." : "Login"}
              </button>
            </form>
          )}

          {message ? (
            <p className="mt-5 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
              {message}
            </p>
          ) : null}

          {connection.status === "offline" ? (
            <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {connection.message}
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function StatusCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "neutral";
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-3 truncate text-sm font-semibold ${
          tone === "good" ? "text-emerald-700" : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="truncate font-medium text-slate-950">{value}</dd>
    </div>
  );
}
