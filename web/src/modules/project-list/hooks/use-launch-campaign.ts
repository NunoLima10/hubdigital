import { API } from "@/api/api";
import { useQuery } from "@tanstack/react-query";

/** Temporary: the Ola.cv launch raffle. Remove after the draw. */
export type LaunchCampaign = {
  users: number;
  goal: number;
  prizes: number;
  reached: boolean;
};

async function fetchLaunchCampaign() {
  const response = await API.get<{ data: LaunchCampaign }>("/launch-campaign");
  return response.data.data;
}

export function useLaunchCampaign() {
  return useQuery({
    queryKey: ["launch-campaign"],
    queryFn: fetchLaunchCampaign,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
