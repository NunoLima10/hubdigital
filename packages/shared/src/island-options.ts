/**
 * The nine inhabited islands, keyed by their public location code (the same
 * codes the cv-location dataset uses), ordered north to south the way Cape
 * Verdeans list them. Every municipality and zone code starts with the code of
 * the island it belongs to, so these are the roots of the whole hierarchy.
 * Santa Luzia is left out: it is uninhabited and has no entry in that dataset.
 */
export const islandValues = [
  "CV1",
  "CV2",
  "CV3",
  "CV4",
  "CV5",
  "CV6",
  "CV7",
  "CV8",
  "CV9",
] as const;

export type Island = (typeof islandValues)[number];

export const islandLabels: Record<Island, string> = {
  CV1: "Santo Antão",
  CV2: "São Vicente",
  CV3: "São Nicolau",
  CV4: "Sal",
  CV5: "Boa Vista",
  CV6: "Maio",
  CV7: "Santiago",
  CV8: "Fogo",
  CV9: "Brava",
};
