import { Link } from "@tanstack/react-router";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/clients", label: "Clients" },
    { to: "/invoices", label: "Invoices" },
    { to: "/profile", label: "Profile" },
    { to: "/settings", label: "Settings" },
  ] as const;

  return (
    <header>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav
          aria-label="Main navigation"
          className="flex gap-4 text-lg"
          id="main-navigation"
        >
          {links.map(({ to, label }) => (
            <Link
              activeProps={{
                className: "text-primary font-medium",
                "aria-current": "page" as const,
              }}
              className="rounded-sm px-1 py-0.5 text-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 [&.active]:font-medium [&.active]:text-primary"
              key={to}
              to={to}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div
          aria-label="User preferences and account"
          className="flex items-center gap-2"
          role="toolbar"
        >
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
      <hr />
    </header>
  );
}
