import { ImageSelector } from "@/components/image-selector/image-selector";
import { UseFormReturnType } from "@mantine/form";
import { Stack, Text, TextInput } from "@mantine/core";
import { CreateProjectInput } from "../../../types/project";
import { DescriptionEditor } from "../../components/description-editor/description-editor";

type ProjectFormProps = {
  form: UseFormReturnType<CreateProjectInput>;
};

export function ProjectForm({ form }: ProjectFormProps) {
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
      <Text size="sm" c="dimmed">
        O envio de logo e banner estará disponível em breve.
      </Text>
      <ImageSelector
        label="Logo"
        recomandations="Recomendações"
        actionLabel="Carregar Logo"
      />
      <ImageSelector
        label="Banner"
        recomandations="Recomendações"
        actionLabel="Carregar Banner"
      />
    </Stack>
  );
}
