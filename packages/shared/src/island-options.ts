/**
 * The ten inhabited islands plus the diaspora. Ordered north to south the way
 * Cape Verdeans list them, not alphabetically.
 */
export const islandValues = [
  "santo_antao",
  "sao_vicente",
  "santa_luzia",
  "sao_nicolau",
  "sal",
  "boa_vista",
  "maio",
  "santiago",
  "fogo",
  "brava",
  "diaspora",
] as const;

export type Island = (typeof islandValues)[number];

export const islandLabels: Record<Island, string> = {
  santo_antao: "Santo Antão",
  sao_vicente: "São Vicente",
  santa_luzia: "Santa Luzia",
  sao_nicolau: "São Nicolau",
  sal: "Sal",
  boa_vista: "Boa Vista",
  maio: "Maio",
  santiago: "Santiago",
  fogo: "Fogo",
  brava: "Brava",
  diaspora: "Diáspora",
};
