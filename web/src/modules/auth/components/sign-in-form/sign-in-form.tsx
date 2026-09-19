import { Anchor, Button, PasswordInput, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "mantine-form-zod-resolver";
import {
  type EmailSignInCredentials,
  emailSignInSchema,
} from "../../schemas/auth-schema";
import { useEmailSignIn } from "../../hooks/use-email-sign-in";
import { AuthCard } from "../auth-card/auth-card";

export function SignInForm() {
  const navigate = useNavigate();

  const { emailSignIn, isPending } = useEmailSignIn({
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
    },
  });

  const form = useForm<EmailSignInCredentials>({
    // Prefilled with the demo publisher account for quick access.
    initialValues: {
      email: "demo.publisher@hubdigital.cv",
      password: "demo1234",
    },
    validate: zodResolver(emailSignInSchema),
  });

  return (
    <AuthCard
      title="Bem-vindo de volta!"
      subtitle="Inicie sessão na sua conta"
    >
      <form onSubmit={form.onSubmit((values) => emailSignIn(values))}>
        <TextInput
          label="Email"
          required
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

        <Text ta="right" c="dimmed" size="sm" mt="xs">
          <Anchor component={Link} to="/forgot-password" c="dimmed" size="sm">
            Esqueceu a password?
          </Anchor>
        </Text>

        <Button loading={isPending} fullWidth mt="md" type="submit">
          Entrar
        </Button>

        <Text ta="center" c="dimmed" size="sm" mt="xs">
          Não tem uma conta?{" "}
          <Anchor component={Link} to="/sign-up" size="sm">
            Criar conta
          </Anchor>
        </Text>
      </form>
    </AuthCard>
  );
}
