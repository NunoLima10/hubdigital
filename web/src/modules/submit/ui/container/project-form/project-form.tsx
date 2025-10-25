import { ImageSelector } from "@/components/image-selector/image-selector";
import { Stack, TextInput } from "@mantine/core";
import { DescriptionEditor } from "../../components/description-editor/description-editor";

type ProjectFormProps = {};

export function ProjectForm({}: ProjectFormProps) {
  return (
    <Stack>
      <TextInput label="Nome do projeto" placeholder="Meu Projeto" required />
      <TextInput
        label="Pequena descrição"
        placeholder="Meu Projeto resolve esse problema com isso.."
        required
      />
      <TextInput
        label="Website"
        placeholder="https://hubdigital.cv/"
        required
      />
      <DescriptionEditor />
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
