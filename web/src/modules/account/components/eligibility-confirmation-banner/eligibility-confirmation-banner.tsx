import { Button } from "@/components/ui/button";
import {
  useConfirmEligibility,
  useEligibilityConfirmation,
} from "@/modules/account/hooks/use-eligibility-confirmation";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";

export function EligibilityConfirmationBanner() {
  const [confirmed, setConfirmed] = useState(false);
  const confirmation = useEligibilityConfirmation();
  const confirmEligibility = useConfirmEligibility();

  if (confirmation.isLoading || confirmation.isError || confirmation.data?.confirmedAt) {
    return null;
  }

  return (
    <section
      aria-labelledby="eligibility-confirmation-title"
      className="rounded-xl border border-primary/25 bg-primary/[0.05] p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="eligibility-confirmation-title" className="font-semibold">
            Confirmação da conta
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Precisamos apenas da tua declaração. Não pedimos a tua data de nascimento nem um
            documento nesta etapa.
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-5">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
              />
              <span>Tenho pelo menos 16 anos ou autorização do meu representante legal.</span>
            </label>
            <Button
              type="button"
              size="sm"
              disabled={!confirmed || confirmEligibility.isPending}
              onClick={() => confirmEligibility.mutate()}
              className="self-start sm:self-auto"
            >
              {confirmEligibility.isPending ? "A guardar..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
