import { ClerkProvider } from "@clerk/clerk-react";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { env } from "./env";
import { queryClient } from "./query-client";
import { theme } from "./theme";

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <MantineProvider theme={theme}>
      <Notifications autoClose={5000} position="top-center" />
      <QueryClientProvider client={queryClient}>
        <ClerkProvider
          publishableKey={env.CLERK_PUBLISHABLE_KEY}
          afterSignOutUrl="/"
        >
          {children}
        </ClerkProvider>
      </QueryClientProvider>
    </MantineProvider>
  );
}
