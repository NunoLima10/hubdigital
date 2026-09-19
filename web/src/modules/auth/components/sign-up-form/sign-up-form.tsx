import { Anchor, Button, PasswordInput, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "mantine-form-zod-resolver";
import {
  type EmailSignUpCredentials,
  emailSignUpSchema,
} from "../../schemas/auth-schema";
import { useEmailSignUp } from "../../hooks/use-email-sign-up";
import { AuthCard } from "../auth-card/auth-card";

export function SignUpForm() {
  const navigate = useNavigate();

  const { emailSignUp, isPending } = useEmailSignUp({
    onSuccess() {
      navigate({ to: "/dashboard/releases" });
    },
    onError(message) {
      notifications.show({
        title: "Algo correu mal!",
        message,
        color: "red",
        icon: <IconX />,
      });
      form.resetField("password");
      form.resetField("confirmPassword");
    },
  });

  const form = useForm<EmailSignUpCredentials>({
    initialValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
    validate: zodResolver(emailSignUpSchema),
  });

  return (
    <AuthCard
      title="Criar uma conta"
      subtitle="Registe-se para partilhar os seus projetos"
    >
      <form onSubmit={form.onSubmit((values) => emailSignUp(values))}>
        <TextInput
          label="Nome"
          required
          {...form.getInputProps("name")}
          key={form.key("name")}
        />
        <TextInput
          label="Email"
          required
          mt="md"
          {...form.getInputProps("email")}
          key={form.key("email")}
        />
        <PasswordInput
          label="Password"
          required
          mt="md"
          {...form.getInputProps("password")}
          key={form.key("password")}
        />
        <PasswordInput
          label="Confirmar password"
          required
          mt="md"
          {...form.getInputProps("confirmPassword")}
          key={form.key("confirmPassword")}
        />
        <Button loading={isPending} fullWidth mt="md" type="submit">
          Criar conta
        </Button>
        <Text ta="center" c="dimmed" size="sm" mt="xs">
          Já tem uma conta?{" "}
          <Anchor component={Link} to="/sign-in" size="sm">
            Iniciar sessão
          </Anchor>
        </Text>
      </form>
    </AuthCard>
  );
}
