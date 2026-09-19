import { Button, PasswordInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { zodResolver } from "mantine-form-zod-resolver";
import { authClient } from "@/lib/auth-client";
import {
  type ResetPasswordCredentials,
  resetPasswordSchema,
} from "../../schemas/auth-schema";
import { getAuthErrorMessage } from "../../utils/get-auth-error-message";
import { AuthCard } from "../auth-card/auth-card";

export function ResetPassword() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token");

  const form = useForm<ResetPasswordCredentials>({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validate: zodResolver(resetPasswordSchema),
  });

  async function handleResetPassword(credentials: ResetPasswordCredentials) {
    if (!token) {
      notifications.show({
        title: "Algo correu mal!",
        message: "O link de recuperação é inválido ou expirou.",
        color: "red",
        icon: <IconX />,
      });
      return;
    }

    const { error } = await authClient.resetPassword({
      newPassword: credentials.password,
      token,
    });

    if (error?.code) {
      notifications.show({
        title: "Algo correu mal!",
        message:
          getAuthErrorMessage(error.code) ??
          "Não foi possível redefinir a password.",
        color: "red",
        icon: <IconX />,
      });
      return;
    }

    notifications.show({
      title: "Tudo certo!",
      message: "A sua password foi redefinida.",
      color: "teal",
      icon: <IconCheck />,
    });
    navigate({ to: "/sign-in" });
  }

  return (
    <AuthCard
      title="Redefinir password"
      subtitle="Escolha uma nova password para continuar a aceder à sua conta"
    >
      <form onSubmit={form.onSubmit(handleResetPassword)}>
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
        <Button fullWidth mt="md" type="submit">
          Redefinir password
        </Button>
      </form>
    </AuthCard>
  );
}
