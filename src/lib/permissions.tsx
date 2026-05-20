"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

import { getApiUrl } from "@/lib/api-url";
const protectedRoutes = ["/dashboard", "/assets", "/tickets", "/users", "/roles", "/audit"];

interface PermissionContextType {
  permissions: string[];
  hasPermission: (perm: string) => boolean;
  hasAnyPermission: (perms: string[]) => boolean;
  loading: boolean;
  authenticated: boolean;
  user: { id: string; name: string; email: string; roleName: string } | null;
}

const PermissionContext = createContext<PermissionContextType>({
  permissions: [],
  hasPermission: () => false,
  hasAnyPermission: () => false,
  loading: true,
  authenticated: false,
  user: null,
});

export function PermissionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    roleName: string;
  } | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  useEffect(() => {
    let cancelled = false;
    async function fetchMe() {
      return fetch(`${getApiUrl()}/api/v1/auth/me`, {
        credentials: "include",
      });
    }

    async function fetchPermissions() {
      try {
        let res = await fetchMe();
        if (!res.ok) {
          const refreshRes = await fetch(`${getApiUrl()}/api/v1/auth/refresh`, {
            method: "POST",
            credentials: "include",
          });
          if (refreshRes.ok) {
            res = await fetchMe();
          }
        }

        if (cancelled) return;
        if (!res.ok) {
          setAuthenticated(false);
          setPermissions([]);
          setUser(null);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.data?.role?.permissions) {
          setPermissions(data.data.role.permissions);
          setAuthenticated(true);
          setUser({
            id: data.data.id,
            name: data.data.name,
            email: data.data.email,
            roleName: data.data.role.name,
          });
        } else {
          setAuthenticated(false);
          setPermissions([]);
          setUser(null);
        }
      } catch {
        if (cancelled) return;
        setPermissions([]);
        setAuthenticated(false);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPermissions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loading && !authenticated && isProtectedRoute) {
      router.replace(`/?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [authenticated, isProtectedRoute, loading, pathname, router]);

  const hasPermission = useCallback(
    (perm: string) => permissions.includes(perm),
    [permissions],
  );
  const hasAnyPermission = useCallback(
    (perms: string[]) => perms.some((p) => permissions.includes(p)),
    [permissions],
  );

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        hasPermission,
        hasAnyPermission,
        loading,
        authenticated,
        user,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  return useContext(PermissionContext);
}
