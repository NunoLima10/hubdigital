import { primaryProjectLink } from "@hubdigital/shared";
import type { CreateProjectInput } from "../types/project";

export type QualityCriterion = {
  label: string;
  description: string;
  complete: boolean;
  step: number;
  required: boolean;
};

export function getSubmissionQuality(values: CreateProjectInput, hasLogo: boolean) {
  const doesNotNeedPrimaryLink = ["not_available", "unavailable"].includes(
    values.availability,
  );
  const textDescription = (values.description ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const criteria: QualityCriterion[] = [
    {
      label: "Nome e descrição curta",
      description: "Explica o projeto de forma clara numa frase.",
      complete: values.name.trim().length >= 2 && values.shortDescription.trim().length >= 10,
      step: 0,
      required: true,
    },
    {
      label: "Fase e disponibilidade",
      description: "Diz o que já existe e como pode ser experimentado.",
      complete: Boolean(values.projectStage && values.availability),
      step: 0,
      required: true,
    },
    {
      label: "Destino principal",
      description: "Escolhe o link que as pessoas devem abrir primeiro.",
      complete: doesNotNeedPrimaryLink || Boolean(primaryProjectLink(values.links)),
      step: 0,
      required: true,
    },
    {
      label: "Categoria principal",
      description: "Ajuda a comunidade a encontrar o projeto.",
      complete: typeof values.categoryId === "number",
      step: 1,
      required: true,
    },
    {
      label: "Uso de IA",
      description: "Partilha de forma transparente como a IA participou.",
      complete: Boolean(values.aiInvolvement),
      step: 3,
      required: true,
    },
    {
      label: "Logo do projeto",
      description: "Facilita reconhecer o projeto na lista e no mapa.",
      complete: hasLogo,
      step: 0,
      required: false,
    },
    {
      label: "Imagem ou vídeo de demonstração",
      description: "Mostra o produto em uso antes de pedir um clique.",
      complete: values.galleryImageKeys.length > 0 || Boolean(values.youtubeVideoUrl),
      step: 0,
      required: false,
    },
    {
      label: "Descrição detalhada",
      description: "Conta o problema, a solução e para quem foi criada.",
      complete: textDescription.length >= 80,
      step: 0,
      required: false,
    },
    {
      label: "Pedido à comunidade",
      description: "Indica se procuras feedback, testes, parceiros ou ajuda.",
      complete: values.helpWanted.length > 0 || Boolean(values.helpDescription.trim()),
      step: 1,
      required: false,
    },
  ];
  const required = criteria.filter((item) => item.required);
  const recommended = criteria.filter((item) => !item.required);
  const completedRequired = required.filter((item) => item.complete).length;
  const completedRecommended = recommended.filter((item) => item.complete).length;
  const weighted =
    (completedRequired / required.length) * 6 +
    (completedRecommended / recommended.length) * 4;
  const score = Math.max(0, Math.min(10, Math.round(weighted)));
  const nextImprovement = criteria.find((item) => !item.complete) ?? null;

  return {
    score,
    label:
      score === 10
        ? "Muito completo"
        : score >= 7
          ? "Quase pronto"
          : score >= 4
            ? "Bom começo"
            : score > 0
              ? "Base por completar"
              : "Por começar",
    nextImprovement,
    required,
    recommended,
    completedRequired,
  };
}
