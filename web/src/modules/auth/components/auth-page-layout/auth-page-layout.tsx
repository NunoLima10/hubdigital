import type { PropsWithChildren } from "react";
export function AuthPageLayout({ children }: PropsWithChildren) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 px-4 py-8">
      {children}
    </main>
  );
}
