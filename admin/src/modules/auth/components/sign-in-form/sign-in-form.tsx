import {
  Alert,
  Badge,
  Button,
  PasswordInput,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertTriangle, IconLock } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { zodResolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import {
  type EmailSignInCredentials,
  emailSignInSchema,
} from "../../schemas/auth-schema";
import { useEmailSignIn } from "../../hooks/use-email-sign-in";
import { AuthCard } from "../auth-card/auth-card";

export function SignInForm() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { emailSignIn, isPending } = useEmailSignIn({
    onSuccess() {
      navigate({ to: "/" });
    },
    onError(message) {
      setError(message);
      form.resetField("password");
    },
  });

  const form = useForm<EmailSignInCredentials>({
    // Prefilled with the dev-only demo admin account seeded by the API
    // (api/src/db/seeds/users/demo-admin.ts) for quick local access.
    initialValues: {
      email: "demo.admin@hubdigital.cv",
      password: "demo1234",
    },
    validate: zodResolver(emailSignInSchema),
  });

  function handleSubmit(values: EmailSignInCredentials) {
    setError(null);
    emailSignIn(values);
  }

  return (
    <AuthCard
      title="HubDigital"
      subtitle="Acesso restrito à equipa."
      badge={
        <Badge color="red" variant="light">
          ADMIN
        </Badge>
      }
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        {error && (
          <Alert
            color="red"
            variant="light"
            mb="md"
            icon={<IconAlertTriangle size={18} />}
          >
            {error}
          </Alert>
        )}

        <TextInput
          label="Email"
          required
          autoComplete="username"
          placeholder="admin@hubdigital.cv"
          {...form.getInputProps("email")}
          key={form.key("email")}
        />

        <PasswordInput
          label="Palavra-passe"
          required
          mt="md"
          autoComplete="current-password"
          {...form.getInputProps("password")}
          key={form.key("password")}
        />

        <Button
          loading={isPending}
          fullWidth
          mt="md"
          type="submit"
          leftSection={<IconLock size={16} />}
        >
          Entrar
        </Button>

        <Text ta="center" c="dimmed" size="xs" mt="md">
          Não existe registo nesta aplicação. As contas são criadas pela equipa.
        </Text>
      </form>
    </AuthCard>
  );
}
