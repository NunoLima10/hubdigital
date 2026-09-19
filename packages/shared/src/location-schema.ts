import { z } from "zod";
import { islandValues } from "./island-options";
import {
  abroadCountryValues,
  municipalityValues,
  zoneCodePattern,
} from "./location-options";

const capeVerdeLocationSchema = z.object({
  country: z.literal("cv"),
  island: z.enum(islandValues),
  municipality: z.enum(municipalityValues).optional(),
  zone: z
    .string()
    .regex(zoneCodePattern, "Zona inválida.")
    .optional(),
});

// Strict on purpose: an island or zone sent alongside "pt" is a client bug, and
// stripping it silently would hide that.
const abroadLocationSchema = z
  .object({ country: z.enum(abroadCountryValues) })
  .strict();

/**
 * Island is the only required level inside Cabo Verde; municipality and zone
 * refine it. Every level's code is a prefix of the next, so the levels can be
 * checked against each other without looking anything up.
 */
export const locationSchema = z
  .discriminatedUnion("country", [
    capeVerdeLocationSchema,
    abroadLocationSchema,
  ])
  .superRefine((location, ctx) => {
    if (location.country !== "cv") return;
    const { island, municipality, zone } = location;

    if (municipality && !municipality.startsWith(island)) {
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
