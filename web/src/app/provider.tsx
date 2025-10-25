import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import '@mantine/tiptap/styles.css';
import { QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { queryClient } from "./query-client";
import { theme } from "./theme";

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <MantineProvider theme={theme}>
      <Notifications autoClose={5000} position="top-center" />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MantineProvider>
  );
}
