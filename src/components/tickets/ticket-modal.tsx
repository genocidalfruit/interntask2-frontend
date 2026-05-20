"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { getApiUrl } from "@/lib/api-url";

const fieldClass =
  "flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface TicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: any;
  onSuccess: () => void;
}

export function TicketModal({ open, onOpenChange, ticket, onSuccess }: TicketModalProps) {
  const isEdit = !!ticket;
  const [loading, setLoading] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assets, setAssets] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    assetId: "",
    priority: "MEDIUM",
    status: "OPEN",
  });

  useEffect(() => {
    setAssetsLoading(true);
    fetch(`${getApiUrl()}/api/v1/assets`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setAssets(d.data || []); setAssetsLoading(false); })
      .catch(() => { setAssets([]); setAssetsLoading(false); });
  }, []);

  useEffect(() => {
    if (isEdit && ticket) {
      setFormData({
        assetId: ticket.assetId?._id || ticket.assetId || "",
        priority: ticket.priority || "MEDIUM",
        status: ticket.status || "OPEN",
      });
    } else {
      setFormData({ assetId: "", priority: "MEDIUM", status: "OPEN" });
    }
    setErrors({});
  }, [open, ticket, isEdit]);

  function validate() {
    const e: Record<string, string> = {};
    if (!formData.assetId) e.assetId = "Asset is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await fetch(`${getApiUrl()}/api/v1/tickets/${ticket._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ priority: formData.priority, status: formData.status }),
        });
      } else {
        res = await fetch(`${getApiUrl()}/api/v1/tickets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ assetId: formData.assetId, priority: formData.priority }),
        });
      }
      const data = await res.json();
      if (data.success) {
        const asset = assets.find(a => a._id === formData.assetId);
        toast.success(isEdit ? "Ticket updated" : "Ticket created", { description: asset ? asset.name : formData.assetId });
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(data.message || (isEdit ? "Update failed" : "Create failed"));
      }
    } catch {
      toast.error(isEdit ? "Update failed" : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">{isEdit ? "Edit Ticket" : "Create Ticket"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-4 py-4 pr-4">
              {!isEdit && (
                <div className="space-y-2">
                  <Label>Asset</Label>
                  {assetsLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select value={formData.assetId} onValueChange={(value) => setFormData({ ...formData, assetId: value })}>
                      <SelectTrigger className={cn(errors.assetId && "border-destructive")}>
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] custom-scrollbar">
                        {assets.map((a) => (
                          <SelectItem key={a._id} value={a._id}>
                            {a.name} ({a.assetCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.assetId && <p className="text-xs text-destructive">{errors.assetId}</p>}
                </div>
              )}
              {isEdit && (
                <div className="space-y-2">
                  <Label>Asset</Label>
                  <div className={cn(fieldClass, "cursor-default")}>
                    {ticket?.assetId?.name || "Unknown Asset"}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isEdit && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 mt-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
