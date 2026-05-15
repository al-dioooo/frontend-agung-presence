"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-taupe-200/60 last:border-b-0">
      <span className="text-sm text-taupe-400">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div className="px-5 pt-6">
      <h1 className="mb-8 text-xl font-bold text-foreground">Profile</h1>

      {/* Avatar */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-foreground text-2xl font-semibold text-white">
          {getInitials(user.name)}
        </div>
        <h2 id="profile-name" className="mt-4 text-lg font-bold text-foreground">
          {user.name}
        </h2>
        <span className="mt-1 text-xs text-taupe-400 capitalize">
          {user.role}
        </span>
      </div>

      {/* Info */}
      <div id="profile-info" className="mb-8 px-1">
        <InfoRow label="Username" value={user.username} />
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Role" value={user.role} />
        {user.phone && <InfoRow label="Phone" value={user.phone} />}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          id="edit-profile-button"
          href="/profile/edit"
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-white active:opacity-80 transition-opacity"
        >
          Edit Profile
        </Link>
        <button
          id="logout-button"
          onClick={handleLogout}
          className="flex h-11 flex-1 items-center justify-center rounded-full border border-taupe-200 bg-white text-sm font-semibold text-foreground active:opacity-80 transition-opacity"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
