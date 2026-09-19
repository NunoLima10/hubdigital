import { useMaker, useMyHandle, useUpdateMaker } from "../../hooks/use-maker";
import { makerProfileUpdateSchema } from "@hubdigital/shared";
import {
  Anchor,
  Button,
  Flex,
  Group,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";

type ProfileFormValues = {
  handle: string;
  bio: string;
  websiteUrl: string;
  githubUrl: string;
  linkedinUrl: string;
};

const emptyValues: ProfileFormValues = {
  handle: "",
  bio: "",
  websiteUrl: "",
  githubUrl: "",
  linkedinUrl: "",
};

export function ProfileForm() {
  const { data: handle, isLoading: isLoadingHandle } = useMyHandle();
  const { data: profile, isLoading: isLoadingProfile } = useMaker(
    handle ?? undefined
  );

  const form = useForm<ProfileFormValues>({
    initialValues: emptyValues,
    validate: zodResolver(makerProfileUpdateSchema),
  });

  // The form is populated from the profile once it arrives rather than being
  // remounted, so a slow response doesn't wipe what is already typed.
  const { setValues } = form;
  useEffect(() => {
    if (!profile) return;

    setValues({
      handle: profile.handle ?? "",
      bio: profile.bio,
      websiteUrl: profile.websiteUrl ?? "",
      githubUrl: profile.githubUrl ?? "",
      linkedinUrl: profile.linkedinUrl ?? "",
    });
  }, [profile, setValues]);

  const { updateMaker, isPending } = useUpdateMaker();

  if (isLoadingHandle || isLoadingProfile) {
    return (
      <Stack gap="md">
        <Skeleton h={36} />
        <Skeleton h={80} />
        <Skeleton h={36} />
      </Stack>
    );
  }

  if (!handle) {
    return (
      <Text c="dimmed" size="sm">
        Conclui o teu perfil de publicador para poderes editá-lo.
      </Text>
    );
  }

  function handleSubmit(values: ProfileFormValues) {
    updateMaker(values);
  }

  return (
    <Stack gap="md" maw={560}>
      <Group gap="xs" align="baseline">
        <Title order={4}>Perfil público</Title>
        {profile?.handle && (
          <Anchor
            renderRoot={(props) => (
              <Link
                to="/makers/$handle"
                params={{ handle: profile.handle as string }}
                {...props}
              />
            )}
            size="sm"
          >
            ver perfil
          </Anchor>
        )}
      </Group>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Nome de utilizador"
            description="É o endereço do teu perfil: /makers/o-teu-nome"
            leftSection={<Text size="sm">@</Text>}
            {...form.getInputProps("handle")}
          />
          <Textarea
            label="Bio"
            autosize
            minRows={3}
            maxRows={6}
            {...form.getInputProps("bio")}
          />
          <TextInput
            label="Website"
            placeholder="https://exemplo.cv"
            {...form.getInputProps("websiteUrl")}
          />
          <TextInput
            label="GitHub"
            placeholder="https://github.com/utilizador"
            {...form.getInputProps("githubUrl")}
          />
          <TextInput
            label="LinkedIn"
            placeholder="https://linkedin.com/in/utilizador"
            {...form.getInputProps("linkedinUrl")}
          />
          <Flex justify="flex-end">
            <Button type="submit" loading={isPending}>
              Guardar perfil
            </Button>
          </Flex>
        </Stack>
      </form>
    </Stack>
  );
}
