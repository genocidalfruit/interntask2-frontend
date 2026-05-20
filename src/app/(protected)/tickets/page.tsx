"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Ticket,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketModal } from "@/components/tickets/ticket-modal";
import { TicketDetailModal } from "@/components/tickets/ticket-detail-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { RequirePermission } from "@/lib/require-permission";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { getApiUrl } from "@/lib/api-url";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [timeSort, setTimeSort] = useState<"asc" | "desc">("desc");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/tickets`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch tickets");
      const data = await res.json();
      setTickets(data.data || []);
    } catch {
      setError("Failed to load tickets");
      setTickets([]);
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

  const hasActiveFilters =
    statusFilter || priorityFilter || timeSort !== "desc";

  async function handleDeleteConfirm() {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await fetch(`${getApiUrl()}/api/v1/tickets/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      toast.success("Ticket deleted");
      fetchData();
    } catch {
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  }

  const filtered = tickets
    .filter(
      (t) =>
        t.ticketNo.toLowerCase().includes(search.toLowerCase()) ||
        (t.assetId &&
          t.assetId.name &&
          t.assetId.name.toLowerCase().includes(search.toLowerCase())),
    )
    .filter((t) => (statusFilter ? t.status === statusFilter : true))
    .filter((t) => (priorityFilter ? t.priority === priorityFilter : true))
    .sort((a, b) => {
      if (!timeSort) return 0;
      return timeSort === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  const priorityColors: Record<string, string> = {
    CRITICAL: "text-[#BF616A]",
    HIGH: "text-[#D08770]",
    MEDIUM: "text-[#81A1C1]",
    LOW: "text-[#8FBCBB]",
  };

  const statusColors: Record<string, string> = {
    OPEN: "text-[#EBCB8B]",
    IN_PROGRESS: "text-[#88C0D0]",
    PENDING: "text-[#B48EAD]",
    RESOLVED: "text-[#A3BE8C]",
    CLOSED: "text-[#4C566A]",
  };

  function formatStatus(status: string) {
    return status.replace("_", " ");
  }

  function timeAgo(date: string) {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <RequirePermission permission="ticket.view">
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl page-title">
            Tickets
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Service requests and issue tracking
          </p>
        </div>
        <PermissionGuard permission="ticket.create">
          <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Ticket
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
                placeholder="Search tickets..."
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
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="IN_PROGRESS">
                            In Progress
                          </SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">
                        Urgency
                      </label>
                      <Select
                        value={priorityFilter}
                        onValueChange={(value) => {
                          setPriorityFilter(value);
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="LOW">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => {
                          setStatusFilter("");
                          setPriorityFilter("");
                          setTimeSort("desc");
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
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No tickets found
            </p>
          ) : (
            <div>
              <div className="overflow-x-auto min-h-[280px] hide-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">
                        Ticket
                      </th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">
                        Urgency
                      </th>
                      <th
                        className="text-left py-3 px-4 font-normal text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => {
                          setTimeSort((prev) =>
                            prev === "asc" ? "desc" : "asc",
                          );
                          setPage(1);
                        }}
                      >
                        <span className="flex items-center gap-1">
                          Time Posted
                          {timeSort === "asc" && (
                            <ArrowUp className="w-3 h-3" />
                          )}
                          {timeSort === "desc" && (
                            <ArrowDown className="w-3 h-3" />
                          )}
                        </span>
                      </th>
                      <th className="text-right py-3 px-4 font-normal text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((ticket, i) => (
                      <tr
                        key={ticket._id}
                        className="border-b border-border/50 last:border-0 transition-colors duration-150 hover:bg-secondary/30 cursor-pointer animate-fade-up"
                        style={{ animationDelay: `${i * 50}ms` }}
                        onClick={() => setSelectedTicket(ticket._id)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                              <Ticket className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {ticket.assetId
                                  ? ticket.assetId.name
                                  : ticket.ticketNo}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {ticket.ticketNo}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs ${statusColors[ticket.status] || "text-muted-foreground"}`}
                          >
                            {formatStatus(ticket.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs ${priorityColors[ticket.priority] || "text-muted-foreground"}`}
                          >
                            {formatStatus(ticket.priority)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {timeAgo(ticket.createdAt)}
                        </td>
                        <td
                          className="py-3 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PermissionGuard permission="ticket.update">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => setEditingTicket(ticket)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(ticket._id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </PermissionGuard>
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

      <TicketModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchData}
      />
      <TicketModal
        open={!!editingTicket}
        onOpenChange={(open) => !open && setEditingTicket(null)}
        ticket={editingTicket}
        onSuccess={fetchData}
      />
      <TicketDetailModal
        ticketId={selectedTicket}
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
      />
      <ConfirmModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        description="Delete this ticket? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
    </RequirePermission>
  );
}
