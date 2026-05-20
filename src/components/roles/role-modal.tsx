"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Shield,
  Settings,
  Users,
  Wrench,
  Eye,
  Key,
  Bell,
  FileText,
  BarChart3,
  Database,
  Cloud,
  Lock,
  Globe,
  Mail,
  Calendar,
  CheckSquare,
  Zap,
  Star,
  Heart,
  Home,
  Briefcase,
  Camera,
  Music,
  BookOpen,
  Map,
  Phone,
  MessageSquare,
  Share2,
  Check,
} from "lucide-react";

import { getApiUrl } from "@/lib/api-url";

const allPermissions = [
  "asset.view",
  "asset.create",
  "asset.update",
  "asset.assign",
  "asset.retire",
  "ticket.view",
  "ticket.create",
  "ticket.assign",
  "ticket.update",
  "ticket.resolve",
  "ticket.close",
  "user.view",
  "user.manage",
  "role.manage",
  "dashboard.view",
  "report.view",
  "audit.view",
  "notification.view",
];

const iconOptions = [
  { name: "Shield", icon: Shield },
  { name: "Settings", icon: Settings },
  { name: "Users", icon: Users },
  { name: "Wrench", icon: Wrench },
  { name: "Eye", icon: Eye },
  { name: "Key", icon: Key },
  { name: "Bell", icon: Bell },
  { name: "FileText", icon: FileText },
  { name: "BarChart3", icon: BarChart3 },
  { name: "Database", icon: Database },
  { name: "Cloud", icon: Cloud },
  { name: "Lock", icon: Lock },
  { name: "Globe", icon: Globe },
  { name: "Mail", icon: Mail },
  { name: "Calendar", icon: Calendar },
  { name: "CheckSquare", icon: CheckSquare },
  { name: "Zap", icon: Zap },
  { name: "Star", icon: Star },
  { name: "Heart", icon: Heart },
  { name: "Home", icon: Home },
  { name: "Briefcase", icon: Briefcase },
  { name: "Camera", icon: Camera },
  { name: "Music", icon: Music },
  { name: "BookOpen", icon: BookOpen },
  { name: "Map", icon: Map },
  { name: "Phone", icon: Phone },
  { name: "MessageSquare", icon: MessageSquare },
  { name: "Share2", icon: Share2 },
];

interface RoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: any;
  onSuccess: () => void;
}

export function RoleModal({
  open,
  onOpenChange,
  role,
  onSuccess,
}: RoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    icon: "Shield",
    permissions: [] as string[],
  });

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || "",
        icon: role.icon || "Shield",
        permissions: role.permissions || [],
      });
    } else {
      setFormData({ name: "", icon: "Shield", permissions: [] });
    }
    setErrors({});
  }, [role, open]);

  function validate() {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Role name is required";
    if (formData.permissions.length === 0)
      e.permissions = "At least one permission is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function togglePermission(perm: string) {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const url = role
        ? `${getApiUrl()}/api/v1/roles/${role._id}`
        : `${getApiUrl()}/api/v1/roles`;
      const method = role ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        if (!role)
          toast.success("Role created", { description: formData.name });
        else toast.success("Role updated", { description: formData.name });
        onSuccess();
        onOpenChange(false);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  const SelectedIcon =
    iconOptions.find((i) => i.name === formData.icon)?.icon || Shield;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {role ? "Edit Role" : "Create Role"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 modal-scroll">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input
                  className={cn(errors.name && "border-destructive")}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                  {iconOptions.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: name })}
                      className={cn(
                        "flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md border transition-colors",
                        formData.icon === name
                          ? "border-ring bg-secondary"
                          : "border-border hover:bg-secondary/50",
                      )}
                      title={name}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <SelectedIcon className="w-4 h-4" />
                  <span>Selected: {formData.icon}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                  {allPermissions.map((perm) => {
                    const isChecked = formData.permissions.includes(perm);
                    return (
                      <button
                        key={perm}
                        type="button"
                        onClick={() => togglePermission(perm)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-3 rounded-md border text-sm transition-colors min-h-[44px]",
                          isChecked
                            ? "border-ring bg-secondary text-foreground"
                            : "border-border bg-transparent text-muted-foreground hover:bg-secondary/50",
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center w-4 h-4 rounded border transition-colors shrink-0",
                            isChecked
                              ? "bg-primary border-primary"
                              : "border-border",
                          )}
                        >
                          {isChecked && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="truncate text-left">{perm}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.permissions && (
                  <p className="text-xs text-destructive">
                    {errors.permissions}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : role ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
