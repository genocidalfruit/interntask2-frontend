"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollText, User, Package, Ticket, Users, Shield, Settings, Bell, BarChart3, ChevronLeft, ChevronRight, RefreshCw, AlertCircle, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RequirePermission } from "@/lib/require-permission";

import { getApiUrl } from "@/lib/api-url";

const entityIconMap: Record<string, any> = {
  Asset: Package,
  asset: Package,
  Ticket: Ticket,
  ticket: Ticket,
  User: Users,
  user: Users,
  Role: Shield,
  role: Shield,
  Audit: ScrollText,
  audit: ScrollText,
  Notification: Bell,
  notification: Bell,
  Report: BarChart3,
  report: BarChart3,
  System: Settings,
  system: Settings,
};

function getEntityIcon(entityType: string, action: string) {
  const icon = entityIconMap[entityType] || entityIconMap[action.split(" ")[0]] || ScrollText;
  return icon;
}

function DiffView({ before, after }: { before?: Record<string, unknown>; after?: Record<string, unknown> }) {
  if (!before && !after) return null;

  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const keys = Array.from(allKeys);

  return (
    <div className="mt-2 p-3 rounded-md bg-secondary/50 text-xs space-y-1">
      {keys.map((key) => {
        const oldVal = before?.[key];
        const newVal = after?.[key];
        if (oldVal === newVal) return null;
        return (
          <div key={key} className="flex items-start gap-2 min-w-0">
            <span className="text-muted-foreground font-medium min-w-[80px] shrink-0">{key}:</span>
            <div className="flex flex-col gap-0.5 min-w-0">
              {oldVal !== undefined && oldVal !== null && (
                <span className="text-red-400 line-through break-words">{String(oldVal)}</span>
              )}
              {newVal !== undefined && newVal !== null && (
                <span className="text-emerald-400 break-words">{String(newVal)}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const perPage = 10;

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/audit-logs`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      const data = await res.json();
      setLogs(data.data || []);
    } catch {
      setError("Failed to load audit logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  function timeAgo(date: string) {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  const filtered = logs.filter((log) => {
    const actor = log.actor?.name || log.actor?.email || "";
    const haystack = `${log.action} ${log.entityType} ${actor} ${log.traceId || ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <RequirePermission permission="audit.view">
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl page-title">Audit Logs</h1>
        <p className="text-muted-foreground mt-2 text-sm">Track all system activities and changes</p>
      </div>

      <Card className="border-border/50 animate-fade-up" style={{ animationDelay: `100ms` }}>
        <CardHeader className="pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
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
              <Button variant="outline" size="sm" onClick={fetchData} className="min-h-[44px] min-w-[44px]">
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
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No audit logs found</p>
          ) : (
            <div>
              <div className="min-h-[280px]">
                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground w-8"></th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground">Action</th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground w-[100px]">Entity</th>
                      <th className="text-left py-3 px-4 font-normal text-muted-foreground w-[120px]">Actor</th>
                      <th className="text-right py-3 px-4 font-normal text-muted-foreground w-[80px]">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((log, i) => {
                      const Icon = getEntityIcon(log.entityType, log.action);
                      const isExpanded = expandedLog === log._id;
                      const hasChanges = log.before || log.after;
                      return (
                        <>
                        <tr
                          key={log._id}
                          className="border-b border-border/50 last:border-0 transition-colors duration-150 hover:bg-secondary/30 animate-fade-up cursor-pointer"
                          style={{ animationDelay: `${i * 50}ms` }}
                          onClick={() => setExpandedLog(isExpanded ? null : log._id)}
                        >
                          <td className="py-3 px-2 align-top">
                            {hasChanges && (
                              <span className="text-muted-foreground">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 align-top">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <span className="font-medium break-words">{log.action}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground whitespace-nowrap align-top">{log.entityType}</td>
                          <td className="py-3 px-4 text-muted-foreground whitespace-nowrap align-top">
                            <span className="inline-flex items-center gap-1 min-w-0">
                              <User className="w-3 h-3 shrink-0" />
                              <span className="truncate">{log.actor?.name || "Unknown"}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-muted-foreground whitespace-nowrap align-top">{timeAgo(log.createdAt)}</td>
                        </tr>
                        {isExpanded && hasChanges && (
                          <tr className="border-b border-border/50 last:border-0 bg-secondary/20">
                            <td colSpan={5} className="py-2 px-4 sm:px-12">
                              <DiffView before={log.before} after={log.after} />
                            </td>
                          </tr>
                        )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </RequirePermission>
  );
}
