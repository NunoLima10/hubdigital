import { z } from "zod";
import { islandValues } from "./island-options";
import { abroadCountryValues, municipalityValues, zoneCodePattern } from "./location-options";

export const publicPinSchema = z
  .object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    precision: z.enum(["approximate", "exact"]),
  })
  .strict()
  .transform((pin) =>
    pin.precision === "approximate"
      ? {
          ...pin,
          latitude: Math.round(pin.latitude * 10) / 10,
          longitude: Math.round(pin.longitude * 10) / 10,
        }
      : pin,
  );
const placeFields = {
  locality: z.string().trim().max(120).optional(),
  publicPin: publicPinSchema.nullish(),
};
const capeVerdeLocationSchema = z.object({
  ...placeFields,
  country: z.literal("cv"),
  island: z.enum(islandValues).optional(),
  municipality: z.enum(municipalityValues).optional(),
  zone: z.string().regex(zoneCodePattern, "Zona inválida.").optional(),
});

// Strict on purpose: an island or zone sent alongside "pt" is a client bug, and
// stripping it silently would hide that.
const abroadLocationSchema = z
  .object({ country: z.enum(abroadCountryValues), ...placeFields })
  .strict();

/** A builder may save the country before choosing an island. */
export const draftLocationSchema = z
  .discriminatedUnion("country", [
    capeVerdeLocationSchema.extend({ island: z.enum(islandValues).optional() }),
    abroadLocationSchema,
  ])
  .superRefine((location, ctx) => {
    if (location.country !== "cv") return;
    if (!location.island) {
      if (location.municipality || location.zone)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["island"],
          message: "Escolhe a ilha antes do concelho.",
        });
      return;
    }
    const result = locationSchema.safeParse(location);
    if (!result.success) result.error.issues.forEach((issue) => ctx.addIssue(issue));
  });

export type DraftProjectLocation = z.infer<typeof draftLocationSchema>;

/**
 * A country-only answer is valid. Optional island, municipality and zone
 * must form a consistent hierarchy.
 */
export const locationSchema = z
  .discriminatedUnion("country", [capeVerdeLocationSchema, abroadLocationSchema])
  .superRefine((location, ctx) => {
    if (location.country !== "cv") return;
    const { island, municipality, zone } = location;

    if (municipality && (!island || !municipality.startsWith(island))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["municipality"],
        message: "O concelho não pertence à ilha escolhida.",
      });
    }

    if (zone && !municipality) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["municipality"],
        message: "Escolha o concelho antes da zona.",
      });
    } else if (zone && municipality && !zone.startsWith(municipality)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["zone"],
        message: "A zona não pertence ao concelho escolhido.",
      });
    }
  });

// Not `Location`: that would shadow the DOM global in the web app.
export type ProjectLocation = z.infer<typeof locationSchema>;

export const localConnectionValues = [
  "based_in_cv",
  "diaspora",
  "serves_cv",
  "serves_diaspora",
  "other",
] as const;
export const localConnectionLabels = {
  based_in_cv: "Base em Cabo Verde",
  diaspora: "Base na diáspora",
  serves_cv: "Serve Cabo Verde",
  serves_diaspora: "Serve a diáspora",
  other: "Outra ligação",
} as const;
export const serviceAreaSchema = z
  .object({
    scope: z.enum(["countries", "worldwide"]),
    countries: z
      .array(z.enum(["cv", ...abroadCountryValues]))
      .max(249)
      .default([]),
  })
  .superRefine((area, ctx) => {
    if (area.scope === "countries" && !area.countries.length)
      ctx.addIssue({ code: "custom", path: ["countries"], message: "Escolhe pelo menos um país." });
    if (new Set(area.countries).size !== area.countries.length)
      ctx.addIssue({ code: "custom", path: ["countries"], message: "Escolhe países diferentes." });
    if (area.scope === "worldwide" && area.countries.length)
      ctx.addIssue({
        code: "custom",
        path: ["countries"],
        message: "A disponibilidade mundial já inclui todos os países.",
      });
  });
export const projectGeographyFields = {
  additionalLocations: z.array(locationSchema).max(4).default([]),
  teamMode: z.enum(["local", "distributed"]).nullish(),
  localConnections: z
    .array(z.enum(localConnectionValues))
    .max(5)
    .refine((values) => new Set(values).size === values.length)
    .default([]),
  serviceArea: serviceAreaSchema.nullish(),
};

export const projectMapRecordSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  shortDescription: z.string(),
  logoUrl: z.string().nullable(),
  location: locationSchema.nullable(),
  additionalLocations: z.array(locationSchema),
  teamMode: z.enum(["local", "distributed"]).nullable(),
});
export type ProjectMapRecord = z.infer<typeof projectMapRecordSchema>;
