export type DashboardVariant = "admin" | "auditor" | "technician" | "employee";

export function getDashboardVariant(
  permissions: string[],
  roleName?: string,
): DashboardVariant {
  if (
    roleName === "Admin" ||
    (permissions.includes("role.manage") && permissions.includes("user.manage"))
  ) {
    return "admin";
  }

  if (permissions.includes("audit.view") || permissions.includes("report.view")) {
    return "auditor";
  }

  if (
    permissions.includes("ticket.update") &&
    permissions.includes("ticket.resolve")
  ) {
    return "technician";
  }

  return "employee";
}
