import type { Island } from "./island-options";

/**
 * Where a project is based. Cabo Verde gets the full island > municipality >
 * zone breakdown; the diaspora countries where most Cabo Verdeans live are a
 * single pick, with "other" as the catch-all. Values are lowercase ISO 3166-1
 * alpha-2 codes, so adding a country later is one line here. Ordered by size of
 * the community (roughly), "other" last, so it can feed a select as-is.
 */
export const abroadCountryValues = [
  "pt",
  "us",
  "fr",
  "nl",
  "lu",
  "it",
  "br",
  "es",
  "other",
] as const;

export const countryValues = ["cv", ...abroadCountryValues] as const;

export type Country = (typeof countryValues)[number];
export type AbroadCountry = (typeof abroadCountryValues)[number];

export const countryLabels: Record<Country, string> = {
  cv: "Cabo Verde",
  pt: "Portugal",
  us: "Estados Unidos",
  fr: "França",
  nl: "Países Baixos",
  lu: "Luxemburgo",
  it: "Itália",
  br: "Brasil",
  es: "Espanha",
  other: "Outros",
};

/**
 * The 22 municipalities (concelhos), keyed by their public location code. The
 * code starts with the code of the island it sits on, so no separate parent
 * field is needed — see `municipalitiesOf`.
 */
export const municipalityValues = [
  "CV111",
  "CV112",
  "CV113",
  "CV221",
  "CV331",
  "CV332",
  "CV441",
  "CV551",
  "CV661",
  "CV771",
  "CV772",
  "CV773",
  "CV774",
  "CV775",
  "CV776",
  "CV777",
  "CV778",
  "CV779",
  "CV881",
  "CV882",
  "CV883",
  "CV991",
] as const;

export type MunicipalityCode = (typeof municipalityValues)[number];

export const municipalityLabels: Record<MunicipalityCode, string> = {
  CV111: "Ribeira Grande",
  CV112: "Paul",
  CV113: "Porto Novo",
  CV221: "São Vicente",
  CV331: "Ribeira Brava",
  CV332: "Tarrafal de São Nicolau",
  CV441: "Sal",
  CV551: "Boa Vista",
  CV661: "Maio",
  CV771: "Tarrafal",
  CV772: "Santa Catarina",
  CV773: "Santa Cruz",
  CV774: "Praia",
  CV775: "São Domingos",
  CV776: "São Miguel",
  CV777: "São Salvador do Mundo",
  CV778: "São Lourenço dos Órgãos",
  CV779: "Ribeira Grande de Santiago",
  CV881: "Mosteiros",
  CV882: "São Filipe",
  CV883: "Santa Catarina do Fogo",
  CV991: "Brava",
};

/** The municipalities of one island, in code order. Feeds the dependent select. */
export function municipalitiesOf(island: Island): MunicipalityCode[] {
  return municipalityValues.filter((code) => code.startsWith(island));
}

/**
 * A zone (level 5) code: `CV` plus 11 digits. There are ~440 zones and the set
 * changes more often than the islands, so only the shape lives here; resolving a
 * code to a name is the location service's job.
 */
export const zoneCodePattern = /^CV\d{11}$/;
