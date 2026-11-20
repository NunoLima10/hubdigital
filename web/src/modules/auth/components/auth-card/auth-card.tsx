import type { PropsWithChildren } from "react";
import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo/brand-logo";
import { cn } from "@/lib/utils";

export function AuthCard({
  title,
  subtitle,
  children,
  variant = "page",
}: PropsWithChildren<{
  title?: string;
  subtitle?: string;
  imageSrc?: string;
  /** "dialog" drops the card chrome: the dialog already is the card. */
  variant?: "page" | "dialog";
}>) {
  const inDialog = variant === "dialog";
  const Heading = inDialog ? "h2" : "h1";
  return (
    <div
      className={cn(
        "w-full",
        inDialog
          ? "p-2 sm:p-4"
          : "max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8",
      )}
    >
      {inDialog ? (
        // A link here would throw away what the visitor was doing.
        <span className="mb-8 inline-flex">
          <BrandLogo />
        </span>
      ) : (
        <Link
          to="/"
          aria-label="Hub Digital, página inicial"
          className="mb-8 inline-flex"
        >
          <BrandLogo />
        </Link>
      )}
      <Heading className="text-2xl font-semibold tracking-tight">{title}</Heading>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{subtitle}</p>
      {children}
    </div>
  );
}
