import type { ReactNode } from "react";

type DashboardPageProps = {
  children: ReactNode;
};

export function DashboardPage({ children }: DashboardPageProps) {
  return <div className="space-y-4 p-0 sm:space-y-5 sm:p-4">{children}</div>;
}
