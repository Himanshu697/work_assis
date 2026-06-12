import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import {
  PageShell,
  EmptyState,
  Field,
  inputClass,
  btnPrimary,
  btnSecondary,
  btnDestructive,
} from "@/components/ui-bits";

export const Route = createFileRoute("/projects/")({
  component: () => (
    <ProtectedRoute>
      <Navbar />
      <ProjectsPage />
    </ProtectedRoute>
  ),
  head: () => ({ meta: [{ title: "Projects — Projectly" }] }),
});

function ProjectsPage() {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get<Project[]>("/api/projects")
      .then((r) => setProjects(r.data))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (id: number) => {
    if (!confirm("Delete this project?")) return;
    await api.delete(`/api/projects/${id}`);
    load();
  };

  return (
    <PageShell
      title="Projects"
      action={
        isAdmin && (
          <button onClick={() => setShowForm((v) => !v)} className={btnPrimary}>
            {showForm ? "Cancel" : "+ New project"}
          </button>
        )
      }
    >
      {showForm && <NewProjectForm onCreated={() => { setShowForm(false); load(); }} />}

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border bg-card" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          hint={isAdmin ? "Create your first project to get started." : "Ask an admin to add you to a project."}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((p) => (
            <div key={p.id} className="rounded-lg border bg-card p-5 shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-2">
                <Link to="/projects/$id" params={{ id: String(p.id) }} className="font-semibold hover:text-primary">
                  {p.name}
                </Link>
                {isAdmin && (
                  <button onClick={() => remove(p.id)} className={btnDestructive}>
                    Delete
                  </button>
                )}
              </div>
              {p.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{p.deadline ? `Due ${p.deadline}` : "No deadline"}</span>
                {p.member_count != null && <span>{p.member_count} members</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function NewProjectForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", description: "", deadline: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await api.post("/api/projects", {
        name: form.name,
        description: form.description || null,
        deadline: form.deadline || null,
      });
      onCreated();
    } catch (e: any) {
      setErr(e.response?.data?.message ?? "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mb-6 space-y-3 rounded-lg border bg-card p-5 shadow-[var(--shadow-soft)]">
      <Field label="Name">
        <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Description">
        <textarea rows={2} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>
      <Field label="Deadline">
        <input type="date" className={inputClass} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
      </Field>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <button type="submit" disabled={loading} className={btnPrimary}>
        {loading ? "Creating..." : "Create project"}
      </button>
    </form>
  );
}
