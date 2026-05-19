"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError, updateProfile } from "@/lib/api/client";
import { ChevronBackIcon, ChevronDownIcon, EyeIcon, EyeSlashIcon } from "@/components/icons/outline";
import { BottomSheet } from "@/app/components/bottom-sheet";

const COUNTRIES = [
  { code: "ID", flag: "🇮🇩", name: "Indonesia", dial: "+62" },
  { code: "MY", flag: "🇲🇾", name: "Malaysia", dial: "+60" },
  { code: "SG", flag: "🇸🇬", name: "Singapura", dial: "+65" },
  { code: "PH", flag: "🇵🇭", name: "Filipina", dial: "+63" },
  { code: "TH", flag: "🇹🇭", name: "Thailand", dial: "+66" },
  { code: "VN", flag: "🇻🇳", name: "Vietnam", dial: "+84" },
  { code: "AU", flag: "🇦🇺", name: "Australia", dial: "+61" },
  { code: "US", flag: "🇺🇸", name: "Amerika Serikat", dial: "+1" },
  { code: "GB", flag: "🇬🇧", name: "Inggris", dial: "+44" },
  { code: "JP", flag: "🇯🇵", name: "Jepang", dial: "+81" },
  { code: "KR", flag: "🇰🇷", name: "Korea Selatan", dial: "+82" },
  { code: "CN", flag: "🇨🇳", name: "Tiongkok", dial: "+86" },
  { code: "IN", flag: "🇮🇳", name: "India", dial: "+91" },
  { code: "SA", flag: "🇸🇦", name: "Arab Saudi", dial: "+966" },
  { code: "AE", flag: "🇦🇪", name: "UAE", dial: "+971" },
] as const;

export default function EditProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();

  const [country, setCountry] = useState(COUNTRIES[0]);
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);

  const [username, setUsername] = useState(user?.username ?? "");
  const [phone, setPhone] = useState(() => {
    const raw = user?.phone ?? "";
    const match = COUNTRIES.find((c) => raw.startsWith(c.dial));
    if (match) return raw.slice(match.dial.length);
    return raw.replace(/^\+62/, "");
  });
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
      payload.phone = `${country.dial}${phone}`;
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
        <div></div>
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
            <button
              type="button"
              onClick={() => setCountrySheetOpen(true)}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-taupe-200 bg-white px-3.5 text-sm font-medium text-foreground transition-colors active:bg-taupe-50"
            >
              <span className="text-base leading-none">{country.flag}</span>
              <span>{country.dial}</span>
              <ChevronDownIcon strokeWidth={2} className="size-3 text-taupe-400" />
            </button>

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

          {/* Country selector sheet */}
          <BottomSheet
            open={countrySheetOpen}
            onClose={() => setCountrySheetOpen(false)}
            title="Pilih Kode Negara"
          >
            <div className="max-h-[55vh] overflow-y-auto">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { setCountry(c); setCountrySheetOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors active:bg-taupe-50"
                >
                  <span className="text-xl leading-none">{c.flag}</span>
                  <span className="flex-1 text-left font-medium text-foreground">{c.name}</span>
                  <span className="text-xs text-taupe-400">{c.dial}</span>
                  {c.code === country.code && (
                    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-foreground" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </BottomSheet>

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
              {showPassword ? (
                <EyeSlashIcon strokeWidth={1.8} className="size-5" />
              ) : (
                <EyeIcon strokeWidth={1.8} className="size-5" />
              )}
            </button>
          </div>

          {/* Feedback */}
          {message && (
            <p
              id="edit-profile-message"
              className={`rounded-xl px-4 py-3 text-sm ${isError
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
