import { API } from "@/api/api";
import { ListResponse } from "@/types";
import { Project } from "@/modules/submit/types/project";
import { useQuery } from "@tanstack/react-query";

async function fetchMyProjects() {
  const response = await API.get<ListResponse<Project>>("/projects/mine");
  return response.data;
}

export function useMyProjects() {
  return useQuery({
    queryKey: ["my-projects"],
    queryFn: fetchMyProjects,
  });
}
