import { Anchor, Button, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { zodResolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  type ForgotPasswordCredentials,
  forgotPasswordSchema,
} from "../../schemas/auth-schema";
import { AuthCard } from "../auth-card/auth-card";

export function ForgotPassword() {
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordCredentials>({
    initialValues: {
      email: "",
    },
    validate: zodResolver(forgotPasswordSchema),
  });

  async function handleForgotPassword(credentials: ForgotPasswordCredentials) {
    await authClient.requestPasswordReset({
      email: credentials.email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    // Always report success so the form does not reveal whether an email is
    // registered.
    notifications.show({
      title: "Tudo certo!",
      message: "Se o email existir, receberá um link de recuperação.",
      color: "teal",
      icon: <IconCheck />,
    });
    setSent(true);
  }

  return (
    <AuthCard
      title="Recuperar password"
      subtitle="Insira o seu email para receber um link de recuperação"
    >
      <form onSubmit={form.onSubmit(handleForgotPassword)}>
        <TextInput
          label="Email"
          mt="md"
          required
          placeholder="voce@email.com"
          {...form.getInputProps("email")}
          key={form.key("email")}
        />
        <Button fullWidth mt="md" type="submit" disabled={sent}>
          Enviar link de recuperação
        </Button>
        <Text ta="center" c="dimmed" size="sm" mt="xs">
          <Anchor component={Link} to="/sign-in" size="sm">
            Voltar ao início de sessão
          </Anchor>
        </Text>
      </form>
    </AuthCard>
  );
}
