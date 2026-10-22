import * as z from "zod";

const createEnv = () => {
  const EnvSchema = z.object({
    API_URL: z.string().optional().default("http://localhost:3001/v1"),
    // Public R2 bucket URL, matching the API's CLOUDFLARE_PUBLIC_URL. Only needed
    // to preview an image before the project is saved — once saved, the API
    // returns fully resolved URLs.
    ASSETS_URL: z.string().optional().default(""),
    // Public origin of this site, without a trailing slash. Crawlers only
    // accept absolute URLs in og:image, og:url, canonical and the sitemap.
    SITE_URL: z.string().optional().default("http://localhost:5173"),
    // Optional raster tile provider for the maps (Leaflet URL template) and its
    // attribution. Unset uses CARTO's free basemaps.
    MAP_TILE_URL: z.string().optional().default(""),
    MAP_TILE_ATTRIBUTION: z.string().optional().default(""),
  });

  const envVars = Object.entries(import.meta.env).reduce<
    Record<string, string>
  >((acc, curr) => {
    const [key, value] = curr;
    if (key.startsWith("VITE_APP_")) {
      acc[key.replace("VITE_APP_", "")] = value;
    }
    return acc;
  }, {});

  const parsedEnv = EnvSchema.safeParse(envVars);

  if (!parsedEnv.success) {
    throw new Error(
      `Invalid env provided.
The following variables are missing or invalid:
${Object.entries(parsedEnv.error.flatten().fieldErrors)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}
`
    );
  }

  return parsedEnv.data;
};

export const env = createEnv();
