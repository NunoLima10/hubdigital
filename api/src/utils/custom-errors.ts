import createError from "@fastify/error";

export const InvalidOAuth = createError(
  "FST_AUTH_INVALID_OAUTH",
  "Falha ao recuperar as informações de autenticação. Tente novamente.",
  401
);

export const InvalidTokenError = createError(
  "FST_AUTH_TOKEN_INVALID",
  "O token fornecido é inválido ou está malformado. Faça login novamente.",
  401
);

export const ExpiredTokenError = createError(
  "FST_AUTH_TOKEN_EXPIRED",
  "O token expirou. Faça login novamente para continuar.",
  401
);

export const UnauthorizedAccessError = createError(
  "FST_AUTH_UNAUTHORIZED_ACCESS",
  "Autenticação necessária. Forneça credenciais válidas e tente novamente.",
  401
);

export const ForbiddenError = createError(
  "FST_AUTH_FORBIDDEN",
  "Você não possui permissão para acessar este recurso.",
  403
);

export const PublisherRequiredError = createError(
  "FST_PUBLISHER_REQUIRED",
  "Conclua o seu perfil de publicador antes de submeter um projeto.",
  403
);

export const AccountLockedError = createError(
  "FST_ACCOUNT_LOCKED",
  "Sua conta foi temporariamente bloqueada por excesso de tentativas. Tente novamente mais tarde.",
  423
);

export const DatabaseError = createError(
  "FST_DB_ERROR",
  "Ocorreu um erro inesperado ao acessar o banco de dados.",
  500
);

export const NotFoundError = createError(
  "FST_RESOURCE_NOT_FOUND",
  "O recurso solicitado não foi encontrado. Verifique a URL ou os parâmetros.",
  404
);

export const ValidationError = createError(
  "FST_VALIDATION_ERROR",
  'Falha na validação dos dados: "%s". Revise a entrada e tente novamente.',
  400
);

export const BadRequestError = createError(
  "FST_BAD_REQUEST",
  'Requisição inválida: "%s".',
  400
);

export const UnprocessableEntityError = createError(
  "FST_UNPROCESSABLE_ENTITY",
  'Não foi possível processar esta requisição: "%s".',
  422
);

export const ConflictError = createError(
  "FST_CONFLICT_ERROR",
  "%s",
  409
);

export const RateLimitExceededError = createError(
  "FST_RATE_LIMIT_EXCEEDED",
  "Limite de requisições atingido. Aguarde %s antes de tentar novamente.",
  429
);

export const ServiceUnavailableError = createError(
  "FST_SERVICE_UNAVAILABLE",
  "Serviço temporariamente indisponível. Tente novamente em instantes.",
  503
);

export const InternalServerError = createError(
  "FST_INTERNAL_SERVER_ERROR",
  "%s",
  500
);
