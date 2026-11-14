import { describe, expect, it } from "vitest";
import { countryValues, locationSchema, publicPinSchema, serviceAreaSchema } from "@hubdigital/shared";
describe("project geography",()=>{
 it("supports all 249 ISO countries and a country-only Cabo Verde base",()=>{expect(countryValues).toHaveLength(249);expect(locationSchema.safeParse({country:"cv"}).success).toBe(true);expect(locationSchema.safeParse({country:"jp",locality:"Tokyo"}).success).toBe(true);});
 it("preserves zero coordinates, exact precision and rounds approximate coordinates",()=>{expect(publicPinSchema.parse({latitude:0,longitude:0,precision:"exact"})).toEqual({latitude:0,longitude:0,precision:"exact"});expect(publicPinSchema.parse({latitude:-23.5567,longitude:46.789,precision:"approximate"})).toEqual({latitude:-23.6,longitude:46.8,precision:"approximate"});});
 it("rejects inconsistent regions and service areas",()=>{expect(locationSchema.safeParse({country:"cv",municipality:"CV774"}).success).toBe(false);expect(serviceAreaSchema.safeParse({scope:"countries",countries:[]}).success).toBe(false);expect(serviceAreaSchema.safeParse({scope:"worldwide",countries:["cv"]}).success).toBe(false);});
});
