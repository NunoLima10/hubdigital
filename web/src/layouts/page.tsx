import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageProps = {
  children: ReactNode;
  leftSection?: ReactNode;
  rightSection?: ReactNode;
  banner?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
};

export function Page({
  children,
  leftSection,
  rightSection,
  banner,
  header,
  footer,
}: PageProps) {
  return (
    <div className={cn("min-h-screen bg-background", header && "pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0")}>
      {banner}
      {header}
      <div
        className={cn(
          "mx-auto grid w-full max-w-6xl gap-8 px-4 py-6 md:px-6 md:py-8",
          rightSection &&
            "lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:gap-10",
          leftSection &&
            "gap-4 px-3 py-3 sm:gap-8 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:grid-cols-[minmax(220px,1fr)_minmax(0,3fr)] lg:gap-10",
        )}
      >
        {leftSection && <aside className="min-w-0 lg:order-1">{leftSection}</aside>}
        <main
          className={cn("min-w-0", leftSection ? "lg:order-2" : "lg:order-1")}
        >
          {children}
        </main>
        {rightSection && <aside className="lg:order-2">{rightSection}</aside>}
      </div>
      {footer}
    </div>
  );
}
