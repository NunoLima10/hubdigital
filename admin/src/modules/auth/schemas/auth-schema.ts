import { z } from "zod";

export const emailSignInSchema = z.object({
  email: z.string().email("Insira um email válido"),
  password: z
    .string()
    .min(8, "A palavra-passe deve conter pelo menos 8 caracteres"),
});

export type EmailSignInCredentials = z.infer<typeof emailSignInSchema>;
