import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function NavLink({
  title,
  icon,
  to,
  disabled,
  badge,
}: {
  title: string;
  icon: ReactNode;
  to: LinkProps["to"];
  disabled?: boolean;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      disabled={disabled}
      className={`flex min-h-11 shrink-0 items-center whitespace-nowrap gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-ring px-3 py-2 text-sm font-medium hover:bg-muted ${disabled ? "pointer-events-none opacity-50" : ""}`}
      activeProps={{ className: "bg-primary-soft text-primary" }}
    >
      {icon}
      {title}
      {badge ? (
        <span
          aria-label={`${badge} por responder`}
          className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground"
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
