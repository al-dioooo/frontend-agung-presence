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
    <div className="flex items-center justify-between border-b border-border py-3.5 last:border-b-0">
      <span className="text-sm text-muted">{label}</span>
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
    <div className="px-5 pt-7">
      <h1 className="mb-8 text-xl font-semibold text-foreground tracking-tight">Profile</h1>

      {/* Avatar */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex size-22 items-center justify-center rounded-full bg-accent text-2xl font-semibold text-white shadow-md">
          {getInitials(user.name)}
        </div>
        <h2 id="profile-name" className="mt-4 text-lg font-semibold text-foreground">
          {user.name}
        </h2>
        <span className="mt-1.5 rounded-full bg-surface-warm px-3.5 py-1 text-xs font-medium capitalize text-muted">
          {user.role}
        </span>
      </div>

      {/* Info */}
      <div id="profile-info" className="card-soft mb-7 px-5">
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
          className="btn-primary flex items-center justify-center flex-1"
        >
          Edit Profile
        </Link>
        <button
          id="logout-button"
          onClick={handleLogout}
          className="btn-secondary flex items-center justify-center flex-1"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
