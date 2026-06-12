import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/auth-store";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/projects", label: "Projects" },
    { to: "/tasks", label: "My Tasks" },
    { to: "/profile", label: "Profile" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link to="/dashboard" className="text-base font-semibold tracking-tight">
          <span className="text-primary">●</span> Projectly
        </Link>
        <nav className="flex flex-1 items-center gap-1">
          {links.map((l) => {
            const active = location.pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            user.role === "admin"
              ? "bg-admin text-admin-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          {user.role.toUpperCase()}
        </span>
        <button
          onClick={handleLogout}
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
