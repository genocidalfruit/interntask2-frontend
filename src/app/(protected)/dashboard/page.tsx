"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  Ticket,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Clock,
  User,
  FileText,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { useTheme } from "@/lib/theme";
import { usePermission } from "@/lib/permissions";
import { getDashboardVariant } from "@/lib/role-utils";
import { TicketDetailModal } from "@/components/tickets/ticket-detail-modal";
import { RequirePermission } from "@/lib/require-permission";
import Link from "next/link";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip);

import { getApiUrl } from "@/lib/api-url";

function useNordColors(theme: string) {
  return {
    red: theme === "dark" ? "#BF616A" : "#A9444D",
    orange: theme === "dark" ? "#D08770" : "#B06B55",
    yellow: theme === "dark" ? "#EBCB8B" : "#C4A84E",
    green: theme === "dark" ? "#A3BE8C" : "#739E5E",
    teal: theme === "dark" ? "#8FBCBB" : "#6E9E9D",
    blue: theme === "dark" ? "#88C0D0" : "#5E9BAF",
    purple: theme === "dark" ? "#B48EAD" : "#967090",
    text: theme === "dark" ? "#D8DEE9" : "#4C566A",
    muted: theme === "dark" ? "#D8DEE9" : "#434C5E",
    bg: theme === "dark" ? "#2E3440" : "#ECEFF4",
    border: theme === "dark" ? "#4C566A" : "#D8DEE9",
  };
}

function formatStatus(status: string) {
  return status.replace("_", " ");
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ─── Admin Dashboard (unchanged) ─── */
function AdminDashboard({
  assets, tickets, loading, error, fetchData, nord, theme, permissions,
}: {
  assets: any[]; tickets: any[]; loading: boolean; error: string | null;
  fetchData: () => void; nord: ReturnType<typeof useNordColors>; theme: string; permissions: string[];
}) {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [recentPage, setRecentPage] = useState(0);
  const [criticalPage, setCriticalPage] = useState(0);
  const [selectedChart, setSelectedChart] = useState("status");
  const recentPerPage = 5;
  const criticalPerPage = 5;
  const canEditTickets = permissions.includes("ticket.update");

  async function updateTicketStatus(ticketId: string, newStatus: string) {
    try {
      await fetch(`${getApiUrl()}/api/v1/tickets/${ticketId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch {}
  }

  const totalAssets = assets.length;
  const openTickets = tickets.filter((t) => ["OPEN", "IN_PROGRESS"].includes(t.status)).length;
  const overdue = tickets.filter((t) => new Date(t.slaDeadline) < new Date() && !["RESOLVED", "CLOSED"].includes(t.status)).length;
  const resolved = tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status)).length;

  const stats = [
    { title: "Total Assets", value: totalAssets, icon: Package },
    { title: "Open Tickets", value: openTickets, icon: Ticket },
    { title: "Overdue", value: overdue, icon: AlertTriangle },
    { title: "Resolved", value: resolved, icon: CheckCircle },
  ];

  const statusCounts: Record<string, number> = {};
  tickets.forEach((t) => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
  const statusChartColors = [nord.red, nord.orange, nord.yellow, nord.teal, nord.green];

  const ticketStatusData = {
    labels: Object.keys(statusCounts).length ? Object.keys(statusCounts) : ["No data"],
    datasets: [{
      data: Object.keys(statusCounts).length ? Object.values(statusCounts) : [0],
      backgroundColor: Object.keys(statusCounts).length
        ? Object.keys(statusCounts).map((_, i) => statusChartColors[i % statusChartColors.length])
        : [nord.muted],
      borderWidth: 0,
    }],
  };

  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: "65%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: nord.text, font: { size: 11, family: "'Ubuntu Mono', monospace" }, boxWidth: 12, padding: 12 },
      },
      tooltip: {
        backgroundColor: nord.bg, titleColor: nord.text, bodyColor: nord.muted,
        borderColor: nord.border, borderWidth: 1, cornerRadius: 6, padding: 8,
        titleFont: { size: 11, family: "'Ubuntu Mono', monospace" },
        bodyFont: { size: 11, family: "'Ubuntu Mono', monospace" },
      },
    },
  };

  const categoryMap: Record<string, number> = {};
  assets.forEach((a) => { categoryMap[a.category] = (categoryMap[a.category] || 0) + 1; });
  const priorityCounts: Record<string, number> = {};
  tickets.forEach((t) => { priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1; });

  const categoryColors = [nord.blue, nord.teal, nord.green, nord.yellow, nord.orange, nord.red, nord.purple];
  const priorityChartColors = [nord.red, nord.orange, nord.yellow, nord.green];

  const assetsByCategory = {
    labels: Object.keys(categoryMap).length ? Object.keys(categoryMap) : ["No data"],
    datasets: [{
      data: Object.keys(categoryMap).length ? Object.values(categoryMap) : [0],
      backgroundColor: Object.keys(categoryMap).length
        ? Object.keys(categoryMap).map((_, i) => categoryColors[i % categoryColors.length])
        : [nord.muted],
      borderRadius: 4, borderSkipped: false,
    }],
  };

  const ticketsByPriority = {
    labels: Object.keys(priorityCounts).length ? Object.keys(priorityCounts) : ["No data"],
    datasets: [{
      data: Object.keys(priorityCounts).length ? Object.values(priorityCounts) : [0],
      backgroundColor: Object.keys(priorityCounts).length
        ? Object.keys(priorityCounts).map((_, i) => priorityChartColors[i % priorityChartColors.length])
        : [nord.muted],
      borderRadius: 4, borderSkipped: false,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: nord.bg, titleColor: nord.text, bodyColor: nord.muted,
        borderColor: nord.border, borderWidth: 1, cornerRadius: 6, padding: 8,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: nord.text, font: { size: 11, family: "'Ubuntu Mono', monospace" } }, border: { display: false } },
      y: { grid: { color: nord.border }, ticks: { color: nord.text, font: { size: 11, family: "'Ubuntu Mono', monospace" } }, border: { display: false } },
    },
  };

  const recentTickets = tickets.slice(0, 20);
  const criticalTickets = tickets.filter((t) => t.priority === "CRITICAL");
  const recentStart = recentPage * recentPerPage;
  const recentEnd = recentStart + recentPerPage;
  const criticalStart = criticalPage * criticalPerPage;
  const criticalEnd = criticalStart + criticalPerPage;
  const recentPageCount = Math.ceil(recentTickets.length / recentPerPage);
  const criticalPageCount = Math.ceil(criticalTickets.length / criticalPerPage);

  const priorityColors: Record<string, string> = theme === "dark"
    ? { CRITICAL: "text-[#BF616A]", HIGH: "text-[#D08770]", MEDIUM: "text-[#81A1C1]", LOW: "text-[#8FBCBB]" }
    : { CRITICAL: "text-[#A9444D]", HIGH: "text-[#B06B55]", MEDIUM: "text-[#5E81AC]", LOW: "text-[#6E9E9D]" };

  const statusColors: Record<string, string> = theme === "dark"
    ? { OPEN: "text-[#EBCB8B]", IN_PROGRESS: "text-[#88C0D0]", PENDING: "text-[#B48EAD]", RESOLVED: "text-[#A3BE8C]", CLOSED: "text-[#4C566A]" }
    : { OPEN: "text-[#C4A84E]", IN_PROGRESS: "text-[#5E9BAF]", PENDING: "text-[#967090]", RESOLVED: "text-[#739E5E]", CLOSED: "text-[#4C566A]" };

  return (
    <>
      {error && (
        <Card className="border-red-500/50 bg-red-500/10 animate-fade-up">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="min-h-[44px] min-w-[44px]">
              <RefreshCw className="w-4 h-4 mr-2" />Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border/50 animate-fade-up" style={{ animationDelay: `${i * 75}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between"><Skeleton className="w-8 h-8 rounded-md" /></div>
                  <div className="mt-3"><Skeleton className="h-8 w-16 mb-1" /><Skeleton className="h-4 w-24" /></div>
                </CardContent>
              </Card>
            ))
          : stats.map((stat, i) => (
              <Card key={stat.title} className="border-border/50 animate-fade-up" style={{ animationDelay: `${i * 75}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-md bg-secondary"><stat.icon className="w-4 h-4 text-muted-foreground" /></div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-medium">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-border/50 animate-fade-up lg:hidden" style={{ animationDelay: `300ms` }}>
          <CardHeader className="pb-5">
            <div className="flex items-center gap-3">
              <CardTitle className="text-sm">Charts</CardTitle>
              <Select value={selectedChart} onValueChange={setSelectedChart}>
                <SelectTrigger className="w-[180px] min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Ticket Status</SelectItem>
                  <SelectItem value="category">Assets by Category</SelectItem>
                  <SelectItem value="priority">Tickets by Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center justify-center">
              {loading ? <Skeleton className="w-40 h-40 rounded-full" /> : selectedChart === "status" ? (
                <Doughnut data={ticketStatusData} options={{ ...doughnutOptions, plugins: { ...doughnutOptions.plugins, legend: { display: false } } }} />
              ) : selectedChart === "category" ? (
                <Bar data={assetsByCategory} options={chartOptions} />
              ) : (
                <Bar data={ticketsByPriority} options={chartOptions} />
              )}
            </div>
            {selectedChart === "status" && !loading && (
              <div className="flex flex-wrap gap-3 mt-4">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const idx = Object.keys(statusCounts).indexOf(status);
                  const color = statusChartColors[idx % statusChartColors.length];
                  return (
                    <div key={status} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs text-muted-foreground">{formatStatus(status)} ({count})</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 animate-fade-up hidden lg:block" style={{ animationDelay: `300ms` }}>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Ticket Status</CardTitle><CardDescription className="text-xs">Distribution by current status</CardDescription></CardHeader>
          <CardContent>
            <div className="h-[240px] flex items-center justify-center">
              {loading ? <Skeleton className="w-40 h-40 rounded-full" /> : <Doughnut data={ticketStatusData} options={doughnutOptions} />}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 animate-fade-up hidden lg:block" style={{ animationDelay: `375ms` }}>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Assets by Category</CardTitle><CardDescription className="text-xs">Distribution across asset types</CardDescription></CardHeader>
          <CardContent>
            <div className="h-[240px] flex items-center justify-center">
              {loading ? <Skeleton className="w-full h-40" /> : <Bar data={assetsByCategory} options={chartOptions} />}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 animate-fade-up hidden lg:block" style={{ animationDelay: `450ms` }}>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Tickets by Priority</CardTitle><CardDescription className="text-xs">Distribution of tickets by priority level</CardDescription></CardHeader>
          <CardContent>
            <div className="h-[240px] flex items-center justify-center">
              {loading ? <Skeleton className="w-full h-40" /> : <Bar data={ticketsByPriority} options={chartOptions} />}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-border/50 animate-fade-up" style={{ animationDelay: `450ms` }}>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Recent Tickets</CardTitle><CardDescription className="text-xs">Latest ticket activity</CardDescription></CardHeader>
          <CardContent>
            <div className="min-h-[280px]">
              {loading ? (
                <div className="space-y-3 py-4">{Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4"><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-12" /></div>
                ))}</div>
              ) : recentTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No tickets found</p>
              ) : (
                <>
                  <div className="overflow-x-auto w-full hide-scrollbar">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border">
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Ticket</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Status</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Urgency</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs hidden sm:table-cell">Time</th>
                      </tr></thead>
                      <tbody>
                        {recentTickets.slice(recentStart, recentEnd).map((ticket: any, i) => (
                          <tr key={ticket._id} className="border-b border-border/50 last:border-0 transition-colors duration-150 hover:bg-secondary/30 cursor-pointer animate-fade-up" style={{ animationDelay: `${i * 50}ms` }} onClick={() => setSelectedTicket(ticket._id)}>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-secondary flex items-center justify-center shrink-0"><Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" /></div>
                                <div className="min-w-0"><p className="font-medium truncate">{ticket.assetId ? ticket.assetId.name : ticket.ticketNo}</p><p className="text-xs text-muted-foreground truncate">{ticket.ticketNo}</p></div>
                              </div>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              {canEditTickets ? (
                                <Select value={ticket.status} onValueChange={(v) => updateTicketStatus(ticket._id, v)}>
                                  <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 w-fit">
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
                              ) : (
                                <span className={`text-xs ${statusColors[ticket.status] || "text-muted-foreground"}`}>{formatStatus(ticket.status)}</span>
                              )}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4"><span className={`text-xs ${priorityColors[ticket.priority] || "text-muted-foreground"}`}>{formatStatus(ticket.priority)}</span></td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs text-muted-foreground whitespace-nowrap hidden sm:table-cell">{timeAgo(ticket.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {recentPageCount > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button variant="outline" size="sm" disabled={recentPage === 0} onClick={() => setRecentPage((p) => p - 1)}>Prev</Button>
                      <span className="text-xs text-muted-foreground">{recentPage + 1} / {recentPageCount}</span>
                      <Button variant="outline" size="sm" disabled={recentPage >= recentPageCount - 1} onClick={() => setRecentPage((p) => p + 1)}>Next</Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 animate-fade-up" style={{ animationDelay: `525ms` }}>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Critical Tickets</CardTitle><CardDescription className="text-xs">High priority items requiring attention</CardDescription></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3 py-4">{Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4"><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-12" /></div>
              ))}</div>
            ) : criticalTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No critical tickets</p>
            ) : (
              <>
                <div className="overflow-x-auto w-full hide-scrollbar">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Ticket</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Status</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Urgency</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs hidden sm:table-cell">Time</th>
                    </tr></thead>
                    <tbody>
                      {criticalTickets.slice(criticalStart, criticalEnd).map((ticket: any, i) => (
                        <tr key={ticket._id} className="border-b border-border/50 last:border-0 transition-colors duration-150 hover:bg-secondary/30 cursor-pointer animate-fade-up" style={{ animationDelay: `${i * 50}ms` }} onClick={() => setSelectedTicket(ticket._id)}>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-secondary flex items-center justify-center shrink-0"><Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" /></div>
                              <div className="min-w-0"><p className="font-medium truncate">{ticket.assetId ? ticket.assetId.name : ticket.ticketNo}</p><p className="text-xs text-muted-foreground truncate">{ticket.ticketNo}</p></div>
                            </div>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            {canEditTickets ? (
                              <Select value={ticket.status} onValueChange={(v) => updateTicketStatus(ticket._id, v)}>
                                <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 w-fit">
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
                            ) : (
                              <span className={`text-xs ${statusColors[ticket.status] || "text-muted-foreground"}`}>{formatStatus(ticket.status)}</span>
                            )}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4"><span className={`text-xs ${priorityColors[ticket.priority] || "text-muted-foreground"}`}>{formatStatus(ticket.priority)}</span></td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs text-muted-foreground whitespace-nowrap hidden sm:table-cell">{timeAgo(ticket.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {criticalPageCount > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button variant="outline" size="sm" disabled={criticalPage === 0} onClick={() => setCriticalPage((p) => p - 1)}>Prev</Button>
                    <span className="text-xs text-muted-foreground">{criticalPage + 1} / {criticalPageCount}</span>
                    <Button variant="outline" size="sm" disabled={criticalPage >= criticalPageCount - 1} onClick={() => setCriticalPage((p) => p + 1)}>Next</Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <TicketDetailModal ticketId={selectedTicket} open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)} />
    </>
  );
}

/* ─── Auditor Dashboard ─── */
function AuditorDashboard({
  assets, tickets, loading, error, fetchData, nord, theme,
}: {
  assets: any[]; tickets: any[]; loading: boolean; error: string | null;
  fetchData: () => void; nord: ReturnType<typeof useNordColors>; theme: string;
}) {
  const [selectedChart, setSelectedChart] = useState("status");
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [recentPage, setRecentPage] = useState(0);
  const recentPerPage = 5;

  const totalAssets = assets.length;
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => ["OPEN", "IN_PROGRESS"].includes(t.status)).length;
  const resolvedRate = totalTickets > 0 ? Math.round((tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status)).length / totalTickets) * 100) : 0;

  const stats = [
    { title: "Total Assets", value: totalAssets, icon: Package },
    { title: "Total Tickets", value: totalTickets, icon: Ticket },
    { title: "Open Tickets", value: openTickets, icon: AlertCircle },
    { title: "Resolved Rate", value: `${resolvedRate}%`, icon: TrendingUp },
  ];

  const statusCounts: Record<string, number> = {};
  tickets.forEach((t) => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
  const statusChartColors = [nord.red, nord.orange, nord.yellow, nord.teal, nord.green];
  const ticketStatusData = {
    labels: Object.keys(statusCounts).length ? Object.keys(statusCounts) : ["No data"],
    datasets: [{
      data: Object.keys(statusCounts).length ? Object.values(statusCounts) : [0],
      backgroundColor: Object.keys(statusCounts).length
        ? Object.keys(statusCounts).map((_, i) => statusChartColors[i % statusChartColors.length])
        : [nord.muted],
      borderWidth: 0,
    }],
  };
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: "65%",
    plugins: {
      legend: { position: "bottom" as const, labels: { color: nord.text, font: { size: 11, family: "'Ubuntu Mono', monospace" }, boxWidth: 12, padding: 12 } },
      tooltip: { backgroundColor: nord.bg, titleColor: nord.text, bodyColor: nord.muted, borderColor: nord.border, borderWidth: 1, cornerRadius: 6, padding: 8, titleFont: { size: 11, family: "'Ubuntu Mono', monospace" }, bodyFont: { size: 11, family: "'Ubuntu Mono', monospace" } },
    },
  };

  const categoryMap: Record<string, number> = {};
  assets.forEach((a) => { categoryMap[a.category] = (categoryMap[a.category] || 0) + 1; });
  const categoryColors = [nord.blue, nord.teal, nord.green, nord.yellow, nord.orange, nord.red, nord.purple];
  const assetsByCategory = {
    labels: Object.keys(categoryMap).length ? Object.keys(categoryMap) : ["No data"],
    datasets: [{
      data: Object.keys(categoryMap).length ? Object.values(categoryMap) : [0],
      backgroundColor: Object.keys(categoryMap).length
        ? Object.keys(categoryMap).map((_, i) => categoryColors[i % categoryColors.length])
        : [nord.muted],
      borderRadius: 4, borderSkipped: false,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: nord.bg, titleColor: nord.text, bodyColor: nord.muted, borderColor: nord.border, borderWidth: 1, cornerRadius: 6, padding: 8 } },
    scales: {
      x: { grid: { display: false }, ticks: { color: nord.text, font: { size: 11, family: "'Ubuntu Mono', monospace" } }, border: { display: false } },
      y: { grid: { color: nord.border }, ticks: { color: nord.text, font: { size: 11, family: "'Ubuntu Mono', monospace" } }, border: { display: false } },
    },
  };

  const recentTickets = tickets.slice(0, 20);
  const recentStart = recentPage * recentPerPage;
  const recentEnd = recentStart + recentPerPage;
  const recentPageCount = Math.ceil(recentTickets.length / recentPerPage);
  const statusColors: Record<string, string> = theme === "dark"
    ? { OPEN: "text-[#EBCB8B]", IN_PROGRESS: "text-[#88C0D0]", PENDING: "text-[#B48EAD]", RESOLVED: "text-[#A3BE8C]", CLOSED: "text-[#4C566A]" }
    : { OPEN: "text-[#C4A84E]", IN_PROGRESS: "text-[#5E9BAF]", PENDING: "text-[#967090]", RESOLVED: "text-[#739E5E]", CLOSED: "text-[#4C566A]" };

  return (
    <>
      {error && (
        <Card className="border-red-500/50 bg-red-500/10 animate-fade-up">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-sm text-red-500">{error}</p></div>
            <Button variant="outline" size="sm" onClick={fetchData} className="min-h-[44px] min-w-[44px]"><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border/50 animate-fade-up" style={{ animationDelay: `${i * 75}ms` }}>
                <CardContent className="p-5"><div className="flex items-start justify-between"><Skeleton className="w-8 h-8 rounded-md" /></div><div className="mt-3"><Skeleton className="h-8 w-16 mb-1" /><Skeleton className="h-4 w-24" /></div></CardContent>
              </Card>
            ))
          : stats.map((stat, i) => (
              <Card key={stat.title} className="border-border/50 animate-fade-up" style={{ animationDelay: `${i * 75}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between"><div className="p-2 rounded-md bg-secondary"><stat.icon className="w-4 h-4 text-muted-foreground" /></div></div>
                  <div className="mt-3"><p className="text-2xl font-medium">{stat.value}</p><p className="text-xs text-muted-foreground mt-0.5">{stat.title}</p></div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/50 animate-fade-up lg:hidden" style={{ animationDelay: `300ms` }}>
          <CardHeader className="pb-5">
            <div className="flex items-center gap-3">
              <CardTitle className="text-sm">Charts</CardTitle>
              <Select value={selectedChart} onValueChange={setSelectedChart}>
                <SelectTrigger className="w-[180px] min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="status">Ticket Status</SelectItem><SelectItem value="category">Assets by Category</SelectItem></SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center justify-center">
              {loading ? <Skeleton className="w-40 h-40 rounded-full" /> : selectedChart === "status" ? (
                <Doughnut data={ticketStatusData} options={{ ...doughnutOptions, plugins: { ...doughnutOptions.plugins, legend: { display: false } } }} />
              ) : (
                <Bar data={assetsByCategory} options={chartOptions} />
              )}
            </div>
            {selectedChart === "status" && !loading && (
              <div className="flex flex-wrap gap-3 mt-4">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const idx = Object.keys(statusCounts).indexOf(status);
                  const color = statusChartColors[idx % statusChartColors.length];
                  return (<div key={status} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} /><span className="text-xs text-muted-foreground">{formatStatus(status)} ({count})</span></div>);
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 animate-fade-up hidden lg:block" style={{ animationDelay: `300ms` }}>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Ticket Status</CardTitle><CardDescription className="text-xs">Distribution by current status</CardDescription></CardHeader>
          <CardContent>
            <div className="h-[240px] flex items-center justify-center">
              {loading ? <Skeleton className="w-40 h-40 rounded-full" /> : <Doughnut data={ticketStatusData} options={doughnutOptions} />}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 animate-fade-up hidden lg:block" style={{ animationDelay: `375ms` }}>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Assets by Category</CardTitle><CardDescription className="text-xs">Distribution across asset types</CardDescription></CardHeader>
          <CardContent>
            <div className="h-[240px] flex items-center justify-center">
              {loading ? <Skeleton className="w-full h-40" /> : <Bar data={assetsByCategory} options={chartOptions} />}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 animate-fade-up" style={{ animationDelay: `450ms` }}>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Recent Activity</CardTitle><CardDescription className="text-xs">All recent tickets across the system</CardDescription></CardHeader>
        <CardContent>
          <div className="min-h-[280px]">
            {loading ? (
              <div className="space-y-3 py-4">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="flex items-center gap-4"><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-12" /></div>))}</div>
            ) : recentTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No tickets found</p>
            ) : (
              <>
                <div className="overflow-x-auto w-full hide-scrollbar">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Ticket</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Status</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Priority</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs hidden sm:table-cell">Time</th>
                    </tr></thead>
                    <tbody>
                      {recentTickets.slice(recentStart, recentEnd).map((ticket: any, i) => (
                        <tr key={ticket._id} className="border-b border-border/50 last:border-0 transition-colors duration-150 hover:bg-secondary/30 cursor-pointer animate-fade-up" style={{ animationDelay: `${i * 50}ms` }} onClick={() => setSelectedTicket(ticket._id)}>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-secondary flex items-center justify-center shrink-0"><Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" /></div>
                              <div className="min-w-0"><p className="font-medium truncate">{ticket.assetId ? ticket.assetId.name : ticket.ticketNo}</p><p className="text-xs text-muted-foreground truncate">{ticket.ticketNo}</p></div>
                            </div>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4"><span className={`text-xs ${statusColors[ticket.status] || "text-muted-foreground"}`}>{formatStatus(ticket.status)}</span></td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs text-muted-foreground">{ticket.priority}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs text-muted-foreground whitespace-nowrap hidden sm:table-cell">{timeAgo(ticket.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {recentPageCount > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button variant="outline" size="sm" disabled={recentPage === 0} onClick={() => setRecentPage((p) => p - 1)}>Prev</Button>
                    <span className="text-xs text-muted-foreground">{recentPage + 1} / {recentPageCount}</span>
                    <Button variant="outline" size="sm" disabled={recentPage >= recentPageCount - 1} onClick={() => setRecentPage((p) => p + 1)}>Next</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <TicketDetailModal ticketId={selectedTicket} open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)} />
    </>
  );
}

/* ─── Technician Dashboard ─── */
function TechnicianDashboard({
  tickets, loading, error, fetchData, nord, theme, userId, permissions,
}: {
  tickets: any[]; loading: boolean; error: string | null;
  fetchData: () => void; nord: ReturnType<typeof useNordColors>; theme: string; userId: string; permissions: string[];
}) {
  const [selectedChart, setSelectedChart] = useState("status");
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const perPage = 5;
  const canEditTickets = permissions.includes("ticket.update");

  async function updateTicketStatus(ticketId: string, newStatus: string) {
    try {
      await fetch(`${getApiUrl()}/api/v1/tickets/${ticketId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch {}
  }

  const assignedTickets = tickets.filter((t) => t.assignedTo && (t.assignedTo._id === userId || t.assignedTo === userId));
  const openAssigned = assignedTickets.filter((t) => ["OPEN", "IN_PROGRESS"].includes(t.status)).length;
  const overdueAssigned = assignedTickets.filter((t) => new Date(t.slaDeadline) < new Date() && !["RESOLVED", "CLOSED"].includes(t.status)).length;
  const resolvedThisWeek = assignedTickets.filter((t) => {
    if (!t.resolvedAt) return false;
    const diff = (Date.now() - new Date(t.resolvedAt).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  const stats = [
    { title: "Assigned to Me", value: assignedTickets.length, icon: User },
    { title: "Open / In Progress", value: openAssigned, icon: Clock },
    { title: "Overdue SLA", value: overdueAssigned, icon: AlertTriangle },
    { title: "Resolved (7d)", value: resolvedThisWeek, icon: CheckCircle },
  ];

  const statusCounts: Record<string, number> = {};
  assignedTickets.forEach((t) => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
  const statusChartColors = [nord.red, nord.orange, nord.yellow, nord.teal, nord.green];
  const ticketStatusData = {
    labels: Object.keys(statusCounts).length ? Object.keys(statusCounts) : ["No data"],
    datasets: [{
      data: Object.keys(statusCounts).length ? Object.values(statusCounts) : [0],
      backgroundColor: Object.keys(statusCounts).length
        ? Object.keys(statusCounts).map((_, i) => statusChartColors[i % statusChartColors.length])
        : [nord.muted],
      borderWidth: 0,
    }],
  };
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: "65%",
    plugins: {
      legend: { position: "bottom" as const, labels: { color: nord.text, font: { size: 11, family: "'Ubuntu Mono', monospace" }, boxWidth: 12, padding: 12 } },
      tooltip: { backgroundColor: nord.bg, titleColor: nord.text, bodyColor: nord.muted, borderColor: nord.border, borderWidth: 1, cornerRadius: 6, padding: 8, titleFont: { size: 11, family: "'Ubuntu Mono', monospace" }, bodyFont: { size: 11, family: "'Ubuntu Mono', monospace" } },
    },
  };

  const priorityCounts: Record<string, number> = {};
  assignedTickets.forEach((t) => { priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1; });
  const priorityChartColors = [nord.red, nord.orange, nord.yellow, nord.green];
  const ticketsByPriority = {
    labels: Object.keys(priorityCounts).length ? Object.keys(priorityCounts) : ["No data"],
    datasets: [{
      data: Object.keys(priorityCounts).length ? Object.values(priorityCounts) : [0],
      backgroundColor: Object.keys(priorityCounts).length
        ? Object.keys(priorityCounts).map((_, i) => priorityChartColors[i % priorityChartColors.length])
        : [nord.muted],
      borderRadius: 4, borderSkipped: false,
    }],
  };
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: nord.bg, titleColor: nord.text, bodyColor: nord.muted, borderColor: nord.border, borderWidth: 1, cornerRadius: 6, padding: 8 } },
    scales: {
      x: { grid: { display: false }, ticks: { color: nord.text, font: { size: 11, family: "'Ubuntu Mono', monospace" } }, border: { display: false } },
      y: { grid: { color: nord.border }, ticks: { color: nord.text, font: { size: 11, family: "'Ubuntu Mono', monospace" } }, border: { display: false } },
    },
  };

  const start = page * perPage;
  const end = start + perPage;
  const pageCount = Math.ceil(assignedTickets.length / perPage);

  const statusColors: Record<string, string> = theme === "dark"
    ? { OPEN: "text-[#EBCB8B]", IN_PROGRESS: "text-[#88C0D0]", PENDING: "text-[#B48EAD]", RESOLVED: "text-[#A3BE8C]", CLOSED: "text-[#4C566A]" }
    : { OPEN: "text-[#C4A84E]", IN_PROGRESS: "text-[#5E9BAF]", PENDING: "text-[#967090]", RESOLVED: "text-[#739E5E]", CLOSED: "text-[#4C566A]" };
  const priorityColors: Record<string, string> = theme === "dark"
    ? { CRITICAL: "text-[#BF616A]", HIGH: "text-[#D08770]", MEDIUM: "text-[#81A1C1]", LOW: "text-[#8FBCBB]" }
    : { CRITICAL: "text-[#A9444D]", HIGH: "text-[#B06B55]", MEDIUM: "text-[#5E81AC]", LOW: "text-[#6E9E9D]" };

  return (
    <>
      {error && (
        <Card className="border-red-500/50 bg-red-500/10 animate-fade-up">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-sm text-red-500">{error}</p></div>
            <Button variant="outline" size="sm" onClick={fetchData} className="min-h-[44px] min-w-[44px]"><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border/50 animate-fade-up" style={{ animationDelay: `${i * 75}ms` }}>
                <CardContent className="p-5"><div className="flex items-start justify-between"><Skeleton className="w-8 h-8 rounded-md" /></div><div className="mt-3"><Skeleton className="h-8 w-16 mb-1" /><Skeleton className="h-4 w-24" /></div></CardContent>
              </Card>
            ))
          : stats.map((stat, i) => (
              <Card key={stat.title} className="border-border/50 animate-fade-up" style={{ animationDelay: `${i * 75}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between"><div className="p-2 rounded-md bg-secondary"><stat.icon className="w-4 h-4 text-muted-foreground" /></div></div>
                  <div className="mt-3"><p className="text-2xl font-medium">{stat.value}</p><p className="text-xs text-muted-foreground mt-0.5">{stat.title}</p></div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/50 animate-fade-up lg:hidden" style={{ animationDelay: `300ms` }}>
          <CardHeader className="pb-5">
            <div className="flex items-center gap-3">
              <CardTitle className="text-sm">Charts</CardTitle>
              <Select value={selectedChart} onValueChange={setSelectedChart}>
                <SelectTrigger className="w-[180px] min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="status">Status</SelectItem><SelectItem value="priority">Priority</SelectItem></SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center justify-center">
              {loading ? <Skeleton className="w-40 h-40 rounded-full" /> : selectedChart === "status" ? (
                <Doughnut data={ticketStatusData} options={{ ...doughnutOptions, plugins: { ...doughnutOptions.plugins, legend: { display: false } } }} />
              ) : (
                <Bar data={ticketsByPriority} options={chartOptions} />
              )}
            </div>
            {selectedChart === "status" && !loading && (
              <div className="flex flex-wrap gap-3 mt-4">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const idx = Object.keys(statusCounts).indexOf(status);
                  const color = statusChartColors[idx % statusChartColors.length];
                  return (<div key={status} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} /><span className="text-xs text-muted-foreground">{formatStatus(status)} ({count})</span></div>);
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 animate-fade-up hidden lg:block" style={{ animationDelay: `300ms` }}>
          <CardHeader className="pb-3"><CardTitle className="text-sm">My Tickets by Status</CardTitle><CardDescription className="text-xs">Your assigned ticket distribution</CardDescription></CardHeader>
          <CardContent>
            <div className="h-[240px] flex items-center justify-center">
              {loading ? <Skeleton className="w-40 h-40 rounded-full" /> : <Doughnut data={ticketStatusData} options={doughnutOptions} />}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 animate-fade-up hidden lg:block" style={{ animationDelay: `375ms` }}>
          <CardHeader className="pb-3"><CardTitle className="text-sm">My Tickets by Priority</CardTitle><CardDescription className="text-xs">Priority breakdown of your workload</CardDescription></CardHeader>
          <CardContent>
            <div className="h-[240px] flex items-center justify-center">
              {loading ? <Skeleton className="w-full h-40" /> : <Bar data={ticketsByPriority} options={chartOptions} />}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 animate-fade-up" style={{ animationDelay: `450ms` }}>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Assigned to Me</CardTitle><CardDescription className="text-xs">Tickets you are responsible for</CardDescription></CardHeader>
        <CardContent>
          <div className="min-h-[280px]">
            {loading ? (
              <div className="space-y-3 py-4">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="flex items-center gap-4"><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-12" /></div>))}</div>
            ) : assignedTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No tickets assigned to you</p>
            ) : (
              <>
                <div className="overflow-x-auto w-full hide-scrollbar">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Ticket</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Status</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Priority</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs hidden sm:table-cell">SLA</th>
                    </tr></thead>
                    <tbody>
                      {assignedTickets.slice(start, end).map((ticket: any, i) => {
                        const isOverdue = new Date(ticket.slaDeadline) < new Date() && !["RESOLVED", "CLOSED"].includes(ticket.status);
                        return (
                          <tr key={ticket._id} className="border-b border-border/50 last:border-0 transition-colors duration-150 hover:bg-secondary/30 cursor-pointer animate-fade-up" style={{ animationDelay: `${i * 50}ms` }} onClick={() => setSelectedTicket(ticket._id)}>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-secondary flex items-center justify-center shrink-0"><Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" /></div>
                                <div className="min-w-0"><p className="font-medium truncate">{ticket.assetId ? ticket.assetId.name : ticket.ticketNo}</p><p className="text-xs text-muted-foreground truncate">{ticket.ticketNo}</p></div>
                              </div>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                              {canEditTickets ? (
                                <Select value={ticket.status} onValueChange={(v) => updateTicketStatus(ticket._id, v)}>
                                  <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 w-fit">
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
                              ) : (
                                <span className={`text-xs ${statusColors[ticket.status] || "text-muted-foreground"}`}>{formatStatus(ticket.status)}</span>
                              )}
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4"><span className={`text-xs ${priorityColors[ticket.priority] || "text-muted-foreground"}`}>{ticket.priority}</span></td>
                            <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs whitespace-nowrap hidden sm:table-cell">
                              <span className={isOverdue ? "text-red-500" : "text-muted-foreground"}>{timeAgo(ticket.slaDeadline)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {pageCount > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                    <span className="text-xs text-muted-foreground">{page + 1} / {pageCount}</span>
                    <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <TicketDetailModal ticketId={selectedTicket} open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)} />
    </>
  );
}

/* ─── Employee Dashboard ─── */
function EmployeeDashboard({
  assets, tickets, loading, error, fetchData, nord, theme, userId,
}: {
  assets: any[]; tickets: any[]; loading: boolean; error: string | null;
  fetchData: () => void; nord: ReturnType<typeof useNordColors>; theme: string; userId: string;
}) {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  const myTickets = tickets.filter((t) => t.createdBy && (t.createdBy._id === userId || t.createdBy === userId));
  const myAssets = assets.filter((a) => a.assignedTo && (a.assignedTo._id === userId || a.assignedTo === userId));
  const myOpen = myTickets.filter((t) => ["OPEN", "IN_PROGRESS"].includes(t.status)).length;
  const myResolved = myTickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status)).length;

  const stats = [
    { title: "My Tickets", value: myTickets.length, icon: FileText },
    { title: "Open", value: myOpen, icon: Clock },
    { title: "Resolved", value: myResolved, icon: CheckCircle },
    { title: "My Assets", value: myAssets.length, icon: Package },
  ];

  const statusColors: Record<string, string> = theme === "dark"
    ? { OPEN: "text-[#EBCB8B]", IN_PROGRESS: "text-[#88C0D0]", PENDING: "text-[#B48EAD]", RESOLVED: "text-[#A3BE8C]", CLOSED: "text-[#4C566A]" }
    : { OPEN: "text-[#C4A84E]", IN_PROGRESS: "text-[#5E9BAF]", PENDING: "text-[#967090]", RESOLVED: "text-[#739E5E]", CLOSED: "text-[#4C566A]" };
  const priorityColors: Record<string, string> = theme === "dark"
    ? { CRITICAL: "text-[#BF616A]", HIGH: "text-[#D08770]", MEDIUM: "text-[#81A1C1]", LOW: "text-[#8FBCBB]" }
    : { CRITICAL: "text-[#A9444D]", HIGH: "text-[#B06B55]", MEDIUM: "text-[#5E81AC]", LOW: "text-[#6E9E9D]" };

  return (
    <>
      {error && (
        <Card className="border-red-500/50 bg-red-500/10 animate-fade-up">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-sm text-red-500">{error}</p></div>
            <Button variant="outline" size="sm" onClick={fetchData} className="min-h-[44px] min-w-[44px]"><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border/50 animate-fade-up" style={{ animationDelay: `${i * 75}ms` }}>
                <CardContent className="p-5"><div className="flex items-start justify-between"><Skeleton className="w-8 h-8 rounded-md" /></div><div className="mt-3"><Skeleton className="h-8 w-16 mb-1" /><Skeleton className="h-4 w-24" /></div></CardContent>
              </Card>
            ))
          : stats.map((stat, i) => (
              <Card key={stat.title} className="border-border/50 animate-fade-up" style={{ animationDelay: `${i * 75}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between"><div className="p-2 rounded-md bg-secondary"><stat.icon className="w-4 h-4 text-muted-foreground" /></div></div>
                  <div className="mt-3"><p className="text-2xl font-medium">{stat.value}</p><p className="text-xs text-muted-foreground mt-0.5">{stat.title}</p></div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-border/50 animate-fade-up" style={{ animationDelay: `300ms` }}>
          <CardHeader className="pb-3"><CardTitle className="text-sm">My Tickets</CardTitle><CardDescription className="text-xs">Tickets you have created</CardDescription></CardHeader>
          <CardContent>
            <div className="min-h-[280px]">
              {loading ? (
                <div className="space-y-3 py-4">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="flex items-center gap-4"><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-12" /></div>))}</div>
              ) : myTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">You have not created any tickets</p>
              ) : (
                <div className="overflow-x-auto w-full hide-scrollbar">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Ticket</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Status</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Priority</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs hidden sm:table-cell">Time</th>
                    </tr></thead>
                    <tbody>
                      {myTickets.map((ticket: any, i) => (
                        <tr key={ticket._id} className="border-b border-border/50 last:border-0 transition-colors duration-150 hover:bg-secondary/30 cursor-pointer animate-fade-up" style={{ animationDelay: `${i * 50}ms` }} onClick={() => setSelectedTicket(ticket._id)}>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-secondary flex items-center justify-center shrink-0"><Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" /></div>
                              <div className="min-w-0"><p className="font-medium truncate">{ticket.assetId ? ticket.assetId.name : ticket.ticketNo}</p><p className="text-xs text-muted-foreground truncate">{ticket.ticketNo}</p></div>
                            </div>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4"><span className={`text-xs ${statusColors[ticket.status] || "text-muted-foreground"}`}>{formatStatus(ticket.status)}</span></td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4"><span className={`text-xs ${priorityColors[ticket.priority] || "text-muted-foreground"}`}>{ticket.priority}</span></td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs text-muted-foreground whitespace-nowrap hidden sm:table-cell">{timeAgo(ticket.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 animate-fade-up" style={{ animationDelay: `375ms` }}>
          <CardHeader className="pb-3"><CardTitle className="text-sm">My Assets</CardTitle><CardDescription className="text-xs">Assets assigned to you</CardDescription></CardHeader>
          <CardContent>
            <div className="min-h-[280px]">
              {loading ? (
                <div className="space-y-3 py-4">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="flex items-center gap-4"><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-12" /></div>))}</div>
              ) : myAssets.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No assets assigned to you</p>
              ) : (
                <div className="overflow-x-auto w-full hide-scrollbar">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Asset</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Category</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-normal text-muted-foreground whitespace-nowrap text-xs">Status</th>
                    </tr></thead>
                    <tbody>
                      {myAssets.map((asset: any, i) => (
                        <tr key={asset._id} className="border-b border-border/50 last:border-0 transition-colors duration-150 hover:bg-secondary/30 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-secondary flex items-center justify-center shrink-0"><Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" /></div>
                              <div className="min-w-0"><p className="font-medium truncate">{asset.name}</p><p className="text-xs text-muted-foreground truncate">{asset.assetCode}</p></div>
                            </div>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs text-muted-foreground">{asset.category}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs text-muted-foreground">{asset.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <TicketDetailModal ticketId={selectedTicket} open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)} />
    </>
  );
}

/* ─── Main Page ─── */
export default function DashboardPage() {
  const { theme } = useTheme();
  const { user, permissions, loading: permissionsLoading, authenticated } = usePermission();
  const [assets, setAssets] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const variant = getDashboardVariant(permissions, user?.roleName);

  const fetchData = useCallback(async () => {
    if (permissionsLoading || !authenticated) return;
    setLoading(true);
    setError(null);
    try {
      const params = variant === "technician" ? "?scope=assigned" : variant === "employee" ? "?scope=mine" : "";
      const [assetsRes, ticketsRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/v1/assets${variant === "employee" ? "?scope=assigned" : ""}`, { credentials: "include" }),
        fetch(`${getApiUrl()}/api/v1/tickets${params}`, { credentials: "include" }),
      ]);
      if (!assetsRes.ok || !ticketsRes.ok) throw new Error("Failed to fetch data");
      const assetsData = await assetsRes.json();
      const ticketsData = await ticketsRes.json();
      setAssets(assetsData.data || []);
      setTickets(ticketsData.data || []);
    } catch {
      setError("Failed to load dashboard data");
      setAssets([]);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [authenticated, permissionsLoading, variant]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const nord = useNordColors(theme);

  const dashboardProps = { assets, tickets, loading, error, fetchData, nord, theme, userId: user?.id ?? "", permissions };

  return (
    <RequirePermission permission="dashboard.view">
    <div className="dashboard-page space-y-8 overflow-x-clip w-full">
      <div className="animate-fade-up">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl page-title">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {variant === "admin" && "Overview of your asset and ticket management"}
          {variant === "auditor" && "System-wide overview and compliance summary"}
          {variant === "technician" && "Your assigned workload and SLA status"}
          {variant === "employee" && "Your tickets and assigned assets"}
        </p>
      </div>

      {variant === "admin" && <AdminDashboard {...dashboardProps} />}
      {variant === "auditor" && <AuditorDashboard {...dashboardProps} />}
      {variant === "technician" && <TechnicianDashboard {...dashboardProps} />}
      {variant === "employee" && <EmployeeDashboard {...dashboardProps} />}
    </div>
    </RequirePermission>
  );
}
