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
    <div className="flex items-center justify-between border-b border-gray-100 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
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
    <div className="px-4 pt-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Profile</h1>

      {/* Avatar */}
      <div className="mb-6 flex flex-col items-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-gray-900 text-2xl font-semibold text-white">
          {getInitials(user.name)}
        </div>
        <h2 id="profile-name" className="mt-3 text-base font-semibold text-gray-900">
          {user.name}
        </h2>
        <span className="mt-1 rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium capitalize text-gray-600">
          {user.role}
        </span>
      </div>

      {/* Info */}
      <div
        id="profile-info"
        className="mb-6 rounded-2xl border border-gray-100 px-4"
      >
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
          className="flex h-11 flex-1 items-center justify-center rounded-xl bg-gray-900 text-sm font-semibold text-white transition-opacity active:opacity-80"
        >
          Edit Profile
        </Link>
        <button
          id="logout-button"
          onClick={handleLogout}
          className="flex h-11 flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-opacity active:opacity-80"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
