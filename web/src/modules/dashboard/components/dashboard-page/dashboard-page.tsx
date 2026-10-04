import type { ReactNode } from "react";

type DashboardPageProps = {
  children: ReactNode;
};

export function DashboardPage({ children }: DashboardPageProps) {
  return <div className="space-y-5 p-4">{children}</div>;
}
