import { z } from "zod";

const ptErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === "undefined" || issue.received === "null") {
        return { message: "Este campo é obrigatório" };
      }
      return { message: "Valor inválido" };
    case z.ZodIssueCode.too_small:
      if (issue.type === "string") {
        return {
          message: `Deve ter pelo menos ${issue.minimum} caracteres`,
        };
      }
      if (issue.type === "array") {
        return {
          message: issue.minimum === 1 ? "Escolhe pelo menos uma opção" : `Escolhe pelo menos ${issue.minimum} opções`,
        };
      }
      return { message: `Deve ser maior ou igual a ${issue.minimum}` };
    case z.ZodIssueCode.too_big:
      if (issue.type === "string") {
        return { message: `Deve ter no máximo ${issue.maximum} caracteres` };
      }
      return { message: `Deve ser menor ou igual a ${issue.maximum}` };
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "url") {
        return { message: "Indica um URL válido" };
      }
      return { message: "Formato inválido" };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: "Escolhe uma opção válida" };
    default:
      return { message: ctx.defaultError };
  }
};

z.setErrorMap(ptErrorMap);
