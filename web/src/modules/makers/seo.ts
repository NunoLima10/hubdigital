import { seo } from "@/lib/seo";
import type { MakerProfile } from "@hubdigital/shared";

function launchedProjects(count: number) {
  return count === 1 ? "1 projeto lançado" : `${count} projetos lançados`;
}

/** Head tags for /makers/$handle; a bio, when there is one, describes them best. */
export function makerHead(maker: MakerProfile | undefined, handle: string) {
  const path = `/profiles/${encodeURIComponent(handle)}`;
  if (!maker) return seo({ title: "Responsável", path, noIndex: true });
  return seo({
    title: maker.name,
    description:
      maker.bio.trim() ||
      `${maker.name} no Hub Digital — ${launchedProjects(maker.projectCount)} na comunidade de Cabo Verde.`,
    path,
    type: "profile",
  });
}
