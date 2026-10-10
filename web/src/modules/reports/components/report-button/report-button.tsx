import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  reportReasonLabels,
  reportReasonValues,
  type ReportReason,
  type ReportTarget,
} from "@hubdigital/shared";
import { useState } from "react";
import { useCreateReport } from "../../hooks/use-create-report";

export function ReportButton({
  targetType,
  targetId,
  label = "Reportar",
  size = "xs",
}: {
  targetType: ReportTarget;
  targetId: number | string;
  label?: string;
  size?: "xs" | "sm";
}) {
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const { mutate, isPending } = useCreateReport({
    onSuccess: () => {
      setOpen(false);
      setDetails("");
      setReason("spam");
    },
  });
  if (!session) return null;
  return (
    <>
      <button
        type="button"
        className={`${size === "sm" ? "text-sm" : "text-xs"} text-muted-foreground hover:underline`}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Reportar à equipa"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A equipa recebe este relatório e decide o que fazer. O autor não
            sabe quem reportou.
          </p>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">Motivo</legend>
            {reportReasonValues.map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`report-${targetType}-${targetId}`}
                  checked={reason === value}
                  onChange={() => setReason(value)}
                />
                {reportReasonLabels[value]}
              </label>
            ))}
          </fieldset>
          <label className="block space-y-1.5 text-sm font-medium">
            Detalhes (opcional)
            <Textarea
              placeholder="O que devemos saber?"
              maxLength={1000}
              value={details}
              onChange={(event) => setDetails(event.currentTarget.value)}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={isPending}
              onClick={() =>
                mutate({
                  targetType,
                  targetId: String(targetId),
                  reason,
                  details: details.trim() || undefined,
                })
              }
            >
              {isPending ? "A enviar..." : "Enviar"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
