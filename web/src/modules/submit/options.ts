import {
  availabilityValues, sourceModelValues, audienceValues, businessModelValues, countryLabels, countryValues,
  islandLabels, islandValues, municipalitiesOf, municipalityLabels, platformValues, pricingValues, projectStageValues,
} from "@hubdigital/shared";
export { availabilityValues, sourceModelValues, audienceValues, businessModelValues, countryLabels, countryValues,
  islandLabels, islandValues, municipalitiesOf, municipalityLabels, platformValues, pricingValues, projectStageValues };
export const pricingLabels: Record<(typeof pricingValues)[number], string> = {
  free: "Gratuito", freemium: "Plano gratuito e opções pagas", paid: "Pago", contact_for_quote: "Sob consulta",
  not_decided: "Por decidir", not_applicable: "Não se aplica",
};
export const platformLabels: Record<(typeof platformValues)[number], string> = {
  web: "Web", android: "Android", ios: "iOS", desktop: "Desktop", api: "API", cli: "Linha de comandos",
  library: "Biblioteca", browser_extension: "Extensão do navegador", hardware: "Hardware / IoT", other: "Outro",
};
export const businessModelLabels: Record<(typeof businessModelValues)[number], string> = {
  b2b: "B2B (empresas)", b2c: "B2C (consumidores)", b2g: "B2G (governo e entidades públicas)", c2c: "C2C (entre consumidores)",
};
export const availabilityLabels: Record<(typeof availabilityValues)[number], string> = {
  not_available: "Ainda não é possível experimentar", waitlist: "Lista de espera", invite_only: "Acesso por convite",
  public_beta: "Beta público", available: "Disponível", unavailable: "Indisponível neste momento",
};
export const sourceModelLabels: Record<(typeof sourceModelValues)[number], string> = {
  open_source: "Código aberto", source_available: "Código visível com restrições", proprietary: "Código proprietário",
  not_applicable: "Não se aplica", not_disclosed: "Não divulgado",
};
export const projectStageLabels: Record<(typeof projectStageValues)[number], string> = {
  idea: "Ideia", building: "Em construção", prototype: "Protótipo", live: "Em funcionamento", paused: "Em pausa", discontinued: "Descontinuado",
};
export const audienceLabels: Record<(typeof audienceValues)[number], string> = {
  students: "Estudantes", developers: "Programadores", businesses: "Empresas", government: "Entidades públicas", general_public: "Público em geral",
};
function toSelectData<T extends string>(labels: Record<T, string>) {
  return Object.entries(labels).map(([value, label]) => ({ value, label: label as string }));
}
export const pricingOptions = toSelectData(pricingLabels);
export const platformOptions = toSelectData(platformLabels);
export const businessModelOptions = toSelectData(businessModelLabels);
export const availabilityOptions = toSelectData(availabilityLabels);
export const sourceModelOptions = toSelectData(sourceModelLabels);
export const projectStageOptions = toSelectData(projectStageLabels);
export const audienceOptions = toSelectData(audienceLabels);
export const islandOptions = toSelectData(islandLabels);
export const countryOptions = toSelectData(countryLabels);
export function municipalityOptionsOf(island: (typeof islandValues)[number]) {
  return municipalitiesOf(island).map((code) => ({ value: code, label: municipalityLabels[code] }));
}
