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
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gray-900">
            <span className="text-lg font-bold text-white">AP</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Agung Presence</h1>
          <p className="mt-1 text-sm text-gray-500">Masuk ke akun Anda</p>
        </div>

        {/* Form */}
        <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-input"
              className="mb-1.5 block text-sm font-medium text-gray-700"
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
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-gray-400 focus:bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="password-input"
              className="mb-1.5 block text-sm font-medium text-gray-700"
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
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-4 pr-11 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-gray-400 focus:bg-white"
              />
              <button
                type="button"
                id="toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p
              id="login-error"
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <button
            id="login-submit"
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-11 w-full rounded-xl bg-gray-900 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
