import { ImageSelector } from "@/components/image-selector/image-selector";
import { UseFormReturnType } from "@mantine/form";
import { Stack, TextInput } from "@mantine/core";
import { CreateProjectInput } from "../../../types/project";
import { DescriptionEditor } from "../../components/description-editor/description-editor";

type ProjectFormProps = {
  form: UseFormReturnType<CreateProjectInput>;
  /** Public URLs of images already saved on the project, when editing. */
  logoPreviewUrl?: string;
  bannerPreviewUrl?: string;
};

export function ProjectForm({
  form,
  logoPreviewUrl,
  bannerPreviewUrl,
}: ProjectFormProps) {
  return (
    <Stack>
      <TextInput
        label="Nome do projeto"
        placeholder="Meu Projeto"
        required
        {...form.getInputProps("name")}
      />
      <TextInput
        label="Pequena descrição"
        placeholder="Meu Projeto resolve esse problema com isso.."
        required
        {...form.getInputProps("shortDescription")}
      />
      <TextInput
        label="Website"
        placeholder="https://hubdigital.cv/"
        required
        {...form.getInputProps("websiteUrl")}
      />
      <TextInput
        label="GitHub"
        placeholder="https://github.com/organizacao/projeto"
        {...form.getInputProps("githubUrl")}
      />
      <DescriptionEditor
        value={form.values.description}
        onChange={(html) => form.setFieldValue("description", html)}
      />
      <ImageSelector
        label="Logo"
        type="project_logo"
        recomandations="PNG, JPG ou WebP até 5 MB"
        actionLabel="Carregar Logo"
        value={form.values.logoUrl}
        previewUrl={logoPreviewUrl}
        onChange={(fileKey) => form.setFieldValue("logoUrl", fileKey)}
        error={form.errors.logoUrl as string | undefined}
      />
      <ImageSelector
        label="Banner"
        type="project_banner"
        recomandations="PNG, JPG ou WebP até 5 MB"
        actionLabel="Carregar Banner"
        value={form.values.bannerImageUrl}
        previewUrl={bannerPreviewUrl}
        onChange={(fileKey) => form.setFieldValue("bannerImageUrl", fileKey)}
        error={form.errors.bannerImageUrl as string | undefined}
      />
    </Stack>
  );
}
