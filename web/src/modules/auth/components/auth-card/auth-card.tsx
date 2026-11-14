import type { PropsWithChildren } from "react";
import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo/brand-logo";

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
        aria-label="Hub Digital, página inicial"
        className="mb-8 inline-flex"
      >
        <BrandLogo />
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{subtitle}</p>
      {children}
    </div>
  );
}
