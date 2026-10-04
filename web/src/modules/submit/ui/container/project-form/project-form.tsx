import { ImageSelector } from "@/components/image-selector/image-selector";
import { Input } from "@/components/ui/input";
import type { UseFormReturn } from "react-hook-form";
import type { CreateProjectInput } from "../../../types/project";
import { DescriptionEditor } from "../../components/description-editor/description-editor";

type Props = {
  form: UseFormReturn<CreateProjectInput>;
  logoPreviewUrl?: string;
  bannerPreviewUrl?: string;
};
export function ProjectForm({ form, logoPreviewUrl, bannerPreviewUrl }: Props) {
  const values = form.watch();
  const fields = [
    ["name", "Nome do projeto", "Meu Projeto", "text", true],
    [
      "shortDescription",
      "Pequena descrição",
      "O que resolve o teu projeto?",
      "text",
      true,
    ],
    ["websiteUrl", "Website", "https://hubdigital.cv/", "url", true],
    [
      "githubUrl",
      "GitHub",
      "https://github.com/organizacao/projeto",
      "url",
      false,
    ],
  ] as const;
  return (
    <div className="space-y-5">
      {fields.map(([name, label, placeholder, type, required]) => (
        <label key={name} className="block space-y-1.5 text-sm font-medium">
          {label}
          <Input
            type={type}
            placeholder={placeholder}
            required={required}
            {...form.register(name)}
          />
          {form.formState.errors[name]?.message && (
            <span className="text-xs text-destructive">
              {form.formState.errors[name]?.message}
            </span>
          )}
        </label>
      ))}
      <div>
        <p className="mb-1.5 text-sm font-medium">Descrição detalhada</p>
        <DescriptionEditor
          value={values.description}
          onChange={(html) =>
            form.setValue("description", html, { shouldValidate: true })
          }
        />
      </div>
      <ImageSelector
        label="Logo"
        type="project_logo"
        recomandations="PNG, JPG ou WebP até 5 MB"
        actionLabel="Carregar logo"
        value={values.logoUrl}
        previewUrl={logoPreviewUrl}
        onChange={(key) =>
          form.setValue("logoUrl", key, { shouldValidate: true })
        }
        error={form.formState.errors.logoUrl?.message}
      />
      <ImageSelector
        label="Banner"
        type="project_banner"
        recomandations="PNG, JPG ou WebP até 5 MB"
        actionLabel="Carregar banner"
        value={values.bannerImageUrl}
        previewUrl={bannerPreviewUrl}
        onChange={(key) =>
          form.setValue("bannerImageUrl", key, { shouldValidate: true })
        }
        error={form.formState.errors.bannerImageUrl?.message}
      />
    </div>
  );
}
