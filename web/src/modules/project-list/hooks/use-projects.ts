import { API } from "@/api/api";
import { ProjectMinimal } from "@/modules/submit/types/project";
import { ListResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

async function fetchProjects() {
  const response = await API.get<ListResponse<ProjectMinimal>>("/projects", {
    params: { limit: 50 },
  });
  return response.data;
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });
}
