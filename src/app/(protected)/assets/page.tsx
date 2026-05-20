"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Monitor,
  Server,
  Printer,
  Smartphone,
  Laptop,
  Router,
  HardDrive,
  Package,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetModal } from "@/components/assets/asset-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { RequirePermission } from "@/lib/require-permission";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/assets`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch assets");
      const data = await res.json();
      setAssets(data.data || []);
    } catch {
      setError("Failed to load assets");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [filterOpen, filterRef]);

  const hasActiveFilters = categoryFilter || statusFilter;

  async function handleDeleteConfirm() {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await fetch(`${API_URL}/api/v1/assets/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      toast.success("Asset deleted");
      fetchData();
    } catch {
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  }

  const filtered = assets
    .filter(
      (a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.assetCode.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((a) => (categoryFilter ? a.category === categoryFilter : true))
    .filter((a) => (statusFilter ? a.status === statusFilter : true));

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  const statusColors: Record<string, string> = {
    AVAILABLE: "text-emerald-500",
    ASSIGNED: "text-primary",
    MAINTENANCE: "text-amber-500",
    RETIRED: "text-muted-foreground",
    LOST: "text-destructive",
  };

  const categoryIcons: Record<string, any> = {
    Laptop: Laptop,
    Monitor: Monitor,
    Server: Server,
    Printer: Printer,
    Mobile: Smartphone,
    Desktop: HardDrive,
    Network: Router,
  };

  return (
    <RequirePermission permission="asset.view">
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl page-title">
            Assets
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Manage your organization&apos;s assets
          </p>
        </div>
        <PermissionGuard permission="asset.create">
          <Button
            className="gap-2"
            onClick={() => {
              setEditingAsset(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </Button>
        </PermissionGuard>
      </div>

      <Card
        className="border-border/50 animate-fade-up"
        style={{ animationDelay: `100ms` }}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div
              className="relative"
              ref={(el) => {
                filterRef.current = el;
              }}
            >
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-9 w-9 shrink-0",
                  hasActiveFilters && "border-ring",
                )}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <Filter className="w-4 h-4" />
              </Button>
              {filterOpen && (
                <div className="absolute top-full right-0 mt-1 z-50 w-64 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-card shadow-lg animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">
                        Category
                      </label>
                      <Select
                        value={categoryFilter}
                        onValueChange={(value) => {
                          setCategoryFilter(value);
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All</SelectItem>
                          <SelectItem value="Laptop">Laptop</SelectItem>
                          <SelectItem value="Monitor">Monitor</SelectItem>
                          <SelectItem value="Server">Server</SelectItem>
                          <SelectItem value="Printer">Printer</SelectItem>
                          <SelectItem value="Mobile">Mobile</SelectItem>
                          <SelectItem value="Desktop">Desktop</SelectItem>
                          <SelectItem value="Network">Network</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">
                        Status
                      </label>
                      <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                          setStatusFilter(value);
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All</SelectItem>
                          <SelectItem value="AVAILABLE">Available</SelectItem>
                          <SelectItem value="ASSIGNED">Assigned</SelectItem>
                          <SelectItem value="MAINTENANCE">
                            Maintenance
                          </SelectItem>
                          <SelectItem value="RETIRED">Retired</SelectItem>
                          <SelectItem value="LOST">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => {
                          setCategoryFilter("");
                          setStatusFilter("");
                          setPage(1);
                        }}
                      >
                        Reset
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setFilterOpen(false)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                  <Skeleton className="w-8 h-8 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No assets found
            </p>
          ) : (
            <div>
              <div className="overflow-x-auto min-h-[280px] hide-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">
                        Asset
                      </th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">
                        Assigned To
                      </th>
                      <th className="text-right py-3 px-4 font-normal text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((asset, i) => (
                      <tr
                        key={asset._id}
                        className="border-b border-border/50 last:border-0 transition-colors duration-150 hover:bg-secondary/30 animate-fade-up"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                              {(() => {
                                const Icon =
                                  categoryIcons[asset.category] || Package;
                                return (
                                  <Icon className="w-4 h-4 text-muted-foreground" />
                                );
                              })()}
                            </div>
                            <div>
                              <p className="font-medium">{asset.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {asset.assetCode}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {asset.category}
                        </td>
                        <td
                          className={`py-3 px-4 text-sm ${statusColors[asset.status] || "text-muted-foreground"}`}
                        >
                          {asset.status}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {asset.assignedTo ? asset.assignedTo.name : "-"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <PermissionGuard permission="asset.update">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditingAsset(asset);
                                  setModalOpen(true);
                                }}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </PermissionGuard>
                            <PermissionGuard permission="asset.update">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(asset._id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </PermissionGuard>
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

      <AssetModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        asset={editingAsset}
        onSuccess={fetchData}
      />
      <ConfirmModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        description="Delete this asset? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
    </RequirePermission>
  );
}
