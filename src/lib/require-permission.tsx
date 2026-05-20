"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/lib/permissions";
import { Skeleton } from "@/components/ui/skeleton";

interface RequirePermissionProps {
  permission: string;
  children: React.ReactNode;
}

export function RequirePermission({
  permission,
  children,
}: RequirePermissionProps) {
  const { hasPermission, loading, authenticated } = usePermission();
  const router = useRouter();

  useEffect(() => {
    if (!loading && authenticated && !hasPermission(permission)) {
      router.replace("/not-authorized");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, authenticated, permission]);

  if (loading || !authenticated) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return null;
  }

  return <>{children}</>;
}
