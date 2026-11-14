import { API } from "@/api/api";
import type { CreateReportBody } from "@hubdigital/shared";
import { useMutation } from "@tanstack/react-query";

async function createReport(body: CreateReportBody) {
  const response = await API.post<{
    data: { id: number | null; duplicate: boolean };
  }>("/reports", body);

  return response.data.data;
}

export function useCreateReport({ onSuccess }: { onSuccess?: () => void } = {}) {
  return useMutation({
    mutationFn: createReport,
    meta: {
      // A repeat report is answered the same way: from the reporter's side they
      // did report it, and saying otherwise only invites a retry.
      successMessage: "Obrigado. A equipa vai analisar.",
      errorMessage: "Não foi possível enviar o relatório.",
    },
    onSuccess,
  });
}
