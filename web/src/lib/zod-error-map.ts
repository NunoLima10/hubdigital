import { z } from "zod";

const ptErrorMap: z.ZodErrorMap = (issue) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.input === undefined || issue.input === null) {
        return { message: "Este campo é obrigatório" };
      }
      return { message: "Valor inválido" };
    case z.ZodIssueCode.too_small:
      if (issue.origin === "string") {
        return {
          message: `Deve ter pelo menos ${issue.minimum} caracteres`,
        };
      }
      if (issue.origin === "array") {
        return {
          message: issue.minimum === 1 ? "Escolhe pelo menos uma opção" : `Escolhe pelo menos ${issue.minimum} opções`,
        };
      }
      return { message: `Deve ser maior ou igual a ${issue.minimum}` };
    case z.ZodIssueCode.too_big:
      if (issue.origin === "string") {
        return { message: `Deve ter no máximo ${issue.maximum} caracteres` };
      }
      return { message: `Deve ser menor ou igual a ${issue.maximum}` };
    case z.ZodIssueCode.invalid_format:
      if (issue.format === "url") {
        return { message: "Indica um URL válido" };
      }
      return { message: "Formato inválido" };
    case z.ZodIssueCode.invalid_value:
      return { message: "Escolhe uma opção válida" };
    default:
      return undefined;
  }
};

z.setErrorMap(ptErrorMap);
