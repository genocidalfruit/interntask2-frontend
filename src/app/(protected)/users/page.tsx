"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { UserModal } from "@/components/users/user-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { RequirePermission } from "@/lib/require-permission";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 5;

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/users`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.data || []);
    } catch {
      setError("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleDeleteConfirm() {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await fetch(`${API_URL}/api/v1/users/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      toast.success("User deleted");
      fetchData();
    } catch {
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <RequirePermission permission="user.view">
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl page-title">Users</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Manage user accounts and permissions
          </p>
        </div>
        <PermissionGuard permission="user.manage">
          <Button
            className="gap-2"
            onClick={() => {
              setEditingUser(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </PermissionGuard>
      </div>

      <Card
        className="border-border/50 animate-fade-up"
        style={{ animationDelay: `100ms` }}
      >
        <CardHeader className="pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center justify-between p-4 mb-4 rounded-md border border-red-500/50 bg-red-500/10">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="min-h-[44px] min-w-[44px]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          )}
          {loading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <div className="flex gap-1">
                    <Skeleton className="w-7 h-7" />
                    <Skeleton className="w-7 h-7" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No users found</p>
          ) : (
            <div>
              <div className="overflow-x-auto min-h-[280px] hide-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 font-normal text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((user, i) => (
                      <tr
                        key={user._id}
                        className="border-b border-border/50 last:border-0 transition-colors duration-150 hover:bg-secondary/30 animate-fade-up"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <td className="py-3 px-4 font-medium">{user.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {user.email}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {user.roleId?.name || "-"}
                        </td>
                        <td
                          className={`py-3 px-4 text-sm ${user.status === "ACTIVE" ? "text-emerald-500" : "text-muted-foreground"}`}
                        >
                          {user.status}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingUser(user);
                                setModalOpen(true);
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(user._id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Showing {(page - 1) * perPage + 1}-
                    {Math.min(page * perPage, filtered.length)} of{" "}
                    {filtered.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <UserModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        user={editingUser}
        onSuccess={fetchData}
      />
      <ConfirmModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        description="Delete this user? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
    </RequirePermission>
  );
}
