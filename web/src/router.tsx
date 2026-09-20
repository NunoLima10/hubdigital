import "@/lib/zod-error-map";

import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { Erro } from "./app/error";
import { NotFound } from "./app/not-found";
import { createQueryClient } from "./app/query-client";
import { routeTree } from "./routeTree.gen";

/**
 * Start calls this once per request on the server and once in the browser, so
 * everything that must not be shared between visitors is created in here.
 */
export function getRouter() {
  const queryClient = createQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultErrorComponent: Erro,
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true,
  });

  // Dehydrates the server's query cache into the HTML and rehydrates it in the
  // browser, and wraps the app in the QueryClientProvider.
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
