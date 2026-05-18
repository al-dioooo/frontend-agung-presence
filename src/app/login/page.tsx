"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, login } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";

import { EyeIcon, EyeSlashIcon } from "@/components/icons/outline";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-taupe-50 px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-foreground">
            <span className="text-xl font-bold text-white tracking-tight">AP</span>
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

          <button
            id="login-submit"
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl bg-foreground text-sm font-semibold text-white transition-opacity disabled:opacity-50 active:opacity-80"
          >
            {isSubmitting ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
