import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { getAuthErrorMessage } from "@/modules/auth/utils/get-auth-error-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useHasPassword } from "../../hooks/use-account";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Indica a password atual"),
    newPassword: z.string().min(8, "A password deve conter pelo menos 8 caracteres").max(128),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "As passwords não coincidem",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof passwordSchema>;

const fields = [
  ["currentPassword", "Password atual", "current-password"],
  ["newPassword", "Nova password", "new-password"],
  ["confirmPassword", "Confirmar nova password", "new-password"],
] as const;

export function PasswordForm() {
  const { data: hasPassword, isLoading } = useHasPassword();
  const [isPending, setIsPending] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function submit(values: Values) {
    setIsPending(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        // A changed password should lock out whoever may have had the old one.
        revokeOtherSessions: true,
      });
      if (error) {
        form.setError("currentPassword", {
          message:
            error.code === "INVALID_PASSWORD"
              ? "A password atual não está correta"
              : ((error.code && getAuthErrorMessage(error.code)) ??
                "Não foi possível mudar a password"),
        });
        return;
      }
      form.reset();
      toast.success("Password alterada. As outras sessões foram terminadas.");
    } catch {
      toast.error("Não foi possível contactar o servidor. Tenta de novo.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold">Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasPassword === false
            ? "Entras com o Google, por isso esta conta não tem password no Hub Digital."
            : "Ao mudares a password, terminas a sessão nos outros dispositivos."}
        </p>
      </div>
      {!isLoading && hasPassword !== false && (
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
          {fields.map(([name, label, autoComplete]) => (
            <label key={name} className="block space-y-1.5 text-sm font-medium">
              {label}
              <Input type="password" autoComplete={autoComplete} {...form.register(name)} />
              {form.formState.errors[name]?.message && (
                <span className="text-xs text-destructive">
                  {form.formState.errors[name]?.message}
                </span>
              )}
            </label>
          ))}
          <Button type="submit" disabled={isPending}>
            {isPending ? "A guardar..." : "Mudar password"}
          </Button>
        </form>
      )}
    </div>
  );
}
