import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import {
  type EmailSignUpCredentials,
  emailSignUpSchema,
} from "../../schemas/auth-schema";
import { useEmailSignUp } from "../../hooks/use-email-sign-up";
import { AuthCard } from "../auth-card/auth-card";
import { AuthDivider } from "../auth-divider/auth-divider";
import { GoogleSignInButton } from "../google-sign-in-button/google-sign-in-button";

export function SignUpForm() {
  const navigate = useNavigate();
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const form = useForm<EmailSignUpCredentials>({
    resolver: zodResolver(emailSignUpSchema),
    defaultValues: { email: "", name: "", password: "", confirmPassword: "" },
  });
  const { emailSignUp, isPending } = useEmailSignUp({
    onSuccess: () => navigate({ to: "/dashboard/releases" }),
    onError: (message) => {
      toast.error(message);
      form.resetField("password");
      form.resetField("confirmPassword");
    },
  });
  return (
    <AuthCard
      title="Criar uma conta"
      subtitle="Regista-te para partilhar os teus projetos"
    >
      <div className="mb-4 space-y-4">
        <GoogleSignInButton disabled={!acceptedLegal} />
        <AuthDivider />
      </div>
      <form
        onSubmit={form.handleSubmit((values) => emailSignUp(values))}
        className="space-y-4"
      >
        {(
          [
            ["name", "Nome", "text"],
            ["email", "Email", "email"],
            ["password", "Palavra-passe", "password"],
            ["confirmPassword", "Confirmar palavra-passe", "password"],
          ] as const
        ).map(([name, label, type]) => (
          <label key={name} className="block space-y-1.5 text-sm font-medium">
            {label}
            <Input type={type} required {...form.register(name)} />
            {form.formState.errors[name] && (
              <span className="text-xs text-destructive">
                {form.formState.errors[name]?.message}
              </span>
            )}
          </label>
        ))}
        <label className="flex items-start gap-3 rounded-md border p-3 text-sm leading-5">
          <input
            type="checkbox"
            required
            checked={acceptedLegal}
            onChange={(event) => setAcceptedLegal(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
          />
          <span>
            Li e aceito os{" "}
            <Link to="/termos" target="_blank" className="font-medium text-primary underline underline-offset-4">
              Termos de utilização
            </Link>{" "}
            e a{" "}
            <Link to="/privacidade" target="_blank" className="font-medium text-primary underline underline-offset-4">
              Política de Privacidade
            </Link>
            . Confirmo que tenho pelo menos 16 anos ou autorização do meu representante legal.
          </span>
        </label>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "A criar..." : "Criar conta"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Já tens conta?{" "}
          <Link to="/sign-in" className="text-primary hover:underline">
            Iniciar sessão
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
