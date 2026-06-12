import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Projectly — Team project & task management" },
      { name: "description", content: "Lightweight project management for teams: projects, tasks, RBAC, and a clean dashboard." },
    ],
  }),
});

function Index() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token) navigate({ to: "/dashboard" });
  }, [token, navigate]);

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="text-base font-semibold"><span className="text-primary">●</span> Projectly</div>
          <div className="flex gap-2">
            <Link to="/login" className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent">Login</Link>
            <Link to="/signup" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">Sign up</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-24 text-center">
        <span className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">For small teams</span>
        <h1 className="mt-6 text-5xl font-bold tracking-tight">
          Ship projects together, <span className="text-primary">without the chaos.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Plan projects, assign tasks, track progress. Admins lead, members execute — everyone stays in sync.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/signup" className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-90">
            Get started
          </Link>
          <Link to="/login" className="rounded-md border bg-background px-5 py-2.5 text-sm font-medium hover:bg-accent">
            Sign in
          </Link>
        </div>

        <div className="mt-20 grid gap-4 text-left md:grid-cols-3">
          {[
            { t: "Role-based access", d: "Admins manage projects & members. Members focus on their tasks." },
            { t: "Task board", d: "Todo → In Progress → Done with priorities and due dates." },
            { t: "Overdue alerts", d: "Spot slipping work instantly on your dashboard." },
          ].map((f) => (
            <div key={f.t} className="rounded-lg border bg-card p-5 shadow-[var(--shadow-soft)]">
              <p className="font-semibold">{f.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
