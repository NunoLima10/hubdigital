import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import {
  type EmailSignUpCredentials,
  emailSignUpSchema,
} from "../../schemas/auth-schema";
import { useEmailSignUp } from "../../hooks/use-email-sign-up";
import { AuthCard } from "../auth-card/auth-card";
import { GoogleSignInButton } from "../google-sign-in-button/google-sign-in-button";

const LEGAL_ERROR = "Aceita os Termos de utilização e a Política de Privacidade para continuar.";

export function SignUpForm({
  signInRedirect,
}: {
  /** Return path the "Iniciar sessão" link hands back to /sign-in. */
  signInRedirect?: string;
}) {
  const navigate = useNavigate();
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [googleLegalError, setGoogleLegalError] = useState(false);
  const [emailLegalError, setEmailLegalError] = useState(false);
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
      <div className="space-y-4">
        <div className="space-y-1.5">
          <GoogleSignInButton
            canProceed={() => {
              setGoogleLegalError(!acceptedLegal);
              return acceptedLegal;
            }}
          />
          {googleLegalError && !acceptedLegal && (
            <p role="alert" className="text-xs text-destructive">
              {LEGAL_ERROR}
            </p>
          )}
        </div>

        <details className="group rounded-md border">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            Ou cria conta com email e palavra-passe
            <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <form
            onSubmit={(event) => {
              if (!acceptedLegal) {
                event.preventDefault();
                setEmailLegalError(true);
                return;
              }
              return form.handleSubmit((values) => emailSignUp(values))(event);
            }}
            className="space-y-4 border-t p-3"
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
                {type === "password" ? (
                  <PasswordInput required {...form.register(name)} />
                ) : (
                  <Input type={type} required {...form.register(name)} />
                )}
                {form.formState.errors[name] && (
                  <span className="text-xs text-destructive">
                    {form.formState.errors[name]?.message}
                  </span>
                )}
              </label>
            ))}
            <div className="space-y-1.5">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "A criar..." : "Criar conta"}
              </Button>
              {emailLegalError && !acceptedLegal && (
                <p role="alert" className="text-xs text-destructive">
                  {LEGAL_ERROR}
                </p>
              )}
            </div>
          </form>
        </details>

        <label
          className={cn(
            "flex items-start gap-3 rounded-md border p-3 text-sm leading-5 transition-colors",
            (googleLegalError || emailLegalError) && !acceptedLegal && "border-destructive",
          )}
        >
          <input
            type="checkbox"
            checked={acceptedLegal}
            aria-invalid={(googleLegalError || emailLegalError) && !acceptedLegal}
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
            .
          </span>
        </label>

        <p className="text-center text-sm text-muted-foreground">
          Já tens conta?{" "}
          <Link
            to="/sign-in"
            search={signInRedirect ? { redirect: signInRedirect } : {}}
            className="text-primary hover:underline"
          >
            Iniciar sessão
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
