import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API } from "@/api/api";
import {
  normalizedProjectLink,
  type ProjectLinkInput,
} from "@hubdigital/shared";

export type DuplicateLink = {
  index: number;
  message: string;
  project: { slug: string; name: string } | null;
};

export function useDuplicateLinks(
  links: ProjectLinkInput[],
  projectId: number | null,
) {
  const signature = JSON.stringify(
    links.map(({ kind, url }) => ({ kind, url })),
  );
  const [settled, setSettled] = useState(signature);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(signature), 500);
    return () => clearTimeout(timer);
  }, [signature]);
  const query = useQuery({
    queryKey: ["duplicate-project-links", settled, projectId],
    enabled: signature === settled && links.some(normalizedProjectLink),
    queryFn: async ({ signal }) =>
      (
        await API.post<{ data: DuplicateLink[] }>(
          "/projects/check-links",
          { links: JSON.parse(settled), projectId: projectId ?? undefined },
          { signal },
        )
      ).data.data,
    staleTime: 15_000,
  });
  return signature === settled ? (query.data ?? []) : [];
}
