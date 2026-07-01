"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError, updateProfile } from "@/lib/api/client";
import { ChevronBackIcon, EyeIcon, EyeSlashIcon } from "@/components/icons/outline";
import { Button, Card, Input } from "@/components/ui";
import { AppPage } from "@/app/components/responsive-layout";

const USERNAME_RULE =
  "Gunakan huruf, angka, tanda hubung (-), atau underscore (_), maksimal 100 karakter.";

export default function EditProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setMessage("");
    setFieldErrors({});

    const payload: { username?: string; email?: string; password?: string } = {};
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (trimmedUsername !== user?.username) {
      payload.username = trimmedUsername;
    }

    if (trimmedEmail !== user?.email) {
      payload.email = trimmedEmail;
    }

    if (password) {
      payload.password = password;
    }

    try {
      await updateProfile(token, payload);
      await refreshUser();
      setIsError(false);
      setMessage("Profil berhasil diperbarui.");
      setPassword("");
    } catch (err) {
      setIsError(true);
      setMessage(
        err instanceof ApiError ? err.message : "Gagal menyimpan profil.",
      );

      if (err instanceof ApiError) {
        const data = err.data as { errors?: Record<string, string[]> } | null;
        if (data?.errors) {
          const flattened: Record<string, string> = {};
          for (const [key, value] of Object.entries(data.errors)) {
            flattened[key] = value[0];
          }
          setFieldErrors(flattened);
        }
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppPage className="flex flex-col">
      <div className="flex items-center justify-between pb-3">
        <Button
          id="back-button"
          variant="secondary"
          size="icon"
          onClick={() => router.back()}
          aria-label="Kembali"
        >
          <ChevronBackIcon className="size-6" />
        </Button>
        <h1 className="text-base font-semibold text-foreground">Edit Profile</h1>
        <div />
      </div>

      <div>
        <p className="mb-5 text-sm font-semibold text-foreground">
          {user?.name}
        </p>

        <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0">
          <Card className="p-4 space-y-3 lg:p-5">
            <h3 className="text-sm font-bold text-foreground">Akun</h3>
            <Input
              id="username-input"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="contoh: budi_santoso"
              required
              hint={USERNAME_RULE}
              error={fieldErrors.username}
            />
            <Input
              id="email-input"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="budi@example.com"
              required
              error={fieldErrors.email}
            />
          </Card>

          <Card className="p-4 space-y-3 lg:p-5">
            <h3 className="text-sm font-bold text-foreground">Keamanan</h3>
            <div className="relative">
              <Input
                id="password-input"
                label="Password baru"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Kosongkan jika tidak diubah"
                className="pr-11"
                error={fieldErrors.password}
              />
              <button
                type="button"
                id="toggle-password"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute bottom-3 right-3.5 flex items-center text-taupe-400"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <EyeSlashIcon strokeWidth={1.8} className="size-5" />
                ) : (
                  <EyeIcon strokeWidth={1.8} className="size-5" />
                )}
              </button>
            </div>
          </Card>

          {message && (
            <p
              id="edit-profile-message"
              className={`rounded-xl px-4 py-3 text-sm lg:col-span-2 ${
                isError ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {message}
            </p>
          )}

          <div className="flex gap-3 pt-2 lg:col-span-2 lg:justify-end">
            <Button
              id="save-profile-button"
              type="submit"
              variant="primary"
              className="h-11 px-6"
              loading={isSaving}
              loadingText="Menyimpan..."
            >
              Save Profile
            </Button>
            <Button
              id="cancel-button"
              variant="secondary"
              className="h-11 px-6 bg-white"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AppPage>
  );
}
