import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { MutationCache, QueryClient, QueryKey } from "@tanstack/react-query";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      invalidatesQuery?: QueryKey;
      successMessage?: string;
      errorMessage?: string;
    };
  }
}

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      if (mutation.meta?.successMessage) {
        notifications.show({
          title: "Tudo certo!",
          message: mutation.meta?.successMessage,
          icon: <IconCheck />,
          color: "teal",
        });
      }
    },

    onError: (_error, _variables, _context, mutation) => {
      if (mutation.meta?.errorMessage) {
        notifications.show({
          title: "Algo Correu mal!",
          message: mutation.meta?.errorMessage,
          icon: <IconX />,
          color: "red",
        });
      }
    },

    onSettled: (_data, _error, _variables, _context, mutation) => {
      {
        if (mutation.meta?.invalidatesQuery) {
          queryClient.invalidateQueries({
            queryKey: mutation.meta?.invalidatesQuery,
          });
        }
      }
    },
  }),
});
