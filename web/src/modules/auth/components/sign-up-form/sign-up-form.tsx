import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type EmailSignUpCredentials,
  emailSignUpSchema,
} from "../../schemas/auth-schema";
import { useEmailSignUp } from "../../hooks/use-email-sign-up";
import { AuthCard } from "../auth-card/auth-card";

export function SignUpForm() {
  const navigate = useNavigate();
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
      <form
        onSubmit={form.handleSubmit((values) => emailSignUp(values))}
        className="space-y-4"
      >
        {(
          [
            ["name", "Nome", "text"],
            ["email", "Email", "email"],
            ["password", "Password", "password"],
            ["confirmPassword", "Confirmar password", "password"],
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
