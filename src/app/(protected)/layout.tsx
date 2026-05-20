"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Ticket,
  Users,
  Shield,
  ScrollText,
  Bell,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePermission } from "@/lib/permissions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const allNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
  { href: "/assets", label: "Assets", icon: Package, permission: "asset.view" },
  { href: "/tickets", label: "Tickets", icon: Ticket, permission: "ticket.view" },
  { href: "/users", label: "Users", icon: Users, permission: "user.view" },
  { href: "/roles", label: "Roles", icon: Shield, permission: "role.manage" },
  { href: "/audit", label: "Audit Logs", icon: ScrollText, permission: "audit.view" },
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { hasPermission, user } = usePermission();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = allNavItems.filter((item) => !item.permission || hasPermission(item.permission));

  useEffect(() => {
    async function refresh() {
      try {
        await fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
      } catch {}
    }
    const interval = setInterval(refresh, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch(`${API_URL}/api/v1/notifications/me`, {
          credentials: "include",
        });
        const data = await res.json();
        const notifs = data.data || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: any) => !n.read).length);
      } catch {
        setNotifications([]);
        setUnreadCount(0);
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function markRead(id: string) {
    try {
      await fetch(`${API_URL}/api/v1/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  }

  function timeAgo(date: string) {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  async function handleSignOut() {
    try {
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-56 bg-card border-r border-border transform transition-transform duration-150 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-28 flex items-center justify-between px-4 shrink-0">
          <Link href={navItems[0]?.href ?? "/dashboard"} className="page-title text-2xl">
            Asset Manager //
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-3 rounded-md text-sm transition-all duration-150 active:scale-[0.98] min-h-[44px]",
                pathname === item.href
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground hover:translate-x-0.5"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 shrink-0 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium shrink-0">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive min-h-[44px] text-sm"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      <div className="lg:ml-56 flex flex-col min-h-screen">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            {hasPermission("notification.view") && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-destructive rounded-full animate-pulse-dot" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 max-w-[calc(100vw-1rem)] p-0">
                <div className="p-3 border-b border-border">
                  <h4 className="text-sm font-medium">Notifications</h4>
                </div>
                <ScrollArea className="max-h-72">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center">No notifications</p>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {notifications.map((n) => (
                        <button
                          key={n._id}
                          type="button"
                          onClick={() => !n.read && markRead(n._id)}
                          className={cn(
                            "w-full text-left p-3 transition-all duration-150 active:scale-[0.99]",
                            !n.read
                              ? "bg-primary/5 hover:bg-primary/10"
                              : "bg-transparent hover:bg-secondary/50"
                          )}
                        >
                          <p className={cn("text-sm", !n.read ? "font-medium" : "text-muted-foreground")}>
                            {n.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
