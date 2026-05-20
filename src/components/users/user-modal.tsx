"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const fieldClass =
  "flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
  onSuccess: () => void;
}

export function UserModal({ open, onOpenChange, user, onSuccess }: UserModalProps) {
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [roles, setRoles] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
  });

  useEffect(() => {
    setRolesLoading(true);
    fetch(`${API_URL}/api/v1/roles`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setRoles(d.data || []); setRolesLoading(false); })
      .catch(() => { setRoles([]); setRolesLoading(false); });
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        roleId: user.roleId?._id || "",
      });
    } else {
      setFormData({ name: "", email: "", password: "", roleId: "" });
    }
    setErrors({});
  }, [user, open]);

  function validate() {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Name is required";
    if (!formData.email.trim()) e.email = "Email is required";
    if (!user && !formData.password) e.password = "Password is required";
    if (!formData.roleId) e.roleId = "Role is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const url = user ? `${API_URL}/api/v1/users/${user._id}` : `${API_URL}/api/v1/users`;
      const method = user ? "PATCH" : "POST";
      const body: any = { name: formData.name, email: formData.email, roleId: formData.roleId };
      if (!user && formData.password) body.password = formData.password;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        if (!user) toast.success("User created", { description: formData.name });
        else toast.success("User updated", { description: formData.name });
        onSuccess();
        onOpenChange(false);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">{user ? "Edit User" : "Add User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-4 py-4 pr-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  className={cn(errors.name && "border-destructive")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  className={cn(errors.email && "border-destructive")}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              {!user && (
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    className={cn(errors.password && "border-destructive")}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
              )}
              <div className="space-y-2">
                <Label>Role</Label>
                {rolesLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select value={formData.roleId} onValueChange={(value) => setFormData({ ...formData, roleId: value })}>
                    <SelectTrigger className={cn(errors.roleId && "border-destructive")}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r._id} value={r._id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.roleId && <p className="text-xs text-destructive">{errors.roleId}</p>}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 mt-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : user ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}