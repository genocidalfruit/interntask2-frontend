"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, User, Calendar, AlertCircle, RefreshCw, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TicketModal } from "./ticket-modal";
import { PermissionGuard } from "@/components/shared/permission-guard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const priorityColors: Record<string, string> = {
  CRITICAL: "bg-destructive/10 text-destructive",
  HIGH: "bg-amber-500/10 text-amber-500",
  MEDIUM: "bg-primary/10 text-primary",
  LOW: "bg-muted text-muted-foreground",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-amber-500/10 text-amber-500",
  IN_PROGRESS: "bg-primary/10 text-primary",
  PENDING: "bg-violet-500/10 text-violet-500",
  RESOLVED: "bg-emerald-500/10 text-emerald-500",
  CLOSED: "bg-muted text-muted-foreground",
};

export function TicketDetailModal({
  ticketId,
  open,
  onOpenChange,
}: {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTicket, setEditingTicket] = useState<any>(null);

  async function fetchTicket() {
    if (!ticketId || !open) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/tickets/${ticketId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch ticket");
      const data = await res.json();
      setTicket(data.data);
    } catch {
      setError("Failed to load ticket details");
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTicket(); }, [ticketId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        {loading ? (
          <div className="space-y-4 py-4">
            <DialogHeader>
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-40 mt-2" />
            </DialogHeader>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="py-8 space-y-4">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchTicket}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : ticket ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl">{ticket.ticketNo}</DialogTitle>
                  <DialogDescription className="text-sm">
                    {ticket.assetId?.name || "Unknown Asset"}
                  </DialogDescription>
                </div>
                <PermissionGuard permission="ticket.update">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTicket(ticket)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </PermissionGuard>
              </div>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>Created by</span>
                  </div>
                  <span>{ticket.createdBy?.name || "Unknown"}</span>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>Assigned to</span>
                  </div>
                  <span>{ticket.assignedTo?.name || "Unassigned"}</span>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Created</span>
                  </div>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>SLA Deadline</span>
                  </div>
                  <span className={ticket.slaDeadline && new Date(ticket.slaDeadline) < new Date() ? "text-destructive" : ""}>
                    {ticket.slaDeadline ? new Date(ticket.slaDeadline).toLocaleDateString() : "-"}
                  </span>
                </div>

                {ticket.comments && ticket.comments.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-3">Comments ({ticket.comments.length})</h4>
                      <div className="space-y-3">
                        {ticket.comments.map((comment: any, i: number) => (
                          <div key={i} className="p-3 rounded-md bg-secondary/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">{comment.author?.name || "Unknown"}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{comment.body}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">Ticket not found</div>
        )}
        <TicketModal
          open={!!editingTicket}
          onOpenChange={(open) => !open && setEditingTicket(null)}
          ticket={editingTicket}
          onSuccess={fetchTicket}
        />
      </DialogContent>
    </Dialog>
  );
}