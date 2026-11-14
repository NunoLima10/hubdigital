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
          message: `Selecione pelo menos ${issue.minimum} opção(ões)`,
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
        return { message: "Informe um URL válido" };
      }
      return { message: "Formato inválido" };
    case z.ZodIssueCode.invalid_value:
      return { message: "Selecione uma opção válida" };
    default:
      return undefined;
  }
};

z.setErrorMap(ptErrorMap);
