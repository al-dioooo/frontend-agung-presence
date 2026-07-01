"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { AppPage } from "@/app/components/responsive-layout";
import { useToast } from "@/app/components/toast-provider";

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
  const toast = useToast();

  async function handleLogout() {
    const message = await signOut();
    toast.success(message);
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <AppPage>
      <h1 className="mb-8 text-xl font-bold text-foreground md:text-2xl">Profile</h1>

      <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-6">
      {/* Profile card */}
      <Card className="mb-8 p-5 lg:sticky lg:top-8 lg:mb-0">
        <div className="flex flex-col items-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-white">
            {getInitials(user.name)}
          </div>
          <h2 id="profile-name" className="mt-4 text-lg font-bold text-foreground">
            {user.name}
          </h2>
          <span className="mt-1 text-xs text-taupe-400 capitalize">
            {user.role}
          </span>
        </div>

        <div id="profile-info" className="mt-6">
          <InfoRow label="Username" value={user.username} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Role" value={user.role} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-bold text-foreground">Aksi Akun</h2>
        <p className="mt-1 text-sm text-taupe-500">
          Kelola profil dan sesi akun yang sedang aktif.
        </p>
        <div className="mt-5 flex gap-3">
          <Button
            id="edit-profile-button"
            href="/profile/edit"
            variant="primary"
            className="h-11 flex-1"
          >
            Edit Profile
          </Button>
          <Button
            id="logout-button"
            variant="secondary"
            className="h-11 flex-1 bg-white"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </Card>
      </div>
    </AppPage>
  );
}
