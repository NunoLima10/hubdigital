import { DB } from "@/db";
import { appSettings } from "@/db/schemas";
import { errorLogger } from "@/utils/error-logger";
import { inArray } from "drizzle-orm";
import { z } from "zod";

/**
 * Every runtime-configurable flag, with the value used when its row is absent.
 * The defaults reproduce the behaviour the platform had before settings
 * existed, so an empty `app_settings` table changes nothing.
 */
export const settingDefinitions = {
  "moderation.review_required": {
    schema: z.boolean(),
    fallback: false as boolean,
  },
  "moderation.auto_approve_trusted": {
    schema: z.boolean(),
    fallback: true as boolean,
  },
  "submissions.open": {
    schema: z.boolean(),
    fallback: true as boolean,
  },
  "announcement.text": {
    schema: z.string().max(280).nullable(),
    fallback: null as string | null,
  },
} as const;

export type SettingKey = keyof typeof settingDefinitions;

export type Settings = {
  [K in SettingKey]: (typeof settingDefinitions)[K]["fallback"];
};

export const settingKeys = Object.keys(settingDefinitions) as SettingKey[];

/** The subset a logged-out visitor is allowed to read. */
export const publicSettingKeys = [
  "submissions.open",
  "announcement.text",
] as const satisfies readonly SettingKey[];

function defaults(): Settings {
  return Object.fromEntries(
    settingKeys.map((key) => [key, settingDefinitions[key].fallback])
  ) as Settings;
}

/**
 * Settings are read on nearly every publish and written a handful of times a
 * year, so they are cached in the process. The write path clears the cache; the
 * TTL is only a backstop so a second API instance converges without a restart.
 */
const CACHE_TTL_MS = 60_000;

let cache: { value: Settings; expiresAt: number } | null = null;

export function invalidateSettingsCache() {
  cache = null;
}

async function readAll(db: DB): Promise<Settings> {
  const rows = await db
    .select()
    .from(appSettings)
    .where(inArray(appSettings.key, settingKeys));

  const settings = defaults();

  for (const row of rows) {
    const definition = settingDefinitions[row.key as SettingKey];
    if (!definition) continue;

    // A row whose value no longer matches its schema (hand-edited, or left over
    // from an older shape) is ignored in favour of the default rather than
    // taking the API down.
    const parsed = definition.schema.safeParse(row.value);
    if (parsed.success) {
      (settings as Record<string, unknown>)[row.key] = parsed.data;
    }
  }

  return settings;
}

async function getSettings(db: DB): Promise<Settings> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;

  const value = await readAll(db);
  cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };

  return value;
}

async function getSetting<K extends SettingKey>(
  db: DB,
  key: K
): Promise<Settings[K]> {
  const settings = await getSettings(db);
  return settings[key];
}

/** Only the keys present in `patch` are touched. */
async function updateSettings(
  db: DB,
  patch: Partial<Settings>,
  updatedBy: string
) {
  const entries = Object.entries(patch).filter(([key]) =>
    settingKeys.includes(key as SettingKey)
  );

  if (entries.length === 0) return getSettings(db);

  const now = new Date().toISOString();

  for (const [key, value] of entries) {
    await db
      .insert(appSettings)
      .values({ key, value: value ?? null, updatedBy, updatedAt: now })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: value ?? null, updatedBy, updatedAt: now },
      });
  }

  invalidateSettingsCache();

  return getSettings(db);
}

export const SettingsService = {
  getSettings: errorLogger(getSettings, "settingsService.getSettings"),
  getSetting: errorLogger(getSetting, "settingsService.getSetting"),
  updateSettings: errorLogger(updateSettings, "settingsService.updateSettings"),
};
