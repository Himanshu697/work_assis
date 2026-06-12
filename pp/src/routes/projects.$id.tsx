import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { Project, Task, TaskStatus, TaskPriority, User } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import {
  PageShell,
  StatusBadge,
  PriorityBadge,
  EmptyState,
  Field,
  inputClass,
  btnPrimary,
  btnSecondary,
  btnDestructive,
} from "@/components/ui-bits";

export const Route = createFileRoute("/projects/$id")({
  component: () => (
    <ProtectedRoute>
      <Navbar />
      <ProjectDetail />
    </ProtectedRoute>
  ),
});

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];

function ProjectDetail() {
  const { id } = useParams({ from: "/projects/$id" });
  const projectId = Number(id);
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, m, t] = await Promise.all([
        api.get<Project>(`/api/projects/${projectId}`),
        api.get<User[]>(`/api/projects/${projectId}/members`),
        api.get<Task[]>(`/api/projects/${projectId}/tasks`),
      ]);
      setProject(p.data);
      setMembers(m.data);
      setTasks(t.data);
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Failed to load project");
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (isAdmin) api.get<User[]>("/api/users").then((r) => setAllUsers(r.data)).catch(() => {});
  }, [isAdmin]);

  const updateStatus = async (taskId: number, status: TaskStatus) => {
    await api.patch(`/api/tasks/${taskId}`, { status });
    load();
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm("Delete task?")) return;
    await api.delete(`/api/tasks/${taskId}`);
    load();
  };

  const addMember = async (userId: number) => {
    await api.post(`/api/projects/${projectId}/members`, { userId });
    load();
  };

  const removeMember = async (userId: number) => {
    await api.delete(`/api/projects/${projectId}/members/${userId}`);
    load();
  };

  if (error) {
    return (
      <PageShell title="Project">
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        <Link to="/projects" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to projects</Link>
      </PageShell>
    );
  }

  if (!project) return <PageShell title="Loading..."><div className="h-40 animate-pulse rounded-lg border bg-card" /></PageShell>;

  const nonMembers = allUsers.filter((u) => !members.some((m) => m.id === u.id));

  return (
    <PageShell
      title={project.name}
      action={
        <button onClick={() => setShowTaskForm((v) => !v)} className={btnPrimary}>
          {showTaskForm ? "Cancel" : "+ New task"}
        </button>
      }
    >
      <Link to="/projects" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">← All projects</Link>

      {project.description && <p className="mb-2 text-muted-foreground">{project.description}</p>}
      {project.deadline && <p className="mb-6 text-sm text-muted-foreground">Deadline: {project.deadline}</p>}

      <section className="mb-8 rounded-lg border bg-card p-5 shadow-[var(--shadow-soft)]">
        <h2 className="mb-3 font-semibold">Members ({members.length})</h2>
        <ul className="space-y-1.5">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent">
              <span>
                {m.name} <span className="text-xs text-muted-foreground">· {m.email}</span>
                {m.role === "admin" && <span className="ml-2 rounded bg-admin px-1.5 py-0.5 text-[10px] font-semibold text-admin-foreground">ADMIN</span>}
              </span>
              {isAdmin && m.id !== user?.id && (
                <button onClick={() => removeMember(m.id)} className="text-xs text-destructive hover:underline">
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        {isAdmin && nonMembers.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <p className="mb-2 text-sm font-medium">Add member</p>
            <div className="flex flex-wrap gap-2">
              {nonMembers.map((u) => (
                <button key={u.id} onClick={() => addMember(u.id)} className={btnSecondary}>
                  + {u.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {showTaskForm && (
        <NewTaskForm
          projectId={projectId}
          members={members}
          isAdmin={isAdmin}
          currentUserId={user!.id}
          onCreated={() => { setShowTaskForm(false); load(); }}
        />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {STATUSES.map((s) => (
          <div key={s} className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 flex items-center justify-between font-semibold">
              <StatusBadge status={s} />
              <span className="text-sm text-muted-foreground">{tasks.filter((t) => t.status === s).length}</span>
            </h3>
            <div className="space-y-2">
              {tasks.filter((t) => t.status === s).length === 0 && (
                <p className="text-sm text-muted-foreground">No tasks</p>
              )}
              {tasks
                .filter((t) => t.status === s)
                .map((t) => {
                  const overdue = t.due_date && t.status !== "done" && new Date(t.due_date) < new Date(new Date().toDateString());
                  const canUpdate = isAdmin || t.assigned_to === user?.id;
                  return (
                    <div
                      key={t.id}
                      className={`rounded-md border bg-background p-3 shadow-[var(--shadow-soft)] ${overdue ? "border-destructive/50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{t.title}</p>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      {t.description && <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>}
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t.assigned_to_name ?? "Unassigned"}</span>
                        {t.due_date && (
                          <span className={overdue ? "font-medium text-destructive" : ""}>
                            {overdue ? "Overdue: " : "Due "}{t.due_date}
                          </span>
                        )}
                      </div>
                      {canUpdate && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {STATUSES.filter((x) => x !== t.status).map((x) => (
                            <button
                              key={x}
                              onClick={() => updateStatus(t.id, x)}
                              className="rounded border px-2 py-0.5 text-[11px] hover:bg-accent"
                            >
                              → {x.replace("_", " ")}
                            </button>
                          ))}
                          {isAdmin && (
                            <button onClick={() => deleteTask(t.id)} className="rounded border border-destructive/30 px-2 py-0.5 text-[11px] text-destructive hover:bg-destructive/10">
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

function NewTaskForm({
  projectId,
  members,
  isAdmin,
  currentUserId,
  onCreated,
}: {
  projectId: number;
  members: User[];
  isAdmin: boolean;
  currentUserId: number;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    due_date: "",
    assigned_to: isAdmin ? "" : String(currentUserId),
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await api.post("/api/tasks", {
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        due_date: form.due_date || null,
        project_id: projectId,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : currentUserId,
      });
      onCreated();
    } catch (e: any) {
      setErr(e.response?.data?.message ?? "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mb-6 grid gap-3 rounded-lg border bg-card p-5 shadow-[var(--shadow-soft)] md:grid-cols-2">
      <div className="md:col-span-2">
        <Field label="Title">
          <input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Description">
          <textarea rows={2} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
      </div>
      <Field label="Priority">
        <select className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </Field>
      <Field label="Due date">
        <input type="date" className={inputClass} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
      </Field>
      <div className="md:col-span-2">
        <Field label="Assigned to">
          <select
            className={inputClass}
            value={form.assigned_to}
            onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
            disabled={!isAdmin}
          >
            {!isAdmin ? (
              <option value={currentUserId}>Myself</option>
            ) : (
              <>
                <option value="">Select member...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </>
            )}
          </select>
          {!isAdmin && <span className="mt-1 block text-xs text-muted-foreground">Members can only assign tasks to themselves.</span>}
        </Field>
      </div>
      {err && <p className="md:col-span-2 text-sm text-destructive">{err}</p>}
      <div className="md:col-span-2">
        <button type="submit" disabled={loading} className={btnPrimary}>
          {loading ? "Creating..." : "Create task"}
        </button>
      </div>
    </form>
  );
}
