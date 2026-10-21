import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { projectLinkKindValues, projectLinkKindLabels, projectLinkReferralHref, type ProjectLinkKind } from "@hubdigital/shared";
import type { CreateProjectInput } from "../../../types/project";
import { FormSelect } from "../form-select/form-select";
import { ProjectLinkIcon } from "@/components/project-link-icon";

export function ProjectDestinations({ form }: { form: UseFormReturn<CreateProjectInput> }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "links", keyName: "formKey" });
  const links = form.watch("links");
  const availability = form.watch("availability");
  const required = availability && !["not_available", "unavailable"].includes(availability);
  const error = form.formState.errors.links;
  function selectPrimary(index: number) {
    links.forEach((_, position) => form.setValue(`links.${position}.isPrimary`, position === index, { shouldDirty: true }));
  }
  function removeLink(index: number) {
    const wasPrimary = links[index].isPrimary;
    remove(index);
    if (wasPrimary && links.length > 1) {
      form.setValue("links.0.isPrimary", true, { shouldDirty: true });
    }
  }
  return (
    <section className="space-y-4" aria-labelledby="project-links-title">
      <div className="space-y-1">
        <h2 id="project-links-title" className="text-sm font-semibold">Links{required ? " *" : ""}</h2>
        <p className="text-xs leading-5 text-muted-foreground">Escolhe onde as pessoas podem experimentar ou conhecer o projeto.</p>
      </div>
      {fields.map((field, index) => {
        const link = links[index];
        const href = projectLinkReferralHref(link);
        return (
          <fieldset key={field.formKey} className="space-y-3 rounded-lg border p-3 sm:p-4">
            <legend className="inline-flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
              <ProjectLinkIcon link={link} className="size-3.5" />Destino {index + 1}
            </legend>
            <div className="flex items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="radio" name="project-primary-link" checked={link.isPrimary} onChange={() => selectPrimary(index)} className="accent-primary" />
                Link principal
              </label>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeLink(index)} aria-label={`Remover destino ${index + 1}`}>Remover</Button>
            </div>
            <div className="space-y-3">
              <label className="block space-y-1 text-sm">
                Tipo de link
                <FormSelect value={link.kind} options={projectLinkKindValues.map((kind) => ({ value: kind, label: projectLinkKindLabels[kind] }))}
                  placeholder="Escolhe o tipo" onValueChange={(kind) => form.setValue(`links.${index}.kind`, kind as ProjectLinkKind, { shouldDirty: true })} />
              </label>
              <label className="block space-y-1 text-sm">
                Endereço
                <Input type="text" maxLength={2048} placeholder={link.kind === "app_store" ? "https://apps.apple.com/… ou https://play.google.com/…" : "https://…"}
                  aria-invalid={Boolean(error?.[index]?.url)} {...form.register(`links.${index}.url`)} />
                {error?.[index]?.url?.message && <span className="block text-xs text-destructive">{error[index]?.url?.message}</span>}
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              Texto do botão (opcional)
              <Input placeholder="Usar o nome sugerido" maxLength={80} {...form.register(`links.${index}.label`)} />
            </label>
            {link.kind === "website" && <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={Boolean(link.referralAttribution)} onChange={event=>form.setValue(`links.${index}.referralAttribution`,event.target.checked,{shouldDirty:true})}/>Adicionar origem HubDigital (opcional)</label>}
            {link.referralAttribution && link.kind === "website" && <p className="text-xs text-muted-foreground">Só acrescenta a origem a websites sem parâmetros. O destino aparece abaixo.</p>}
            {href && <p className="break-all text-xs text-muted-foreground">Destino: {href}</p>}
          </fieldset>
        );
      })}
      {(error?.message || error?.root?.message) && <p role="alert" className="text-xs text-destructive">{error.message || error.root?.message}</p>}
      <Button type="button" variant="outline" disabled={fields.length >= 8}
        onClick={() => append({ kind: "website", url: "", label: "", referralAttribution: false, isPrimary: links.length === 0 })}>
        {links.length ? "Adicionar outro link" : "Adicionar link"}
      </Button>
      {links.length >= 8 && <p className="text-xs text-muted-foreground">Podes adicionar até 8 destinos.</p>}
    </section>
  );
}
