import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../routeTree.gen";
import { queryClient } from "./query-client";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const router = createRouter({
  routeTree,
  context: {
    queryClient: queryClient,
  },
});

export function AppRouter() {
  return <RouterProvider router={router} />;
}
