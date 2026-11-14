import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/makers/$handle")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/profiles/$handle",
      params: { handle: params.handle },
      replace: true,
    });
  },
});
