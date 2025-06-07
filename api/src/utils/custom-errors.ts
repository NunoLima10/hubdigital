import createError from "@fastify/error";


export const InvalidOAuth = createError(
  "FST_AUTH_INVALID_OAUTH",
  "Erro ao recuperar as informações de autenticação Clerk. Tente novamente.",
  401
);

export const InvalidTokenError = createError(
  "FST_AUTH_TOKEN_INVALID",
  "O token fornecido é inválido ou está malformado. Por favor, faça login novamente.",
  401
);


export const UnauthorizedAccessError = createError(
  "FST_AUTH_UNAUTHORIZED_ACCESS",
  "Você não tem permissão para acessar este recurso. Verifique suas credenciais.",
  403
);

export const AccountLockedError = createError(
  "FST_ACCOUNT_LOCKED",
  "Sua conta foi temporariamente bloqueada devido a muitas tentativas de login falhas. Tente novamente mais tarde ou entre em contato com o suporte.",
  403
);

export const DatabaseError = createError(
  "FST_DB_ERROR",
  "Ocorreu um erro inesperado no banco de dados.",
  500
);

export const InternalServerError = createError(
  "FST_INTERNAL_SERVER_ERROR",
  "%s",
  500
);

export const NotFoundError = createError(
  "FST_RESOURCE_NOT_FOUND",
  "O recurso solicitado não foi encontrado. Verifique a URL ou os parâmetros da requisição.",
  404
);

export const ValidationError = createError(
  "FST_VALIDATION_ERROR",
  'Falha na validação de dados: "%s". Verifique a entrada e tente novamente.',
  400
);

export const BadRequestError = createError(
  "FST_BAD_REQUEST",
  'Requisição inválida: "%s"',
  400
);

export const ConflictError = createError("FST_CONFLICT_ERROR", "%s", 409);
