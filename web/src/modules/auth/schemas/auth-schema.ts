import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Insira um email válido"),
  name: z.string().min(1, "O nome é obrigatório"),
  password: z.string().min(8, "A password deve conter pelo menos 8 caracteres"),
  confirmPassword: z
    .string()
    .min(8, "A password deve conter pelo menos 8 caracteres"),
});

export const emailSignInSchema = authSchema.pick({
  email: true,
  password: true,
});

export const emailSignUpSchema = authSchema.refine(
  (data) => data.password === data.confirmPassword,
  { message: "As passwords não coincidem", path: ["confirmPassword"] }
);

export const forgotPasswordSchema = authSchema.pick({
  email: true,
});

export const resetPasswordSchema = authSchema
  .pick({
    password: true,
    confirmPassword: true,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As passwords não coincidem",
    path: ["confirmPassword"],
  });

export type EmailSignInCredentials = z.infer<typeof emailSignInSchema>;
export type EmailSignUpCredentials = z.infer<typeof emailSignUpSchema>;
export type ForgotPasswordCredentials = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordCredentials = z.infer<typeof resetPasswordSchema>;
