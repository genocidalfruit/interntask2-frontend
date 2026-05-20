"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Shield, Pencil, Trash2, Settings, Wrench, Users, Eye, RefreshCw, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleModal } from "@/components/roles/role-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { RequirePermission } from "@/lib/require-permission";
import { toast } from "sonner";

import { getApiUrl } from "@/lib/api-url";

const roleIconMap: Record<string, any> = {
  Admin: Settings,
  Technician: Wrench,
  Employee: Users,
  Auditor: Eye,
};

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/roles`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data = await res.json();
      setRoles(data.data || []);
    } catch {
      setError("Failed to load roles");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  async function handleDeleteConfirm() {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await fetch(`${getApiUrl()}/api/v1/roles/${deleteId}`, { method: "DELETE", credentials: "include" });
      toast.success("Role deleted");
      fetchData();
    } catch {}
    finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  }

  return (
    <RequirePermission permission="role.manage">
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl page-title">Roles</h1>
          <p className="text-muted-foreground mt-2 text-sm">Configure role-based access control</p>
        </div>
        <PermissionGuard permission="role.manage">
          <Button className="gap-2" onClick={() => { setEditingRole(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4" />
            Create Role
          </Button>
        </PermissionGuard>
      </div>

      {error && (
        <Card className="border-red-500/50 bg-red-500/10 animate-fade-up">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="min-h-[44px] min-w-[44px]">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/50 animate-fade-up" style={{ animationDelay: `${100 + i * 75}ms` }}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <Skeleton className="w-8 h-8 rounded-md" />
                  <div className="flex gap-1">
                    <Skeleton className="w-7 h-7" />
                    <Skeleton className="w-7 h-7" />
                  </div>
                </div>
                <div className="mt-3">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : roles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No roles found</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role, i) => {
            const Icon = roleIconMap[role.name] || Shield;
            return (
              <Card key={role._id} className="border-border/50 animate-fade-up" style={{ animationDelay: `${100 + i * 75}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-md bg-secondary w-fit">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <PermissionGuard permission="role.manage">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingRole(role); setModalOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(role._id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </PermissionGuard>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-medium">{role.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{role.permissions.length} permissions</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RoleModal open={modalOpen} onOpenChange={setModalOpen} role={editingRole} onSuccess={fetchData} />
      <ConfirmModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        description="Delete this role? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
    </RequirePermission>
  );
}