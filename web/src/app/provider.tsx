import { Toaster } from "sonner";
import type { PropsWithChildren } from "react";

// The QueryClientProvider is not here: the router's SSR integration adds it
// (see getRouter), so it can share the per-request client.
export function AppProvider({ children }: PropsWithChildren) {
  return (
    <>
      <Toaster richColors position="top-center" />
      {children}
    </>
  );
}
