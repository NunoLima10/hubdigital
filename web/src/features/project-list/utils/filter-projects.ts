import { Project } from "../types/project";

export const SORT_OPTIONS = [
  { value: "populares", label: "Mais votados" },
  { value: "recentes", label: "Mais recentes" },
  { value: "az", label: "A–Z" },
] as const;

export type Sort = (typeof SORT_OPTIONS)[number]["value"];

export type ProjectFilters = {
  query: string;
  category: string | null;
  island: string | null;
  sort: Sort;
};

// "Saúde" e "saude" devem dar o mesmo resultado.
function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function filterProjects(projects: Project[], filters: ProjectFilters) {
  const query = normalize(filters.query.trim());

  const result = projects.filter((project) => {
    if (filters.category && project.category !== filters.category) return false;
    if (filters.island && project.island !== filters.island) return false;
    if (!query) return true;

    const haystack = normalize(
      [project.name, project.tagline, project.category, ...project.tags].join(
        " ",
      ),
    );
    return haystack.includes(query);
  });

  return result.sort((a, b) => {
    if (filters.sort === "recentes") return b.addedAt.localeCompare(a.addedAt);
    if (filters.sort === "az") return a.name.localeCompare(b.name, "pt");
    return b.upCount - a.upCount;
  });
}
