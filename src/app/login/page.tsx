"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { apiErrorMessage, apiSuccessMessage } from "@/lib/toast-messages";

import { AgungPresenceShapePattern } from "@/components/agung-presence-shape-pattern";
import { AgungPresenceLogoIcon } from "@/components/icons/agung-presence-logo";
import { EyeIcon, EyeSlashIcon } from "@/components/icons/outline";
import { Button } from "@/components/ui";
import { useToast } from "@/app/components/toast-provider";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const toast = useToast();
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
      const result = await login(loginValue, password);
      signIn(result.data.token, result.data.user);
      toast.success(apiSuccessMessage(result, "Login berhasil."));
      router.replace("/dashboard");
    } catch (err) {
      const message = apiErrorMessage(err, "Login gagal. Coba lagi.");
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-taupe-50">
      <div className="relative isolate grid min-h-dvh w-full overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          aria-hidden="true"
        >
          <AgungPresenceShapePattern className="absolute right-0 top-0 size-52 opacity-25 sm:size-60 lg:left-10 lg:right-auto lg:top-10 lg:size-72" />
          <AgungPresenceShapePattern className="absolute bottom-0 left-0 size-52 rotate-360 opacity-25 sm:size-60 lg:left-auto lg:right-[34rem] lg:size-80" />
        </div>

        <section className="relative z-10 hidden min-h-dvh flex-col justify-between px-10 py-10 lg:flex xl:px-14">
          <div className="flex items-center gap-3">
            <div className="size-12 overflow-hidden rounded-2xl shadow-sm">
              <AgungPresenceLogoIcon
                variant="inverted"
                className="size-full"
              />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">
                Agung Presence
              </p>
              <p className="text-xs text-taupe-500">
                Presence Workspace
              </p>
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-primary-600">
              Attendance workspace
            </p>
            <h1 className="mt-3 text-5xl font-bold leading-tight text-foreground">
              Operasional presensi dalam satu tampilan kerja.
            </h1>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["Live", "Presence"],
                ["Office", "Radius"],
                ["Admin", "Reports"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-2xl bg-white/80 p-4 ring-1 ring-taupe-200 backdrop-blur"
                >
                  <p className="text-lg font-bold text-foreground">{value}</p>
                  <p className="mt-1 text-xs text-taupe-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="max-w-xl text-sm leading-6 text-taupe-500">
            Gunakan akun yang terdaftar untuk masuk ke dashboard presensi,
            kantor, karyawan, dan riwayat kehadiran.
          </p>
        </section>

        <section className="relative z-10 flex min-h-dvh items-center justify-center px-6 py-10 md:px-10 lg:border-l lg:border-taupe-200 lg:bg-white/80 lg:backdrop-blur-xl">
          <div className="w-full max-w-sm">
            <div className="mb-10 flex flex-col items-center lg:items-start">
              <div className="mb-4 size-16 overflow-hidden rounded-2xl shadow-sm lg:hidden">
                <AgungPresenceLogoIcon
                  variant="inverted"
                  className="size-full"
                />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Agung Presence
              </h1>
              <p className="mt-1.5 text-sm text-taupe-400">
                Masuk ke akun Anda
              </p>
            </div>

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
        </section>
      </div>
    </div>
  );
}
