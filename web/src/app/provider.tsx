import { initMonitoring } from "@/lib/monitoring";
import { Toaster } from "sonner";
import { useEffect, type PropsWithChildren } from "react";

// The QueryClientProvider is not here: the router's SSR integration adds it
// (see getRouter), so it can share the per-request client.
export function AppProvider({ children }: PropsWithChildren) {
  useEffect(initMonitoring, []);
  return (
    <>
      <Toaster richColors position="top-center" />
      {children}
    </>
  );
}
