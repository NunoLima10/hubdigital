import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type ResetPasswordCredentials,
  resetPasswordSchema,
} from "../../schemas/auth-schema";
import { getAuthErrorMessage } from "../../utils/get-auth-error-message";
import { AuthCard } from "../auth-card/auth-card";

export function ResetPassword() {
  const navigate = useNavigate();
  const form = useForm<ResetPasswordCredentials>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  async function submit(credentials: ResetPasswordCredentials) {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      toast.error("O link de recuperação é inválido ou expirou.");
      return;
    }
    const { error } = await authClient.resetPassword({
      newPassword: credentials.password,
      token,
    });
    if (error?.code) {
      toast.error(
        getAuthErrorMessage(error.code) ??
          "Não foi possível redefinir a password.",
      );
      return;
    }
    toast.success("A tua password foi redefinida.");
    navigate({ to: "/sign-in" });
  }
  return (
    <AuthCard
      title="Redefinir password"
      subtitle="Escolhe uma nova password para continuar a aceder à tua conta"
    >
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
        {(
          [
            ["password", "Password"],
            ["confirmPassword", "Confirmar password"],
          ] as const
        ).map(([name, label]) => (
          <label key={name} className="block space-y-1.5 text-sm font-medium">
            {label}
            <Input type="password" required {...form.register(name)} />
            {form.formState.errors[name] && (
              <span className="text-xs text-destructive">
                {form.formState.errors[name]?.message}
              </span>
            )}
          </label>
        ))}
        <Button type="submit" className="w-full">
          Redefinir password
        </Button>
      </form>
    </AuthCard>
  );
}
