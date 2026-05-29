"use client";

import { AdminOnly } from "@/app/components/admin-only";
import { OfficeForm } from "../office-form";

export default function OfficeCreatePage() {
  return (
    <AdminOnly redirectTo="/office">
      <OfficeForm mode={{ kind: "create" }} />
    </AdminOnly>
  );
}
