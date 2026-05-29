"use client";

import { AdminOnly } from "@/app/components/admin-only";
import { EmployeeForm } from "../employee-form";

export default function EmployeeCreatePage() {
  return (
    <AdminOnly>
      <EmployeeForm mode={{ kind: "create" }} />
    </AdminOnly>
  );
}
