import { useQuery } from "@tanstack/react-query";

export const PROJECT_REPOSITORY = "https://github.com/NunoLima10/hubdigital";

export function useGithubStars() {
  return useQuery({
    queryKey: ["github", "NunoLima10/hubdigital", "stars"],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        "https://api.github.com/repos/NunoLima10/hubdigital",
        {
          signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
          headers: { Accept: "application/vnd.github+json" },
        },
      );
      if (!response.ok) throw new Error("GitHub repository unavailable");

      const repository: { stargazers_count?: unknown } = await response.json();
      const stars = repository.stargazers_count;
      if (typeof stars !== "number" || !Number.isSafeInteger(stars) || stars < 0) {
        throw new Error("Invalid GitHub star count");
      }
      return stars;
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
