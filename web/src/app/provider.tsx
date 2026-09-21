import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import "@mantine/tiptap/styles.css";
import { PropsWithChildren } from "react";
import { theme } from "./theme";

// The QueryClientProvider is not here: the router's SSR integration adds it
// (see getRouter), so it can share the per-request client.
export function AppProvider({ children }: PropsWithChildren) {
  return (
    <MantineProvider theme={theme}>
      <Notifications autoClose={5000} position="top-center" />
      {children}
    </MantineProvider>
  );
}
