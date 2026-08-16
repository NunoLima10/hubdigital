import { API } from "@/api/api";
import { useQuery } from "@tanstack/react-query";
import { Category } from "../types/project";

async function fetchCategories() {
  const response = await API.get<{ data: Category[] }>("/categories");
  return response.data.data;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
}
