import {
  CommunityIcon as CommunityOutline,
  DatabaseIcon as DatabaseOutline,
  EnterpriseIcon as EnterpriseOutline,
  HomeIcon as HomeOutline,
  UserIcon as UserOutline,
} from "@/components/icons/outline";
import {
  CommunityIcon as CommunitySolid,
  DatabaseIcon as DatabaseSolid,
  EnterpriseIcon as EnterpriseSolid,
  HomeIcon as HomeSolid,
  UserIcon as UserSolid,
} from "@/components/icons/solid";

export type NavItem = {
  href: string;
  label: string;
  outlineIcon: React.ComponentType<{ className?: string }>;
  solidIcon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    outlineIcon: HomeOutline,
    solidIcon: HomeSolid,
  },
  {
    href: "/presence",
    label: "Presence",
    outlineIcon: DatabaseOutline,
    solidIcon: DatabaseSolid,
  },
  {
    href: "/office",
    label: "Office",
    outlineIcon: EnterpriseOutline,
    solidIcon: EnterpriseSolid,
  },
  {
    href: "/employee",
    label: "Employee",
    outlineIcon: CommunityOutline,
    solidIcon: CommunitySolid,
    adminOnly: true,
  },
  {
    href: "/profile",
    label: "Profile",
    outlineIcon: UserOutline,
    solidIcon: UserSolid,
  },
];
