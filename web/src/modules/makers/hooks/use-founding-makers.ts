import { API } from "@/api/api";
import type { ListResponse } from "@/types";
import type { FoundingMaker } from "@hubdigital/shared";
import { useQuery } from "@tanstack/react-query";

const PAGE_SIZE = 5;

async function fetchFoundingMakers() {
  const response = await API.get<ListResponse<FoundingMaker>>(
    "/makers/founding",
    { params: { limit: PAGE_SIZE } },
  );
  return response.data;
}

export function useFoundingMakers() {
  return useQuery({
    queryKey: ["maker", "founding"],
    queryFn: fetchFoundingMakers,
    staleTime: 60 * 1000,
  });
}
