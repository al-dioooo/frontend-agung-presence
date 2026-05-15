"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError, updateProfile } from "@/lib/api/client";
import { ChevronBackIcon } from "@/components/icons/outline";

export default function EditProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState(user?.username ?? "");
  const [phone, setPhone] = useState(user?.phone?.replace(/^\+62/, "") ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setMessage("");

    const payload: { username?: string; phone?: string; password?: string } =
      {};

    if (username !== user?.username) {
      payload.username = username;
    }

    if (phone) {
      payload.phone = `+62${phone}`;
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
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Top bar — back, title, upload icon */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button
          id="back-button"
          onClick={() => router.back()}
          className="text-foreground"
        >
          <ChevronBackIcon className="size-6" />
        </button>
        <h1 className="text-base font-semibold text-foreground">Edit Profile</h1>
        <button
          id="save-top-button"
          type="submit"
          form="edit-profile-form"
          className="text-foreground disabled:opacity-40"
          disabled={isSaving}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="size-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </button>
      </div>

      <div className="px-5">
        {/* User Name label */}
        <p className="mb-5 text-sm font-semibold text-foreground">
          {user?.name}
        </p>

        <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-3">
          {/* Username */}
          <input
            id="username-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="Username"
            className="h-11 w-full rounded-full border border-taupe-200 bg-white px-4 text-sm text-foreground placeholder:text-taupe-400 outline-none focus:border-taupe-300"
          />

          {/* Phone */}
          <div className="flex gap-2">
            <div className="flex h-11 items-center rounded-full border border-taupe-200 bg-white px-3.5 text-sm font-medium text-foreground">
              +62
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="ml-1.5 size-3 text-taupe-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </div>
            <input
              id="phone-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="xxx-xxxx-xxxx"
              className="h-11 flex-1 rounded-full border border-taupe-200 bg-white px-4 text-sm text-foreground placeholder:text-taupe-400 outline-none focus:border-taupe-300"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              id="password-input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Password"
              className="h-11 w-full rounded-full border border-taupe-200 bg-white pl-4 pr-11 text-sm text-foreground placeholder:text-taupe-400 outline-none focus:border-taupe-300"
            />
            <button
              type="button"
              id="toggle-password"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute inset-y-0 right-3.5 flex items-center text-taupe-400"
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

          {/* Feedback */}
          {message && (
            <p
              id="edit-profile-message"
              className={`rounded-xl px-4 py-3 text-sm ${
                isError
                  ? "bg-red-50 text-red-600"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {message}
            </p>
          )}

          {/* Buttons — side by side */}
          <div className="flex gap-3 pt-2">
            <button
              id="save-profile-button"
              type="submit"
              disabled={isSaving}
              className="h-11 rounded-full bg-foreground px-6 text-sm font-semibold text-white disabled:opacity-50 transition-opacity active:opacity-80"
            >
              {isSaving ? "Menyimpan..." : "Save Profile"}
            </button>
            <button
              id="cancel-button"
              type="button"
              onClick={() => router.back()}
              className="h-11 rounded-full border border-taupe-200 bg-white px-6 text-sm font-semibold text-foreground transition-opacity active:opacity-80"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
