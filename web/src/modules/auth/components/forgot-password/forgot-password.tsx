import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import {
  type ForgotPasswordCredentials,
  forgotPasswordSchema,
} from "../../schemas/auth-schema";
import { AuthCard } from "../auth-card/auth-card";

export function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const form = useForm<ForgotPasswordCredentials>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  async function submit(credentials: ForgotPasswordCredentials) {
    await authClient.requestPasswordReset({
      email: credentials.email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    toast.success("Se o email existir, receberás um link de recuperação.");
    setSent(true);
  }
  return (
    <AuthCard
      title="Recuperar password"
      subtitle="Insere o teu email para receber um link de recuperação"
    >
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
        <label className="block space-y-1.5 text-sm font-medium">
          Email
          <Input
            type="email"
            required
            placeholder="voce@email.com"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <span className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </span>
          )}
        </label>
        <Button type="submit" className="w-full" disabled={sent}>
          Enviar link de recuperação
        </Button>
        <p className="text-center text-sm">
          <Link to="/sign-in" className="text-primary hover:underline">
            Voltar ao início de sessão
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
