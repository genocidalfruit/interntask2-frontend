"use client";

import { usePermission } from "@/lib/permissions";

export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasPermission } = usePermission();
  if (!hasPermission(permission)) return <>{fallback}</>;
  return <>{children}</>;
}