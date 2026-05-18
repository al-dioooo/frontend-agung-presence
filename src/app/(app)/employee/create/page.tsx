"use client";

import { EmployeeForm } from "../employee-form";

export default function EmployeeCreatePage() {
  return <EmployeeForm mode={{ kind: "create" }} />;
}
