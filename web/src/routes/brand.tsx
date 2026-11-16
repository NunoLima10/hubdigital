import { seo } from "@/lib/seo";
import { BrandPage } from "@/modules/brand/brand-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/brand")({
  head: () =>
    seo({
      title: "Manual da marca",
      description:
        "O manual da marca Hub Digital: símbolo, versões do logótipo, cor, tipografia, ilhas, distintivos e micro-interações.",
      path: "/brand",
    }),
  component: BrandPage,
});
