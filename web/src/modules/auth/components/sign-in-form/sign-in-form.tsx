import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type EmailSignInCredentials,
  emailSignInSchema,
} from "../../schemas/auth-schema";
import { useEmailSignIn } from "../../hooks/use-email-sign-in";
import { AuthCard } from "../auth-card/auth-card";
import { AuthDivider } from "../auth-divider/auth-divider";
import { GoogleSignInButton } from "../google-sign-in-button/google-sign-in-button";

export function SignInForm() {
  const navigate = useNavigate();
  const form = useForm<EmailSignInCredentials>({
    resolver: zodResolver(emailSignInSchema),
    defaultValues: {
      email: "demo.publisher@hubdigital.cv",
      password: "demo1234",
    },
  });
  const { emailSignIn, isPending } = useEmailSignIn({
    onSuccess: () => navigate({ to: "/dashboard/releases" }),
    onError: (message) => {
      toast.error(message);
      form.resetField("password");
    },
  });
  return (
    <AuthCard title="Bem-vindo de volta!" subtitle="Inicia sessão na tua conta">
      <div className="mb-4 space-y-4">
        <GoogleSignInButton />
        <AuthDivider />
      </div>
      <form
        onSubmit={form.handleSubmit((values) => emailSignIn(values))}
        className="space-y-4"
      >
        <label className="block space-y-1.5 text-sm font-medium">
          Email
          <Input type="email" required {...form.register("email")} />
          {form.formState.errors.email && (
            <span className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </span>
          )}
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Password
          <Input type="password" required {...form.register("password")} />
          {form.formState.errors.password && (
            <span className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </span>
          )}
        </label>
        <p className="text-right text-sm">
          <Link to="/forgot-password" className="text-primary hover:underline">
            Esqueceste a password?
          </Link>
        </p>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "A entrar..." : "Entrar"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Não tens conta?{" "}
          <Link to="/sign-up" className="text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
