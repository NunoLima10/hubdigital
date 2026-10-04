import type { PropsWithChildren } from "react";
import { Link } from "@tanstack/react-router";

export function AuthCard({
  title,
  subtitle,
  children,
}: PropsWithChildren<{
  title?: string;
  subtitle?: string;
  imageSrc?: string;
}>) {
  return (
    <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          H
        </span>
        HubDigital
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{subtitle}</p>
      {children}
    </div>
  );
}
