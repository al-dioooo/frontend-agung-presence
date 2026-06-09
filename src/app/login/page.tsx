"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, login } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";

import { AgungPresenceShapePattern } from "@/components/agung-presence-shape-pattern";
import { AgungPresenceLogoIcon } from "@/components/icons/agung-presence-logo";
import { EyeIcon, EyeSlashIcon } from "@/components/icons/outline";
import { Button } from "@/components/ui";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const session = await login(loginValue, password);
      signIn(session.token, session.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Login gagal. Coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-taupe-50">
      <div className="relative isolate mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center overflow-hidden px-6">
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          aria-hidden="true"
        >
          <AgungPresenceShapePattern className="absolute right-0 top-0 size-52 opacity-30 sm:size-60" />
          <AgungPresenceShapePattern className="absolute bottom-0 left-0 size-52 rotate-360 opacity-30 sm:size-60" />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          {/* Logo */}
          <div className="mb-10 flex flex-col items-center">
            <div className="mb-4 size-16 overflow-hidden rounded-2xl shadow-sm">
              <AgungPresenceLogoIcon
                variant="inverted"
                className="size-full"
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Agung Presence
            </h1>
            <p className="mt-1.5 text-sm text-taupe-400">Masuk ke akun Anda</p>
          </div>

          {/* Form */}
          <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-input"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Email atau Username
              </label>
              <input
                id="login-input"
                type="text"
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                autoComplete="username"
                placeholder="Email atau username"
                required
                className="h-11 w-full rounded-xl border border-taupe-200 bg-white px-4 text-sm text-foreground placeholder:text-taupe-400 outline-none focus:border-taupe-300"
              />
            </div>

            <div>
              <label
                htmlFor="password-input"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Password"
                  required
                  className="h-11 w-full rounded-xl border border-taupe-200 bg-white pl-4 pr-11 text-sm text-foreground placeholder:text-taupe-400 outline-none focus:border-taupe-300"
                />
                <button
                  type="button"
                  id="toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-taupe-400"
                >
                  {showPassword ? (
                    <EyeSlashIcon strokeWidth={1.8} className="size-5" />
                  ) : (
                    <EyeIcon strokeWidth={1.8} className="size-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p
                id="login-error"
                className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </p>
            )}

            <Button
              id="login-submit"
              type="submit"
              variant="primary"
              fullWidth
              className="h-11"
              loading={isSubmitting}
              loadingText="Memproses..."
            >
              Masuk
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
