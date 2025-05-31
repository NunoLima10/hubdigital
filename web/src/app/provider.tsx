import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { shadcnCssVariableResolver } from "./cssVariableResolver";
import { shadcnTheme } from "./theme";

type AppProviderProps = {
  children: React.ReactNode;
};

const queryClient = new QueryClient({});

export function AppProvider({ children }: AppProviderProps) {
  return (
    <MantineProvider
      theme={shadcnTheme}
      cssVariablesResolver={shadcnCssVariableResolver}
    >
      <Notifications autoClose={5000} position="top-center" />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MantineProvider>
  );
}
