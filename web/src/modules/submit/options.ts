import {
  accessValues,
  audienceValues,
  businessModelValues,
  platformValues,
  pricingValues,
  projectStageValues,
} from "@hubdigital/shared";

export {
  accessValues,
  audienceValues,
  businessModelValues,
  platformValues,
  pricingValues,
  projectStageValues,
};

export const pricingLabels: Record<(typeof pricingValues)[number], string> = {
  free: "Gratuito",
  freemium: "Freemium",
  paid: "Pago",
};

export const platformLabels: Record<(typeof platformValues)[number], string> = {
  web: "Web",
  mobile: "Mobile",
  desktop: "Desktop",
  api: "API",
  other: "Outro",
};

export const businessModelLabels: Record<
  (typeof businessModelValues)[number],
  string
> = {
  b2b: "B2B",
  b2c: "B2C",
  b2g: "B2G (Governo)",
  c2c: "C2C",
  nonprofit: "Sem fins lucrativos",
};

export const accessLabels: Record<(typeof accessValues)[number], string> = {
  open_source: "Código aberto",
  closed_source: "Código fechado",
  private_beta: "Beta privado",
  public_beta: "Beta público",
};

export const projectStageLabels: Record<
  (typeof projectStageValues)[number],
  string
> = {
  idea: "Ideia",
  development: "Em desenvolvimento",
  mvp: "MVP",
  launched: "Lançado",
  growth: "Em crescimento",
  maintenance: "Manutenção",
  archived: "Arquivado",
};

export const audienceLabels: Record<(typeof audienceValues)[number], string> = {
  students: "Estudantes",
  developers: "Desenvolvedores",
  businesses: "Empresas",
  government: "Governo",
  general_public: "Público em geral",
};

function toSelectData<T extends string>(labels: Record<T, string>) {
  return Object.entries(labels).map(([value, label]) => ({
    value,
    label: label as string,
  }));
}

export const pricingOptions = toSelectData(pricingLabels);
export const platformOptions = toSelectData(platformLabels);
export const businessModelOptions = toSelectData(businessModelLabels);
export const accessOptions = toSelectData(accessLabels);
export const projectStageOptions = toSelectData(projectStageLabels);
export const audienceOptions = toSelectData(audienceLabels);
