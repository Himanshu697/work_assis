import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardData } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { PageShell, StatusBadge, PriorityBadge, EmptyState } from "@/components/ui-bits";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <ProtectedRoute>
      <Navbar />
      <Dashboard />
    </ProtectedRoute>
  ),
  head: () => ({ meta: [{ title: "Dashboard — Projectly" }] }),
});

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");

  useEffect(() => {
    api
      .get<DashboardData>("/api/dashboard")
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message ?? "Failed to load dashboard"));
  }, []);

  if (error) {
    return (
      <PageShell title="Dashboard">
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell title="Dashboard">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border bg-card" />
          ))}
        </div>
      </PageShell>
    );
  }

  const cards = [
    { label: "Total", value: data.total, tone: "" },
    { label: "Todo", value: data.todo, tone: "text-muted-foreground" },
    { label: "In Progress", value: data.in_progress, tone: "text-warning-foreground" },
    { label: "Done", value: data.done, tone: "text-success" },
    { label: "Overdue", value: data.overdue, tone: "text-destructive" },
  ];

  return (
    <PageShell title="Dashboard">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-lg border bg-card p-4 shadow-[var(--shadow-soft)] ${
              c.label === "Overdue" && c.value > 0 ? "border-destructive/50 bg-destructive/5" : ""
            }`}
          >
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className={`mt-1 text-3xl font-bold ${c.tone}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tasks per user (Admin only) ── */}
      {isAdmin && data.per_user && data.per_user.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Tasks per member</h2>
          <div className="overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-soft)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Member</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Total</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Todo</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">In Progress</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Done</th>
                </tr>
              </thead>
              <tbody>
                {data.per_user.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                  >
                    <td className="px-4 py-2.5 font-medium">{u.name}</td>
                    <td className="px-4 py-2.5 text-center font-semibold">{u.total}</td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">{u.todo}</td>
                    <td className="px-4 py-2.5 text-center text-warning-foreground">{u.in_progress}</td>
                    <td className="px-4 py-2.5 text-center text-success">{u.done}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Overdue tasks ── */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Overdue tasks</h2>
        {data.overdue_tasks.length === 0 ? (
          <EmptyState title="Nothing overdue 🎉" hint="You're all caught up." />
        ) : (
          <ul className="space-y-2">
            {data.overdue_tasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4"
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-sm text-destructive">Due {t.due_date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </PageShell>
  );
}