import { queryOptions } from "@tanstack/react-query";
import { API } from "@/api/api";
import type { ProjectMapRecord } from "@hubdigital/shared";
export const mapQueryOptions = (country?: string, categoryId?: number, island?: string) =>
  queryOptions({
    queryKey: ["project-map", country, categoryId, island],
    queryFn: async ({ signal }) => {
      const all: ProjectMapRecord[] = [];
      let offset = 0;
      while (true) {
        const response = await API.get<{ data: ProjectMapRecord[]; meta: { total: number } }>(
          "/projects/map",
          { params: { country, categoryId, island, offset, limit: 200 }, signal },
        );
        all.push(...response.data.data);
        offset += response.data.data.length;
        if (offset >= response.data.meta.total || !response.data.data.length) break;
      }
      return all;
    },
    staleTime: 30000,
  });
