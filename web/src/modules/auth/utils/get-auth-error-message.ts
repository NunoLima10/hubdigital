// Maps better-auth error codes to user-facing messages. Mirrors the helper
// used in the source dashboard, trimmed to the codes the email/password flow
// can actually return here.
const errorCodes = {
  USER_ALREADY_EXISTS: {
    en: "User already registered",
    pt: "Este email já está registado",
  },
  INVALID_EMAIL_OR_PASSWORD: {
    en: "Invalid email or password",
    pt: "Email ou password inválidos",
  },
  USER_NOT_FOUND: {
    en: "User not found",
    pt: "Utilizador não encontrado",
  },
  INVALID_TOKEN: {
    en: "Invalid token",
    pt: "O link de recuperação é inválido ou expirou",
  },
  PASSWORD_TOO_SHORT: {
    en: "Password too short",
    pt: "A password é demasiado curta",
  },
} as const;

export function getAuthErrorMessage(
  code: string,
  lang: "en" | "pt" = "pt"
): string | null {
  if (code in errorCodes) {
    return errorCodes[code as keyof typeof errorCodes][lang];
  }
  return null;
}
