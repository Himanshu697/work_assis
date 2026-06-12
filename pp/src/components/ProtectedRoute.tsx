import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/auth-store";

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!token || !user) {
      navigate({ to: "/login" });
    }
  }, [token, user, navigate]);

  if (!token || !user) return null;

  if (requireAdmin && user.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md rounded-lg border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            🔒
          </div>
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is restricted to administrators.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
