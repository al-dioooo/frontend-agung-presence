"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, login } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-accent shadow-md">
            <span className="text-xl font-bold text-white tracking-tight">AP</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Agung Presence
          </h1>
          <p className="mt-1.5 text-sm text-muted">Masuk ke akun Anda</p>
        </div>

        {/* Form */}
        <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="login-input"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Email atau Username
            </label>
            <input
              id="login-input"
              type="text"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              autoComplete="username"
              placeholder="Masukkan email atau username"
              required
              className="input-elegant"
            />
          </div>

          <div>
            <label
              htmlFor="password-input"
              className="mb-2 block text-sm font-medium text-foreground"
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
                placeholder="Masukkan password"
                required
                className="input-elegant pr-11"
              />
              <button
                type="button"
                id="toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-muted transition-colors hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-5">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  ) : (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </>
                  )}
                </svg>
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
            className="btn-primary mt-1"
          >
            {isSubmitting ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
