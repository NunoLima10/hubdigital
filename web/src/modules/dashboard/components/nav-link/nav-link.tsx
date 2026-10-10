import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function NavLink({
  title,
  icon,
  to,
  disabled,
}: {
  title: string;
  icon: ReactNode;
  to: LinkProps["to"];
  disabled?: boolean;
}) {
  return (
    <Link
      to={to}
      disabled={disabled}
      className={`flex min-h-11 shrink-0 items-center whitespace-nowrap gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-ring px-3 py-2 text-sm hover:bg-muted ${disabled ? "pointer-events-none opacity-50" : ""}`}
      activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
    >
      {icon}
      {title}
    </Link>
  );
}
