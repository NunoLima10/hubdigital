import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type EmailSignInCredentials,
  emailSignInSchema,
} from "../../schemas/auth-schema";
import { useEmailSignIn } from "../../hooks/use-email-sign-in";
import { DEFAULT_SIGNED_IN_PATH } from "../../utils/redirect";
import { AuthCard } from "../auth-card/auth-card";
import { AuthDivider } from "../auth-divider/auth-divider";
import { GoogleSignInButton } from "../google-sign-in-button/google-sign-in-button";

type SignInFormProps = {
  /** Where to go after signing in. Also where Google sends the visitor back. */
  redirectTo?: string;
  /**
   * Replaces the navigation after an email sign-in. The modal uses it to stay
   * on the page, so whatever the visitor was doing carries on in place.
   */
  onSignedIn?: () => void;
  variant?: "page" | "dialog";
  title?: string;
  subtitle?: string;
};

export function SignInForm({
  redirectTo = DEFAULT_SIGNED_IN_PATH,
  onSignedIn,
  variant = "page",
  title = "Bem-vindo de volta!",
  subtitle = "Inicia sessão na tua conta",
}: SignInFormProps) {
  const router = useRouter();
  const form = useForm<EmailSignInCredentials>({
    resolver: zodResolver(emailSignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { emailSignIn, isPending } = useEmailSignIn({
    // A path with its own query and hash, so it goes through history as is.
    onSuccess: () => (onSignedIn ? onSignedIn() : router.history.push(redirectTo)),
    onError: (message) => {
      toast.error(message);
      form.resetField("password");
    },
  });
  // Only carry a return path that differs from the default, so plain visits to
  // the auth pages keep clean URLs.
  const redirectSearch =
    redirectTo === DEFAULT_SIGNED_IN_PATH ? {} : { redirect: redirectTo };
  return (
    <AuthCard title={title} subtitle={subtitle} variant={variant}>
      <div className="mb-4 space-y-4">
        <GoogleSignInButton redirectTo={redirectTo} />
        <AuthDivider />
      </div>
      <form
        onSubmit={form.handleSubmit((values) => emailSignIn(values))}
        className="space-y-4"
      >
        <label className="block space-y-1.5 text-sm font-medium">
          Email
          <Input type="email" autoComplete="email" required {...form.register("email")} />
          {form.formState.errors.email && (
            <span className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </span>
          )}
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Palavra-passe
          <Input
            type="password"
            autoComplete="current-password"
            required
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <span className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </span>
          )}
        </label>
        <p className="text-right text-sm">
          <Link to="/forgot-password" className="text-primary hover:underline">
            Esqueceste a palavra-passe?
          </Link>
        </p>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "A entrar..." : "Entrar"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Não tens conta?{" "}
          <Link to="/sign-up" search={redirectSearch} className="text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
