import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Common ways people help on a project; anything else goes in "Outro". */
export const roleSuggestions = [
  "Programador",
  "Designer",
  "Cofundador",
  "Gestão de produto",
  "Marketing",
  "Conteúdo",
  "Dados e IA",
  "Testes",
  "Mentoria",
];

const chip =
  "inline-flex min-h-9 items-center rounded-full border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring";

/**
 * Picks how someone helped on a project: one tap on a suggestion, or "Outro"
 * to write a contribution that is not in the list.
 */
export function RolePicker({
  value,
  onChange,
  label = "O que fez no projeto?",
}: {
  value: string;
  onChange: (role: string) => void;
  label?: string;
}) {
  const labelId = useId();
  const isSuggestion = roleSuggestions.includes(value);
  const [writing, setWriting] = useState(!isSuggestion && value !== "");
  const custom = writing || (!isSuggestion && value !== "");
  return (
    <div className="space-y-2">
      <p id={labelId} className="text-sm font-medium">
        {label}
      </p>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {roleSuggestions.map((role) => {
          const selected = !custom && value === role;
          return (
            <button
              key={role}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setWriting(false);
                onChange(role);
              }}
              className={cn(
                chip,
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:border-primary/60",
              )}
            >
              {role}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={custom}
          onClick={() => {
            setWriting(true);
            if (isSuggestion) onChange("");
          }}
          className={cn(
            chip,
            "border-dashed",
            custom
              ? "border-primary bg-primary/10 text-primary"
              : "bg-background hover:border-primary/60",
          )}
        >
          Outro…
        </button>
      </div>
      {custom && (
        <Input
          aria-label="Outra contribuição"
          autoFocus
          maxLength={80}
          placeholder="Ex.: Ilustração, Som, Tradução"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {custom && value.trim().length > 0 && value.trim().length < 2 && (
        <p className="text-xs text-destructive">Escreve pelo menos 2 letras.</p>
      )}
    </div>
  );
}
