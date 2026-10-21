import { Project } from "@/features/project-list/types/project";
import data from "./projects.json";

// Lista estática até a API estar pronta. Para adicionar um projeto, ver CONTRIBUTING.md.
export const projects = data as Project[];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export const REPO_URL = "https://github.com/NunoLima10/hubdigital";
export const SUBMIT_URL = `${REPO_URL}/issues/new?template=submit_project.yml`;
export const EDIT_DATA_URL = `${REPO_URL}/edit/main/web/src/data/projects.json`;
