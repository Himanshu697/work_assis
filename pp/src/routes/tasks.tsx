import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Task, TaskStatus } from "@/lib/types";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { PageShell, StatusBadge, PriorityBadge, EmptyState } from "@/components/ui-bits";

export const Route = createFileRoute("/tasks")({
  component: () => (
    <ProtectedRoute>
      <Navbar />
      <MyTasks />
    </ProtectedRoute>
  ),
  head: () => ({ meta: [{ title: "My Tasks — Projectly" }] }),
});

function MyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get<Task[]>("/api/tasks/mine")
      .then((r) => setTasks(r.data))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const updateStatus = async (id: number, status: TaskStatus) => {
    await api.patch(`/api/tasks/${id}`, { status });
    load();
  };

  const today = new Date(new Date().toDateString());

  return (
    <PageShell title="My Tasks">
      {loading ? (
        <div className="h-40 animate-pulse rounded-lg border bg-card" />
      ) : tasks.length === 0 ? (
        <EmptyState title="No tasks assigned" hint="Tasks assigned to you will appear here." />
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => {
            const overdue = t.due_date && t.status !== "done" && new Date(t.due_date) < today;
            return (
              <li key={t.id} className={`rounded-lg border bg-card p-4 shadow-[var(--shadow-soft)] ${overdue ? "border-destructive/40" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{t.title}</p>
                    {t.description && <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.due_date ? (overdue ? <span className="font-medium text-destructive">Overdue: {t.due_date}</span> : `Due ${t.due_date}`) : "No due date"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(["todo", "in_progress", "done"] as TaskStatus[])
                    .filter((s) => s !== t.status)
                    .map((s) => (
                      <button key={s} onClick={() => updateStatus(t.id, s)} className="rounded border px-2 py-0.5 text-xs hover:bg-accent">
                        Move to {s.replace("_", " ")}
                      </button>
                    ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
