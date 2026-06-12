import { createFileRoute } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/auth-store";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { PageShell } from "@/components/ui-bits";

export const Route = createFileRoute("/profile")({
  component: () => (
    <ProtectedRoute>
      <Navbar />
      <Profile />
    </ProtectedRoute>
  ),
  head: () => ({ meta: [{ title: "Profile — Projectly" }] }),
});

function Profile() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  return (
    <PageShell title="Profile">
      <div className="max-w-md rounded-lg border bg-card p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="mt-5 border-t pt-4">
          <p className="text-sm text-muted-foreground">Role</p>
          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            user.role === "admin" ? "bg-admin text-admin-foreground" : "bg-secondary text-secondary-foreground"
          }`}>
            {user.role.toUpperCase()}
          </span>
        </div>
      </div>
    </PageShell>
  );
}
