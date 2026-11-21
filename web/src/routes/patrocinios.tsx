import { seo } from "@/lib/seo";
import { SponsorsPage } from "@/modules/sponsors/sponsors-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/patrocinios")({
  head: () =>
    seo({
      title: "Patrocínios",
      description:
        "Como apoiar o Hub Digital e a parceria com a Ola.cv, incluindo o sorteio de 5 domínios .cv no lançamento.",
      path: "/patrocinios",
    }),
  component: SponsorsPage,
});
